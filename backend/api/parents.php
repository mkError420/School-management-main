<?php

$db = Database::getInstance();
ensureParentImgColumn($db);
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
            getParent($db, $id);
        } else {
            getParents($db);
        }
        break;

    case 'POST':
        createParent($db);
        break;

    case 'PUT':
        if (!$id) {
            Response::error('Parent ID is required');
        }
        updateParent($db, $id);
        break;

    case 'DELETE':
        if (!$id) {
            Response::error('Parent ID is required');
        }
        deleteParent($db, $id);
        break;

    default:
        Response::methodNotAllowed();
}

// Ensure the img column exists in older databases that were created without it
function ensureParentImgColumn($db) {
    try {
        $cols = $db->fetchAll("SHOW COLUMNS FROM parents LIKE 'img'");
        if (empty($cols)) {
            $db->query("ALTER TABLE parents ADD COLUMN img VARCHAR(255) NULL AFTER address");
        }
    } catch (Exception $e) {
        // Non-fatal: if the table doesn't exist yet it will be created with the schema
    }
}

function getParents($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);

    $page  = intval($_GET['page']  ?? 1);
    $limit = intval($_GET['limit'] ?? 10);
    $search = $_GET['search'] ?? '';

    $offset = ($page - 1) * $limit;

    $sql    = "SELECT p.* FROM parents p WHERE 1=1";
    $params = [];

    if (!empty($search)) {
        $sql .= " AND (p.name LIKE ? OR p.surname LIKE ? OR p.username LIKE ? OR p.email LIKE ? OR p.phone LIKE ? OR EXISTS (SELECT 1 FROM students s WHERE s.parent_id = p.id AND (s.name LIKE ? OR s.surname LIKE ?)))";
        $searchTerm = "%{$search}%";
        $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm]);
    }

    // Get total count
    $countSql    = str_replace("SELECT p.*", "SELECT COUNT(*) as total", $sql);
    $totalResult = $db->fetchOne($countSql, $params);
    $total       = $totalResult['total'];

    // Add pagination
    $sql .= " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;

    $parents = $db->fetchAll($sql, $params);

    // Remove passwords and add students array + children count
    foreach ($parents as &$parent) {
        unset($parent['password']);

        // 1. Fetch enrolled students from students table
        $students = $db->fetchAll(
            "SELECT id, name, surname FROM students WHERE parent_id = ? ORDER BY name",
            [$parent['id']]
        );

        // Keep track of student IDs and names
        $includedIds = [];
        $includedNames = [];
        foreach ($students as $st) {
            $includedIds[$st['id']] = true;
            $fullName = strtolower(trim(($st['name'] ?? '') . ' ' . ($st['surname'] ?? '')));
            if ($fullName !== '') {
                $includedNames[$fullName] = true;
            }
        }

        // 2. Also include admission applicants linked to this parent (e.g. from new admission form)
        try {
            $admissions = $db->fetchAll(
                "SELECT id, first_name, last_name, name, surname, enrolled_student_id 
                 FROM admissions 
                 WHERE parent_id = ? 
                 ORDER BY id DESC",
                [$parent['id']]
            );
            foreach ($admissions as $adm) {
                if (!empty($adm['enrolled_student_id']) && isset($includedIds[$adm['enrolled_student_id']])) {
                    continue;
                }
                $stName = !empty($adm['first_name']) ? $adm['first_name'] : ($adm['name'] ?? '');
                $stSurname = !empty($adm['last_name']) ? $adm['last_name'] : ($adm['surname'] ?? '');
                $fullName = strtolower(trim($stName . ' ' . $stSurname));
                if ($fullName !== '' && !isset($includedNames[$fullName])) {
                    $students[] = [
                        'id' => $adm['id'],
                        'name' => $stName,
                        'surname' => $stSurname
                    ];
                    $includedNames[$fullName] = true;
                }
            }
        } catch (Exception $e) {
            // Table might not exist or error
        }

        $parent['students'] = $students;
        $parent['children_count'] = count($students);
    }

    Response::success('Parents retrieved successfully', [
        'parents'    => $parents,
        'pagination' => [
            'page'  => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / max(1, $limit))
        ]
    ]);
}

