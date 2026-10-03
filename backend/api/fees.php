<?php

$db = Database::getInstance();
ensureFeesTables($db);

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        handleGet($db, $action, $id);
        break;
    case 'POST':
        handlePost($db, $action);
        break;
    case 'PUT':
        handlePut($db, $action, $id);
        break;
    case 'DELETE':
        handleDelete($db, $action, $id);
        break;
    default:
        Response::methodNotAllowed();
}

function ensureFeesTables($db) {
    try {
        $db->query("SET FOREIGN_KEY_CHECKS = 0");

        $db->query("CREATE TABLE IF NOT EXISTS fee_categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            code VARCHAR(50) UNIQUE NOT NULL,
            description TEXT NULL,
            default_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            frequency ENUM('ONE_TIME', 'MONTHLY', 'TERMLY', 'ANNUALLY') NOT NULL DEFAULT 'MONTHLY',
            status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");

        $db->query("CREATE TABLE IF NOT EXISTS fee_invoices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            invoice_no VARCHAR(60) UNIQUE NOT NULL,
            student_id VARCHAR(255) NOT NULL,
            fee_category_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            due_date DATE NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            status ENUM('PAID', 'PARTIAL', 'UNPAID', 'OVERDUE') NOT NULL DEFAULT 'UNPAID',
            academic_year VARCHAR(20) NOT NULL DEFAULT '2026-2027',
            notes TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_fee_student (student_id),
            INDEX idx_fee_category (fee_category_id),
            INDEX idx_fee_status (status)
        )");

        $db->query("CREATE TABLE IF NOT EXISTS fee_payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            receipt_no VARCHAR(60) UNIQUE NOT NULL,
            invoice_id INT NOT NULL,
            student_id VARCHAR(255) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            payment_method ENUM('CASH', 'BANK_TRANSFER', 'CARD', 'MOBILE_BANKING', 'CHEQUE', 'OTHER') NOT NULL DEFAULT 'CASH',
            transaction_ref VARCHAR(100) NULL,
            payment_date DATE NOT NULL,
            notes TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_pay_invoice (invoice_id),
            INDEX idx_pay_student (student_id),
            INDEX idx_pay_date (payment_date)
        )");

        // Try adding foreign keys safely
        try {
            $db->query("ALTER TABLE fee_invoices ADD CONSTRAINT fk_fee_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE");
        } catch (Exception $e) {}
        try {
            $db->query("ALTER TABLE fee_invoices ADD CONSTRAINT fk_fee_category FOREIGN KEY (fee_category_id) REFERENCES fee_categories(id) ON DELETE RESTRICT");
        } catch (Exception $e) {}
        try {
            $db->query("ALTER TABLE fee_payments ADD CONSTRAINT fk_pay_invoice FOREIGN KEY (invoice_id) REFERENCES fee_invoices(id) ON DELETE CASCADE");
        } catch (Exception $e) {}
        try {
            $db->query("ALTER TABLE fee_payments ADD CONSTRAINT fk_pay_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE");
        } catch (Exception $e) {}

        $db->query("SET FOREIGN_KEY_CHECKS = 1");

        // Seed default categories if empty
        $catCount = $db->fetchOne("SELECT COUNT(*) as total FROM fee_categories")['total'] ?? 0;
        if ((int)$catCount === 0) {
            $categories = [
                ['Monthly Tuition Fee', 'TUIT', 'Standard monthly academic tuition fee', 150.00, 'MONTHLY', 'ACTIVE'],
                ['Admission / Enrollment Fee', 'ADMS', 'One-time admission registration fee', 350.00, 'ONE_TIME', 'ACTIVE'],
                ['Term Examination Fee', 'EXAM', 'Comprehensive term evaluation and exam fee', 50.00, 'TERMLY', 'ACTIVE'],
                ['School Transport Fee', 'TRAN', 'Bus route pickup and drop-off facility', 80.00, 'MONTHLY', 'ACTIVE'],
                ['Library & Learning Resources', 'LIBR', 'Annual library membership and digital catalog access', 30.00, 'ANNUALLY', 'ACTIVE'],
                ['Computer & Science Lab Fee', 'LAB', 'Practical laboratory materials and computer system maintenance', 45.00, 'TERMLY', 'ACTIVE'],
                ['Sports & Extra-Curricular', 'SPRT', 'Clubs, athletic training, and sports equipment', 40.00, 'ANNUALLY', 'ACTIVE'],
                ['Uniform & Study Pack', 'UNIF', 'School uniform sets, badge, and textbooks', 120.00, 'ONE_TIME', 'ACTIVE']
            ];
            foreach ($categories as $cat) {
                $db->query("INSERT IGNORE INTO fee_categories (name, code, description, default_amount, frequency, status) VALUES (?, ?, ?, ?, ?, ?)", $cat);
            }
        }

        // Seed initial invoices and payments if invoices empty and students exist
        $invCount = $db->fetchOne("SELECT COUNT(*) as total FROM fee_invoices")['total'] ?? 0;
        if ((int)$invCount === 0) {
            seedSampleFeesData($db);
        }
    } catch (Exception $e) {
        error_log('Error initializing fees tables: ' . $e->getMessage());
    }
}

function seedSampleFeesData($db) {
    try {
        $students = $db->fetchAll("SELECT id, name, surname, class_id FROM students LIMIT 15");
        if (empty($students)) return;

        $categories = $db->fetchAll("SELECT id, name, default_amount FROM fee_categories");
        if (empty($categories)) return;

        $catMap = [];
        foreach ($categories as $c) {
            $catMap[$c['name']] = $c;
        }

        $invIndex = 1;
        $recIndex = 1;
        $today = date('Y-m-d');
        $lastMonth = date('Y-m-d', strtotime('-1 month'));
        $nextMonth = date('Y-m-d', strtotime('+15 days'));
        $pastDue = date('Y-m-d', strtotime('-10 days'));

        foreach ($students as $idx => $st) {
            $tuitionCat = $catMap['Monthly Tuition Fee'] ?? $categories[0];
            $examCat = $catMap['Term Examination Fee'] ?? ($categories[2] ?? $categories[0]);
            $transCat = $catMap['School Transport Fee'] ?? ($categories[3] ?? $categories[0]);

            // Sample 1: Tuition fee
            $invNo1 = sprintf('INV-2026-%04d', $invIndex++);
            $status1 = ($idx % 3 === 0) ? 'PAID' : (($idx % 3 === 1) ? 'PARTIAL' : 'UNPAID');
            $amount1 = floatval($tuitionCat['default_amount']);
            $discount1 = ($idx % 5 === 0) ? 20.00 : 0.00;
            $net1 = $amount1 - $discount1;
            $paid1 = ($status1 === 'PAID') ? $net1 : (($status1 === 'PARTIAL') ? round($net1 / 2, 2) : 0.00);

            $invId1 = $db->insert('fee_invoices', [
                'invoice_no' => $invNo1,
                'student_id' => $st['id'],
                'fee_category_id' => $tuitionCat['id'],
                'title' => 'Tuition Fee - ' . date('F Y'),
                'due_date' => ($status1 === 'UNPAID' && $idx % 2 === 0) ? $pastDue : $nextMonth,
                'amount' => $amount1,
                'discount' => $discount1,
                'paid_amount' => $paid1,
                'status' => ($status1 === 'UNPAID' && $idx % 2 === 0) ? 'OVERDUE' : $status1,
                'academic_year' => '2026-2027',
                'notes' => 'Standard monthly fee'
            ]);

            if ($paid1 > 0) {
                $db->insert('fee_payments', [
                    'receipt_no' => sprintf('REC-2026-%04d', $recIndex++),
                    'invoice_id' => $invId1,
                    'student_id' => $st['id'],
                    'amount' => $paid1,
                    'payment_method' => ($idx % 2 === 0) ? 'CASH' : 'BANK_TRANSFER',
                    'transaction_ref' => 'TXN-' . strtoupper(substr(md5($invNo1), 0, 8)),
                    'payment_date' => $lastMonth,
                    'notes' => 'Initial payment received'
                ]);
            }

            // Sample 2: Exam or Transport for some students
            if ($idx % 2 === 0) {
                $cat2 = ($idx % 4 === 0) ? $examCat : $transCat;
                $invNo2 = sprintf('INV-2026-%04d', $invIndex++);
                $amount2 = floatval($cat2['default_amount']);
                $status2 = ($idx % 4 === 0) ? 'PAID' : 'UNPAID';
                $paid2 = ($status2 === 'PAID') ? $amount2 : 0.00;

                $invId2 = $db->insert('fee_invoices', [
                    'invoice_no' => $invNo2,
                    'student_id' => $st['id'],
                    'fee_category_id' => $cat2['id'],
                    'title' => $cat2['name'],
                    'due_date' => $nextMonth,
                    'amount' => $amount2,
                    'discount' => 0.00,
                    'paid_amount' => $paid2,
                    'status' => $status2,
                    'academic_year' => '2026-2027',
                    'notes' => 'Term fee'
                ]);

                if ($paid2 > 0) {
                    $db->insert('fee_payments', [
                        'receipt_no' => sprintf('REC-2026-%04d', $recIndex++),
                        'invoice_id' => $invId2,
                        'student_id' => $st['id'],
                        'amount' => $paid2,
                        'payment_method' => 'CARD',
                        'transaction_ref' => 'TXN-' . strtoupper(substr(md5($invNo2), 0, 8)),
                        'payment_date' => $today,
                        'notes' => 'Term payment'
                    ]);
                }
            }
        }
    } catch (Exception $e) {
        error_log('Error seeding fees: ' . $e->getMessage());
    }
}

function handleGet($db, $action, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'super_admin']);

    if ($action === 'stats') {
        getStats($db);
        return;
    }

    if ($action === 'categories') {
        getCategories($db);
        return;
    }

    if ($action === 'payments') {
        getPayments($db);
        return;
    }

    if ($action === 'receipt') {
        getReceipt($db, $id);
        return;
    }

    if ($id) {
        getSingleInvoice($db, $id);
        return;
    }

    getInvoices($db);
}

