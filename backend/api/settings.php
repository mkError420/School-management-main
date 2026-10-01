<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getSiteSettings($db);
        break;
    case 'PUT':
        updateSiteSettings($db);
        break;
    default:
        Response::methodNotAllowed();
}

function ensureSiteSettingsTable($db) {
    $db->query(
        "CREATE TABLE IF NOT EXISTS site_settings (
            setting_key VARCHAR(100) PRIMARY KEY,
            setting_value VARCHAR(255) NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )"
    );
    $db->query(
        "INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES ('site_name', 'ACADEMIA')"
    );
}

function getSiteSettings($db) {
    ensureSiteSettingsTable($db);
    $setting = $db->fetchOne(
        "SELECT setting_value FROM site_settings WHERE setting_key = 'site_name'"
    );
    Response::success('Site settings retrieved successfully', [
        'site_name' => $setting['setting_value'] ?? 'ACADEMIA',
    ]);
}

function updateSiteSettings($db) {
    $user = AuthMiddleware::authenticate();
    if (($user['role'] ?? '') !== 'super_admin') {
        Response::forbidden('Only a super admin can change the site name');
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $siteName = trim($input['site_name'] ?? '');
    $length = function_exists('mb_strlen') ? mb_strlen($siteName) : strlen($siteName);
    if ($siteName === '' || $length > 80) {
        Response::error('Site name must be between 1 and 80 characters');
    }

    ensureSiteSettingsTable($db);
    $db->query(
        "INSERT INTO site_settings (setting_key, setting_value)
         VALUES ('site_name', ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
        [$siteName]
    );

    Response::success('Site name updated successfully', ['site_name' => $siteName]);
}
