<?php

class AuthMiddleware {
    public static function authenticate() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (empty($authHeader)) {
            Response::unauthorized('Authorization header missing');
        }
        
        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            Response::unauthorized('Invalid authorization header format');
        }
        
        $token = $matches[1];
        $decoded = JWTHandler::decode($token);
        
        if (!$decoded) {
            Response::unauthorized('Invalid or expired token');
        }
        
        return $decoded;
    }
    
    public static function requireRole($requiredRole) {
        $user = self::authenticate();
        
        if ($user['role'] !== $requiredRole) {
            Response::forbidden('Insufficient permissions');
        }
        
        return $user;
    }
    
    public static function requireAnyRole($allowedRoles) {
        $user = self::authenticate();
        
        if (!in_array($user['role'], $allowedRoles)) {
            Response::forbidden('Insufficient permissions');
        }
        
        return $user;
    }
    
    public static function optionalAuth() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (empty($authHeader)) {
            return null;
        }
        
        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return null;
        }
        
        $token = $matches[1];
        return JWTHandler::decode($token);
    }
}
