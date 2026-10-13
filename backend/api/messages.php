<?php

$db = Database::getInstance();

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? '';
$conversationId = $_GET['conversation_id'] ?? null;

if ($method === 'GET' && $action === 'attachment') {
    downloadMessageAttachment($db, $id);
}

if ($method === 'GET' && $action === 'recipients') {
    getMessageRecipients($db);
}

switch ($method) {
    case 'GET':
        getMessages($db);
        break;
    case 'POST':
        if ($action === 'read-all') {
            markAllMessagesRead($db);
        } else {
            sendMessage($db);
        }
        break;
    case 'PUT':
        if (!$id) {
            Response::error('Message ID is required');
        }
        markMessageRead($db, $id);
        break;
    case 'DELETE':
        if (!empty($conversationId)) {
            deleteConversation($db, $conversationId);
        } else {
            deleteMessage($db, $id);
        }
        break;
    default:
        Response::methodNotAllowed();
}

function ensureMessageSchema($db) {
    $columns = $db->fetchAll("SHOW COLUMNS FROM messages LIKE 'conversation_id'");
    if (!$columns) {
        try {
            $db->query('ALTER TABLE messages ADD COLUMN conversation_id VARCHAR(64) NULL AFTER id');
            $db->query('ALTER TABLE messages ADD INDEX idx_messages_conversation (conversation_id, created_at)');
        } catch (Exception $e) {
            $columns = $db->fetchAll("SHOW COLUMNS FROM messages LIKE 'conversation_id'");
            if (!$columns) {
                throw $e;
            }
        }
    }
    $db->query("UPDATE messages SET conversation_id = CONCAT('legacy-', id) WHERE conversation_id IS NULL OR conversation_id = ''");

    try {
        $db->query("ALTER TABLE messages MODIFY COLUMN sender_role ENUM('admin', 'super_admin', 'teacher', 'student', 'parent') NOT NULL");
        $db->query("ALTER TABLE messages MODIFY COLUMN recipient_role ENUM('admin', 'super_admin', 'teacher', 'student', 'parent') NOT NULL");
    } catch (Exception $e) {
        // ENUM modified or compatible
    }

    $db->query(
        "CREATE TABLE IF NOT EXISTS message_attachments (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            message_id BIGINT NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            storage_name VARCHAR(255) NOT NULL,
            mime_type VARCHAR(127) NOT NULL,
            file_size INT UNSIGNED NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_message_attachments_message (message_id),
            FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
        )"
    );
}

function messageSelectSql() {
    return "SELECT m.*,
                   COALESCE(NULLIF(CONCAT_WS(' ', st.name, st.surname), ''),
                            NULLIF(CONCAT_WS(' ', sp.name, sp.surname), ''),
                            NULLIF(CONCAT_WS(' ', sr.name, sr.surname), ''),
                            sa.username, m.sender_role) as sender_name,
                   COALESCE(NULLIF(CONCAT_WS(' ', rt.name, rt.surname), ''),
                            NULLIF(CONCAT_WS(' ', rp.name, rp.surname), ''),
                            NULLIF(CONCAT_WS(' ', rs.name, rs.surname), ''),
                            ra.username, m.recipient_role) as recipient_name
            FROM messages m
            LEFT JOIN teachers st ON m.sender_role = 'teacher' AND st.id = m.sender_id
            LEFT JOIN parents sp ON m.sender_role = 'parent' AND sp.id = m.sender_id
            LEFT JOIN students sr ON m.sender_role = 'student' AND sr.id = m.sender_id
            LEFT JOIN admins sa ON (m.sender_role IN ('admin', 'super_admin')) AND sa.id = m.sender_id
            LEFT JOIN teachers rt ON m.recipient_role = 'teacher' AND rt.id = m.recipient_id
            LEFT JOIN parents rp ON m.recipient_role = 'parent' AND rp.id = m.recipient_id
            LEFT JOIN students rs ON m.recipient_role = 'student' AND rs.id = m.recipient_id
            LEFT JOIN admins ra ON (m.recipient_role IN ('admin', 'super_admin')) AND ra.id = m.recipient_id";
}