function getParent($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'parent']);

    // If parent, they can only see their own data
    if ($user['role'] === 'parent' && $user['user_id'] !== $id) {
        Response::forbidden('You can only view your own data');
    }

    $parent = $db->fetchOne("SELECT * FROM parents WHERE id = ?", [$id]);

    if (!$parent) {
        Response::notFound('Parent not found');
    }

    unset($parent['password']);

    // Get parent's children (students)
    $children = $db->fetchAll(
        "SELECT s.*, c.name as class_name, g.level as grade_level
         FROM students s
         LEFT JOIN classes c ON s.class_id = c.id
         LEFT JOIN grades g  ON s.grade_id  = g.id
         WHERE s.parent_id = ?
         ORDER BY s.name",
        [$id]
    );

    foreach ($children as &$child) {
        unset($child['password']);
    }

    // Also include any admission applicants linked to this parent that aren't yet in students
    try {
        $admissions = $db->fetchAll(
            "SELECT a.*, c.name as class_name, g.level as grade_level
             FROM admissions a
             LEFT JOIN classes c ON a.class_id = c.id
             LEFT JOIN grades g  ON a.grade_id  = g.id
             WHERE a.parent_id = ?
             ORDER BY a.id DESC",
            [$id]
        );
        $existingStudentIds = array_flip(array_column($children, 'id'));
        foreach ($admissions as $adm) {
            if (!empty($adm['enrolled_student_id']) && isset($existingStudentIds[$adm['enrolled_student_id']])) {
                continue;
            }
            $firstName = !empty($adm['first_name']) ? $adm['first_name'] : ($adm['name'] ?? '');
            $lastName = !empty($adm['last_name']) ? $adm['last_name'] : ($adm['surname'] ?? '');
            $children[] = [
                'id' => $adm['id'],
                'name' => $firstName,
                'surname' => $lastName,
                'email' => $adm['email'] ?? '',
                'phone' => $adm['phone'] ?? '',
                'class_name' => $adm['class_name'] ?? 'Pending Admission',
                'grade_level' => $adm['grade_level'] ?? null,
                'status' => $adm['status'] ?? 'PENDING'
            ];
        }
    } catch (Exception $e) {}

    Response::success('Parent retrieved successfully', [
        'parent'   => $parent,
        'children' => $children,
        'students' => $children
    ]);
}

function createParent($db) {
    AuthMiddleware::requireRole('admin');

    // Support both JSON and multipart/form-data (when photo is attached)
    $isMultipart = stripos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') !== false;
    $input = $isMultipart ? $_POST : (json_decode(file_get_contents('php://input'), true) ?? []);

    $required = ['username', 'password', 'name', 'surname', 'address', 'phone'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            Response::error("Field '{$field}' is required");
        }
    }

    if (strlen($input['password']) < 6) {
        Response::error('Password must be at least 6 characters');
    }

    $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
    $id = uniqid();

    // Handle photo upload (multipart only)
    $uploadedImage = null;
    if ($isMultipart) {
        $uploadedImage = storeParentImage();
    }

    try {
        $db->insert('parents', [
            'id'       => $id,
            'username' => $input['username'],
            'password' => $hashedPassword,
            'name'     => $input['name'],
            'surname'  => $input['surname'],
            'email'    => $input['email'] ?? null,
            'phone'    => $input['phone'],
            'address'  => $input['address'],
            'img'      => $uploadedImage ?? ($input['img'] ?? null),
        ]);

        $parent = $db->fetchOne("SELECT * FROM parents WHERE id = ?", [$id]);
        unset($parent['password']);

        Response::success('Parent created successfully', $parent, 201);

    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            Response::error('Username, email, or phone already exists', 409);
        }
        Response::error('Failed to create parent: ' . $e->getMessage());
    }
}

