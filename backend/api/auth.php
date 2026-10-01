<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];

// Get request data
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'POST':
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'login':
                handleLogin($db, $input);
                break;
            case 'register':
                handleRegister($db, $input);
                break;
            case 'change-password':
                handleChangePassword($db, $input);
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
                
                $db->insert('students', [
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

function handleGetCurrentUser($db) {
    $user = AuthMiddleware::authenticate();
    
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
    
    $userData = $db->fetchOne(
        "SELECT * FROM {$table} WHERE id = ?",
        [$user['user_id']]
    );
    
    if (!$userData) {
        Response::notFound('User not found');
    }
    
    // Remove password from response
    unset($userData['password']);
    
    Response::success('User retrieved successfully', [
        'user' => $userData,
        'role' => $user['role']
    ]);
}