function getStats($db) {
    // Update overdue statuses automatically before calculating stats
    $today = date('Y-m-d');
    $db->query("UPDATE fee_invoices SET status = 'OVERDUE' WHERE due_date < ? AND status = 'UNPAID'", [$today]);

    $stats = $db->fetchOne("SELECT 
        COALESCE(SUM(amount - discount), 0) as total_billed,
        COALESCE(SUM(paid_amount), 0) as total_collected,
        COALESCE(SUM(CASE WHEN (amount - discount - paid_amount) > 0 THEN (amount - discount - paid_amount) ELSE 0 END), 0) as total_due,
        COALESCE(SUM(CASE WHEN status = 'OVERDUE' THEN (amount - discount - paid_amount) ELSE 0 END), 0) as total_overdue,
        COUNT(*) as total_invoices,
        SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN status = 'PARTIAL' THEN 1 ELSE 0 END) as partial_count,
        SUM(CASE WHEN status = 'UNPAID' THEN 1 ELSE 0 END) as unpaid_count,
        SUM(CASE WHEN status = 'OVERDUE' THEN 1 ELSE 0 END) as overdue_count
        FROM fee_invoices");

    // Monthly collection trend for the last 6 months
    $monthlySql = "SELECT DATE_FORMAT(payment_date, '%b %Y') as month_label, 
                          SUM(amount) as collected_amount, 
                          COUNT(*) as transaction_count
                   FROM fee_payments
                   WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                   GROUP BY DATE_FORMAT(payment_date, '%Y-%m'), DATE_FORMAT(payment_date, '%b %Y')
                   ORDER BY DATE_FORMAT(payment_date, '%Y-%m') ASC";
    $monthly = $db->fetchAll($monthlySql);

    // Category breakdown
    $categoryBreakdown = $db->fetchAll("SELECT fc.name, 
        COUNT(fi.id) as invoice_count,
        COALESCE(SUM(fi.amount - fi.discount), 0) as total_amount,
        COALESCE(SUM(fi.paid_amount), 0) as paid_amount
        FROM fee_categories fc
        LEFT JOIN fee_invoices fi ON fc.id = fi.fee_category_id
        GROUP BY fc.id, fc.name
        ORDER BY total_amount DESC");

    Response::json([
        'stats' => [
            'total_billed' => floatval($stats['total_billed'] ?? 0),
            'total_collected' => floatval($stats['total_collected'] ?? 0),
            'total_due' => floatval($stats['total_due'] ?? 0),
            'total_overdue' => floatval($stats['total_overdue'] ?? 0),
            'total_invoices' => intval($stats['total_invoices'] ?? 0),
            'paid_count' => intval($stats['paid_count'] ?? 0),
            'partial_count' => intval($stats['partial_count'] ?? 0),
            'unpaid_count' => intval($stats['unpaid_count'] ?? 0),
            'overdue_count' => intval($stats['overdue_count'] ?? 0),
            'collection_rate' => ($stats['total_billed'] > 0) 
                ? round((floatval($stats['total_collected']) / floatval($stats['total_billed'])) * 100, 1) 
                : 0,
        ],
        'monthly' => $monthly,
        'category_breakdown' => $categoryBreakdown
    ]);
}

function getCategories($db) {
    $sql = "SELECT fc.*, 
            COUNT(fi.id) as total_invoices,
            COALESCE(SUM(fi.paid_amount), 0) as total_revenue
            FROM fee_categories fc
            LEFT JOIN fee_invoices fi ON fc.id = fi.fee_category_id
            GROUP BY fc.id
            ORDER BY fc.name ASC";
    $categories = $db->fetchAll($sql);
    Response::json(['categories' => $categories]);
}

function getInvoices($db) {
    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 10);
    $search = trim($_GET['search'] ?? '');
    $status = trim($_GET['status'] ?? '');
    $categoryId = trim($_GET['category_id'] ?? '');
    $classId = trim($_GET['class_id'] ?? '');
    $studentId = trim($_GET['student_id'] ?? '');

    $offset = ($page - 1) * $limit;

    $sql = "SELECT fi.*, 
                   s.name as student_name, 
                   s.surname as student_surname, 
                   s.email as student_email, 
                   s.phone as student_phone,
                   s.img as student_img,
                   c.name as class_name, 
                   g.level as grade_level,
                   fc.name as category_name, 
                   fc.code as category_code,
                   (fi.amount - fi.discount) as net_amount,
                   ((fi.amount - fi.discount) - fi.paid_amount) as due_amount
            FROM fee_invoices fi
            JOIN students s ON fi.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN grades g ON s.grade_id = g.id
            JOIN fee_categories fc ON fi.fee_category_id = fc.id
            WHERE 1=1";
    $params = [];

    if (!empty($search)) {
        $sql .= " AND (fi.invoice_no LIKE ? OR s.name LIKE ? OR s.surname LIKE ? OR s.id LIKE ? OR fi.title LIKE ?)";
        $term = "%{$search}%";
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
    }

    if (!empty($status) && $status !== 'ALL') {
        $sql .= " AND fi.status = ?";
        $params[] = $status;
    }

    if (!empty($categoryId)) {
        $sql .= " AND fi.fee_category_id = ?";
        $params[] = $categoryId;
    }

    if (!empty($classId)) {
        $sql .= " AND s.class_id = ?";
        $params[] = $classId;
    }

    if (!empty($studentId)) {
        $sql .= " AND fi.student_id = ?";
        $params[] = $studentId;
    }

    // Count total query
    $countSql = "SELECT COUNT(*) as total FROM (" . $sql . ") as subquery";
    $totalRow = $db->fetchOne($countSql, $params);
    $total = intval($totalRow['total'] ?? 0);

    // Ordering and pagination
    $sql .= " ORDER BY fi.created_at DESC, fi.id DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;

    $invoices = $db->fetchAll($sql, $params);

    // Format numbers
    foreach ($invoices as &$inv) {
        $inv['amount'] = floatval($inv['amount']);
        $inv['discount'] = floatval($inv['discount']);
        $inv['paid_amount'] = floatval($inv['paid_amount']);
        $inv['net_amount'] = floatval($inv['net_amount']);
        $inv['due_amount'] = max(0, floatval($inv['due_amount']));
    }

    Response::json([
        'fees' => $invoices,
        'invoices' => $invoices,
        'pagination' => [
            'total' => $total,
            'pages' => max(1, ceil($total / $limit)),
            'limit' => $limit,
            'page' => $page
        ]
    ]);
}

