<?php

$db = Database::getInstance();
ensureAssignmentSchema($db);

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

// Support method override for multipart PUT
$methodOverride = strtoupper($_POST['_method'] ?? $_GET['_method'] ?? '');
if ($method === 'POST' && $methodOverride === 'PUT') {
    $method = 'PUT';
}

if ($action === 'attachment' && $id) {
    downloadAssignmentAttachment($db, $id);
    exit;
}

switch ($method) {
    case 'GET':
        if ($id) {
            getAssignment($db, $id);
        } else {
            getAssignments($db);
        }
        break;
        
    case 'POST':
        createAssignment($db);
        break;
        
    case 'PUT':
        if (!$id) {
            Response::error('Assignment ID is required');
        }
        updateAssignment($db, $id);
        break;
        
    case 'DELETE':
        if (!$id) {
            Response::error('Assignment ID is required');
        }
        deleteAssignment($db, $id);
        break;
        
    default:
        Response::methodNotAllowed();
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema auto-migration helper
// ─────────────────────────────────────────────────────────────────────────────
function ensureAssignmentSchema($db) {
    // 1. Allow lesson_id to be NULL so Lesson is no longer mandatory
    try {
        $db->query("ALTER TABLE `assignments` MODIFY COLUMN `lesson_id` INT NULL");
    } catch (Exception $e) {}

    // 2. Add assignment attachment columns
    $columnsToAdd = [
        'assignment_attachment'    => 'VARCHAR(500) NULL AFTER due_date',
        'attachment_original_name' => 'VARCHAR(255) NULL AFTER assignment_attachment',
        'attachment_mime_type'     => 'VARCHAR(127) NULL AFTER attachment_original_name',
        'attachment_size'          => 'INT UNSIGNED NULL AFTER attachment_mime_type',
        'class_id'                 => 'INT NULL AFTER lesson_id',
        'subject_id'               => 'INT NULL AFTER class_id',
        'teacher_id'               => 'VARCHAR(255) NULL AFTER subject_id',
        'description'              => 'TEXT NULL AFTER title',
        'updated_at'               => 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    ];
    foreach ($columnsToAdd as $col => $definition) {
        $exists = $db->fetchAll("SHOW COLUMNS FROM `assignments` LIKE '{$col}'");
        if (!$exists) {
            try {
                $db->query("ALTER TABLE `assignments` ADD COLUMN `{$col}` {$definition}");
            } catch (Exception $e) {}
        }
    }
}

function getUploadDir() {
    $dir = __DIR__ . '/../../public/uploads/assignments/';
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    return $dir;
}

function handleAssignmentUpload() {
    $fileKey = null;
    if (isset($_FILES['assignment_attachment']) && $_FILES['assignment_attachment']['error'] !== UPLOAD_ERR_NO_FILE) {
        $fileKey = 'assignment_attachment';
    } elseif (isset($_FILES['routine_attachment']) && $_FILES['routine_attachment']['error'] !== UPLOAD_ERR_NO_FILE) {
        $fileKey = 'routine_attachment';
    } elseif (isset($_FILES['file']) && $_FILES['file']['error'] !== UPLOAD_ERR_NO_FILE) {
        $fileKey = 'file';
    }

    if (!$fileKey) {
        return null;
    }

    $file = $_FILES[$fileKey];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        $messages = [
            UPLOAD_ERR_INI_SIZE   => 'File exceeds server upload limit.',
            UPLOAD_ERR_FORM_SIZE  => 'File exceeds form size limit.',
            UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded.',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder.',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
            UPLOAD_ERR_EXTENSION  => 'A PHP extension blocked the upload.',
        ];
        Response::error($messages[$file['error']] ?? 'File upload error.');
    }

    $maxSize = 25 * 1024 * 1024; // 25 MB
    if ($file['size'] > $maxSize) {
        Response::error('File must be 25 MB or smaller.');
    }

    // Detect MIME type
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = $finfo->file($file['tmp_name']);

    $allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
    ];
    if (!in_array($mime, $allowedMimes, true)) {
        Response::error('Only PDF, Word documents (.doc/.docx), text files, or images are allowed.');
    }

    $mimeMap = [
        'application/pdf' => 'pdf',
        'application/msword' => 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
        'text/plain' => 'txt',
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];
    $ext = $mimeMap[$mime] ?? 'bin';
    $storageName = 'asg_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
    $uploadDir   = getUploadDir();
    $destination = $uploadDir . $storageName;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        Response::error('Failed to save uploaded assignment file. Check server permissions.');
    }

    return [
        'storage_name'  => $storageName,
        'original_name' => basename($file['name']),
        'mime_type'     => $mime,
        'file_size'     => $file['size'],
    ];
}

