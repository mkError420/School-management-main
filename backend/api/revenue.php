<?php

$db = Database::getInstance();

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'GET') {
    Response::methodNotAllowed();
}

$user = AuthMiddleware::requireAnyRole(['admin', 'super_admin']);

$action = $_GET['action'] ?? 'summary';
$targetYear = isset($_GET['year']) ? intval($_GET['year']) : intval(date('Y'));
$startDate = $_GET['start_date'] ?? null;
$endDate = $_GET['end_date'] ?? null;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;

try {
    switch ($action) {
        case 'summary':
        case 'chart':
        case 'breakdown':
        default:
            $data = calculateRevenueMetrics($db, $targetYear, $startDate, $endDate, $limit);
            Response::success('Revenue analytics data retrieved successfully', $data);
            break;

        case 'transactions':
            $transactions = getUnifiedTransactions($db, $targetYear, $startDate, $endDate, $limit);
            Response::success('Revenue transactions retrieved successfully', $transactions);
            break;
    }
} catch (Exception $e) {
    Response::serverError($e->getMessage());
}

function calculateRevenueMetrics($db, $targetYear, $startDate = null, $endDate = null, $limit = 50) {
    // 1. Calculate Fees (Income)
    $feeWhereYear = "YEAR(payment_date) = ?";
    $feeParams = [$targetYear];

    $invoiceWhereYear = "YEAR(COALESCE(updated_at, created_at, due_date)) = ?";
    $invoiceParams = [$targetYear];

    $expWhereYear = "YEAR(COALESCE(paid_date, expense_date)) = ?";
    $expParams = [$targetYear];

    if ($startDate && $endDate) {
        $feeWhereYear = "payment_date >= ? AND payment_date <= ?";
        $feeParams = [$startDate, $endDate];

        $invoiceWhereYear = "COALESCE(updated_at, created_at, due_date) >= ? AND COALESCE(updated_at, created_at, due_date) <= ?";
        $invoiceParams = [$startDate, $endDate];

        $expWhereYear = "COALESCE(paid_date, expense_date) >= ? AND COALESCE(paid_date, expense_date) <= ?";
        $expParams = [$startDate, $endDate];
    }

    // Fee Invoiced totals
    $invoicedStats = [
        'total_billed' => 0.0,
        'total_collected' => 0.0,
        'total_due' => 0.0,
        'invoices_count' => 0
    ];
    try {
        $invRow = $db->fetchOne(
            "SELECT 
                COUNT(*) as invoices_count,
                COALESCE(SUM(amount - discount), 0) as total_billed,
                COALESCE(SUM(paid_amount), 0) as total_collected,
                COALESCE(SUM(GREATEST(0, (amount - discount) - paid_amount)), 0) as total_due
             FROM fee_invoices 
             WHERE $invoiceWhereYear",
            $invoiceParams
        );
        if ($invRow) {
            $invoicedStats['total_billed'] = (float)($invRow['total_billed'] ?? 0);
            $invoicedStats['total_collected'] = (float)($invRow['total_collected'] ?? 0);
            $invoicedStats['total_due'] = (float)($invRow['total_due'] ?? 0);
            $invoicedStats['invoices_count'] = (int)($invRow['invoices_count'] ?? 0);
        }
    } catch (Exception $e) {}

    // Fee Payments (Actual Inflow)
    $actualIncome = 0.0;
    $paymentsCount = 0;
    try {
        $payRow = $db->fetchOne(
            "SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total_paid
             FROM fee_payments 
             WHERE $feeWhereYear",
            $feeParams
        );
        if ($payRow && (float)$payRow['total_paid'] > 0) {
            $actualIncome = (float)$payRow['total_paid'];
            $paymentsCount = (int)$payRow['cnt'];
        } else {
            // Fallback to invoiced paid amount if payments table empty
            $actualIncome = $invoicedStats['total_collected'];
        }
    } catch (Exception $e) {
        $actualIncome = $invoicedStats['total_collected'];
    }

    // 2. Expenses (Actual Outflow)
    $expenseStats = [
        'total_expense' => 0.0,
        'paid_expense' => 0.0,
        'pending_expense' => 0.0,
        'approved_expense' => 0.0,
        'expenses_count' => 0
    ];
    try {
        $expRow = $db->fetchOne(
            "SELECT 
                COUNT(*) as expenses_count,
                COALESCE(SUM(CASE WHEN status != 'REJECTED' THEN amount ELSE 0 END), 0) as total_expense,
                COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as paid_expense,
                COALESCE(SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END), 0) as pending_expense,
                COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN amount ELSE 0 END), 0) as approved_expense
             FROM expenses 
             WHERE $expWhereYear",
            $expParams
        );
        if ($expRow) {
            $expenseStats['total_expense'] = (float)($expRow['total_expense'] ?? 0);
            $expenseStats['paid_expense'] = (float)($expRow['paid_expense'] ?? 0);
            $expenseStats['pending_expense'] = (float)($expRow['pending_expense'] ?? 0);
            $expenseStats['approved_expense'] = (float)($expRow['approved_expense'] ?? 0);
            $expenseStats['expenses_count'] = (int)($expRow['expenses_count'] ?? 0);
        }
    } catch (Exception $e) {}

    // Net calculations
    $totalIncome = round($actualIncome, 2);
    $totalExpense = round($expenseStats['total_expense'], 2);
    $paidExpense = round($expenseStats['paid_expense'], 2);
    $netRevenue = round($totalIncome - $totalExpense, 2);
    $profitMargin = $totalIncome > 0 ? round(($netRevenue / $totalIncome) * 100, 2) : 0;
    $collectionRate = $invoicedStats['total_billed'] > 0 
        ? round(($totalIncome / $invoicedStats['total_billed']) * 100, 2) 
        : 100.0;

    // 3. Monthly Chart Data (for 12 months)
    $monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    $monthlyData = [];
    for ($m = 1; $m <= 12; $m++) {
        $monthlyData[$m] = [
            'name' => $monthNames[$m - 1],
            'month' => $m,
            'income' => 0.0,
            'expense' => 0.0,
            'net' => 0.0,
            'margin' => 0.0
        ];
    }

    try {
        $pMonthly = $db->fetchAll(
            "SELECT MONTH(payment_date) as m, COALESCE(SUM(amount), 0) as total 
             FROM fee_payments 
             WHERE YEAR(payment_date) = ? 
             GROUP BY MONTH(payment_date)",
            [$targetYear]
        );
        $hasPayments = false;
        foreach ($pMonthly as $p) {
            $m = (int)$p['m'];
            if ($m >= 1 && $m <= 12) {
                $monthlyData[$m]['income'] += (float)$p['total'];
                if ((float)$p['total'] > 0) $hasPayments = true;
            }
        }

        if (!$hasPayments) {
            $invMonthly = $db->fetchAll(
                "SELECT MONTH(COALESCE(updated_at, created_at, due_date)) as m, COALESCE(SUM(paid_amount), 0) as total 
                 FROM fee_invoices 
                 WHERE paid_amount > 0 AND YEAR(COALESCE(updated_at, created_at, due_date)) = ?
                 GROUP BY MONTH(COALESCE(updated_at, created_at, due_date))",
                [$targetYear]
            );
            foreach ($invMonthly as $inv) {
                $m = (int)$inv['m'];
                if ($m >= 1 && $m <= 12) {
                    $monthlyData[$m]['income'] += (float)$inv['total'];
                }
            }
        }
    } catch (Exception $e) {}

    try {
        $expMonthly = $db->fetchAll(
            "SELECT MONTH(COALESCE(paid_date, expense_date)) as m, COALESCE(SUM(amount), 0) as total 
             FROM expenses 
             WHERE status != 'REJECTED' AND YEAR(COALESCE(paid_date, expense_date)) = ? 
             GROUP BY MONTH(COALESCE(paid_date, expense_date))",
            [$targetYear]
        );
        foreach ($expMonthly as $exp) {
            $m = (int)$exp['m'];
            if ($m >= 1 && $m <= 12) {
                $monthlyData[$m]['expense'] += (float)$exp['total'];
            }
        }
    } catch (Exception $e) {}

    $chart = [];
    for ($m = 1; $m <= 12; $m++) {
        $inc = round($monthlyData[$m]['income'], 2);
        $exp = round($monthlyData[$m]['expense'], 2);
        $net = round($inc - $exp, 2);
        $margin = $inc > 0 ? round(($net / $inc) * 100, 1) : 0;
        $chart[] = [
            'name' => $monthlyData[$m]['name'],
            'month' => $m,
            'income' => $inc,
            'expense' => $exp,
            'net' => $net,
            'margin' => $margin
        ];
    }

    // 4. Breakdown by Fee Category (Income streams)
    $feeCategoriesBreakdown = [];
    try {
        $rows = $db->fetchAll(
            "SELECT 
                fc.id as category_id,
                fc.name as category_name,
                fc.code as category_code,
                COUNT(fi.id) as invoice_count,
                COALESCE(SUM(fi.paid_amount), 0) as total_income,
                COALESCE(SUM(fi.amount - fi.discount), 0) as total_billed
             FROM fee_categories fc
             LEFT JOIN fee_invoices fi ON fc.id = fi.fee_category_id AND $invoiceWhereYear
             GROUP BY fc.id, fc.name, fc.code
             ORDER BY total_income DESC",
            $invoiceParams
        );
        foreach ($rows as $r) {
            $amt = (float)$r['total_income'];
            $pct = $totalIncome > 0 ? round(($amt / $totalIncome) * 100, 1) : 0;
            $feeCategoriesBreakdown[] = [
                'id' => (int)$r['category_id'],
                'name' => $r['category_name'],
                'code' => $r['category_code'],
                'amount' => $amt,
                'billed' => (float)$r['total_billed'],
                'count' => (int)$r['invoice_count'],
                'percentage' => $pct
            ];
        }
    } catch (Exception $e) {}

    // 5. Breakdown by Expense Category (Expenditure streams)
    $expenseCategoriesBreakdown = [];
    try {
        $rows = $db->fetchAll(
            "SELECT 
                category,
                COUNT(*) as count,
                COALESCE(SUM(amount), 0) as total_amount
             FROM expenses
             WHERE status != 'REJECTED' AND $expWhereYear
             GROUP BY category
             ORDER BY total_amount DESC",
            $expParams
        );
        $categoryLabels = [
            'SALARY' => 'Staff Salaries',
            'UTILITIES' => 'Utilities (Electric, Water, Gas)',
            'MAINTENANCE' => 'Building Maintenance',
            'SUPPLIES' => 'Office & School Supplies',
            'TRANSPORT' => 'Transportation',
            'MARKETING' => 'Marketing & Promotion',
            'EVENTS' => 'Events & Activities',
            'OTHER' => 'Other Expenses'
        ];
        foreach ($rows as $r) {
            $amt = (float)$r['total_amount'];
            $pct = $totalExpense > 0 ? round(($amt / $totalExpense) * 100, 1) : 0;
            $expenseCategoriesBreakdown[] = [
                'category' => $r['category'],
                'name' => $categoryLabels[$r['category']] ?? $r['category'],
                'amount' => $amt,
                'count' => (int)$r['count'],
                'percentage' => $pct
            ];
        }
    } catch (Exception $e) {}

    // 6. Available Years
    $yearsSet = [(int)date('Y')];
    try {
        $pYears = $db->fetchAll("SELECT DISTINCT YEAR(payment_date) as y FROM fee_payments WHERE payment_date IS NOT NULL");
        foreach ($pYears as $row) { if (!empty($row['y'])) $yearsSet[] = (int)$row['y']; }
    } catch (Exception $e) {}
    try {
        $iYears = $db->fetchAll("SELECT DISTINCT YEAR(created_at) as y FROM fee_invoices WHERE created_at IS NOT NULL");
        foreach ($iYears as $row) { if (!empty($row['y'])) $yearsSet[] = (int)$row['y']; }
    } catch (Exception $e) {}
    try {
        $eYears = $db->fetchAll("SELECT DISTINCT YEAR(COALESCE(paid_date, expense_date)) as y FROM expenses WHERE COALESCE(paid_date, expense_date) IS NOT NULL");
        foreach ($eYears as $row) { if (!empty($row['y'])) $yearsSet[] = (int)$row['y']; }
    } catch (Exception $e) {}

    $availableYears = array_values(array_unique($yearsSet));
    rsort($availableYears);

    // 7. Unified Transactions (Recent 20)
    $recentTransactions = getUnifiedTransactions($db, $targetYear, $startDate, $endDate, 20);

    return [
        'year' => $targetYear,
        'start_date' => $startDate,
        'end_date' => $endDate,
        'available_years' => $availableYears,
        'summary' => [
            'total_income' => $totalIncome,
            'total_billed' => round($invoicedStats['total_billed'], 2),
            'total_pending_fees' => round($invoicedStats['total_due'], 2),
            'collection_rate' => $collectionRate,
            'total_expenses' => $totalExpense,
            'paid_expenses' => $paidExpense,
            'pending_expenses' => round($expenseStats['pending_expense'], 2),
            'approved_expenses' => round($expenseStats['approved_expense'], 2),
            'net_revenue' => $netRevenue,
            'profit_margin' => $profitMargin,
            'status' => $netRevenue >= 0 ? 'surplus' : 'deficit',
            'payments_count' => $paymentsCount,
            'expenses_count' => $expenseStats['expenses_count']
        ],
        'chart' => $chart,
        'fee_categories' => $feeCategoriesBreakdown,
        'expense_categories' => $expenseCategoriesBreakdown,
        'recent_transactions' => $recentTransactions
    ];
}

