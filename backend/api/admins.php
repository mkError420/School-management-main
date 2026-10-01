<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        getAdmins($db);
        break;
    case 'POST':
        createAdmin($db);
        break;
    case 'PUT':
        if (!$id) {
            Response::error('Admin ID is required');
        }
        updateAdmin($db, $id);
        break;
    case 'DELETE':
        if (!$id) {
            Response::error('Admin ID is required');
        }
        deleteAdmin($db, $id);
        break;
    default:
        Response::methodNotAllowed();
}

function getAdmins($db) {
    AuthMiddleware::requireRole('super_admin');
    $admins = $db->fetchAll(
        "SELECT id, username, email, role, created_at FROM admins ORDER BY role DESC, username ASC"
    );
    Response::success('Admins retrieved successfully', ['admins' => $admins]);
}

function createAdmin($db) {
    AuthMiddleware::requireRole('super_admin');
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $username = trim($input['username'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $role = $input['role'] ?? 'admin';

    validateAdminInput($username, $email, $password, $role, true, true);

    try {
        $db->insert('admins', [
            'id' => bin2hex(random_bytes(16)),
            'username' => $username,
            'email' => $email,
            'password' => password_hash($password, PASSWORD_DEFAULT),
            'role' => $role,
        ]);
        Response::success('Admin created successfully', [
            'username' => $username,
            'email' => $email,
            'role' => $role,
        ], 201);
    } catch (Exception $e) {
        if (stripos($e->getMessage(), 'Duplicate entry') !== false) {
            Response::error('Username or email is already in use', 409);
        }
        Response::serverError('Unable to create admin');
    }
}

function updateAdmin($db, $id) {
    $actor = AuthMiddleware::requireRole('super_admin');
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $existing = $db->fetchOne('SELECT id, username, email, role FROM admins WHERE id = ?', [$id]);
    if (!$existing) {
        Response::notFound('Admin not found');
    }

    $username = trim($input['username'] ?? $existing['username']);
    $email = trim($input['email'] ?? $existing['email'] ?? '');
    $role = $input['role'] ?? $existing['role'];
    $password = $input['password'] ?? '';
    validateAdminInput($username, $email, $password, $role, false, false);

    if ($actor['user_id'] === $id && $role !== 'super_admin') {
        Response::error('You cannot remove your own super-admin access', 409);
    }
    if ($existing['role'] === 'super_admin' && $role !== 'super_admin') {
        ensureAnotherSuperAdminExists($db, $id);
    }

    $data = [
        'username' => $username,
        'email' => $email !== '' ? $email : null,
        'role' => $role,
    ];
    if ($password !== '') {
        $data['password'] = password_hash($password, PASSWORD_DEFAULT);
    }

    try {
        $db->update('admins', $data, 'id = ?', [$id]);
        Response::success('Admin updated successfully');
    } catch (Exception $e) {
        if (stripos($e->getMessage(), 'Duplicate entry') !== false) {
            Response::error('Username or email is already in use', 409);
        }
        Response::serverError('Unable to update admin');
    }
}

function deleteAdmin($db, $id) {
    $actor = AuthMiddleware::requireRole('super_admin');
    if ($actor['user_id'] === $id) {
        Response::error('You cannot delete your own account', 409);
    }

    $admin = $db->fetchOne('SELECT id, role FROM admins WHERE id = ?', [$id]);
    if (!$admin) {
        Response::notFound('Admin not found');
    }
    if ($admin['role'] === 'super_admin') {
        ensureAnotherSuperAdminExists($db, $id);
    }

    $db->delete('admins', 'id = ?', [$id]);
    Response::success('Admin deleted successfully');
}

function validateAdminInput($username, $email, $password, $role, $passwordRequired, $emailRequired) {
    if ($username === '' || strlen($username) < 3 || strlen($username) > 64) {
        Response::error('Username must be between 3 and 64 characters');
    }
    if ($emailRequired && $email === '') {
        Response::error('A valid email address is required');
    }
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Response::error('A valid email address is required');
    }
    if (!in_array($role, ['admin', 'super_admin'], true)) {
        Response::error('Role access must be admin or super_admin');
    }
    if (($passwordRequired && $password === '') || ($password !== '' && strlen($password) < 8)) {
        Response::error('Password must be at least 8 characters');
    }
}

function ensureAnotherSuperAdminExists($db, $excludedId) {
    $count = $db->fetchOne(
        "SELECT COUNT(*) AS total FROM admins WHERE role = 'super_admin' AND id <> ?",
        [$excludedId]
    );
    if ((int) $count['total'] < 1) {
        Response::error('The last super-admin account cannot be removed or downgraded', 409);
    }
}