function addMessageAttachments($db, &$messages) {
    if (!$messages) {
        return;
    }
    $ids = array_values(array_unique(array_map('intval', array_column($messages, 'id'))));
    if (!$ids) {
        return;
    }
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $attachments = $db->fetchAll(
        "SELECT id, message_id, original_name, mime_type, file_size, created_at
         FROM message_attachments WHERE message_id IN ({$placeholders}) ORDER BY id",
        $ids
    );
    $byMessage = [];
    foreach ($attachments as $attachment) {
        $byMessage[$attachment['message_id']][] = $attachment;
    }
    foreach ($messages as &$message) {
        $message['attachments'] = $byMessage[$message['id']] ?? [];
    }
    unset($message);
}

function unreadMessageCount($db, $user) {
    $unread = $db->fetchOne(
        'SELECT COUNT(*) as total FROM messages WHERE recipient_id = ? AND read_at IS NULL',
        [$user['user_id']]
    );
    return (int) ($unread['total'] ?? 0);
}

function getMessageRecipients($db) {
    $user = AuthMiddleware::authenticate();
    $targetRole = $_GET['role'] ?? 'all';
    
    $recipients = [];
    
    // 1. Admins & Super Admins
    if (in_array($targetRole, ['all', 'admin', 'super_admin'], true)) {
        $admins = $db->fetchAll("SELECT id, username, email, role FROM admins ORDER BY username ASC");
        foreach ($admins as $adm) {
            $recipients[] = [
                'id' => $adm['id'],
                'name' => $adm['username'],
                'surname' => '',
                'username' => $adm['username'],
                'email' => $adm['email'] ?? '',
                'role' => $adm['role'] ?? 'admin'
            ];
        }
    }
    
    // 2. Teachers
    if (in_array($targetRole, ['all', 'teacher'], true)) {
        $teachers = $db->fetchAll("SELECT id, name, surname, username, email, 'teacher' as role FROM teachers ORDER BY name ASC, surname ASC");
        foreach ($teachers as $tch) {
            $recipients[] = $tch;
        }
    }
    
    // 3. Parents
    if (in_array($targetRole, ['all', 'parent'], true)) {
        $parents = $db->fetchAll("SELECT id, name, surname, username, email, 'parent' as role FROM parents ORDER BY name ASC, surname ASC");
        foreach ($parents as $par) {
            $recipients[] = $par;
        }
    }
    
    // 4. Students
    if (in_array($targetRole, ['all', 'student'], true)) {
        $students = $db->fetchAll("SELECT s.id, s.name, s.surname, s.username, s.email, 'student' as role, c.name as class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id ORDER BY s.name ASC, s.surname ASC");
        foreach ($students as $std) {
            $recipients[] = $std;
        }
    }
    
    // Filter out current user from recipients list
    $filtered = array_values(array_filter($recipients, function($r) use ($user) {
        return (string)$r['id'] !== (string)$user['user_id'];
    }));
    
    Response::success('Recipients loaded successfully', [
        'recipients' => $filtered
    ]);
}

