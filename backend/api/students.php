<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

// PHP only populates $_POST and $_FILES for POST, not PUT.
// Support method override so multipart FormData updates work.
$methodOverride = strtoupper($_POST['_method'] ?? $_GET['_method'] ?? '');
if ($method === 'POST' && $methodOverride === 'PUT') {
    $method = 'PUT';
}

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

    $classId = $student['class_id'];
    $lessons = $db->fetchAll(
        "SELECT l.id, l.name, l.day, l.start_time, l.end_time,
                s.name as subject_name, t.id as teacher_id,
                t.name as teacher_name, t.surname as teacher_surname
         FROM lessons l
         LEFT JOIN subjects s ON l.subject_id = s.id
         LEFT JOIN teachers t ON l.teacher_id = t.id
         WHERE l.class_id = ?
         ORDER BY l.day, l.start_time",
        [$classId]
    );

    $teachers = $db->fetchAll(
        "SELECT DISTINCT t.id, t.name, t.surname, t.email, t.img, s.name as subject_name
         FROM teachers t
         INNER JOIN lessons l ON l.teacher_id = t.id
         LEFT JOIN subjects s ON l.subject_id = s.id
         WHERE l.class_id = ?
         ORDER BY t.name, t.surname",
        [$classId]
    );

    $exams = $db->fetchAll(
        "SELECT e.id, e.title, e.start_time, e.end_time,
                l.name as lesson_name, s.name as subject_name
         FROM exams e
         INNER JOIN lessons l ON e.lesson_id = l.id
         LEFT JOIN subjects s ON l.subject_id = s.id
         WHERE l.class_id = ?
         ORDER BY e.start_time",
        [$classId]
    );

    $assignments = $db->fetchAll(
        "SELECT a.id, a.title, a.start_date, a.due_date,
                l.name as lesson_name, s.name as subject_name
         FROM assignments a
         INNER JOIN lessons l ON a.lesson_id = l.id
         LEFT JOIN subjects s ON l.subject_id = s.id
         WHERE l.class_id = ?
         ORDER BY a.due_date",
        [$classId]
    );

    $announcements = $db->fetchAll(
        "SELECT a.id, a.title, a.description, a.date, c.name as class_name
         FROM announcements a
         LEFT JOIN classes c ON a.class_id = c.id
         WHERE a.class_id = ? OR a.class_id IS NULL
         ORDER BY a.date DESC
         LIMIT 5",
        [$classId]
    );
    
    Response::success('Student retrieved successfully', [
        'student' => $student,
        'attendance' => $attendance,
        'results' => $results,
        'lessons' => $lessons,
        'teachers' => $teachers,
        'exams' => $exams,
        'assignments' => $assignments,
        'announcements' => $announcements
    ]);
}

