<?php

$db = Database::getInstance();
ensureStaffTable($db);

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

// Support method override for PUT
$methodOverride = strtoupper($_POST['_method'] ?? $_GET['_method'] ?? '');
if ($method === 'POST' && $methodOverride === 'PUT') {
    $method = 'PUT';
}

switch ($method) {
    case 'GET':
        if ($id) {
            getStaffMember($db, $id);
        } else {
            getStaffList($db);
        }
        break;

    case 'POST':
        createStaffMember($db);
        break;

    case 'PUT':
        if (!$id) {
            Response::error('Staff ID is required');
        }
        updateStaffMember($db, $id);
        break;

    case 'DELETE':
        if (!$id) {
            Response::error('Staff ID is required');
        }
        deleteStaffMember($db, $id);
        break;

    default:
        Response::methodNotAllowed();
}

function ensureStaffTable($db) {
    try {
        $db->query("CREATE TABLE IF NOT EXISTS staff (
            id VARCHAR(255) PRIMARY KEY,
            staff_no VARCHAR(60) UNIQUE NOT NULL,
            teacher_id VARCHAR(255) NULL,
            admin_id VARCHAR(255) NULL,
            name VARCHAR(255) NOT NULL,
            surname VARCHAR(255) NOT NULL,
            email VARCHAR(255) NULL,
            phone VARCHAR(255) NULL,
            type ENUM('TEACHING', 'NON_TEACHING', 'ADMINISTRATIVE', 'SUPPORT') NOT NULL DEFAULT 'NON_TEACHING',
            designation VARCHAR(100) NOT NULL DEFAULT 'Staff Member',
            department VARCHAR(100) NOT NULL DEFAULT 'Operations',
            gender ENUM('MALE', 'FEMALE') NOT NULL DEFAULT 'MALE',
            blood_type VARCHAR(10) NULL,
            address TEXT NULL,
            salary DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            joining_date DATE NULL,
            status ENUM('ACTIVE', 'ON_LEAVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
            qualification VARCHAR(255) NULL,
            img VARCHAR(255) NULL,
            notes TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_staff_type (type),
            INDEX idx_staff_status (status),
            INDEX idx_staff_dept (department)
        )");

        // Seed initial staff if empty
        $count = $db->fetchOne("SELECT COUNT(*) as total FROM staff")['total'] ?? 0;
        if ((int)$count === 0) {
            seedInitialStaff($db);
        }
    } catch (Exception $e) {
        error_log('Error initializing staff table: ' . $e->getMessage());
    }
}

function seedInitialStaff($db) {
    // 1. Import all existing teachers into staff as TEACHING staff
    try {
        $teachers = $db->fetchAll("SELECT * FROM teachers");
        $idx = 101;
        foreach ($teachers as $t) {
            $staffNo = "STF-T" . str_pad($idx, 4, '0', STR_PAD_LEFT);
            $db->insert('staff', [
                'id' => 'stf_' . $t['id'],
                'staff_no' => $staffNo,
                'teacher_id' => $t['id'],
                'name' => $t['name'],
                'surname' => $t['surname'],
                'email' => $t['email'] ?? ($t['username'] . '@school.edu'),
                'phone' => $t['phone'] ?? '+1 555-010' . ($idx % 10),
                'type' => 'TEACHING',
                'designation' => 'Academic Teacher',
                'department' => 'Academic Faculty',
                'gender' => $t['sex'] ?? 'MALE',
                'blood_type' => $t['blood_type'] ?? 'O+',
                'address' => $t['address'] ?? 'Campus Residential Block',
                'salary' => 3800.00,
                'joining_date' => date('Y-m-d', strtotime('-2 years')),
                'status' => 'ACTIVE',
                'qualification' => 'Master in Education (M.Ed)',
                'img' => $t['img'] ?? null,
                'notes' => 'Faculty member teaching school curriculum'
            ]);
            $idx++;
        }
    } catch (Exception $e) {}

    // 2. Add sample non-teaching & administrative staff
    $sampleStaff = [
        [
            'id' => 'stf_adm_1',
            'staff_no' => 'STF-A0001',
            'name' => 'Eleanor',
            'surname' => 'Vance',
            'email' => 'eleanor.vance@school.edu',
            'phone' => '+1 555-0201',
            'type' => 'ADMINISTRATIVE',
            'designation' => 'Head of Administration',
            'department' => 'Administration',
            'gender' => 'FEMALE',
            'blood_type' => 'A+',
            'address' => '742 Evergreen Terrace, Suite 10',
            'salary' => 4500.00,
            'joining_date' => '2023-01-15',
            'status' => 'ACTIVE',
            'qualification' => 'MBA - Educational Leadership',
            'notes' => 'Oversees campus administration and staff operations'
        ],
        [
            'id' => 'stf_acc_1',
            'staff_no' => 'STF-F0002',
            'name' => 'Marcus',
            'surname' => 'Sterling',
            'email' => 'marcus.finance@school.edu',
            'phone' => '+1 555-0202',
            'type' => 'NON_TEACHING',
            'designation' => 'Senior Bursar & Accountant',
            'department' => 'Finance & Accounts',
            'gender' => 'MALE',
            'blood_type' => 'B+',
            'address' => '12 Financial District Ave',
            'salary' => 4200.00,
            'joining_date' => '2023-03-01',
            'status' => 'ACTIVE',
            'qualification' => 'CPA, B.Sc Accounting',
            'notes' => 'Manages tuition fee billing, payroll and expenditure records'
        ],
        [
            'id' => 'stf_lib_1',
            'staff_no' => 'STF-L0003',
            'name' => 'Beatrice',
            'surname' => 'Holloway',
            'email' => 'beatrice.lib@school.edu',
            'phone' => '+1 555-0203',
            'type' => 'SUPPORT',
            'designation' => 'Chief Librarian',
            'department' => 'Library & Media Resources',
            'gender' => 'FEMALE',
            'blood_type' => 'O+',
            'address' => '88 Oakwood Lane',
            'salary' => 3100.00,
            'joining_date' => '2023-08-20',
            'status' => 'ACTIVE',
            'qualification' => 'M.Sc Library & Information Science',
            'notes' => 'Curates learning resources and digital book lending library'
        ],
        [
            'id' => 'stf_it_1',
            'staff_no' => 'STF-I0004',
            'name' => 'David',
            'surname' => 'Kovacs',
            'email' => 'david.it@school.edu',
            'phone' => '+1 555-0204',
            'type' => 'SUPPORT',
            'designation' => 'IT Systems & Network Admin',
            'department' => 'IT & Computer Lab',
            'gender' => 'MALE',
            'blood_type' => 'AB+',
            'address' => '304 Tech Boulevard',
            'salary' => 3900.00,
            'joining_date' => '2024-02-10',
            'status' => 'ACTIVE',
            'qualification' => 'B.Sc Computer Engineering, CCNA',
            'notes' => 'Campus network, smartboards and lab infrastructure management'
        ],
        [
            'id' => 'stf_nur_1',
            'staff_no' => 'STF-H0005',
            'name' => 'Clara',
            'surname' => 'Oswald',
            'email' => 'clara.health@school.edu',
            'phone' => '+1 555-0205',
            'type' => 'SUPPORT',
            'designation' => 'School Nurse & Wellness Officer',
            'department' => 'Health & Medical Clinic',
            'gender' => 'FEMALE',
            'blood_type' => 'A-',
            'address' => '19 Meadowbrook Rd',
            'salary' => 3200.00,
            'joining_date' => '2024-01-08',
            'status' => 'ACTIVE',
            'qualification' => 'Registered Nurse (RN), Pediatric First Aid',
            'notes' => 'Provides student medical care and emergency health support'
        ],
        [
            'id' => 'stf_sec_1',
            'staff_no' => 'STF-S0006',
            'name' => 'Samuel',
            'surname' => 'O\'Connor',
            'email' => 'samuel.security@school.edu',
            'phone' => '+1 555-0206',
            'type' => 'SUPPORT',
            'designation' => 'Campus Security Lead',
            'department' => 'Safety & Security',
            'gender' => 'MALE',
            'blood_type' => 'O-',
            'address' => '55 Gateway Road',
            'salary' => 2600.00,
            'joining_date' => '2023-05-12',
            'status' => 'ACTIVE',
            'qualification' => 'Certified Security Specialist',
            'notes' => 'Campus perimeter safety and visitor access monitoring'
        ],
    ];

    foreach ($sampleStaff as $s) {
        try {
            $db->insert('staff', $s);
        } catch (Exception $e) {}
    }
}

function getStaffList($db) {
    AuthMiddleware::requireAnyRole(['admin', 'super_admin']);

    $type = $_GET['type'] ?? 'ALL';
    $status = $_GET['status'] ?? 'ALL';
    $department = $_GET['department'] ?? 'ALL';
    $search = trim($_GET['search'] ?? '');
    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 100);
    $offset = ($page - 1) * $limit;

    $where = ["1=1"];
    $params = [];

    if ($type !== 'ALL' && !empty($type)) {
        $where[] = "s.type = ?";
        $params[] = $type;
    }
    if ($status !== 'ALL' && !empty($status)) {
        $where[] = "s.status = ?";
        $params[] = $status;
    }
    if ($department !== 'ALL' && !empty($department)) {
        $where[] = "s.department = ?";
        $params[] = $department;
    }
    if ($search !== '') {
        $where[] = "(s.name LIKE ? OR s.surname LIKE ? OR s.email LIKE ? OR s.phone LIKE ? OR s.staff_no LIKE ? OR s.designation LIKE ?)";
        $term = "%{$search}%";
        $params = array_merge($params, [$term, $term, $term, $term, $term, $term]);
    }

    $whereSql = implode(' AND ', $where);

    // Total count
    $totalCount = $db->fetchOne("SELECT COUNT(*) as total FROM staff s WHERE $whereSql", $params)['total'] ?? 0;

    // Fetch records
    $sql = "SELECT s.* FROM staff s WHERE $whereSql ORDER BY s.type ASC, s.name ASC LIMIT ? OFFSET ?";
    $fetchParams = array_merge($params, [$limit, $offset]);
    $staff = $db->fetchAll($sql, $fetchParams);

    // Attach teacher subjects and classes if linked to a teacher
    foreach ($staff as &$item) {
        $item['salary'] = (float)($item['salary'] ?? 0);
        if (!empty($item['teacher_id'])) {
            try {
                $subjects = $db->fetchAll(
                    "SELECT sub.id, sub.name FROM subjects sub 
                     INNER JOIN teacher_subjects ts ON sub.id = ts.subject_id 
                     WHERE ts.teacher_id = ?",
                    [$item['teacher_id']]
                );
                $classes = $db->fetchAll(
                    "SELECT c.id, c.name FROM classes c 
                     INNER JOIN teacher_classes tc ON c.id = tc.class_id 
                     WHERE tc.teacher_id = ?",
                    [$item['teacher_id']]
                );
                $item['subjects'] = $subjects;
                $item['classes'] = $classes;
            } catch (Exception $e) {}
        }
    }

    // Calculate staff summary stats
    $stats = [
        'total_staff' => 0,
        'teaching_count' => 0,
        'non_teaching_count' => 0,
        'administrative_count' => 0,
        'support_count' => 0,
        'active_count' => 0,
        'on_leave_count' => 0,
        'total_monthly_payroll' => 0.0
    ];

    try {
        $statRow = $db->fetchOne(
            "SELECT 
                COUNT(*) as total_staff,
                COALESCE(SUM(CASE WHEN type = 'TEACHING' THEN 1 ELSE 0 END), 0) as teaching_count,
                COALESCE(SUM(CASE WHEN type = 'NON_TEACHING' THEN 1 ELSE 0 END), 0) as non_teaching_count,
                COALESCE(SUM(CASE WHEN type = 'ADMINISTRATIVE' THEN 1 ELSE 0 END), 0) as administrative_count,
                COALESCE(SUM(CASE WHEN type = 'SUPPORT' THEN 1 ELSE 0 END), 0) as support_count,
                COALESCE(SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END), 0) as active_count,
                COALESCE(SUM(CASE WHEN status = 'ON_LEAVE' THEN 1 ELSE 0 END), 0) as on_leave_count,
                COALESCE(SUM(salary), 0) as total_monthly_payroll
             FROM staff"
        );
        if ($statRow) {
            $stats['total_staff'] = (int)$statRow['total_staff'];
            $stats['teaching_count'] = (int)$statRow['teaching_count'];
            $stats['non_teaching_count'] = (int)$statRow['non_teaching_count'];
            $stats['administrative_count'] = (int)$statRow['administrative_count'];
            $stats['support_count'] = (int)$statRow['support_count'];
            $stats['active_count'] = (int)$statRow['active_count'];
            $stats['on_leave_count'] = (int)$statRow['on_leave_count'];
            $stats['total_monthly_payroll'] = (float)$statRow['total_monthly_payroll'];
        }
    } catch (Exception $e) {}

    Response::success('Staff retrieved successfully', [
        'staff' => $staff,
        'total' => (int)$totalCount,
        'page' => $page,
        'limit' => $limit,
        'stats' => $stats
    ]);
}

