<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            getTeacher($db, $id);
        } else {
            getTeachers($db);
        }
        break;
        
    case 'POST':
        createTeacher($db);
        break;
        
    case 'PUT':
        if (!$id) {
            Response::error('Teacher ID is required');
        }
        updateTeacher($db, $id);
        break;
        
    case 'DELETE':
        if (!$id) {
            Response::error('Teacher ID is required');
        }
        deleteTeacher($db, $id);
        break;
        
    default:
        Response::methodNotAllowed();
}

function getTeachers($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    
    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 10);
    $search = $_GET['search'] ?? '';
    
    $offset = ($page - 1) * $limit;
    
    // Build query
    $sql = "SELECT t.* FROM teachers t WHERE 1=1";
    $params = [];
    
    if (!empty($search)) {
        $sql .= " AND (t.name LIKE ? OR t.surname LIKE ? OR t.username LIKE ? OR t.email LIKE ?)";
        $searchTerm = "%{$search}%";
        $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
    }
    
    // Get total count
    $countSql = str_replace("SELECT t.*", "SELECT COUNT(*) as total", $sql);
    $totalResult = $db->fetchOne($countSql, $params);
    $total = $totalResult['total'];
    
    // Add pagination
    $sql .= " ORDER BY t.created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $teachers = $db->fetchAll($sql, $params);
    
    // Remove passwords from response
    foreach ($teachers as &$teacher) {
        unset($teacher['password']);
        
        // Get teacher's subjects
        $subjects = $db->fetchAll(
            "SELECT s.id, s.name FROM subjects s 
             INNER JOIN teacher_subjects ts ON s.id = ts.subject_id 
             WHERE ts.teacher_id = ?",
            [$teacher['id']]
        );
        $teacher['subjects'] = $subjects;
        
        // Get teacher's classes
        $classes = $db->fetchAll(
            "SELECT c.id, c.name FROM classes c 
             INNER JOIN teacher_classes tc ON c.id = tc.class_id 
             WHERE tc.teacher_id = ?",
            [$teacher['id']]
        );
        $teacher['classes'] = $classes;
    }
    
    Response::success('Teachers retrieved successfully', [
        'teachers' => $teachers,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

function getTeacher($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    
    // If teacher, they can only see their own data
    if ($user['role'] === 'teacher' && $user['user_id'] !== $id) {
        Response::forbidden('You can only view your own data');
    }
    
    $teacher = $db->fetchOne("SELECT * FROM teachers WHERE id = ?", [$id]);
    
    if (!$teacher) {
        Response::notFound('Teacher not found');
    }
    
    // Remove password from response
    unset($teacher['password']);
    
    // Get teacher's subjects
    $subjects = $db->fetchAll(
        "SELECT s.id, s.name FROM subjects s 
         INNER JOIN teacher_subjects ts ON s.id = ts.subject_id 
         WHERE ts.teacher_id = ?",
        [$id]
    );
    
    // Get teacher's classes
    $classes = $db->fetchAll(
        "SELECT c.id, c.name, g.level as grade_level FROM classes c 
         INNER JOIN teacher_classes tc ON c.id = tc.class_id 
         LEFT JOIN grades g ON c.grade_id = g.id
         WHERE tc.teacher_id = ?",
        [$id]
    );
    
    // Get supervised classes
    $supervisedClasses = $db->fetchAll(
        "SELECT c.id, c.name, g.level as grade_level FROM classes c 
         LEFT JOIN grades g ON c.grade_id = g.id
         WHERE c.supervisor_id = ?",
        [$id]
    );
    
    // Get teacher's lessons
    $lessons = $db->fetchAll(
        "SELECT l.*, s.name as subject_name, c.name as class_name 
         FROM lessons l 
         LEFT JOIN subjects s ON l.subject_id = s.id 
         LEFT JOIN classes c ON l.class_id = c.id 
         WHERE l.teacher_id = ? 
         ORDER BY l.day, l.start_time",
        [$id]
    );
    
    Response::success('Teacher retrieved successfully', [
        'teacher' => $teacher,
        'subjects' => $subjects,
        'classes' => $classes,
        'supervised_classes' => $supervisedClasses,
        'lessons' => $lessons
    ]);
}

function createTeacher($db) {
    AuthMiddleware::requireRole('admin');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $required = ['username', 'password', 'name', 'surname', 'address', 'blood_type', 'sex'];
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
        $db->beginTransaction();
        
        // Insert teacher
        $db->insert('teachers', [
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
            'sex' => $input['sex']
        ]);
        
        // Add subjects if provided
        if (!empty($input['subject_ids'])) {
            foreach ($input['subject_ids'] as $subjectId) {
                $db->insert('teacher_subjects', [
                    'teacher_id' => $id,
                    'subject_id' => $subjectId
                ]);
            }
        }
        
        // Add classes if provided
        if (!empty($input['class_ids'])) {
            foreach ($input['class_ids'] as $classId) {
                $db->insert('teacher_classes', [
                    'teacher_id' => $id,
                    'class_id' => $classId
                ]);
            }
        }
        
        $db->commit();
        
        // Get the created teacher
        $teacher = $db->fetchOne("SELECT * FROM teachers WHERE id = ?", [$id]);
        unset($teacher['password']);
        
        Response::success('Teacher created successfully', $teacher, 201);
        
    } catch (Exception $e) {
        $db->rollback();
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            Response::error('Username or email already exists', 409);
        }
        Response::error('Failed to create teacher: ' . $e->getMessage());
    }
}

