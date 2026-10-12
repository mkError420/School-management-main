<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

// Allow _method override for multipart/form-data PUT requests
if ($method === 'POST' && isset($_POST['_method']) && strtoupper($_POST['_method']) === 'PUT') {
    $method = 'PUT';
}

switch ($method) {
    case 'GET':
        if ($action === 'attachment') {
            downloadEventAttachment($db, $id);
        } elseif ($id) {
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

// ─────────────────────────────────────────────────────────────────────────────
// Helper: ensure attachment columns exist (auto-migration on first use)
// ─────────────────────────────────────────────────────────────────────────────
function ensureEventSchema($db) {
    $columnsToAdd = [
        'document_attachment'      => 'VARCHAR(500) NULL AFTER class_id',
        'attachment_original_name' => 'VARCHAR(255) NULL AFTER document_attachment',
        'attachment_mime_type'     => 'VARCHAR(127) NULL AFTER attachment_original_name',
        'attachment_size'          => 'INT UNSIGNED NULL AFTER attachment_mime_type',
        'updated_at'               => 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    ];
    foreach ($columnsToAdd as $col => $definition) {
        $exists = $db->fetchAll("SHOW COLUMNS FROM `events` LIKE '{$col}'");
        if (!$exists) {
            try {
                $db->query("ALTER TABLE `events` ADD COLUMN `{$col}` {$definition}");
            } catch (Exception $e) {
                // Column may already exist
            }
        }
    }
}

function getUploadDir() {
    $dir = __DIR__ . '/../uploads/';
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    return $dir;
}

function handleEventDocumentUpload() {
    $fileKey = null;
    if (isset($_FILES['document_attachment']) && $_FILES['document_attachment']['error'] !== UPLOAD_ERR_NO_FILE) {
        $fileKey = 'document_attachment';
    } elseif (isset($_FILES['attachment']) && $_FILES['attachment']['error'] !== UPLOAD_ERR_NO_FILE) {
        $fileKey = 'attachment';
    } elseif (isset($_FILES['file']) && $_FILES['file']['error'] !== UPLOAD_ERR_NO_FILE) {
        $fileKey = 'file';
    }
    if (!$fileKey) {
        return null;
    }

    $file = $_FILES[$fileKey];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $messages = [
            UPLOAD_ERR_INI_SIZE   => 'File exceeds server upload limit.',
            UPLOAD_ERR_FORM_SIZE  => 'File exceeds form size limit.',
            UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded.',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder.',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
            UPLOAD_ERR_EXTENSION  => 'A PHP extension blocked the upload.',
        ];
        Response::error($messages[$file['error']] ?? 'File upload error.');
    }

    $maxSize = 25 * 1024 * 1024; // 25 MB
    if ($file['size'] > $maxSize) {
        Response::error('File must be 25 MB or smaller.');
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = $finfo->file($file['tmp_name']);

    $allowedMimes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
    ];
    if (!in_array($mime, $allowedMimes, true)) {
        Response::error('Only PDF or image (JPG, PNG, WebP, GIF) documents are allowed.');
    }

    $extMap = [
        'application/pdf' => 'pdf',
        'image/jpeg'      => 'jpg',
        'image/png'       => 'png',
        'image/webp'      => 'webp',
        'image/gif'       => 'gif',
    ];
    $ext = $extMap[$mime] ?? 'bin';
    $storageName = 'event_doc_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
    $uploadDir   = getUploadDir();
    $destination = $uploadDir . $storageName;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        Response::error('Failed to save uploaded file. Check server permissions.');
    }

    return [
        'storage_name'  => $storageName,
        'original_name' => basename($file['name']),
        'mime_type'     => $mime,
        'file_size'     => $file['size'],
    ];
}

function deleteAttachmentFile($storageName) {
    if (empty($storageName)) return;
    $path = getUploadDir() . $storageName;
    if (file_exists($path)) {
        @unlink($path);
    }
}

function downloadEventAttachment($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    ensureEventSchema($db);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Event ID is required']);
        exit;
    }

    $visibility = AuthMiddleware::isAdmin($user)
        ? ['sql' => '1=1', 'params' => []]
        : eventVisibility($user);

    $event = $db->fetchOne(
        "SELECT e.document_attachment, e.attachment_original_name, e.attachment_mime_type, e.class_id
         FROM events e
         WHERE e.id = ? AND " . $visibility['sql'],
        array_merge([$id], $visibility['params'])
    );

    if (!$event || empty($event['document_attachment'])) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Attachment not found']);
        exit;
    }

    $filePath = getUploadDir() . $event['document_attachment'];
    if (!file_exists($filePath)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'File not found on server']);
        exit;
    }

    $mime         = $event['attachment_mime_type'] ?: mime_content_type($filePath);
    $originalName = $event['attachment_original_name'] ?: basename($filePath);

    while (ob_get_level()) {
        ob_end_clean();
    }
    header('Content-Type: ' . $mime, true);
    header('Content-Length: ' . filesize($filePath));
    header('Accept-Ranges: bytes');
    $inline = in_array($mime, ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    header('Content-Disposition: ' . ($inline ? 'inline' : 'attachment') . '; filename="' . addslashes($originalName) . '"');
    header('Cache-Control: private, max-age=3600');
    readfile($filePath);
    exit;
}

