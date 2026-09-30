<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            getGrade($db, $id);
        } else {
            getGrades($db);
        }
        break;
        
    case 'POST':
        createGrade($db);
        break;
        
    case 'PUT':
        if (!$id) {
            Response::error('Grade ID is required');
        }
        updateGrade($db, $id);
        break;
        
    case 'DELETE':
        if (!$id) {
            Response::error('Grade ID is required');
        }
        deleteGrade($db, $id);
        break;
        
    default:
        Response::methodNotAllowed();
}

function getGrades($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $grades = $db->fetchAll(
        "SELECT g.*, 
         (SELECT COUNT(*) FROM classes WHERE grade_id = g.id) as class_count,
         (SELECT COUNT(*) FROM students WHERE grade_id = g.id) as student_count
         FROM grades g 
         ORDER BY g.level ASC"
    );
    
    Response::success('Grades retrieved successfully', ['grades' => $grades]);
}

function getGrade($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $grade = $db->fetchOne("SELECT * FROM grades WHERE id = ?", [$id]);
    
    if (!$grade) {
        Response::notFound('Grade not found');
    }
    
    // Get classes in this grade
    $classes = $db->fetchAll(
        "SELECT c.*, t.name as supervisor_name, t.surname as supervisor_surname,
         (SELECT COUNT(*) FROM students WHERE class_id = c.id) as student_count
         FROM classes c 
         LEFT JOIN teachers t ON c.supervisor_id = t.id 
         WHERE c.grade_id = ? 
         ORDER BY c.name",
        [$id]
    );
    
    // Get students in this grade
    $students = $db->fetchAll(
        "SELECT s.*, c.name as class_name, p.name as parent_name, p.surname as parent_surname 
         FROM students s 
         LEFT JOIN classes c ON s.class_id = c.id 
         LEFT JOIN parents p ON s.parent_id = p.id 
         WHERE s.grade_id = ? 
         ORDER BY s.name",
        [$id]
    );
    
    // Remove passwords from students
    foreach ($students as &$student) {
        unset($student['password']);
    }
    
    Response::success('Grade retrieved successfully', [
        'grade' => $grade,
        'classes' => $classes,
        'students' => $students
    ]);
}

function createGrade($db) {
    AuthMiddleware::requireRole('admin');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['level'])) {
        Response::error('Grade level is required');
    }
    
    try {
        $id = $db->insert('grades', [
            'level' => $input['level']
        ]);
        
        $grade = $db->fetchOne("SELECT * FROM grades WHERE id = ?", [$id]);
        
        Response::success('Grade created successfully', $grade, 201);
        
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            Response::error('Grade level already exists', 409);
        }
        Response::error('Failed to create grade: ' . $e->getMessage());
    }
}

function updateGrade($db, $id) {
    AuthMiddleware::requireRole('admin');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Check if grade exists
    $existing = $db->fetchOne("SELECT id FROM grades WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Grade not found');
    }
    
    if (empty($input['level'])) {
        Response::error('Grade level is required');
    }
    
    try {
        $db->update('grades', ['level' => $input['level']], 'id = ?', [$id]);
        
        $grade = $db->fetchOne("SELECT * FROM grades WHERE id = ?", [$id]);
        
        Response::success('Grade updated successfully', $grade);
        
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            Response::error('Grade level already exists', 409);
        }
        Response::error('Failed to update grade: ' . $e->getMessage());
    }
}

function deleteGrade($db, $id) {
    AuthMiddleware::requireRole('admin');
    
    // Check if grade exists
    $existing = $db->fetchOne("SELECT id FROM grades WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Grade not found');
    }
    
    // Check if grade has classes
    $classCount = $db->fetchOne(
        "SELECT COUNT(*) as count FROM classes WHERE grade_id = ?",
        [$id]
    );
    
    if ($classCount['count'] > 0) {
        Response::error('Cannot delete grade with associated classes. Please delete the classes first.');
    }
    
    try {
        $deleted = $db->delete('grades', 'id = ?', [$id]);
        
        if ($deleted > 0) {
            Response::success('Grade deleted successfully');
        } else {
            Response::error('Failed to delete grade');
        }
        
    } catch (Exception $e) {
        Response::error('Failed to delete grade: ' . $e->getMessage());
    }
}
