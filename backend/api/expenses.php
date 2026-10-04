<?php

$db = Database::getInstance();
ensureExpensesTables($db);

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;

// Support method override so simulated PUT works reliably
$methodOverride = strtoupper($_POST['_method'] ?? $_GET['_method'] ?? '');
if ($method === 'POST' && $methodOverride === 'PUT') {
    $method = 'PUT';
}

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

function ensureExpensesTables($db) {
    try {
        $db->query("SET FOREIGN_KEY_CHECKS = 0");

        $db->query("CREATE TABLE IF NOT EXISTS expenses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            expense_no VARCHAR(60) UNIQUE NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NULL,
            category ENUM('SALARY', 'UTILITIES', 'MAINTENANCE', 'SUPPLIES', 'TRANSPORT', 'MARKETING', 'EVENTS', 'OTHER') NOT NULL DEFAULT 'SUPPLIES',
            amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            status ENUM('PENDING', 'APPROVED', 'PAID', 'REJECTED') NOT NULL DEFAULT 'PENDING',
            payment_method ENUM('CASH', 'BANK_TRANSFER', 'CARD', 'MOBILE_BANKING', 'CHEQUE', 'OTHER') NOT NULL DEFAULT 'CASH',
            vendor VARCHAR(255) NULL,
            expense_date DATE NOT NULL,
            due_date DATE NULL,
            paid_date DATE NULL,
            transaction_ref VARCHAR(100) NULL,
            receipt_url VARCHAR(255) NULL,
            notes TEXT NULL,
            created_by VARCHAR(255) NULL,
            approved_by VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_exp_status (status),
            INDEX idx_exp_category (category),
            INDEX idx_exp_date (expense_date)
        )");

        $db->query("SET FOREIGN_KEY_CHECKS = 1");

        // Seed sample expenses if empty
        $expCount = $db->fetchOne("SELECT COUNT(*) as total FROM expenses")['total'] ?? 0;
        if ((int)$expCount === 0) {
            seedSampleExpensesData($db);
        }
    } catch (Exception $e) {
        error_log('Error initializing expenses tables: ' . $e->getMessage());
    }
}

