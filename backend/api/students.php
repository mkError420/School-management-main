<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            getStudent($db, $id);
        } else {
            getStudents($db);
        }
        break;
        
    case 'POST':
        createStudent($db);
        break;
        
    case 'PUT':
        if (!$id) {
            Response::error('Student ID is required');
        }
        updateStudent($db, $id);
        break;
        
    case 'DELETE':
        if (!$id) {
            Response::error('Student ID is required');
        }
        deleteStudent($db, $id);
        break;
        
    default:
        Response::methodNotAllowed();
}

function getStudents($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    
    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 10);
    $search = $_GET['search'] ?? '';
    $classId = $_GET['class_id'] ?? '';
    $gradeId = $_GET['grade_id'] ?? '';
    
    $offset = ($page - 1) * $limit;
    
    // Build query
    $sql = "SELECT s.*, c.name as class_name, g.level as grade_level, p.name as parent_name, p.surname as parent_surname 
            FROM students s 
            LEFT JOIN classes c ON s.class_id = c.id 
            LEFT JOIN grades g ON s.grade_id = g.id 
            LEFT JOIN parents p ON s.parent_id = p.id 
            WHERE 1=1";
    
    $params = [];
    
    if (!empty($search)) {
        $sql .= " AND (s.name LIKE ? OR s.surname LIKE ? OR s.username LIKE ? OR s.email LIKE ?)";
        $searchTerm = "%{$search}%";
        $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
    }
    
    if (!empty($classId)) {
        $sql .= " AND s.class_id = ?";
        $params[] = $classId;
    }
    
    if (!empty($gradeId)) {
        $sql .= " AND s.grade_id = ?";
        $params[] = $gradeId;
    }
    
    // Get total count
    $countSql = str_replace("SELECT s.*, c.name as class_name, g.level as grade_level, p.name as parent_name, p.surname as parent_surname", "SELECT COUNT(*) as total", $sql);
    $totalResult = $db->fetchOne($countSql, $params);
    $total = $totalResult['total'];
    
    // Add pagination
    $sql .= " ORDER BY s.created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $students = $db->fetchAll($sql, $params);
    
    // Remove passwords from response
    foreach ($students as &$student) {
        unset($student['password']);
    }
    
    Response::success('Students retrieved successfully', [
        'students' => $students,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

function getStudent($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'parent', 'student']);
    
    // If student or parent, they can only see their own data
    if ($user['role'] === 'student' && $user['user_id'] !== $id) {
        Response::forbidden('You can only view your own data');
    }
    
    if ($user['role'] === 'parent') {
        // Get parent's students
        $parentStudents = $db->fetchAll("SELECT id FROM students WHERE parent_id = ?", [$user['user_id']]);
        $studentIds = array_column($parentStudents, 'id');
        if (!in_array($id, $studentIds)) {
            Response::forbidden('You can only view your children\'s data');
        }
    }
    
    $student = $db->fetchOne(
        "SELECT s.*, c.name as class_name, g.level as grade_level, p.name as parent_name, p.surname as parent_surname, p.phone as parent_phone 
         FROM students s 
         LEFT JOIN classes c ON s.class_id = c.id 
         LEFT JOIN grades g ON s.grade_id = g.id 
         LEFT JOIN parents p ON s.parent_id = p.id 
         WHERE s.id = ?",
        [$id]
    );
    
    if (!$student) {
        Response::notFound('Student not found');
    }
    
    // Remove password from response
    unset($student['password']);
    
    // Get student's attendance
    $attendance = $db->fetchAll(
        "SELECT a.*, l.name as lesson_name, l.day as lesson_day 
         FROM attendance a 
         LEFT JOIN lessons l ON a.lesson_id = l.id 
         WHERE a.student_id = ? 
         ORDER BY a.date DESC",
        [$id]
    );
    
    // Get student's results
    $results = $db->fetchAll(
        "SELECT r.*, e.title as exam_title, a.title as assignment_title, sub.name as subject_name 
         FROM results r 
         LEFT JOIN exams e ON r.exam_id = e.id 
         LEFT JOIN assignments a ON r.assignment_id = a.id 
         LEFT JOIN lessons l ON l.id = COALESCE(e.lesson_id, a.lesson_id)
         LEFT JOIN subjects sub ON l.subject_id = sub.id 
         WHERE r.student_id = ? 
         ORDER BY r.id DESC",
        [$id]
    );
    
    Response::success('Student retrieved successfully', [
        'student' => $student,
        'attendance' => $attendance,
        'results' => $results
    ]);
}

function createStudent($db) {
    AuthMiddleware::requireRole('admin');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $required = ['username', 'password', 'name', 'surname', 'address', 'blood_type', 'sex', 'parent_id', 'class_id', 'grade_id'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            Response::error("Field '{$field}' is required");
        }
    }
    
    if (strlen($input['password']) < 6) {
        Response::error('Password must be at least 6 characters');
    }
    
    // Hash password
    $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
    
    // Generate unique ID
    $id = uniqid();
    
    try {
        $db->insert('students', [
            'id' => $id,
            'username' => $input['username'],
            'password' => $hashedPassword,
            'name' => $input['name'],
            'surname' => $input['surname'],
            'email' => $input['email'] ?? null,
            'phone' => $input['phone'] ?? null,
            'address' => $input['address'],
            'img' => $input['img'] ?? null,
            'blood_type' => $input['blood_type'],
            'sex' => $input['sex'],
            'parent_id' => $input['parent_id'],
            'class_id' => $input['class_id'],
            'grade_id' => $input['grade_id']
        ]);
        
        // Get the created student
        $student = $db->fetchOne("SELECT * FROM students WHERE id = ?", [$id]);
        unset($student['password']);
        
        Response::success('Student created successfully', $student, 201);
        
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            Response::error('Username or email already exists', 409);
        }
        Response::error('Failed to create student: ' . $e->getMessage());
    }
}

function updateStudent($db, $id) {
    AuthMiddleware::requireRole('admin');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Check if student exists
    $existing = $db->fetchOne("SELECT id FROM students WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Student not found');
    }
    
    $data = [];
    
    // Build update data
    $allowedFields = ['name', 'surname', 'email', 'phone', 'address', 'img', 'blood_type', 'sex', 'parent_id', 'class_id', 'grade_id'];
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $data[$field] = $input[$field];
        }
    }
    
    // Handle password update
    if (!empty($input['password'])) {
        if (strlen($input['password']) < 6) {
            Response::error('Password must be at least 6 characters');
        }
        $data['password'] = password_hash($input['password'], PASSWORD_DEFAULT);
    }
    
    if (empty($data)) {
        Response::error('No fields to update');
    }
    
    try {
        $db->update('students', $data, 'id = ?', [$id]);
        
        // Get updated student
        $student = $db->fetchOne("SELECT * FROM students WHERE id = ?", [$id]);
        unset($student['password']);
        
        Response::success('Student updated successfully', $student);
        
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            Response::error('Username or email already exists', 409);
        }
        Response::error('Failed to update student: ' . $e->getMessage());
    }
}

function deleteStudent($db, $id) {
    AuthMiddleware::requireRole('admin');
    
    // Check if student exists
    $existing = $db->fetchOne("SELECT id FROM students WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Student not found');
    }
    
    try {
        $deleted = $db->delete('students', 'id = ?', [$id]);
        
        if ($deleted > 0) {
            Response::success('Student deleted successfully');
        } else {
            Response::error('Failed to delete student');
        }
        
    } catch (Exception $e) {
        Response::error('Failed to delete student: ' . $e->getMessage());
    }
}
