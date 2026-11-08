<?php
require_once __DIR__ . '/../utils/StudentIdGenerator.php';

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];

// Ensure admins schema has necessary columns
ensureAdminsSchema($db);

// Get request data (support JSON and multipart/form-data)
$input = json_decode(file_get_contents('php://input'), true) ?? [];
if (empty($input) && !empty($_POST)) {
    $input = $_POST;
}

switch ($method) {
    case 'POST':
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'login':
                handleLogin($db, $input);
                break;
            case 'switch-role':
                handleSwitchRole($db, $input);
                break;
            case 'register':
                handleRegister($db, $input);
                break;
            case 'change-password':
                handleChangePassword($db, $input);
                break;
            case 'update-profile-image':
                handleUpdateProfileImage($db, $input);
                break;
            default:
                Response::error('Invalid action', 400);
        }
        break;
        
    case 'GET':
        $action = $_GET['action'] ?? '';
        
        if ($action === 'me') {
            handleGetCurrentUser($db);
        } else {
            Response::error('Invalid action', 400);
        }
        break;
        
    default:
        Response::methodNotAllowed();
}

function handleLogin($db, $input) {
    $identifier = trim($input['username'] ?? $input['email'] ?? '');
    $password = $input['password'] ?? '';
    $requestedRole = $input['role'] ?? null;
    
    if ($identifier === '' || $password === '') {
        Response::error('Username or email and password are required');
    }
    
    $tables = [
        'admin' => 'admins',
        'super_admin' => 'admins',
        'teacher' => 'teachers',
        'student' => 'students',
        'parent' => 'parents',
    ];
    if ($requestedRole !== null && !isset($tables[$requestedRole])) {
            Response::error('Invalid role');
    }
    
    $candidateRoles = $requestedRole === null ? $tables : [$requestedRole => $tables[$requestedRole]];
    if ($requestedRole === null) {
        unset($candidateRoles['super_admin']);
    }
    $matches = [];
    foreach ($candidateRoles as $role => $table) {
        $users = in_array($role, ['admin', 'super_admin'], true)
            ? $db->fetchAll("SELECT * FROM {$table} WHERE username = ? OR email = ?", [$identifier, $identifier])
            : $db->fetchAll("SELECT * FROM {$table} WHERE username = ? OR email = ?", [$identifier, $identifier]);

        foreach ($users as $user) {
            $matchedRole = $role === 'admin' ? ($user['role'] ?? 'admin') : $role;
            if (($requestedRole === null || $requestedRole === $matchedRole) && password_verify($password, $user['password'])) {
                $matches[] = ['role' => $matchedRole, 'user' => $user];
            }
        }
    }

    if (count($matches) === 0) {
        Response::error('Invalid credentials', 401);
    }

    if (count($matches) > 1) {
        Response::error('These credentials match multiple accounts. Contact your administrator.', 409);
    }

    $role = $matches[0]['role'];
    $user = $matches[0]['user'];
    
    // Generate JWT token
    $token = JWTHandler::encode([
        'user_id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'] ?? null,
        'role' => $role
    ]);
    
    // Remove password from response
    unset($user['password']);
    
    Response::success('Login successful', [
        'user' => $user,
        'token' => $token,
        'role' => $role
    ]);
}