function getSingleInvoice($db, $id) {
    $sql = "SELECT fi.*, 
                   s.name as student_name, 
                   s.surname as student_surname, 
                   s.email as student_email, 
                   s.phone as student_phone,
                   s.address as student_address,
                   s.img as student_img,
                   c.name as class_name, 
                   g.level as grade_level,
                   p.name as parent_name,
                   p.surname as parent_surname,
                   p.phone as parent_phone,
                   fc.name as category_name, 
                   fc.code as category_code,
                   (fi.amount - fi.discount) as net_amount,
                   ((fi.amount - fi.discount) - fi.paid_amount) as due_amount
            FROM fee_invoices fi
            JOIN students s ON fi.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN grades g ON s.grade_id = g.id
            LEFT JOIN parents p ON s.parent_id = p.id
            JOIN fee_categories fc ON fi.fee_category_id = fc.id
            WHERE fi.id = ?";
    $invoice = $db->fetchOne($sql, [$id]);

    if (!$invoice) {
        Response::error('Invoice not found', 404);
    }

    // Load payments for this invoice
    $payments = $db->fetchAll(
        "SELECT * FROM fee_payments WHERE invoice_id = ? ORDER BY payment_date DESC, id DESC",
        [$id]
    );

    $invoice['amount'] = floatval($invoice['amount']);
    $invoice['discount'] = floatval($invoice['discount']);
    $invoice['paid_amount'] = floatval($invoice['paid_amount']);
    $invoice['net_amount'] = floatval($invoice['net_amount']);
    $invoice['due_amount'] = max(0, floatval($invoice['due_amount']));
    $invoice['payments'] = $payments;

    Response::json(['invoice' => $invoice]);
}

