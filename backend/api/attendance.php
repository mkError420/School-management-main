<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? '';

ensureAttendanceSchema($db);

switch ($method) {
    case 'GET':
        if ($action === 'spreadsheet' || $action === 'matrix') {
            getAttendanceSpreadsheet($db);
        } elseif ($id) {
            getAttendanceRecord($db, $id);
        } else {
            getAttendanceRecords($db);
        }
        break;
        
    case 'POST':
        markAttendance($db);
        break;
        
    case 'PUT':
        if (!$id) {
            Response::error('Attendance ID is required');
        }
        updateAttendance($db, $id);
        break;
        
    case 'DELETE':
        if (!$id) {
            Response::error('Attendance ID is required');
        }
        deleteAttendance($db, $id);
        break;
        
    default:
        Response::methodNotAllowed();
}

/**
 * Ensure optional columns exist in attendance table
 */
function ensureAttendanceSchema($db) {
    $columnsToAdd = [
        'notes'      => 'VARCHAR(255) NULL',
        'updated_at' => 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    ];
    foreach ($columnsToAdd as $col => $definition) {
        $exists = $db->fetchAll("SHOW COLUMNS FROM `attendance` LIKE '{$col}'");
        if (!$exists) {
            try {
                $db->query("ALTER TABLE `attendance` ADD COLUMN `{$col}` {$definition}");
            } catch (Exception $e) {
                // Ignore if already added concurrently
            }
        }
    }
}

/**
 * Resolve a fallback lesson_id to prevent FK constraint failures
 */
function resolveAttendanceLessonId($db, $classId = null, $studentId = null) {
    if (!empty($classId)) {
        $l = $db->fetchOne("SELECT id FROM lessons WHERE class_id = ? LIMIT 1", [$classId]);
        if ($l) return intval($l['id']);
    }
    if (!empty($studentId)) {
        $st = $db->fetchOne("SELECT class_id FROM students WHERE id = ?", [$studentId]);
        if ($st && !empty($st['class_id'])) {
            $l = $db->fetchOne("SELECT id FROM lessons WHERE class_id = ? LIMIT 1", [$st['class_id']]);
            if ($l) return intval($l['id']);
        }
    }
    $first = $db->fetchOne("SELECT id FROM lessons ORDER BY id ASC LIMIT 1");
    if ($first) return intval($first['id']);

    // Create a default general lesson if table is empty
    $firstSub = $db->fetchOne("SELECT id FROM subjects LIMIT 1");
    $subId = $firstSub ? $firstSub['id'] : 1;
    $firstTeach = $db->fetchOne("SELECT id FROM teachers LIMIT 1");
    $teachId = $firstTeach ? $firstTeach['id'] : 't1';
    $firstClass = $db->fetchOne("SELECT id FROM classes LIMIT 1");
    $cId = $firstClass ? $firstClass['id'] : 1;

    try {
        return intval($db->insert('lessons', [
            'name' => 'General Class Attendance',
            'day' => 'MONDAY',
            'start_time' => date('Y-m-d 09:00:00'),
            'end_time' => date('Y-m-d 10:00:00'),
            'subject_id' => $subId,
            'class_id' => $cId,
            'teacher_id' => $teachId
        ]));
    } catch (Exception $e) {
        return 1;
    }
}

/**
 * Monthly / Date-Range Attendance Spreadsheet (Matrix View)
 */
