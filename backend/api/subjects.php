<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            getSubject($db, $id);
        } else {
            getSubjects($db);
        }
        break;
        
    case 'POST':
        createSubject($db);
        break;
        
    case 'PUT':
        if (!$id) {
            Response::error('Subject ID is required');
        }
        updateSubject($db, $id);
        break;
        
    case 'DELETE':
        if (!$id) {
            Response::error('Subject ID is required');
        }
        deleteSubject($db, $id);
        break;
        
    default:
        Response::methodNotAllowed();
}

function getSubjects($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 10);
    $search = $_GET['search'] ?? '';
    
    $offset = ($page - 1) * $limit;
    
    // Build query
    $sql = "SELECT s.* FROM subjects s WHERE 1=1";
    $params = [];
    
    if (!empty($search)) {
        $sql .= " AND s.name LIKE ?";
        $searchTerm = "%{$search}%";
        $params[] = $searchTerm;
    }
    
    // Get total count
    $countSql = str_replace("SELECT s.*", "SELECT COUNT(*) as total", $sql);
    $totalResult = $db->fetchOne($countSql, $params);
    $total = $totalResult['total'];
    
    // Add pagination
    $sql .= " ORDER BY s.name ASC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $subjects = $db->fetchAll($sql, $params);
    
    // Add teacher count for each subject
    foreach ($subjects as &$subject) {
        $teacherCount = $db->fetchOne(
            "SELECT COUNT(*) as count FROM teacher_subjects WHERE subject_id = ?",
            [$subject['id']]
        );
        $subject['teacher_count'] = $teacherCount['count'];
    }
    
    Response::success('Subjects retrieved successfully', [
        'subjects' => $subjects,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

function getSubject($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $subject = $db->fetchOne("SELECT * FROM subjects WHERE id = ?", [$id]);
    
    if (!$subject) {
        Response::notFound('Subject not found');
    }
    
    // Get teachers for this subject
    $teachers = $db->fetchAll(
        "SELECT t.id, t.name, t.surname, t.email, t.phone 
         FROM teachers t 
         INNER JOIN teacher_subjects ts ON t.id = ts.teacher_id 
         WHERE ts.subject_id = ? 
         ORDER BY t.name",
        [$id]
    );
    
    // Get lessons for this subject
    $lessons = $db->fetchAll(
        "SELECT l.*, c.name as class_name, t.name as teacher_name, t.surname as teacher_surname 
         FROM lessons l 
         LEFT JOIN classes c ON l.class_id = c.id 
         LEFT JOIN teachers t ON l.teacher_id = t.id 
         WHERE l.subject_id = ? 
         ORDER BY l.day, l.start_time",
        [$id]
    );
    
    Response::success('Subject retrieved successfully', [
        'subject' => $subject,
        'teachers' => $teachers,
        'lessons' => $lessons
    ]);
}

function createSubject($db) {
    AuthMiddleware::requireRole('admin');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['name'])) {
        Response::error('Subject name is required');
    }
    
    try {
        $id = $db->insert('subjects', [
            'name' => $input['name']
        ]);
        
        $subject = $db->fetchOne("SELECT * FROM subjects WHERE id = ?", [$id]);
        
        Response::success('Subject created successfully', $subject, 201);
        
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            Response::error('Subject name already exists', 409);
        }
        Response::error('Failed to create subject: ' . $e->getMessage());
    }
}

function updateSubject($db, $id) {
    AuthMiddleware::requireRole('admin');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Check if subject exists
    $existing = $db->fetchOne("SELECT id FROM subjects WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Subject not found');
    }
    
    if (empty($input['name'])) {
        Response::error('Subject name is required');
    }
    
    try {
        $db->update('subjects', ['name' => $input['name']], 'id = ?', [$id]);
        
        $subject = $db->fetchOne("SELECT * FROM subjects WHERE id = ?", [$id]);
        
        Response::success('Subject updated successfully', $subject);
        
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            Response::error('Subject name already exists', 409);
        }
        Response::error('Failed to update subject: ' . $e->getMessage());
    }
}

function deleteSubject($db, $id) {
    AuthMiddleware::requireRole('admin');
    
    // Check if subject exists
    $existing = $db->fetchOne("SELECT id FROM subjects WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Subject not found');
    }
    
    // Check if subject has teachers
    $teacherCount = $db->fetchOne(
        "SELECT COUNT(*) as count FROM teacher_subjects WHERE subject_id = ?",
        [$id]
    );
    
    if ($teacherCount['count'] > 0) {
        Response::error('Cannot delete subject with associated teachers. Please remove the teacher associations first.');
    }
    
    // Check if subject has lessons
    $lessonCount = $db->fetchOne(
        "SELECT COUNT(*) as count FROM lessons WHERE subject_id = ?",
        [$id]
    );
    
    if ($lessonCount['count'] > 0) {
        Response::error('Cannot delete subject with associated lessons. Please delete the lessons first.');
    }
    
    try {
        $deleted = $db->delete('subjects', 'id = ?', [$id]);
        
        if ($deleted > 0) {
            Response::success('Subject deleted successfully');
        } else {
            Response::error('Failed to delete subject');
        }
        
    } catch (Exception $e) {
        Response::error('Failed to delete subject: ' . $e->getMessage());
    }
}