function updateTeacher($db, $id) {
    AuthMiddleware::requireRole('admin');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Check if teacher exists
    $existing = $db->fetchOne("SELECT id FROM teachers WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Teacher not found');
    }
    
    $data = [];
    
    // Build update data
    $allowedFields = ['name', 'surname', 'email', 'phone', 'address', 'img', 'blood_type', 'sex'];
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
    
    try {
        $db->beginTransaction();
        
        // Update teacher basic info
        if (!empty($data)) {
            $db->update('teachers', $data, 'id = ?', [$id]);
        }
        
        // Update subjects if provided
        if (isset($input['subject_ids'])) {
            // Remove existing subjects
            $db->delete('teacher_subjects', 'teacher_id = ?', [$id]);
            
            // Add new subjects
            foreach ($input['subject_ids'] as $subjectId) {
                $db->insert('teacher_subjects', [
                    'teacher_id' => $id,
                    'subject_id' => $subjectId
                ]);
            }
        }
        
        // Update classes if provided
        if (isset($input['class_ids'])) {
            // Remove existing classes
            $db->delete('teacher_classes', 'teacher_id = ?', [$id]);
            
            // Add new classes
            foreach ($input['class_ids'] as $classId) {
                $db->insert('teacher_classes', [
                    'teacher_id' => $id,
                    'class_id' => $classId
                ]);
            }
        }
        
        $db->commit();
        
        // Get updated teacher
        $teacher = $db->fetchOne("SELECT * FROM teachers WHERE id = ?", [$id]);
        unset($teacher['password']);
        
        Response::success('Teacher updated successfully', $teacher);
        
    } catch (Exception $e) {
        $db->rollback();
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            Response::error('Username or email already exists', 409);
        }
        Response::error('Failed to update teacher: ' . $e->getMessage());
    }
}

function deleteTeacher($db, $id) {
    AuthMiddleware::requireRole('admin');
    
    // Check if teacher exists
    $existing = $db->fetchOne("SELECT id FROM teachers WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Teacher not found');
    }
    
    try {
        $db->beginTransaction();
        
        // Remove teacher-subject relationships
        $db->delete('teacher_subjects', 'teacher_id = ?', [$id]);
        
        // Remove teacher-class relationships
        $db->delete('teacher_classes', 'teacher_id = ?', [$id]);
        
        // Delete teacher
        $deleted = $db->delete('teachers', 'id = ?', [$id]);
        
        $db->commit();
        
        if ($deleted > 0) {
            Response::success('Teacher deleted successfully');
        } else {
            Response::error('Failed to delete teacher');
        }
        
    } catch (Exception $e) {
        $db->rollback();
        Response::error('Failed to delete teacher: ' . $e->getMessage());
    }
}