function getStaffMember($db, $id) {
    AuthMiddleware::requireAnyRole(['admin', 'super_admin']);

    $staff = $db->fetchOne("SELECT * FROM staff WHERE id = ? OR staff_no = ?", [$id, $id]);
    if (!$staff) {
        Response::notFound('Staff member not found');
    }

    $staff['salary'] = (float)($staff['salary'] ?? 0);
    if (!empty($staff['teacher_id'])) {
        $subjects = $db->fetchAll(
            "SELECT sub.id, sub.name FROM subjects sub 
             INNER JOIN teacher_subjects ts ON sub.id = ts.subject_id 
             WHERE ts.teacher_id = ?",
            [$staff['teacher_id']]
        );
        $classes = $db->fetchAll(
            "SELECT c.id, c.name FROM classes c 
             INNER JOIN teacher_classes tc ON c.id = tc.class_id 
             WHERE tc.teacher_id = ?",
            [$staff['teacher_id']]
        );
        $staff['subjects'] = $subjects;
        $staff['classes'] = $classes;
    }

    Response::success('Staff member retrieved successfully', $staff);
}

function createStaffMember($db) {
    AuthMiddleware::requireAnyRole(['admin', 'super_admin']);

    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?? $_POST;

    $name = trim($input['name'] ?? '');
    $surname = trim($input['surname'] ?? '');
    $type = strtoupper(trim($input['type'] ?? 'NON_TEACHING'));
    $designation = trim($input['designation'] ?? 'Staff Member');
    $department = trim($input['department'] ?? 'Operations');
    $email = trim($input['email'] ?? '');
    $phone = trim($input['phone'] ?? '');
    $gender = strtoupper(trim($input['gender'] ?? 'MALE'));
    $bloodType = trim($input['blood_type'] ?? 'O+');
    $address = trim($input['address'] ?? '');
    $salary = floatval($input['salary'] ?? 0);
    $joiningDate = !empty($input['joining_date']) ? $input['joining_date'] : date('Y-m-d');
    $status = strtoupper(trim($input['status'] ?? 'ACTIVE'));
    $qualification = trim($input['qualification'] ?? '');
    $notes = trim($input['notes'] ?? '');

    if (empty($name) || empty($surname)) {
        Response::error('First name and surname are required');
    }

    // Auto-generate staff number
    $countRow = $db->fetchOne("SELECT COUNT(*) as total FROM staff");
    $nextNum = ((int)($countRow['total'] ?? 0)) + 1;
    $prefix = $type === 'TEACHING' ? 'STF-T' : ($type === 'ADMINISTRATIVE' ? 'STF-A' : 'STF-S');
    $staffNo = $input['staff_no'] ?? ($prefix . str_pad($nextNum, 4, '0', STR_PAD_LEFT));

    $staffId = 'stf_' . uniqid();
    $teacherId = null;

    try {
        $db->beginTransaction();

        // If staff is TEACHING (a Teacher):
        // Automatically create or link teacher record in teachers table!
        if ($type === 'TEACHING' || stripos($designation, 'Teacher') !== false) {
            $type = 'TEACHING';
            if (empty($department) || $department === 'Operations') {
                $department = 'Academic Faculty';
            }

            $username = trim($input['username'] ?? '');
            if (empty($username)) {
                $username = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $name . '.' . $surname));
                // Ensure unique username
                $existingU = $db->fetchOne("SELECT id FROM teachers WHERE username = ?", [$username]);
                if ($existingU) {
                    $username .= rand(10, 999);
                }
            }

            $password = !empty($input['password']) ? $input['password'] : 'teacher123';
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

            $teacherId = uniqid();

            // Insert into teachers table
            $db->insert('teachers', [
                'id' => $teacherId,
                'username' => $username,
                'password' => $hashedPassword,
                'name' => $name,
                'surname' => $surname,
                'email' => !empty($email) ? $email : null,
                'phone' => !empty($phone) ? $phone : null,
                'address' => !empty($address) ? $address : 'Campus Staff Residence',
                'img' => $input['img'] ?? null,
                'blood_type' => !empty($bloodType) ? $bloodType : 'O+',
                'sex' => $gender === 'FEMALE' ? 'FEMALE' : 'MALE'
            ]);

            // Assign subjects if provided
            if (!empty($input['subject_ids']) && is_array($input['subject_ids'])) {
                foreach ($input['subject_ids'] as $subId) {
                    $db->insert('teacher_subjects', [
                        'teacher_id' => $teacherId,
                        'subject_id' => intval($subId)
                    ]);
                }
            }

            // Assign classes if provided
            if (!empty($input['class_ids']) && is_array($input['class_ids'])) {
                foreach ($input['class_ids'] as $classId) {
                    $db->insert('teacher_classes', [
                        'teacher_id' => $teacherId,
                        'class_id' => intval($classId)
                    ]);
                }
            }
        }

        // Insert into staff table
        $db->insert('staff', [
            'id' => $staffId,
            'staff_no' => $staffNo,
            'teacher_id' => $teacherId,
            'name' => $name,
            'surname' => $surname,
            'email' => !empty($email) ? $email : null,
            'phone' => !empty($phone) ? $phone : null,
            'type' => $type,
            'designation' => $designation,
            'department' => $department,
            'gender' => $gender,
            'blood_type' => $bloodType,
            'address' => $address,
            'salary' => $salary,
            'joining_date' => $joiningDate,
            'status' => $status,
            'qualification' => $qualification,
            'img' => $input['img'] ?? null,
            'notes' => $notes
        ]);

        $db->commit();

        $created = $db->fetchOne("SELECT * FROM staff WHERE id = ?", [$staffId]);
        Response::success('Staff member added successfully', $created, 201);

    } catch (Exception $e) {
        $db->rollback();
        if (stripos($e->getMessage(), 'Duplicate entry') !== false) {
            Response::error('Staff number or email already in use', 409);
        }
        Response::error('Failed to create staff member: ' . $e->getMessage());
    }
}