function getMessages($db) {
    $user = AuthMiddleware::authenticate();
    ensureMessageSchema($db);

    $conversationId = trim($_GET['conversation_id'] ?? '');
    if ($conversationId !== '') {
        getConversation($db, $user, $conversationId);
        return;
    }

    $folder = $_GET['folder'] ?? 'inbox';
    $search = trim($_GET['search'] ?? '');
    if (!in_array($folder, ['inbox', 'sent'], true)) {
        Response::error('Invalid message folder');
    }

    if ($folder === 'sent') {
        $where = 'm.sender_id = ?';
    } else {
        $where = 'm.recipient_id = ?';
    }
    $params = [$user['user_id']];

    if ($search !== '') {
        $where .= ' AND (m.subject LIKE ? OR m.body LIKE ?)';
        $term = '%' . $search . '%';
        $params[] = $term;
        $params[] = $term;
    }

    $messages = $db->fetchAll(
        messageSelectSql() . " WHERE {$where} ORDER BY m.created_at DESC, m.id DESC LIMIT 200",
        $params
    );
    addMessageAttachments($db, $messages);

    Response::success('Messages retrieved successfully', [
        'messages' => $messages,
        'unread_count' => unreadMessageCount($db, $user),
        'folder' => $folder
    ]);
}

function getConversation($db, $user, $conversationId) {
    $participant = $db->fetchOne(
        'SELECT id FROM messages WHERE conversation_id = ? AND (sender_id = ? OR recipient_id = ?) LIMIT 1',
        [$conversationId, $user['user_id'], $user['user_id']]
    );
    if (!$participant && !AuthMiddleware::isAdmin($user)) {
        Response::notFound('Conversation not found');
    }

    // Mark messages as read for this recipient
    $db->query(
        'UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE conversation_id = ? AND recipient_id = ? AND read_at IS NULL',
        [$conversationId, $user['user_id']]
    );

    $messages = $db->fetchAll(
        messageSelectSql() . ' WHERE m.conversation_id = ? ORDER BY m.created_at ASC, m.id ASC',
        [$conversationId]
    );
    addMessageAttachments($db, $messages);

    Response::success('Conversation retrieved successfully', [
        'messages' => $messages,
        'unread_count' => unreadMessageCount($db, $user),
        'conversation_id' => $conversationId
    ]);
    exit;
}

function parseMessageInput() {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== false) {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }
    return $_POST;
}

function collectMessageUploads() {
    if (empty($_FILES['attachments'])) {
        return [];
    }

    $upload = $_FILES['attachments'];
    $allowed = [
        'pdf' => ['application/pdf'],
        'doc' => ['application/msword', 'application/x-ole-storage'],
        'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'],
        'xls' => ['application/vnd.ms-excel', 'application/x-ole-storage'],
        'xlsx' => ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip'],
        'ppt' => ['application/vnd.ms-powerpoint', 'application/x-ole-storage'],
        'pptx' => ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip'],
        'txt' => ['text/plain'],
        'png' => ['image/png'],
        'jpg' => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'webp' => ['image/webp'],
        'gif' => ['image/gif'],
    ];

    $names = is_array($upload['name']) ? $upload['name'] : [$upload['name']];
    $temporaryNames = is_array($upload['tmp_name']) ? $upload['tmp_name'] : [$upload['tmp_name']];
    $sizes = is_array($upload['size']) ? $upload['size'] : [$upload['size']];
    $errors = is_array($upload['error']) ? $upload['error'] : [$upload['error']];
    if (count($names) > 5) {
        Response::error('Attach up to five files per message');
    }

    $files = [];
    foreach ($names as $index => $originalName) {
        if ($errors[$index] === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        if ($errors[$index] !== UPLOAD_ERR_OK || $sizes[$index] > 10 * 1024 * 1024) {
            Response::error('Each attachment must be no larger than 10 MB');
        }
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        if (!isset($allowed[$extension])) {
            Response::error('Allowed attachments: PDF, Word, Excel, PowerPoint, TXT, PNG, JPG, WebP, and GIF');
        }

        $mimeType = 'application/octet-stream';
        if (function_exists('finfo_open')) {
            $fileInfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($fileInfo) {
                $detectedMime = finfo_file($fileInfo, $temporaryNames[$index]);
                finfo_close($fileInfo);
                if ($detectedMime) {
                    $mimeType = $detectedMime;
                }
            }
        }
        if ($mimeType !== 'application/octet-stream' && !in_array($mimeType, $allowed[$extension], true)) {
            Response::error('An attachment file type does not match its extension');
        }

        $safeName = basename(str_replace('\\', '/', $originalName));
        $safeName = preg_replace('/[\x00-\x1F\x7F]/u', '', $safeName);
        $files[] = [
            'temporary_name' => $temporaryNames[$index],
            'original_name' => substr($safeName, 0, 255),
            'mime_type' => $mimeType,
            'file_size' => (int) $sizes[$index],
        ];
    }
    return $files;
}

