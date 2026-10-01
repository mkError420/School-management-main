<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            getResult($db, $id);
        } else {
            getResults($db);
        }
        break;
        
    case 'POST':
        createResult($db);
        break;
        
    case 'PUT':
        if (!$id) {
            Response::error('Result ID is required');
        }
        updateResult($db, $id);
        break;
        
    case 'DELETE':
        if (!$id) {
            Response::error('Result ID is required');
        }
        deleteResult($db, $id);
        break;
        
    default:
        Response::methodNotAllowed();
}

function getResults($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 10);
    $search = $_GET['search'] ?? '';
    $studentId = $_GET['student_id'] ?? '';
    
    $offset = ($page - 1) * $limit;
    
    $sql = "SELECT r.*, 
                   st.name as student_name, st.surname as student_surname,
                   ex.title as exam_title, asg.title as assignment_title,
                   COALESCE(s_ex.name, s_asg.name) as subject_name,
                   COALESCE(c_ex.name, c_asg.name) as class_name,
                   COALESCE(t_ex.name, t_asg.name) as teacher_name,
                   COALESCE(t_ex.surname, t_asg.surname) as teacher_surname,
                   COALESCE(ex.start_time, asg.due_date) as date
            FROM results r
            INNER JOIN students st ON r.student_id = st.id
            LEFT JOIN exams ex ON r.exam_id = ex.id
            LEFT JOIN lessons l_ex ON ex.lesson_id = l_ex.id
            LEFT JOIN subjects s_ex ON l_ex.subject_id = s_ex.id
            LEFT JOIN classes c_ex ON l_ex.class_id = c_ex.id
            LEFT JOIN teachers t_ex ON l_ex.teacher_id = t_ex.id
            LEFT JOIN assignments asg ON r.assignment_id = asg.id
            LEFT JOIN lessons l_asg ON asg.lesson_id = l_asg.id
            LEFT JOIN subjects s_asg ON l_asg.subject_id = s_asg.id
            LEFT JOIN classes c_asg ON l_asg.class_id = c_asg.id
            LEFT JOIN teachers t_asg ON l_asg.teacher_id = t_asg.id
            WHERE 1=1";
    $params = [];
    
    if (!empty($search)) {
        $sql .= " AND (st.name LIKE ? OR st.surname LIKE ? OR ex.title LIKE ? OR asg.title LIKE ?)";
        $searchTerm = "%{$search}%";
        $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
    }
    
    if (!empty($studentId)) {
        $sql .= " AND r.student_id = ?";
        $params[] = $studentId;
    }
    
    $countSql = "SELECT COUNT(*) as total FROM (" . $sql . ") as subquery";
    $totalResult = $db->fetchOne($countSql, $params);
    $total = $totalResult['total'] ?? 0;
    
    $sql .= " ORDER BY r.id DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $results = $db->fetchAll($sql, $params);
    
    Response::success('Results retrieved successfully', [
        'results' => $results,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

function getResult($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $result = $db->fetchOne(
        "SELECT r.*, 
                st.name as student_name, st.surname as student_surname,
                ex.title as exam_title, asg.title as assignment_title
         FROM results r
         INNER JOIN students st ON r.student_id = st.id
         LEFT JOIN exams ex ON r.exam_id = ex.id
         LEFT JOIN assignments asg ON r.assignment_id = asg.id
         WHERE r.id = ?",
        [$id]
    );
    
    if (!$result) {
        Response::notFound('Result not found');
    }
    
    Response::success('Result retrieved successfully', ['result' => $result]);
}

function createResult($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['score']) || empty($input['student_id'])) {
        Response::error('Score and student_id are required');
    }
    
    $examId = !empty($input['exam_id']) ? $input['exam_id'] : null;
    $assignmentId = !empty($input['assignment_id']) ? $input['assignment_id'] : null;
    
    if (!$examId && !$assignmentId) {
        Response::error('Either exam_id or assignment_id must be provided');
    }
    
    $resultId = $db->insert('results', [
        'score' => intval($input['score']),
        'exam_id' => $examId,
        'assignment_id' => $assignmentId,
        'student_id' => $input['student_id']
    ]);
    
    Response::success('Result recorded successfully', ['id' => $resultId], 201);
}

function updateResult($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    $input = json_decode(file_get_contents('php://input'), true);
    
    $result = $db->fetchOne("SELECT * FROM results WHERE id = ?", [$id]);
    if (!$result) {
        Response::notFound('Result not found');
    }
    
    $data = [];
    if (isset($input['score'])) $data['score'] = intval($input['score']);
    if (array_key_exists('exam_id', $input)) $data['exam_id'] = $input['exam_id'] ?: null;
    if (array_key_exists('assignment_id', $input)) $data['assignment_id'] = $input['assignment_id'] ?: null;
    if (isset($input['student_id'])) $data['student_id'] = $input['student_id'];
    
    if (empty($data)) {
        Response::error('No fields provided to update');
    }
    
    $db->update('results', $data, 'id = ?', [$id]);
    Response::success('Result updated successfully');
}

function deleteResult($db, $id) {
    $user = AuthMiddleware::requireRole('admin');
    
    $result = $db->fetchOne("SELECT * FROM results WHERE id = ?", [$id]);
    if (!$result) {
        Response::notFound('Result not found');
    }
    
    $db->delete('results', 'id = ?', [$id]);
    Response::success('Result deleted successfully');
}