function updateStaffMember($db, $id) {
    AuthMiddleware::requireAnyRole(['admin', 'super_admin']);

    $existing = $db->fetchOne("SELECT * FROM staff WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Staff member not found');
    }

    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?? $_POST;

    $name = trim($input['name'] ?? $existing['name']);
    $surname = trim($input['surname'] ?? $existing['surname']);
    $email = trim($input['email'] ?? $existing['email']);
    $phone = trim($input['phone'] ?? $existing['phone']);
    $type = strtoupper(trim($input['type'] ?? $existing['type']));
    $designation = trim($input['designation'] ?? $existing['designation']);
    $department = trim($input['department'] ?? $existing['department']);
    $gender = strtoupper(trim($input['gender'] ?? $existing['gender']));
    $bloodType = trim($input['blood_type'] ?? $existing['blood_type']);
    $address = trim($input['address'] ?? $existing['address']);
    $salary = isset($input['salary']) ? floatval($input['salary']) : floatval($existing['salary']);
    $joiningDate = !empty($input['joining_date']) ? $input['joining_date'] : $existing['joining_date'];
    $status = strtoupper(trim($input['status'] ?? $existing['status']));
    $qualification = trim($input['qualification'] ?? $existing['qualification']);
    $notes = trim($input['notes'] ?? $existing['notes']);

    try {
        $db->beginTransaction();

        $db->update('staff', [
            'name' => $name,
            'surname' => $surname,
            'email' => !empty($email) ? $email : null,
            'phone' => !empty($phone) ? $phone : null,
            'type' => $type,
            'designation' => $designation,
            'department' => $department,
            'gender' => $gender,
            'blood_type' => $bloodType,
            'address' => $address,
            'salary' => $salary,
            'joining_date' => $joiningDate,
            'status' => $status,
            'qualification' => $qualification,
            'notes' => $notes
        ], 'id = ?', [$id]);

        // If linked to a teacher, update the teacher record too
        if (!empty($existing['teacher_id'])) {
            $db->update('teachers', [
                'name' => $name,
                'surname' => $surname,
                'email' => !empty($email) ? $email : null,
                'phone' => !empty($phone) ? $phone : null,
                'address' => $address,
                'blood_type' => $bloodType,
                'sex' => $gender === 'FEMALE' ? 'FEMALE' : 'MALE'
            ], 'id = ?', [$existing['teacher_id']]);
        }

        $db->commit();

        $updated = $db->fetchOne("SELECT * FROM staff WHERE id = ?", [$id]);
        Response::success('Staff member updated successfully', $updated);

    } catch (Exception $e) {
        $db->rollback();
        Response::error('Failed to update staff member: ' . $e->getMessage());
    }
}

function deleteStaffMember($db, $id) {
    AuthMiddleware::requireAnyRole(['admin', 'super_admin']);

    $staff = $db->fetchOne("SELECT * FROM staff WHERE id = ?", [$id]);
    if (!$staff) {
        Response::notFound('Staff member not found');
    }

    try {
        $db->beginTransaction();

        // If linked to teacher, we can optionally retain or delete
        // We delete the staff record
        $db->delete('staff', 'id = ?', [$id]);

        $db->commit();
        Response::success('Staff member removed successfully');

    } catch (Exception $e) {
        $db->rollback();
        Response::error('Failed to delete staff member: ' . $e->getMessage());
    }
}
