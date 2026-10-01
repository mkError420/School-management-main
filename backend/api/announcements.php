<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            getAnnouncement($db, $id);
        } else {
            getAnnouncements($db);
        }
        break;
        
    case 'POST':
        createAnnouncement($db);
        break;
        
    case 'PUT':
        if (!$id) {
            Response::error('Announcement ID is required');
        }
        updateAnnouncement($db, $id);
        break;
        
    case 'DELETE':
        if (!$id) {
            Response::error('Announcement ID is required');
        }
        deleteAnnouncement($db, $id);
        break;
        
    default:
        Response::methodNotAllowed();
}

function getAnnouncements($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 10);
    $search = $_GET['search'] ?? '';
    $classId = $_GET['class_id'] ?? '';
    
    $offset = ($page - 1) * $limit;
    
    $sql = "SELECT a.*, c.name as class_name 
            FROM announcements a 
            LEFT JOIN classes c ON a.class_id = c.id 
            WHERE 1=1";
    $params = [];

    if (!AuthMiddleware::isAdmin($user)) {
        $visibility = announcementVisibility($user);
        $sql .= " AND " . $visibility['sql'];
        $params = array_merge($params, $visibility['params']);
    }
    
    if (!empty($search)) {
        $sql .= " AND (a.title LIKE ? OR a.description LIKE ?)";
        $searchTerm = "%{$search}%";
        $params = array_merge($params, [$searchTerm, $searchTerm]);
    }
    
    if (!empty($classId)) {
        $sql .= " AND (a.class_id = ? OR a.class_id IS NULL)";
        $params[] = $classId;
    }
    
    $countSql = "SELECT COUNT(*) as total FROM (" . $sql . ") as subquery";
    $totalResult = $db->fetchOne($countSql, $params);
    $total = $totalResult['total'] ?? 0;
    
    $sql .= " ORDER BY a.date DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $announcements = $db->fetchAll($sql, $params);
    
    Response::success('Announcements retrieved successfully', [
        'announcements' => $announcements,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

function getAnnouncement($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);

    $visibility = AuthMiddleware::isAdmin($user)
        ? ['sql' => '1=1', 'params' => []]
        : announcementVisibility($user);
    
    $announcement = $db->fetchOne(
        "SELECT a.*, c.name as class_name 
         FROM announcements a 
         LEFT JOIN classes c ON a.class_id = c.id 
         WHERE a.id = ? AND " . $visibility['sql'],
        array_merge([$id], $visibility['params'])
    );
    
    if (!$announcement) {
        Response::notFound('Announcement not found');
    }
    
    Response::success('Announcement retrieved successfully', ['announcement' => $announcement]);
}

function announcementVisibility($user) {
    switch ($user['role']) {
        case 'teacher':
            return [
                'sql' => '(a.class_id IS NULL OR a.class_id IN (SELECT class_id FROM teacher_classes WHERE teacher_id = ?) OR a.class_id IN (SELECT id FROM classes WHERE supervisor_id = ?))',
                'params' => [$user['user_id'], $user['user_id']],
            ];
        case 'student':
            return [
                'sql' => '(a.class_id IS NULL OR a.class_id = (SELECT class_id FROM students WHERE id = ?))',
                'params' => [$user['user_id']],
            ];
        case 'parent':
            return [
                'sql' => '(a.class_id IS NULL OR a.class_id IN (SELECT class_id FROM students WHERE parent_id = ?))',
                'params' => [$user['user_id']],
            ];
        default:
            return ['sql' => '1=1', 'params' => []];
    }
}

function createAnnouncement($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['title']) || empty($input['date'])) {
        Response::error('Title and date are required');
    }
    
    $announcementId = $db->insert('announcements', [
        'title' => $input['title'],
        'description' => $input['description'] ?? '',
        'date' => $input['date'],
        'class_id' => !empty($input['class_id']) ? $input['class_id'] : null
    ]);
    
    Response::success('Announcement created successfully', ['id' => $announcementId], 201);
}

function updateAnnouncement($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    $input = json_decode(file_get_contents('php://input'), true);
    
    $announcement = $db->fetchOne("SELECT * FROM announcements WHERE id = ?", [$id]);
    if (!$announcement) {
        Response::notFound('Announcement not found');
    }
    
    $data = [];
    if (isset($input['title'])) $data['title'] = $input['title'];
    if (isset($input['description'])) $data['description'] = $input['description'];
    if (isset($input['date'])) $data['date'] = $input['date'];
    if (array_key_exists('class_id', $input)) $data['class_id'] = $input['class_id'] ?: null;
    
    if (empty($data)) {
        Response::error('No fields provided to update');
    }
    
    $db->update('announcements', $data, 'id = ?', [$id]);
    Response::success('Announcement updated successfully');
}

function deleteAnnouncement($db, $id) {
    $user = AuthMiddleware::requireRole('admin');
    
    $announcement = $db->fetchOne("SELECT * FROM announcements WHERE id = ?", [$id]);
    if (!$announcement) {
        Response::notFound('Announcement not found');
    }
    
    $db->delete('announcements', 'id = ?', [$id]);
    Response::success('Announcement deleted successfully');
}
