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
            downloadAnnouncementAttachment($db, $id);
        } elseif ($action === 'unread-count') {
            getUnreadAnnouncementsCount($db);
        } elseif ($id) {
            getAnnouncement($db, $id);
        } else {
            getAnnouncements($db);
        }
        break;
        
    case 'POST':
        if ($action === 'mark-read') {
            markAnnouncementRead($db);
        } elseif ($action === 'mark-all-read') {
            markAllAnnouncementsRead($db);
        } else {
            createAnnouncement($db);
        }
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

// ─────────────────────────────────────────────────────────────────────────────
// Helper: ensure attachment columns exist (auto-migration on first use)
// ─────────────────────────────────────────────────────────────────────────────
function ensureAnnouncementSchema($db) {
    $columnsToAdd = [
        'category'                 => "VARCHAR(100) NULL DEFAULT 'General'",
        'document_attachment'      => 'VARCHAR(500) NULL',
        'attachment_original_name' => 'VARCHAR(255) NULL',
        'attachment_mime_type'     => 'VARCHAR(127) NULL',
        'attachment_size'          => 'INT UNSIGNED NULL',
        'updated_at'               => 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    ];
    foreach ($columnsToAdd as $col => $definition) {
        try {
            $exists = $db->fetchAll("SHOW COLUMNS FROM `announcements` LIKE '{$col}'");
            if (empty($exists)) {
                $db->query("ALTER TABLE `announcements` ADD COLUMN `{$col}` {$definition}");
            }
        } catch (Exception $e) {
            // Column may already exist or ALTER not allowed
        }
    }

    try {
        $db->query("CREATE TABLE IF NOT EXISTS announcement_reads (
            id INT AUTO_INCREMENT PRIMARY KEY,
            announcement_id INT NOT NULL,
            user_id VARCHAR(255) NOT NULL,
            read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_announcement (user_id, announcement_id),
            FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    } catch (Exception $e) {}
}

function getUploadDir() {
    $dir = __DIR__ . '/../uploads/';
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    if (!is_dir($dir)) {
        $root = dirname(__DIR__, 2);
        $alt = $root . '/public/uploads/';
        if (!is_dir($alt)) {
            @mkdir($alt, 0755, true);
        }
        if (is_dir($alt)) {
            return $alt;
        }
    }
    return $dir;
}

function handleAnnouncementDocumentUpload() {
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
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
    ];
    $allowedExts = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'webp', 'gif'];
    $fileExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    if (!in_array($mime, $allowedMimes, true) && !in_array($fileExt, $allowedExts, true)) {
        Response::error('Only PDF, Word (.doc/.docx), Text (.txt), or image (JPG, PNG, WebP, GIF) documents are allowed.');
    }

    $extMap = [
        'application/pdf' => 'pdf',
        'application/msword' => 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
        'text/plain' => 'txt',
        'image/jpeg'      => 'jpg',
        'image/png'       => 'png',
        'image/webp'      => 'webp',
        'image/gif'       => 'gif',
    ];
    $ext = $extMap[$mime] ?? ($fileExt ?: 'bin');
    $storageName = 'announcement_doc_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
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

function downloadAnnouncementAttachment($db, $id) {
    ensureAnnouncementSchema($db);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Announcement ID is required']);
        exit;
    }

    // Allow public website visitors and direct browser/iframe links
    $user = AuthMiddleware::optionalAuth();

    $visibility = ['sql' => '1=1', 'params' => []];
    if ($user && !AuthMiddleware::isAdmin($user)) {
        $visibility = announcementVisibility($user);
    }

    $announcement = $db->fetchOne(
        "SELECT a.document_attachment, a.attachment_original_name, a.attachment_mime_type, a.class_id
         FROM announcements a
         WHERE a.id = ? AND " . $visibility['sql'],
        array_merge([$id], $visibility['params'])
    );

    if (!$announcement || empty($announcement['document_attachment'])) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Attachment not found']);
        exit;
    }

    $filePath = getUploadDir() . $announcement['document_attachment'];
    if (!file_exists($filePath)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'File not found on server']);
        exit;
    }

    $mime         = $announcement['attachment_mime_type'] ?: mime_content_type($filePath);
    $originalName = $announcement['attachment_original_name'] ?: basename($filePath);

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

function calculateUnreadAnnouncementsCount($db, $user) {
    $visibility = AuthMiddleware::isAdmin($user)
        ? ['sql' => '1=1', 'params' => []]
        : announcementVisibility($user);

    $sql = "SELECT COUNT(*) as unread_count 
            FROM announcements a 
            WHERE {$visibility['sql']} 
              AND a.id NOT IN (SELECT announcement_id FROM announcement_reads WHERE user_id = ?)";
    
    $params = array_merge($visibility['params'], [$user['user_id']]);
    $res = $db->fetchOne($sql, $params);
    return intval($res['unread_count'] ?? 0);
}