function sendMessage($db) {
    $user = AuthMiddleware::authenticate();
    ensureMessageSchema($db);
    $input = parseMessageInput();
    $conversationId = trim($input['conversation_id'] ?? '');
    $subject = trim($input['subject'] ?? '');
    $body = trim($input['body'] ?? '');
    if ($body === '') {
        Response::error('Message text is required');
    }
    if ($subject !== '') {
        $subjectLength = function_exists('mb_strlen') ? mb_strlen($subject) : strlen($subject);
        if ($subjectLength > 255) {
            Response::error('Subject must be 255 characters or fewer');
        }
    }

    $uploads = collectMessageUploads();
    $recipients = [];
    $isReply = $conversationId !== '';

    $senderRole = in_array($user['role'], ['admin', 'super_admin'], true) ? 'admin' : $user['role'];

    if ($isReply) {
        $original = $db->fetchOne(
            'SELECT * FROM messages WHERE conversation_id = ? AND (sender_id = ? OR recipient_id = ?) ORDER BY id ASC LIMIT 1',
            [$conversationId, $user['user_id'], $user['user_id']]
        );
        if (!$original) {
            Response::notFound('Conversation not found');
        }

        if ((string)$original['sender_id'] === (string)$user['user_id']) {
            $counterpartId = $original['recipient_id'];
            $counterpartRole = $original['recipient_role'];
        } else {
            $counterpartId = $original['sender_id'];
            $counterpartRole = $original['sender_role'];
        }

        if ($subject === '') {
            $subject = $original['subject'] ?: 'Re: Message';
        }
        $recipients[] = ['id' => $counterpartId, 'role' => $counterpartRole];
    } else {
        $audience = $input['audience'] ?? '';
        if (!in_array($audience, ['admin', 'super_admin', 'teacher', 'parent', 'student'], true)) {
            Response::error('Choose admin, teacher, parent, or student as the audience');
        }
        if ($subject === '') {
            Response::error('Subject is required');
        }

        $tables = [
            'admin' => 'admins',
            'super_admin' => 'admins',
            'teacher' => 'teachers',
            'parent' => 'parents',
            'student' => 'students'
        ];
        $table = $tables[$audience];
        $recipientId = trim($input['recipient_id'] ?? '');

        if ($recipientId !== '') {
            $row = $db->fetchOne("SELECT id FROM {$table} WHERE id = ?", [$recipientId]);
            if (!$row) {
                Response::error('Recipient not found');
            }
            $targetRole = in_array($audience, ['admin', 'super_admin'], true) ? 'admin' : $audience;
            $recipients[] = ['id' => $row['id'], 'role' => $targetRole];
        } else {
            // If empty recipient_id: broadcast (allowed for admin or sending to administration)
            if (!AuthMiddleware::isAdmin($user) && !in_array($audience, ['admin', 'super_admin'], true)) {
                Response::error('Please choose a specific recipient');
            }
            $rows = $db->fetchAll("SELECT id FROM {$table}");
            $targetRole = in_array($audience, ['admin', 'super_admin'], true) ? 'admin' : $audience;
            foreach ($rows as $r) {
                if ((string)$r['id'] === (string)$user['user_id']) continue;
                $recipients[] = ['id' => $r['id'], 'role' => $targetRole];
            }
        }
    }

    if (!$recipients) {
        Response::error('There are no recipients for this message');
    }

    $storageDirectory = __DIR__ . '/../storage/message-attachments';
    if ($uploads && !is_dir($storageDirectory) && !mkdir($storageDirectory, 0750, true) && !is_dir($storageDirectory)) {
        Response::serverError('Unable to prepare secure attachment storage');
    }

    $storedPaths = [];
    try {
        $db->beginTransaction();
        $finalConversationId = $isReply ? $conversationId : bin2hex(random_bytes(16));

        foreach ($recipients as $recipient) {
            $messageId = $db->insert('messages', [
                'conversation_id' => $finalConversationId,
                'sender_id' => $user['user_id'],
                'sender_role' => $senderRole,
                'recipient_id' => $recipient['id'],
                'recipient_role' => $recipient['role'],
                'subject' => $subject,
                'body' => $body
            ]);

            foreach ($uploads as $upload) {
                $extension = strtolower(pathinfo($upload['original_name'], PATHINFO_EXTENSION));
                $storageName = bin2hex(random_bytes(24)) . '.' . $extension;
                $destination = $storageDirectory . '/' . $storageName;
                if (!copy($upload['temporary_name'], $destination)) {
                    throw new RuntimeException('Unable to store an attachment');
                }
                $storedPaths[] = $destination;
                $db->insert('message_attachments', [
                    'message_id' => $messageId,
                    'original_name' => $upload['original_name'],
                    'storage_name' => $storageName,
                    'mime_type' => $upload['mime_type'],
                    'file_size' => $upload['file_size']
                ]);
            }
        }
        $db->commit();
    } catch (Exception $e) {
        $db->rollback();
        foreach ($storedPaths as $path) {
            if (is_file($path)) {
                @unlink($path);
            }
        }
        error_log('Message delivery failed: ' . $e->getMessage());
        Response::serverError('Unable to send this message');
    }

    Response::success($isReply ? 'Reply sent successfully' : 'Message sent successfully', [
        'recipient_count' => count($recipients),
        'conversation_id' => $finalConversationId
    ], 201);
}

