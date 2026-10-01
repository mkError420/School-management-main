<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            getEvent($db, $id);
        } else {
            getEvents($db);
        }
        break;
        
    case 'POST':
        createEvent($db);
        break;
        
    case 'PUT':
        if (!$id) {
            Response::error('Event ID is required');
        }
        updateEvent($db, $id);
        break;
        
    case 'DELETE':
        if (!$id) {
            Response::error('Event ID is required');
        }
        deleteEvent($db, $id);
        break;
        
    default:
        Response::methodNotAllowed();
}

function getEvents($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 10);
    $search = $_GET['search'] ?? '';
    $classId = $_GET['class_id'] ?? '';
    
    $offset = ($page - 1) * $limit;
    
    $sql = "SELECT e.*, c.name as class_name 
            FROM events e 
            LEFT JOIN classes c ON e.class_id = c.id 
            WHERE 1=1";
    $params = [];

    if ($user['role'] !== 'admin') {
        $visibility = eventVisibility($user);
        $sql .= " AND " . $visibility['sql'];
        $params = array_merge($params, $visibility['params']);
    }
    
    if (!empty($search)) {
        $sql .= " AND (e.title LIKE ? OR e.description LIKE ?)";
        $searchTerm = "%{$search}%";
        $params = array_merge($params, [$searchTerm, $searchTerm]);
    }
    
    if (!empty($classId)) {
        $sql .= " AND (e.class_id = ? OR e.class_id IS NULL)";
        $params[] = $classId;
    }
    
    $countSql = "SELECT COUNT(*) as total FROM (" . $sql . ") as subquery";
    $totalResult = $db->fetchOne($countSql, $params);
    $total = $totalResult['total'] ?? 0;
    
    $sql .= " ORDER BY e.start_time ASC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $events = $db->fetchAll($sql, $params);
    
    Response::success('Events retrieved successfully', [
        'events' => $events,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

function getEvent($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);

    $visibility = $user['role'] === 'admin'
        ? ['sql' => '1=1', 'params' => []]
        : eventVisibility($user);
    
    $event = $db->fetchOne(
        "SELECT e.*, c.name as class_name 
         FROM events e 
         LEFT JOIN classes c ON e.class_id = c.id 
         WHERE e.id = ? AND " . $visibility['sql'],
        array_merge([$id], $visibility['params'])
    );
    
    if (!$event) {
        Response::notFound('Event not found');
    }
    
    Response::success('Event retrieved successfully', ['event' => $event]);
}

function eventVisibility($user) {
    switch ($user['role']) {
        case 'teacher':
            return [
                'sql' => '(e.class_id IS NULL OR e.class_id IN (SELECT class_id FROM teacher_classes WHERE teacher_id = ?) OR e.class_id IN (SELECT id FROM classes WHERE supervisor_id = ?))',
                'params' => [$user['user_id'], $user['user_id']],
            ];
        case 'student':
            return [
                'sql' => '(e.class_id IS NULL OR e.class_id = (SELECT class_id FROM students WHERE id = ?))',
                'params' => [$user['user_id']],
            ];
        case 'parent':
            return [
                'sql' => '(e.class_id IS NULL OR e.class_id IN (SELECT class_id FROM students WHERE parent_id = ?))',
                'params' => [$user['user_id']],
            ];
        default:
            return ['sql' => '1=1', 'params' => []];
    }
}

function createEvent($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['title']) || empty($input['start_time']) || empty($input['end_time'])) {
        Response::error('Title, start_time and end_time are required');
    }
    
    $eventId = $db->insert('events', [
        'title' => $input['title'],
        'description' => $input['description'] ?? '',
        'start_time' => $input['start_time'],
        'end_time' => $input['end_time'],
        'class_id' => !empty($input['class_id']) ? $input['class_id'] : null
    ]);
    
    Response::success('Event created successfully', ['id' => $eventId], 201);
}

function updateEvent($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    $input = json_decode(file_get_contents('php://input'), true);
    
    $event = $db->fetchOne("SELECT * FROM events WHERE id = ?", [$id]);
    if (!$event) {
        Response::notFound('Event not found');
    }
    
    $data = [];
    if (isset($input['title'])) $data['title'] = $input['title'];
    if (isset($input['description'])) $data['description'] = $input['description'];
    if (isset($input['start_time'])) $data['start_time'] = $input['start_time'];
    if (isset($input['end_time'])) $data['end_time'] = $input['end_time'];
    if (array_key_exists('class_id', $input)) $data['class_id'] = $input['class_id'] ?: null;
    
    if (empty($data)) {
        Response::error('No fields provided to update');
    }
    
    $db->update('events', $data, 'id = ?', [$id]);
    Response::success('Event updated successfully');
}

function deleteEvent($db, $id) {
    $user = AuthMiddleware::requireRole('admin');
    
    $event = $db->fetchOne("SELECT * FROM events WHERE id = ?", [$id]);
    if (!$event) {
        Response::notFound('Event not found');
    }
    
    $db->delete('events', 'id = ?', [$id]);
    Response::success('Event deleted successfully');
}
