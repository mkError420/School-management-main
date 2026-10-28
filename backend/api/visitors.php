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

    try {
        $db->query(
            "CREATE OR REPLACE VIEW view_visitor_statistics AS
             SELECT 
                (SELECT COUNT(*) FROM website_visitors WHERE visit_date = CURDATE()) AS today_visitors,
                (SELECT COUNT(*) FROM website_visitors) AS total_visitors,
                (SELECT COUNT(DISTINCT visitor_id) FROM website_visitors WHERE last_active >= NOW() - INTERVAL 15 MINUTE) AS online_visitors"
        );
    } catch (Exception $e) {}
}

function getVisitorStatsData($db) {
    ensureVisitorsTable($db);

    // 1. Calculate Today's Visitors directly from website_visitors table
    $todayCount = 0;
    try {
        $row = $db->fetchOne("SELECT COUNT(*) as cnt FROM website_visitors WHERE visit_date = CURDATE()");
        $todayCount = (int)($row['cnt'] ?? 0);
    } catch (Exception $e) {}

    // 2. Calculate Total Visitors directly from website_visitors table
    $totalCount = 0;
    try {
        $row = $db->fetchOne("SELECT COUNT(*) as cnt FROM website_visitors");
        $totalCount = (int)($row['cnt'] ?? 0);
    } catch (Exception $e) {}

    // 3. Calculate Online Visitors active within the last 15 minutes
    $onlineCount = 0;
    try {
        $row = $db->fetchOne("SELECT COUNT(DISTINCT visitor_id) as cnt FROM website_visitors WHERE last_active >= NOW() - INTERVAL 15 MINUTE");
        $onlineCount = (int)($row['cnt'] ?? 0);
    } catch (Exception $e) {}

    if ($onlineCount < 1) {
        $onlineCount = 1;
    }
    if ($todayCount < 1) {
        $todayCount = 1;
    }
    if ($totalCount < $todayCount) {
        $totalCount = $todayCount;
    }

    return [
        'today' => $todayCount,
        'total' => $totalCount,
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
