<?php

$db = Database::getInstance();

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? '';

if ($method === 'GET' && $action === 'attachment') {
    downloadMessageAttachment($db, $id);
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
            LEFT JOIN admins sa ON m.sender_role = 'admin' AND sa.id = m.sender_id
            LEFT JOIN teachers rt ON m.recipient_role = 'teacher' AND rt.id = m.recipient_id
            LEFT JOIN parents rp ON m.recipient_role = 'parent' AND rp.id = m.recipient_id
            LEFT JOIN students rs ON m.recipient_role = 'student' AND rs.id = m.recipient_id
            LEFT JOIN admins ra ON m.recipient_role = 'admin' AND ra.id = m.recipient_id";
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
        'SELECT COUNT(*) as total FROM messages WHERE recipient_id = ? AND recipient_role = ? AND read_at IS NULL',
        [$user['user_id'], $user['role']]
    );
    return (int) ($unread['total'] ?? 0);
}

function getMessages($db) {
    $user = AuthMiddleware::authenticate();
    if (AuthMiddleware::isAdmin($user)) $user['role'] = 'admin';
    ensureMessageSchema($db);
    $conversationId = trim($_GET['conversation_id'] ?? '');
    if ($conversationId !== '') {
        getConversation($db, $user, $conversationId);
    }

    $folder = $_GET['folder'] ?? 'inbox';
    $search = trim($_GET['search'] ?? '');
    if (!in_array($folder, ['inbox', 'sent'], true)) {
        Response::error('Invalid message folder');
    }
    if ($folder === 'sent' && !AuthMiddleware::isAdmin($user)) {
        Response::forbidden('Only administrators can view sent messages');
    }

    $where = $folder === 'sent'
        ? 'm.sender_id = ? AND m.sender_role = ?'
        : 'm.recipient_id = ? AND m.recipient_role = ?';
    $params = [$user['user_id'], $user['role']];
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
        'SELECT id FROM messages WHERE conversation_id = ? AND ((sender_id = ? AND sender_role = ?) OR (recipient_id = ? AND recipient_role = ?)) LIMIT 1',
        [$conversationId, $user['user_id'], $user['role'], $user['user_id'], $user['role']]
    );
    if (!$participant) {
        Response::notFound('Conversation not found');
    }

    $db->query(
        'UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE conversation_id = ? AND recipient_id = ? AND recipient_role = ? AND read_at IS NULL',
        [$conversationId, $user['user_id'], $user['role']]
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
            Response::error('Allowed attachments: PDF, Word, Excel, PowerPoint, TXT, PNG, and JPG');
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
    if (AuthMiddleware::isAdmin($user)) $user['role'] = 'admin';
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
    if ($isReply) {
        $original = $db->fetchOne(
            'SELECT * FROM messages WHERE conversation_id = ? AND ((sender_id = ? AND sender_role = ?) OR (recipient_id = ? AND recipient_role = ?)) ORDER BY id ASC LIMIT 1',
            [$conversationId, $user['user_id'], $user['role'], $user['user_id'], $user['role']]
        );
        if (!$original) {
            Response::notFound('Conversation not found');
        }

        if ($original['sender_id'] === $user['user_id'] && $original['sender_role'] === $user['role']) {
            $counterpartId = $original['recipient_id'];
            $counterpartRole = $original['recipient_role'];
        } else {
            $counterpartId = $original['sender_id'];
            $counterpartRole = $original['sender_role'];
        }
        if (!AuthMiddleware::isAdmin($user) && $counterpartRole !== 'admin') {
            Response::forbidden('Replies are only available in administrator conversations');
        }
        if ($subject === '') {
            $subject = $original['subject'];
        }
        $recipients[] = ['id' => $counterpartId, 'role' => $counterpartRole];
    } else {
        if (!AuthMiddleware::isAdmin($user)) {
            Response::forbidden('Start conversations by replying to an administrator message');
        }
        $audience = $input['audience'] ?? '';
        if (!in_array($audience, ['teacher', 'parent', 'student'], true)) {
            Response::error('Choose teachers, parents, or students as the audience');
        }
        if ($subject === '') {
            Response::error('Subject is required');
        }
        $tables = ['teacher' => 'teachers', 'parent' => 'parents', 'student' => 'students'];
        $table = $tables[$audience];
        $recipientId = trim($input['recipient_id'] ?? '');
        $recipientRows = $recipientId !== ''
            ? $db->fetchAll("SELECT id FROM {$table} WHERE id = ?", [$recipientId])
            : $db->fetchAll("SELECT id FROM {$table}");
        foreach ($recipientRows as $recipient) {
            $recipients[] = ['id' => $recipient['id'], 'role' => $audience];
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
        foreach ($recipients as $recipient) {
            $messageConversationId = $isReply ? $conversationId : bin2hex(random_bytes(16));
            $messageId = $db->insert('messages', [
                'conversation_id' => $messageConversationId,
                'sender_id' => $user['user_id'],
                'sender_role' => $user['role'],
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
                unlink($path);
            }
        }
        error_log('Message delivery failed: ' . $e->getMessage());
        Response::serverError('Unable to send this message');
    }

    Response::success($isReply ? 'Reply sent successfully' : 'Message sent successfully', [
        'recipient_count' => count($recipients),
        'conversation_id' => $isReply ? $conversationId : null
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
    if (!$attachment || !(($attachment['sender_id'] === $user['user_id'] && $attachment['sender_role'] === $user['role']) ||
        ($attachment['recipient_id'] === $user['user_id'] && $attachment['recipient_role'] === $user['role']))) {
        Response::notFound('Attachment not found');
    }

    $path = __DIR__ . '/../storage/message-attachments/' . basename($attachment['storage_name']);
    if (!is_file($path)) {
        Response::notFound('Attachment file is unavailable');
    }
    $fileName = str_replace(["\r", "\n", '"'], '', $attachment['original_name']);
    header_remove('Content-Type');
    header('Content-Type: ' . $attachment['mime_type']);
    header('Content-Length: ' . filesize($path));
    header("Content-Disposition: attachment; filename*=UTF-8''" . rawurlencode($fileName));
    header('X-Content-Type-Options: nosniff');
    readfile($path);
    exit;
}

function markMessageRead($db, $id) {
    $user = AuthMiddleware::authenticate();
    ensureMessageSchema($db);
    $message = $db->fetchOne(
        'SELECT id FROM messages WHERE id = ? AND recipient_id = ? AND recipient_role = ?',
        [$id, $user['user_id'], $user['role']]
    );
    if (!$message) {
        Response::notFound('Message not found');
    }
    $db->query(
        'UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND recipient_id = ? AND recipient_role = ? AND read_at IS NULL',
        [$id, $user['user_id'], $user['role']]
    );
    Response::success('Message marked as read');
}

function markAllMessagesRead($db) {
    $user = AuthMiddleware::authenticate();
    ensureMessageSchema($db);
    $db->query(
        'UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE recipient_id = ? AND recipient_role = ? AND read_at IS NULL',
        [$user['user_id'], $user['role']]
    );
    Response::success('All messages marked as read');
}