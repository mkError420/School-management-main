<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            getExam($db, $id);
        } else {
            getExams($db);
        }
        break;
        
    case 'POST':
        createExam($db);
        break;
        
    case 'PUT':
        if (!$id) {
            Response::error('Exam ID is required');
        }
        updateExam($db, $id);
        break;
        
    case 'DELETE':
        if (!$id) {
            Response::error('Exam ID is required');
        }
        deleteExam($db, $id);
        break;
        
    default:
        Response::methodNotAllowed();
}

function getExams($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 10);
    $search = $_GET['search'] ?? '';
    $lessonId = $_GET['lesson_id'] ?? '';
    $classId = $_GET['class_id'] ?? '';
    
    $offset = ($page - 1) * $limit;
    
    // Build query
    $sql = "SELECT e.*, l.name as lesson_name, l.day as lesson_day, s.name as subject_name, 
            c.name as class_name, t.name as teacher_name, t.surname as teacher_surname 
            FROM exams e 
            LEFT JOIN lessons l ON e.lesson_id = l.id 
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
        $sql .= " AND (e.title LIKE ? OR s.name LIKE ? OR c.name LIKE ?)";
        $searchTerm = "%{$search}%";
        $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm]);
    }
    
    if (!empty($lessonId)) {
        $sql .= " AND e.lesson_id = ?";
        $params[] = $lessonId;
    }
    
    if (!empty($classId)) {
        $sql .= " AND c.id = ?";
        $params[] = $classId;
    }
    
    // Get total count
    $countSql = str_replace("SELECT e.*, l.name as lesson_name, l.day as lesson_day, s.name as subject_name, c.name as class_name, t.name as teacher_name, t.surname as teacher_surname", "SELECT COUNT(*) as total", $sql);
    $totalResult = $db->fetchOne($countSql, $params);
    $total = $totalResult['total'];
    
    // Add pagination
    $sql .= " ORDER BY e.start_time DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $exams = $db->fetchAll($sql, $params);
    
    Response::success('Exams retrieved successfully', [
        'exams' => $exams,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

function getExam($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $exam = $db->fetchOne(
        "SELECT e.*, l.name as lesson_name, l.day as lesson_day, s.name as subject_name, 
         c.name as class_name, c.id as class_id, g.level as grade_level,
         l.teacher_id, t.name as teacher_name, t.surname as teacher_surname
         FROM exams e 
         LEFT JOIN lessons l ON e.lesson_id = l.id 
         LEFT JOIN subjects s ON l.subject_id = s.id 
         LEFT JOIN classes c ON l.class_id = c.id 
         LEFT JOIN grades g ON c.grade_id = g.id 
         LEFT JOIN teachers t ON l.teacher_id = t.id 
         WHERE e.id = ?",
        [$id]
    );
    
    if (!$exam) {
        Response::notFound('Exam not found');
    }

    if ($user['role'] === 'teacher' && $exam['teacher_id'] !== $user['user_id']) {
        Response::forbidden('You can only view exams for your lessons');
    }
    if ($user['role'] === 'student') {
        $studentInClass = $db->fetchOne(
            "SELECT id FROM students WHERE id = ? AND class_id = ?",
            [$user['user_id'], $exam['class_id']]
        );
        if (!$studentInClass) {
            Response::forbidden('You can only view exams for your class');
        }
    }
    if ($user['role'] === 'parent') {
        $childInClass = $db->fetchOne(
            "SELECT id FROM students WHERE parent_id = ? AND class_id = ? LIMIT 1",
            [$user['user_id'], $exam['class_id']]
        );
        if (!$childInClass) {
            Response::forbidden('You can only view exams for your children');
        }
    }
    
    // Get results for this exam
    $results = $db->fetchAll(
        "SELECT r.*, s.name as student_name, s.surname as student_surname, s.username as student_username 
         FROM results r 
         LEFT JOIN students s ON r.student_id = s.id 
         WHERE r.exam_id = ?" . ($user['role'] === 'student' ? " AND s.id = ?" : ($user['role'] === 'parent' ? " AND s.parent_id = ?" : "")) . "
         ORDER BY s.name",
        in_array($user['role'], ['student', 'parent'], true) ? [$id, $user['user_id']] : [$id]
    );
    
    // Get students in the exam's class
    $students = $db->fetchAll(
        "SELECT s.*, p.name as parent_name, p.surname as parent_surname 
         FROM students s 
         LEFT JOIN parents p ON s.parent_id = p.id 
         WHERE s.class_id = ? 
         " . ($user['role'] === 'student' ? "AND s.id = ?" : ($user['role'] === 'parent' ? "AND s.parent_id = ?" : "")) . "
         ORDER BY s.name",
        in_array($user['role'], ['student', 'parent'], true)
            ? [$exam['class_id'], $user['user_id']]
            : [$exam['class_id']]
    );
    
    // Remove passwords from students
    foreach ($students as &$student) {
        unset($student['password']);
    }
    
    Response::success('Exam retrieved successfully', [
        'exam' => $exam,
        'results' => $results,
        'students' => $students
    ]);
}

function createExam($db) {
    AuthMiddleware::requireRole('admin');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $required = ['title', 'start_time', 'end_time', 'lesson_id'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            Response::error("Field '{$field}' is required");
        }
    }
    
    try {
        $id = $db->insert('exams', [
            'title' => $input['title'],
            'start_time' => $input['start_time'],
            'end_time' => $input['end_time'],
            'lesson_id' => $input['lesson_id']
        ]);
        
        // Get the created exam
        $exam = $db->fetchOne(
            "SELECT e.*, l.name as lesson_name, s.name as subject_name, c.name as class_name, t.name as teacher_name, t.surname as teacher_surname 
             FROM exams e 
             LEFT JOIN lessons l ON e.lesson_id = l.id 
             LEFT JOIN subjects s ON l.subject_id = s.id 
             LEFT JOIN classes c ON l.class_id = c.id 
             LEFT JOIN teachers t ON l.teacher_id = t.id 
             WHERE e.id = ?",
            [$id]
        );
        
        Response::success('Exam created successfully', $exam, 201);
        
    } catch (Exception $e) {
        Response::error('Failed to create exam: ' . $e->getMessage());
    }
}

function updateExam($db, $id) {
    AuthMiddleware::requireRole('admin');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Check if exam exists
    $existing = $db->fetchOne("SELECT id FROM exams WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Exam not found');
    }
    
    $data = [];
    
    // Build update data
    $allowedFields = ['title', 'start_time', 'end_time', 'lesson_id'];
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $data[$field] = $input[$field];
        }
    }
    
    if (empty($data)) {
        Response::error('No fields to update');
    }
    
    try {
        $db->update('exams', $data, 'id = ?', [$id]);
        
        // Get updated exam
        $exam = $db->fetchOne(
            "SELECT e.*, l.name as lesson_name, s.name as subject_name, c.name as class_name, t.name as teacher_name, t.surname as teacher_surname 
             FROM exams e 
             LEFT JOIN lessons l ON e.lesson_id = l.id 
             LEFT JOIN subjects s ON l.subject_id = s.id 
             LEFT JOIN classes c ON l.class_id = c.id 
             LEFT JOIN teachers t ON l.teacher_id = t.id 
             WHERE e.id = ?",
            [$id]
        );
        
        Response::success('Exam updated successfully', $exam);
        
    } catch (Exception $e) {
        Response::error('Failed to update exam: ' . $e->getMessage());
    }
}

function deleteExam($db, $id) {
    AuthMiddleware::requireRole('admin');
    
    // Check if exam exists
    $existing = $db->fetchOne("SELECT id FROM exams WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Exam not found');
    }
    
    try {
        $deleted = $db->delete('exams', 'id = ?', [$id]);
        
        if ($deleted > 0) {
            Response::success('Exam deleted successfully');
        } else {
            Response::error('Failed to delete exam');
        }
        
    } catch (Exception $e) {
        Response::error('Failed to delete exam: ' . $e->getMessage());
    }
}
