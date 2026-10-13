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

    // Soft-delete columns: each party can remove their own copy without affecting the other
    try {
        $db->query("ALTER TABLE messages ADD COLUMN deleted_by_sender TINYINT(1) NOT NULL DEFAULT 0");
    } catch (Exception $e) { /* column already exists */ }
    try {
        $db->query("ALTER TABLE messages ADD COLUMN deleted_by_recipient TINYINT(1) NOT NULL DEFAULT 0");
    } catch (Exception $e) { /* column already exists */ }

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

function messageSelectSql($userId = null) {
    // Base SELECT — UTC suffix on created_at so browsers parse timezone correctly
    $select = "SELECT m.*,
                   DATE_FORMAT(CONVERT_TZ(m.created_at, @@session.time_zone, '+00:00'), '%Y-%m-%dT%H:%i:%sZ') AS created_at,
                   COALESCE(NULLIF(CONCAT_WS(' ', st.name, st.surname), ''),
                            NULLIF(CONCAT_WS(' ', sp.name, sp.surname), ''),
                            NULLIF(CONCAT_WS(' ', sr.name, sr.surname), ''),
                            sa.username, m.sender_role) as sender_name,
                   COALESCE(NULLIF(CONCAT_WS(' ', rt.name, rt.surname), ''),
                            NULLIF(CONCAT_WS(' ', rp.name, rp.surname), ''),
                            NULLIF(CONCAT_WS(' ', rs.name, rs.surname), ''),
                            ra.username, m.recipient_role) as recipient_name,
                   COALESCE(st.img, sp.img, sr.img) as sender_img,
                   COALESCE(rt.img, rp.img, rs.img) as recipient_img
            FROM messages m
            LEFT JOIN teachers st ON m.sender_role = 'teacher' AND st.id = m.sender_id
            LEFT JOIN parents sp ON m.sender_role = 'parent' AND sp.id = m.sender_id
            LEFT JOIN students sr ON m.sender_role = 'student' AND sr.id = m.sender_id
            LEFT JOIN admins sa ON (m.sender_role IN ('admin', 'super_admin')) AND sa.id = m.sender_id
            LEFT JOIN teachers rt ON m.recipient_role = 'teacher' AND rt.id = m.recipient_id
            LEFT JOIN parents rp ON m.recipient_role = 'parent' AND rp.id = m.recipient_id
            LEFT JOIN students rs ON m.recipient_role = 'student' AND rs.id = m.recipient_id
            LEFT JOIN admins ra ON (m.recipient_role IN ('admin', 'super_admin')) AND ra.id = m.recipient_id";
    return $select;
}

