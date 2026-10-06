<?php

$db = Database::getInstance();

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'GET') {
    Response::methodNotAllowed();
}

$user = AuthMiddleware::requireAnyRole(['admin', 'super_admin']);

$action = $_GET['action'] ?? 'summary';
$targetYear = isset($_GET['year']) ? intval($_GET['year']) : intval(date('Y'));
$period = $_GET['period'] ?? 'year';
$startDate = $_GET['start_date'] ?? null;
$endDate = $_GET['end_date'] ?? null;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;

// Resolve period presets if start_date / end_date not explicitly provided
if (!$startDate || !$endDate) {
    if ($period === 'this_month') {
        $startDate = date('Y-m-01');
        $endDate = date('Y-m-t');
    } elseif ($period === 'last_month') {
        $startDate = date('Y-m-01', strtotime('first day of last month'));
        $endDate = date('Y-m-t', strtotime('last day of last month'));
    } elseif ($period === 'quarter') {
        $currentMonth = intval(date('n'));
        $qStartMonth = floor(($currentMonth - 1) / 3) * 3 + 1;
        $startDate = sprintf('%s-%02d-01', date('Y'), $qStartMonth);
        $endDate = date('Y-m-t', strtotime(sprintf('%s-%02d-01', date('Y'), $qStartMonth + 2)));
    }
}

try {
    switch ($action) {
        case 'summary':
        case 'chart':
        case 'breakdown':
        default:
            $data = calculateRevenueMetrics($db, $targetYear, $startDate, $endDate, $limit, $period);
            Response::success('Revenue analytics data retrieved successfully', $data);
            break;

        case 'transactions':
            $transactions = getUnifiedTransactions($db, $targetYear, $startDate, $endDate, $limit, $period);
            Response::success('Revenue transactions retrieved successfully', $transactions);
            break;
    }
} catch (Exception $e) {
    Response::serverError($e->getMessage());
}