function getEvents($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    ensureEventSchema($db);
    
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

    if (!AuthMiddleware::isAdmin($user)) {
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
    
    $date = $_GET['date'] ?? '';
    if (!empty($date)) {
        $sql .= " AND (DATE(e.start_time) <= ? AND DATE(e.end_time) >= ?)";
        $params[] = $date;
        $params[] = $date;
    }
    
    $countSql = "SELECT COUNT(*) as total FROM (" . $sql . ") as subquery";
    $totalResult = $db->fetchOne($countSql, $params);
    $total = $totalResult['total'] ?? 0;
    
    $sql .= " ORDER BY e.start_time ASC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $events = $db->fetchAll($sql, $params);

    foreach ($events as &$ev) {
        $ev['attachment_url'] = !empty($ev['document_attachment'])
            ? '/backend/api/events?action=attachment&id=' . $ev['id']
            : null;
    }
    unset($ev);
    
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
    ensureEventSchema($db);

    $visibility = AuthMiddleware::isAdmin($user)
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

    $event['attachment_url'] = !empty($event['document_attachment'])
        ? '/backend/api/events?action=attachment&id=' . $event['id']
        : null;
    
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
    ensureEventSchema($db);

    $isMultipart = !empty($_POST) || !empty($_FILES);
    $input = $isMultipart ? $_POST : json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['title']) || empty($input['start_time']) || empty($input['end_time'])) {
        Response::error('Title, start_time and end_time are required');
    }

    $uploadInfo = handleEventDocumentUpload();
    
    $eventData = [
        'title' => $input['title'],
        'description' => $input['description'] ?? '',
        'start_time' => $input['start_time'],
        'end_time' => $input['end_time'],
        'class_id' => !empty($input['class_id']) ? $input['class_id'] : null,
        'document_attachment' => $uploadInfo['storage_name'] ?? null,
        'attachment_original_name' => $uploadInfo['original_name'] ?? null,
        'attachment_mime_type' => $uploadInfo['mime_type'] ?? null,
        'attachment_size' => $uploadInfo['file_size'] ?? null,
    ];

    $eventId = $db->insert('events', $eventData);

    $createdEvent = $db->fetchOne("SELECT * FROM events WHERE id = ?", [$eventId]);
    if ($createdEvent) {
        $createdEvent['attachment_url'] = !empty($createdEvent['document_attachment'])
            ? '/backend/api/events?action=attachment&id=' . $createdEvent['id']
            : null;
    }
    
    Response::success('Event created successfully', ['id' => $eventId, 'event' => $createdEvent], 201);
}

function updateEvent($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    ensureEventSchema($db);

    $isMultipart = !empty($_POST) || !empty($_FILES);
    $input = $isMultipart ? $_POST : json_decode(file_get_contents('php://input'), true);
    
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

    $uploadInfo = handleEventDocumentUpload();
    if ($uploadInfo) {
        deleteAttachmentFile($event['document_attachment'] ?? '');
        $data['document_attachment']       = $uploadInfo['storage_name'];
        $data['attachment_original_name'] = $uploadInfo['original_name'];
        $data['attachment_mime_type']     = $uploadInfo['mime_type'];
        $data['attachment_size']          = $uploadInfo['file_size'];
    } elseif (!empty($input['remove_attachment'])) {
        deleteAttachmentFile($event['document_attachment'] ?? '');
        $data['document_attachment']       = null;
        $data['attachment_original_name'] = null;
        $data['attachment_mime_type']     = null;
        $data['attachment_size']          = null;
    }
    
    if (empty($data)) {
        Response::error('No fields provided to update');
    }
    
    $db->update('events', $data, 'id = ?', [$id]);

    $updatedEvent = $db->fetchOne("SELECT * FROM events WHERE id = ?", [$id]);
    if ($updatedEvent) {
        $updatedEvent['attachment_url'] = !empty($updatedEvent['document_attachment'])
            ? '/backend/api/events?action=attachment&id=' . $updatedEvent['id']
            : null;
    }

    Response::success('Event updated successfully', ['event' => $updatedEvent]);
}

function deleteEvent($db, $id) {
    $user = AuthMiddleware::requireRole('admin');
    ensureEventSchema($db);
    
    $event = $db->fetchOne("SELECT * FROM events WHERE id = ?", [$id]);
    if (!$event) {
        Response::notFound('Event not found');
    }

    deleteAttachmentFile($event['document_attachment'] ?? '');
    
    $db->delete('events', 'id = ?', [$id]);
    Response::success('Event deleted successfully');
}
