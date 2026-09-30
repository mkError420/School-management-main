<?php

// Set headers
header('Content-Type: application/json');

// Load configuration
require_once __DIR__ . '/config/config.php';

// Load database connection
require_once __DIR__ . '/database/Database.php';

// Load utilities
require_once __DIR__ . '/utils/Response.php';
require_once __DIR__ . '/utils/JWTHandler.php';
require_once __DIR__ . '/utils/AuthMiddleware.php';
require_once __DIR__ . '/utils/CorsMiddleware.php';

// Handle CORS
CorsMiddleware::handle();

// Get the request method and URI
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove base path from URI
$basePath = '/backend';
$uri = str_replace($basePath, '', $uri);

// Remove leading/trailing slashes
$uri = trim($uri, '/');

// Split URI into segments
$segments = explode('/', $uri);

// Route the request
try {
    if (empty($uri) || $uri === 'api') {
        // API root
        Response::json([
            'message' => 'School Management System API',
            'version' => API_VERSION,
            'status' => 'running'
        ]);
    } elseif ($segments[0] === 'api' && isset($segments[1])) {
        $resource = $segments[1];
        $id = isset($segments[2]) ? $segments[2] : null;
        if ($id !== null && !isset($_GET['id'])) {
            $_GET['id'] = $id;
        }
        
        // Include the appropriate API file
        $apiFile = __DIR__ . "/api/{$resource}.php";
        
        if (file_exists($apiFile)) {
            require_once $apiFile;
        } else {
            Response::error('Resource not found', 404);
        }
    } else {
        Response::error('Invalid endpoint', 404);
    }
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}