function downloadMessageAttachment($db, $attachmentId) {
    $user = AuthMiddleware::authenticate();
    ensureMessageSchema($db);
    if (!$attachmentId) {
        Response::error('Attachment ID is required');
    }
    $attachment = $db->fetchOne(
        "SELECT a.*, m.sender_id, m.sender_role, m.recipient_id, m.recipient_role
         FROM message_attachments a
         INNER JOIN messages m ON a.message_id = m.id
         WHERE a.id = ?",
        [$attachmentId]
    );
    if (!$attachment) {
        Response::notFound('Attachment not found');
    }

    $isAuthorized = AuthMiddleware::isAdmin($user) ||
        ((string)$attachment['sender_id'] === (string)$user['user_id']) ||
        ((string)$attachment['recipient_id'] === (string)$user['user_id']);

    if (!$isAuthorized) {
        Response::forbidden('Access denied to this attachment');
    }

    $path = __DIR__ . '/../storage/message-attachments/' . basename($attachment['storage_name']);
    if (!is_file($path)) {
        Response::notFound('Attachment file is unavailable');
    }
    $fileName = str_replace(["\r", "\n", '"'], '', $attachment['original_name']);
    while (ob_get_level()) {
        ob_end_clean();
    }
    header_remove('Content-Type');
    header('Content-Type: ' . $attachment['mime_type']);
    header('Content-Length: ' . filesize($path));
    header("Content-Disposition: attachment; filename*=UTF-8''" . rawurlencode($fileName));
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: private, max-age=3600');
    readfile($path);
    exit;
}

