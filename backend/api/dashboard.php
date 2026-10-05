<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    Response::methodNotAllowed();
}

$user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
$role = $user['role'];
$userId = $user['user_id'];

$action = $_GET['action'] ?? null;
if ($action === 'finance') {
    $targetYear = isset($_GET['year']) ? intval($_GET['year']) : intval($_GET['finance_year'] ?? date('Y'));
    $financeInfo = getFinanceChartData($db, $targetYear);
    Response::success('Finance data retrieved', $financeInfo);
    exit;
}

try {
    // 1. Core metrics for Admin
    $studentCount = $db->fetchOne("SELECT COUNT(*) as total FROM students")['total'] ?? 0;
    $teacherCount = $db->fetchOne("SELECT COUNT(*) as total FROM teachers")['total'] ?? 0;
    $parentCount = $db->fetchOne("SELECT COUNT(*) as total FROM parents")['total'] ?? 0;
    $adminCount = $db->fetchOne("SELECT COUNT(*) as total FROM admins")['total'] ?? 0;
    $staffCount = 0;
    try {
        $staffCount = $db->fetchOne("SELECT COUNT(*) as total FROM staff")['total'] ?? 0;
    } catch (Exception $e) {}
    if ($staffCount == 0) {
        $staffCount = $adminCount;
    }
    $classCount = $db->fetchOne("SELECT COUNT(*) as total FROM classes")['total'] ?? 0;
    $lessonCount = $db->fetchOne("SELECT COUNT(*) as total FROM lessons")['total'] ?? 0;

    // 2. Gender distribution
    $boysCount = $db->fetchOne("SELECT COUNT(*) as total FROM students WHERE sex = 'MALE'")['total'] ?? 0;
    $girlsCount = $db->fetchOne("SELECT COUNT(*) as total FROM students WHERE sex = 'FEMALE'")['total'] ?? 0;

    // 3. Recent Announcements (limit 5)
    $announcements = $db->fetchAll(
        "SELECT a.*, c.name as class_name 
         FROM announcements a 
         LEFT JOIN classes c ON a.class_id = c.id 
         ORDER BY a.date DESC LIMIT 5"
    );

    // 4. Upcoming Events (limit 5)
    $events = $db->fetchAll(
        "SELECT e.*, c.name as class_name 
         FROM events e 
         LEFT JOIN classes c ON e.class_id = c.id 
         WHERE e.end_time >= NOW() - INTERVAL 7 DAY
         ORDER BY e.start_time ASC LIMIT 5"
    );

    // 5. Weekly Attendance Data
    $attendanceData = [
        ['name' => 'Mon', 'present' => 60, 'absent' => 40],
        ['name' => 'Tue', 'present' => 70, 'absent' => 60],
        ['name' => 'Wed', 'present' => 90, 'absent' => 75],
        ['name' => 'Thu', 'present' => 65, 'absent' => 55],
        ['name' => 'Fri', 'present' => 65, 'absent' => 55],
    ];

    // 6. Dynamic Finance Data (Fees as Income, Expenses as Expense)
    $selectedYear = isset($_GET['finance_year']) ? intval($_GET['finance_year']) : intval(date('Y'));
    $financeInfo = getFinanceChartData($db, $selectedYear);
    $financeData = $financeInfo['chart'];

    // User-specific schedule / calendar events
    $scheduleSql = "SELECT l.id, l.class_id, l.teacher_id, l.subject_id, l.name as title, l.day, l.start_time, l.end_time,
                           s.name as subject_name, c.name as class_name,
                           t.name as teacher_name, t.surname as teacher_surname
                    FROM lessons l
                    LEFT JOIN subjects s ON l.subject_id = s.id
                    LEFT JOIN classes c ON l.class_id = c.id
                    LEFT JOIN teachers t ON l.teacher_id = t.id";
    $scheduleParams = [];

    if ($role === 'teacher') {
        $scheduleSql .= " WHERE l.teacher_id = ?";
        $scheduleParams[] = $userId;
    } elseif ($role === 'student') {
        $student = $db->fetchOne("SELECT class_id FROM students WHERE id = ?", [$userId]);
        if ($student && !empty($student['class_id'])) {
            $scheduleSql .= " WHERE l.class_id = ?";
            $scheduleParams[] = $student['class_id'];
        } else {
            $scheduleSql .= " WHERE 1 = 0";
        }
    } elseif ($role === 'parent') {
        $scheduleSql .= " WHERE l.class_id IN (SELECT DISTINCT class_id FROM students WHERE parent_id = ?)";
        $scheduleParams[] = $userId;
    }
    $schedule = $db->fetchAll($scheduleSql, $scheduleParams);

    Response::success('Dashboard data retrieved successfully', [
        'counts' => [
            'students' => $studentCount,
            'teachers' => $teacherCount,
            'parents' => $parentCount,
            'staff' => $staffCount,
            'classes' => $classCount,
            'lessons' => $lessonCount
        ],
        'gender' => [
            'boys' => $boysCount,
            'girls' => $girlsCount,
            'total' => $boysCount + $girlsCount
        ],
        'announcements' => $announcements,
        'events' => $events,
        'attendance' => $attendanceData,
        'finance' => $financeData,
        'finance_summary' => $financeInfo,
        'schedule' => $schedule
    ]);

} catch (Exception $e) {
    Response::serverError($e->getMessage());
}

