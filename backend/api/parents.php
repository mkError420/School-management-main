<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

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

function getParents($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    
    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 10);
    $search = $_GET['search'] ?? '';
    
    $offset = ($page - 1) * $limit;
    
    // Build query
    $sql = "SELECT p.* FROM parents p WHERE 1=1";
    $params = [];
    
    if (!empty($search)) {
        $sql .= " AND (p.name LIKE ? OR p.surname LIKE ? OR p.username LIKE ? OR p.email LIKE ? OR p.phone LIKE ?)";
        $searchTerm = "%{$search}%";
        $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm]);
    }
    
    // Get total count
    $countSql = str_replace("SELECT p.*", "SELECT COUNT(*) as total", $sql);
    $totalResult = $db->fetchOne($countSql, $params);
    $total = $totalResult['total'];
    
    // Add pagination
    $sql .= " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $parents = $db->fetchAll($sql, $params);
    
    // Remove passwords from response and add children count
    foreach ($parents as &$parent) {
        unset($parent['password']);
        
        // Get children count
        $childrenCount = $db->fetchOne(
            "SELECT COUNT(*) as count FROM students WHERE parent_id = ?",
            [$parent['id']]
        );
        $parent['children_count'] = $childrenCount['count'];
    }
    
    Response::success('Parents retrieved successfully', [
        'parents' => $parents,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
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
    
    // Remove password from response
    unset($parent['password']);
    
    // Get parent's children (students)
    $children = $db->fetchAll(
        "SELECT s.*, c.name as class_name, g.level as grade_level 
         FROM students s 
         LEFT JOIN classes c ON s.class_id = c.id 
         LEFT JOIN grades g ON s.grade_id = g.id 
         WHERE s.parent_id = ? 
         ORDER BY s.name",
        [$id]
    );
    
    // Remove passwords from children
    foreach ($children as &$child) {
        unset($child['password']);
    }
    
    Response::success('Parent retrieved successfully', [
        'parent' => $parent,
        'children' => $children
    ]);
}

function createParent($db) {
    AuthMiddleware::requireRole('admin');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $required = ['username', 'password', 'name', 'surname', 'address', 'phone'];
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
    
    try {
        $db->insert('parents', [
            'id' => $id,
            'username' => $input['username'],
            'password' => $hashedPassword,
            'name' => $input['name'],
            'surname' => $input['surname'],
            'email' => $input['email'] ?? null,
            'phone' => $input['phone'],
            'address' => $input['address']
        ]);
        
        // Get the created parent
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
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Check if parent exists
    $existing = $db->fetchOne("SELECT id FROM parents WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Parent not found');
    }
    
    $data = [];
    
    // Build update data
    $allowedFields = ['name', 'surname', 'email', 'phone', 'address'];
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
    
    if (empty($data)) {
        Response::error('No fields to update');
    }
    
    try {
        $db->update('parents', $data, 'id = ?', [$id]);
        
        // Get updated parent
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
    
    // Check if parent exists
    $existing = $db->fetchOne("SELECT id FROM parents WHERE id = ?", [$id]);
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
            Response::success('Parent deleted successfully');
        } else {
            Response::error('Failed to delete parent');
        }
        
    } catch (Exception $e) {
        Response::error('Failed to delete parent: ' . $e->getMessage());
    }
}
