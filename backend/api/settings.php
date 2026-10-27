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
        $rawPost = @file_get_contents('php://input');
        $inputData = json_decode($rawPost, true);
        if (empty($action) && is_array($inputData) && !empty($inputData['action'])) {
            $action = (string)$inputData['action'];
        }

        if (
            $action === 'submit-contact' ||
            $action === 'submit-feedback' ||
            $action === 'contact' ||
            (empty($action) && empty($_FILES) && is_array($inputData) && isset($inputData['name']) && isset($inputData['message']) && !isset($inputData['site_name']) && !isset($inputData['website_content']))
        ) {
            submitPublicContactForm($db, $inputData);
        } elseif ($action === 'upload-logo' || !empty($_FILES['logo'])) {
            uploadSiteLogo($db);
        } elseif ($action === 'upload-notice-file' || $action === 'upload-download-file' || $action === 'upload-book-file' || $action === 'upload-book-pdf' || $action === 'upload-file' || $action === 'upload-banner-image' || !empty($_FILES['file']) || !empty($_FILES['book']) || !empty($_FILES['notice_file']) || !empty($_FILES['banner']) || !empty($_FILES['image'])) {
            uploadNoticeFile($db);
        } else {
            updateSiteSettings($db);
        }
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
    try {
        $db->query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
    } catch (Exception $e) {}

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
                        // Ensure hero carousel fields are populated
                        if (empty($decoded['heroImages']) || !is_array($decoded['heroImages'])) {
                            $singleHero = !empty($decoded['heroImage']) ? $decoded['heroImage'] : '/images/bgimage.jpg';
                            $decoded['heroImages'] = [
                                $singleHero,
                                'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1400',
                                'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1400',
                                'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=1400',
                            ];
                        }
                        if (empty($decoded['heroOverlayOpacity'])) {
                            $decoded['heroOverlayOpacity'] = 'light';
                        }
                        if (empty($decoded['heroCarouselSpeed'])) {
                            $decoded['heroCarouselSpeed'] = 5000;
                        }
                        $settings['website_content'] = $decoded;
                    }
                } else {
                    $settings[$row['setting_key']] = $row['setting_value'];
                }
            }
        }
    }

    // Dynamic counts from software admin dashboard (students, teachers, staff, classes)
    $studentCount = 0;
    $teacherCount = 0;
    $staffCount = 0;
    $classCount = 0;
    try {
        $studentCount = (int)($db->fetchOne("SELECT COUNT(*) as total FROM students")['total'] ?? 0);
    } catch (Exception $e) {}
    try {
        $teacherCount = (int)($db->fetchOne("SELECT COUNT(*) as total FROM teachers")['total'] ?? 0);
    } catch (Exception $e) {}
    try {
        $staffCount = (int)($db->fetchOne("SELECT COUNT(*) as total FROM staff")['total'] ?? 0);
    } catch (Exception $e) {}
    if ($staffCount === 0) {
        try {
            $staffCount = (int)($db->fetchOne("SELECT COUNT(*) as total FROM admins")['total'] ?? 0);
        } catch (Exception $e) {}
    }
    try {
        $classCount = (int)($db->fetchOne("SELECT COUNT(*) as total FROM classes")['total'] ?? 0);
    } catch (Exception $e) {}

    $settings['live_counts'] = [
        'students' => $studentCount,
        'teachers' => $teacherCount,
        'staff' => $staffCount,
        'classes' => $classCount,
    ];

    Response::success('Site settings retrieved successfully', $settings);
}