function getAttendanceSpreadsheet($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $classId = $_GET['class_id'] ?? '';
    $month = $_GET['month'] ?? date('Y-m'); // e.g. "2026-10"
    $search = trim($_GET['search'] ?? '');
    
    // Resolve start and end date for the selected period
    if (!empty($_GET['start_date']) && !empty($_GET['end_date'])) {
        $startDate = $_GET['start_date'];
        $endDate = $_GET['end_date'];
    } else {
        $parts = explode('-', $month);
        $year = intval($parts[0] ?? date('Y'));
        $m = intval($parts[1] ?? date('m'));
        $numDays = cal_days_in_month(CAL_GREGORIAN, $m, $year);
        $startDate = sprintf('%04d-%02d-01', $year, $m);
        $endDate = sprintf('%04d-%02d-%02d', $year, $m, $numDays);
    }
    
    // Build calendar dates list
    $dateList = [];
    $curr = strtotime($startDate);
    $last = strtotime($endDate);
    while ($curr <= $last) {
        $dStr = date('Y-m-d', $curr);
        $dayOfWeek = date('D', $curr); // Mon, Tue...
        $dayNum = date('j', $curr);    // 1, 2, 3...
        // Friday and Saturday are weekend in Bangladesh, Sunday is working
        $w = intval(date('w', $curr));
        $isWeekend = ($w === 5 || $w === 6);
        $dateList[] = [
            'date' => $dStr,
            'day_num' => $dayNum,
            'day_name' => $dayOfWeek,
            'is_weekend' => $isWeekend,
        ];
        $curr = strtotime('+1 day', $curr);
    }
    
    // Fetch students
    $stSql = "SELECT s.id, s.name, s.surname, s.username as roll, s.img, s.class_id, c.name as class_name 
              FROM students s 
              LEFT JOIN classes c ON s.class_id = c.id 
              WHERE 1=1";
    $stParams = [];
    
    if ($user['role'] === 'student') {
        $stSql .= " AND s.id = ?";
        $stParams[] = $user['user_id'];
    } elseif ($user['role'] === 'parent') {
        $stSql .= " AND s.parent_id = ?";
        $stParams[] = $user['user_id'];
    } elseif (!empty($classId) && $classId !== 'all') {
        $stSql .= " AND s.class_id = ?";
        $stParams[] = $classId;
    }
    
    if (!empty($search)) {
        $stSql .= " AND (s.name LIKE ? OR s.surname LIKE ? OR s.username LIKE ?)";
        $searchTerm = "%{$search}%";
        $stParams = array_merge($stParams, [$searchTerm, $searchTerm, $searchTerm]);
    }
    
    $stSql .= " ORDER BY CAST(s.username AS UNSIGNED) ASC, s.name ASC";
    $students = $db->fetchAll($stSql, $stParams);
    
    if (empty($students)) {
        Response::success('Spreadsheet data retrieved', [
            'dates' => $dateList,
            'students' => [],
            'matrix' => new stdClass(),
            'student_stats' => new stdClass(),
            'date_stats' => new stdClass(),
            'overall' => ['total_marked' => 0, 'present' => 0, 'absent' => 0, 'rate' => 0]
        ]);
        return;
    }
    
    $studentIds = array_column($students, 'id');
    $placeholders = implode(',', array_fill(0, count($studentIds), '?'));
    
    // Fetch attendance records for students in date range
    $attSql = "SELECT a.id, a.student_id, a.date, a.present, a.lesson_id, 
                      COALESCE(a.notes, '') as notes,
                      l.name as lesson_name
               FROM attendance a
               LEFT JOIN lessons l ON a.lesson_id = l.id
               WHERE a.student_id IN ($placeholders)
                 AND a.date >= ? AND a.date <= ?";
    $attParams = array_merge($studentIds, [$startDate, $endDate]);
    $records = $db->fetchAll($attSql, $attParams);
    
    // Build matrix [student_id][date]
    $matrix = [];
    foreach ($records as $r) {
        $sId = $r['student_id'];
        $d = $r['date'];
        $matrix[$sId][$d] = [
            'id' => $r['id'],
            'present' => intval($r['present']) == 1,
            'notes' => $r['notes'],
            'lesson_id' => $r['lesson_id'],
            'lesson_name' => $r['lesson_name'] ?? '',
        ];
    }
    
    // Compute student stats & date stats
    $studentStats = [];
    $dateStats = [];
    foreach ($dateList as $dItem) {
        $dateStats[$dItem['date']] = ['present' => 0, 'absent' => 0, 'total' => 0, 'rate' => 0];
    }
    
    $totalOverallPresent = 0;
    $totalOverallMarked = 0;
    
    foreach ($students as $st) {
        $sId = $st['id'];
        $pCount = 0;
        $aCount = 0;
        $markedCount = 0;
        
        foreach ($dateList as $dItem) {
            $d = $dItem['date'];
            if (isset($matrix[$sId][$d])) {
                $isPres = $matrix[$sId][$d]['present'];
                $markedCount++;
                if ($isPres) {
                    $pCount++;
                    $dateStats[$d]['present']++;
                } else {
                    $aCount++;
                    $dateStats[$d]['absent']++;
                }
                $dateStats[$d]['total']++;
            }
        }
        
        $rate = $markedCount > 0 ? round(($pCount / $markedCount) * 100, 1) : 0;
        $studentStats[$sId] = [
            'present' => $pCount,
            'absent' => $aCount,
            'total_marked' => $markedCount,
            'rate' => $rate,
        ];
        
        $totalOverallPresent += $pCount;
        $totalOverallMarked += $markedCount;
    }
    
    // Compute date-wise percentage
    foreach ($dateList as $dItem) {
        $d = $dItem['date'];
        $dTot = $dateStats[$d]['total'];
        $dPres = $dateStats[$d]['present'];
        $dateStats[$d]['rate'] = $dTot > 0 ? round(($dPres / $dTot) * 100, 1) : 0;
    }
    
    $overallRate = $totalOverallMarked > 0 ? round(($totalOverallPresent / $totalOverallMarked) * 100, 1) : 0;
    
    Response::success('Spreadsheet data retrieved successfully', [
        'dates' => $dateList,
        'students' => $students,
        'matrix' => $matrix,
        'student_stats' => $studentStats,
        'date_stats' => $dateStats,
        'overall' => [
            'total_marked' => $totalOverallMarked,
            'present' => $totalOverallPresent,
            'absent' => $totalOverallMarked - $totalOverallPresent,
            'rate' => $overallRate,
        ]
    ]);
}

