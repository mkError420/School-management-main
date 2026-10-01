<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            getAssignment($db, $id);
        } else {
            getAssignments($db);
        }
        break;
        
    case 'POST':
        createAssignment($db);
        break;
        
    case 'PUT':
        if (!$id) {
            Response::error('Assignment ID is required');
        }
        updateAssignment($db, $id);
        break;
        
    case 'DELETE':
        if (!$id) {
            Response::error('Assignment ID is required');
        }
        deleteAssignment($db, $id);
        break;
        
    default:
        Response::methodNotAllowed();
}

function getAssignments($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 10);
    $search = $_GET['search'] ?? '';
    $lessonId = $_GET['lesson_id'] ?? '';
    $classId = $_GET['class_id'] ?? '';
    
    $offset = ($page - 1) * $limit;
    
    $sql = "SELECT a.*, l.name as lesson_name, s.name as subject_name, c.name as class_name,
                   t.name as teacher_name, t.surname as teacher_surname
            FROM assignments a
            LEFT JOIN lessons l ON a.lesson_id = l.id
            LEFT JOIN subjects s ON l.subject_id = s.id
            LEFT JOIN classes c ON l.class_id = c.id
            LEFT JOIN teachers t ON l.teacher_id = t.id
            WHERE 1=1";
    $params = [];

    if ($user['role'] === 'teacher') {
        $sql .= " AND l.teacher_id = ?";
        $params[] = $user['user_id'];
    } elseif ($user['role'] === 'student') {
        $sql .= " AND l.class_id = (SELECT class_id FROM students WHERE id = ?)";
        $params[] = $user['user_id'];
    } elseif ($user['role'] === 'parent') {
        $sql .= " AND l.class_id IN (SELECT class_id FROM students WHERE parent_id = ?)";
        $params[] = $user['user_id'];
    }
    
    if (!empty($search)) {
        $sql .= " AND (a.title LIKE ? OR s.name LIKE ? OR c.name LIKE ?)";
        $searchTerm = "%{$search}%";
        $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm]);
    }
    
    if (!empty($lessonId)) {
        $sql .= " AND a.lesson_id = ?";
        $params[] = $lessonId;
    }
    
    if (!empty($classId)) {
        $sql .= " AND l.class_id = ?";
        $params[] = $classId;
    }
    
    $countSql = "SELECT COUNT(*) as total FROM (" . $sql . ") as subquery";
    $totalResult = $db->fetchOne($countSql, $params);
    $total = $totalResult['total'] ?? 0;
    
    $sql .= " ORDER BY a.due_date DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $assignments = $db->fetchAll($sql, $params);
    
    Response::success('Assignments retrieved successfully', [
        'assignments' => $assignments,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

function getAssignment($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $assignment = $db->fetchOne(
        "SELECT a.*, l.name as lesson_name, s.name as subject_name, c.name as class_name,
                t.name as teacher_name, t.surname as teacher_surname
         FROM assignments a
         LEFT JOIN lessons l ON a.lesson_id = l.id
         LEFT JOIN subjects s ON l.subject_id = s.id
         LEFT JOIN classes c ON l.class_id = c.id
         LEFT JOIN teachers t ON l.teacher_id = t.id
         WHERE a.id = ?" . ($user['role'] === 'teacher' ? " AND l.teacher_id = ?" : ($user['role'] === 'student' ? " AND l.class_id = (SELECT class_id FROM students WHERE id = ?)" : ($user['role'] === 'parent' ? " AND l.class_id IN (SELECT class_id FROM students WHERE parent_id = ?)" : ""))),
        AuthMiddleware::isAdmin($user) ? [$id] : [$id, $user['user_id']]
    );
    
    if (!$assignment) {
        Response::notFound('Assignment not found');
    }
    
    Response::success('Assignment retrieved successfully', ['assignment' => $assignment]);
}

function createAssignment($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['title']) || empty($input['start_date']) || empty($input['due_date']) || empty($input['lesson_id'])) {
        Response::error('Title, start_date, due_date and lesson_id are required');
    }
    
    $assignmentId = $db->insert('assignments', [
        'title' => $input['title'],
        'start_date' => $input['start_date'],
        'due_date' => $input['due_date'],
        'lesson_id' => $input['lesson_id']
    ]);
    
    Response::success('Assignment created successfully', ['id' => $assignmentId], 201);
}

function updateAssignment($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    $input = json_decode(file_get_contents('php://input'), true);
    
    $assignment = $db->fetchOne("SELECT * FROM assignments WHERE id = ?", [$id]);
    if (!$assignment) {
        Response::notFound('Assignment not found');
    }
    
    $data = [];
    if (isset($input['title'])) $data['title'] = $input['title'];
    if (isset($input['start_date'])) $data['start_date'] = $input['start_date'];
    if (isset($input['due_date'])) $data['due_date'] = $input['due_date'];
    if (isset($input['lesson_id'])) $data['lesson_id'] = $input['lesson_id'];
    
    if (empty($data)) {
        Response::error('No fields provided to update');
    }
    
    $db->update('assignments', $data, 'id = ?', [$id]);
    Response::success('Assignment updated successfully');
}

function deleteAssignment($db, $id) {
    $user = AuthMiddleware::requireRole('admin');
    
    $assignment = $db->fetchOne("SELECT * FROM assignments WHERE id = ?", [$id]);
    if (!$assignment) {
        Response::notFound('Assignment not found');
    }
    
    $db->delete('assignments', 'id = ?', [$id]);
    Response::success('Assignment deleted successfully');
}
