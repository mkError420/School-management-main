<?php

$db = Database::getInstance();
ensureAdmissionsTable($db);

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            getAdmission($db, $id);
        } else {
            getAdmissions($db);
        }
        break;

    case 'POST':
        createAdmission($db);
        break;

    case 'PUT':
        if (!$id) {
            Response::error('Admission ID is required');
        }
        updateAdmission($db, $id);
        break;

    case 'DELETE':
        if (!$id) {
            Response::error('Admission ID is required');
        }
        deleteAdmission($db, $id);
        break;

    default:
        Response::methodNotAllowed();
}

function ensureAdmissionsTable($db) {
    try {
        // NOTE: Avoid DEFAULT (CURRENT_DATE) — it requires MySQL 8.0.13+.
        // Use NULL as default and let application code supply the date on INSERT.
        $sql = "CREATE TABLE IF NOT EXISTS admissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            application_no VARCHAR(50) UNIQUE NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(50),
            date_of_birth DATE,
            gender ENUM('MALE', 'FEMALE') NOT NULL DEFAULT 'MALE',
            blood_type VARCHAR(10) DEFAULT 'A+',
            address TEXT,
            grade_id INT,
            class_id INT,
            parent_name VARCHAR(255),
            parent_phone VARCHAR(50),
            parent_email VARCHAR(255),
            parent_id VARCHAR(255),
            previous_school VARCHAR(255),
            status ENUM('PENDING', 'APPROVED', 'WAITLISTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
            notes TEXT,
            applied_date DATE NULL,
            enrolled_student_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        $db->query($sql);
    } catch (Exception $e) {
        error_log('Error creating admissions table: ' . $e->getMessage());
        // Re-throw so the router catches it and returns a proper JSON error
        throw new Exception('Database setup error: ' . $e->getMessage());
    }

    // Only seed if the table is now accessible and empty
    try {
        $count = $db->fetchOne("SELECT COUNT(*) as total FROM admissions")['total'] ?? 0;
        if ((int)$count === 0) {
            seedSampleAdmissions($db);
        }
    } catch (Exception $e) {
        error_log('Error seeding admissions: ' . $e->getMessage());
    }
}

function seedSampleAdmissions($db) {
    $samples = [
        [
            'application_no' => 'ADM-2026-101',
            'first_name' => 'Alexander',
            'last_name' => 'Wright',
            'email' => 'alex.wright@example.com',
            'phone' => '+1 555-0192',
            'date_of_birth' => '2012-04-15',
            'gender' => 'MALE',
            'blood_type' => 'O+',
            'address' => '742 Evergreen Terrace, Springfield',
            'grade_id' => 1,
            'class_id' => 1,
            'parent_name' => 'Robert Wright',
            'parent_phone' => '+1 555-0193',
            'parent_email' => 'robert.w@example.com',
            'previous_school' => 'Oakridge Primary Academy',
            'status' => 'PENDING',
            'notes' => 'Advanced in Mathematics and Science. High entrance exam score (94%).',
            'applied_date' => date('Y-m-d', strtotime('-2 days'))
        ],
        [
            'application_no' => 'ADM-2026-102',
            'first_name' => 'Sophia',
            'last_name' => 'Martinez',
            'email' => 'sophia.m@example.com',
            'phone' => '+1 555-0244',
            'date_of_birth' => '2013-09-21',
            'gender' => 'FEMALE',
            'blood_type' => 'A+',
            'address' => '124 Blossom Hill Rd, Springfield',
            'grade_id' => 2,
            'class_id' => 2,
            'parent_name' => 'Elena Martinez',
            'parent_phone' => '+1 555-0245',
            'parent_email' => 'elena.m@example.com',
            'previous_school' => 'St. Jude International School',
            'status' => 'PENDING',
            'notes' => 'Transfer student from another district. Documents submitted and verified.',
            'applied_date' => date('Y-m-d', strtotime('-4 days'))
        ],
        [
            'application_no' => 'ADM-2026-103',
            'first_name' => 'Liam',
            'last_name' => 'Chen',
            'email' => 'liam.chen@example.com',
            'phone' => '+1 555-0377',
            'date_of_birth' => '2011-11-08',
            'gender' => 'MALE',
            'blood_type' => 'B+',
            'address' => '88 Horizon Way, Springfield',
            'grade_id' => 3,
            'class_id' => 3,
            'parent_name' => 'David Chen',
            'parent_phone' => '+1 555-0378',
            'parent_email' => 'david.chen@example.com',
            'previous_school' => 'Lincoln Middle School',
            'status' => 'APPROVED',
            'notes' => 'Admission accepted and tuition fee cleared. Enrolled into Class 3A.',
            'applied_date' => date('Y-m-d', strtotime('-8 days'))
        ],
        [
            'application_no' => 'ADM-2026-104',
            'first_name' => 'Emily',
            'last_name' => 'Taylor',
            'email' => 'emily.t@example.com',
            'phone' => '+1 555-0488',
            'date_of_birth' => '2012-02-19',
            'gender' => 'FEMALE',
            'blood_type' => 'AB+',
            'address' => '325 Maple Ave, Springfield',
            'grade_id' => 1,
            'class_id' => 1,
            'parent_name' => 'Sarah Taylor',
            'parent_phone' => '+1 555-0489',
            'parent_email' => 'sarah.taylor@example.com',
            'previous_school' => 'Springfield Elementary',
            'status' => 'WAITLISTED',
            'notes' => 'Waiting for capacity opening in Class 1A.',
            'applied_date' => date('Y-m-d', strtotime('-12 days'))
        ]
    ];

    foreach ($samples as $sample) {
        try {
            $db->insert('admissions', $sample);
        } catch (Exception $e) {
            // ignore duplicates
        }
    }
}

function getAdmissions($db) {
    AuthMiddleware::requireAnyRole(['admin', 'super_admin']);

    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 10);
    $search = $_GET['search'] ?? '';
    $status = $_GET['status'] ?? '';
    $gradeId = $_GET['grade_id'] ?? '';
    $offset = ($page - 1) * $limit;

    $sql = "SELECT a.*, c.name as class_name, g.level as grade_level,
                   p.name as linked_parent_name, p.surname as linked_parent_surname
            FROM admissions a
            LEFT JOIN classes c ON a.class_id = c.id
            LEFT JOIN grades g ON a.grade_id = g.id
            LEFT JOIN parents p ON a.parent_id = p.id
            WHERE 1=1";
    $params = [];

    if (!empty($status) && $status !== 'all') {
        $sql .= " AND a.status = ?";
        $params[] = strtoupper($status);
    }

    if (!empty($gradeId) && $gradeId !== 'all') {
        $sql .= " AND a.grade_id = ?";
        $params[] = $gradeId;
    }

    if (!empty($search)) {
        $sql .= " AND (a.first_name LIKE ? OR a.last_name LIKE ? OR a.application_no LIKE ? OR a.email LIKE ? OR a.parent_name LIKE ?)";
        $term = "%{$search}%";
        $params = array_merge($params, [$term, $term, $term, $term, $term]);
    }

    // Counts by status
    $counts = [
        'total' => $db->fetchOne("SELECT COUNT(*) as total FROM admissions")['total'] ?? 0,
        'pending' => $db->fetchOne("SELECT COUNT(*) as total FROM admissions WHERE status = 'PENDING'")['total'] ?? 0,
        'approved' => $db->fetchOne("SELECT COUNT(*) as total FROM admissions WHERE status = 'APPROVED'")['total'] ?? 0,
        'waitlisted' => $db->fetchOne("SELECT COUNT(*) as total FROM admissions WHERE status = 'WAITLISTED'")['total'] ?? 0,
        'rejected' => $db->fetchOne("SELECT COUNT(*) as total FROM admissions WHERE status = 'REJECTED'")['total'] ?? 0,
    ];

    // Filtered count
    $countSql = preg_replace('/SELECT a\.\*.*?FROM admissions a/s', 'SELECT COUNT(*) as total FROM admissions a', $sql);
    $totalFiltered = $db->fetchOne($countSql, $params)['total'] ?? 0;

    $sql .= " ORDER BY a.created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;

    $admissions = $db->fetchAll($sql, $params);

    Response::success('Admissions retrieved successfully', [
        'admissions' => $admissions,
        'counts' => $counts,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $totalFiltered,
            'pages' => ceil($totalFiltered / max(1, $limit))
        ]
    ]);
}