function deleteAttachmentFile($storageName) {
    if (empty($storageName)) return;
    $path = getUploadDir() . $storageName;
    if (file_exists($path)) {
        @unlink($path);
    }
}

function downloadAssignmentAttachment($db, $id) {
    AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);

    $assignment = $db->fetchOne(
        "SELECT assignment_attachment, attachment_original_name, attachment_mime_type, attachment_size FROM assignments WHERE id = ?",
        [$id]
    );

    if (!$assignment || empty($assignment['assignment_attachment'])) {
        Response::notFound('No attachment found for this assignment');
    }

    $filePath = getUploadDir() . $assignment['assignment_attachment'];
    if (!file_exists($filePath)) {
        Response::notFound('Attachment file not found on disk');
    }

    $mime     = $assignment['attachment_mime_type'] ?: 'application/octet-stream';
    $origName = $assignment['attachment_original_name'] ?: basename($filePath);
    $size     = filesize($filePath);

    $isViewable = in_array($mime, ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'], true);
    $disposition = $isViewable ? 'inline' : 'attachment';

    header('Content-Type: ' . $mime);
    header('Content-Length: ' . $size);
    header('Content-Disposition: ' . $disposition . '; filename="' . rawurlencode($origName) . '"');
    header('Cache-Control: public, max-age=86400');
    header('X-Content-Type-Options: nosniff');

    readfile($filePath);
    exit;
}

function formatAssignmentRow($a) {
    $a['attachment_url'] = !empty($a['assignment_attachment'])
        ? '/backend/api/assignments.php?action=attachment&id=' . $a['id']
        : null;
    return $a;
}

