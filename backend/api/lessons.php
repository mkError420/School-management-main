<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            getLesson($db, $id);
        } else {
            getLessons($db);
        }
        break;
        
    case 'POST':
        createLesson($db);
        break;
        
    case 'PUT':
        if (!$id) {
            Response::error('Lesson ID is required');
        }
        updateLesson($db, $id);
        break;
        
    case 'DELETE':
        if (!$id) {
            Response::error('Lesson ID is required');
        }
        deleteLesson($db, $id);
        break;
        
    default:
        Response::methodNotAllowed();
}

function getLessons($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 10);
    $search = $_GET['search'] ?? '';
    $classId = $_GET['class_id'] ?? '';
    $teacherId = $_GET['teacher_id'] ?? '';
    $subjectId = $_GET['subject_id'] ?? '';
    $day = $_GET['day'] ?? '';
    
    $offset = ($page - 1) * $limit;
    
    // Build query
    $sql = "SELECT l.*, s.name as subject_name, c.name as class_name, g.level as grade_level, 
            t.name as teacher_name, t.surname as teacher_surname 
            FROM lessons l 
            LEFT JOIN subjects s ON l.subject_id = s.id 
            LEFT JOIN classes c ON l.class_id = c.id 
            LEFT JOIN grades g ON c.grade_id = g.id 
            LEFT JOIN teachers t ON l.teacher_id = t.id 
            WHERE 1=1";
    $params = [];
    
    if (!empty($search)) {
        $sql .= " AND (l.name LIKE ? OR s.name LIKE ? OR c.name LIKE ?)";
        $searchTerm = "%{$search}%";
        $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm]);
    }
    
    if (!empty($classId)) {
        $sql .= " AND l.class_id = ?";
        $params[] = $classId;
    }
    
    if (!empty($teacherId)) {
        $sql .= " AND l.teacher_id = ?";
        $params[] = $teacherId;
    }
    
    if (!empty($subjectId)) {
        $sql .= " AND l.subject_id = ?";
        $params[] = $subjectId;
    }
    
    if (!empty($day)) {
        $sql .= " AND l.day = ?";
        $params[] = $day;
    }
    
    // Get total count
    $countSql = str_replace("SELECT l.*, s.name as subject_name, c.name as class_name, g.level as grade_level, t.name as teacher_name, t.surname as teacher_surname", "SELECT COUNT(*) as total", $sql);
    $totalResult = $db->fetchOne($countSql, $params);
    $total = $totalResult['total'];
    
    // Add pagination
    $sql .= " ORDER BY l.day, l.start_time LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $lessons = $db->fetchAll($sql, $params);
    
    Response::success('Lessons retrieved successfully', [
        'lessons' => $lessons,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

function getLesson($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $lesson = $db->fetchOne(
        "SELECT l.*, s.name as subject_name, c.name as class_name, g.level as grade_level, 
         t.name as teacher_name, t.surname as teacher_surname 
         FROM lessons l 
         LEFT JOIN subjects s ON l.subject_id = s.id 
         LEFT JOIN classes c ON l.class_id = c.id 
         LEFT JOIN grades g ON c.grade_id = g.id 
         LEFT JOIN teachers t ON l.teacher_id = t.id 
         WHERE l.id = ?",
        [$id]
    );
    
    if (!$lesson) {
        Response::notFound('Lesson not found');
    }
    
    // Get students in this lesson's class
    $students = $db->fetchAll(
        "SELECT s.*, p.name as parent_name, p.surname as parent_surname 
         FROM students s 
         LEFT JOIN parents p ON s.parent_id = p.id 
         WHERE s.class_id = ? 
         ORDER BY s.name",
        [$lesson['class_id']]
    );
    
    // Remove passwords from students
    foreach ($students as &$student) {
        unset($student['password']);
    }
    
    // Get attendance for this lesson
    $attendance = $db->fetchAll(
        "SELECT a.*, s.name as student_name, s.surname as student_surname 
         FROM attendance a 
         LEFT JOIN students s ON a.student_id = s.id 
         WHERE a.lesson_id = ? 
         ORDER BY s.name",
        [$id]
    );
    
    // Get exams for this lesson
    $exams = $db->fetchAll(
        "SELECT * FROM exams WHERE lesson_id = ? ORDER BY start_time",
        [$id]
    );
    
    // Get assignments for this lesson
    $assignments = $db->fetchAll(
        "SELECT * FROM assignments WHERE lesson_id = ? ORDER BY start_date",
        [$id]
    );
    
    Response::success('Lesson retrieved successfully', [
        'lesson' => $lesson,
        'students' => $students,
        'attendance' => $attendance,
        'exams' => $exams,
        'assignments' => $assignments
    ]);
}

function createLesson($db) {
    AuthMiddleware::requireRole('admin');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $required = ['name', 'day', 'start_time', 'end_time', 'subject_id', 'class_id', 'teacher_id'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            Response::error("Field '{$field}' is required");
        }
    }
    
    // Validate day
    $validDays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'];
    if (!in_array(strtoupper($input['day']), $validDays)) {
        Response::error('Invalid day. Must be one of: ' . implode(', ', $validDays));
    }
    
    try {
        $id = $db->insert('lessons', [
            'name' => $input['name'],
            'day' => strtoupper($input['day']),
            'start_time' => $input['start_time'],
            'end_time' => $input['end_time'],
            'subject_id' => $input['subject_id'],
            'class_id' => $input['class_id'],
            'teacher_id' => $input['teacher_id']
        ]);
        
        // Get the created lesson
        $lesson = $db->fetchOne(
            "SELECT l.*, s.name as subject_name, c.name as class_name, t.name as teacher_name, t.surname as teacher_surname 
             FROM lessons l 
             LEFT JOIN subjects s ON l.subject_id = s.id 
             LEFT JOIN classes c ON l.class_id = c.id 
             LEFT JOIN teachers t ON l.teacher_id = t.id 
             WHERE l.id = ?",
            [$id]
        );
        
        Response::success('Lesson created successfully', $lesson, 201);
        
    } catch (Exception $e) {
        Response::error('Failed to create lesson: ' . $e->getMessage());
    }
}

function updateLesson($db, $id) {
    AuthMiddleware::requireRole('admin');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Check if lesson exists
    $existing = $db->fetchOne("SELECT id FROM lessons WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Lesson not found');
    }
    
    $data = [];
    
    // Build update data
    $allowedFields = ['name', 'day', 'start_time', 'end_time', 'subject_id', 'class_id', 'teacher_id'];
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            // Validate day if provided
            if ($field === 'day') {
                $validDays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'];
                if (!in_array(strtoupper($input[$field]), $validDays)) {
                    Response::error('Invalid day. Must be one of: ' . implode(', ', $validDays));
                }
                $data[$field] = strtoupper($input[$field]);
            } else {
                $data[$field] = $input[$field];
            }
        }
    }
    
    if (empty($data)) {
        Response::error('No fields to update');
    }
    
    try {
        $db->update('lessons', $data, 'id = ?', [$id]);
        
        // Get updated lesson
        $lesson = $db->fetchOne(
            "SELECT l.*, s.name as subject_name, c.name as class_name, t.name as teacher_name, t.surname as teacher_surname 
             FROM lessons l 
             LEFT JOIN subjects s ON l.subject_id = s.id 
             LEFT JOIN classes c ON l.class_id = c.id 
             LEFT JOIN teachers t ON l.teacher_id = t.id 
             WHERE l.id = ?",
            [$id]
        );
        
        Response::success('Lesson updated successfully', $lesson);
        
    } catch (Exception $e) {
        Response::error('Failed to update lesson: ' . $e->getMessage());
    }
}

function deleteLesson($db, $id) {
    AuthMiddleware::requireRole('admin');
    
    // Check if lesson exists
    $existing = $db->fetchOne("SELECT id FROM lessons WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Lesson not found');
    }
    
    try {
        $deleted = $db->delete('lessons', 'id = ?', [$id]);
        
        if ($deleted > 0) {
            Response::success('Lesson deleted successfully');
        } else {
            Response::error('Failed to delete lesson');
        }
        
    } catch (Exception $e) {
        Response::error('Failed to delete lesson: ' . $e->getMessage());
    }
}
