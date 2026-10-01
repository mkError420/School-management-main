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
        if (($_GET['action'] ?? '') === 'update') {
            if (!$id) {
                Response::error('Teacher ID is required');
            }
            updateTeacher($db, $id);
        } else {
            createTeacher($db);
        }
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

    if ($user['role'] === 'teacher') {
        $sql .= " AND t.id = ?";
        $params[] = $user['user_id'];
    }

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

    $exams = $db->fetchAll(
        "SELECT e.id, e.title, e.start_time, e.end_time, l.id as lesson_id,
                l.name as lesson_name, s.name as subject_name, c.name as class_name
         FROM exams e
         INNER JOIN lessons l ON e.lesson_id = l.id
         LEFT JOIN subjects s ON l.subject_id = s.id
         LEFT JOIN classes c ON l.class_id = c.id
         WHERE l.teacher_id = ?
         ORDER BY e.start_time DESC",
        [$id]
    );

    $assignments = $db->fetchAll(
        "SELECT a.id, a.title, a.start_date, a.due_date, l.id as lesson_id,
                l.name as lesson_name, s.name as subject_name, c.name as class_name
         FROM assignments a
         INNER JOIN lessons l ON a.lesson_id = l.id
         LEFT JOIN subjects s ON l.subject_id = s.id
         LEFT JOIN classes c ON l.class_id = c.id
         WHERE l.teacher_id = ?
         ORDER BY a.due_date DESC",
        [$id]
    );

    $students = $db->fetchAll(
        "SELECT DISTINCT st.id, st.name, st.surname, st.email, st.img,
                st.class_id, c.name as class_name, g.level as grade_level
         FROM students st
         LEFT JOIN classes c ON st.class_id = c.id
         LEFT JOIN grades g ON st.grade_id = g.id
         WHERE st.class_id IN (
             SELECT tc.class_id FROM teacher_classes tc WHERE tc.teacher_id = ?
             UNION
             SELECT supervised.id FROM classes supervised WHERE supervised.supervisor_id = ?
         )
         ORDER BY st.name, st.surname",
        [$id, $id]
    );

    $results = $db->fetchAll(
        "SELECT r.id, r.score, st.id as student_id, st.name as student_name,
                st.surname as student_surname, COALESCE(e.title, a.title) as assessment_title,
                COALESCE(s_exam.name, s_assignment.name) as subject_name,
                COALESCE(e.start_time, a.due_date) as date
         FROM results r
         INNER JOIN students st ON r.student_id = st.id
         LEFT JOIN exams e ON r.exam_id = e.id
         LEFT JOIN lessons l_exam ON e.lesson_id = l_exam.id
         LEFT JOIN subjects s_exam ON l_exam.subject_id = s_exam.id
         LEFT JOIN assignments a ON r.assignment_id = a.id
         LEFT JOIN lessons l_assignment ON a.lesson_id = l_assignment.id
         LEFT JOIN subjects s_assignment ON l_assignment.subject_id = s_assignment.id
         WHERE l_exam.teacher_id = ? OR l_assignment.teacher_id = ?
         ORDER BY date DESC",
        [$id, $id]
    );

    $attendanceSummary = $db->fetchOne(
        "SELECT COUNT(*) as total, COALESCE(SUM(a.present = 1), 0) as present
         FROM attendance a
         INNER JOIN lessons l ON a.lesson_id = l.id
         WHERE l.teacher_id = ?",
        [$id]
    );

    $announcements = $db->fetchAll(
        "SELECT a.id, a.title, a.description, a.date, a.class_id, c.name as class_name
         FROM announcements a
         LEFT JOIN classes c ON a.class_id = c.id
         WHERE a.class_id IS NULL OR a.class_id IN (
             SELECT tc.class_id FROM teacher_classes tc WHERE tc.teacher_id = ?
             UNION
             SELECT supervised.id FROM classes supervised WHERE supervised.supervisor_id = ?
         )
         ORDER BY a.date DESC
         LIMIT 5",
        [$id, $id]
    );
    
    Response::success('Teacher retrieved successfully', [
        'teacher' => $teacher,
        'subjects' => $subjects,
        'classes' => $classes,
        'supervised_classes' => $supervisedClasses,
        'lessons' => $lessons,
        'exams' => $exams,
        'assignments' => $assignments,
        'students' => $students,
        'results' => $results,
        'attendance' => $attendanceSummary,
        'announcements' => $announcements
    ]);
}