function getPayments($db) {
    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 15);
    $search = trim($_GET['search'] ?? '');
    $offset = ($page - 1) * $limit;

    $sql = "SELECT fp.*, 
                   fi.invoice_no, 
                   fi.title as invoice_title, 
                   fc.name as category_name,
                   s.name as student_name, 
                   s.surname as student_surname,
                   s.img as student_img,
                   c.name as class_name
            FROM fee_payments fp
            JOIN fee_invoices fi ON fp.invoice_id = fi.id
            JOIN fee_categories fc ON fi.fee_category_id = fc.id
            JOIN students s ON fp.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE 1=1";
    $params = [];

    if (!empty($search)) {
        $sql .= " AND (fp.receipt_no LIKE ? OR fi.invoice_no LIKE ? OR s.name LIKE ? OR s.surname LIKE ? OR fp.transaction_ref LIKE ?)";
        $term = "%{$search}%";
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
    }

    $countSql = "SELECT COUNT(*) as total FROM (" . $sql . ") as sub";
    $total = intval($db->fetchOne($countSql, $params)['total'] ?? 0);

    $sql .= " ORDER BY fp.payment_date DESC, fp.id DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;

    $payments = $db->fetchAll($sql, $params);

    foreach ($payments as &$p) {
        $p['amount'] = floatval($p['amount']);
    }

    Response::json([
        'payments' => $payments,
        'pagination' => [
            'total' => $total,
            'pages' => max(1, ceil($total / $limit)),
            'limit' => $limit,
            'page' => $page
        ]
    ]);
}

