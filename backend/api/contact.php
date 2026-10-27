<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        submitContactForm($db);
        break;
    case 'GET':
        getContactSubmissions($db);
        break;
    default:
        Response::methodNotAllowed();
}

function ensureSiteSettingsTable($db) {
    try {
        $db->query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
    } catch (Exception $e) {}

    $db->query(
        "CREATE TABLE IF NOT EXISTS site_settings (
            setting_key VARCHAR(100) PRIMARY KEY,
            setting_value LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function submitContactForm($db) {
    ensureSiteSettingsTable($db);
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    if (!is_array($input) || empty($input)) {
        $input = $_POST;
    }

    $name = trim((string)($input['name'] ?? ''));
    $phone = trim((string)($input['phone'] ?? ''));
    $email = trim((string)($input['email'] ?? ''));
    $subject = trim((string)($input['subject'] ?? ''));
    $message = trim((string)($input['message'] ?? ''));

    if (empty($name) || empty($phone) || empty($message)) {
        Response::error('নাম, মোবাইল নম্বর এবং বার্তা পূরণ করা আবশ্যক');
    }

    if (empty($subject)) {
        $subject = 'অনলাইন মতামত ও অনুসন্ধান';
    }

    try {
        $db->query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
    } catch (Exception $e) {}

    $row = $db->fetchOne("SELECT setting_value FROM site_settings WHERE setting_key = 'website_content'");
    $content = [];
    if (!empty($row['setting_value'])) {
        $content = json_decode($row['setting_value'], true);
        if (!is_array($content)) {
            $content = [];
        }
    }

    if (!isset($content['contactSubmissions']) || !is_array($content['contactSubmissions'])) {
        $content['contactSubmissions'] = [];
    }

    $newSubmission = [
        'id' => 'msg_' . time() . '_' . substr(bin2hex(random_bytes(4)), 0, 6),
        'name' => $name,
        'phone' => $phone,
        'email' => $email,
        'subject' => $subject,
        'message' => $message,
        'createdAt' => date('c'),
        'status' => 'unread',
    ];

    // Prepend so newest is first
    array_unshift($content['contactSubmissions'], $newSubmission);

    // Limit to latest 300 inquiries
    if (count($content['contactSubmissions']) > 300) {
        $content['contactSubmissions'] = array_slice($content['contactSubmissions'], 0, 300);
    }

    $encoded = json_encode($content, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $db->query(
        "INSERT INTO site_settings (setting_key, setting_value)
         VALUES ('website_content', ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
        [$encoded]
    );

    Response::success('আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে এবং অ্যাডমিন ড্যাশবোর্ডে সংরক্ষিত হয়েছে', [
        'submission' => $newSubmission,
        'total' => count($content['contactSubmissions']),
        'website_content' => $content,
    ]);
}

function getContactSubmissions($db) {
    ensureSiteSettingsTable($db);
    try {
        $db->query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
    } catch (Exception $e) {}

    $row = $db->fetchOne("SELECT setting_value FROM site_settings WHERE setting_key = 'website_content'");
    $submissions = [];
    if (!empty($row['setting_value'])) {
        $content = json_decode($row['setting_value'], true);
        if (is_array($content) && !empty($content['contactSubmissions']) && is_array($content['contactSubmissions'])) {
            $submissions = $content['contactSubmissions'];
        }
    }

    Response::success('Contact submissions retrieved successfully', [
        'submissions' => $submissions,
        'total' => count($submissions),
    ]);
}