function getAdmission($db, $id) {
    AuthMiddleware::requireAnyRole(['admin', 'super_admin']);

    $admission = $db->fetchOne(
        "SELECT a.*, c.name as class_name, g.level as grade_level,
                p.name as linked_parent_name, p.surname as linked_parent_surname, p.phone as linked_parent_phone
         FROM admissions a
         LEFT JOIN classes c ON a.class_id = c.id
         LEFT JOIN grades g ON a.grade_id = g.id
         LEFT JOIN parents p ON a.parent_id = p.id
         WHERE a.id = ?",
        [$id]
    );

    if (!$admission) {
        Response::notFound('Admission application not found');
    }

    // Check if enrolled student exists
    $enrolledStudent = null;
    if (!empty($admission['enrolled_student_id'])) {
        $enrolledStudent = $db->fetchOne(
            "SELECT id, username, name, surname, email, phone, class_id FROM students WHERE id = ?",
            [$admission['enrolled_student_id']]
        );
    }

    Response::success('Admission application retrieved', [
        'admission' => $admission,
        'student' => $enrolledStudent
    ]);
}

function createAdmission($db) {
    AuthMiddleware::requireAnyRole(['admin', 'super_admin']);

    $input = json_decode(file_get_contents('php://input'), true);

    $required = ['first_name', 'last_name', 'gender'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            Response::error("Field '{$field}' is required");
        }
    }

    $appNo = 'ADM-' . date('Y') . '-' . str_pad(rand(100, 9999), 4, '0', STR_PAD_LEFT);
    $status = !empty($input['status']) ? strtoupper($input['status']) : 'PENDING';

    $data = [
        'application_no' => $appNo,
        'first_name' => trim($input['first_name']),
        'last_name' => trim($input['last_name']),
        'email' => $input['email'] ?? null,
        'phone' => $input['phone'] ?? null,
        'date_of_birth' => !empty($input['date_of_birth']) ? $input['date_of_birth'] : null,
        'gender' => strtoupper($input['gender']) === 'FEMALE' ? 'FEMALE' : 'MALE',
        'blood_type' => $input['blood_type'] ?? 'A+',
        'address' => $input['address'] ?? '',
        'grade_id' => !empty($input['grade_id']) ? $input['grade_id'] : null,
        'class_id' => !empty($input['class_id']) ? $input['class_id'] : null,
        'parent_name' => $input['parent_name'] ?? null,
        'parent_phone' => $input['parent_phone'] ?? null,
        'parent_email' => $input['parent_email'] ?? null,
        'parent_id' => !empty($input['parent_id']) ? $input['parent_id'] : null,
        'previous_school' => $input['previous_school'] ?? null,
        'status' => $status,
        'notes' => $input['notes'] ?? null,
        'applied_date' => $input['applied_date'] ?? date('Y-m-d')
    ];

    try {
        $admissionId = $db->insert('admissions', $data);

        // If status is APPROVED or auto_enroll requested, create student in students table
        $enrolledStudentId = null;
        if ($status === 'APPROVED' || !empty($input['auto_enroll'])) {
            $enrolledStudentId = enrollStudentFromAdmission($db, $data);
            if ($enrolledStudentId) {
                $db->update('admissions', [
                    'status' => 'APPROVED',
                    'enrolled_student_id' => $enrolledStudentId
                ], 'id = ?', [$admissionId]);
            }
        }

        $created = $db->fetchOne("SELECT a.*, c.name as class_name, g.level as grade_level FROM admissions a LEFT JOIN classes c ON a.class_id = c.id LEFT JOIN grades g ON a.grade_id = g.id WHERE a.id = ?", [$admissionId]);
        Response::success('Admission application created successfully', $created, 201);
    } catch (Exception $e) {
        Response::error('Failed to create admission: ' . $e->getMessage());
    }
}

