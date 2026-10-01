<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    Response::methodNotAllowed();
}

$user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
$role = $user['role'];
$userId = $user['user_id'];

try {
    // 1. Core metrics for Admin
    $studentCount = $db->fetchOne("SELECT COUNT(*) as total FROM students")['total'] ?? 0;
    $teacherCount = $db->fetchOne("SELECT COUNT(*) as total FROM teachers")['total'] ?? 0;
    $parentCount = $db->fetchOne("SELECT COUNT(*) as total FROM parents")['total'] ?? 0;
    $adminCount = $db->fetchOne("SELECT COUNT(*) as total FROM admins")['total'] ?? 0;
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

    // 6. Finance Data (monthly income/expense)
    $financeData = [
        ['name' => 'Jan', 'income' => 4000, 'expense' => 2400],
        ['name' => 'Feb', 'income' => 3000, 'expense' => 1398],
        ['name' => 'Mar', 'income' => 2000, 'expense' => 9800],
        ['name' => 'Apr', 'income' => 2780, 'expense' => 3908],
        ['name' => 'May', 'income' => 1890, 'expense' => 4800],
        ['name' => 'Jun', 'income' => 2390, 'expense' => 3800],
        ['name' => 'Jul', 'income' => 3490, 'expense' => 4300],
        ['name' => 'Aug', 'income' => 3490, 'expense' => 4300],
        ['name' => 'Sep', 'income' => 3490, 'expense' => 4300],
        ['name' => 'Oct', 'income' => 3490, 'expense' => 4300],
        ['name' => 'Nov', 'income' => 3490, 'expense' => 4300],
        ['name' => 'Dec', 'income' => 3490, 'expense' => 4300],
    ];

    // User-specific schedule / calendar events
    $scheduleSql = "SELECT l.id, l.class_id, l.teacher_id, l.name as title, l.day, l.start_time, l.end_time,
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
            'staff' => $adminCount,
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
        'schedule' => $schedule
    ]);

} catch (Exception $e) {
    Response::serverError($e->getMessage());
}
