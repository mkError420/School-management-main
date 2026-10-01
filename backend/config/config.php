<?php

// Database Configuration: set these values in cPanel or as server environment variables.
$localConfigPath = __DIR__ . '/config.local.php';
$localConfig = is_file($localConfigPath) ? require $localConfigPath : [];
define('DB_HOST', getenv('DB_HOST') ?: ($localConfig['DB_HOST'] ?? 'localhost'));
define('DB_NAME', getenv('DB_NAME') ?: ($localConfig['DB_NAME'] ?? 'YOUR_DATABASE_NAME'));
define('DB_USER', getenv('DB_USER') ?: ($localConfig['DB_USER'] ?? 'YOUR_DATABASE_USER'));
define('DB_PASS', getenv('DB_PASS') ?: ($localConfig['DB_PASS'] ?? 'CHANGE_THIS_DATABASE_PASSWORD'));
define('DB_CHARSET', 'utf8mb4');

// Application Configuration
define('APP_NAME', 'School Management System');
define('APP_URL', rtrim(getenv('APP_URL') ?: '', '/'));
define('API_VERSION', 'v1');

// Security Configuration
define('JWT_SECRET', getenv('JWT_SECRET') ?: ($localConfig['JWT_SECRET'] ?? 'CHANGE_THIS_TO_A_LONG_RANDOM_SECRET'));
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
