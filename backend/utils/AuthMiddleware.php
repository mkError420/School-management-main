<?php

class AuthMiddleware {
    public static function authenticate() {
        $token = null;
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (empty($authHeader) && function_exists('getallheaders')) {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        }
        
        if (!empty($authHeader)) {
            if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                Response::unauthorized('Invalid authorization header format');
            }
            $token = $matches[1];
        } elseif (!empty($_GET['token'])) {
            $token = $_GET['token'];
        } else {
            Response::unauthorized('Authorization header missing');
        }
        
        $decoded = JWTHandler::decode($token);
        
        if (!$decoded) {
            Response::unauthorized('Invalid or expired token');
        }
        
        return $decoded;
    }
    
    public static function requireRole($requiredRole) {
        $user = self::authenticate();
        
        if ($user['role'] !== $requiredRole && !($requiredRole === 'admin' && self::isAdmin($user))) {
            Response::forbidden('Insufficient permissions');
        }
        
        return $user;
    }
    
    public static function requireAnyRole($allowedRoles) {
        $user = self::authenticate();
        
        if (!in_array($user['role'], $allowedRoles) && !(self::isAdmin($user) && in_array('admin', $allowedRoles, true))) {
            Response::forbidden('Insufficient permissions');
        }
        
        return $user;
    }

    public static function isAdmin($user) {
        return in_array($user['role'] ?? '', ['admin', 'super_admin'], true);
    }
    
    public static function optionalAuth() {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? ($headers['Authorization'] ?? $headers['authorization'] ?? '');
        
        $token = null;
        if (!empty($authHeader) && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = $matches[1];
        } elseif (!empty($_GET['token'])) {
            $token = $_GET['token'];
        }
        
        if (!$token) {
            return null;
        }
        
        return JWTHandler::decode($token);
    }
}