function updateSiteSettings($db) {
    $user = AuthMiddleware::authenticate();
    if (!AuthMiddleware::isAdmin($user)) {
        Response::forbidden('Only an administrator can change site settings');
    }

    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?? [];
    ensureSiteSettingsTable($db);

    try {
        $db->query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
    } catch (Exception $e) {}

    $responsePayload = [];

    if (isset($input['site_name'])) {
        $siteName = trim((string)$input['site_name']);
        $length = function_exists('mb_strlen') ? mb_strlen($siteName) : strlen($siteName);
        if ($siteName === '' || $length > 150) {
            Response::error('Site name must be between 1 and 150 characters');
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

        // Sanitize quickLinks URLs safely without aborting save
        if (isset($websiteContent['quickLinks']) && is_array($websiteContent['quickLinks'])) {
            foreach ($websiteContent['quickLinks'] as &$link) {
                if (is_array($link)) {
                    $url = trim((string)($link['url'] ?? ''));
                    if ($url === '') {
                        $link['url'] = '#';
                    } elseif (!preg_match('~^(https?://|mailto:|tel:|/|#)~i', $url)) {
                        $link['url'] = 'https://' . $url;
                    }
                }
            }
            unset($link);
        }

        // Ensure hero carousel fields are properly validated and synchronized
        if (isset($websiteContent['heroImages']) && is_array($websiteContent['heroImages'])) {
            $filteredImages = [];
            foreach ($websiteContent['heroImages'] as $img) {
                if (is_string($img) && trim($img) !== '') {
                    $filteredImages[] = trim($img);
                }
            }
            if (!empty($filteredImages)) {
                $websiteContent['heroImages'] = $filteredImages;
                $websiteContent['heroImage'] = $filteredImages[0];
            }
        } elseif (!empty($websiteContent['heroImage']) && is_string($websiteContent['heroImage'])) {
            $websiteContent['heroImages'] = [trim($websiteContent['heroImage'])];
        }

        if (empty($websiteContent['heroOverlayOpacity']) || !in_array($websiteContent['heroOverlayOpacity'], ['light', 'medium', 'dark'])) {
            $websiteContent['heroOverlayOpacity'] = 'light';
        }

        if (empty($websiteContent['heroCarouselSpeed']) || !is_numeric($websiteContent['heroCarouselSpeed'])) {
            $websiteContent['heroCarouselSpeed'] = 5000;
        } else {
            $websiteContent['heroCarouselSpeed'] = (int)$websiteContent['heroCarouselSpeed'];
        }

        // Encode to UTF-8 JSON
        $encodedContent = json_encode($websiteContent, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($encodedContent === false) {
            Response::error('Website content contains invalid character encoding');
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

        // Automatically keep site_name in sync with schoolNameBn / schoolName
        $schoolName = trim((string)($websiteContent['schoolNameBn'] ?? $websiteContent['schoolName'] ?? ''));
        if ($schoolName !== '') {
            $db->query(
                "INSERT INTO site_settings (setting_key, setting_value)
                 VALUES ('site_name', ?)
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
                [$schoolName]
            );
            $responsePayload['site_name'] = $schoolName;
        }

        // Automatically keep site_logo in sync if provided
        if (!empty($websiteContent['siteLogo'])) {
            $siteLogo = trim((string)$websiteContent['siteLogo']);
            $db->query(
                "INSERT INTO site_settings (setting_key, setting_value)
                 VALUES ('site_logo', ?)
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
                [$siteLogo]
            );
            $responsePayload['site_logo'] = $siteLogo;
        }
    }

    if (empty($responsePayload)) {
        Response::error('No valid settings provided to update');
    }

    Response::success('Site settings updated successfully', $responsePayload);
}

function uploadSiteLogo($db) {
    $user = AuthMiddleware::authenticate();
    if (!AuthMiddleware::isAdmin($user)) {
        Response::forbidden('Only an administrator can upload a site logo');
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
    if (is_dir($root . '/dist/images')) {
        $targetDirs[] = $root . '/dist/images';
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

function uploadNoticeFile($db) {
    $user = AuthMiddleware::authenticate();
    if (!AuthMiddleware::isAdmin($user)) {
        Response::forbidden('Only an administrator can upload notice and website files');
    }

    $uploadKey = !empty($_FILES['file']) ? 'file' : (!empty($_FILES['book']) ? 'book' : (!empty($_FILES['notice_file']) ? 'notice_file' : (!empty($_FILES['banner']) ? 'banner' : (!empty($_FILES['image']) ? 'image' : null))));
    if (!$uploadKey || empty($_FILES[$uploadKey]) || $_FILES[$uploadKey]['error'] === UPLOAD_ERR_NO_FILE) {
        Response::error('Please choose an image or PDF file to upload');
    }

    $upload = $_FILES[$uploadKey];
    if ($upload['error'] !== UPLOAD_ERR_OK) {
        Response::error('File upload failed (code ' . $upload['error'] . ')');
    }

    if ($upload['size'] > 50 * 1024 * 1024) {
        Response::error('File must be 50 MB or smaller');
    }

    $allowedMimes = [
        'application/pdf' => 'pdf',
        'image/jpeg'      => 'jpg',
        'image/png'       => 'png',
        'image/webp'      => 'webp',
        'image/svg+xml'   => 'svg',
    ];

    $mimeType = '';
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
    if (!$mimeType && function_exists('mime_content_type')) {
        $mimeType = @mime_content_type($upload['tmp_name']);
    }

    $origName = $upload['name'] ?? 'file';
    $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));

    if ($ext === 'pdf' || strpos($mimeType, 'pdf') !== false) {
        $extension = 'pdf';
    } elseif ($ext === 'svg' || strpos($mimeType, 'svg') !== false) {
        $extension = 'svg';
    } elseif (isset($allowedMimes[$mimeType])) {
        $extension = $allowedMimes[$mimeType];
    } elseif (in_array($ext, ['png', 'jpg', 'jpeg', 'webp'])) {
        $extension = $ext === 'jpeg' ? 'jpg' : $ext;
    } else {
        Response::error('Please choose a valid PDF document or image (JPG, PNG, WebP, SVG)');
    }

    $action = $_GET['action'] ?? '';
    $isBannerUpload = ($uploadKey === 'banner' || $action === 'upload-banner-image');
    $isBookUpload = ($uploadKey === 'book' || $action === 'upload-book-file' || $action === 'upload-book-pdf');
    $subDir = $isBannerUpload ? 'banners' : ($isBookUpload ? 'books' : 'notices');
    $prefix = $isBannerUpload ? 'banner_' : ($isBookUpload ? 'book_' : 'notice_');

    $root = dirname(__DIR__, 2);
    $targetDirs = [];
    if (is_dir($root . '/public/uploads/' . $subDir)) {
        $targetDirs[] = $root . '/public/uploads/' . $subDir;
    } elseif (is_dir($root . '/public')) {
        @mkdir($root . '/public/uploads/' . $subDir, 0755, true);
        if (is_dir($root . '/public/uploads/' . $subDir)) {
            $targetDirs[] = $root . '/public/uploads/' . $subDir;
        }
    }

    if (is_dir($root . '/uploads/' . $subDir)) {
        $targetDirs[] = $root . '/uploads/' . $subDir;
    } else {
        @mkdir($root . '/uploads/' . $subDir, 0755, true);
        if (is_dir($root . '/uploads/' . $subDir)) {
            $targetDirs[] = $root . '/uploads/' . $subDir;
        }
    }

    if (is_dir($root . '/dist/uploads/' . $subDir)) {
        $targetDirs[] = $root . '/dist/uploads/' . $subDir;
    } elseif (is_dir($root . '/dist')) {
        @mkdir($root . '/dist/uploads/' . $subDir, 0755, true);
        if (is_dir($root . '/dist/uploads/' . $subDir)) {
            $targetDirs[] = $root . '/dist/uploads/' . $subDir;
        }
    }

    if (empty($targetDirs)) {
        $targetDirs[] = $root . '/uploads/' . $subDir;
        @mkdir($root . '/uploads/' . $subDir, 0755, true);
    }

    $cleanOrig = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', pathinfo($origName, PATHINFO_FILENAME));
    if (strlen($cleanOrig) > 30) {
        $cleanOrig = substr($cleanOrig, 0, 30);
    }
    $fileName = $prefix . time() . '_' . bin2hex(random_bytes(3)) . ($cleanOrig ? '_' . $cleanOrig : '') . '.' . $extension;
    $primaryDir = $targetDirs[0];
    $primaryPath = $primaryDir . '/' . $fileName;

    if (!move_uploaded_file($upload['tmp_name'], $primaryPath)) {
        Response::serverError('Unable to save the uploaded file');
    }

    for ($i = 1; $i < count($targetDirs); $i++) {
        @copy($primaryPath, $targetDirs[$i] . '/' . $fileName);
    }

    $fileUrl = '/uploads/' . $subDir . '/' . $fileName;

    Response::success('File uploaded successfully', [
        'file_url'      => $fileUrl,
        'original_name' => $origName,
        'extension'     => $extension,
        'size'          => $upload['size'],
    ]);
}

function submitPublicContactForm($db, $inputData = null) {
    ensureSiteSettingsTable($db);
    $input = is_array($inputData) ? $inputData : (json_decode(file_get_contents('php://input'), true) ?? $_POST);
    if (!is_array($input)) {
        $input = [];
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

    Response::success('আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে এবং সংরক্ষিত হয়েছে', [
        'submission' => $newSubmission,
        'total' => count($content['contactSubmissions']),
        'website_content' => $content,
    ]);
}


