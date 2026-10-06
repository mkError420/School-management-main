<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
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
        $sql .= " AND (st.name LIKE ? OR st.surname LIKE ? OR l.name LIKE ? OR c.name LIKE ? OR sc.name LIKE ?)";
        $searchTerm = "%{$search}%";
        $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm]);
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

function markAttendance($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input)) {
        Response::error('No payload provided');
    }

    // Support batch / roll-call array
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
                'present' => !empty($r['present']) ? 1 : 0
            ];
        }
    }

    if (!empty($batch)) {
        $saved = 0;
        $sql = "INSERT INTO attendance (date, present, student_id, lesson_id)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE present = VALUES(present)";
        foreach ($batch as $item) {
            if (!empty($item['student_id']) && !empty($item['lesson_id']) && !empty($item['date'])) {
                $present = !empty($item['present']) ? 1 : 0;
                $db->query($sql, [$item['date'], $present, $item['student_id'], $item['lesson_id']]);
                $saved++;
            }
        }
        Response::success("Saved attendance for {$saved} record(s)", ['saved' => $saved], 201);
    }
    
    if (empty($input['date']) || empty($input['student_id']) || empty($input['lesson_id'])) {
        Response::error('Date, student_id and lesson_id are required');
    }
    
    $present = isset($input['present']) ? ($input['present'] ? 1 : 0) : 1;
    
    // Insert or update on duplicate key
    $sql = "INSERT INTO attendance (date, present, student_id, lesson_id)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE present = VALUES(present)";
    $db->query($sql, [$input['date'], $present, $input['student_id'], $input['lesson_id']]);
    
    Response::success('Attendance recorded successfully', null, 201);
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
