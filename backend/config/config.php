<?php

// Database Configuration: set these values in cPanel or as server environment variables.
$localConfigPath = __DIR__ . '/config.local.php';
$localConfig = is_file($localConfigPath) ? require $localConfigPath : [];
define('DB_HOST', getenv('DB_HOST') ?: ($localConfig['DB_HOST'] ?? 'localhost'));
define('DB_NAME', getenv('DB_NAME') ?: ($localConfig['DB_NAME'] ?? 'jkivlrjg_mkschool'));
define('DB_USER', getenv('DB_USER') ?: ($localConfig['DB_USER'] ?? 'jkivlrjg_mkschool'));
define('DB_PASS', getenv('DB_PASS') ?: ($localConfig['DB_PASS'] ?? 'SftBrDgWFwBHRe9ZPapm'));
define('DB_CHARSET', 'utf8mb4');

// Application Configuration
define('APP_NAME', 'School Management System');
define('APP_URL', rtrim(getenv('APP_URL') ?: '', '/'));
define('API_VERSION', 'v1');

// Security Configuration
define('JWT_SECRET', getenv('JWT_SECRET') ?: ($localConfig['JWT_SECRET'] ?? '4624040f44e0c30a023ba3ac74e888202fa01edebebd54b3a674d2045a4272cb'));
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRATION', 86400); // 24 hours in seconds

// CORS Configuration
$corsOrigins = getenv('CORS_ALLOWED_ORIGINS') ?: '';
define('CORS_ALLOWED_ORIGINS', array_values(array_filter(array_map('trim', explode(',', $corsOrigins)))));
define('CORS_ALLOWED_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
define('CORS_ALLOWED_HEADERS', ['Content-Type', 'Authorization']);

// Error Reporting (Set to false in production)
define('DEBUG_MODE', false);

if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}