function getAssignments($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 10);
    $search = $_GET['search'] ?? '';
    $lessonId = $_GET['lesson_id'] ?? '';
    $classId = $_GET['class_id'] ?? '';
    
    $offset = ($page - 1) * $limit;
    
    $sql = "SELECT a.*, 
                   COALESCE(c_direct.name, c.name) as class_name,
                   COALESCE(s_direct.name, s.name) as subject_name,
                   COALESCE(t_direct.name, t.name) as teacher_name, 
                   COALESCE(t_direct.surname, t.surname) as teacher_surname,
                   l.name as lesson_name
            FROM assignments a
            LEFT JOIN lessons l ON a.lesson_id = l.id
            LEFT JOIN subjects s ON l.subject_id = s.id
            LEFT JOIN classes c ON l.class_id = c.id
            LEFT JOIN teachers t ON l.teacher_id = t.id
            LEFT JOIN classes c_direct ON a.class_id = c_direct.id
            LEFT JOIN subjects s_direct ON a.subject_id = s_direct.id
            LEFT JOIN teachers t_direct ON a.teacher_id = t_direct.id
            WHERE 1=1";
    $params = [];

    if ($user['role'] === 'teacher') {
        $sql .= " AND (l.teacher_id = ? OR a.teacher_id = ?)";
        $params[] = $user['user_id'];
        $params[] = $user['user_id'];
    } elseif ($user['role'] === 'student') {
        $sql .= " AND (l.class_id = (SELECT class_id FROM students WHERE id = ?) OR a.class_id = (SELECT class_id FROM students WHERE id = ?))";
        $params[] = $user['user_id'];
        $params[] = $user['user_id'];
    } elseif ($user['role'] === 'parent') {
        $sql .= " AND (l.class_id IN (SELECT class_id FROM students WHERE parent_id = ?) OR a.class_id IN (SELECT class_id FROM students WHERE parent_id = ?))";
        $params[] = $user['user_id'];
        $params[] = $user['user_id'];
    }
    
    if (!empty($search)) {
        $sql .= " AND (a.title LIKE ? OR s.name LIKE ? OR c.name LIKE ? OR s_direct.name LIKE ? OR c_direct.name LIKE ?)";
        $searchTerm = "%{$search}%";
        $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm]);
    }
    
    if (!empty($lessonId)) {
        $sql .= " AND a.lesson_id = ?";
        $params[] = $lessonId;
    }
    
    if (!empty($classId)) {
        $sql .= " AND (l.class_id = ? OR a.class_id = ?)";
        $params[] = $classId;
        $params[] = $classId;
    }
    
    $countSql = "SELECT COUNT(*) as total FROM (" . $sql . ") as subquery";
    $totalResult = $db->fetchOne($countSql, $params);
    $total = $totalResult['total'] ?? 0;
    
    $sql .= " ORDER BY a.due_date DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $assignments = $db->fetchAll($sql, $params);
    $assignments = array_map('formatAssignmentRow', $assignments);
    
    Response::success('Assignments retrieved successfully', [
        'assignments' => $assignments,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

function getAssignment($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $sql = "SELECT a.*, 
                   COALESCE(c_direct.name, c.name) as class_name,
                   COALESCE(s_direct.name, s.name) as subject_name,
                   COALESCE(t_direct.name, t.name) as teacher_name, 
                   COALESCE(t_direct.surname, t.surname) as teacher_surname,
                   l.name as lesson_name
            FROM assignments a
            LEFT JOIN lessons l ON a.lesson_id = l.id
            LEFT JOIN subjects s ON l.subject_id = s.id
            LEFT JOIN classes c ON l.class_id = c.id
            LEFT JOIN teachers t ON l.teacher_id = t.id
            LEFT JOIN classes c_direct ON a.class_id = c_direct.id
            LEFT JOIN subjects s_direct ON a.subject_id = s_direct.id
            LEFT JOIN teachers t_direct ON a.teacher_id = t_direct.id
            WHERE a.id = ?";
    
    $params = [$id];
    if ($user['role'] === 'teacher') {
        $sql .= " AND (l.teacher_id = ? OR a.teacher_id = ?)";
        $params[] = $user['user_id'];
        $params[] = $user['user_id'];
    } elseif ($user['role'] === 'student') {
        $sql .= " AND (l.class_id = (SELECT class_id FROM students WHERE id = ?) OR a.class_id = (SELECT class_id FROM students WHERE id = ?))";
        $params[] = $user['user_id'];
        $params[] = $user['user_id'];
    } elseif ($user['role'] === 'parent') {
        $sql .= " AND (l.class_id IN (SELECT class_id FROM students WHERE parent_id = ?) OR a.class_id IN (SELECT class_id FROM students WHERE parent_id = ?))";
        $params[] = $user['user_id'];
        $params[] = $user['user_id'];
    }

    $assignment = $db->fetchOne($sql, $params);
    
    if (!$assignment) {
        Response::notFound('Assignment not found');
    }
    
    $assignment = formatAssignmentRow($assignment);
    Response::success('Assignment retrieved successfully', ['assignment' => $assignment]);
}

function createAssignment($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    
    $isMultipart = isset($_SERVER['CONTENT_TYPE']) && str_contains($_SERVER['CONTENT_TYPE'], 'multipart/form-data');
    if ($isMultipart) {
        $input = $_POST;
    } else {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
    }
    
    if (empty($input['title'])) {
        Response::error("Field 'title' is required");
    }
    if (empty($input['due_date'])) {
        Response::error("Field 'due_date' is required");
    }
    
    $startDate = !empty($input['start_date']) ? trim($input['start_date']) : date('Y-m-d H:i:s');
    $dueDate = trim($input['due_date']);
    $lessonId = !empty($input['lesson_id']) ? intval($input['lesson_id']) : null;
    $classId = !empty($input['class_id']) ? intval($input['class_id']) : null;
    $subjectId = !empty($input['subject_id']) ? intval($input['subject_id']) : null;
    $teacherId = !empty($input['teacher_id']) ? trim($input['teacher_id']) : ($user['role'] === 'teacher' ? $user['user_id'] : null);
    
    $uploadInfo = handleAssignmentUpload();
    
    $data = [
        'title'      => trim($input['title']),
        'start_date' => $startDate,
        'due_date'   => $dueDate,
        'lesson_id'  => $lessonId,
    ];
    
    if (!empty($input['description'])) $data['description'] = trim($input['description']);
    if ($classId) $data['class_id'] = $classId;
    if ($subjectId) $data['subject_id'] = $subjectId;
    if ($teacherId) $data['teacher_id'] = $teacherId;
    
    if ($uploadInfo) {
        $data['assignment_attachment']    = $uploadInfo['storage_name'];
        $data['attachment_original_name'] = $uploadInfo['original_name'];
        $data['attachment_mime_type']     = $uploadInfo['mime_type'];
        $data['attachment_size']          = $uploadInfo['file_size'];
    }
    
    $assignmentId = $db->insert('assignments', $data);
    
    Response::success('Assignment created successfully', ['id' => $assignmentId], 201);
}

function updateAssignment($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    
    $isMultipart = isset($_SERVER['CONTENT_TYPE']) && str_contains($_SERVER['CONTENT_TYPE'], 'multipart/form-data');
    if ($isMultipart) {
        $input = $_POST;
    } else {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
    }
    
    $assignment = $db->fetchOne("SELECT * FROM assignments WHERE id = ?", [$id]);
    if (!$assignment) {
        Response::notFound('Assignment not found');
    }
    
    $data = [];
    if (isset($input['title'])) $data['title'] = trim($input['title']);
    if (isset($input['start_date'])) $data['start_date'] = trim($input['start_date']);
    if (isset($input['due_date'])) $data['due_date'] = trim($input['due_date']);
    if (isset($input['lesson_id'])) $data['lesson_id'] = !empty($input['lesson_id']) ? intval($input['lesson_id']) : null;
    if (isset($input['description'])) $data['description'] = trim($input['description']);
    if (isset($input['class_id'])) $data['class_id'] = !empty($input['class_id']) ? intval($input['class_id']) : null;
    if (isset($input['subject_id'])) $data['subject_id'] = !empty($input['subject_id']) ? intval($input['subject_id']) : null;
    
    $uploadInfo = handleAssignmentUpload();
    if ($uploadInfo) {
        deleteAttachmentFile($assignment['assignment_attachment'] ?? '');
        $data['assignment_attachment']    = $uploadInfo['storage_name'];
        $data['attachment_original_name'] = $uploadInfo['original_name'];
        $data['attachment_mime_type']     = $uploadInfo['mime_type'];
        $data['attachment_size']          = $uploadInfo['file_size'];
    } elseif (!empty($input['remove_attachment'])) {
        deleteAttachmentFile($assignment['assignment_attachment'] ?? '');
        $data['assignment_attachment']    = null;
        $data['attachment_original_name'] = null;
        $data['attachment_mime_type']     = null;
        $data['attachment_size']          = null;
    }
    
    if (!empty($data)) {
        $db->update('assignments', $data, 'id = ?', [$id]);
    }
    
    Response::success('Assignment updated successfully');
}

function deleteAssignment($db, $id) {
    $user = AuthMiddleware::requireRole('admin');
    
    $assignment = $db->fetchOne("SELECT * FROM assignments WHERE id = ?", [$id]);
    if (!$assignment) {
        Response::notFound('Assignment not found');
    }
    
    deleteAttachmentFile($assignment['assignment_attachment'] ?? '');
    $db->delete('assignments', 'id = ?', [$id]);
    Response::success('Assignment deleted successfully');
}
