<?php

class Response {
    public static function json($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
    
    public static function success($message, $data = null, $statusCode = 200) {
        // If caller passed array/object as first argument and second is null or int
        if ((is_array($message) || is_object($message)) && ($data === null || is_int($data))) {
            if (is_int($data)) {
                $statusCode = $data;
            }
            $data = $message;
            $message = 'Operation successful';
        }
        
        $response = [
            'success' => true,
            'message' => $message
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        self::json($response, $statusCode);
    }

    public static function badRequest($message = 'Bad request', $errors = null) {
        self::error($message, 400, $errors);
    }
    
    public static function error($message, $statusCode = 400, $errors = null) {
        $response = [
            'success' => false,
            'message' => $message
        ];
        
        if ($errors !== null) {
            $response['errors'] = $errors;
        }
        
        self::json($response, $statusCode);
    }
    
    public static function unauthorized($message = 'Unauthorized access') {
        self::error($message, 401);
    }
    
    public static function forbidden($message = 'Forbidden access') {
        self::error($message, 403);
    }
    
    public static function notFound($message = 'Resource not found') {
        self::error($message, 404);
    }
    
    public static function serverError($message = 'Internal server error') {
        self::error($message, 500);
    }
    
    public static function methodNotAllowed($message = 'Method not allowed') {
        self::error($message, 405);
    }
}