function updateParent($db, $id) {
    AuthMiddleware::requireRole('admin');

    // Support both JSON and multipart/form-data (when photo is attached)
    $isMultipart = stripos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') !== false;
    $input = $isMultipart ? $_POST : (json_decode(file_get_contents('php://input'), true) ?? []);
    unset($input['_method']); // Remove method override field

    // Check if parent exists
    $existing = $db->fetchOne("SELECT id, img FROM parents WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Parent not found');
    }

    $data = [];

    // Build update data
    $allowedFields = ['name', 'surname', 'email', 'phone', 'address', 'img'];
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $data[$field] = $input[$field];
        }
    }

    // Handle photo upload (multipart only)
    if ($isMultipart) {
        $uploadedImage = storeParentImage();
        if ($uploadedImage !== null) {
            if (!empty($existing['img'])) {
                deleteParentImage($existing['img']);
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
        $db->update('parents', $data, 'id = ?', [$id]);

        $parent = $db->fetchOne("SELECT * FROM parents WHERE id = ?", [$id]);
        unset($parent['password']);

        Response::success('Parent updated successfully', $parent);

    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            Response::error('Username, email, or phone already exists', 409);
        }
        Response::error('Failed to update parent: ' . $e->getMessage());
    }
}

function deleteParent($db, $id) {
    AuthMiddleware::requireRole('admin');

    $existing = $db->fetchOne("SELECT id, img FROM parents WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Parent not found');
    }

    // Check if parent has children
    $childrenCount = $db->fetchOne(
        "SELECT COUNT(*) as count FROM students WHERE parent_id = ?",
        [$id]
    );

    if ($childrenCount['count'] > 0) {
        Response::error('Cannot delete parent with associated students. Please reassign or delete the students first.');
    }

    try {
        $deleted = $db->delete('parents', 'id = ?', [$id]);

        if ($deleted > 0) {
            // Clean up photo if stored locally
            if (!empty($existing['img'])) {
                deleteParentImage($existing['img']);
            }
            Response::success('Parent deleted successfully');
        } else {
            Response::error('Failed to delete parent');
        }

    } catch (Exception $e) {
        Response::error('Failed to delete parent: ' . $e->getMessage());
    }
}

function storeParentImage() {
    if (empty($_FILES['img']) || $_FILES['img']['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    $upload = $_FILES['img'];
    if ($upload['error'] !== UPLOAD_ERR_OK) {
        Response::error('Parent image upload failed (error code ' . $upload['error'] . ')');
    }
    if ($upload['size'] > 5 * 1024 * 1024) {
        Response::error('Parent photo must be no larger than 5 MB');
    }

    $imageInfo = getimagesize($upload['tmp_name']);
    $extensionsByMime = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
    ];
    $mimeType = $imageInfo['mime'] ?? '';
    if (!$imageInfo || !isset($extensionsByMime[$mimeType])) {
        Response::error('Choose a valid JPG, PNG, or WebP image for the parent photo');
    }

    $directory = dirname(__DIR__, 2) . '/images/parents';
    if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
        Response::serverError('Unable to prepare parent image storage');
    }

    $fileName = bin2hex(random_bytes(16)) . '.' . $extensionsByMime[$mimeType];
    if (!move_uploaded_file($upload['tmp_name'], $directory . '/' . $fileName)) {
        Response::serverError('Unable to store parent image');
    }

    return '/images/parents/' . $fileName;
}

function deleteParentImage($imagePath) {
    if (!is_string($imagePath) || strpos($imagePath, '/images/parents/') !== 0) {
        return;
    }
    $filePath = dirname(__DIR__, 2) . '/images/parents/' . basename($imagePath);
    if (is_file($filePath)) {
        unlink($filePath);
    }
}
