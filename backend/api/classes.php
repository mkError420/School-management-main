<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            getClass($db, $id);
        } else {
            getClasses($db);
        }
        break;
        
    case 'POST':
        createClass($db);
        break;
        
    case 'PUT':
        if (!$id) {
            Response::error('Class ID is required');
        }
        updateClass($db, $id);
        break;
        
    case 'DELETE':
        if (!$id) {
            Response::error('Class ID is required');
        }
        deleteClass($db, $id);
        break;
        
    default:
        Response::methodNotAllowed();
}

function getClasses($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 10);
    $search = $_GET['search'] ?? '';
    $gradeId = $_GET['grade_id'] ?? '';
    
    $offset = ($page - 1) * $limit;
    
    // Build query
    $sql = "SELECT c.*, g.level as grade_level, t.name as supervisor_name, t.surname as supervisor_surname 
            FROM classes c 
            LEFT JOIN grades g ON c.grade_id = g.id 
            LEFT JOIN teachers t ON c.supervisor_id = t.id 
            WHERE 1=1";
    $params = [];
    
    if (!empty($search)) {
        $sql .= " AND c.name LIKE ?";
        $searchTerm = "%{$search}%";
        $params[] = $searchTerm;
    }
    
    if (!empty($gradeId)) {
        $sql .= " AND c.grade_id = ?";
        $params[] = $gradeId;
    }
    
    // Get total count
    $countSql = str_replace("SELECT c.*, g.level as grade_level, t.name as supervisor_name, t.surname as supervisor_surname", "SELECT COUNT(*) as total", $sql);
    $totalResult = $db->fetchOne($countSql, $params);
    $total = $totalResult['total'];
    
    // Add pagination
    $sql .= " ORDER BY c.name ASC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $classes = $db->fetchAll($sql, $params);
    
    // Add student count for each class
    foreach ($classes as &$class) {
        $studentCount = $db->fetchOne(
            "SELECT COUNT(*) as count FROM students WHERE class_id = ?",
            [$class['id']]
        );
        $class['student_count'] = $studentCount['count'];
    }
    
    Response::success('Classes retrieved successfully', [
        'classes' => $classes,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

function getClass($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $class = $db->fetchOne(
        "SELECT c.*, g.level as grade_level, t.name as supervisor_name, t.surname as supervisor_surname 
         FROM classes c 
         LEFT JOIN grades g ON c.grade_id = g.id 
         LEFT JOIN teachers t ON c.supervisor_id = t.id 
         WHERE c.id = ?",
        [$id]
    );
    
    if (!$class) {
        Response::notFound('Class not found');
    }
    
    // Get students in this class
    $students = $db->fetchAll(
        "SELECT s.*, p.name as parent_name, p.surname as parent_surname 
         FROM students s 
         LEFT JOIN parents p ON s.parent_id = p.id 
         WHERE s.class_id = ? 
         ORDER BY s.name",
        [$id]
    );
    
    // Remove passwords from students
    foreach ($students as &$student) {
        unset($student['password']);
    }
    
    // Get lessons for this class
    $lessons = $db->fetchAll(
        "SELECT l.*, s.name as subject_name, t.name as teacher_name, t.surname as teacher_surname 
         FROM lessons l 
         LEFT JOIN subjects s ON l.subject_id = s.id 
         LEFT JOIN teachers t ON l.teacher_id = t.id 
         WHERE l.class_id = ? 
         ORDER BY l.day, l.start_time",
        [$id]
    );
    
    // Get events for this class
    $events = $db->fetchAll(
        "SELECT * FROM events WHERE class_id = ? ORDER BY start_time",
        [$id]
    );
    
    // Get announcements for this class
    $announcements = $db->fetchAll(
        "SELECT * FROM announcements WHERE class_id = ? ORDER BY date DESC",
        [$id]
    );
    
    Response::success('Class retrieved successfully', [
        'class' => $class,
        'students' => $students,
        'lessons' => $lessons,
        'events' => $events,
        'announcements' => $announcements
    ]);
}

function createClass($db) {
    AuthMiddleware::requireRole('admin');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $required = ['name', 'capacity', 'supervisor_id', 'grade_id'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            Response::error("Field '{$field}' is required");
        }
    }
    
    try {
        $id = $db->insert('classes', [
            'name' => $input['name'],
            'capacity' => $input['capacity'],
            'supervisor_id' => $input['supervisor_id'],
            'grade_id' => $input['grade_id']
        ]);
        
        // Get the created class
        $class = $db->fetchOne(
            "SELECT c.*, g.level as grade_level, t.name as supervisor_name, t.surname as supervisor_surname 
             FROM classes c 
             LEFT JOIN grades g ON c.grade_id = g.id 
             LEFT JOIN teachers t ON c.supervisor_id = t.id 
             WHERE c.id = ?",
            [$id]
        );
        
        Response::success('Class created successfully', $class, 201);
        
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            Response::error('Class name already exists', 409);
        }
        Response::error('Failed to create class: ' . $e->getMessage());
    }
}

function updateClass($db, $id) {
    AuthMiddleware::requireRole('admin');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Check if class exists
    $existing = $db->fetchOne("SELECT id FROM classes WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Class not found');
    }
    
    $data = [];
    
    // Build update data
    $allowedFields = ['name', 'capacity', 'supervisor_id', 'grade_id'];
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $data[$field] = $input[$field];
        }
    }
    
    if (empty($data)) {
        Response::error('No fields to update');
    }
    
    try {
        $db->update('classes', $data, 'id = ?', [$id]);
        
        // Get updated class
        $class = $db->fetchOne(
            "SELECT c.*, g.level as grade_level, t.name as supervisor_name, t.surname as supervisor_surname 
             FROM classes c 
             LEFT JOIN grades g ON c.grade_id = g.id 
             LEFT JOIN teachers t ON c.supervisor_id = t.id 
             WHERE c.id = ?",
            [$id]
        );
        
        Response::success('Class updated successfully', $class);
        
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            Response::error('Class name already exists', 409);
        }
        Response::error('Failed to update class: ' . $e->getMessage());
    }
}

function deleteClass($db, $id) {
    AuthMiddleware::requireRole('admin');
    
    // Check if class exists
    $existing = $db->fetchOne("SELECT id FROM classes WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Class not found');
    }
    
    // Check if class has students
    $studentCount = $db->fetchOne(
        "SELECT COUNT(*) as count FROM students WHERE class_id = ?",
        [$id]
    );
    
    if ($studentCount['count'] > 0) {
        Response::error('Cannot delete class with enrolled students. Please reassign or delete the students first.');
    }
    
    try {
        $deleted = $db->delete('classes', 'id = ?', [$id]);
        
        if ($deleted > 0) {
            Response::success('Class deleted successfully');
        } else {
            Response::error('Failed to delete class');
        }
        
    } catch (Exception $e) {
        Response::error('Failed to delete class: ' . $e->getMessage());
    }
}
