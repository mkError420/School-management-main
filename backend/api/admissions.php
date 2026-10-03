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
            username VARCHAR(255) NULL,
            password VARCHAR(255) NULL,
            img VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        $db->query($sql);
    } catch (Exception $e) {
        error_log('Error creating admissions table: ' . $e->getMessage());
        // Re-throw so the router catches it and returns a proper JSON error
        throw new Exception('Database setup error: ' . $e->getMessage());
    }

    // Safely add username, password, img if existing table doesn't have them
    try {
        $cols = $db->fetchAll("SHOW COLUMNS FROM admissions LIKE 'username'");
        if (empty($cols)) {
            $db->query("ALTER TABLE admissions ADD COLUMN username VARCHAR(255) NULL AFTER enrolled_student_id");
        }
    } catch (Exception $e) {}
    try {
        $cols = $db->fetchAll("SHOW COLUMNS FROM admissions LIKE 'password'");
        if (empty($cols)) {
            $db->query("ALTER TABLE admissions ADD COLUMN password VARCHAR(255) NULL AFTER username");
        }
    } catch (Exception $e) {}
    try {
        $cols = $db->fetchAll("SHOW COLUMNS FROM admissions LIKE 'img'");
        if (empty($cols)) {
            $db->query("ALTER TABLE admissions ADD COLUMN img VARCHAR(255) NULL AFTER password");
        }
    } catch (Exception $e) {}

    // Only seed if the table is now accessible and empty
    try {
        $count = $db->fetchOne("SELECT COUNT(*) as total FROM admissions")['total'] ?? 0;
        if ((int)$count === 0) {
            seedSampleAdmissions($db);
        }
    } catch (Exception $e) {
        error_log('Error seeding admissions: ' . $e->getMessage());
    }

    // Dynamically sync any existing enrolled students from the students table
    syncStudentsWithAdmissions($db);
}