/**
 * Standard log list of attendance records
 */
function getAttendanceRecords($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 10);
    $search = $_GET['search'] ?? '';
    $studentId = $_GET['student_id'] ?? '';
    $classId = $_GET['class_id'] ?? '';
    $lessonId = $_GET['lesson_id'] ?? '';
    $status = $_GET['status'] ?? '';
    $date = $_GET['date'] ?? '';
    $startDate = $_GET['start_date'] ?? '';
    $endDate = $_GET['end_date'] ?? '';
    
    $offset = ($page - 1) * $limit;
    
    $sql = "SELECT a.*, 
                   st.name as student_name, st.surname as student_surname, st.img as student_img,
                   st.username as student_roll,
                   COALESCE(st.class_id, l.class_id) as student_class_id,
                   l.name as lesson_name, s.name as subject_name,
                   COALESCE(c.name, sc.name) as class_name,
                   t.name as teacher_name, t.surname as teacher_surname
            FROM attendance a
            INNER JOIN students st ON a.student_id = st.id
            LEFT JOIN lessons l ON a.lesson_id = l.id
            LEFT JOIN subjects s ON l.subject_id = s.id
            LEFT JOIN classes c ON l.class_id = c.id
            LEFT JOIN classes sc ON st.class_id = sc.id
            LEFT JOIN teachers t ON l.teacher_id = t.id
            WHERE 1=1";
    $params = [];

    if ($user['role'] === 'student') {
        $sql .= " AND a.student_id = ?";
        $params[] = $user['user_id'];
    } elseif ($user['role'] === 'parent') {
        $sql .= " AND st.parent_id = ?";
        $params[] = $user['user_id'];
    } elseif ($user['role'] === 'teacher') {
        $sql .= " AND l.teacher_id = ?";
        $params[] = $user['user_id'];
    }
    
    if (!empty($search)) {
        $sql .= " AND (st.name LIKE ? OR st.surname LIKE ? OR st.username LIKE ? OR l.name LIKE ? OR c.name LIKE ? OR sc.name LIKE ?)";
        $searchTerm = "%{$search}%";
        $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm]);
    }
    
    if (!empty($studentId) && $studentId !== 'all') {
        $sql .= " AND a.student_id = ?";
        $params[] = $studentId;
    }

    if (!empty($classId) && $classId !== 'all') {
        $sql .= " AND (l.class_id = ? OR st.class_id = ?)";
        $params[] = $classId;
        $params[] = $classId;
    }

    if (!empty($lessonId) && $lessonId !== 'all') {
        $sql .= " AND a.lesson_id = ?";
        $params[] = $lessonId;
    }

    if ($status === 'present') {
        $sql .= " AND a.present = 1";
    } elseif ($status === 'absent') {
        $sql .= " AND a.present = 0";
    }
    
    if (!empty($date)) {
        $sql .= " AND a.date = ?";
        $params[] = $date;
    }

    if (!empty($startDate)) {
        $sql .= " AND a.date >= ?";
        $params[] = $startDate;
    }

    if (!empty($endDate)) {
        $sql .= " AND a.date <= ?";
        $params[] = $endDate;
    }
    
    $countSql = "SELECT COUNT(*) as total FROM (" . $sql . ") as subquery";
    $totalResult = $db->fetchOne($countSql, $params);
    $total = $totalResult['total'] ?? 0;

    // Calculate present and absent counts for filtered query
    $summarySql = "SELECT 
                      SUM(CASE WHEN sub.present = 1 THEN 1 ELSE 0 END) as present_count,
                      SUM(CASE WHEN sub.present = 0 THEN 1 ELSE 0 END) as absent_count
                   FROM (" . $sql . ") as sub";
    $summaryResult = $db->fetchOne($summarySql, $params);
    $presentCount = intval($summaryResult['present_count'] ?? 0);
    $absentCount = intval($summaryResult['absent_count'] ?? 0);
    
    $sql .= " ORDER BY a.date DESC, a.id DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $records = $db->fetchAll($sql, $params);
    
    Response::success('Attendance records retrieved successfully', [
        'attendance' => $records,
        'summary' => [
            'total' => $total,
            'present' => $presentCount,
            'absent' => $absentCount,
            'rate' => $total > 0 ? round(($presentCount / $total) * 100, 1) : 0,
        ],
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

function getAttendanceRecord($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $record = $db->fetchOne(
        "SELECT a.*, st.name as student_name, st.surname as student_surname, st.img as student_img,
                l.name as lesson_name, s.name as subject_name,
                COALESCE(c.name, sc.name) as class_name
         FROM attendance a
         INNER JOIN students st ON a.student_id = st.id
         LEFT JOIN lessons l ON a.lesson_id = l.id
         LEFT JOIN subjects s ON l.subject_id = s.id
         LEFT JOIN classes c ON l.class_id = c.id
         LEFT JOIN classes sc ON st.class_id = sc.id
         WHERE a.id = ?" . ($user['role'] === 'student' ? " AND st.id = ?" : ($user['role'] === 'parent' ? " AND st.parent_id = ?" : ($user['role'] === 'teacher' ? " AND l.teacher_id = ?" : ""))),
        AuthMiddleware::isAdmin($user)
            ? [$id]
            : [$id, $user['user_id']]
    );
    
    if (!$record) {
        Response::notFound('Attendance record not found');
    }
    
    Response::success('Attendance record retrieved successfully', ['attendance' => $record]);
}

/**
 * Mark Attendance (Single cell toggle, or batch array)
 */
function markAttendance($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input)) {
        Response::error('No payload provided');
    }

    // Support batch / roll-call / spreadsheet array
    $batch = [];
    if (!empty($input['batch']) && is_array($input['batch'])) {
        $batch = $input['batch'];
    } elseif (!empty($input['records']) && is_array($input['records'])) {
        $defaultDate = $input['date'] ?? date('Y-m-d');
        $defaultLessonId = $input['lesson_id'] ?? null;
        foreach ($input['records'] as $r) {
            $batch[] = [
                'student_id' => $r['student_id'] ?? null,
                'lesson_id' => $r['lesson_id'] ?? $defaultLessonId,
                'date' => $r['date'] ?? $defaultDate,
                'present' => !empty($r['present']) ? 1 : 0,
                'notes' => $r['notes'] ?? ''
            ];
        }
    }

    if (!empty($batch)) {
        $saved = 0;
        $defaultLesson = resolveAttendanceLessonId($db, $input['class_id'] ?? null);
        $sql = "INSERT INTO attendance (date, present, student_id, lesson_id, notes)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE present = VALUES(present), notes = VALUES(notes)";
        foreach ($batch as $item) {
            $sId = $item['student_id'] ?? null;
            $d = $item['date'] ?? ($input['date'] ?? date('Y-m-d'));
            $lId = !empty($item['lesson_id']) ? intval($item['lesson_id']) : $defaultLesson;
            $pres = !empty($item['present']) ? 1 : 0;
            $notes = $item['notes'] ?? '';
            
            if (!empty($sId) && !empty($d)) {
                $db->query($sql, [$d, $pres, $sId, $lId, $notes]);
                $saved++;
            }
        }
        Response::success("Saved attendance for {$saved} record(s)", ['saved' => $saved], 201);
        return;
    }
    
    // Single cell marking
    if (empty($input['date']) || empty($input['student_id'])) {
        Response::error('Date and student_id are required');
    }
    
    $studentId = $input['student_id'];
    $date = $input['date'];
    $lessonId = !empty($input['lesson_id']) ? intval($input['lesson_id']) : resolveAttendanceLessonId($db, $input['class_id'] ?? null, $studentId);
    $present = isset($input['present']) ? ($input['present'] ? 1 : 0) : 1;
    $notes = $input['notes'] ?? '';
    
    // Insert or update on duplicate key
    $sql = "INSERT INTO attendance (date, present, student_id, lesson_id, notes)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE present = VALUES(present), notes = VALUES(notes)";
    $db->query($sql, [$date, $present, $studentId, $lessonId, $notes]);
    
    Response::success('Attendance recorded successfully', [
        'student_id' => $studentId,
        'date' => $date,
        'present' => $present,
        'lesson_id' => $lessonId,
        'notes' => $notes,
    ], 201);
}

function updateAttendance($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    $input = json_decode(file_get_contents('php://input'), true);
    
    $record = $db->fetchOne("SELECT * FROM attendance WHERE id = ?", [$id]);
    if (!$record) {
        Response::notFound('Attendance record not found');
    }
    
    $data = [];
    if (isset($input['date'])) $data['date'] = $input['date'];
    if (isset($input['present'])) $data['present'] = $input['present'] ? 1 : 0;
    if (isset($input['student_id'])) $data['student_id'] = $input['student_id'];
    if (isset($input['lesson_id'])) $data['lesson_id'] = $input['lesson_id'];
    if (isset($input['notes'])) $data['notes'] = $input['notes'];
    
    if (empty($data)) {
        Response::error('No fields provided to update');
    }
    
    $db->update('attendance', $data, 'id = ?', [$id]);
    Response::success('Attendance updated successfully');
}

function deleteAttendance($db, $id) {
    $user = AuthMiddleware::requireRole('admin');
    
    $record = $db->fetchOne("SELECT * FROM attendance WHERE id = ?", [$id]);
    if (!$record) {
        Response::notFound('Attendance record not found');
    }
    
    $db->delete('attendance', 'id = ?', [$id]);
    Response::success('Attendance record deleted successfully');
}