function getUnreadAnnouncementsCount($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    ensureAnnouncementSchema($db);

    $count = calculateUnreadAnnouncementsCount($db, $user);
    Response::success('Unread count retrieved successfully', ['unread_count' => $count]);
}

function markAnnouncementRead($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    ensureAnnouncementSchema($db);

    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $announcementId = $input['id'] ?? $_GET['id'] ?? null;

    if (!$announcementId) {
        Response::error('Announcement ID is required');
    }

    if ($announcementId === 'all') {
        markAllAnnouncementsRead($db);
        return;
    }

    $db->query(
        "INSERT IGNORE INTO announcement_reads (announcement_id, user_id) VALUES (?, ?)",
        [$announcementId, $user['user_id']]
    );

    $unread = calculateUnreadAnnouncementsCount($db, $user);
    Response::success('Announcement marked as read', [
        'unread_count' => $unread,
        'announcement_id' => $announcementId
    ]);
}

function markAllAnnouncementsRead($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    ensureAnnouncementSchema($db);

    $visibility = AuthMiddleware::isAdmin($user)
        ? ['sql' => '1=1', 'params' => []]
        : announcementVisibility($user);

    $sql = "INSERT IGNORE INTO announcement_reads (announcement_id, user_id)
            SELECT a.id, ?
            FROM announcements a
            WHERE {$visibility['sql']}";
    $params = array_merge([$user['user_id']], $visibility['params']);
    
    $db->query($sql, $params);

    Response::success('All announcements marked as read', [
        'unread_count' => 0
    ]);
}

function getAnnouncements($db) {
    $user = AuthMiddleware::optionalAuth();
    ensureAnnouncementSchema($db);
    
    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 10);
    $search = $_GET['search'] ?? '';
    $classId = $_GET['class_id'] ?? '';
    $hasAttachment = $_GET['has_attachment'] ?? '';
    
    $offset = ($page - 1) * $limit;
    
    $userId = $user ? $user['user_id'] : 0;
    
    $sql = "SELECT a.*, c.name as class_name,
                   CASE WHEN ar.id IS NOT NULL THEN 1 ELSE 0 END as is_read
            FROM announcements a 
            LEFT JOIN classes c ON a.class_id = c.id 
            LEFT JOIN announcement_reads ar ON ar.announcement_id = a.id AND ar.user_id = ?
            WHERE 1=1";
    $params = [$userId];

    if ($user && !AuthMiddleware::isAdmin($user)) {
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
        if ($classId === 'school_wide' || $classId === 'all_classes') {
            $sql .= " AND a.class_id IS NULL";
        } else {
            $sql .= " AND a.class_id = ?";
            $params[] = $classId;
        }
    }

    $category = $_GET['category'] ?? '';
    if (!empty($category) && $category !== 'all') {
        $sql .= " AND (a.category = ? OR (a.category IS NULL AND ? = 'General'))";
        $params[] = $category;
        $params[] = $category;
    }

    if ($hasAttachment === '1' || $hasAttachment === 'true') {
        $sql .= " AND a.document_attachment IS NOT NULL AND a.document_attachment != ''";
    }
    
    $countSql = "SELECT COUNT(*) as total FROM (" . $sql . ") as subquery";
    $totalResult = $db->fetchOne($countSql, $params);
    $total = $totalResult['total'] ?? 0;
    
    $sql .= " ORDER BY a.date DESC, a.id DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $announcements = $db->fetchAll($sql, $params);

    foreach ($announcements as &$ann) {
        $ann['attachment_url'] = !empty($ann['document_attachment'])
            ? '/backend/api/announcements?action=attachment&id=' . $ann['id']
            : null;
        $ann['is_read'] = !empty($ann['is_read']);
    }
    unset($ann);
    
    Response::success('Announcements retrieved successfully', [
        'announcements' => $announcements,
        'unread_count'  => $user ? calculateUnreadAnnouncementsCount($db, $user) : 0,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

function getAnnouncement($db, $id) {
    $user = AuthMiddleware::optionalAuth();
    ensureAnnouncementSchema($db);

    $visibility = ['sql' => '1=1', 'params' => []];
    if ($user && !AuthMiddleware::isAdmin($user)) {
        $visibility = announcementVisibility($user);
    }
    
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

    // Auto mark announcement as read for the user if logged in
    if ($user) {
        $db->query(
            "INSERT IGNORE INTO announcement_reads (announcement_id, user_id) VALUES (?, ?)",
            [$id, $user['user_id']]
        );
    }

    $announcement['attachment_url'] = !empty($announcement['document_attachment'])
        ? '/backend/api/announcements?action=attachment&id=' . $announcement['id']
        : null;
    $announcement['is_read'] = true;
    
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
    ensureAnnouncementSchema($db);

    $isMultipart = !empty($_POST) || !empty($_FILES);
    $input = $isMultipart ? $_POST : json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['title'])) {
        Response::error('Announcement title is required');
    }

    $uploadInfo = handleAnnouncementDocumentUpload();
    $publishDate = !empty($input['date']) ? $input['date'] : date('Y-m-d');
    $category = !empty($input['category']) ? trim($input['category']) : 'General';
    
    $announcementData = [
        'title'                    => $input['title'],
        'description'              => $input['description'] ?? '',
        'category'                 => $category,
        'date'                     => $publishDate,
        'class_id'                 => !empty($input['class_id']) ? $input['class_id'] : null,
        'document_attachment'      => $uploadInfo['storage_name'] ?? null,
        'attachment_original_name' => $uploadInfo['original_name'] ?? null,
        'attachment_mime_type'     => $uploadInfo['mime_type'] ?? null,
        'attachment_size'          => $uploadInfo['file_size'] ?? null,
    ];

    // Protect against missing DB columns if database migration hasn't been executed
    try {
        $existingCols = [];
        $cols = $db->fetchAll("SHOW COLUMNS FROM `announcements`");
        foreach ($cols as $c) {
            $existingCols[] = $c['Field'] ?? $c['field'] ?? '';
        }
        if (!empty($existingCols)) {
            $announcementData = array_intersect_key($announcementData, array_flip($existingCols));
        }
    } catch (Exception $e) {}

    $announcementId = $db->insert('announcements', $announcementData);

    $created = $db->fetchOne("SELECT a.*, c.name as class_name FROM announcements a LEFT JOIN classes c ON a.class_id = c.id WHERE a.id = ?", [$announcementId]);
    if ($created) {
        $created['attachment_url'] = !empty($created['document_attachment'])
            ? '/backend/api/announcements?action=attachment&id=' . $created['id']
            : null;
    }
    
    Response::success('Announcement created successfully', ['id' => $announcementId, 'announcement' => $created], 201);
}

