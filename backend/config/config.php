<?php

// Database Configuration
define('DB_HOST', 'sql101.infinityfree.com');
define('DB_NAME', 'if0_42784359_myscmanagement');
define('DB_USER', 'if0_42784359');
define('DB_PASS', '4naAUPQvgRj3');
define('DB_CHARSET', 'utf8mb4');

// Application Configuration
define('APP_NAME', 'School Management System');
define('APP_URL', 'http://maneschool.site.je');
define('API_VERSION', 'v1');

// Security Configuration
define('JWT_SECRET', 'mk-school-secret-key-2024-secure-prod');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRATION', 86400); // 24 hours in seconds

// CORS Configuration
define('CORS_ALLOWED_ORIGINS', ['http://maneschool.site.je', 'https://maneschool.site.je']);
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
