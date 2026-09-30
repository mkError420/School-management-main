<?php

class CorsMiddleware {
    public static function handle() {
        // Handle wildcard or specific origins
        if (in_array('*', CORS_ALLOWED_ORIGINS)) {
            header('Access-Control-Allow-Origin: *');
        } elseif (isset($_SERVER['HTTP_ORIGIN'])) {
            $origin = $_SERVER['HTTP_ORIGIN'];
            if (in_array($origin, CORS_ALLOWED_ORIGINS)) {
                header("Access-Control-Allow-Origin: $origin");
                header('Access-Control-Allow-Credentials: true');
            }
        }
        
        // Access-Control headers are received during OPTIONS requests
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            
            if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
                if (in_array($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'], CORS_ALLOWED_METHODS)) {
                    header('Access-Control-Allow-Methods: ' . implode(', ', CORS_ALLOWED_METHODS));
                }
            }
            
            if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
                header('Access-Control-Allow-Headers: ' . $_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']);
            }
            
            exit(0);
        }
        
        // Set additional security headers
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header('X-XSS-Protection: 1; mode=block');
    }
    
    public static function allowOrigin($origin) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Credentials: true');
    }
}
