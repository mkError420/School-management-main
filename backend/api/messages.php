<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? '';

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

function getMessages($db) {
    $user = AuthMiddleware::authenticate();
    $folder = $_GET['folder'] ?? 'inbox';
    $search = trim($_GET['search'] ?? '');

    if (!in_array($folder, ['inbox', 'sent'], true)) {
        Response::error('Invalid message folder');
    }
    if ($folder === 'sent' && $user['role'] !== 'admin') {
        Response::forbidden('Only administrators can view sent messages');
    }

    $where = $folder === 'sent'
        ? 'm.sender_id = ? AND m.sender_role = ?'
        : 'm.recipient_id = ? AND m.recipient_role = ?';
    $params = $folder === 'sent'
        ? [$user['user_id'], $user['role']]
        : [$user['user_id'], $user['role']];

    if ($search !== '') {
        $where .= ' AND (m.subject LIKE ? OR m.body LIKE ?)';
        $term = '%' . $search . '%';
        $params[] = $term;
        $params[] = $term;
    }

    $messages = $db->fetchAll(
        "SELECT m.*,
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
         LEFT JOIN admins ra ON m.recipient_role = 'admin' AND ra.id = m.recipient_id
         WHERE {$where}
         ORDER BY m.created_at DESC, m.id DESC
         LIMIT 200",
        $params
    );

    $unread = $db->fetchOne(
        "SELECT COUNT(*) as total FROM messages WHERE recipient_id = ? AND recipient_role = ? AND read_at IS NULL",
        [$user['user_id'], $user['role']]
    );

    Response::success('Messages retrieved successfully', [
        'messages' => $messages,
        'unread_count' => (int) ($unread['total'] ?? 0),
        'folder' => $folder
    ]);
}

function sendMessage($db) {
    $user = AuthMiddleware::requireRole('admin');
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $audience = $input['audience'] ?? '';
    $subject = trim($input['subject'] ?? '');
    $body = trim($input['body'] ?? '');

    if (!in_array($audience, ['teacher', 'parent', 'student'], true)) {
        Response::error('Choose teachers, parents, or students as the audience');
    }
    if ($subject === '' || $body === '') {
        Response::error('Subject and message are required');
    }
    $subjectLength = function_exists('mb_strlen') ? mb_strlen($subject) : strlen($subject);
    if ($subjectLength > 255) {
        Response::error('Subject must be 255 characters or fewer');
    }

    $tables = [
        'teacher' => 'teachers',
        'parent' => 'parents',
        'student' => 'students'
    ];
    $table = $tables[$audience];
    $recipientId = trim($input['recipient_id'] ?? '');

    if ($recipientId !== '') {
        $recipients = $db->fetchAll("SELECT id FROM {$table} WHERE id = ?", [$recipientId]);
    } else {
        $recipients = $db->fetchAll("SELECT id FROM {$table}");
    }

    if (!$recipients) {
        Response::error($recipientId !== '' ? 'Recipient not found' : 'There are no recipients in that group');
    }

    try {
        $db->beginTransaction();
        foreach ($recipients as $recipient) {
            $db->insert('messages', [
                'sender_id' => $user['user_id'],
                'sender_role' => 'admin',
                'recipient_id' => $recipient['id'],
                'recipient_role' => $audience,
                'subject' => $subject,
                'body' => $body
            ]);
        }
        $db->commit();
    } catch (Exception $e) {
        $db->rollback();
        error_log('Message delivery failed: ' . $e->getMessage());
        Response::serverError('Unable to send this message');
    }

    Response::success('Message sent successfully', ['recipient_count' => count($recipients)], 201);
}

function markMessageRead($db, $id) {
    $user = AuthMiddleware::authenticate();
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
    $db->query(
        'UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE recipient_id = ? AND recipient_role = ? AND read_at IS NULL',
        [$user['user_id'], $user['role']]
    );
    Response::success('All messages marked as read');
}