function calculateRevenueMetrics($db, $targetYear, $startDate = null, $endDate = null, $limit = 100, $period = 'year') {
    // Build SQL date/year filters
    $feeWhere = "1=1";
    $feeParams = [];

    $invoiceWhere = "1=1";
    $invoiceParams = [];

    $expWhere = "1=1";
    $expParams = [];

    if ($startDate && $endDate) {
        $feeWhere = "DATE(payment_date) >= ? AND DATE(payment_date) <= ?";
        $feeParams = [$startDate, $endDate];

        $invoiceWhere = "DATE(COALESCE(due_date, created_at)) >= ? AND DATE(COALESCE(due_date, created_at)) <= ?";
        $invoiceParams = [$startDate, $endDate];

        $expWhere = "DATE(COALESCE(paid_date, expense_date, created_at)) >= ? AND DATE(COALESCE(paid_date, expense_date, created_at)) <= ?";
        $expParams = [$startDate, $endDate];
    } elseif ($period === 'all') {
        // No date filters applied for "all"
    } else {
        // By target year (default)
        $yearToFilter = $targetYear ?: intval(date('Y'));
        $feeWhere = "YEAR(payment_date) = ?";
        $feeParams = [$yearToFilter];

        $invoiceWhere = "YEAR(COALESCE(due_date, created_at)) = ?";
        $invoiceParams = [$yearToFilter];

        $expWhere = "YEAR(COALESCE(paid_date, expense_date, created_at)) = ?";
        $expParams = [$yearToFilter];
    }

    // 1. Fee Invoiced totals (Billed, Paid, and Due from fee_invoices)
    $invoicedStats = [
        'total_billed' => 0.0,
        'total_collected' => 0.0,
        'total_due' => 0.0,
        'invoices_count' => 0,
        'paid_invoices_count' => 0
    ];

    try {
        $invRow = $db->fetchOne(
            "SELECT 
                COUNT(*) as invoices_count,
                COALESCE(SUM(amount - discount), 0) as total_billed,
                COALESCE(SUM(paid_amount), 0) as total_collected,
                COALESCE(SUM(GREATEST(0, (amount - discount) - paid_amount)), 0) as total_due,
                COALESCE(SUM(CASE WHEN paid_amount > 0 THEN 1 ELSE 0 END), 0) as paid_invoices_count
             FROM fee_invoices 
             WHERE $invoiceWhere",
            $invoiceParams
        );
        if ($invRow) {
            $invoicedStats['total_billed'] = (float)($invRow['total_billed'] ?? 0);
            $invoicedStats['total_collected'] = (float)($invRow['total_collected'] ?? 0);
            $invoicedStats['total_due'] = (float)($invRow['total_due'] ?? 0);
            $invoicedStats['invoices_count'] = (int)($invRow['invoices_count'] ?? 0);
            $invoicedStats['paid_invoices_count'] = (int)($invRow['paid_invoices_count'] ?? 0);
        }
    } catch (Exception $e) {
        error_log("Error querying fee invoices: " . $e->getMessage());
    }

    // Fee Payments (Actual Recorded Payment Receipts)
    $paymentsTotal = 0.0;
    $paymentsCount = 0;
    try {
        $payRow = $db->fetchOne(
            "SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total_paid
             FROM fee_payments 
             WHERE $feeWhere",
            $feeParams
        );
        if ($payRow) {
            $paymentsTotal = (float)($payRow['total_paid'] ?? 0);
            $paymentsCount = (int)($payRow['cnt'] ?? 0);
        }
    } catch (Exception $e) {
        error_log("Error querying fee payments: " . $e->getMessage());
    }

    // Accurate Collected Fee Income:
    // Take the maximum of logged payment receipts and invoiced paid_amounts to ensure full accounting
    $actualIncome = max($paymentsTotal, $invoicedStats['total_collected']);
    $finalPaymentsCount = max($paymentsCount, $invoicedStats['paid_invoices_count']);

    // 2. Expenses (Operational Outflow)
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
             WHERE $expWhere",
            $expParams
        );
        if ($expRow) {
            $expenseStats['total_expense'] = (float)($expRow['total_expense'] ?? 0);
            $expenseStats['paid_expense'] = (float)($expRow['paid_expense'] ?? 0);
            $expenseStats['pending_expense'] = (float)($expRow['pending_expense'] ?? 0);
            $expenseStats['approved_expense'] = (float)($expRow['approved_expense'] ?? 0);
            $expenseStats['expenses_count'] = (int)($expRow['expenses_count'] ?? 0);
        }
    } catch (Exception $e) {
        error_log("Error querying expenses: " . $e->getMessage());
    }

    // Net financial calculations
    $totalIncome = round($actualIncome, 2);
    $totalExpense = round($expenseStats['total_expense'], 2);
    $paidExpense = round($expenseStats['paid_expense'], 2);
    $netRevenue = round($totalIncome - $totalExpense, 2);
    $profitMargin = $totalIncome > 0 ? round(($netRevenue / $totalIncome) * 100, 1) : 0.0;
    $collectionRate = $invoicedStats['total_billed'] > 0 
        ? min(100.0, round(($totalIncome / $invoicedStats['total_billed']) * 100, 1)) 
        : 100.0;

    // 3. Monthly Chart Data (12 Months of targetYear)
    $chartYear = ($period === 'all' || !$targetYear) ? intval(date('Y')) : $targetYear;
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

    // Monthly Fee Income: Combine fee_payments + standalone paid invoices
    try {
        $pMonthly = $db->fetchAll(
            "SELECT MONTH(payment_date) as m, COALESCE(SUM(amount), 0) as total 
             FROM fee_payments 
             WHERE YEAR(payment_date) = ? 
             GROUP BY MONTH(payment_date)",
            [$chartYear]
        );
        foreach ($pMonthly as $p) {
            $m = (int)$p['m'];
            if ($m >= 1 && $m <= 12) {
                $monthlyData[$m]['income'] += (float)$p['total'];
            }
        }

        // Add any paid invoices that were not logged in fee_payments to avoid undercounting
        $invMonthly = $db->fetchAll(
            "SELECT MONTH(COALESCE(due_date, created_at)) as m, COALESCE(SUM(paid_amount), 0) as total 
             FROM fee_invoices 
             WHERE paid_amount > 0 
               AND YEAR(COALESCE(due_date, created_at)) = ?
               AND id NOT IN (SELECT DISTINCT invoice_id FROM fee_payments WHERE invoice_id IS NOT NULL)
             GROUP BY MONTH(COALESCE(due_date, created_at))",
            [$chartYear]
        );
        foreach ($invMonthly as $inv) {
            $m = (int)$inv['m'];
            if ($m >= 1 && $m <= 12) {
                $monthlyData[$m]['income'] += (float)$inv['total'];
            }
        }
    } catch (Exception $e) {
        error_log("Error in monthly income calculation: " . $e->getMessage());
    }

    // Monthly Expenses
    try {
        $expMonthly = $db->fetchAll(
            "SELECT MONTH(COALESCE(paid_date, expense_date, created_at)) as m, COALESCE(SUM(amount), 0) as total 
             FROM expenses 
             WHERE status != 'REJECTED' AND YEAR(COALESCE(paid_date, expense_date, created_at)) = ? 
             GROUP BY MONTH(COALESCE(paid_date, expense_date, created_at))",
            [$chartYear]
        );
        foreach ($expMonthly as $exp) {
            $m = (int)$exp['m'];
            if ($m >= 1 && $m <= 12) {
                $monthlyData[$m]['expense'] += (float)$exp['total'];
            }
        }
    } catch (Exception $e) {
        error_log("Error in monthly expense calculation: " . $e->getMessage());
    }

    $chart = [];
    for ($m = 1; $m <= 12; $m++) {
        $inc = round($monthlyData[$m]['income'], 2);
        $exp = round($monthlyData[$m]['expense'], 2);
        $net = round($inc - $exp, 2);
        $margin = $inc > 0 ? round(($net / $inc) * 100, 1) : 0.0;
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
        // Construct prefix-safe join condition for fi (fee_invoices)
        $fiJoinWhere = $invoiceWhere;
        $fiJoinWhere = str_replace(
            ['COALESCE(due_date, created_at)', 'due_date', 'created_at'],
            ['COALESCE(fi.due_date, fi.created_at)', 'fi.due_date', 'fi.created_at'],
            $fiJoinWhere
        );

        $catRows = $db->fetchAll(
            "SELECT 
                fc.id as category_id,
                fc.name as category_name,
                fc.code as category_code,
                fc.default_amount,
                COUNT(fi.id) as invoice_count,
                COALESCE(SUM(fi.paid_amount), 0) as total_income,
                COALESCE(SUM(fi.amount - fi.discount), 0) as total_billed
             FROM fee_categories fc
             LEFT JOIN fee_invoices fi ON fc.id = fi.fee_category_id AND $fiJoinWhere
             GROUP BY fc.id, fc.name, fc.code, fc.default_amount
             ORDER BY total_income DESC, total_billed DESC",
            $invoiceParams
        );
        foreach ($catRows as $r) {
            $amt = (float)$r['total_income'];
            $pct = $totalIncome > 0 ? round(($amt / $totalIncome) * 100, 1) : 0.0;
            $feeCategoriesBreakdown[] = [
                'id' => (int)$r['category_id'],
                'name' => $r['category_name'],
                'code' => $r['category_code'],
                'default_amount' => (float)$r['default_amount'],
                'amount' => $amt,
                'billed' => (float)$r['total_billed'],
                'count' => (int)$r['invoice_count'],
                'percentage' => $pct
            ];
        }
    } catch (Exception $e) {
        error_log("Error querying fee categories breakdown: " . $e->getMessage());
    }

    // 5. Breakdown by Expense Category
    $expenseCategoriesBreakdown = [];
    try {
        $expRows = $db->fetchAll(
            "SELECT 
                category,
                COUNT(*) as count,
                COALESCE(SUM(amount), 0) as total_amount
             FROM expenses
             WHERE status != 'REJECTED' AND $expWhere
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
        foreach ($expRows as $r) {
            $amt = (float)$r['total_amount'];
            $pct = $totalExpense > 0 ? round(($amt / $totalExpense) * 100, 1) : 0.0;
            $expenseCategoriesBreakdown[] = [
                'category' => $r['category'],
                'name' => $categoryLabels[$r['category']] ?? $r['category'],
                'amount' => $amt,
                'count' => (int)$r['count'],
                'percentage' => $pct
            ];
        }
    } catch (Exception $e) {
        error_log("Error querying expenses breakdown: " . $e->getMessage());
    }

    // 6. Available Years Discovery
    $yearsSet = [(int)date('Y')];
    try {
        $pYears = $db->fetchAll("SELECT DISTINCT YEAR(payment_date) as y FROM fee_payments WHERE payment_date IS NOT NULL");
        foreach ($pYears as $row) { if (!empty($row['y'])) $yearsSet[] = (int)$row['y']; }
    } catch (Exception $e) {}
    try {
        $iYears = $db->fetchAll("SELECT DISTINCT YEAR(COALESCE(due_date, created_at)) as y FROM fee_invoices WHERE created_at IS NOT NULL");
        foreach ($iYears as $row) { if (!empty($row['y'])) $yearsSet[] = (int)$row['y']; }
    } catch (Exception $e) {}
    try {
        $eYears = $db->fetchAll("SELECT DISTINCT YEAR(COALESCE(paid_date, expense_date, created_at)) as y FROM expenses WHERE expense_date IS NOT NULL");
        foreach ($eYears as $row) { if (!empty($row['y'])) $yearsSet[] = (int)$row['y']; }
    } catch (Exception $e) {}

    $availableYears = array_values(array_unique($yearsSet));
    rsort($availableYears);

    // 7. Recent Unified Transactions
    $recentTransactions = getUnifiedTransactions($db, $targetYear, $startDate, $endDate, 25, $period);

    return [
        'year' => $targetYear,
        'period' => $period,
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
            'payments_count' => $finalPaymentsCount,
            'expenses_count' => $expenseStats['expenses_count']
        ],
        'chart' => $chart,
        'fee_categories' => $feeCategoriesBreakdown,
        'expense_categories' => $expenseCategoriesBreakdown,
        'recent_transactions' => $recentTransactions
    ];
}