function deleteConversation($db, $conversationId) {
    $user = AuthMiddleware::authenticate();
    ensureMessageSchema($db);

    if (empty($conversationId)) {
        Response::error('Conversation ID is required');
    }

    // Allow deleting if user is participant in this conversation OR is admin/super_admin
    $isAuthorized = AuthMiddleware::isAdmin($user);
    if (!$isAuthorized) {
        $participant = $db->fetchOne(
            'SELECT id FROM messages WHERE conversation_id = ? AND (sender_id = ? OR recipient_id = ?) LIMIT 1',
            [$conversationId, $user['user_id'], $user['user_id']]
        );
        if ($participant) {
            $isAuthorized = true;
        }
    }

    if (!$isAuthorized) {
        Response::forbidden('You do not have permission to delete this conversation');
    }

    $messages = $db->fetchAll('SELECT id FROM messages WHERE conversation_id = ?', [$conversationId]);
    if (empty($messages)) {
        Response::notFound('Conversation not found');
    }

    $messageIds = array_column($messages, 'id');
    $placeholders = implode(',', array_fill(0, count($messageIds), '?'));

    $attachments = $db->fetchAll("SELECT storage_name FROM message_attachments WHERE message_id IN ({$placeholders})", $messageIds);

    try {
        $db->beginTransaction();
        $db->query("DELETE FROM message_attachments WHERE message_id IN ({$placeholders})", $messageIds);
        $db->query("DELETE FROM messages WHERE conversation_id = ?", [$conversationId]);
        $db->commit();
    } catch (Exception $e) {
        $db->rollback();
        error_log('Conversation deletion failed: ' . $e->getMessage());
        Response::serverError('Unable to delete this conversation');
    }

    foreach ($attachments as $attachment) {
        $path = __DIR__ . '/../storage/message-attachments/' . basename($attachment['storage_name']);
        if (is_file($path)) {
            @unlink($path);
        }
    }

    Response::success('Conversation deleted successfully');
}

function deleteMessage($db, $id) {
    $user = AuthMiddleware::authenticate();
    ensureMessageSchema($db);

    if (!$id) {
        Response::error('Message ID is required');
    }

    $message = $db->fetchOne('SELECT * FROM messages WHERE id = ?', [$id]);
    if (!$message) {
        Response::notFound('Message not found');
    }

    $isAuthorized = AuthMiddleware::isAdmin($user) ||
        ((string)$message['sender_id'] === (string)$user['user_id']) ||
        ((string)$message['recipient_id'] === (string)$user['user_id']);

    if (!$isAuthorized) {
        Response::forbidden('You do not have permission to delete this message');
    }

    $attachments = $db->fetchAll(
        'SELECT storage_name FROM message_attachments WHERE message_id = ?',
        [$id]
    );

    try {
        $db->beginTransaction();
        $db->delete('message_attachments', 'message_id = ?', [$id]);
        $db->delete('messages', 'id = ?', [$id]);
        $db->commit();
    } catch (Exception $e) {
        $db->rollback();
        error_log('Message deletion failed: ' . $e->getMessage());
        Response::serverError('Unable to delete this message');
    }

    foreach ($attachments as $attachment) {
        $path = __DIR__ . '/../storage/message-attachments/' . basename($attachment['storage_name']);
        if (is_file($path)) {
            @unlink($path);
        }
    }

    Response::success('Message deleted successfully');
}

function markMessageRead($db, $id) {
    $user = AuthMiddleware::authenticate();
    ensureMessageSchema($db);
    $message = $db->fetchOne(
        'SELECT id FROM messages WHERE id = ? AND recipient_id = ?',
        [$id, $user['user_id']]
    );
    if (!$message) {
        Response::notFound('Message not found');
    }
    $db->query(
        'UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND recipient_id = ? AND read_at IS NULL',
        [$id, $user['user_id']]
    );
    Response::success('Message marked as read');
}

function markAllMessagesRead($db) {
    $user = AuthMiddleware::authenticate();
    ensureMessageSchema($db);
    $db->query(
        'UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE recipient_id = ? AND read_at IS NULL',
        [$user['user_id']]
    );
    Response::success('All messages marked as read');
}