function getReceipt($db, $id) {
    // ID can be payment ID or invoice ID
    $payment = null;
    if ($id) {
        $payment = $db->fetchOne(
            "SELECT fp.*, 
                    fi.invoice_no, fi.title as invoice_title, fi.amount as invoice_amount, 
                    fi.discount, fi.paid_amount as total_paid, fi.due_date, fi.academic_year,
                    (fi.amount - fi.discount) as net_amount,
                    ((fi.amount - fi.discount) - fi.paid_amount) as remaining_due,
                    s.id as student_code, s.name as student_name, s.surname as student_surname,
                    s.email as student_email, s.phone as student_phone, s.address as student_address,
                    c.name as class_name, g.level as grade_level,
                    p.name as parent_name, p.surname as parent_surname, p.phone as parent_phone,
                    fc.name as category_name
             FROM fee_payments fp
             JOIN fee_invoices fi ON fp.invoice_id = fi.id
             JOIN fee_categories fc ON fi.fee_category_id = fc.id
             JOIN students s ON fp.student_id = s.id
             LEFT JOIN classes c ON s.class_id = c.id
             LEFT JOIN grades g ON s.grade_id = g.id
             LEFT JOIN parents p ON s.parent_id = p.id
             WHERE fp.id = ? OR fp.receipt_no = ?",
            [$id, $id]
        );
    }

    if (!$payment) {
        Response::error('Receipt record not found', 404);
    }

    $siteSettings = $db->fetchOne("SELECT setting_value FROM site_settings WHERE setting_key = 'site_name'");
    $payment['site_name'] = $siteSettings['setting_value'] ?? 'ACADEMIA';

    Response::json(['receipt' => $payment]);
}

function handlePost($db, $action) {
    AuthMiddleware::requireAnyRole(['admin', 'super_admin']);
    $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    if ($action === 'record-payment') {
        recordPayment($db, $data);
        return;
    }

    if ($action === 'bulk-generate') {
        bulkGenerateInvoices($db, $data);
        return;
    }

    if ($action === 'create-category') {
        createCategory($db, $data);
        return;
    }

    createInvoice($db, $data);
}

