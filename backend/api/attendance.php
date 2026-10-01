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
    $date = $_GET['date'] ?? '';
    
    $offset = ($page - 1) * $limit;
    
    $sql = "SELECT a.*, 
                   st.name as student_name, st.surname as student_surname,
                   l.name as lesson_name, s.name as subject_name, c.name as class_name,
                   t.name as teacher_name, t.surname as teacher_surname
            FROM attendance a
            INNER JOIN students st ON a.student_id = st.id
            LEFT JOIN lessons l ON a.lesson_id = l.id
            LEFT JOIN subjects s ON l.subject_id = s.id
            LEFT JOIN classes c ON l.class_id = c.id
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
        $sql .= " AND (st.name LIKE ? OR st.surname LIKE ? OR l.name LIKE ?)";
        $searchTerm = "%{$search}%";
        $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm]);
    }
    
    if (!empty($studentId)) {
        $sql .= " AND a.student_id = ?";
        $params[] = $studentId;
    }
    
    if (!empty($date)) {
        $sql .= " AND a.date = ?";
        $params[] = $date;
    }
    
    $countSql = "SELECT COUNT(*) as total FROM (" . $sql . ") as subquery";
    $totalResult = $db->fetchOne($countSql, $params);
    $total = $totalResult['total'] ?? 0;
    
    $sql .= " ORDER BY a.date DESC, a.id DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $records = $db->fetchAll($sql, $params);
    
    Response::success('Attendance records retrieved successfully', [
        'attendance' => $records,
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
        "SELECT a.*, st.name as student_name, st.surname as student_surname,
                l.name as lesson_name, s.name as subject_name, c.name as class_name
         FROM attendance a
         INNER JOIN students st ON a.student_id = st.id
         LEFT JOIN lessons l ON a.lesson_id = l.id
         LEFT JOIN subjects s ON l.subject_id = s.id
         LEFT JOIN classes c ON l.class_id = c.id
         WHERE a.id = ?" . ($user['role'] === 'student' ? " AND st.id = ?" : ($user['role'] === 'parent' ? " AND st.parent_id = ?" : ($user['role'] === 'teacher' ? " AND l.teacher_id = ?" : ""))),
        $user['role'] === 'admin'
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
