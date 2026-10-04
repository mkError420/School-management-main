<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? '';

// Override method for FormData PUT (PHP only reads $_FILES in POST)
if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}

switch ($method) {
    case 'GET':
        if ($action === 'attachment') {
            downloadExamAttachment($db, $id);
        } elseif ($id) {
            getExam($db, $id);
        } else {
            getExams($db);
        }
        break;

    case 'POST':
        createExam($db);
        break;

    case 'PUT':
        if (!$id) {
            Response::error('Exam ID is required');
        }
        updateExam($db, $id);
        break;

    case 'DELETE':
        if (!$id) {
            Response::error('Exam ID is required');
        }
        deleteExam($db, $id);
        break;

    default:
        Response::methodNotAllowed();
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: ensure attachment columns exist (auto-migration on first use)
// ─────────────────────────────────────────────────────────────────────────────
function ensureExamSchema($db) {
    $columnsToAdd = [
        'subject_id'               => 'INT NULL AFTER lesson_id',
        'class_id'                 => 'INT NULL AFTER subject_id',
        'teacher_id'               => 'VARCHAR(255) NULL AFTER class_id',
        'date'                     => 'DATE NULL AFTER teacher_id',
        'description'              => 'TEXT NULL AFTER title',
        'total_marks'              => 'INT NULL AFTER description',
        'routine_attachment'       => 'VARCHAR(500) NULL AFTER end_time',
        'attachment_original_name' => 'VARCHAR(255) NULL AFTER routine_attachment',
        'attachment_mime_type'     => 'VARCHAR(127) NULL AFTER attachment_original_name',
        'attachment_size'          => 'INT UNSIGNED NULL AFTER attachment_mime_type',
        'updated_at'               => 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    ];
    foreach ($columnsToAdd as $col => $definition) {
        $exists = $db->fetchAll("SHOW COLUMNS FROM `exams` LIKE '{$col}'");
        if (!$exists) {
            try {
                $db->query("ALTER TABLE `exams` ADD COLUMN `{$col}` {$definition}");
            } catch (Exception $e) {
                // Column may already exist in a concurrent request — safe to ignore
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: resolve or auto-provision a lesson record to keep FK constraint valid
// ─────────────────────────────────────────────────────────────────────────────
function resolveExamLessonId($db, $subjectId, $classId, $teacherId = null, $startTime = null) {
    if (empty($subjectId) || empty($classId)) {
        return null;
    }

    // 1. Look for existing lesson with subject + class + teacher
    if (!empty($teacherId)) {
        $match = $db->fetchOne(
            "SELECT id FROM lessons WHERE subject_id = ? AND class_id = ? AND teacher_id = ? LIMIT 1",
            [$subjectId, $classId, $teacherId]
        );
        if ($match) {
            return intval($match['id']);
        }
    }

    // 2. Look for existing lesson with subject + class
    $match = $db->fetchOne(
        "SELECT id FROM lessons WHERE subject_id = ? AND class_id = ? LIMIT 1",
        [$subjectId, $classId]
    );
    if ($match) {
        return intval($match['id']);
    }

    // 3. Auto-provision a lesson record to satisfy foreign key constraint
    $subject = $db->fetchOne("SELECT name FROM subjects WHERE id = ?", [$subjectId]);
    $subjectName = $subject['name'] ?? 'Subject';
    $lessonName = $subjectName . ' Exam';

    $dayOfWeek = 'MONDAY';
    if (!empty($startTime)) {
        $ts = strtotime($startTime);
        if ($ts) {
            $dayNum = intval(date('N', $ts)); // 1 = Mon, 7 = Sun
            $dayMap = [1 => 'MONDAY', 2 => 'TUESDAY', 3 => 'WEDNESDAY', 4 => 'THURSDAY', 5 => 'SUNDAY', 6 => 'SUNDAY', 7 => 'SUNDAY'];
            $dayOfWeek = $dayMap[$dayNum] ?? 'MONDAY';
        }
    }

    $lessonStart = !empty($startTime) && strlen($startTime) >= 16 ? $startTime : date('Y-m-d 09:00:00');
    $lessonEnd   = date('Y-m-d H:i:s', strtotime($lessonStart) + 3600);

    if (empty($teacherId)) {
        $classRow = $db->fetchOne("SELECT supervisor_id FROM classes WHERE id = ?", [$classId]);
        $teacherId = $classRow['supervisor_id'] ?? null;
        if (empty($teacherId)) {
            $firstTeacher = $db->fetchOne("SELECT id FROM teachers LIMIT 1");
            $teacherId = $firstTeacher['id'] ?? 'admin';
        }
    }

    try {
        return intval($db->insert('lessons', [
            'name'       => $lessonName,
            'day'        => $dayOfWeek,
            'start_time' => $lessonStart,
            'end_time'   => $lessonEnd,
            'subject_id' => $subjectId,
            'class_id'   => $classId,
            'teacher_id' => $teacherId,
        ]));
    } catch (Exception $e) {
        $anyLesson = $db->fetchOne("SELECT id FROM lessons LIMIT 1");
        return $anyLesson ? intval($anyLesson['id']) : null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: upload dir
// ─────────────────────────────────────────────────────────────────────────────
function getUploadDir() {
    $dir = __DIR__ . '/../uploads/exam_routines/';
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    return $dir;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: handle uploaded routine file
// Returns ['storage_name', 'original_name', 'mime_type', 'file_size'] or null
// ─────────────────────────────────────────────────────────────────────────────
function handleRoutineUpload() {
    if (!isset($_FILES['routine_attachment']) || $_FILES['routine_attachment']['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    $file = $_FILES['routine_attachment'];

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

    $maxSize = 20 * 1024 * 1024; // 20 MB
    if ($file['size'] > $maxSize) {
        Response::error('File must be 20 MB or smaller.');
    }

    // Detect MIME type from actual file content (not from browser-supplied value)
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = $finfo->file($file['tmp_name']);

    $allowedMimes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
    ];
    if (!in_array($mime, $allowedMimes, true)) {
        Response::error('Only PDF, JPG, PNG, WebP, or GIF files are allowed.');
    }

    $ext         = ['application/pdf' => 'pdf', 'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'][$mime];
    $storageName = 'exam_routine_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
    $uploadDir   = getUploadDir();
    $destination = $uploadDir . $storageName;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        Response::error('Failed to save uploaded file. Check server permissions.');
    }

    return [
        'storage_name'  => $storageName,
        'original_name' => basename($file['name']),
        'mime_type'     => $mime,
        'file_size'     => $file['size'],
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: delete old attachment file from disk
// ─────────────────────────────────────────────────────────────────────────────
function deleteAttachmentFile($storageName) {
    if (empty($storageName)) return;
    $path = getUploadDir() . $storageName;
    if (file_exists($path)) {
        @unlink($path);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /exams  — list with pagination
// ─────────────────────────────────────────────────────────────────────────────
function getExams($db) {
    $user   = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    ensureExamSchema($db);

    $page    = intval($_GET['page']   ?? 1);
    $limit   = intval($_GET['limit']  ?? 10);
    $search  = $_GET['search']        ?? '';
    $lessonId = $_GET['lesson_id']    ?? '';
    $classId  = $_GET['class_id']     ?? '';
    $offset  = ($page - 1) * $limit;

    $sql = "SELECT e.*, 
            COALESCE(e.subject_id, l.subject_id) as subject_id,
            COALESCE(e.class_id, l.class_id) as class_id,
            COALESCE(e.teacher_id, l.teacher_id) as teacher_id,
            COALESCE(e.date, DATE(e.start_time)) as date,
            l.name as lesson_name, l.day as lesson_day, 
            COALESCE(s_direct.name, s.name) as subject_name,
            COALESCE(c_direct.name, c.name) as class_name, 
            COALESCE(t_direct.name, t.name) as teacher_name, 
            COALESCE(t_direct.surname, t.surname) as teacher_surname
            FROM exams e
            LEFT JOIN lessons l ON e.lesson_id = l.id
            LEFT JOIN subjects s ON l.subject_id = s.id
            LEFT JOIN classes c ON l.class_id = c.id
            LEFT JOIN teachers t ON l.teacher_id = t.id
            LEFT JOIN subjects s_direct ON e.subject_id = s_direct.id
            LEFT JOIN classes c_direct ON e.class_id = c_direct.id
            LEFT JOIN teachers t_direct ON e.teacher_id = t_direct.id
            WHERE 1=1";
    $params = [];

    if ($user['role'] === 'teacher') {
        $sql    .= " AND (COALESCE(e.teacher_id, l.teacher_id) = ?)";
        $params[] = $user['user_id'];
    } elseif ($user['role'] === 'student') {
        $sql    .= " AND (COALESCE(e.class_id, l.class_id) = (SELECT class_id FROM students WHERE id = ?))";
        $params[] = $user['user_id'];
    } elseif ($user['role'] === 'parent') {
        $sql    .= " AND (COALESCE(e.class_id, l.class_id) IN (SELECT class_id FROM students WHERE parent_id = ?))";
        $params[] = $user['user_id'];
    }

    if (!empty($search)) {
        $sql        .= " AND (e.title LIKE ? OR COALESCE(s_direct.name, s.name) LIKE ? OR COALESCE(c_direct.name, c.name) LIKE ?)";
        $searchTerm  = "%{$search}%";
        $params      = array_merge($params, [$searchTerm, $searchTerm, $searchTerm]);
    }

    if (!empty($lessonId)) {
        $sql    .= " AND e.lesson_id = ?";
        $params[] = $lessonId;
    }

    if (!empty($classId)) {
        $sql    .= " AND COALESCE(e.class_id, l.class_id) = ?";
        $params[] = $classId;
    }

    $wherePart = substr($sql, strpos($sql, "WHERE 1=1"));
    $countSql = "SELECT COUNT(*) as total FROM exams e
                 LEFT JOIN lessons l ON e.lesson_id = l.id
                 LEFT JOIN subjects s ON l.subject_id = s.id
                 LEFT JOIN classes c ON l.class_id = c.id
                 LEFT JOIN teachers t ON l.teacher_id = t.id
                 LEFT JOIN subjects s_direct ON e.subject_id = s_direct.id
                 LEFT JOIN classes c_direct ON e.class_id = c_direct.id
                 LEFT JOIN teachers t_direct ON e.teacher_id = t_direct.id
                 " . $wherePart;

    $totalResult = $db->fetchOne($countSql, $params);
    $total       = $totalResult['total'] ?? 0;

    $sql    .= " ORDER BY e.start_time DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;

    $exams = $db->fetchAll($sql, $params);

    // Add public attachment URL to each exam row
    foreach ($exams as &$exam) {
        $exam['attachment_url'] = !empty($exam['routine_attachment'])
            ? '/backend/api/exams?action=attachment&id=' . $exam['id']
            : null;
    }
    unset($exam);

    Response::success('Exams retrieved successfully', [
        'exams'      => $exams,
        'pagination' => [
            'page'  => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit),
        ],
    ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /exams?id=X  — single exam detail
// ─────────────────────────────────────────────────────────────────────────────
function getExam($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    ensureExamSchema($db);

    $exam = $db->fetchOne(
        "SELECT e.*, 
         COALESCE(e.subject_id, l.subject_id) as subject_id,
         COALESCE(e.class_id, l.class_id) as class_id,
         COALESCE(e.teacher_id, l.teacher_id) as teacher_id,
         COALESCE(e.date, DATE(e.start_time)) as date,
         l.name as lesson_name, l.day as lesson_day, 
         COALESCE(s_direct.name, s.name) as subject_name,
         COALESCE(c_direct.name, c.name) as class_name, 
         COALESCE(e.class_id, l.class_id) as class_id, 
         g.level as grade_level,
         COALESCE(t_direct.name, t.name) as teacher_name, 
         COALESCE(t_direct.surname, t.surname) as teacher_surname
         FROM exams e
         LEFT JOIN lessons l ON e.lesson_id = l.id
         LEFT JOIN subjects s ON l.subject_id = s.id
         LEFT JOIN classes c ON l.class_id = c.id
         LEFT JOIN grades g ON c.grade_id = g.id
         LEFT JOIN teachers t ON l.teacher_id = t.id
         LEFT JOIN subjects s_direct ON e.subject_id = s_direct.id
         LEFT JOIN classes c_direct ON e.class_id = c_direct.id
         LEFT JOIN teachers t_direct ON e.teacher_id = t_direct.id
         WHERE e.id = ?",
        [$id]
    );

    if (!$exam) {
        Response::notFound('Exam not found');
    }

    if ($user['role'] === 'teacher' && !empty($exam['teacher_id']) && (string)$exam['teacher_id'] !== (string)$user['user_id']) {
        Response::forbidden('You can only view exams for your lessons');
    }
    if ($user['role'] === 'student' && !empty($exam['class_id'])) {
        $studentInClass = $db->fetchOne(
            "SELECT id FROM students WHERE id = ? AND class_id = ?",
            [$user['user_id'], $exam['class_id']]
        );
        if (!$studentInClass) {
            Response::forbidden('You can only view exams for your class');
        }
    }
    if ($user['role'] === 'parent' && !empty($exam['class_id'])) {
        $childInClass = $db->fetchOne(
            "SELECT id FROM students WHERE parent_id = ? AND class_id = ? LIMIT 1",
            [$user['user_id'], $exam['class_id']]
        );
        if (!$childInClass) {
            Response::forbidden('You can only view exams for your children');
        }
    }

    // Add public attachment URL
    $exam['attachment_url'] = !empty($exam['routine_attachment'])
        ? '/backend/api/exams?action=attachment&id=' . $exam['id']
        : null;

    // Results
    $results = $db->fetchAll(
        "SELECT r.*, s.name as student_name, s.surname as student_surname, s.username as student_username
         FROM results r
         LEFT JOIN students s ON r.student_id = s.id
         WHERE r.exam_id = ?" . ($user['role'] === 'student' ? " AND s.id = ?" : ($user['role'] === 'parent' ? " AND s.parent_id = ?" : "")) . "
         ORDER BY s.name",
        in_array($user['role'], ['student', 'parent'], true) ? [$id, $user['user_id']] : [$id]
    );

    // Students in class
    $students = [];
    if (!empty($exam['class_id'])) {
        $students = $db->fetchAll(
            "SELECT s.*, p.name as parent_name, p.surname as parent_surname
             FROM students s
             LEFT JOIN parents p ON s.parent_id = p.id
             WHERE s.class_id = ?
             " . ($user['role'] === 'student' ? "AND s.id = ?" : ($user['role'] === 'parent' ? "AND s.parent_id = ?" : "")) . "
             ORDER BY s.name",
            in_array($user['role'], ['student', 'parent'], true)
                ? [$exam['class_id'], $user['user_id']]
                : [$exam['class_id']]
        );

        foreach ($students as &$student) {
            unset($student['password']);
        }
    }

    Response::success('Exam retrieved successfully', [
        'exam'     => $exam,
        'results'  => $results,
        'students' => $students,
    ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /exams?action=attachment&id=X  — stream attachment file
// ─────────────────────────────────────────────────────────────────────────────
function downloadExamAttachment($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    ensureExamSchema($db);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Exam ID is required']);
        exit;
    }

    $exam = $db->fetchOne(
        "SELECT e.routine_attachment, e.attachment_original_name, e.attachment_mime_type,
                l.class_id, l.teacher_id
         FROM exams e
         LEFT JOIN lessons l ON e.lesson_id = l.id
         WHERE e.id = ?",
        [$id]
    );

    if (!$exam || empty($exam['routine_attachment'])) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Attachment not found']);
        exit;
    }

    // Access control
    if ($user['role'] === 'teacher' && !empty($exam['teacher_id']) && (string)$exam['teacher_id'] !== (string)$user['user_id']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit;
    }
    if ($user['role'] === 'student' && !empty($exam['class_id'])) {
        $studentInClass = $db->fetchOne(
            "SELECT id FROM students WHERE id = ? AND class_id = ?",
            [$user['user_id'], $exam['class_id']]
        );
        if (!$studentInClass) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Access denied']);
            exit;
        }
    }
    if ($user['role'] === 'parent' && !empty($exam['class_id'])) {
        $childInClass = $db->fetchOne(
            "SELECT id FROM students WHERE parent_id = ? AND class_id = ? LIMIT 1",
            [$user['user_id'], $exam['class_id']]
        );
        if (!$childInClass) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Access denied']);
            exit;
        }
    }

    $filePath = getUploadDir() . $exam['routine_attachment'];
    if (!file_exists($filePath)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'File not found on server']);
        exit;
    }

    $mime         = $exam['attachment_mime_type'] ?: mime_content_type($filePath);
    $originalName = $exam['attachment_original_name'] ?: basename($filePath);

    // Stream the file
    while (ob_get_level()) {
        ob_end_clean();
    }
    header('Content-Type: ' . $mime, true);
    header('Content-Length: ' . filesize($filePath));
    header('Accept-Ranges: bytes');
    // Inline for images & PDFs, attachment (download) for everything else
    $inline = in_array($mime, ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    header('Content-Disposition: ' . ($inline ? 'inline' : 'attachment') . '; filename="' . addslashes($originalName) . '"');
    header('Cache-Control: private, max-age=3600');
    readfile($filePath);
    exit;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /exams  — create exam (accepts multipart/form-data OR JSON)
// ─────────────────────────────────────────────────────────────────────────────
function createExam($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    ensureExamSchema($db);

    // Support both multipart/form-data (with file) and JSON
    $isMultipart = isset($_SERVER['CONTENT_TYPE']) && str_contains($_SERVER['CONTENT_TYPE'], 'multipart/form-data');
    if ($isMultipart) {
        $input = $_POST;
    } else {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
    }

    if (empty($input['title'])) {
        Response::error("Field 'title' is required");
    }

    $subjectId = !empty($input['subject_id']) ? intval($input['subject_id']) : null;
    $classId   = !empty($input['class_id'])   ? intval($input['class_id'])   : null;
    $teacherId = !empty($input['teacher_id']) ? trim($input['teacher_id'])   : ($user['role'] === 'teacher' ? $user['user_id'] : null);

    // Date / time resolution
    $startTime = !empty($input['start_time']) ? trim($input['start_time']) : (!empty($input['date']) ? trim($input['date']) : null);
    if (empty($startTime)) {
        Response::error("Field 'Date' is required");
    }
    if (strlen($startTime) === 10) {
        $startTime .= ' 09:00:00';
    }
    $endTime = !empty($input['end_time']) ? trim($input['end_time']) : date('Y-m-d H:i:s', strtotime($startTime) + 2 * 3600);

    // Lesson resolution
    $lessonId = !empty($input['lesson_id']) ? intval($input['lesson_id']) : null;
    if (!$lessonId && $subjectId && $classId) {
        $lessonId = resolveExamLessonId($db, $subjectId, $classId, $teacherId, $startTime);
    }

    // If lessonId is still not available (e.g. subject/class not chosen), try reading from lesson if provided
    if (!$lessonId && !empty($input['lesson_id'])) {
        $lessonId = intval($input['lesson_id']);
    }

    if (!$lessonId && (empty($subjectId) || empty($classId))) {
        Response::error("Subject and Class are required");
    }

    // If subject_id, class_id, teacher_id weren't explicitly provided, read from lesson
    if ($lessonId && (!$subjectId || !$classId || !$teacherId)) {
        $lesson = $db->fetchOne("SELECT subject_id, class_id, teacher_id FROM lessons WHERE id = ?", [$lessonId]);
        if ($lesson) {
            $subjectId = $subjectId ?: intval($lesson['subject_id']);
            $classId   = $classId   ?: intval($lesson['class_id']);
            $teacherId = $teacherId ?: $lesson['teacher_id'];
        }
    }

    // Handle file upload
    $uploadInfo = handleRoutineUpload();

    try {
        $data = [
            'title'      => trim($input['title']),
            'start_time' => $startTime,
            'end_time'   => $endTime,
            'lesson_id'  => $lessonId,
            'subject_id' => $subjectId,
            'class_id'   => $classId,
            'teacher_id' => $teacherId,
            'date'       => substr($startTime, 0, 10),
        ];

        if (!empty($input['description']))  $data['description']  = trim($input['description']);
        if (isset($input['total_marks']) && $input['total_marks'] !== '') {
            $data['total_marks'] = intval($input['total_marks']);
        }

        if ($uploadInfo) {
            $data['routine_attachment']       = $uploadInfo['storage_name'];
            $data['attachment_original_name'] = $uploadInfo['original_name'];
            $data['attachment_mime_type']     = $uploadInfo['mime_type'];
            $data['attachment_size']          = $uploadInfo['file_size'];
        }

        $id = $db->insert('exams', $data);

        $exam = $db->fetchOne(
            "SELECT e.*, 
             COALESCE(e.subject_id, l.subject_id) as subject_id,
             COALESCE(e.class_id, l.class_id) as class_id,
             COALESCE(e.teacher_id, l.teacher_id) as teacher_id,
             COALESCE(s_direct.name, s.name) as subject_name, 
             COALESCE(c_direct.name, c.name) as class_name,
             COALESCE(t_direct.name, t.name) as teacher_name, 
             COALESCE(t_direct.surname, t.surname) as teacher_surname
             FROM exams e
             LEFT JOIN lessons l ON e.lesson_id = l.id
             LEFT JOIN subjects s ON l.subject_id = s.id
             LEFT JOIN classes c ON l.class_id = c.id
             LEFT JOIN teachers t ON l.teacher_id = t.id
             LEFT JOIN subjects s_direct ON e.subject_id = s_direct.id
             LEFT JOIN classes c_direct ON e.class_id = c_direct.id
             LEFT JOIN teachers t_direct ON e.teacher_id = t_direct.id
             WHERE e.id = ?",
            [$id]
        );

        $exam['attachment_url'] = !empty($exam['routine_attachment'])
            ? '/backend/api/exams?action=attachment&id=' . $exam['id']
            : null;

        Response::success('Exam created successfully', $exam, 201);

    } catch (Exception $e) {
        // Clean up uploaded file if DB insert fails
        if ($uploadInfo) deleteAttachmentFile($uploadInfo['storage_name']);
        Response::error('Failed to create exam: ' . $e->getMessage());
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /exams?id=X  — update exam
// ─────────────────────────────────────────────────────────────────────────────
function updateExam($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    ensureExamSchema($db);

    // Support multipart/form-data (method override via _method=PUT)
    $isMultipart = isset($_SERVER['CONTENT_TYPE']) && str_contains($_SERVER['CONTENT_TYPE'], 'multipart/form-data');
    if ($isMultipart) {
        $input = $_POST;
    } else {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
    }

    $existing = $db->fetchOne("SELECT * FROM exams WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Exam not found');
    }

    if ($user['role'] === 'teacher' && !empty($existing['teacher_id']) && (string)$existing['teacher_id'] !== (string)$user['user_id']) {
        Response::forbidden('You can only update exams for your lessons');
    }

    $data = [];

    $allowedFields = ['title', 'start_time', 'end_time', 'lesson_id', 'description', 'total_marks', 'subject_id', 'class_id', 'teacher_id', 'date'];
    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $input)) {
            if ($field === 'lesson_id' || $field === 'total_marks' || $field === 'subject_id' || $field === 'class_id') {
                $data[$field] = $input[$field] !== '' ? intval($input[$field]) : null;
            } else {
                $data[$field] = $input[$field];
            }
        }
    }

    // Keep date updated with start_time
    if (!empty($data['start_time'])) {
        if (strlen($data['start_time']) === 10) {
            $data['start_time'] .= ' 09:00:00';
        }
        $data['date'] = substr($data['start_time'], 0, 10);
    } elseif (!empty($data['date'])) {
        $data['start_time'] = $data['date'] . ' 09:00:00';
    }

    // Resolve or update lesson_id if subject/class/teacher updated
    $subjId = $data['subject_id'] ?? $existing['subject_id'] ?? null;
    $clsId  = $data['class_id']   ?? $existing['class_id']   ?? null;
    $tchId  = $data['teacher_id'] ?? $existing['teacher_id'] ?? null;
    $time   = $data['start_time'] ?? $existing['start_time'] ?? null;

    if ($subjId && $clsId && (isset($data['subject_id']) || isset($data['class_id']) || isset($data['teacher_id']))) {
        $resolvedLessonId = resolveExamLessonId($db, $subjId, $clsId, $tchId, $time);
        if ($resolvedLessonId) {
            $data['lesson_id'] = $resolvedLessonId;
        }
    }

    // Handle new file upload
    $uploadInfo = handleRoutineUpload();

    if ($uploadInfo) {
        // Remove old file from disk
        deleteAttachmentFile($existing['routine_attachment'] ?? '');

        $data['routine_attachment']       = $uploadInfo['storage_name'];
        $data['attachment_original_name'] = $uploadInfo['original_name'];
        $data['attachment_mime_type']     = $uploadInfo['mime_type'];
        $data['attachment_size']          = $uploadInfo['file_size'];
    }

    // Handle explicit attachment removal
    if (isset($input['remove_attachment']) && $input['remove_attachment'] === '1') {
        deleteAttachmentFile($existing['routine_attachment'] ?? '');
        $data['routine_attachment']       = null;
        $data['attachment_original_name'] = null;
        $data['attachment_mime_type']     = null;
        $data['attachment_size']          = null;
    }

    if (empty($data)) {
        Response::error('No fields to update');
    }

    try {
        $db->update('exams', $data, 'id = ?', [$id]);

        $exam = $db->fetchOne(
            "SELECT e.*, 
             COALESCE(e.subject_id, l.subject_id) as subject_id,
             COALESCE(e.class_id, l.class_id) as class_id,
             COALESCE(e.teacher_id, l.teacher_id) as teacher_id,
             COALESCE(s_direct.name, s.name) as subject_name, 
             COALESCE(c_direct.name, c.name) as class_name,
             COALESCE(t_direct.name, t.name) as teacher_name, 
             COALESCE(t_direct.surname, t.surname) as teacher_surname
             FROM exams e
             LEFT JOIN lessons l ON e.lesson_id = l.id
             LEFT JOIN subjects s ON l.subject_id = s.id
             LEFT JOIN classes c ON l.class_id = c.id
             LEFT JOIN teachers t ON l.teacher_id = t.id
             LEFT JOIN subjects s_direct ON e.subject_id = s_direct.id
             LEFT JOIN classes c_direct ON e.class_id = c_direct.id
             LEFT JOIN teachers t_direct ON e.teacher_id = t_direct.id
             WHERE e.id = ?",
            [$id]
        );

        $exam['attachment_url'] = !empty($exam['routine_attachment'])
            ? '/backend/api/exams?action=attachment&id=' . $exam['id']
            : null;

        Response::success('Exam updated successfully', $exam);

    } catch (Exception $e) {
        if ($uploadInfo) deleteAttachmentFile($uploadInfo['storage_name']);
        Response::error('Failed to update exam: ' . $e->getMessage());
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /exams?id=X
// ─────────────────────────────────────────────────────────────────────────────
function deleteExam($db, $id) {
    AuthMiddleware::requireRole('admin');

    $existing = $db->fetchOne("SELECT * FROM exams WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Exam not found');
    }

    try {
        $deleted = $db->delete('exams', 'id = ?', [$id]);

        if ($deleted > 0) {
            // Remove attachment file from disk after successful DB delete
            deleteAttachmentFile($existing['routine_attachment'] ?? '');
            Response::success('Exam deleted successfully');
        } else {
            Response::error('Failed to delete exam');
        }

    } catch (Exception $e) {
        Response::error('Failed to delete exam: ' . $e->getMessage());
    }
}