function createInvoice($db, $data) {
    $studentId = trim($data['student_id'] ?? '');
    $categoryId = intval($data['fee_category_id'] ?? 0);
    $amount = floatval($data['amount'] ?? 0);
    $discount = floatval($data['discount'] ?? 0);
    $dueDate = trim($data['due_date'] ?? date('Y-m-d', strtotime('+15 days')));
    $title = trim($data['title'] ?? '');
    $academicYear = trim($data['academic_year'] ?? '2026-2027');
    $notes = trim($data['notes'] ?? '');
    $paidNow = floatval($data['paid_now'] ?? 0);
    $paymentMethod = $data['payment_method'] ?? 'CASH';
    $transactionRef = trim($data['transaction_ref'] ?? '');

    if (empty($studentId)) {
        Response::error('Student is required');
    }
    if (!$categoryId) {
        Response::error('Fee category is required');
    }
    if ($amount <= 0) {
        Response::error('Fee amount must be greater than zero');
    }

    // Verify student exists
    $student = $db->fetchOne("SELECT id, name, surname FROM students WHERE id = ?", [$studentId]);
    if (!$student) {
        Response::error('Student not found');
    }

    // If title empty, grab from category
    if (empty($title)) {
        $cat = $db->fetchOne("SELECT name FROM fee_categories WHERE id = ?", [$categoryId]);
        $title = ($cat['name'] ?? 'Fee') . ' - ' . date('M Y');
    }

    // Generate unique invoice number
    $count = $db->fetchOne("SELECT COUNT(*) as total FROM fee_invoices")['total'] ?? 0;
    $invoiceNo = sprintf('INV-%s-%04d', date('Y'), intval($count) + 1);

    $netAmount = max(0, $amount - $discount);
    $paidAmount = min($paidNow, $netAmount);
    $status = 'UNPAID';
    if ($paidAmount >= $netAmount) {
        $status = 'PAID';
    } elseif ($paidAmount > 0) {
        $status = 'PARTIAL';
    } elseif ($dueDate < date('Y-m-d')) {
        $status = 'OVERDUE';
    }

    $invoiceId = $db->insert('fee_invoices', [
        'invoice_no' => $invoiceNo,
        'student_id' => $studentId,
        'fee_category_id' => $categoryId,
        'title' => $title,
        'due_date' => $dueDate,
        'amount' => $amount,
        'discount' => $discount,
        'paid_amount' => $paidAmount,
        'status' => $status,
        'academic_year' => $academicYear,
        'notes' => $notes
    ]);

    // Record initial payment if provided
    $paymentId = null;
    $receiptNo = null;
    if ($paidAmount > 0) {
        $pCount = $db->fetchOne("SELECT COUNT(*) as total FROM fee_payments")['total'] ?? 0;
        $receiptNo = sprintf('REC-%s-%04d', date('Y'), intval($pCount) + 1);
        $paymentId = $db->insert('fee_payments', [
            'receipt_no' => $receiptNo,
            'invoice_id' => $invoiceId,
            'student_id' => $studentId,
            'amount' => $paidAmount,
            'payment_method' => $paymentMethod,
            'transaction_ref' => $transactionRef ?: ('INIT-' . strtoupper(substr(md5($invoiceNo), 0, 6))),
            'payment_date' => date('Y-m-d'),
            'notes' => 'Initial payment upon invoice creation'
        ]);
    }

    Response::json([
        'message' => 'Invoice created successfully',
        'invoice_id' => $invoiceId,
        'invoice_no' => $invoiceNo,
        'receipt_no' => $receiptNo
    ], 201);
}