function seedSampleExpensesData($db) {
    try {
        $today = date('Y-m-d');
        $lastMonth = date('Y-m-d', strtotime('-1 month'));
        $lastWeek = date('Y-m-d', strtotime('-1 week'));
        $yesterday = date('Y-m-d', strtotime('-1 day'));
        $nextWeek = date('Y-m-d', strtotime('+1 week'));

        $expenses = [
            [
                'expense_no' => 'EXP-2026-0001',
                'title' => 'Monthly Staff Salaries - January 2026',
                'description' => 'Salaries for all teaching and non-teaching staff',
                'category' => 'SALARY',
                'amount' => 25000.00,
                'status' => 'PAID',
                'payment_method' => 'BANK_TRANSFER',
                'vendor' => 'School Payroll Account',
                'expense_date' => $lastMonth,
                'paid_date' => $lastMonth,
                'transaction_ref' => 'SAL-JAN-2026-001',
                'notes' => 'Monthly payroll processed'
            ],
            [
                'expense_no' => 'EXP-2026-0002',
                'title' => 'Electricity Bill - December 2025',
                'description' => 'Monthly electricity consumption for school building',
                'category' => 'UTILITIES',
                'amount' => 1850.00,
                'status' => 'PAID',
                'payment_method' => 'BANK_TRANSFER',
                'vendor' => 'National Power Company',
                'expense_date' => $lastMonth,
                'paid_date' => $lastWeek,
                'transaction_ref' => 'ELEC-DEC-2025-001',
                'notes' => 'Regular monthly utility payment'
            ],
            [
                'expense_no' => 'EXP-2026-0003',
                'title' => 'Office Supplies Purchase',
                'description' => 'Paper, pens, notebooks, and other office supplies',
                'category' => 'SUPPLIES',
                'amount' => 450.00,
                'status' => 'APPROVED',
                'payment_method' => 'CASH',
                'vendor' => 'Office Supplies Co.',
                'expense_date' => $lastWeek,
                'transaction_ref' => null,
                'notes' => 'Quarterly office supplies restock'
            ],
            [
                'expense_no' => 'EXP-2026-0004',
                'title' => 'Building Maintenance - Roof Repair',
                'description' => 'Emergency roof repair after storm damage',
                'category' => 'MAINTENANCE',
                'amount' => 3200.00,
                'status' => 'PENDING',
                'payment_method' => 'BANK_TRANSFER',
                'vendor' => 'City Builders Ltd.',
                'expense_date' => $yesterday,
                'due_date' => $nextWeek,
                'transaction_ref' => null,
                'notes' => 'Urgent repair work required'
            ],
            [
                'expense_no' => 'EXP-2026-0005',
                'title' => 'School Bus Fuel - January',
                'description' => 'Monthly fuel for school transportation fleet',
                'category' => 'TRANSPORT',
                'amount' => 1200.00,
                'status' => 'PAID',
                'payment_method' => 'CARD',
                'vendor' => 'Shell Fuel Station',
                'expense_date' => $lastMonth,
                'paid_date' => $lastMonth,
                'transaction_ref' => 'FUEL-JAN-2026-001',
                'notes' => 'Regular fuel for 3 school buses'
            ],
            [
                'expense_no' => 'EXP-2026-0006',
                'title' => 'Marketing Campaign - Spring Admission',
                'description' => 'Social media ads and printed flyers for new session',
                'category' => 'MARKETING',
                'amount' => 890.00,
                'status' => 'APPROVED',
                'payment_method' => 'BANK_TRANSFER',
                'vendor' => 'Marketing Pro Agency',
                'expense_date' => $lastWeek,
                'transaction_ref' => null,
                'notes' => 'Annual admission drive'
            ],
            [
                'expense_no' => 'EXP-2026-0007',
                'title' => 'Annual Sports Day Event',
                'description' => 'Trophies, medals, refreshments, and equipment rental',
                'category' => 'EVENTS',
                'amount' => 1500.00,
                'status' => 'PENDING',
                'payment_method' => 'CASH',
                'vendor' => 'Various',
                'expense_date' => $today,
                'due_date' => $nextWeek,
                'transaction_ref' => null,
                'notes' => 'Upcoming sports day event'
            ],
            [
                'expense_no' => 'EXP-2026-0008',
                'title' => 'Water Bill - December 2025',
                'description' => 'Monthly water and sewage charges',
                'category' => 'UTILITIES',
                'amount' => 320.00,
                'status' => 'PAID',
                'payment_method' => 'BANK_TRANSFER',
                'vendor' => 'City Water Authority',
                'expense_date' => $lastMonth,
                'paid_date' => $lastMonth,
                'transaction_ref' => 'WATER-DEC-2025-001',
                'notes' => 'Regular monthly utility'
            ],
            [
                'expense_no' => 'EXP-2026-0009',
                'title' => 'Computer Lab Equipment Upgrade',
                'description' => 'New keyboards and mice for computer lab',
                'category' => 'SUPPLIES',
                'amount' => 680.00,
                'status' => 'REJECTED',
                'payment_method' => 'CARD',
                'vendor' => 'Tech Supplies Inc.',
                'expense_date' => $lastWeek,
                'transaction_ref' => null,
                'notes' => 'Rejected - Budget exceeded, postpone to next quarter'
            ],
            [
                'expense_no' => 'EXP-2026-0010',
                'title' => 'Teacher Training Workshop',
                'description' => 'Professional development workshop for faculty',
                'category' => 'OTHER',
                'amount' => 750.00,
                'status' => 'APPROVED',
                'payment_method' => 'BANK_TRANSFER',
                'vendor' => 'Education Training Center',
                'expense_date' => $yesterday,
                'transaction_ref' => null,
                'notes' => 'Mandatory annual training'
            ]
        ];

        foreach ($expenses as $exp) {
            $db->insert('expenses', $exp);
        }
    } catch (Exception $e) {
        error_log('Error seeding expenses data: ' . $e->getMessage());
    }
}

function handleGet($db, $action, $id) {
    if ($action === 'stats') {
        getExpenseStats($db);
    } elseif ($id) {
        getExpenseById($db, $id);
    } else {
        getExpenses($db);
    }
}