function createStudent($db) {
    AuthMiddleware::requireRole('admin');

    // Support both JSON and multipart/form-data (when photo is attached)
    $isMultipart = stripos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') !== false;
    $input = $isMultipart ? $_POST : (json_decode(file_get_contents('php://input'), true) ?? []);

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

    // Handle photo upload (multipart only)
    $uploadedImage = null;
    if ($isMultipart) {
        $uploadedImage = storeStudentImage();
    }

    try {
        $db->insert('students', [
            'id'         => $id,
            'username'   => $input['username'],
            'password'   => $hashedPassword,
            'name'       => $input['name'],
            'surname'    => $input['surname'],
            'email'      => $input['email'] ?? null,
            'phone'      => $input['phone'] ?? null,
            'address'    => $input['address'],
            'img'        => $uploadedImage ?? ($input['img'] ?? null),
            'blood_type' => $input['blood_type'],
            'sex'        => $input['sex'],
            'parent_id'  => $input['parent_id'],
            'class_id'   => $input['class_id'],
            'grade_id'   => $input['grade_id']
        ]);

        // Get the created student
        $student = $db->fetchOne("SELECT * FROM students WHERE id = ?", [$id]);
        unset($student['password']);

        // Sync with admissions table so admissions is immediately in sync
        try {
            $parent = $db->fetchOne("SELECT name, surname, phone, email FROM parents WHERE id = ?", [$input['parent_id']]);
            $parentName = $parent ? trim($parent['name'] . ' ' . $parent['surname']) : 'Parent/Guardian';
            $cleanId = strtoupper(preg_replace('/[^a-zA-Z0-9]/', '', $id));
            $appNo = 'ADM-' . date('Y') . '-' . $cleanId;

            $checkApp = $db->fetchOne("SELECT id FROM admissions WHERE application_no = ?", [$appNo]);
            if ($checkApp) {
                $appNo = 'ADM-' . date('Y') . '-' . $cleanId . '-' . rand(10, 99);
            }

            $db->insert('admissions', [
                'application_no'      => $appNo,
                'first_name'          => $input['name'],
                'last_name'           => $input['surname'],
                'email'               => $input['email'] ?? null,
                'phone'               => $input['phone'] ?? null,
                'gender'              => (isset($input['sex']) && strtoupper($input['sex']) === 'FEMALE') ? 'FEMALE' : 'MALE',
                'blood_type'          => $input['blood_type'] ?? 'A+',
                'address'             => $input['address'] ?? '',
                'grade_id'            => $input['grade_id'],
                'class_id'            => $input['class_id'],
                'parent_name'         => $parentName,
                'parent_phone'        => $parent['phone'] ?? null,
                'parent_email'        => $parent['email'] ?? null,
                'parent_id'           => $input['parent_id'],
                'previous_school'     => 'Direct Enrollment',
                'status'              => 'APPROVED',
                'notes'               => 'Enrolled student account (dynamically synced with school student database).',
                'applied_date'        => date('Y-m-d'),
                'enrolled_student_id' => $id
            ]);
        } catch (Exception $e) {
            error_log('Error syncing student creation to admissions: ' . $e->getMessage());
        }

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

    // Support both JSON and multipart/form-data (when photo is attached)
    $isMultipart = stripos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') !== false;
    $input = $isMultipart ? $_POST : (json_decode(file_get_contents('php://input'), true) ?? []);
    unset($input['_method']); // Remove method override field

    // Check if student exists
    $existing = $db->fetchOne("SELECT id, img FROM students WHERE id = ?", [$id]);
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

    // Handle photo upload (multipart only)
    if ($isMultipart) {
        $uploadedImage = storeStudentImage();
        if ($uploadedImage !== null) {
            if (!empty($existing['img'])) {
                deleteStudentImage($existing['img']);
            }
            $data['img'] = $uploadedImage;
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

        // Sync updates to admissions table if linked
        try {
            $admData = [];
            if (isset($data['name'])) $admData['first_name'] = $data['name'];
            if (isset($data['surname'])) $admData['last_name'] = $data['surname'];
            if (isset($data['email'])) $admData['email'] = $data['email'];
            if (isset($data['phone'])) $admData['phone'] = $data['phone'];
            if (isset($data['address'])) $admData['address'] = $data['address'];
            if (isset($data['blood_type'])) $admData['blood_type'] = $data['blood_type'];
            if (isset($data['sex'])) $admData['gender'] = strtoupper($data['sex']) === 'FEMALE' ? 'FEMALE' : 'MALE';
            if (isset($data['class_id'])) $admData['class_id'] = $data['class_id'];
            if (isset($data['grade_id'])) $admData['grade_id'] = $data['grade_id'];
            if (isset($data['parent_id'])) $admData['parent_id'] = $data['parent_id'];
            if (isset($data['img'])) $admData['img'] = $data['img'];
            if (!empty($admData)) {
                $db->update('admissions', $admData, 'enrolled_student_id = ?', [$id]);
            }
        } catch (Exception $e) {
            error_log('Error syncing student update to admissions: ' . $e->getMessage());
        }

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
        // Also remove or unlink corresponding admission to keep counts in sync
        try {
            $db->delete('admissions', 'enrolled_student_id = ?', [$id]);
        } catch (Exception $e) {
            error_log('Error deleting admission for deleted student: ' . $e->getMessage());
        }

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

function storeStudentImage() {
    if (empty($_FILES['img']) || $_FILES['img']['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    $upload = $_FILES['img'];
    if ($upload['error'] !== UPLOAD_ERR_OK) {
        Response::error('Student image upload failed (error code ' . $upload['error'] . ')');
    }
    if ($upload['size'] > 5 * 1024 * 1024) {
        Response::error('Student photo must be no larger than 5 MB');
    }

    $imageInfo = getimagesize($upload['tmp_name']);
    $extensionsByMime = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
    ];
    $mimeType = $imageInfo['mime'] ?? '';
    if (!$imageInfo || !isset($extensionsByMime[$mimeType])) {
        Response::error('Choose a valid JPG, PNG, or WebP image for the student photo');
    }

    $directory = dirname(__DIR__, 2) . '/images/students';
    if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
        Response::serverError('Unable to prepare student image storage');
    }

    $fileName = bin2hex(random_bytes(16)) . '.' . $extensionsByMime[$mimeType];
    if (!move_uploaded_file($upload['tmp_name'], $directory . '/' . $fileName)) {
        Response::serverError('Unable to store student image');
    }

    return '/images/students/' . $fileName;
}

function deleteStudentImage($imagePath) {
    if (!is_string($imagePath) || strpos($imagePath, '/images/students/') !== 0) {
        return;
    }
    $filePath = dirname(__DIR__, 2) . '/images/students/' . basename($imagePath);
    if (is_file($filePath)) {
        unlink($filePath);
    }
}