function bulkGenerateInvoices($db, $data) {
    $classId = !empty($data['class_id']) ? intval($data['class_id']) : null;
    $gradeId = !empty($data['grade_id']) ? intval($data['grade_id']) : null;
    $categoryId = intval($data['fee_category_id'] ?? 0);
    $amount = floatval($data['amount'] ?? 0);
    $dueDate = trim($data['due_date'] ?? date('Y-m-d', strtotime('+15 days')));
    $title = trim($data['title'] ?? '');
    $academicYear = trim($data['academic_year'] ?? '2026-2027');
    $notes = trim($data['notes'] ?? '');

    if (!$categoryId) {
        Response::error('Fee category is required');
    }
    if ($amount <= 0) {
        Response::error('Amount must be greater than zero');
    }

    $sql = "SELECT id, name, surname FROM students WHERE 1=1";
    $params = [];
    if ($classId) {
        $sql .= " AND class_id = ?";
        $params[] = $classId;
    } elseif ($gradeId) {
        $sql .= " AND grade_id = ?";
        $params[] = $gradeId;
    }

    $students = $db->fetchAll($sql, $params);
    if (empty($students)) {
        Response::error('No students found for the selected criteria');
    }

    if (empty($title)) {
        $cat = $db->fetchOne("SELECT name FROM fee_categories WHERE id = ?", [$categoryId]);
        $title = ($cat['name'] ?? 'Fee') . ' - ' . date('M Y');
    }

    $count = intval($db->fetchOne("SELECT COUNT(*) as total FROM fee_invoices")['total'] ?? 0);
    $generated = 0;

    foreach ($students as $st) {
        $count++;
        $invoiceNo = sprintf('INV-%s-%04d', date('Y'), $count);
        $db->insert('fee_invoices', [
            'invoice_no' => $invoiceNo,
            'student_id' => $st['id'],
            'fee_category_id' => $categoryId,
            'title' => $title,
            'due_date' => $dueDate,
            'amount' => $amount,
            'discount' => 0.00,
            'paid_amount' => 0.00,
            'status' => ($dueDate < date('Y-m-d')) ? 'OVERDUE' : 'UNPAID',
            'academic_year' => $academicYear,
            'notes' => $notes ?: 'Bulk generated invoice'
        ]);
        $generated++;
    }

    Response::json([
        'message' => "Successfully generated {$generated} invoices",
        'generated_count' => $generated
    ], 201);
}

function recordPayment($db, $data) {
    $invoiceId = intval($data['invoice_id'] ?? 0);
    $amount = floatval($data['amount'] ?? 0);
    $paymentMethod = $data['payment_method'] ?? 'CASH';
    $paymentDate = trim($data['payment_date'] ?? date('Y-m-d'));
    $transactionRef = trim($data['transaction_ref'] ?? '');
    $notes = trim($data['notes'] ?? '');

    if (!$invoiceId) {
        Response::error('Invoice ID is required');
    }
    if ($amount <= 0) {
        Response::error('Payment amount must be greater than zero');
    }

    $invoice = $db->fetchOne("SELECT * FROM fee_invoices WHERE id = ?", [$invoiceId]);
    if (!$invoice) {
        Response::error('Invoice not found', 404);
    }

    $netAmount = max(0, floatval($invoice['amount']) - floatval($invoice['discount']));
    $currentPaid = floatval($invoice['paid_amount']);
    $remainingDue = max(0, $netAmount - $currentPaid);

    if ($amount > ($remainingDue + 0.01)) {
        Response::error("Payment amount (৳" . number_format($amount, 2) . ") exceeds remaining balance (৳" . number_format($remainingDue, 2) . ")");
    }

    $pCount = $db->fetchOne("SELECT COUNT(*) as total FROM fee_payments")['total'] ?? 0;
    $receiptNo = sprintf('REC-%s-%04d', date('Y'), intval($pCount) + 1);

    $paymentId = $db->insert('fee_payments', [
        'receipt_no' => $receiptNo,
        'invoice_id' => $invoiceId,
        'student_id' => $invoice['student_id'],
        'amount' => $amount,
        'payment_method' => $paymentMethod,
        'transaction_ref' => $transactionRef ?: ('PAY-' . strtoupper(substr(md5(uniqid()), 0, 8))),
        'payment_date' => $paymentDate,
        'notes' => $notes
    ]);

    $newPaid = $currentPaid + $amount;
    $newStatus = 'PARTIAL';
    if ($newPaid >= $netAmount) {
        $newStatus = 'PAID';
    } elseif ($newPaid <= 0) {
        $newStatus = ($invoice['due_date'] < date('Y-m-d')) ? 'OVERDUE' : 'UNPAID';
    }

    $db->update('fee_invoices', [
        'paid_amount' => $newPaid,
        'status' => $newStatus
    ], 'id = ?', [$invoiceId]);

    Response::json([
        'message' => 'Payment recorded successfully',
        'payment_id' => $paymentId,
        'receipt_no' => $receiptNo,
        'new_paid_amount' => $newPaid,
        'status' => $newStatus
    ]);
}

