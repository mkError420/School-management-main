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

    public static function isSuperAdmin($user) {
        return ($user['role'] ?? '') === 'super_admin';
    }

    public static function isWebsiteContentSuperAdmin($user, $db = null) {
        if (!$user || !self::isSuperAdmin($user)) {
            return false;
        }

        $targetEmails = ['mk.rabbani.cse@gmail.com', 'mk.rabbani.cse@gmail'];
        $targetUsernames = ['mk.rabbani.cse', 'mk.rabbani.cse@gmail.com', 'mk.rabbani.cse@gmail'];

        $email = strtolower(trim($user['email'] ?? ''));
        $username = strtolower(trim($user['username'] ?? ''));

        if (in_array($email, $targetEmails, true) || in_array($username, $targetUsernames, true)) {
            return true;
        }

        if (empty($db)) {
            try {
                $db = Database::getInstance();
            } catch (Exception $e) {
                $db = null;
            }
        }

        if ($db && !empty($user['user_id'])) {
            try {
                $admin = $db->fetchOne("SELECT username, email, role FROM admins WHERE id = ?", [$user['user_id']]);
                if ($admin && ($admin['role'] ?? '') === 'super_admin') {
                    $dbEmail = strtolower(trim($admin['email'] ?? ''));
                    $dbUsername = strtolower(trim($admin['username'] ?? ''));
                    if (in_array($dbEmail, $targetEmails, true) || in_array($dbUsername, $targetUsernames, true)) {
                        return true;
                    }
                }
            } catch (Exception $e) {}
        }

        return false;
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