function createTeacher($db) {
    AuthMiddleware::requireRole('admin');
    
    $input = parseTeacherInput();
    
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
    
    $uploadedImage = null;
    try {
        $uploadedImage = storeTeacherImage();
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
            'img' => $uploadedImage ?? ($input['img'] ?? null),
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
        if ($uploadedImage) {
            deleteTeacherImage($uploadedImage);
        }
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            Response::error('Username or email already exists', 409);
        }
        Response::error('Failed to create teacher: ' . $e->getMessage());
    }
}

function updateTeacher($db, $id) {
    AuthMiddleware::requireRole('admin');
    
    $input = parseTeacherInput();
    
    // Check if teacher exists
    $existing = $db->fetchOne("SELECT id, img FROM teachers WHERE id = ?", [$id]);
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
    
    $uploadedImage = null;
    try {
        $uploadedImage = storeTeacherImage();
        if ($uploadedImage) {
            $data['img'] = $uploadedImage;
        }
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

        if ($uploadedImage && !empty($existing['img'])) {
            deleteTeacherImage($existing['img']);
        }
        
        // Get updated teacher
        $teacher = $db->fetchOne("SELECT * FROM teachers WHERE id = ?", [$id]);
        unset($teacher['password']);
        
        Response::success('Teacher updated successfully', $teacher);
        
    } catch (Exception $e) {
        $db->rollback();
        if ($uploadedImage) {
            deleteTeacherImage($uploadedImage);
        }
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            Response::error('Username or email already exists', 409);
        }
        Response::error('Failed to update teacher: ' . $e->getMessage());
    }
}

function deleteTeacher($db, $id) {
    AuthMiddleware::requireRole('admin');
    
    // Check if teacher exists
    $existing = $db->fetchOne("SELECT id, img FROM teachers WHERE id = ?", [$id]);
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
            if (!empty($existing['img'])) {
                deleteTeacherImage($existing['img']);
            }
            Response::success('Teacher deleted successfully');
        } else {
            Response::error('Failed to delete teacher');
        }
        
    } catch (Exception $e) {
        $db->rollback();
        Response::error('Failed to delete teacher: ' . $e->getMessage());
    }
}

function parseTeacherInput() {
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') !== false) {
        return $_POST;
    }
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

function storeTeacherImage() {
    if (empty($_FILES['img']) || $_FILES['img']['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    $upload = $_FILES['img'];
    if ($upload['error'] !== UPLOAD_ERR_OK) {
        Response::error('Teacher image upload failed');
    }
    if ($upload['size'] > 5 * 1024 * 1024) {
        Response::error('Teacher image must be no larger than 5 MB');
    }

    $imageInfo = getimagesize($upload['tmp_name']);
    $extensionsByMime = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];
    $mimeType = $imageInfo['mime'] ?? '';
    if (!$imageInfo || !isset($extensionsByMime[$mimeType])) {
        Response::error('Choose a valid JPG, PNG, or WebP image');
    }

    $directory = dirname(__DIR__, 2) . '/public/images/teachers';
    if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
        Response::serverError('Unable to prepare teacher image storage');
    }

    $fileName = bin2hex(random_bytes(16)) . '.' . $extensionsByMime[$mimeType];
    if (!move_uploaded_file($upload['tmp_name'], $directory . '/' . $fileName)) {
        Response::serverError('Unable to store teacher image');
    }

    return '/images/teachers/' . $fileName;
}

function deleteTeacherImage($imagePath) {
    if (!is_string($imagePath) || strpos($imagePath, '/images/teachers/') !== 0) {
        return;
    }

    $filePath = dirname(__DIR__, 2) . '/public/images/teachers/' . basename($imagePath);
    if (is_file($filePath)) {
        unlink($filePath);
    }
}