function getUnifiedTransactions($db, $targetYear, $startDate = null, $endDate = null, $limit = 50) {
    $transactions = [];

    // Payments / Income
    try {
        $paySql = "SELECT 
                    fp.id,
                    fp.receipt_no as ref_no,
                    fp.amount,
                    fp.payment_method,
                    fp.payment_date as trans_date,
                    fp.notes,
                    'INCOME' as trans_type,
                    COALESCE(fi.title, 'Fee Payment') as title,
                    COALESCE(fc.name, 'Student Fee') as category_name,
                    CONCAT(COALESCE(s.name, ''), ' ', COALESCE(s.surname, '')) as party_name
                   FROM fee_payments fp
                   LEFT JOIN fee_invoices fi ON fp.invoice_id = fi.id
                   LEFT JOIN fee_categories fc ON fi.fee_category_id = fc.id
                   LEFT JOIN students s ON fp.student_id = s.id";

        $payParams = [];
        if ($startDate && $endDate) {
            $paySql .= " WHERE fp.payment_date >= ? AND fp.payment_date <= ?";
            $payParams = [$startDate, $endDate];
        } elseif ($targetYear) {
            $paySql .= " WHERE YEAR(fp.payment_date) = ?";
            $payParams = [$targetYear];
        }
        $paySql .= " ORDER BY fp.payment_date DESC LIMIT " . intval($limit);

        $payRows = $db->fetchAll($paySql, $payParams);
        foreach ($payRows as $r) {
            $transactions[] = [
                'id' => 'inc_' . $r['id'],
                'type' => 'INCOME',
                'title' => $r['title'],
                'ref_no' => $r['ref_no'] ?? ('REC-' . $r['id']),
                'category' => $r['category_name'],
                'amount' => (float)$r['amount'],
                'date' => $r['trans_date'] ?? date('Y-m-d'),
                'payment_method' => $r['payment_method'] ?? 'CASH',
                'party' => trim($r['party_name']) ?: 'Student',
                'status' => 'PAID',
                'notes' => $r['notes'] ?? ''
            ];
        }
    } catch (Exception $e) {}

    // Expenses
    try {
        $expSql = "SELECT 
                    e.id,
                    e.expense_no as ref_no,
                    e.title,
                    e.category,
                    e.amount,
                    e.status,
                    e.payment_method,
                    e.vendor as party_name,
                    COALESCE(e.paid_date, e.expense_date) as trans_date,
                    e.notes
                   FROM expenses e
                   WHERE e.status != 'REJECTED'";

        $expParams = [];
        if ($startDate && $endDate) {
            $expSql .= " AND COALESCE(e.paid_date, e.expense_date) >= ? AND COALESCE(e.paid_date, e.expense_date) <= ?";
            $expParams = [$startDate, $endDate];
        } elseif ($targetYear) {
            $expSql .= " AND YEAR(COALESCE(e.paid_date, e.expense_date)) = ?";
            $expParams = [$targetYear];
        }
        $expSql .= " ORDER BY COALESCE(e.paid_date, e.expense_date) DESC LIMIT " . intval($limit);

        $expRows = $db->fetchAll($expSql, $expParams);
        foreach ($expRows as $r) {
            $transactions[] = [
                'id' => 'exp_' . $r['id'],
                'type' => 'EXPENSE',
                'title' => $r['title'],
                'ref_no' => $r['ref_no'] ?? ('EXP-' . $r['id']),
                'category' => $r['category'],
                'amount' => (float)$r['amount'],
                'date' => $r['trans_date'] ?? date('Y-m-d'),
                'payment_method' => $r['payment_method'] ?? 'CASH',
                'party' => $r['party_name'] ?: 'Vendor / Payee',
                'status' => $r['status'],
                'notes' => $r['notes'] ?? ''
            ];
        }
    } catch (Exception $e) {}

    // Sort unified list descending by date
    usort($transactions, function ($a, $b) {
        return strcmp($b['date'], $a['date']);
    });

    return array_slice($transactions, 0, $limit);
}