function getExpenses($db) {
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    $status = $_GET['status'] ?? null;
    $category = $_GET['category'] ?? null;
    $search = $_GET['search'] ?? null;

    $where = [];
    $params = [];

    if ($status && $status !== 'all') {
        $where[] = "status = ?";
        $params[] = strtoupper($status);
    }

    if ($category && $category !== 'all') {
        $where[] = "category = ?";
        $params[] = strtoupper($category);
    }

    if ($search) {
        $where[] = "(title LIKE ? OR expense_no LIKE ? OR vendor LIKE ?)";
        $searchTerm = "%$search%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }

    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

    $expenses = $db->fetchAll(
        "SELECT * FROM expenses $whereClause ORDER BY created_at DESC, id DESC LIMIT $limit OFFSET $offset",
        $params
    );

    $total = (int)($db->fetchOne(
        "SELECT COUNT(*) as total FROM expenses $whereClause",
        $params
    )['total'] ?? 0);

    $stats = calculateExpenseStats($db, $whereClause, $params);

    Response::success('Expenses retrieved successfully', [
        'expenses' => $expenses,
        'total' => $total,
        'stats' => $stats
    ]);
}

function getExpenseById($db, $id) {
    $expense = $db->fetchOne("SELECT * FROM expenses WHERE id = ?", [$id]);
    if (!$expense) {
        Response::notFound('Expense not found');
    }
    Response::success('Expense retrieved successfully', $expense);
}

function getExpenseStats($db) {
    $stats = calculateExpenseStats($db);
    Response::success('Expense statistics retrieved successfully', $stats);
}

function calculateExpenseStats($db, $whereClause = '', $params = []) {
    $stats = [
        'total_expenses' => 0,
        'pending_amount' => 0,
        'approved_amount' => 0,
        'paid_amount' => 0,
        'rejected_amount' => 0,
        'total_count' => 0,
        'pending_count' => 0,
        'approved_count' => 0,
        'paid_count' => 0,
        'rejected_count' => 0,
        'current_month_total' => 0,
        'current_year_total' => 0
    ];

    $allExpenses = $db->fetchAll("SELECT * FROM expenses $whereClause", $params);

    foreach ($allExpenses as $exp) {
        $amount = floatval($exp['amount']);
        $stats['total_expenses'] += $amount;
        $stats['total_count']++;

        switch ($exp['status']) {
            case 'PENDING':
                $stats['pending_amount'] += $amount;
                $stats['pending_count']++;
                break;
            case 'APPROVED':
                $stats['approved_amount'] += $amount;
                $stats['approved_count']++;
                break;
            case 'PAID':
                $stats['paid_amount'] += $amount;
                $stats['paid_count']++;
                break;
            case 'REJECTED':
                $stats['rejected_amount'] += $amount;
                $stats['rejected_count']++;
                break;
        }

        // Current month
        $expDate = date('Y-m', strtotime($exp['expense_date']));
        $currentMonth = date('Y-m');
        if ($expDate === $currentMonth) {
            $stats['current_month_total'] += $amount;
        }

        // Current year
        $expYear = date('Y', strtotime($exp['expense_date']));
        $currentYear = date('Y');
        if ($expYear == $currentYear) {
            $stats['current_year_total'] += $amount;
        }
    }

    return $stats;
}

function handlePost($db, $action) {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);
    if (!is_array($data) || empty($data)) {
        $data = $_POST;
    }

    if (empty($data)) {
        Response::error('Invalid input data');
    }

    // Validate required fields
    if (empty($data['title'])) {
        Response::error('Title is required');
    }

    if (!isset($data['amount']) || floatval($data['amount']) <= 0) {
        Response::error('Amount must be greater than 0');
    }

    if (empty($data['expense_date'])) {
        Response::error('Expense date is required');
    }

    // Generate unique expense number
    $expenseNo = generateExpenseNo($db);
    $status = !empty($data['status']) ? strtoupper($data['status']) : 'PENDING';
    $paidDate = ($status === 'PAID') ? (!empty($data['paid_date']) ? $data['paid_date'] : date('Y-m-d')) : null;

    $expenseData = [
        'expense_no' => $expenseNo,
        'title' => trim($data['title']),
        'description' => !empty($data['description']) ? trim($data['description']) : null,
        'category' => !empty($data['category']) ? strtoupper($data['category']) : 'SUPPLIES',
        'amount' => floatval($data['amount']),
        'status' => $status,
        'payment_method' => !empty($data['payment_method']) ? strtoupper($data['payment_method']) : 'CASH',
        'vendor' => !empty($data['vendor']) ? trim($data['vendor']) : null,
        'expense_date' => $data['expense_date'],
        'due_date' => !empty($data['due_date']) ? $data['due_date'] : null,
        'paid_date' => $paidDate,
        'transaction_ref' => !empty($data['transaction_ref']) ? trim($data['transaction_ref']) : null,
        'notes' => !empty($data['notes']) ? trim($data['notes']) : null,
        'created_by' => 'admin'
    ];

    try {
        $id = $db->insert('expenses', $expenseData);
        if ($id) {
            $expense = $db->fetchOne("SELECT * FROM expenses WHERE id = ?", [$id]);
            Response::success('Expense created successfully', $expense, 201);
        } else {
            Response::error('Failed to create expense');
        }
    } catch (Exception $e) {
        Response::error('Failed to create expense: ' . $e->getMessage());
    }
}