/** Filter clause to hide soft-deleted rows for a specific user */
function messageVisibilityWhere($userId) {
    // A message is visible to the sender unless they soft-deleted it
    // A message is visible to the recipient unless they soft-deleted it
    $uid = $userId; // used inline via sprintf
    return "(
        (m.sender_id = '{$uid}'    AND m.deleted_by_sender    = 0) OR
        (m.recipient_id = '{$uid}' AND m.deleted_by_recipient = 0)
    )";
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
        $admins = $db->fetchAll("SELECT id, username, email, role, NULL as img FROM admins ORDER BY username ASC");
        foreach ($admins as $adm) {
            $recipients[] = [
                'id' => $adm['id'],
                'name' => $adm['username'],
                'surname' => '',
                'username' => $adm['username'],
                'email' => $adm['email'] ?? '',
                'role' => $adm['role'] ?? 'admin',
                'img' => null
            ];
        }
    }
    
    // 2. Teachers
    if (in_array($targetRole, ['all', 'teacher'], true)) {
        $teachers = $db->fetchAll("SELECT id, name, surname, username, email, 'teacher' as role, img FROM teachers ORDER BY name ASC, surname ASC");
        foreach ($teachers as $tch) {
            $recipients[] = $tch;
        }
    }
    
    // 3. Parents
    if (in_array($targetRole, ['all', 'parent'], true)) {
        $parents = $db->fetchAll("SELECT id, name, surname, username, email, 'parent' as role, img FROM parents ORDER BY name ASC, surname ASC");
        foreach ($parents as $par) {
            $recipients[] = $par;
        }
    }
    
    // 4. Students
    if (in_array($targetRole, ['all', 'student'], true)) {
        $students = $db->fetchAll("SELECT s.id, s.name, s.surname, s.username, s.email, 'student' as role, c.name as class_name, s.img FROM students s LEFT JOIN classes c ON s.class_id = c.id ORDER BY s.name ASC, s.surname ASC");
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
        // For SENT folder: group by conversation_id and return one representative message per conversation.
        // This prevents broadcast messages (sent to all teachers/students/parents) from creating hundreds of rows.
        $where = 'm.sender_id = ?';
        $params = [$user['user_id']];

        if ($search !== '') {
            $where .= ' AND (m.subject LIKE ? OR m.body LIKE ?)';
            $term = '%' . $search . '%';
            $params[] = $term;
            $params[] = $term;
        }

        // Fetch all sent messages, grouped by conversation_id; pick the representative (first sent in each conversation by current user)
        // Exclude messages the sender has soft-deleted from their sent view
        $rawMessages = $db->fetchAll(
            messageSelectSql() . " WHERE {$where} AND m.deleted_by_sender = 0 ORDER BY m.created_at DESC, m.id DESC LIMIT 500",
            $params
        );

        // Deduplicate: one row per conversation_id (keep the most recent as representative)
        $seenConversations = [];
        $messages = [];
        foreach ($rawMessages as $msg) {
            $convId = $msg['conversation_id'];
            if (!isset($seenConversations[$convId])) {
                $seenConversations[$convId] = true;
                $msg['is_broadcast'] = false;
                $msg['broadcast_recipients'] = [];
                $msg['recipient_count'] = 1;
                $messages[] = $msg;
            } else {
                // Mark representative as broadcast and increment recipient_count
                foreach ($messages as &$existing) {
                    if ($existing['conversation_id'] === $convId) {
                        $existing['is_broadcast'] = true;
                        $existing['recipient_count'] = ($existing['recipient_count'] ?? 1) + 1;
                        // Collect up to 5 recipient previews for avatar stack
                        if (count($existing['broadcast_recipients']) < 5) {
                            $existing['broadcast_recipients'][] = [
                                'id' => $msg['recipient_id'],
                                'name' => $msg['recipient_name'],
                                'role' => $msg['recipient_role'],
                                'img' => $msg['recipient_img'] ?? null
                            ];
                        }
                        break;
                    }
                }
                unset($existing);
            }
        }

        // Also add the first recipient into broadcast_recipients for all broadcast messages
        foreach ($messages as &$msg) {
            if ($msg['is_broadcast'] && !empty($msg['broadcast_recipients'])) {
                // Prepend the representative message's recipient at front
                array_unshift($msg['broadcast_recipients'], [
                    'id' => $msg['recipient_id'],
                    'name' => $msg['recipient_name'],
                    'role' => $msg['recipient_role'],
                    'img' => $msg['recipient_img'] ?? null
                ]);
                $msg['broadcast_recipients'] = array_slice($msg['broadcast_recipients'], 0, 5);
            }
        }
        unset($msg);

        addMessageAttachments($db, $messages);

        Response::success('Messages retrieved successfully', [
            'messages' => array_values($messages),
            'unread_count' => unreadMessageCount($db, $user),
            'folder' => $folder
        ]);
        return;
    }

    // INBOX folder: only show messages not soft-deleted by the recipient
    $where = 'm.recipient_id = ? AND m.deleted_by_recipient = 0';
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

    // Only show messages not soft-deleted for this user, using safe inline filter
    $uid = str_replace("'", "''", $user['user_id']); // minimal SQL-safe escaping for inline use
    $visibility = "(
        (m.sender_id = '{$uid}'    AND m.deleted_by_sender    = 0) OR
        (m.recipient_id = '{$uid}' AND m.deleted_by_recipient = 0)
    )";
    $messages = $db->fetchAll(
        messageSelectSql() . " WHERE m.conversation_id = ? AND {$visibility} ORDER BY m.created_at ASC, m.id ASC",
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

    // Confirm user is a participant
    $participant = $db->fetchOne(
        'SELECT id FROM messages WHERE conversation_id = ? AND (sender_id = ? OR recipient_id = ?) LIMIT 1',
        [$conversationId, $user['user_id'], $user['user_id']]
    );
    if (!$participant) {
        Response::forbidden('You are not a participant in this conversation');
    }

    // Soft-delete: mark the caller's copies as deleted (does NOT affect the other party's view)
    // Messages where user is the SENDER -> set deleted_by_sender = 1
    $db->query(
        'UPDATE messages SET deleted_by_sender = 1 WHERE conversation_id = ? AND sender_id = ?',
        [$conversationId, $user['user_id']]
    );
    // Messages where user is the RECIPIENT -> set deleted_by_recipient = 1
    $db->query(
        'UPDATE messages SET deleted_by_recipient = 1 WHERE conversation_id = ? AND recipient_id = ?',
        [$conversationId, $user['user_id']]
    );

    // Physically purge any message rows where BOTH sides have soft-deleted
    $bothDeleted = $db->fetchAll(
        'SELECT id FROM messages WHERE conversation_id = ? AND deleted_by_sender = 1 AND deleted_by_recipient = 1',
        [$conversationId]
    );
    if ($bothDeleted) {
        $ids = array_column($bothDeleted, 'id');
        $ph  = implode(',', array_fill(0, count($ids), '?'));

        $attachments = $db->fetchAll("SELECT storage_name FROM message_attachments WHERE message_id IN ({$ph})", $ids);
        try {
            $db->beginTransaction();
            $db->query("DELETE FROM message_attachments WHERE message_id IN ({$ph})", $ids);
            $db->query("DELETE FROM messages WHERE id IN ({$ph})", $ids);
            $db->commit();
        } catch (Exception $e) {
            $db->rollback();
            error_log('Conversation purge failed: ' . $e->getMessage());
        }
        foreach ($attachments as $att) {
            $path = __DIR__ . '/../storage/message-attachments/' . basename($att['storage_name']);
            if (is_file($path)) { @unlink($path); }
        }
    }

    Response::success('Conversation removed from your view');
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

    // Only the SENDER of a message may delete it.
    // Recipients cannot delete someone else's sent message from the thread.
    $isSender    = (string)$message['sender_id']    === (string)$user['user_id'];
    $isRecipient = (string)$message['recipient_id'] === (string)$user['user_id'];
    $isAdmin     = AuthMiddleware::isAdmin($user);

    if (!$isSender && !$isAdmin) {
        Response::forbidden('You can only delete messages you have sent');
    }

    // Soft-delete: mark deleted_by_sender; if recipient also deleted → hard delete
    if ($isSender) {
        if ($message['deleted_by_recipient']) {
            // Both sides done — hard delete
            $attachments = $db->fetchAll('SELECT storage_name FROM message_attachments WHERE message_id = ?', [$id]);
            $db->beginTransaction();
            $db->delete('message_attachments', 'message_id = ?', [$id]);
            $db->delete('messages', 'id = ?', [$id]);
            $db->commit();
            foreach ($attachments as $att) {
                $path = __DIR__ . '/../storage/message-attachments/' . basename($att['storage_name']);
                if (is_file($path)) { @unlink($path); }
            }
        } else {
            $db->query('UPDATE messages SET deleted_by_sender = 1 WHERE id = ?', [$id]);
        }
    } elseif ($isAdmin) {
        // Admin hard-deletes directly
        $attachments = $db->fetchAll('SELECT storage_name FROM message_attachments WHERE message_id = ?', [$id]);
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
        foreach ($attachments as $att) {
            $path = __DIR__ . '/../storage/message-attachments/' . basename($att['storage_name']);
            if (is_file($path)) { @unlink($path); }
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