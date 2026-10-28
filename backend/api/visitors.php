<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getVisitorStats($db);
        break;
    case 'POST':
        recordVisitorVisit($db);
        break;
    case 'PUT':
        updateVisitorBaseline($db);
        break;
    default:
        Response::methodNotAllowed();
}

function ensureVisitorsTable($db) {
    try {
        $db->query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
    } catch (Exception $e) {}

    $db->query(
        "CREATE TABLE IF NOT EXISTS website_visitors (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            visit_date DATE NOT NULL,
            visitor_id VARCHAR(64) NOT NULL,
            ip_address VARCHAR(45) NULL,
            user_agent VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_date_visitor (visit_date, visitor_id),
            INDEX idx_visit_date (visit_date),
            INDEX idx_last_active (last_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    // Ensure site_settings exists for persistent baseline counts
    $db->query(
        "CREATE TABLE IF NOT EXISTS site_settings (
            setting_key VARCHAR(100) PRIMARY KEY,
            setting_value LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $db->query("INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES ('visitor_baseline_total', '84120')");
    $db->query("INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES ('visitor_baseline_today', '452')");
    $db->query("INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES ('visitor_baseline_date', CURDATE())");
}

function getVisitorStatsData($db) {
    ensureVisitorsTable($db);

    $todayDate = date('Y-m-d');

    $baseTotal = 84120;
    $baseToday = 452;
    $baseDate = $todayDate;

    try {
        $rows = $db->fetchAll(
            "SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('visitor_baseline_total', 'visitor_baseline_today', 'visitor_baseline_date')"
        );
        if (is_array($rows)) {
            foreach ($rows as $r) {
                if ($r['setting_key'] === 'visitor_baseline_total') $baseTotal = (int)$r['setting_value'];
                if ($r['setting_key'] === 'visitor_baseline_today') $baseToday = (int)$r['setting_value'];
                if ($r['setting_key'] === 'visitor_baseline_date') $baseDate = (string)$r['setting_value'];
            }
        }
    } catch (Exception $e) {}

    $todayCount = 0;
    try {
        $row = $db->fetchOne("SELECT COUNT(*) as cnt FROM website_visitors WHERE visit_date = CURDATE()");
        $todayCount = (int)($row['cnt'] ?? 0);
    } catch (Exception $e) {}

    $totalRecorded = 0;
    try {
        $row = $db->fetchOne("SELECT COUNT(*) as cnt FROM website_visitors");
        $totalRecorded = (int)($row['cnt'] ?? 0);
    } catch (Exception $e) {}

    $onlineCount = 1;
    try {
        $row = $db->fetchOne("SELECT COUNT(DISTINCT visitor_id) as cnt FROM website_visitors WHERE last_active >= NOW() - INTERVAL 15 MINUTE");
        $onlineCount = max(1, (int)($row['cnt'] ?? 1));
    } catch (Exception $e) {}

    $effectiveToday = ($baseDate === $todayDate) ? ($baseToday + $todayCount) : $todayCount;
    $effectiveTotal = $baseTotal + $totalRecorded;

    return [
        'today' => $effectiveToday,
        'total' => $effectiveTotal,
        'online' => $onlineCount,
    ];
}

function getVisitorStats($db) {
    $stats = getVisitorStatsData($db);
    Response::success('Visitor statistics retrieved', $stats);
}

function recordVisitorVisit($db) {
    ensureVisitorsTable($db);

    $raw = @file_get_contents('php://input');
    $input = json_decode($raw, true);
    if (!is_array($input)) {
        $input = $_POST;
    }

    $visitorId = trim((string)($input['visitor_id'] ?? ''));
    if (empty($visitorId) || strlen($visitorId) < 5 || strlen($visitorId) > 64) {
        $clientIp = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $ipParts = explode(',', $clientIp);
        $cleanIp = trim($ipParts[0]);
        $visitorId = 'v_' . substr(hash('sha256', $cleanIp . ($_SERVER['HTTP_USER_AGENT'] ?? '')), 0, 32);
    }

    $clientIp = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $ipParts = explode(',', $clientIp);
    $cleanIp = substr(trim($ipParts[0]), 0, 45);
    $userAgent = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255);

    try {
        $db->query(
            "INSERT INTO website_visitors (visit_date, visitor_id, ip_address, user_agent, created_at, last_active)
             VALUES (CURDATE(), ?, ?, ?, NOW(), NOW())
             ON DUPLICATE KEY UPDATE last_active = NOW()",
            [$visitorId, $cleanIp, $userAgent]
        );
    } catch (Exception $e) {
        // Continue even if logging fails
    }

    $stats = getVisitorStatsData($db);
    $stats['visitor_id'] = $visitorId;

    Response::success('Visitor recorded successfully', $stats);
}

function updateVisitorBaseline($db) {
    $user = AuthMiddleware::authenticate();
    if (!AuthMiddleware::isAdmin($user)) {
        Response::forbidden('Only an administrator can update visitor statistics');
    }

    ensureVisitorsTable($db);

    $raw = @file_get_contents('php://input');
    $input = json_decode($raw, true);
    if (!is_array($input)) {
        Response::error('Invalid input data');
    }

    if (isset($input['baseline_total'])) {
        $val = (int)$input['baseline_total'];
        $db->query("REPLACE INTO site_settings (setting_key, setting_value) VALUES ('visitor_baseline_total', ?)", [(string)$val]);
    }
    if (isset($input['baseline_today'])) {
        $val = (int)$input['baseline_today'];
        $db->query("REPLACE INTO site_settings (setting_key, setting_value) VALUES ('visitor_baseline_today', ?)", [(string)$val]);
        $db->query("REPLACE INTO site_settings (setting_key, setting_value) VALUES ('visitor_baseline_date', CURDATE())");
    }

    $stats = getVisitorStatsData($db);
    Response::success('Visitor baseline updated successfully', $stats);
}