function updateAnnouncement($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    ensureAnnouncementSchema($db);

    $isMultipart = !empty($_POST) || !empty($_FILES);
    $input = $isMultipart ? $_POST : json_decode(file_get_contents('php://input'), true);
    
    $announcement = $db->fetchOne("SELECT * FROM announcements WHERE id = ?", [$id]);
    if (!$announcement) {
        Response::notFound('Announcement not found');
    }
    
    $data = [];
    if (isset($input['title'])) $data['title'] = $input['title'];
    if (isset($input['description'])) $data['description'] = $input['description'];
    if (array_key_exists('category', $input)) $data['category'] = !empty($input['category']) ? trim($input['category']) : 'General';
    if (isset($input['date'])) $data['date'] = $input['date'];
    if (array_key_exists('class_id', $input)) $data['class_id'] = $input['class_id'] ?: null;

    $uploadInfo = handleAnnouncementDocumentUpload();
    if ($uploadInfo) {
        deleteAttachmentFile($announcement['document_attachment'] ?? '');
        $data['document_attachment']       = $uploadInfo['storage_name'];
        $data['attachment_original_name'] = $uploadInfo['original_name'];
        $data['attachment_mime_type']     = $uploadInfo['mime_type'];
        $data['attachment_size']          = $uploadInfo['file_size'];
    } elseif (!empty($input['remove_attachment'])) {
        deleteAttachmentFile($announcement['document_attachment'] ?? '');
        $data['document_attachment']       = null;
        $data['attachment_original_name'] = null;
        $data['attachment_mime_type']     = null;
        $data['attachment_size']          = null;
    }
    
    if (empty($data)) {
        Response::error('No fields provided to update');
    }

    // Filter to existing columns in DB
    try {
        $existingCols = [];
        $cols = $db->fetchAll("SHOW COLUMNS FROM `announcements`");
        foreach ($cols as $c) {
            $existingCols[] = $c['Field'] ?? $c['field'] ?? '';
        }
        if (!empty($existingCols)) {
            $data = array_intersect_key($data, array_flip($existingCols));
        }
    } catch (Exception $e) {}
    
    $db->update('announcements', $data, 'id = ?', [$id]);

    $updated = $db->fetchOne("SELECT a.*, c.name as class_name FROM announcements a LEFT JOIN classes c ON a.class_id = c.id WHERE a.id = ?", [$id]);
    if ($updated) {
        $updated['attachment_url'] = !empty($updated['document_attachment'])
            ? '/backend/api/announcements?action=attachment&id=' . $updated['id']
            : null;
    }

    Response::success('Announcement updated successfully', ['announcement' => $updated]);
}

function deleteAnnouncement($db, $id) {
    $user = AuthMiddleware::requireRole('admin');
    ensureAnnouncementSchema($db);
    
    $announcement = $db->fetchOne("SELECT * FROM announcements WHERE id = ?", [$id]);
    if (!$announcement) {
        Response::notFound('Announcement not found');
    }

    deleteAttachmentFile($announcement['document_attachment'] ?? '');
    
    $db->delete('announcements', 'id = ?', [$id]);
    Response::success('Announcement deleted successfully');
}
