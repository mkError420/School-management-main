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
    case 'POST':
        $action = $_GET['action'] ?? '';
        if ($action === 'upload-logo' || !empty($_FILES['logo'])) {
            uploadSiteLogo($db);
        } else {
            updateSiteSettings($db);
        }
        break;
    default:
        Response::methodNotAllowed();
}

function isCorruptedSettingsValue($val) {
    if (is_string($val)) {
        $trimmed = trim($val);
        $qMarks = substr_count($trimmed, '?');
        if ($qMarks >= 2) {
            $cleaned = preg_replace('/[\s\d.,\-·–\/\\:;!@#$%^&*()_+={}\[\]|`~\'"]/u', '', $trimmed);
            if (strlen($cleaned) === 0 || ($qMarks / (strlen($cleaned) ?: 1)) >= 0.4) {
                return true;
            }
        }
    }
    return false;
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
    try {
        $db->query("ALTER TABLE site_settings CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $db->query("ALTER TABLE site_settings MODIFY setting_value LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL");
    } catch (Exception $e) {
        // Table already modified or syntax variation
    }

    $db->query(
        "INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES ('site_name', 'ACADEMIA')"
    );
    $db->query(
        "INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES ('site_logo', '/images/logo.png')"
    );
}

function getSiteSettings($db) {
    ensureSiteSettingsTable($db);
    $rows = $db->fetchAll(
        "SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('site_name', 'site_logo', 'website_content')"
    );

    $settings = [
        'site_name' => 'ACADEMIA',
        'site_logo' => '/images/logo.png',
        'website_content' => null,
    ];

    if (is_array($rows)) {
        foreach ($rows as $row) {
            if (isset($row['setting_key']) && isset($row['setting_value'])) {
                if ($row['setting_key'] === 'website_content') {
                    $decoded = json_decode($row['setting_value'], true);
                    if (is_array($decoded)) {
                        // Check if data was corrupted by legacy latin1 encoding
                        $schoolNameBn = $decoded['schoolNameBn'] ?? '';
                        $heroTitle = $decoded['heroTitle'] ?? '';
                        if (isCorruptedSettingsValue($schoolNameBn) || isCorruptedSettingsValue($heroTitle)) {
                            // Reset corrupted content so default Bengali template loads cleanly
                            $settings['website_content'] = null;
                            try {
                                $db->query("DELETE FROM site_settings WHERE setting_key = 'website_content'");
                            } catch (Exception $e) {}
                        } else {
                            $settings['website_content'] = $decoded;
                        }
                    }
                } else {
                    $settings[$row['setting_key']] = $row['setting_value'];
                }
            }
        }
    }

    Response::success('Site settings retrieved successfully', $settings);
}

function updateSiteSettings($db) {
    $user = AuthMiddleware::authenticate();
    if (($user['role'] ?? '') !== 'super_admin') {
        Response::forbidden('Only a super admin can change site settings');
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    ensureSiteSettingsTable($db);

    $responsePayload = [];

    if (isset($input['site_name'])) {
        $siteName = trim((string)$input['site_name']);
        $length = function_exists('mb_strlen') ? mb_strlen($siteName) : strlen($siteName);
        if ($siteName === '' || $length > 80) {
            Response::error('Site name must be between 1 and 80 characters');
        }

        $db->query(
            "INSERT INTO site_settings (setting_key, setting_value)
             VALUES ('site_name', ?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
            [$siteName]
        );
        $responsePayload['site_name'] = $siteName;
    }

    if (isset($input['site_logo'])) {
        $siteLogo = trim((string)$input['site_logo']);
        if ($siteLogo === '') {
            $siteLogo = '/images/logo.png';
        }

        $db->query(
            "INSERT INTO site_settings (setting_key, setting_value)
             VALUES ('site_logo', ?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
            [$siteLogo]
        );
        $responsePayload['site_logo'] = $siteLogo;
    }

    if (isset($input['website_content'])) {
        $websiteContent = $input['website_content'];
        if (!is_array($websiteContent)) {
            Response::error('Website content must be an object');
        }
        $notices = $websiteContent['notices'] ?? [];
        $quickLinks = $websiteContent['quickLinks'] ?? [];
        if (!is_array($notices) || !is_array($quickLinks)) {
            Response::error('Notices and quick links must be lists');
        }
        if (count($notices) > 100 || count($quickLinks) > 50) {
            Response::error('Website content has too many notices or quick links');
        }
        foreach ($quickLinks as $link) {
            if (!is_array($link)) {
                Response::error('Each quick link must include a label and URL');
            }
            $url = trim((string)($link['url'] ?? ''));
            $isLocal = substr($url, 0, 1) === '/' && substr($url, 0, 2) !== '//';
            $isAnchor = substr($url, 0, 1) === '#';
            $scheme = strtolower((string)parse_url($url, PHP_URL_SCHEME));
            if (!$url || (!$isLocal && !$isAnchor && !in_array($scheme, ['http', 'https', 'mailto'], true))) {
                Response::error('Quick links must use a safe website URL');
            }
        }
        $encodedContent = json_encode($websiteContent, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($encodedContent === false || strlen($encodedContent) > 1000000) {
            Response::error('Website content must be valid JSON smaller than 1 MB');
        }

        try {
            $db->query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
        } catch (Exception $e) {}

        $db->query(
            "INSERT INTO site_settings (setting_key, setting_value)
             VALUES ('website_content', ?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
            [$encodedContent]
        );
        $responsePayload['website_content'] = $websiteContent;
    }

    if (empty($responsePayload)) {
        Response::error('No valid settings provided to update');
    }

    Response::success('Site settings updated successfully', $responsePayload);
}

function uploadSiteLogo($db) {
    $user = AuthMiddleware::authenticate();
    if (($user['role'] ?? '') !== 'super_admin') {
        Response::forbidden('Only a super admin can upload a site logo');
    }

    if (empty($_FILES['logo']) || $_FILES['logo']['error'] === UPLOAD_ERR_NO_FILE) {
        Response::error('Please choose a logo file to upload');
    }

    $upload = $_FILES['logo'];
    if ($upload['error'] !== UPLOAD_ERR_OK) {
        Response::error('Logo upload failed (code ' . $upload['error'] . ')');
    }

    if ($upload['size'] > 5 * 1024 * 1024) {
        Response::error('Logo file must be 5 MB or smaller');
    }

    $allowedMimes = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
        'image/svg+xml' => 'svg',
    ];

    $imageInfo = @getimagesize($upload['tmp_name']);
    $mimeType = $imageInfo['mime'] ?? '';

    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo) {
            $detected = finfo_file($finfo, $upload['tmp_name']);
            if ($detected) {
                $mimeType = $detected;
            }
            finfo_close($finfo);
        }
    }

    $ext = strtolower(pathinfo($upload['name'] ?? '', PATHINFO_EXTENSION));
    if ($ext === 'svg' || strpos($mimeType, 'svg') !== false) {
        $extension = 'svg';
    } elseif (isset($allowedMimes[$mimeType])) {
        $extension = $allowedMimes[$mimeType];
    } elseif (in_array($ext, ['png', 'jpg', 'jpeg', 'webp'])) {
        $extension = $ext === 'jpeg' ? 'jpg' : $ext;
    } else {
        Response::error('Please choose a valid PNG, JPG, WebP, or SVG image');
    }

    $root = dirname(__DIR__, 2);
    $targetDirs = [];
    if (is_dir($root . '/public/images')) {
        $targetDirs[] = $root . '/public/images';
    }
    if (is_dir($root . '/images')) {
        $targetDirs[] = $root . '/images';
    }
    if (empty($targetDirs)) {
        $targetDirs[] = $root . '/public/images';
        @mkdir($root . '/public/images', 0755, true);
    }

    $fileName = 'site_logo_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $extension;
    $primaryDir = $targetDirs[0];
    $primaryPath = $primaryDir . '/' . $fileName;

    if (!move_uploaded_file($upload['tmp_name'], $primaryPath)) {
        Response::serverError('Unable to save the uploaded logo file');
    }

    // Mirror to secondary directory if both exist (e.g. dev workspace and public folder)
    for ($i = 1; $i < count($targetDirs); $i++) {
        @copy($primaryPath, $targetDirs[$i] . '/' . $fileName);
    }

    $logoUrl = '/images/' . $fileName;

    ensureSiteSettingsTable($db);
    $db->query(
        "INSERT INTO site_settings (setting_key, setting_value)
         VALUES ('site_logo', ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
        [$logoUrl]
    );

    Response::success('Site logo uploaded and updated successfully', [
        'site_logo' => $logoUrl,
    ]);
}