function handlePut($db, $action, $id) {
    if (!$id) {
        Response::error('Expense ID is required');
    }

    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);
    if (!is_array($data) || empty($data)) {
        $data = $_POST;
    }
    unset($data['_method']);

    if (empty($data)) {
        Response::error('Invalid input data');
    }

    // Validate required fields
    if (empty($data['title'])) {
        Response::error('Title is required');
    }

    if (!isset($data['amount']) || floatval($data['amount']) <= 0) {
        Response::error('Amount must be greater than 0');
    }

    if (empty($data['expense_date'])) {
        Response::error('Expense date is required');
    }

    $existing = $db->fetchOne("SELECT * FROM expenses WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Expense not found');
    }

    $status = !empty($data['status']) ? strtoupper($data['status']) : $existing['status'];
    $paidDate = $existing['paid_date'];
    if ($status === 'PAID') {
        $paidDate = !empty($data['paid_date']) ? $data['paid_date'] : ($existing['paid_date'] ?: date('Y-m-d'));
    } elseif ($status !== 'PAID') {
        $paidDate = null;
    }

    $updateData = [
        'title' => trim($data['title']),
        'description' => isset($data['description']) ? trim($data['description']) : null,
        'category' => !empty($data['category']) ? strtoupper($data['category']) : $existing['category'],
        'amount' => floatval($data['amount']),
        'status' => $status,
        'payment_method' => !empty($data['payment_method']) ? strtoupper($data['payment_method']) : $existing['payment_method'],
        'vendor' => isset($data['vendor']) ? trim($data['vendor']) : null,
        'expense_date' => $data['expense_date'],
        'due_date' => !empty($data['due_date']) ? $data['due_date'] : null,
        'paid_date' => $paidDate,
        'transaction_ref' => isset($data['transaction_ref']) ? trim($data['transaction_ref']) : null,
        'notes' => isset($data['notes']) ? trim($data['notes']) : null
    ];

    try {
        $db->update('expenses', $updateData, 'id = ?', [$id]);
        $expense = $db->fetchOne("SELECT * FROM expenses WHERE id = ?", [$id]);
        Response::success('Expense updated successfully', $expense);
    } catch (Exception $e) {
        Response::error('Failed to update expense: ' . $e->getMessage());
    }
}

function handleDelete($db, $action, $id) {
    if (!$id) {
        Response::error('Expense ID is required');
    }

    $existing = $db->fetchOne("SELECT * FROM expenses WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Expense not found');
    }

    try {
        $db->delete('expenses', 'id = ?', [$id]);
        Response::success('Expense deleted successfully');
    } catch (Exception $e) {
        Response::error('Failed to delete expense: ' . $e->getMessage());
    }
}

function generateExpenseNo($db) {
    $year = date('Y');
    try {
        $maxId = $db->fetchOne("SELECT MAX(id) as max_id FROM expenses")['max_id'] ?? 0;
        $num = intval($maxId) + 1;
    } catch (Exception $e) {
        $num = 1;
    }

    $candidate = sprintf('EXP-%s-%04d', $year, $num);
    $exists = $db->fetchOne("SELECT id FROM expenses WHERE expense_no = ?", [$candidate]);
    if ($exists) {
        $candidate = sprintf('EXP-%s-%04d-%02d', $year, $num, rand(10, 99));
    }
    return $candidate;
}