function handleRegister($db, $input) {
    AuthMiddleware::requireRole('admin');

    $role = $input['role'] ?? 'student';
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        Response::error('Username and password are required');
    }
    
    if (strlen($password) < 6) {
        Response::error('Password must be at least 6 characters');
    }
    
    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Generate unique ID
    $id = uniqid();
    
    try {
        switch ($role) {
            case 'student':
                $required = ['name', 'surname', 'address', 'blood_type', 'sex', 'parent_id', 'class_id', 'grade_id'];
                foreach ($required as $field) {
                    if (empty($input[$field])) {
                        Response::error("Field '{$field}' is required");
                    }
                }
                
                $idInfo = StudentIdGenerator::generate($db, $input['class_id'], $input['roll'] ?? null);
                $studentId = $idInfo['id'];
                $roll = $idInfo['roll'];
                
                $db->insert('students', [
                    'id' => $studentId,
                    'roll' => $roll,
                    'username' => $username,
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
                break;
                
            case 'teacher':
                $required = ['name', 'surname', 'address', 'blood_type', 'sex'];
                foreach ($required as $field) {
                    if (empty($input[$field])) {
                        Response::error("Field '{$field}' is required");
                    }
                }
                
                $db->insert('teachers', [
                    'id' => $id,
                    'username' => $username,
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
                break;
                
            case 'parent':
                $required = ['name', 'surname', 'address', 'phone'];
                foreach ($required as $field) {
                    if (empty($input[$field])) {
                        Response::error("Field '{$field}' is required");
                    }
                }
                
                $db->insert('parents', [
                    'id' => $id,
                    'username' => $username,
                    'password' => $hashedPassword,
                    'name' => $input['name'],
                    'surname' => $input['surname'],
                    'email' => $input['email'] ?? null,
                    'phone' => $input['phone'],
                    'address' => $input['address']
                ]);
                break;
                
            default:
                Response::error('Invalid role for registration');
        }
        
        Response::success('Registration successful', ['user_id' => $id], 201);
        
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            Response::error('Username already exists', 409);
        }
        Response::error('Registration failed: ' . $e->getMessage());
    }
}

function handleChangePassword($db, $input) {
    $user = AuthMiddleware::authenticate();
    $currentPassword = $input['current_password'] ?? '';
    $newPassword = $input['new_password'] ?? '';

    if ($currentPassword === '' || $newPassword === '') {
        Response::error('Current password and new password are required');
    }

    if (strlen($newPassword) < 8) {
        Response::error('New password must be at least 8 characters');
    }

    $tables = [
        'admin' => 'admins',
        'super_admin' => 'admins',
        'teacher' => 'teachers',
        'student' => 'students',
        'parent' => 'parents',
    ];
    $table = $tables[$user['role']] ?? null;
    if ($table === null) {
        Response::error('Invalid account role', 403);
    }

    $account = $db->fetchOne("SELECT id, password FROM {$table} WHERE id = ?", [$user['user_id']]);
    if (!$account) {
        Response::notFound('Account not found');
    }

    if (!password_verify($currentPassword, $account['password'])) {
        Response::error('Current password is incorrect', 401);
    }

    if (password_verify($newPassword, $account['password'])) {
        Response::error('Choose a new password different from your current password');
    }

    $db->update($table, ['password' => password_hash($newPassword, PASSWORD_DEFAULT)], 'id = ?', [$user['user_id']]);
    Response::success('Password changed successfully');
}

/**
 * Super Admin Role Switching / Individual Role Dashboard Access
 */
function handleSwitchRole($db, $input) {
    $actor = AuthMiddleware::authenticate();
    $targetRole = trim($input['role'] ?? '');
    $targetUserId = trim($input['user_id'] ?? '');

    $allowedRoles = ['super_admin', 'admin', 'teacher', 'student', 'parent'];
    if (!in_array($targetRole, $allowedRoles, true)) {
        Response::error('Invalid target role', 400);
    }

    $isSuperAdmin = ($actor['role'] === 'super_admin') || (!empty($actor['is_impersonating']) && ($actor['original_role'] ?? '') === 'super_admin');
    if (!$isSuperAdmin) {
        Response::forbidden('Only super administrators can access roles individually');
    }

    $targetUser = null;
    if (!empty($targetUserId)) {
        $tableMap = [
            'super_admin' => 'admins',
            'admin'       => 'admins',
            'teacher'     => 'teachers',
            'student'     => 'students',
            'parent'      => 'parents',
        ];
        $tbl = $tableMap[$targetRole] ?? 'admins';
        $targetUser = $db->fetchOne("SELECT * FROM {$tbl} WHERE id = ? LIMIT 1", [$targetUserId]);
    }

    if (!$targetUser) {
        $queries = [
            'super_admin' => "SELECT id, username, email FROM admins WHERE role = 'super_admin' ORDER BY id ASC LIMIT 1",
            'admin'       => "SELECT id, username, email FROM admins WHERE role = 'admin' ORDER BY id ASC LIMIT 1",
            'teacher'     => "SELECT id, username, email, name, surname FROM teachers ORDER BY id ASC LIMIT 1",
            'student'     => "SELECT id, username, email, name, surname FROM students ORDER BY id ASC LIMIT 1",
            'parent'      => "SELECT id, username, email, name, surname FROM parents ORDER BY id ASC LIMIT 1",
        ];
        if (isset($queries[$targetRole])) {
            $targetUser = $db->fetchOne($queries[$targetRole]);
        }
    }

    $newUserId = $targetUser ? $targetUser['id'] : ($targetRole . '_preview_user');
    $newUsername = $targetUser ? ($targetUser['username'] ?? $targetRole) : ($targetRole . '_preview');
    $newName = $targetUser ? trim(($targetUser['name'] ?? '') . ' ' . ($targetUser['surname'] ?? '')) : ucfirst($targetRole) . ' Preview';
    if ($newName === '') $newName = $newUsername;
    $newEmail = $targetUser['email'] ?? ($targetRole . '@school.edu.bd');

    $isImpersonating = ($targetRole !== 'super_admin');
    $tokenPayload = [
        'user_id'           => $newUserId,
        'username'          => $newUsername,
        'email'             => $newEmail,
        'role'              => $targetRole,
        'is_impersonating'  => $isImpersonating,
        'original_user_id'  => $actor['original_user_id'] ?? $actor['user_id'],
        'original_username' => $actor['original_username'] ?? $actor['username'],
        'original_role'     => $actor['original_role'] ?? $actor['role'],
    ];

    $newToken = JWTHandler::encode($tokenPayload);

    Response::success('Switched role successfully', [
        'token'            => $newToken,
        'role'             => $targetRole,
        'user'             => [
            'id'       => $newUserId,
            'username' => $newUsername,
            'name'     => $newName,
            'role'     => $targetRole,
            'email'    => $newEmail,
        ],
        'is_impersonating' => $isImpersonating,
        'original_role'    => $tokenPayload['original_role'],
    ]);
}

function handleGetCurrentUser($db) {
    $user = AuthMiddleware::authenticate();

    if (!empty($user['is_impersonating']) && str_ends_with($user['user_id'] ?? '', '_preview_user')) {
        Response::success('Preview user retrieved', [
            'user' => [
                'id'       => $user['user_id'],
                'username' => $user['username'] ?? $user['role'],
                'name'     => ucfirst($user['role']) . ' Preview',
                'role'     => $user['role'],
                'email'    => $user['email'] ?? ($user['role'] . '@school.edu.bd')
            ],
            'role'             => $user['role'],
            'is_impersonating' => true,
            'original_role'    => $user['original_role'] ?? 'super_admin'
        ]);
        return;
    }
    
    $table = '';
    switch ($user['role']) {
        case 'admin':
        case 'super_admin':
            $table = 'admins';
            break;
        case 'student':
            $table = 'students';
            break;
        case 'teacher':
            $table = 'teachers';
            break;
        case 'parent':
            $table = 'parents';
            break;
        default:
            Response::error('Invalid role');
    }
    
    if ($user['role'] === 'student') {
        $userData = $db->fetchOne(
            "SELECT s.*, COALESCE(NULLIF(s.student_type, ''), a.student_type) as student_type 
             FROM students s 
             LEFT JOIN admissions a ON a.enrolled_student_id = s.id 
             WHERE s.id = ?",
            [$user['user_id']]
        );
    } else {
        $userData = $db->fetchOne(
            "SELECT * FROM {$table} WHERE id = ?",
            [$user['user_id']]
        );
    }
    
    if (!$userData) {
        // Fallback for preview users or deleted user token
        if (!empty($user['is_impersonating'])) {
            Response::success('Impersonated user session', [
                'user' => [
                    'id'       => $user['user_id'],
                    'username' => $user['username'] ?? $user['role'],
                    'name'     => ucfirst($user['role']),
                    'role'     => $user['role'],
                    'email'    => $user['email'] ?? '',
                ],
                'role'             => $user['role'],
                'is_impersonating' => true,
                'original_role'    => $user['original_role'] ?? 'super_admin',
            ]);
            return;
        }
        Response::notFound('User not found');
    }
    
    // Remove password from response
    unset($userData['password']);
    
    Response::success('User retrieved successfully', [
        'user' => $userData,
        'role' => $user['role']
    ]);
}

/**
 * Ensure admins schema has necessary columns (dashboard_sections, img, name)
 */
function ensureAdminsSchema($db) {
    try {
        $cols = $db->fetchAll("SHOW COLUMNS FROM admins LIKE 'dashboard_sections'");
        if (empty($cols)) {
            $db->query("ALTER TABLE admins ADD COLUMN dashboard_sections TEXT NULL");
        }
    } catch (Exception $e) {}

    try {
        $cols = $db->fetchAll("SHOW COLUMNS FROM admins LIKE 'img'");
        if (empty($cols)) {
            $db->query("ALTER TABLE admins ADD COLUMN img VARCHAR(255) NULL AFTER email");
        }
    } catch (Exception $e) {}

    try {
        $cols = $db->fetchAll("SHOW COLUMNS FROM admins LIKE 'name'");
        if (empty($cols)) {
            $db->query("ALTER TABLE admins ADD COLUMN name VARCHAR(255) NULL AFTER username");
        }
    } catch (Exception $e) {}

    try {
        $db->query("ALTER TABLE admins MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'admin'");
    } catch (Exception $e) {}
}

/**
 * Handle changing/updating or removing login profile image for any role
 */
function handleUpdateProfileImage($db, $input) {
    $user = AuthMiddleware::authenticate();

    $role = $user['role'] ?? 'admin';
    $userId = $user['user_id'] ?? '';

    if (empty($userId)) {
        Response::error('User ID not found in token', 400);
    }

    // Role table mapping
    $tables = [
        'admin'       => 'admins',
        'super_admin' => 'admins',
        'teacher'     => 'teachers',
        'student'     => 'students',
        'parent'      => 'parents',
    ];
    $table = $tables[$role] ?? null;
    if (!$table) {
        Response::error('Invalid account role for profile image update', 400);
    }

    // Check if user is a simulated preview user
    if (!empty($user['is_impersonating']) && str_ends_with($userId, '_preview_user')) {
        $simulatedImg = !empty($input['img']) ? $input['img'] : '/images/avatar.png';
        Response::success('Profile image updated (preview mode)', [
            'img'  => $simulatedImg,
            'user' => [
                'id'       => $userId,
                'username' => $user['username'] ?? $role,
                'name'     => ucfirst($role) . ' Preview',
                'role'     => $role,
                'img'      => $simulatedImg,
            ],
        ]);
        return;
    }

    // Ensure table has img column
    ensureAdminsSchema($db);
    try {
        $cols = $db->fetchAll("SHOW COLUMNS FROM {$table} LIKE 'img'");
        if (empty($cols)) {
            $db->query("ALTER TABLE {$table} ADD COLUMN img VARCHAR(255) NULL");
        }
    } catch (Exception $e) {}

    // Check if user requested to remove photo
    $isRemove = (!empty($input['action']) && $input['action'] === 'remove') ||
                (!empty($input['remove']) && ($input['remove'] === true || $input['remove'] === 'true' || $input['remove'] === 1 || $input['remove'] === '1')) ||
                (isset($input['img']) && trim($input['img']) === '');

    if ($isRemove) {
        // Fetch current image to delete file if it's a custom upload
        $current = $db->fetchOne("SELECT img FROM {$table} WHERE id = ?", [$userId]);
        if (!empty($current['img'])) {
            deleteUploadedProfileImage($current['img']);
        }

        $db->update($table, ['img' => null], 'id = ?', [$userId]);

        // Synchronize linked records
        if ($role === 'teacher') {
            @$db->query("UPDATE staff SET img = NULL WHERE teacher_id = ?", [$userId]);
        } elseif ($role === 'student') {
            @$db->query("UPDATE admissions SET img = NULL WHERE enrolled_student_id = ?", [$userId]);
        } elseif (in_array($role, ['admin', 'super_admin'], true)) {
            @$db->query("UPDATE staff SET img = NULL WHERE admin_id = ?", [$userId]);
        }

        $updatedUser = $db->fetchOne("SELECT * FROM {$table} WHERE id = ?", [$userId]);
        if ($updatedUser) {
            unset($updatedUser['password']);
        }

        Response::success('Profile image removed successfully', [
            'img'  => null,
            'user' => $updatedUser,
        ]);
        return;
    }

    $imageUrl = null;

    // 1. Check $_FILES upload
    $fileKey = !empty($_FILES['img']) ? 'img' : (!empty($_FILES['image']) ? 'image' : (!empty($_FILES['avatar']) ? 'avatar' : (!empty($_FILES['file']) ? 'file' : null)));

    if ($fileKey && isset($_FILES[$fileKey]) && $_FILES[$fileKey]['error'] !== UPLOAD_ERR_NO_FILE) {
        $upload = $_FILES[$fileKey];

        if ($upload['error'] !== UPLOAD_ERR_OK) {
            Response::error('Image upload failed (code ' . $upload['error'] . ')', 400);
        }

        if ($upload['size'] > 5 * 1024 * 1024) {
            Response::error('Image size must be 5 MB or smaller', 400);
        }

        $allowedMimes = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'image/gif'  => 'gif',
        ];

        $imageInfo = @getimagesize($upload['tmp_name']);
        $mimeType = $imageInfo['mime'] ?? '';

        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo) {
                $detected = finfo_file($finfo, $upload['tmp_name']);
                if ($detected) {
                    $mimeType = $detected;
                }
                finfo_close($finfo);
            }
        }

        $ext = strtolower(pathinfo($upload['name'] ?? '', PATHINFO_EXTENSION));
        if (isset($allowedMimes[$mimeType])) {
            $extension = $allowedMimes[$mimeType];
        } elseif (in_array($ext, ['png', 'jpg', 'jpeg', 'webp', 'gif'], true)) {
            $extension = ($ext === 'jpeg') ? 'jpg' : $ext;
        } else {
            Response::error('Please choose a valid JPG, PNG, WebP, or GIF image', 400);
        }

        // Prepare storage directories
        $root = dirname(__DIR__, 2);
        $targetDirs = [];
        if (is_dir($root . '/public/images')) {
            $targetDirs[] = $root . '/public/images';
        }
        if (is_dir($root . '/images')) {
            $targetDirs[] = $root . '/images';
        }
        if (is_dir($root . '/dist/images')) {
            $targetDirs[] = $root . '/dist/images';
        }
        if (empty($targetDirs)) {
            $targetDirs[] = $root . '/public/images';
            @mkdir($root . '/public/images', 0755, true);
        }

        $sanitizedRole = preg_replace('/[^a-z0-9_-]/i', '', $role);
        $sanitizedId = preg_replace('/[^a-z0-9_-]/i', '', (string)$userId);
        $fileName = 'avatar_' . $sanitizedRole . '_' . $sanitizedId . '_' . time() . '_' . bin2hex(random_bytes(3)) . '.' . $extension;

        $primaryDir = $targetDirs[0];
        $primaryPath = $primaryDir . '/' . $fileName;

        if (!move_uploaded_file($upload['tmp_name'], $primaryPath)) {
            Response::serverError('Unable to save uploaded profile image');
        }

        // Mirror to secondary directories
        for ($i = 1; $i < count($targetDirs); $i++) {
            @copy($primaryPath, $targetDirs[$i] . '/' . $fileName);
        }

        $imageUrl = '/images/' . $fileName;
    }
    // 2. Check Base64 payload in input
    elseif (!empty($input['img']) && strpos($input['img'], 'data:image/') === 0) {
        $dataUri = $input['img'];
        if (preg_match('/^data:image\/(\w+);base64,/', $dataUri, $matches)) {
            $rawType = strtolower($matches[1]);
            $base64Data = substr($dataUri, strpos($dataUri, ',') + 1);
            $decoded = base64_decode($base64Data);

            if ($decoded !== false && strlen($decoded) > 0) {
                if (strlen($decoded) > 5 * 1024 * 1024) {
                    Response::error('Image size must be 5 MB or smaller', 400);
                }

                $extension = ($rawType === 'jpeg') ? 'jpg' : ($rawType === 'svg+xml' ? 'svg' : $rawType);
                if (!in_array($extension, ['jpg', 'png', 'webp', 'gif', 'svg'], true)) {
                    $extension = 'png';
                }

                $root = dirname(__DIR__, 2);
                $targetDirs = [];
                if (is_dir($root . '/public/images')) {
                    $targetDirs[] = $root . '/public/images';
                }
                if (is_dir($root . '/images')) {
                    $targetDirs[] = $root . '/images';
                }
                if (is_dir($root . '/dist/images')) {
                    $targetDirs[] = $root . '/dist/images';
                }
                if (empty($targetDirs)) {
                    $targetDirs[] = $root . '/public/images';
                    @mkdir($root . '/public/images', 0755, true);
                }

                $sanitizedRole = preg_replace('/[^a-z0-9_-]/i', '', $role);
                $sanitizedId = preg_replace('/[^a-z0-9_-]/i', '', (string)$userId);
                $fileName = 'avatar_' . $sanitizedRole . '_' . $sanitizedId . '_' . time() . '_' . bin2hex(random_bytes(3)) . '.' . $extension;

                $primaryDir = $targetDirs[0];
                $primaryPath = $primaryDir . '/' . $fileName;

                if (file_put_contents($primaryPath, $decoded) !== false) {
                    for ($i = 1; $i < count($targetDirs); $i++) {
                        @copy($primaryPath, $targetDirs[$i] . '/' . $fileName);
                    }
                    $imageUrl = '/images/' . $fileName;
                }
            }
        }
    }
    // 3. Check direct URL string
    elseif (!empty($input['img']) || !empty($input['image_url'])) {
        $rawUrl = trim($input['img'] ?? $input['image_url'] ?? '');
        if (filter_var($rawUrl, FILTER_VALIDATE_URL) || strpos($rawUrl, '/images/') === 0 || strpos($rawUrl, '/uploads/') === 0) {
            $imageUrl = $rawUrl;
        }
    }

    if (!$imageUrl) {
        Response::error('No valid image file or URL provided', 400);
    }

    // Delete previous custom avatar file if present
    $current = $db->fetchOne("SELECT img FROM {$table} WHERE id = ?", [$userId]);
    if (!empty($current['img']) && $current['img'] !== $imageUrl) {
        deleteUploadedProfileImage($current['img']);
    }

    // Update the database
    $db->update($table, ['img' => $imageUrl], 'id = ?', [$userId]);

    // Synchronize linked records
    if ($role === 'teacher') {
        @$db->query("UPDATE staff SET img = ? WHERE teacher_id = ?", [$imageUrl, $userId]);
    } elseif ($role === 'student') {
        @$db->query("UPDATE admissions SET img = ? WHERE enrolled_student_id = ?", [$imageUrl, $userId]);
    } elseif (in_array($role, ['admin', 'super_admin'], true)) {
        @$db->query("UPDATE staff SET img = ? WHERE admin_id = ?", [$imageUrl, $userId]);
    }

    $updatedUser = $db->fetchOne("SELECT * FROM {$table} WHERE id = ?", [$userId]);
    if ($updatedUser) {
        unset($updatedUser['password']);
    }

    Response::success('Profile image updated successfully', [
        'img'  => $imageUrl,
        'user' => $updatedUser,
    ]);
}

function deleteUploadedProfileImage($imagePath) {
    if (!is_string($imagePath) || strpos($imagePath, '/images/avatar_') !== 0) {
        return;
    }
    $root = dirname(__DIR__, 2);
    $baseName = basename($imagePath);
    $locations = [
        $root . '/public/images/' . $baseName,
        $root . '/images/' . $baseName,
        $root . '/dist/images/' . $baseName,
    ];
    foreach ($locations as $loc) {
        if (is_file($loc)) {
            @unlink($loc);
        }
    }
}
