<?php

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'school_management');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Application Configuration
define('APP_NAME', 'School Management System');
define('APP_URL', 'http://localhost:3000');
define('API_VERSION', 'v1');

// Security Configuration
define('JWT_SECRET', 'your-secret-key-change-this-in-production');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRATION', 86400); // 24 hours in seconds

// CORS Configuration
define('CORS_ALLOWED_ORIGINS', ['*']);
define('CORS_ALLOWED_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
define('CORS_ALLOWED_HEADERS', ['Content-Type', 'Authorization']);

// Error Reporting (Set to false in production)
define('DEBUG_MODE', true);

if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}