function createCategory($db, $data) {
    $name = trim($data['name'] ?? '');
    $code = strtoupper(trim($data['code'] ?? ''));
    $description = trim($data['description'] ?? '');
    $defaultAmount = floatval($data['default_amount'] ?? 0);
    $frequency = $data['frequency'] ?? 'MONTHLY';
    $status = $data['status'] ?? 'ACTIVE';

    if (empty($name)) {
        Response::error('Category name is required');
    }
    if (empty($code)) {
        $code = strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $name), 0, 4));
    }

    // Check duplicate code
    $exists = $db->fetchOne("SELECT id FROM fee_categories WHERE code = ?", [$code]);
    if ($exists) {
        $code = $code . rand(10, 99);
    }

    $id = $db->insert('fee_categories', [
        'name' => $name,
        'code' => $code,
        'description' => $description,
        'default_amount' => $defaultAmount,
        'frequency' => $frequency,
        'status' => $status
    ]);

    Response::json([
        'message' => 'Fee category created successfully',
        'id' => $id
    ], 201);
}

function handlePut($db, $action, $id) {
    AuthMiddleware::requireAnyRole(['admin', 'super_admin']);
    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    if ($action === 'update-category') {
        if (!$id) Response::error('Category ID is required');
        $cat = $db->fetchOne("SELECT * FROM fee_categories WHERE id = ?", [$id]);
        if (!$cat) Response::error('Category not found', 404);

        $db->update('fee_categories', [
            'name' => $data['name'] ?? $cat['name'],
            'description' => $data['description'] ?? $cat['description'],
            'default_amount' => isset($data['default_amount']) ? floatval($data['default_amount']) : $cat['default_amount'],
            'frequency' => $data['frequency'] ?? $cat['frequency'],
            'status' => $data['status'] ?? $cat['status']
        ], 'id = ?', [$id]);

        Response::json(['message' => 'Fee category updated successfully']);
        return;
    }

    if (!$id) {
        Response::error('Invoice ID is required');
    }

    $invoice = $db->fetchOne("SELECT * FROM fee_invoices WHERE id = ?", [$id]);
    if (!$invoice) {
        Response::error('Invoice not found', 404);
    }

    $amount = isset($data['amount']) ? floatval($data['amount']) : floatval($invoice['amount']);
    $discount = isset($data['discount']) ? floatval($data['discount']) : floatval($invoice['discount']);
    $paidAmount = floatval($invoice['paid_amount']);
    $netAmount = max(0, $amount - $discount);
    $dueDate = $data['due_date'] ?? $invoice['due_date'];

    $status = 'UNPAID';
    if ($paidAmount >= $netAmount) {
        $status = 'PAID';
    } elseif ($paidAmount > 0) {
        $status = 'PARTIAL';
    } elseif ($dueDate < date('Y-m-d')) {
        $status = 'OVERDUE';
    }

    $db->update('fee_invoices', [
        'title' => $data['title'] ?? $invoice['title'],
        'due_date' => $dueDate,
        'amount' => $amount,
        'discount' => $discount,
        'status' => $status,
        'notes' => $data['notes'] ?? $invoice['notes']
    ], 'id = ?', [$id]);

    Response::json(['message' => 'Invoice updated successfully']);
}

function handleDelete($db, $action, $id) {
    AuthMiddleware::requireAnyRole(['admin', 'super_admin']);

    if (!$id) {
        Response::error('ID is required');
    }

    if ($action === 'delete-category') {
        $inUse = $db->fetchOne("SELECT COUNT(*) as total FROM fee_invoices WHERE fee_category_id = ?", [$id]);
        if (intval($inUse['total'] ?? 0) > 0) {
            Response::error('Cannot delete category: it is currently used by invoices. You can set its status to Inactive instead.');
        }
        $db->query("DELETE FROM fee_categories WHERE id = ?", [$id]);
        Response::json(['message' => 'Fee category deleted successfully']);
        return;
    }

    $invoice = $db->fetchOne("SELECT id FROM fee_invoices WHERE id = ?", [$id]);
    if (!$invoice) {
        Response::error('Invoice not found', 404);
    }

    // Cascade deletes fee_payments automatically via FK or manual clean
    $db->query("DELETE FROM fee_payments WHERE invoice_id = ?", [$id]);
    $db->query("DELETE FROM fee_invoices WHERE id = ?", [$id]);

    Response::json(['message' => 'Invoice deleted successfully']);
}

