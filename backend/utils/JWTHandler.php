<?php

class JWTHandler {
    private static $secret = JWT_SECRET;
    private static $algorithm = JWT_ALGORITHM;
    private static $expiration = JWT_EXPIRATION;
    
    public static function encode($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => self::$algorithm]);
        $payload['iat'] = time();
        $payload['exp'] = time() + self::$expiration;
        
        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));
        
        $signature = self::generateSignature($base64UrlHeader, $base64UrlPayload);
        $base64UrlSignature = self::base64UrlEncode($signature);
        
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }
    
    public static function decode($token) {
        $tokenParts = explode('.', $token);
        
        if (count($tokenParts) !== 3) {
            return false;
        }
        
        list($header, $payload, $signature) = $tokenParts;
        
        $expectedSignature = self::generateSignature($header, $payload);
        
        if (!hash_equals(self::base64UrlDecode($signature), $expectedSignature)) {
            return false;
        }
        
        $decodedPayload = json_decode(self::base64UrlDecode($payload), true);
        
        // Check if token is expired
        if (isset($decodedPayload['exp']) && $decodedPayload['exp'] < time()) {
            return false;
        }
        
        return $decodedPayload;
    }
    
    private static function generateSignature($header, $payload) {
        $signatureInput = $header . "." . $payload;
        return hash_hmac('sha256', $signatureInput, self::$secret, true);
    }
    
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private static function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
    
    public static function getUserIdFromToken($token) {
        $decoded = self::decode($token);
        return $decoded ? $decoded['user_id'] : null;
    }
    
    public static function getUserRoleFromToken($token) {
        $decoded = self::decode($token);
        return $decoded ? $decoded['role'] : null;
    }
}