function updateAdmission($db, $id) {
    AuthMiddleware::requireAnyRole(['admin', 'super_admin']);

    $existing = $db->fetchOne("SELECT * FROM admissions WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Admission application not found');
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $allowed = ['first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender', 'blood_type', 'address', 'grade_id', 'class_id', 'parent_name', 'parent_phone', 'parent_email', 'parent_id', 'previous_school', 'status', 'notes', 'applied_date'];

    $data = [];
    foreach ($allowed as $f) {
        if (isset($input[$f])) {
            $data[$f] = $f === 'status' ? strtoupper($input[$f]) : $input[$f];
        }
    }

    if (empty($data)) {
        Response::error('No fields provided to update');
    }

    // Auto-enroll if changed to APPROVED and not enrolled yet
    $currentStatus = $data['status'] ?? $existing['status'];
    if ($currentStatus === 'APPROVED' && empty($existing['enrolled_student_id'])) {
        $merged = array_merge($existing, $data);
        $enrolledId = enrollStudentFromAdmission($db, $merged);
        if ($enrolledId) {
            $data['enrolled_student_id'] = $enrolledId;
            $data['status'] = 'APPROVED';
        }
    }

    try {
        $db->update('admissions', $data, 'id = ?', [$id]);
        $updated = $db->fetchOne("SELECT a.*, c.name as class_name, g.level as grade_level FROM admissions a LEFT JOIN classes c ON a.class_id = c.id LEFT JOIN grades g ON a.grade_id = g.id WHERE a.id = ?", [$id]);
        Response::success('Admission updated successfully', $updated);
    } catch (Exception $e) {
        Response::error('Failed to update admission: ' . $e->getMessage());
    }
}

function deleteAdmission($db, $id) {
    AuthMiddleware::requireAnyRole(['admin', 'super_admin']);

    $existing = $db->fetchOne("SELECT * FROM admissions WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Admission application not found');
    }

    try {
        $db->delete('admissions', 'id = ?', [$id]);
        Response::success('Admission deleted successfully');
    } catch (Exception $e) {
        Response::error('Failed to delete admission: ' . $e->getMessage());
    }
}

function enrollStudentFromAdmission($db, $data) {
    try {
        // Find or create parent
        $parentId = $data['parent_id'] ?? null;
        if (empty($parentId)) {
            $parentName = !empty($data['parent_name']) ? trim($data['parent_name']) : ($data['last_name'] . ' Family');
            $parts = explode(' ', $parentName);
            $pFirst = $parts[0] ?? 'Parent';
            $pLast = count($parts) > 1 ? end($parts) : 'Guardian';
            $pPhone = !empty($data['parent_phone']) ? $data['parent_phone'] : '+1 555-' . rand(1000, 9999);
            $pEmail = !empty($data['parent_email']) ? $data['parent_email'] : 'parent.' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $pFirst)) . rand(10, 99) . '@example.com';

            $existingParent = $db->fetchOne("SELECT id FROM parents WHERE phone = ? OR email = ? LIMIT 1", [$pPhone, $pEmail]);
            if ($existingParent) {
                $parentId = $existingParent['id'];
            } else {
                $parentId = uniqid('prt_');
                $pUsername = 'p.' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $pFirst)) . rand(100, 999);
                $db->insert('parents', [
                    'id' => $parentId,
                    'username' => $pUsername,
                    'password' => password_hash('Parent123!', PASSWORD_DEFAULT),
                    'name' => $pFirst,
                    'surname' => $pLast,
                    'email' => $pEmail,
                    'phone' => $pPhone,
                    'address' => $data['address'] ?: 'Springfield'
                ]);
            }
        }

        // Get default class and grade if missing
        $gradeId = $data['grade_id'];
        if (empty($gradeId)) {
            $defaultGrade = $db->fetchOne("SELECT id FROM grades ORDER BY id ASC LIMIT 1");
            $gradeId = $defaultGrade['id'] ?? 1;
        }

        $classId = $data['class_id'];
        if (empty($classId)) {
            $defaultClass = $db->fetchOne("SELECT id FROM classes WHERE grade_id = ? LIMIT 1", [$gradeId]);
            if (!$defaultClass) {
                $defaultClass = $db->fetchOne("SELECT id FROM classes ORDER BY id ASC LIMIT 1");
            }
            $classId = $defaultClass['id'] ?? 1;
        }

        // Generate student username and ID
        $cleanFirst = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $data['first_name']));
        $cleanLast = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $data['last_name']));
        $username = $cleanFirst . '.' . $cleanLast . rand(10, 99);
        $studentId = uniqid('std_');

        $db->insert('students', [
            'id' => $studentId,
            'username' => $username,
            'password' => password_hash('Student123!', PASSWORD_DEFAULT),
            'name' => $data['first_name'],
            'surname' => $data['last_name'],
            'email' => $data['email'] ?: ($username . '@school.edu'),
            'phone' => $data['phone'] ?: ($data['parent_phone'] ?? null),
            'address' => $data['address'] ?: 'Springfield',
            'img' => null,
            'blood_type' => $data['blood_type'] ?: 'A+',
            'sex' => $data['gender'] === 'FEMALE' ? 'FEMALE' : 'MALE',
            'parent_id' => $parentId,
            'class_id' => $classId,
            'grade_id' => $gradeId
        ]);

        return $studentId;
    } catch (Exception $e) {
        error_log('Auto enroll student failed: ' . $e->getMessage());
        return null;
    }
}
