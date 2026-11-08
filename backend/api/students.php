<?php
require_once __DIR__ . '/../utils/StudentIdGenerator.php';

$db = Database::getInstance();

try {
    $cols = $db->fetchAll("SHOW COLUMNS FROM students LIKE 'roll'");
    if (empty($cols)) {
        $db->query("ALTER TABLE students ADD COLUMN roll VARCHAR(50) NULL AFTER username");
    }
} catch (Exception $e) {}
try {
    $cols = $db->fetchAll("SHOW COLUMNS FROM students LIKE 'student_type'");
    if (empty($cols)) {
        $db->query("ALTER TABLE students ADD COLUMN student_type VARCHAR(100) NULL AFTER sex");
    }
} catch (Exception $e) {}
try {
    $cols = $db->fetchAll("SHOW COLUMNS FROM students LIKE 'version'");
    if (empty($cols)) {
        $db->query("ALTER TABLE students ADD COLUMN version VARCHAR(50) DEFAULT 'Bangla'");
    }
} catch (Exception $e) {}
try {
    $cols = $db->fetchAll("SHOW COLUMNS FROM students LIKE 'session_year'");
    if (empty($cols)) {
        $db->query("ALTER TABLE students ADD COLUMN session_year VARCHAR(50) DEFAULT '2026-2027'");
    }
} catch (Exception $e) {}
try {
    $cols = $db->fetchAll("SHOW COLUMNS FROM students LIKE 'status'");
    if (empty($cols)) {
        $db->query("ALTER TABLE students ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE'");
    }
} catch (Exception $e) {}
try {
    $db->query("CREATE TABLE IF NOT EXISTS student_session_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(255) NOT NULL,
        session_year VARCHAR(50) NOT NULL,
        class_id INT NOT NULL,
        class_name VARCHAR(100) NOT NULL,
        grade_id INT NULL,
        grade_level INT NULL,
        section VARCHAR(50) NULL,
        roll VARCHAR(50) NULL,
        version VARCHAR(50) DEFAULT 'Bangla',
        shift VARCHAR(50) DEFAULT 'Day',
        promotion_status ENUM('PROMOTED', 'RETAINED', 'PASSED_OUT', 'TRANSFERRED') NOT NULL DEFAULT 'PROMOTED',
        gpa DECIMAL(3,2) NULL,
        total_marks DECIMAL(7,2) NULL,
        grade_letter VARCHAR(10) NULL,
        merit_position INT NULL,
        attendance_total_days INT NOT NULL DEFAULT 0,
        attendance_present_days INT NOT NULL DEFAULT 0,
        attendance_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        fee_billed DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        fee_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        fee_due DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        fee_clearance_status ENUM('CLEARED', 'DUE') NOT NULL DEFAULT 'CLEARED',
        next_session_year VARCHAR(50) NULL,
        next_class_id INT NULL,
        next_class_name VARCHAR(100) NULL,
        next_roll VARCHAR(50) NULL,
        remarks TEXT NULL,
        promoted_by VARCHAR(255) NULL,
        promoted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ssh_student (student_id),
        INDEX idx_ssh_session (session_year),
        INDEX idx_ssh_class (class_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
} catch (Exception $e) {}
try {
    $db->query("UPDATE students SET email = NULL WHERE email IS NOT NULL AND (email = '' OR email = ' ')");
    $db->query("UPDATE students SET phone = NULL WHERE phone IS NOT NULL AND (phone = '' OR phone = ' ')");
} catch (Exception $e) {}

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

// PHP only populates $_POST and $_FILES for POST, not PUT.
// Support method override so multipart FormData updates work.
$methodOverride = strtoupper($_POST['_method'] ?? $_GET['_method'] ?? '');
if ($method === 'POST' && $methodOverride === 'PUT') {
    $method = 'PUT';
}

switch ($method) {
    case 'GET':
        if ($action === 'session-history') {
            getStudentSessionHistory($db);
        } elseif ($action === 'promotions-summary') {
            getPromotionsSummary($db);
        } elseif ($id) {
            getStudent($db, $id);
        } else {
            getStudents($db);
        }
        break;
        
    case 'POST':
        if ($action === 'promote') {
            promoteStudent($db);
        } else {
            createStudent($db);
        }
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
    $sessionYear = $_GET['session_year'] ?? '';
    
    $offset = ($page - 1) * $limit;
    
    // Build query
    $selectFields = "s.*, COALESCE(NULLIF(s.student_type, ''), a.student_type) as student_type, COALESCE(NULLIF(s.version, ''), a.version, 'Bangla') as version, COALESCE(NULLIF(s.session_year, ''), '2026-2027') as session_year, COALESCE(NULLIF(s.status, ''), 'ACTIVE') as status, c.name as class_name, g.level as grade_level, p.name as parent_name, p.surname as parent_surname, p.phone as parent_phone, p.nid as parent_nid";
    $sql = "SELECT {$selectFields} 
            FROM students s 
            LEFT JOIN admissions a ON a.enrolled_student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id 
            LEFT JOIN grades g ON s.grade_id = g.id 
            LEFT JOIN parents p ON s.parent_id = p.id 
            WHERE 1=1";
    
    $params = [];
    
    if (!empty($search)) {
        $sql .= " AND (s.name LIKE ? OR s.surname LIKE ? OR s.username LIKE ? OR s.roll LIKE ? OR s.email LIKE ? OR s.version LIKE ?)";
        $searchTerm = "%{$search}%";
        $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm]);
    }
    
    if (!empty($classId) && $classId !== 'all') {
        $sql .= " AND s.class_id = ?";
        $params[] = $classId;
    }
    
    if (!empty($gradeId)) {
        $sql .= " AND s.grade_id = ?";
        $params[] = $gradeId;
    }

    if (!empty($sessionYear) && $sessionYear !== 'all') {
        $sql .= " AND (s.session_year = ? OR (s.session_year IS NULL AND ? = '2026-2027'))";
        $params[] = $sessionYear;
        $params[] = $sessionYear;
    }
    
    // Get total count
    $countSql = str_replace("SELECT {$selectFields}", "SELECT COUNT(*) as total", $sql);
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

    $availableSessions = ['2027', '2026-2027', '2025-2026'];
    try {
        $sessRows = $db->fetchAll("SELECT DISTINCT session_year FROM students WHERE session_year IS NOT NULL AND session_year != ''");
        $histSess = $db->fetchAll("SELECT DISTINCT session_year FROM student_session_history WHERE session_year IS NOT NULL AND session_year != ''");
        $set = array_fill_keys($availableSessions, true);
        foreach (array_merge($sessRows, $histSess) as $r) {
            $val = trim($r['session_year'] ?? '');
            if ($val !== '') $set[$val] = true;
        }
        $availableSessions = array_keys($set);
        rsort($availableSessions);
    } catch (Exception $e) {}
    
    Response::success('Students retrieved successfully', [
        'students' => $students,
        'available_sessions' => $availableSessions,
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
        "SELECT s.*, 
                COALESCE(NULLIF(s.student_type, ''), a.student_type) as student_type,
                COALESCE(NULLIF(s.version, ''), a.version, 'Bangla') as version,
                c.name as class_name, 
                g.level as grade_level, 
                p.id as parent_id,
                p.name as parent_name, 
                p.surname as parent_surname, 
                p.phone as parent_phone,
                p.email as parent_email,
                p.nid as parent_nid,
                p.address as parent_address,
                p.img as parent_img,
                p.username as parent_username
         FROM students s 
         LEFT JOIN admissions a ON a.enrolled_student_id = s.id
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
                l.name as lesson_name, 
                COALESCE(s_direct.name, s.name) as subject_name
         FROM assignments a
         LEFT JOIN lessons l ON a.lesson_id = l.id
         LEFT JOIN subjects s ON l.subject_id = s.id
         LEFT JOIN subjects s_direct ON a.subject_id = s_direct.id
         WHERE (l.class_id = ? OR a.class_id = ?)
         ORDER BY a.due_date",
        [$classId, $classId]
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

    // Get student's fee invoices & payment summary
    $fees = [];
    $feeSummary = [
        'total_billed' => 0.0,
        'total_paid' => 0.0,
        'total_due' => 0.0,
        'upcoming_due' => 0.0,
        'overdue_due' => 0.0,
        'total_invoices' => 0,
        'paid_count' => 0,
        'due_count' => 0,
        'upcoming_count' => 0,
    ];
    try {
        $today = date('Y-m-d');
        // Auto update overdue
        $db->query("UPDATE fee_invoices SET status = 'OVERDUE' WHERE due_date < ? AND status = 'UNPAID'", [$today]);

        $feeRows = $db->fetchAll(
            "SELECT fi.*, 
                    fc.name as category_name, fc.code as category_code,
                    (fi.amount - fi.discount) as net_amount,
                    ((fi.amount - fi.discount) - fi.paid_amount) as due_amount
             FROM fee_invoices fi
             JOIN fee_categories fc ON fi.fee_category_id = fc.id
             WHERE fi.student_id = ?
             ORDER BY fi.due_date DESC, fi.id DESC",
            [$id]
        );

        foreach ($feeRows as &$inv) {
            $inv['amount'] = floatval($inv['amount']);
            $inv['discount'] = floatval($inv['discount']);
            $inv['paid_amount'] = floatval($inv['paid_amount']);
            $inv['net_amount'] = floatval($inv['net_amount']);
            $inv['due_amount'] = max(0, floatval($inv['due_amount']));

            $feeSummary['total_billed'] += $inv['net_amount'];
            $feeSummary['total_paid'] += $inv['paid_amount'];
            $feeSummary['total_due'] += $inv['due_amount'];
            $feeSummary['total_invoices']++;

            if ($inv['status'] === 'PAID') {
                $feeSummary['paid_count']++;
            } elseif ($inv['due_amount'] > 0) {
                $feeSummary['due_count']++;
                if ($inv['due_date'] >= $today) {
                    $feeSummary['upcoming_due'] += $inv['due_amount'];
                    $feeSummary['upcoming_count']++;
                } else {
                    $feeSummary['overdue_due'] += $inv['due_amount'];
                }
            }
        }
        $fees = $feeRows;
    } catch (Exception $e) {}

    // Load academic session history (all past completed sessions preserved for this student)
    $sessionHistory = [];
    try {
        $sessionHistory = $db->fetchAll(
            "SELECT * FROM student_session_history WHERE student_id = ? ORDER BY promoted_at ASC, id ASC",
            [$id]
        );
        foreach ($sessionHistory as &$sh) {
            $sh['attendance_rate'] = floatval($sh['attendance_rate']);
            $sh['fee_billed'] = floatval($sh['fee_billed']);
            $sh['fee_paid'] = floatval($sh['fee_paid']);
            $sh['fee_due'] = floatval($sh['fee_due']);
            $sh['gpa'] = $sh['gpa'] !== null ? floatval($sh['gpa']) : null;
            $sh['total_marks'] = $sh['total_marks'] !== null ? floatval($sh['total_marks']) : null;
        }
    } catch (Exception $e) {}

    Response::success('Student retrieved successfully', [
        'student' => $student,
        'attendance' => $attendance,
        'results' => $results,
        'lessons' => $lessons,
        'teachers' => $teachers,
        'exams' => $exams,
        'assignments' => $assignments,
        'announcements' => $announcements,
        'fees' => $fees,
        'fee_summary' => $feeSummary,
        'session_history' => $sessionHistory
    ]);
}

function createStudent($db) {
    AuthMiddleware::requireRole('admin');

    // Support both JSON and multipart/form-data (when photo is attached)
    $isMultipart = stripos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') !== false;
    $input = $isMultipart ? $_POST : (json_decode(file_get_contents('php://input'), true) ?? []);

    $required = ['username', 'password', 'name', 'surname', 'address', 'blood_type', 'sex', 'parent_id', 'class_id'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            Response::error("Field '{$field}' is required");
        }
    }

    if (strlen($input['password']) < 6) {
        Response::error('Password must be at least 6 characters');
    }

    // Resolve grade_id automatically from class_id or default grade
    $gradeId = $input['grade_id'] ?? null;
    if (empty($gradeId) && !empty($input['class_id'])) {
        $cls = $db->fetchOne("SELECT grade_id FROM classes WHERE id = ?", [$input['class_id']]);
        if ($cls && !empty($cls['grade_id'])) {
            $gradeId = $cls['grade_id'];
        }
    }
    if (empty($gradeId)) {
        $defaultGrade = $db->fetchOne("SELECT id FROM grades ORDER BY id ASC LIMIT 1");
        $gradeId = $defaultGrade['id'] ?? 1;
    }

    // Hash password
    $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);

    // Check student unique constraints explicitly
    $studentUsername = trim($input['username'] ?? '');
    $studentEmail = !empty(trim($input['email'] ?? '')) ? trim($input['email']) : null;
    $studentPhone = !empty(trim($input['phone'] ?? '')) ? trim($input['phone']) : null;

    if (!empty($studentUsername)) {
        $existing = $db->fetchOne("SELECT id FROM students WHERE username = ? LIMIT 1", [$studentUsername]);
        if ($existing) {
            Response::error("Student username '{$studentUsername}' is already taken. Please choose a different username.", 409);
        }
    }
    if (!empty($studentEmail)) {
        $existing = $db->fetchOne("SELECT id FROM students WHERE email = ? LIMIT 1", [$studentEmail]);
        if ($existing) {
            Response::error("A student with email address '{$studentEmail}' already exists.", 409);
        }
    }
    if (!empty($studentPhone)) {
        $existing = $db->fetchOne("SELECT id FROM students WHERE phone = ? LIMIT 1", [$studentPhone]);
        if ($existing) {
            Response::error("A student with phone number '{$studentPhone}' already exists.", 409);
        }
    }

    // Generate student ID based on: Current Year, Class, Roll (e.g. 20261A01)
    $idInfo = StudentIdGenerator::generate($db, $input['class_id'], $input['roll'] ?? null);
    $id = $idInfo['id'];
    $roll = $idInfo['roll'];

    // Handle photo upload (multipart only)
    $uploadedImage = null;
    if ($isMultipart) {
        $uploadedImage = storeStudentImage();
    }

    try {
        $db->insert('students', [
            'id'         => $id,
            'roll'       => $roll,
            'username'   => $studentUsername,
            'password'   => $hashedPassword,
            'name'       => $input['name'],
            'surname'    => $input['surname'],
            'email'      => $studentEmail,
            'phone'      => $studentPhone,
            'address'    => $input['address'],
            'img'        => $uploadedImage ?? ($input['img'] ?? null),
            'blood_type' => $input['blood_type'],
            'sex'        => $input['sex'],
            'student_type' => $input['student_type'] ?? null,
            'version'    => !empty($input['version']) ? trim($input['version']) : 'Bangla',
            'session_year' => !empty($input['session_year']) ? trim($input['session_year']) : '2026-2027',
            'status'     => !empty($input['status']) ? trim($input['status']) : 'ACTIVE',
            'parent_id'  => $input['parent_id'],
            'class_id'   => $input['class_id'],
            'grade_id'   => $gradeId
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
                'roll'                => $roll,
                'first_name'          => $input['name'],
                'last_name'           => $input['surname'],
                'email'               => $input['email'] ?? null,
                'phone'               => $input['phone'] ?? null,
                'gender'              => (isset($input['sex']) && strtoupper($input['sex']) === 'FEMALE') ? 'FEMALE' : 'MALE',
                'student_type'        => $input['student_type'] ?? null,
                'version'             => !empty($input['version']) ? trim($input['version']) : 'Bangla',
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
    $allowedFields = ['roll', 'name', 'surname', 'address', 'img', 'blood_type', 'sex', 'student_type', 'version', 'session_year', 'status', 'parent_id', 'class_id', 'grade_id'];
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $data[$field] = $input[$field];
        }
    }

    if (array_key_exists('email', $input)) {
        $data['email'] = !empty(trim($input['email'] ?? '')) ? trim($input['email']) : null;
    }
    if (array_key_exists('phone', $input)) {
        $data['phone'] = !empty(trim($input['phone'] ?? '')) ? trim($input['phone']) : null;
    }

    // If class_id was updated and grade_id not provided, automatically sync grade_id with the class
    if (isset($data['class_id']) && empty($data['grade_id'])) {
        $cls = $db->fetchOne("SELECT grade_id FROM classes WHERE id = ?", [$data['class_id']]);
        if ($cls && !empty($cls['grade_id'])) {
            $data['grade_id'] = $cls['grade_id'];
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
            if (isset($data['roll'])) $admData['roll'] = $data['roll'];
            if (isset($data['name'])) $admData['first_name'] = $data['name'];
            if (isset($data['surname'])) $admData['last_name'] = $data['surname'];
            if (isset($data['email'])) $admData['email'] = $data['email'];
            if (isset($data['phone'])) $admData['phone'] = $data['phone'];
            if (isset($data['address'])) $admData['address'] = $data['address'];
            if (isset($data['blood_type'])) $admData['blood_type'] = $data['blood_type'];
            if (isset($data['sex'])) $admData['gender'] = strtoupper($data['sex']) === 'FEMALE' ? 'FEMALE' : 'MALE';
            if (isset($data['student_type'])) $admData['student_type'] = $data['student_type'];
            if (isset($data['version'])) $admData['version'] = $data['version'];
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

        // Clean up session history records if any
        try {
            $db->delete('student_session_history', 'student_id = ?', [$id]);
        } catch (Exception $e) {}

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

function promoteStudent($db) {
    $user = AuthMiddleware::requireRole('admin');
    $adminUsername = $user['username'] ?? 'admin';

    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    if (empty($input)) {
        $input = $_POST;
    }

    $studentsPayload = [];
    if (!empty($input['students']) && is_array($input['students'])) {
        $studentsPayload = $input['students'];
    } elseif (!empty($input['student_id'])) {
        $studentsPayload = [$input];
    } else {
        Response::error('No students provided for promotion');
    }

    $defaultCompletedSession = trim($input['completed_session'] ?? '');
    $defaultTargetSession = trim($input['target_session'] ?? '');
    $defaultTargetClassId = $input['target_class_id'] ?? null;
    $createSessionFee = !empty($input['create_session_fee']);
    $sessionFeeAmount = floatval($input['session_fee_amount'] ?? 2000.00);
    $sessionFeeTitle = trim($input['session_fee_title'] ?? '');

    if (empty($defaultTargetSession)) {
        $defaultTargetSession = date('Y') . '-' . (date('Y') + 1);
    }

    $promotedCount = 0;
    $errors = [];

    foreach ($studentsPayload as $item) {
        $studentId = $item['student_id'] ?? null;
        if (!$studentId) continue;

        $student = null;
        try {
            $student = $db->fetchOne("SELECT s.*, c.name as class_name, g.level as grade_level FROM students s LEFT JOIN classes c ON s.class_id = c.id LEFT JOIN grades g ON s.grade_id = g.id WHERE s.id = ?", [$studentId]);
        } catch (Exception $e) {}

        if (!$student || !is_array($student)) {
            $errors[] = "Student ID {$studentId} not found.";
            continue;
        }

        $completedSession = !empty($item['completed_session']) ? trim($item['completed_session']) : (!empty($defaultCompletedSession) ? $defaultCompletedSession : (!empty($student['session_year']) ? $student['session_year'] : '2026-2027'));
        $targetSession = !empty($item['target_session']) ? trim($item['target_session']) : $defaultTargetSession;
        $targetClassId = !empty($item['target_class_id']) ? $item['target_class_id'] : $defaultTargetClassId;
        $targetRoll = isset($item['target_roll']) && $item['target_roll'] !== '' ? str_pad(trim((string)$item['target_roll']), 2, '0', STR_PAD_LEFT) : ($student['roll'] ?? '01');
        $promotionStatus = !empty($item['promotion_status']) ? strtoupper(trim($item['promotion_status'])) : 'PROMOTED';
        if (!in_array($promotionStatus, ['PROMOTED', 'RETAINED', 'PASSED_OUT', 'TRANSFERRED'])) {
            $promotionStatus = 'PROMOTED';
        }

        // If retained and no target_class_id specified, stay in same class
        if ($promotionStatus === 'RETAINED' && empty($targetClassId)) {
            $targetClassId = $student['class_id'];
        }

        // Target class info
        $targetClass = null;
        if (!empty($targetClassId)) {
            try {
                $targetClass = $db->fetchOne("SELECT c.*, g.level as grade_level FROM classes c LEFT JOIN grades g ON c.grade_id = g.id WHERE c.id = ?", [$targetClassId]);
            } catch (Exception $e) {}
        }

        // 1. Gather historical Attendance for the completed session
        $totalDays = 0;
        $presentDays = 0;
        $attRate = 0.00;
        try {
            $attRow = $db->fetchOne("SELECT COUNT(*) as total_days, SUM(CASE WHEN present = 1 THEN 1 ELSE 0 END) as present_days FROM attendance WHERE student_id = ?", [$studentId]);
            if ($attRow && is_array($attRow)) {
                $totalDays = intval($attRow['total_days'] ?? 0);
                $presentDays = intval($attRow['present_days'] ?? 0);
                $attRate = $totalDays > 0 ? round(($presentDays / $totalDays) * 100, 2) : 0.00;
            }
        } catch (Exception $e) {}

        // 2. Gather historical Results for the completed session
        $avgScore = 0.0;
        $totalMarks = 0.0;
        $resCount = 0;
        try {
            $resRow = $db->fetchOne("SELECT AVG(score) as avg_score, SUM(score) as total_score, COUNT(*) as cnt FROM results WHERE student_id = ?", [$studentId]);
            if ($resRow && is_array($resRow)) {
                $avgScore = floatval($resRow['avg_score'] ?? 0);
                $totalMarks = floatval($resRow['total_score'] ?? 0);
                $resCount = intval($resRow['cnt'] ?? 0);
            }
        } catch (Exception $e) {}

        // Calculate GPA & Grade if not manually passed
        $gpa = isset($item['gpa']) && $item['gpa'] !== '' ? floatval($item['gpa']) : null;
        $gradeLetter = $item['grade_letter'] ?? null;
        if ($gpa === null && $resCount > 0) {
            if ($avgScore >= 80) { $gpa = 5.00; $gradeLetter = 'A+'; }
            elseif ($avgScore >= 70) { $gpa = 4.00; $gradeLetter = 'A'; }
            elseif ($avgScore >= 60) { $gpa = 3.50; $gradeLetter = 'A-'; }
            elseif ($avgScore >= 50) { $gpa = 3.00; $gradeLetter = 'B'; }
            elseif ($avgScore >= 40) { $gpa = 2.00; $gradeLetter = 'C'; }
            elseif ($avgScore >= 33) { $gpa = 1.00; $gradeLetter = 'D'; }
            else { $gpa = 0.00; $gradeLetter = 'F'; }
        }
        $meritPosition = isset($item['merit_position']) && $item['merit_position'] !== '' ? intval($item['merit_position']) : null;

        // 3. Gather historical Fees for the completed session
        $feeBilled = 0.00;
        $feePaid = 0.00;
        $feeDue = 0.00;
        $feeClearanceStatus = 'CLEARED';
        try {
            $feeRow = $db->fetchOne("SELECT 
                COALESCE(SUM(amount - discount), 0) as total_billed,
                COALESCE(SUM(paid_amount), 0) as total_paid,
                COALESCE(SUM((amount - discount) - paid_amount), 0) as total_due
            FROM fee_invoices 
            WHERE student_id = ? AND (academic_year = ? OR academic_year = ?)", 
            [$studentId, $completedSession, $student['session_year'] ?? $completedSession]);

            if ($feeRow && is_array($feeRow)) {
                $feeBilled = floatval($feeRow['total_billed'] ?? 0);
                $feePaid = floatval($feeRow['total_paid'] ?? 0);
                $feeDue = max(0, floatval($feeRow['total_due'] ?? 0));
                $feeClearanceStatus = ($feeDue <= 0.01) ? 'CLEARED' : 'DUE';
            }
        } catch (Exception $e) {}

        $targetClassName = (is_array($targetClass) && !empty($targetClass['name'])) ? $targetClass['name'] : 'Next Class';
        $currentClassName = !empty($student['class_name']) ? $student['class_name'] : 'Class';

        $remarks = !empty($item['remarks']) ? trim($item['remarks']) : null;
        if (!$remarks) {
            if ($promotionStatus === 'PROMOTED') {
                $remarks = "Promoted from {$currentClassName} ({$completedSession}) to {$targetClassName} ({$targetSession})";
            } elseif ($promotionStatus === 'RETAINED') {
                $remarks = "Retained in {$currentClassName} for session {$targetSession}";
            } elseif ($promotionStatus === 'PASSED_OUT') {
                $remarks = "Graduated / Completed schooling from {$currentClassName} ({$completedSession})";
            } elseif ($promotionStatus === 'TRANSFERRED') {
                $remarks = "Transfer Certificate (TC) issued from {$currentClassName} ({$completedSession})";
            }
        }

        // 4. Archive completed session to student_session_history
        try {
            $db->insert('student_session_history', [
                'student_id'              => $studentId,
                'session_year'            => $completedSession,
                'class_id'                => intval($student['class_id'] ?? 0),
                'class_name'              => $currentClassName,
                'grade_id'                => !empty($student['grade_id']) ? intval($student['grade_id']) : null,
                'grade_level'             => !empty($student['grade_level']) ? intval($student['grade_level']) : null,
                'section'                 => $item['section'] ?? null,
                'roll'                    => $student['roll'] ?? null,
                'version'                 => $student['version'] ?? 'Bangla',
                'shift'                   => 'Day',
                'promotion_status'        => $promotionStatus,
                'gpa'                     => $gpa,
                'total_marks'             => $totalMarks,
                'grade_letter'            => $gradeLetter,
                'merit_position'          => $meritPosition,
                'attendance_total_days'   => $totalDays,
                'attendance_present_days' => $presentDays,
                'attendance_rate'         => $attRate,
                'fee_billed'              => $feeBilled,
                'fee_paid'                => $feePaid,
                'fee_due'                 => $feeDue,
                'fee_clearance_status'    => $feeClearanceStatus,
                'next_session_year'       => $targetSession,
                'next_class_id'           => $targetClassId ? intval($targetClassId) : null,
                'next_class_name'         => is_array($targetClass) ? ($targetClass['name'] ?? null) : null,
                'next_roll'               => $targetRoll,
                'remarks'                 => $remarks,
                'promoted_by'             => $adminUsername
            ]);
        } catch (Exception $e) {
            $errors[] = "Failed to archive history for {$studentId}: " . $e->getMessage();
            continue;
        }

        // 5. Update student's current active record
        $updateData = [
            'session_year' => $targetSession
        ];
        if ($promotionStatus === 'PROMOTED' || $promotionStatus === 'RETAINED') {
            if ($targetClassId) {
                $updateData['class_id'] = $targetClassId;
                if (is_array($targetClass) && !empty($targetClass['grade_id'])) {
                    $updateData['grade_id'] = $targetClass['grade_id'];
                }
            }
            if ($targetRoll) {
                $updateData['roll'] = $targetRoll;
            }
            $updateData['status'] = 'ACTIVE';
        } elseif ($promotionStatus === 'PASSED_OUT') {
            $updateData['status'] = 'GRADUATED';
        } elseif ($promotionStatus === 'TRANSFERRED') {
            $updateData['status'] = 'TRANSFERRED';
        }

        try {
            $db->update('students', $updateData, 'id = ?', [$studentId]);
        } catch (Exception $e) {
            try {
                $db->query("ALTER TABLE students ADD COLUMN session_year VARCHAR(50) DEFAULT '2026-2027'");
            } catch (Exception $e1) {}
            try {
                $db->query("ALTER TABLE students ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE'");
            } catch (Exception $e2) {}
            try {
                $db->update('students', $updateData, 'id = ?', [$studentId]);
            } catch (Exception $e3) {
                $errors[] = "Failed to update student {$studentId}: " . $e3->getMessage();
                continue;
            }
        }

        // 6. Generate Session Charge / Re-admission fee invoice if requested
        if ($createSessionFee && ($promotionStatus === 'PROMOTED' || $promotionStatus === 'RETAINED') && $sessionFeeAmount > 0) {
            try {
                $catRow = $db->fetchOne("SELECT id FROM fee_categories WHERE code = 'SESS' OR code = 'ADMS' OR name LIKE '%Session%' LIMIT 1");
                $catId = (is_array($catRow) && !empty($catRow['id'])) ? intval($catRow['id']) : 1;
                $cleanId = strtoupper(preg_replace('/[^a-zA-Z0-9]/', '', $studentId));
                $invNo = 'SESS-' . preg_replace('/[^a-zA-Z0-9]/', '', $targetSession) . '-' . $cleanId;
                $exists = $db->fetchOne("SELECT id FROM fee_invoices WHERE invoice_no = ?", [$invNo]);
                if ($exists) {
                    $invNo .= '-' . rand(10, 99);
                }

                $invTitle = !empty($sessionFeeTitle) ? $sessionFeeTitle : ("Annual Session Charge & Re-Admission Fee (সেশন ফি ও পুনর্ভর্তি) - " . $targetSession);
                $dueDate = date('Y-m-d', strtotime('+30 days'));

                $db->insert('fee_invoices', [
                    'invoice_no'      => $invNo,
                    'student_id'      => $studentId,
                    'fee_category_id' => $catId,
                    'title'           => $invTitle,
                    'due_date'        => $dueDate,
                    'amount'          => $sessionFeeAmount,
                    'discount'        => 0.00,
                    'paid_amount'     => 0.00,
                    'status'          => 'UNPAID',
                    'academic_year'   => $targetSession,
                    'notes'           => "Auto-generated session re-admission charge for {$targetSession} session in {$targetClassName}"
                ]);
            } catch (Exception $e) {
                // Non-fatal, session fee can also be generated manually
            }
        }

        // Sync with admissions table
        try {
            $admGradeId = (is_array($targetClass) && !empty($targetClass['grade_id'])) ? $targetClass['grade_id'] : ($student['grade_id'] ?? null);
            $db->update('admissions', [
                'class_id' => $targetClassId,
                'grade_id' => $admGradeId,
                'roll'     => $targetRoll
            ], 'enrolled_student_id = ?', [$studentId]);
        } catch (Exception $e) {}

        $promotedCount++;
    }

    Response::success("Successfully processed session promotion for {$promotedCount} student(s)", [
        'promoted_count' => $promotedCount,
        'errors'         => $errors
    ]);
}

function getStudentSessionHistory($db) {
    AuthMiddleware::requireAnyRole(['admin', 'teacher', 'parent', 'student']);
    $studentId = $_GET['student_id'] ?? null;
    if (!$studentId) {
        Response::error('Student ID is required');
    }

    $history = [];
    try {
        $history = $db->fetchAll(
            "SELECT * FROM student_session_history WHERE student_id = ? ORDER BY promoted_at ASC, id ASC",
            [$studentId]
        );
    } catch (Exception $e) {}

    if (is_array($history)) {
        foreach ($history as &$row) {
            $row['attendance_rate'] = floatval($row['attendance_rate'] ?? 0);
            $row['fee_billed'] = floatval($row['fee_billed'] ?? 0);
            $row['fee_paid'] = floatval($row['fee_paid'] ?? 0);
            $row['fee_due'] = floatval($row['fee_due'] ?? 0);
            $row['gpa'] = isset($row['gpa']) && $row['gpa'] !== null ? floatval($row['gpa']) : null;
            $row['total_marks'] = isset($row['total_marks']) && $row['total_marks'] !== null ? floatval($row['total_marks']) : null;
        }
    } else {
        $history = [];
    }

    $currentStudent = null;
    try {
        $currentStudent = $db->fetchOne(
            "SELECT s.id, s.name, s.surname, s.roll, COALESCE(NULLIF(s.session_year, ''), '2026-2027') as session_year, COALESCE(NULLIF(s.status, ''), 'ACTIVE') as status, s.version, c.name as class_name, g.level as grade_level
             FROM students s
             LEFT JOIN classes c ON s.class_id = c.id
             LEFT JOIN grades g ON s.grade_id = g.id
             WHERE s.id = ?",
            [$studentId]
        );
    } catch (Exception $e) {}

    Response::success('Session history retrieved successfully', [
        'history' => $history,
        'current' => $currentStudent ?: null
    ]);
}

function getPromotionsSummary($db) {
    AuthMiddleware::requireAnyRole(['admin', 'teacher']);

    $totalStudents = 0;
    try {
        $stCountRow = $db->fetchOne("SELECT COUNT(*) as cnt FROM students");
        $totalStudents = intval($stCountRow['cnt'] ?? 0);
    } catch (Exception $e) {}

    $activeSession = '2026-2027';
    try {
        $activeSessRow = $db->fetchOne("SELECT session_year, COUNT(*) as cnt FROM students WHERE session_year IS NOT NULL AND session_year != '' GROUP BY session_year ORDER BY cnt DESC LIMIT 1");
        if ($activeSessRow && !empty($activeSessRow['session_year'])) {
            $activeSession = $activeSessRow['session_year'];
        }
    } catch (Exception $e) {}

    $histSummary = [];
    try {
        $histSummary = $db->fetchOne("SELECT 
            COUNT(*) as total_records,
            SUM(CASE WHEN promotion_status = 'PROMOTED' THEN 1 ELSE 0 END) as total_promoted,
            SUM(CASE WHEN promotion_status = 'RETAINED' THEN 1 ELSE 0 END) as total_retained,
            SUM(CASE WHEN promotion_status = 'PASSED_OUT' THEN 1 ELSE 0 END) as total_graduated,
            SUM(CASE WHEN promotion_status = 'TRANSFERRED' THEN 1 ELSE 0 END) as total_transferred
        FROM student_session_history") ?: [];
    } catch (Exception $e) {}

    // All available sessions in system
    $allSessions = [];
    try {
        $s1 = $db->fetchAll("SELECT DISTINCT session_year FROM student_session_history WHERE session_year IS NOT NULL AND session_year != ''");
        $s2 = $db->fetchAll("SELECT DISTINCT session_year FROM students WHERE session_year IS NOT NULL AND session_year != ''");
        $s3 = $db->fetchAll("SELECT DISTINCT academic_year as session_year FROM fee_invoices WHERE academic_year IS NOT NULL AND academic_year != ''");
        $set = [];
        foreach (array_merge($s1, $s2, $s3) as $r) {
            $val = trim($r['session_year'] ?? '');
            if ($val !== '') $set[$val] = true;
        }
        $set['2025-2026'] = true;
        $set['2026-2027'] = true;
        $set['2027'] = true;
        $allSessions = array_keys($set);
        rsort($allSessions);
    } catch (Exception $e) {
        $allSessions = ['2027', '2026-2027', '2025-2026'];
    }

    Response::success('Promotion summary retrieved successfully', [
        'active_session'     => $activeSession,
        'total_students'     => $totalStudents,
        'total_records'      => intval($histSummary['total_records'] ?? 0),
        'total_promoted'     => intval($histSummary['total_promoted'] ?? 0),
        'total_retained'     => intval($histSummary['total_retained'] ?? 0),
        'total_graduated'    => intval($histSummary['total_graduated'] ?? 0),
        'total_transferred'  => intval($histSummary['total_transferred'] ?? 0),
        'available_sessions' => $allSessions
    ]);
}