function syncStudentsWithAdmissions($db) {
    try {
        // Find enrolled students in students table who do NOT yet have an admission record
        $unlinkedStudents = $db->fetchAll(
            "SELECT s.id, s.username, s.name, s.surname, s.email, s.phone, s.address, 
                    s.blood_type, s.sex, s.class_id, s.grade_id, s.parent_id, s.created_at,
                    p.name as p_name, p.surname as p_surname, p.phone as p_phone, p.email as p_email
             FROM students s
             LEFT JOIN admissions a ON a.enrolled_student_id = s.id
             LEFT JOIN parents p ON s.parent_id = p.id
             WHERE a.id IS NULL"
        );

        if (!empty($unlinkedStudents)) {
            foreach ($unlinkedStudents as $student) {
                // Check if an unlinked admission already exists by matching email or full name
                $matched = null;
                if (!empty($student['email'])) {
                    $matched = $db->fetchOne(
                        "SELECT id FROM admissions WHERE email = ? AND (enrolled_student_id IS NULL OR enrolled_student_id = '')",
                        [$student['email']]
                    );
                }
                if (!$matched && !empty($student['name']) && !empty($student['surname'])) {
                    $matched = $db->fetchOne(
                        "SELECT id FROM admissions WHERE first_name = ? AND last_name = ? AND (enrolled_student_id IS NULL OR enrolled_student_id = '')",
                        [$student['name'], $student['surname']]
                    );
                }

                if ($matched) {
                    $db->update('admissions', [
                        'enrolled_student_id' => $student['id'],
                        'status' => 'APPROVED',
                        'username' => $student['username'] ?? null,
                        'img' => $student['img'] ?? null,
                        'class_id' => $student['class_id'],
                        'grade_id' => $student['grade_id'],
                        'parent_id' => $student['parent_id']
                    ], 'id = ?', [$matched['id']]);
                    continue;
                }

                // Generate unique readable application number for the enrolled student
                $cleanId = strtoupper(preg_replace('/[^a-zA-Z0-9]/', '', $student['id']));
                $year = !empty($student['created_at']) ? date('Y', strtotime($student['created_at'])) : date('Y');
                $appNo = 'ADM-' . $year . '-' . $cleanId;

                $checkApp = $db->fetchOne("SELECT id FROM admissions WHERE application_no = ?", [$appNo]);
                if ($checkApp) {
                    $appNo = 'ADM-' . $year . '-' . $cleanId . '-' . rand(10, 99);
                }

                $parentName = trim(($student['p_name'] ?? '') . ' ' . ($student['p_surname'] ?? ''));
                if (empty($parentName)) {
                    $parentName = $student['surname'] . ' Family';
                }

                $gender = (isset($student['sex']) && strtoupper($student['sex']) === 'FEMALE') ? 'FEMALE' : 'MALE';
                $appliedDate = !empty($student['created_at']) ? date('Y-m-d', strtotime($student['created_at'])) : date('Y-m-d');
                $createdAt = !empty($student['created_at']) ? $student['created_at'] : date('Y-m-d H:i:s');

                $db->insert('admissions', [
                    'application_no' => $appNo,
                    'username' => $student['username'] ?? null,
                    'first_name' => $student['name'],
                    'last_name' => $student['surname'],
                    'email' => $student['email'] ?: null,
                    'phone' => $student['phone'] ?: null,
                    'date_of_birth' => null,
                    'gender' => $gender,
                    'blood_type' => $student['blood_type'] ?: 'AB+',
                    'address' => $student['address'] ?: '',
                    'img' => $student['img'] ?? null,
                    'grade_id' => $student['grade_id'],
                    'class_id' => $student['class_id'],
                    'parent_name' => $parentName,
                    'parent_phone' => $student['p_phone'] ?: null,
                    'parent_email' => $student['p_email'] ?: null,
                    'parent_id' => $student['parent_id'],
                    'previous_school' => 'Direct Enrollment',
                    'status' => 'APPROVED',
                    'notes' => 'Enrolled student account (dynamically synced with school student database).',
                    'applied_date' => $appliedDate,
                    'enrolled_student_id' => $student['id'],
                    'created_at' => $createdAt
                ]);
            }
        }

        // Normalize any sample row that was marked APPROVED without a student record,
        // so that "Approved & Enrolled" strictly reflects actual active students in the students table
        $db->query("UPDATE admissions SET status = 'PENDING', notes = 'Application under review for classroom enrollment.' WHERE status = 'APPROVED' AND (enrolled_student_id IS NULL OR enrolled_student_id = '')");

    } catch (Exception $e) {
        error_log('Error syncing students with admissions: ' . $e->getMessage());
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
            'status' => 'PENDING',
            'notes' => 'Admission accepted by committee. Awaiting enrollment confirmation.',
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

    // Ensure student-admission synchronization is fresh
    syncStudentsWithAdmissions($db);

    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 10);
    $search = $_GET['search'] ?? '';
    $status = $_GET['status'] ?? '';
    $gradeId = $_GET['grade_id'] ?? '';
    $offset = ($page - 1) * $limit;

    $sql = "SELECT a.*, 
                   COALESCE(a.username, s.username) as username,
                   COALESCE(a.img, s.img) as img,
                   c.name as class_name, g.level as grade_level,
                   p.name as linked_parent_name, p.surname as linked_parent_surname
            FROM admissions a
            LEFT JOIN classes c ON a.class_id = c.id
            LEFT JOIN grades g ON a.grade_id = g.id
            LEFT JOIN parents p ON a.parent_id = p.id
            LEFT JOIN students s ON a.enrolled_student_id = s.id
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
        $sql .= " AND (a.first_name LIKE ? OR a.last_name LIKE ? OR a.application_no LIKE ? OR a.email LIKE ? OR a.parent_name LIKE ? OR a.enrolled_student_id LIKE ?)";
        $term = "%{$search}%";
        $params = array_merge($params, [$term, $term, $term, $term, $term, $term]);
    }

    // Dynamic counts by status
    $counts = [
        'total' => (int)($db->fetchOne("SELECT COUNT(*) as total FROM admissions")['total'] ?? 0),
        'pending' => (int)($db->fetchOne("SELECT COUNT(*) as total FROM admissions WHERE status = 'PENDING'")['total'] ?? 0),
        'approved' => (int)($db->fetchOne("SELECT COUNT(*) as total FROM admissions WHERE status = 'APPROVED'")['total'] ?? 0),
        'waitlisted' => (int)($db->fetchOne("SELECT COUNT(*) as total FROM admissions WHERE status = 'WAITLISTED'")['total'] ?? 0),
        'rejected' => (int)($db->fetchOne("SELECT COUNT(*) as total FROM admissions WHERE status = 'REJECTED'")['total'] ?? 0),
    ];

    // Filtered count
    $countSql = preg_replace('/SELECT a\.\*.*?FROM admissions a/s', 'SELECT COUNT(*) as total FROM admissions a', $sql);
    $totalFiltered = (int)($db->fetchOne($countSql, $params)['total'] ?? 0);

    // Show pending reviews and waitlisted applicants first, followed by active approved students
    $sql .= " ORDER BY (CASE WHEN a.status = 'PENDING' THEN 1 WHEN a.status = 'WAITLISTED' THEN 2 WHEN a.status = 'APPROVED' THEN 3 ELSE 4 END) ASC, a.created_at DESC, a.id DESC LIMIT ? OFFSET ?";
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
        "SELECT a.*, 
                COALESCE(a.username, s.username) as username,
                COALESCE(a.img, s.img) as img,
                c.name as class_name, g.level as grade_level,
                p.name as linked_parent_name, p.surname as linked_parent_surname, p.phone as linked_parent_phone
         FROM admissions a
         LEFT JOIN classes c ON a.class_id = c.id
         LEFT JOIN grades g ON a.grade_id = g.id
         LEFT JOIN parents p ON a.parent_id = p.id
         LEFT JOIN students s ON a.enrolled_student_id = s.id
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

    $firstName = trim($input['first_name'] ?? $input['name'] ?? '');
    $lastName = trim($input['last_name'] ?? $input['surname'] ?? '');
    $sex = strtoupper($input['sex'] ?? $input['gender'] ?? 'MALE');
    $gender = ($sex === 'FEMALE') ? 'FEMALE' : 'MALE';

    if (empty($firstName) || empty($lastName)) {
        Response::error("First name and last name are required");
    }

    $appNo = 'ADM-' . date('Y') . '-' . str_pad(rand(100, 9999), 4, '0', STR_PAD_LEFT);
    $status = !empty($input['status']) ? strtoupper($input['status']) : 'PENDING';

    $parentId = !empty($input['parent_id']) ? $input['parent_id'] : null;
    $parentName = $input['parent_name'] ?? null;
    $parentPhone = $input['parent_phone'] ?? null;
    $parentEmail = $input['parent_email'] ?? null;

    if ($parentId) {
        $parent = $db->fetchOne("SELECT name, surname, phone, email FROM parents WHERE id = ?", [$parentId]);
        if ($parent) {
            $parentName = trim(($parent['name'] ?? '') . ' ' . ($parent['surname'] ?? ''));
            $parentPhone = $parent['phone'] ?? $parentPhone;
            $parentEmail = $parent['email'] ?? $parentEmail;
        }
    }

    $username = trim($input['username'] ?? '');
    if (empty($username)) {
        $cleanFirst = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $firstName));
        $cleanLast = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $lastName));
        $username = $cleanFirst . '.' . $cleanLast . rand(10, 99);
    }

    $rawPassword = !empty($input['password']) ? $input['password'] : 'Student123!';
    $hashedPassword = str_starts_with($rawPassword, '$2y$') ? $rawPassword : password_hash($rawPassword, PASSWORD_DEFAULT);

    $data = [
        'application_no' => $appNo,
        'username' => $username,
        'password' => $hashedPassword,
        'first_name' => $firstName,
        'last_name' => $lastName,
        'email' => $input['email'] ?? null,
        'phone' => $input['phone'] ?? null,
        'date_of_birth' => !empty($input['date_of_birth']) ? $input['date_of_birth'] : null,
        'gender' => $gender,
        'blood_type' => $input['blood_type'] ?? 'AB+',
        'address' => $input['address'] ?? '',
        'img' => $input['img'] ?? null,
        'grade_id' => !empty($input['grade_id']) ? $input['grade_id'] : null,
        'class_id' => !empty($input['class_id']) ? $input['class_id'] : null,
        'parent_name' => $parentName,
        'parent_phone' => $parentPhone,
        'parent_email' => $parentEmail,
        'parent_id' => $parentId,
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

        $created = $db->fetchOne("SELECT a.*, COALESCE(a.username, s.username) as username, COALESCE(a.img, s.img) as img, c.name as class_name, g.level as grade_level, p.name as linked_parent_name, p.surname as linked_parent_surname FROM admissions a LEFT JOIN classes c ON a.class_id = c.id LEFT JOIN grades g ON a.grade_id = g.id LEFT JOIN parents p ON a.parent_id = p.id LEFT JOIN students s ON a.enrolled_student_id = s.id WHERE a.id = ?", [$admissionId]);
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
    $allowed = ['username', 'password', 'first_name', 'last_name', 'name', 'surname', 'email', 'phone', 'date_of_birth', 'gender', 'sex', 'blood_type', 'address', 'img', 'grade_id', 'class_id', 'parent_name', 'parent_phone', 'parent_email', 'parent_id', 'previous_school', 'status', 'notes', 'applied_date'];

    $data = [];
    foreach ($allowed as $f) {
        if (isset($input[$f])) {
            if ($f === 'name') {
                $data['first_name'] = trim($input[$f]);
            } elseif ($f === 'surname') {
                $data['last_name'] = trim($input[$f]);
            } elseif ($f === 'sex' || $f === 'gender') {
                $data['gender'] = strtoupper($input[$f]) === 'FEMALE' ? 'FEMALE' : 'MALE';
            } elseif ($f === 'status') {
                $data['status'] = strtoupper($input[$f]);
            } elseif ($f === 'password') {
                if (!empty(trim($input[$f]))) {
                    $raw = trim($input[$f]);
                    $data['password'] = str_starts_with($raw, '$2y$') ? $raw : password_hash($raw, PASSWORD_DEFAULT);
                }
            } else {
                $data[$f] = $input[$f];
            }
        }
    }

    if (!empty($data['parent_id'])) {
        $parent = $db->fetchOne("SELECT name, surname, phone, email FROM parents WHERE id = ?", [$data['parent_id']]);
        if ($parent) {
            $data['parent_name'] = trim(($parent['name'] ?? '') . ' ' . ($parent['surname'] ?? ''));
            $data['parent_phone'] = $parent['phone'] ?? ($data['parent_phone'] ?? null);
            $data['parent_email'] = $parent['email'] ?? ($data['parent_email'] ?? null);
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
    } elseif ($currentStatus !== 'APPROVED' && !empty($existing['enrolled_student_id'])) {
        // If status changed away from APPROVED (e.g. REJECTED or WAITLISTED), unenroll the student record
        try {
            $db->delete('students', 'id = ?', [$existing['enrolled_student_id']]);
        } catch (Exception $e) {
            error_log('Error deleting unenrolled student: ' . $e->getMessage());
        }
        $data['enrolled_student_id'] = null;
    }

    // If student is currently enrolled and personal info was updated, update student record too
    $studentIdToSync = $data['enrolled_student_id'] ?? $existing['enrolled_student_id'];
    if (!empty($studentIdToSync) && $currentStatus === 'APPROVED') {
        try {
            $stdUpdate = [];
            if (isset($data['first_name'])) $stdUpdate['name'] = $data['first_name'];
            if (isset($data['last_name'])) $stdUpdate['surname'] = $data['last_name'];
            if (isset($data['username']) && !empty($data['username'])) $stdUpdate['username'] = $data['username'];
            if (!empty($data['password'])) $stdUpdate['password'] = $data['password'];
            if (isset($data['email'])) $stdUpdate['email'] = $data['email'];
            if (isset($data['phone'])) $stdUpdate['phone'] = $data['phone'];
            if (isset($data['address'])) $stdUpdate['address'] = $data['address'];
            if (isset($data['blood_type'])) $stdUpdate['blood_type'] = $data['blood_type'];
            if (isset($data['gender'])) $stdUpdate['sex'] = $data['gender'];
            if (isset($data['img'])) $stdUpdate['img'] = $data['img'];
            if (isset($data['class_id'])) $stdUpdate['class_id'] = $data['class_id'];
            if (isset($data['grade_id'])) $stdUpdate['grade_id'] = $data['grade_id'];
            if (isset($data['parent_id'])) $stdUpdate['parent_id'] = $data['parent_id'];
            if (!empty($stdUpdate)) {
                $db->update('students', $stdUpdate, 'id = ?', [$studentIdToSync]);
            }
        } catch (Exception $e) {
            error_log('Error syncing student update from admission: ' . $e->getMessage());
        }
    }

    try {
        $db->update('admissions', $data, 'id = ?', [$id]);
        $updated = $db->fetchOne("SELECT a.*, COALESCE(a.username, s.username) as username, COALESCE(a.img, s.img) as img, c.name as class_name, g.level as grade_level, p.name as linked_parent_name, p.surname as linked_parent_surname FROM admissions a LEFT JOIN classes c ON a.class_id = c.id LEFT JOIN grades g ON a.grade_id = g.id LEFT JOIN parents p ON a.parent_id = p.id LEFT JOIN students s ON a.enrolled_student_id = s.id WHERE a.id = ?", [$id]);
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
        // Also remove enrolled student record if linked so All Students stays in sync
        if (!empty($existing['enrolled_student_id'])) {
            try {
                $db->delete('students', 'id = ?', [$existing['enrolled_student_id']]);
            } catch (Exception $e) {
                error_log('Error deleting linked student on admission delete: ' . $e->getMessage());
            }
        }
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
        $gradeId = $data['grade_id'] ?? null;
        if (empty($gradeId)) {
            $defaultGrade = $db->fetchOne("SELECT id FROM grades ORDER BY id ASC LIMIT 1");
            $gradeId = $defaultGrade['id'] ?? 1;
        }

        $classId = $data['class_id'] ?? null;
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
        $username = !empty($data['username']) ? $data['username'] : ($cleanFirst . '.' . $cleanLast . rand(10, 99));

        // Check if username already exists for another student
        $existingUser = $db->fetchOne("SELECT id FROM students WHERE username = ?", [$username]);
        if ($existingUser) {
            $username = $username . rand(10, 99);
        }

        $hashedPass = !empty($data['password'])
            ? (str_starts_with($data['password'], '$2y$') ? $data['password'] : password_hash($data['password'], PASSWORD_DEFAULT))
            : password_hash('Student123!', PASSWORD_DEFAULT);

        $studentId = uniqid('std_');
        $gender = ($data['gender'] === 'FEMALE' || (isset($data['sex']) && strtoupper($data['sex']) === 'FEMALE')) ? 'FEMALE' : 'MALE';

        $db->insert('students', [
            'id' => $studentId,
            'username' => $username,
            'password' => $hashedPass,
            'name' => $data['first_name'],
            'surname' => $data['last_name'],
            'email' => $data['email'] ?: ($username . '@school.edu'),
            'phone' => $data['phone'] ?: ($data['parent_phone'] ?? null),
            'address' => $data['address'] ?: 'Springfield',
            'img' => $data['img'] ?? null,
            'blood_type' => $data['blood_type'] ?: 'AB+',
            'sex' => $gender,
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