function getUnifiedTransactions($db, $targetYear, $startDate = null, $endDate = null, $limit = 100, $period = 'year') {
    $transactions = [];

    // Date filters for transactions
    $pWhere = "1=1";
    $pParams = [];
    $eWhere = "e.status != 'REJECTED'";
    $eParams = [];
    $invWhere = "fi.paid_amount > 0";
    $invParams = [];

    if ($startDate && $endDate) {
        $pWhere = "DATE(fp.payment_date) >= ? AND DATE(fp.payment_date) <= ?";
        $pParams = [$startDate, $endDate];

        $invWhere .= " AND DATE(COALESCE(fi.due_date, fi.created_at)) >= ? AND DATE(COALESCE(fi.due_date, fi.created_at)) <= ?";
        $invParams = [$startDate, $endDate];

        $eWhere .= " AND DATE(COALESCE(e.paid_date, e.expense_date, e.created_at)) >= ? AND DATE(COALESCE(e.paid_date, e.expense_date, e.created_at)) <= ?";
        $eParams = [$startDate, $endDate];
    } elseif ($period === 'all') {
        // No date filters
    } else {
        $yearToFilter = $targetYear ?: intval(date('Y'));
        $pWhere = "YEAR(fp.payment_date) = ?";
        $pParams = [$yearToFilter];

        $invWhere .= " AND YEAR(COALESCE(fi.due_date, fi.created_at)) = ?";
        $invParams = [$yearToFilter];

        $eWhere .= " AND YEAR(COALESCE(e.paid_date, e.expense_date, e.created_at)) = ?";
        $eParams = [$yearToFilter];
    }

    // 1. Fee Payments
    try {
        $paySql = "SELECT 
                    fp.id,
                    fp.receipt_no as ref_no,
                    fp.amount,
                    fp.payment_method,
                    fp.payment_date as trans_date,
                    fp.notes,
                    'INCOME' as trans_type,
                    COALESCE(fi.title, 'Student Fee Payment') as title,
                    COALESCE(fc.name, 'Fee Collection') as category_name,
                    CONCAT(COALESCE(s.name, ''), ' ', COALESCE(s.surname, '')) as party_name
                   FROM fee_payments fp
                   LEFT JOIN fee_invoices fi ON fp.invoice_id = fi.id
                   LEFT JOIN fee_categories fc ON fi.fee_category_id = fc.id
                   LEFT JOIN students s ON fp.student_id = s.id
                   WHERE $pWhere
                   ORDER BY fp.payment_date DESC LIMIT " . intval($limit);

        $payRows = $db->fetchAll($paySql, $pParams);
        foreach ($payRows as $r) {
            $transactions[] = [
                'id' => 'fee_' . $r['id'],
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
    } catch (Exception $e) {
        error_log("Error in transaction fee_payments query: " . $e->getMessage());
    }

    // 2. Standalone Paid Invoices (not in fee_payments)
    try {
        $invSql = "SELECT 
                    fi.id,
                    fi.invoice_no as ref_no,
                    fi.paid_amount as amount,
                    fi.status,
                    COALESCE(fi.due_date, fi.created_at) as trans_date,
                    fi.notes,
                    'INCOME' as trans_type,
                    COALESCE(fi.title, 'Student Fee Invoice') as title,
                    COALESCE(fc.name, 'Tuition / Fees') as category_name,
                    CONCAT(COALESCE(s.name, ''), ' ', COALESCE(s.surname, '')) as party_name
                   FROM fee_invoices fi
                   LEFT JOIN fee_categories fc ON fi.fee_category_id = fc.id
                   LEFT JOIN students s ON fi.student_id = s.id
                   WHERE $invWhere
                     AND fi.id NOT IN (SELECT DISTINCT invoice_id FROM fee_payments WHERE invoice_id IS NOT NULL)
                   ORDER BY COALESCE(fi.due_date, fi.created_at) DESC LIMIT " . intval($limit);

        $invRows = $db->fetchAll($invSql, $invParams);
        foreach ($invRows as $r) {
            $transactions[] = [
                'id' => 'inv_' . $r['id'],
                'type' => 'INCOME',
                'title' => $r['title'],
                'ref_no' => $r['ref_no'] ?? ('INV-' . $r['id']),
                'category' => $r['category_name'],
                'amount' => (float)$r['amount'],
                'date' => substr($r['trans_date'] ?? date('Y-m-d'), 0, 10),
                'payment_method' => 'CASH',
                'party' => trim($r['party_name']) ?: 'Student',
                'status' => $r['status'] ?? 'PAID',
                'notes' => $r['notes'] ?? ''
            ];
        }
    } catch (Exception $e) {
        error_log("Error in transaction fee_invoices query: " . $e->getMessage());
    }

    // 3. Operational Expenses
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
                    COALESCE(e.paid_date, e.expense_date, e.created_at) as trans_date,
                    e.notes
                   FROM expenses e
                   WHERE $eWhere
                   ORDER BY COALESCE(e.paid_date, e.expense_date, e.created_at) DESC LIMIT " . intval($limit);

        $expRows = $db->fetchAll($expSql, $eParams);
        foreach ($expRows as $r) {
            $transactions[] = [
                'id' => 'exp_' . $r['id'],
                'type' => 'EXPENSE',
                'title' => $r['title'],
                'ref_no' => $r['ref_no'] ?? ('EXP-' . $r['id']),
                'category' => $r['category'],
                'amount' => (float)$r['amount'],
                'date' => substr($r['trans_date'] ?? date('Y-m-d'), 0, 10),
                'payment_method' => $r['payment_method'] ?? 'CASH',
                'party' => $r['party_name'] ?: 'Vendor / Payee',
                'status' => $r['status'],
                'notes' => $r['notes'] ?? ''
            ];
        }
    } catch (Exception $e) {
        error_log("Error in transaction expenses query: " . $e->getMessage());
    }

    // Sort all unified transactions descending by date
    usort($transactions, function ($a, $b) {
        return strcmp($b['date'], $a['date']);
    });

    return array_slice($transactions, 0, $limit);
}