function getFinanceChartData($db, $targetYear = null) {
    if (!$targetYear || $targetYear < 2000 || $targetYear > 2100) {
        $targetYear = (int)date('Y');
    } else {
        $targetYear = (int)$targetYear;
    }

    $monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    $monthlyData = [];
    for ($m = 1; $m <= 12; $m++) {
        $monthlyData[$m] = [
            'name' => $monthNames[$m - 1],
            'month' => $m,
            'income' => 0.0,
            'expense' => 0.0,
            'profit' => 0.0
        ];
    }

    $totalIncome = 0.0;
    $totalExpense = 0.0;

    // 1. Calculate Fees as Income (Fees play the income role)
    try {
        $payments = $db->fetchAll(
            "SELECT MONTH(payment_date) as m, SUM(amount) as total 
             FROM fee_payments 
             WHERE YEAR(payment_date) = ? 
             GROUP BY MONTH(payment_date)",
            [$targetYear]
        );

        $hasPayments = false;
        if (!empty($payments)) {
            foreach ($payments as $p) {
                $m = (int)$p['m'];
                if ($m >= 1 && $m <= 12) {
                    $amt = (float)$p['total'];
                    $monthlyData[$m]['income'] += $amt;
                    $totalIncome += $amt;
                    if ($amt > 0) $hasPayments = true;
                }
            }
        }

        // If no fee_payments records exist for this year, check fee_invoices paid_amount
        if (!$hasPayments) {
            $invoices = $db->fetchAll(
                "SELECT MONTH(COALESCE(updated_at, created_at, due_date)) as m, SUM(paid_amount) as total 
                 FROM fee_invoices 
                 WHERE paid_amount > 0 AND YEAR(COALESCE(updated_at, created_at, due_date)) = ?
                 GROUP BY MONTH(COALESCE(updated_at, created_at, due_date))",
                [$targetYear]
            );
            if (!empty($invoices)) {
                foreach ($invoices as $inv) {
                    $m = (int)$inv['m'];
                    if ($m >= 1 && $m <= 12) {
                        $amt = (float)$inv['total'];
                        $monthlyData[$m]['income'] += $amt;
                        $totalIncome += $amt;
                    }
                }
            }
        }
    } catch (Exception $e) {
        error_log('Error calculating finance income from fees: ' . $e->getMessage());
    }

    // 2. Calculate Expenses
    try {
        $expenses = $db->fetchAll(
            "SELECT MONTH(COALESCE(paid_date, expense_date)) as m, SUM(amount) as total 
             FROM expenses 
             WHERE status != 'REJECTED' AND YEAR(COALESCE(paid_date, expense_date)) = ? 
             GROUP BY MONTH(COALESCE(paid_date, expense_date))",
            [$targetYear]
        );
        if (!empty($expenses)) {
            foreach ($expenses as $exp) {
                $m = (int)$exp['m'];
                if ($m >= 1 && $m <= 12) {
                    $amt = (float)$exp['total'];
                    $monthlyData[$m]['expense'] += $amt;
                    $totalExpense += $amt;
                }
            }
        }
    } catch (Exception $e) {
        error_log('Error calculating finance expenses: ' . $e->getMessage());
    }

    // Build finalized month list with profit calculation
    $chartList = [];
    for ($m = 1; $m <= 12; $m++) {
        $inc = round($monthlyData[$m]['income'], 2);
        $exp = round($monthlyData[$m]['expense'], 2);
        $chartList[] = [
            'name' => $monthlyData[$m]['name'],
            'month' => $m,
            'income' => $inc,
            'expense' => $exp,
            'profit' => round($inc - $exp, 2)
        ];
    }

    // Collect available years from payments, invoices, and expenses
    $currentYear = (int)date('Y');
    $yearsSet = [$currentYear];
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

    $years = array_values(array_unique($yearsSet));
    rsort($years);

    return [
        'year' => $targetYear,
        'available_years' => $years,
        'chart' => $chartList,
        'total_income' => round($totalIncome, 2),
        'total_expense' => round($totalExpense, 2),
        'net_balance' => round($totalIncome - $totalExpense, 2)
    ];
}

