<?php

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? '';

// Ensure result schema columns exist
ensureResultSchema($db);

switch ($method) {
    case 'GET':
        if ($action === 'sheet' || $action === 'result_sheet') {
            generateResultSheet($db);
        } elseif ($action === 'tabulation' || $action === 'tabulation_sheet') {
            generateTabulationSheet($db);
        } elseif ($action === 'scale' || $action === 'grading_scale') {
            getGradingScaleInfo();
        } elseif ($action === 'stats') {
            getResultStats($db);
        } elseif ($id) {
            getResult($db, $id);
        } else {
            getResults($db);
        }
        break;
        
    case 'POST':
        if ($action === 'bulk' || $action === 'bulk_save') {
            bulkSaveResults($db);
        } else {
            createResult($db);
        }
        break;
        
    case 'PUT':
        if (!$id) {
            Response::error('Result ID is required');
        }
        updateResult($db, $id);
        break;
        
    case 'DELETE':
        if (!$id) {
            Response::error('Result ID is required');
        }
        deleteResult($db, $id);
        break;
        
    default:
        Response::methodNotAllowed();
}

/**
 * Ensure optional columns exist in results table for Bangladesh result system
 */
function ensureResultSchema($db) {
    $columnsToAdd = [
        'total_marks'     => 'INT NULL DEFAULT 100',
        'cq_marks'        => 'DECIMAL(5,2) NULL',
        'mcq_marks'       => 'DECIMAL(5,2) NULL',
        'practical_marks' => 'DECIMAL(5,2) NULL',
        'grade'           => 'VARCHAR(10) NULL',
        'point'           => 'DECIMAL(3,2) NULL',
        'remarks'         => 'VARCHAR(100) NULL',
    ];
    foreach ($columnsToAdd as $col => $definition) {
        $exists = $db->fetchAll("SHOW COLUMNS FROM `results` LIKE '{$col}'");
        if (!$exists) {
            try {
                $db->query("ALTER TABLE `results` ADD COLUMN `{$col}` {$definition}");
            } catch (Exception $e) {
                // Ignore if already added concurrently
            }
        }
    }
}

/**
 * Bangladesh National Curriculum 7-Tier Grading Scale
 */
function getBangladeshGradingScale() {
    return [
        ['range' => '80% - 100%', 'min' => 80, 'max' => 100,   'grade' => 'A+', 'point' => 5.00, 'remarks' => 'Outstanding / Golden', 'color' => 'emerald'],
        ['range' => '70% - 79%',  'min' => 70, 'max' => 79.99, 'grade' => 'A',  'point' => 4.00, 'remarks' => 'Excellent',            'color' => 'green'],
        ['range' => '60% - 69%',  'min' => 60, 'max' => 69.99, 'grade' => 'A-', 'point' => 3.50, 'remarks' => 'Very Good',            'color' => 'teal'],
        ['range' => '50% - 59%',  'min' => 50, 'max' => 59.99, 'grade' => 'B',  'point' => 3.00, 'remarks' => 'Good',                 'color' => 'blue'],
        ['range' => '40% - 49%',  'min' => 40, 'max' => 49.99, 'grade' => 'C',  'point' => 2.00, 'remarks' => 'Satisfactory',         'color' => 'amber'],
        ['range' => '33% - 39%',  'min' => 33, 'max' => 39.99, 'grade' => 'D',  'point' => 1.00, 'remarks' => 'Passing',              'color' => 'orange'],
        ['range' => '0% - 32%',   'min' => 0,  'max' => 32.99, 'grade' => 'F',  'point' => 0.00, 'remarks' => 'Failed',               'color' => 'rose'],
    ];
}

/**
 * Calculate Bangladesh Letter Grade & Grade Point for a single subject
 */
function calculateBangladeshGrade($score, $totalMarks = 100) {
    $score = floatval($score);
    $totalMarks = floatval($totalMarks ?: 100);
    if ($totalMarks <= 0) $totalMarks = 100;
    
    $percentage = ($score / $totalMarks) * 100;
    
    if ($percentage >= 80) {
        return ['grade' => 'A+', 'point' => 5.00, 'remarks' => 'Outstanding', 'status' => 'Passed', 'percentage' => round($percentage, 2)];
    } elseif ($percentage >= 70) {
        return ['grade' => 'A',  'point' => 4.00, 'remarks' => 'Excellent',   'status' => 'Passed', 'percentage' => round($percentage, 2)];
    } elseif ($percentage >= 60) {
        return ['grade' => 'A-', 'point' => 3.50, 'remarks' => 'Very Good',   'status' => 'Passed', 'percentage' => round($percentage, 2)];
    } elseif ($percentage >= 50) {
        return ['grade' => 'B',  'point' => 3.00, 'remarks' => 'Good',        'status' => 'Passed', 'percentage' => round($percentage, 2)];
    } elseif ($percentage >= 40) {
        return ['grade' => 'C',  'point' => 2.00, 'remarks' => 'Satisfactory','status' => 'Passed', 'percentage' => round($percentage, 2)];
    } elseif ($percentage >= 33) {
        return ['grade' => 'D',  'point' => 1.00, 'remarks' => 'Passing',     'status' => 'Passed', 'percentage' => round($percentage, 2)];
    } else {
        return ['grade' => 'F',  'point' => 0.00, 'remarks' => 'Failed',      'status' => 'Failed', 'percentage' => round($percentage, 2)];
    }
}

/**
 * Calculate overall Bangladesh GPA & Final Grade
 * Bangladesh Board Rule: Any F in any subject causes overall GPA = 0.00 and Final Grade = F
 */
function calculateOverallBangladeshGpa($subjects) {
    if (empty($subjects)) {
        return [
            'gpa' => '0.00',
            'grade' => 'F',
            'status' => 'Failed',
            'total_full_marks' => 0,
            'total_obtained' => 0,
            'percentage' => 0,
            'remarks' => 'No subject records',
            'has_fail' => false
        ];
    }
    
    $hasFail = false;
    $totalPoints = 0;
    $count = count($subjects);
    $totalFull = 0;
    $totalObtained = 0;
    
    foreach ($subjects as $sub) {
        $full = floatval($sub['total_marks'] ?? 100);
        $obt = floatval($sub['score'] ?? 0);
        $totalFull += $full;
        $totalObtained += $obt;
        
        $grade = $sub['grade'] ?? '';
        $point = floatval($sub['point'] ?? 0);
        if ($grade === 'F' || $point <= 0) {
            $hasFail = true;
        }
        $totalPoints += $point;
    }
    
    $percentage = $totalFull > 0 ? round(($totalObtained / $totalFull) * 100, 2) : 0;
    
    if ($hasFail) {
        return [
            'gpa' => '0.00',
            'grade' => 'F',
            'status' => 'Failed',
            'total_full_marks' => $totalFull,
            'total_obtained' => $totalObtained,
            'percentage' => $percentage,
            'remarks' => 'Failed (Subject fail recorded)',
            'has_fail' => true
        ];
    }
    
    $rawGpa = $totalPoints / max(1, $count);
    if ($rawGpa > 5.0) $rawGpa = 5.0;
    $formattedGpa = number_format($rawGpa, 2);
    
    $finalGrade = 'F';
    $remarks = 'Failed';
    if ($rawGpa >= 5.0) {
        $finalGrade = 'A+';
        $remarks = 'Outstanding (Golden GPA 5.00)';
    } elseif ($rawGpa >= 4.0) {
        $finalGrade = 'A';
        $remarks = 'Excellent';
    } elseif ($rawGpa >= 3.5) {
        $finalGrade = 'A-';
        $remarks = 'Very Good';
    } elseif ($rawGpa >= 3.0) {
        $finalGrade = 'B';
        $remarks = 'Good';
    } elseif ($rawGpa >= 2.0) {
        $finalGrade = 'C';
        $remarks = 'Satisfactory';
    } elseif ($rawGpa >= 1.0) {
        $finalGrade = 'D';
        $remarks = 'Passing';
    }
    
    return [
        'gpa' => $formattedGpa,
        'grade' => $finalGrade,
        'status' => 'Passed',
        'total_full_marks' => $totalFull,
        'total_obtained' => $totalObtained,
        'percentage' => $percentage,
        'remarks' => $remarks,
        'has_fail' => false
    ];
}

function getGradingScaleInfo() {
    Response::success('Bangladesh Grading Scale retrieved', [
        'scale' => getBangladeshGradingScale(),
        'rules' => [
            'fail_rule' => 'A student receiving grade F in any subject is deemed Failed with overall GPA 0.00.',
            'gpa_calculation' => 'Overall GPA is the arithmetic mean of all subject grade points, rounded to 2 decimal places, maximum 5.00.',
            'pass_mark' => 'Minimum pass mark is 33% per subject.'
        ]
    ]);
}

/**
 * Retrieve School / Institute Details for Result Sheet Header
 */
function getInstituteDetails($db) {
    $siteName = 'ACADEMIA HIGH SCHOOL & COLLEGE';
    try {
        $setting = $db->fetchOne("SELECT setting_value FROM site_settings WHERE setting_key = 'site_name'");
        if ($setting && !empty($setting['setting_value'])) {
            $siteName = $setting['setting_value'];
        }
    } catch (Exception $e) {
        // Fallback default
    }
    
    return [
        'name' => $siteName,
        'address' => 'Dhaka, Bangladesh',
        'eiin' => '134208',
        'board' => 'Board of Intermediate and Secondary Education, Dhaka',
        'curriculum' => 'National Curriculum and Textbook Board (NCTB)',
        'phone' => '+880 1700-000000',
        'email' => 'info@academia.edu.bd',
        'website' => 'www.academia.edu.bd',
    ];
}

/**
 * List all results with Bangladesh grading decoration
 */
function getResults($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 10);
    $search = $_GET['search'] ?? '';
    $studentId = $_GET['student_id'] ?? '';
    $classId = $_GET['class_id'] ?? '';
    $examId = $_GET['exam_id'] ?? '';
    $assignmentId = $_GET['assignment_id'] ?? '';
    $gradeFilter = $_GET['grade'] ?? '';
    $statusFilter = $_GET['status'] ?? '';
    
    $offset = ($page - 1) * $limit;
    
    $sql = "SELECT r.*, 
                   st.name as student_name, st.surname as student_surname, st.username as student_roll, st.img as student_img,
                   st.class_id as student_class_id,
                   ex.title as exam_title, ex.total_marks as exam_total_marks,
                   asg.title as assignment_title,
                   COALESCE(s_ex.name, s_asg.name) as subject_name,
                   COALESCE(s_ex.id, s_asg.id) as subject_id,
                   COALESCE(c_ex.name, c_asg.name, c_st.name) as class_name,
                   COALESCE(c_ex.id, c_asg.id, c_st.id) as class_id,
                   COALESCE(t_ex.name, t_asg.name) as teacher_name,
                   COALESCE(t_ex.surname, t_asg.surname) as teacher_surname,
                   COALESCE(ex.start_time, asg.due_date) as date
            FROM results r
            INNER JOIN students st ON r.student_id = st.id
            LEFT JOIN classes c_st ON st.class_id = c_st.id
            LEFT JOIN exams ex ON r.exam_id = ex.id
            LEFT JOIN lessons l_ex ON ex.lesson_id = l_ex.id
            LEFT JOIN subjects s_ex ON COALESCE(ex.subject_id, l_ex.subject_id) = s_ex.id
            LEFT JOIN classes c_ex ON COALESCE(ex.class_id, l_ex.class_id) = c_ex.id
            LEFT JOIN teachers t_ex ON COALESCE(ex.teacher_id, l_ex.teacher_id) = t_ex.id
            LEFT JOIN assignments asg ON r.assignment_id = asg.id
            LEFT JOIN lessons l_asg ON asg.lesson_id = l_asg.id
            LEFT JOIN subjects s_asg ON COALESCE(asg.subject_id, l_asg.subject_id) = s_asg.id
            LEFT JOIN classes c_asg ON COALESCE(asg.class_id, l_asg.class_id) = c_asg.id
            LEFT JOIN teachers t_asg ON COALESCE(asg.teacher_id, l_asg.teacher_id) = t_asg.id
            WHERE 1=1";
    $params = [];

    if ($user['role'] === 'student') {
        $sql .= " AND r.student_id = ?";
        $params[] = $user['user_id'];
    } elseif ($user['role'] === 'parent') {
        $sql .= " AND st.parent_id = ?";
        $params[] = $user['user_id'];
    } elseif ($user['role'] === 'teacher') {
        $sql .= " AND (l_ex.teacher_id = ? OR l_asg.teacher_id = ? OR ex.teacher_id = ? OR asg.teacher_id = ?)";
        $params[] = $user['user_id'];
        $params[] = $user['user_id'];
        $params[] = $user['user_id'];
        $params[] = $user['user_id'];
    }
    
    if (!empty($search)) {
        $sql .= " AND (st.name LIKE ? OR st.surname LIKE ? OR st.username LIKE ? OR ex.title LIKE ? OR asg.title LIKE ? OR s_ex.name LIKE ? OR s_asg.name LIKE ?)";
        $searchTerm = "%{$search}%";
        $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm]);
    }
    
    if (!empty($studentId)) {
        $sql .= " AND r.student_id = ?";
        $params[] = $studentId;
    }
    
    if (!empty($classId) && $classId !== 'all') {
        $sql .= " AND (st.class_id = ? OR ex.class_id = ? OR asg.class_id = ?)";
        $params[] = $classId;
        $params[] = $classId;
        $params[] = $classId;
    }
    
    if (!empty($examId) && $examId !== 'all') {
        $sql .= " AND r.exam_id = ?";
        $params[] = $examId;
    }
    
    if (!empty($assignmentId) && $assignmentId !== 'all') {
        $sql .= " AND r.assignment_id = ?";
        $params[] = $assignmentId;
    }
    
    $countSql = "SELECT COUNT(*) as total FROM (" . $sql . ") as subquery";
    $totalResult = $db->fetchOne($countSql, $params);
    $total = $totalResult['total'] ?? 0;
    
    $sql .= " ORDER BY r.id DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    
    $rawResults = $db->fetchAll($sql, $params);
    
    // Decorate each item with Bangladesh grade, GP, remarks
    $results = [];
    $passedCount = 0;
    $failedCount = 0;
    $gpa5Count = 0;
    $gradeDist = ['A+' => 0, 'A' => 0, 'A-' => 0, 'B' => 0, 'C' => 0, 'D' => 0, 'F' => 0];
    
    foreach ($rawResults as $item) {
        $fullMarks = !empty($item['exam_total_marks']) ? intval($item['exam_total_marks']) : (!empty($item['total_marks']) ? intval($item['total_marks']) : 100);
        $score = intval($item['score']);
        
        $bd = calculateBangladeshGrade($score, $fullMarks);
        $item['total_marks'] = $fullMarks;
        $item['grade'] = $bd['grade'];
        $item['point'] = $bd['point'];
        $item['remarks'] = $bd['remarks'];
        $item['status'] = $bd['status'];
        $item['percentage'] = $bd['percentage'];
        
        if ($bd['status'] === 'Passed') $passedCount++;
        else $failedCount++;
        
        if ($bd['grade'] === 'A+') $gpa5Count++;
        if (isset($gradeDist[$bd['grade']])) $gradeDist[$bd['grade']]++;
        
        // Optional sub-mark totals
        $item['cq_marks'] = isset($item['cq_marks']) ? floatval($item['cq_marks']) : null;
        $item['mcq_marks'] = isset($item['mcq_marks']) ? floatval($item['mcq_marks']) : null;
        $item['practical_marks'] = isset($item['practical_marks']) ? floatval($item['practical_marks']) : null;
        
        // Filter by grade or status if applied on decorated fields
        if (!empty($gradeFilter) && $gradeFilter !== 'all' && $item['grade'] !== $gradeFilter) {
            continue;
        }
        if (!empty($statusFilter) && $statusFilter !== 'all' && strtolower($item['status']) !== strtolower($statusFilter)) {
            continue;
        }
        
        $results[] = $item;
    }
    
    $stats = [
        'total' => $total,
        'passed' => $passedCount,
        'failed' => $failedCount,
        'pass_rate' => $total > 0 ? round(($passedCount / max(1, count($rawResults))) * 100, 1) : 0,
        'gpa5_count' => $gpa5Count,
        'grade_distribution' => $gradeDist
    ];
    
    Response::success('Results retrieved successfully', [
        'results' => $results,
        'stats' => $stats,
        'grading_scale' => getBangladeshGradingScale(),
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

/**
 * Generate Individual Bangladesh Result Sheet / Academic Transcript (Marksheet)
 */
function generateResultSheet($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $studentId = $_GET['student_id'] ?? '';
    $examId = $_GET['exam_id'] ?? '';
    
    if (empty($studentId)) {
        if ($user['role'] === 'student') {
            $studentId = $user['user_id'];
        } else {
            Response::error('Student ID is required to generate a result sheet');
        }
    }
    
    // Role permissions check
    if ($user['role'] === 'student' && $studentId !== $user['user_id']) {
        Response::forbidden('Students may only view their own result sheet');
    }
    
    // Fetch student info
    $student = $db->fetchOne(
        "SELECT s.*, c.name as class_name, c.id as class_id, g.level as grade_level,
                p.name as parent_name, p.surname as parent_surname, p.phone as parent_phone
         FROM students s
         LEFT JOIN classes c ON s.class_id = c.id
         LEFT JOIN grades g ON s.grade_id = g.id
         LEFT JOIN parents p ON s.parent_id = p.id
         WHERE s.id = ?",
        [$studentId]
    );
    
    if (!$student) {
        Response::notFound('Student not found');
    }
    
    if ($user['role'] === 'parent' && $student['parent_id'] !== $user['user_id']) {
        Response::forbidden('Parents may only view their own child\'s result sheet');
    }
    
    // If no examId, find the latest exam student has results for
    if (empty($examId) || $examId === 'all') {
        $latestExam = $db->fetchOne(
            "SELECT ex.id FROM results r 
             JOIN exams ex ON r.exam_id = ex.id 
             WHERE r.student_id = ? 
             ORDER BY ex.start_time DESC LIMIT 1",
            [$studentId]
        );
        $examId = $latestExam ? $latestExam['id'] : null;
    }
    
    // Fetch exam info if available
    $exam = null;
    if ($examId) {
        $exam = $db->fetchOne("SELECT * FROM exams WHERE id = ?", [$examId]);
    }
    
    // Query all results of this student for this exam (or all exams if none specified)
    $query = "SELECT r.*,
                     COALESCE(s_ex.name, s_asg.name, 'General Subject') as subject_name,
                     COALESCE(s_ex.id, s_asg.id, r.id) as subject_id,
                     ex.title as exam_title,
                     COALESCE(ex.total_marks, r.total_marks, 100) as total_marks
              FROM results r
              LEFT JOIN exams ex ON r.exam_id = ex.id
              LEFT JOIN lessons l_ex ON ex.lesson_id = l_ex.id
              LEFT JOIN subjects s_ex ON COALESCE(ex.subject_id, l_ex.subject_id) = s_ex.id
              LEFT JOIN assignments asg ON r.assignment_id = asg.id
              LEFT JOIN lessons l_asg ON asg.lesson_id = l_asg.id
              LEFT JOIN subjects s_asg ON COALESCE(asg.subject_id, l_asg.subject_id) = s_asg.id
              WHERE r.student_id = ?";
    $params = [$studentId];
    
    if ($examId) {
        $query .= " AND r.exam_id = ?";
        $params[] = $examId;
    }
    
    $query .= " ORDER BY subject_name ASC";
    $rawResults = $db->fetchAll($query, $params);
    
    // Compute highest marks in class for each subject in this exam
    $highestMap = [];
    if (!empty($student['class_id']) && $examId) {
        $highestRows = $db->fetchAll(
            "SELECT COALESCE(s_ex.id, s_asg.id, r.id) as sub_id, MAX(r.score) as highest_score
             FROM results r
             INNER JOIN students st ON r.student_id = st.id
             LEFT JOIN exams ex ON r.exam_id = ex.id
             LEFT JOIN lessons l_ex ON ex.lesson_id = l_ex.id
             LEFT JOIN subjects s_ex ON COALESCE(ex.subject_id, l_ex.subject_id) = s_ex.id
             LEFT JOIN assignments asg ON r.assignment_id = asg.id
             LEFT JOIN lessons l_asg ON asg.lesson_id = l_asg.id
             LEFT JOIN subjects s_asg ON COALESCE(asg.subject_id, l_asg.subject_id) = s_asg.id
             WHERE st.class_id = ? AND r.exam_id = ?
             GROUP BY sub_id",
            [$student['class_id'], $examId]
        );
        foreach ($highestRows as $hr) {
            $highestMap[$hr['sub_id']] = intval($hr['highest_score']);
        }
    }
    
    // Decorate subjects
    $subjects = [];
    foreach ($rawResults as $row) {
        $full = intval($row['total_marks'] ?: 100);
        $score = intval($row['score']);
        $bd = calculateBangladeshGrade($score, $full);
        
        $subjects[] = [
            'id' => $row['id'],
            'subject_id' => $row['subject_id'],
            'subject_name' => $row['subject_name'],
            'exam_title' => $row['exam_title'] ?? ($exam['title'] ?? 'Exam'),
            'total_marks' => $full,
            'score' => $score,
            'cq_marks' => isset($row['cq_marks']) ? floatval($row['cq_marks']) : null,
            'mcq_marks' => isset($row['mcq_marks']) ? floatval($row['mcq_marks']) : null,
            'practical_marks' => isset($row['practical_marks']) ? floatval($row['practical_marks']) : null,
            'highest_in_class' => $highestMap[$row['subject_id']] ?? $score,
            'grade' => $bd['grade'],
            'point' => $bd['point'],
            'status' => $bd['status'],
            'remarks' => $bd['remarks'],
            'percentage' => $bd['percentage'],
        ];
    }
    
    // Overall GPA and result summary per Bangladesh standard
    $summary = calculateOverallBangladeshGpa($subjects);
    
    // Calculate class merit position (rank) if class and exam are available
    $meritPosition = '—';
    if (!empty($student['class_id']) && $examId) {
        // Fetch all students in the class with their scores for this exam
        $classmates = $db->fetchAll(
            "SELECT r.student_id, r.score, COALESCE(ex.total_marks, r.total_marks, 100) as total_marks
             FROM results r
             INNER JOIN students st ON r.student_id = st.id
             LEFT JOIN exams ex ON r.exam_id = ex.id
             WHERE st.class_id = ? AND r.exam_id = ?",
            [$student['class_id'], $examId]
        );
        
        $studentScores = [];
        foreach ($classmates as $cm) {
            $sId = $cm['student_id'];
            if (!isset($studentScores[$sId])) {
                $studentScores[$sId] = ['subs' => []];
            }
            $gradeInfo = calculateBangladeshGrade($cm['score'], $cm['total_marks']);
            $studentScores[$sId]['subs'][] = [
                'score' => $cm['score'],
                'total_marks' => $cm['total_marks'],
                'grade' => $gradeInfo['grade'],
                'point' => $gradeInfo['point']
            ];
        }
        
        // Calculate each classmate's GPA and Total
        $ranked = [];
        foreach ($studentScores as $sId => $data) {
            $gpaData = calculateOverallBangladeshGpa($data['subs']);
            $ranked[] = [
                'student_id' => $sId,
                'gpa' => floatval($gpaData['gpa']),
                'total' => $gpaData['total_obtained'],
                'status' => $gpaData['status']
            ];
        }
        
        // Sort by GPA descending, then Total Marks descending
        usort($ranked, function ($a, $b) {
            if ($a['status'] === 'Passed' && $b['status'] !== 'Passed') return -1;
            if ($a['status'] !== 'Passed' && $b['status'] === 'Passed') return 1;
            if ($b['gpa'] != $a['gpa']) {
                return ($b['gpa'] > $a['gpa']) ? 1 : -1;
            }
            return $b['total'] - $a['total'];
        });
        
        foreach ($ranked as $idx => $rItem) {
            if ($rItem['student_id'] === $studentId) {
                $rankNum = $idx + 1;
                $suffix = 'th';
                if ($rankNum % 10 == 1 && $rankNum % 100 != 11) $suffix = 'st';
                elseif ($rankNum % 10 == 2 && $rankNum % 100 != 12) $suffix = 'nd';
                elseif ($rankNum % 10 == 3 && $rankNum % 100 != 13) $suffix = 'rd';
                $meritPosition = "{$rankNum}{$suffix}";
                break;
            }
        }
    }
    $summary['merit_position'] = $meritPosition;
    
    $institute = getInstituteDetails($db);
    
    Response::success('Bangladesh result sheet generated successfully', [
        'student' => [
            'id' => $student['id'],
            'name' => $student['name'],
            'surname' => $student['surname'],
            'full_name' => trim("{$student['name']} {$student['surname']}"),
            'roll' => $student['username'] ?: $student['id'],
            'class_id' => $student['class_id'],
            'class_name' => $student['class_name'] ?: 'Standard',
            'grade_level' => $student['grade_level'] ?: '—',
            'section' => 'A',
            'img' => $student['img'],
            'blood_type' => $student['blood_type'],
            'sex' => $student['sex'],
            'parent_name' => trim("{$student['parent_name']} {$student['parent_surname']}"),
            'parent_phone' => $student['parent_phone'],
        ],
        'exam' => $exam ? [
            'id' => $exam['id'],
            'title' => $exam['title'],
            'date' => $exam['start_time'] ?? date('Y-m-d'),
            'total_marks' => $exam['total_marks'] ?? 100,
        ] : [
            'id' => 0,
            'title' => 'Annual Examination / Final Assessment',
            'date' => date('Y-m-d'),
            'total_marks' => 100,
        ],
        'institute' => $institute,
        'subjects' => $subjects,
        'summary' => $summary,
        'grading_scale' => getBangladeshGradingScale(),
        'generated_at' => date('d F, Y'),
    ]);
}

/**
 * Generate Class Broad-Sheet / Tabulation Sheet (ট্যাবুলেশন শিট)
 */
function generateTabulationSheet($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    
    $classId = $_GET['class_id'] ?? '';
    $examId = $_GET['exam_id'] ?? '';
    
    if (empty($classId)) {
        Response::error('Class ID is required for Tabulation Sheet');
    }
    
    $class = $db->fetchOne("SELECT c.*, g.level as grade_level FROM classes c LEFT JOIN grades g ON c.grade_id = g.id WHERE c.id = ?", [$classId]);
    if (!$class) {
        Response::notFound('Class not found');
    }
    
    $exam = null;
    if ($examId) {
        $exam = $db->fetchOne("SELECT * FROM exams WHERE id = ?", [$examId]);
    }
    
    // Fetch all students in this class
    $students = $db->fetchAll(
        "SELECT id, username, name, surname, img, sex 
         FROM students 
         WHERE class_id = ? 
         ORDER BY CAST(username AS UNSIGNED) ASC, name ASC",
        [$classId]
    );
    
    // Query all results for students in this class
    $resQuery = "SELECT r.*,
                        COALESCE(s_ex.name, s_asg.name, 'Subject') as subject_name,
                        COALESCE(s_ex.id, s_asg.id, r.id) as subject_id,
                        COALESCE(ex.total_marks, r.total_marks, 100) as total_marks
                 FROM results r
                 INNER JOIN students st ON r.student_id = st.id
                 LEFT JOIN exams ex ON r.exam_id = ex.id
                 LEFT JOIN lessons l_ex ON ex.lesson_id = l_ex.id
                 LEFT JOIN subjects s_ex ON COALESCE(ex.subject_id, l_ex.subject_id) = s_ex.id
                 LEFT JOIN assignments asg ON r.assignment_id = asg.id
                 LEFT JOIN lessons l_asg ON asg.lesson_id = l_asg.id
                 LEFT JOIN subjects s_asg ON COALESCE(asg.subject_id, l_asg.subject_id) = s_asg.id
                 WHERE st.class_id = ?";
    $resParams = [$classId];
    
    if ($examId) {
        $resQuery .= " AND r.exam_id = ?";
        $resParams[] = $examId;
    }
    
    $allResults = $db->fetchAll($resQuery, $resParams);
    
    // Collect distinct subjects
    $subjectsMap = [];
    $studentMarksMap = [];
    
    foreach ($allResults as $r) {
        $subId = $r['subject_id'];
        $subName = $r['subject_name'];
        if (!isset($subjectsMap[$subId])) {
            $subjectsMap[$subId] = [
                'id' => $subId,
                'name' => $subName,
                'total_marks' => intval($r['total_marks'] ?: 100)
            ];
        }
        
        $sId = $r['student_id'];
        if (!isset($studentMarksMap[$sId])) {
            $studentMarksMap[$sId] = [];
        }
        
        $bd = calculateBangladeshGrade($r['score'], $r['total_marks']);
        $studentMarksMap[$sId][$subId] = [
            'score' => intval($r['score']),
            'total_marks' => intval($r['total_marks'] ?: 100),
            'grade' => $bd['grade'],
            'point' => $bd['point'],
            'status' => $bd['status'],
        ];
    }
    
    $subjectList = array_values($subjectsMap);
    
    // Compute student summaries
    $tabulationRows = [];
    $gradeDist = ['A+' => 0, 'A' => 0, 'A-' => 0, 'B' => 0, 'C' => 0, 'D' => 0, 'F' => 0];
    $passedCount = 0;
    $failedCount = 0;
    
    foreach ($students as $st) {
        $sId = $st['id'];
        $marks = $studentMarksMap[$sId] ?? [];
        
        $subListForStudent = [];
        foreach ($marks as $m) {
            $subListForStudent[] = $m;
        }
        
        $summary = calculateOverallBangladeshGpa($subListForStudent);
        
        if ($summary['status'] === 'Passed') $passedCount++;
        else $failedCount++;
        
        if (isset($gradeDist[$summary['grade']])) {
            $gradeDist[$summary['grade']]++;
        }
        
        $tabulationRows[] = [
            'student_id' => $st['id'],
            'roll' => $st['username'] ?: $st['id'],
            'name' => trim("{$st['name']} {$st['surname']}"),
            'sex' => $st['sex'],
            'marks' => $marks,
            'total_obtained' => $summary['total_obtained'],
            'total_full_marks' => $summary['total_full_marks'],
            'percentage' => $summary['percentage'],
            'gpa' => $summary['gpa'],
            'grade' => $summary['grade'],
            'status' => $summary['status'],
            'has_fail' => $summary['has_fail'],
        ];
    }
    
    // Sort for merit rank
    usort($tabulationRows, function ($a, $b) {
        if ($a['status'] === 'Passed' && $b['status'] !== 'Passed') return -1;
        if ($a['status'] !== 'Passed' && $b['status'] === 'Passed') return 1;
        if (floatval($b['gpa']) != floatval($a['gpa'])) {
            return (floatval($b['gpa']) > floatval($a['gpa'])) ? 1 : -1;
        }
        return $b['total_obtained'] - $a['total_obtained'];
    });
    
    // Assign merit rank
    foreach ($tabulationRows as $idx => &$tRow) {
        if ($tRow['status'] === 'Passed') {
            $tRow['rank'] = $idx + 1;
        } else {
            $tRow['rank'] = 'F';
        }
    }
    unset($tRow);
    
    // Re-sort by roll number for traditional broad-sheet display
    usort($tabulationRows, function ($a, $b) {
        return strcmp($a['roll'], $b['roll']);
    });
    
    $institute = getInstituteDetails($db);
    
    Response::success('Tabulation sheet generated successfully', [
        'institute' => $institute,
        'class' => [
            'id' => $class['id'],
            'name' => $class['name'],
            'grade_level' => $class['grade_level'],
        ],
        'exam' => $exam ? [
            'id' => $exam['id'],
            'title' => $exam['title'],
            'date' => $exam['start_time'] ?? date('Y-m-d'),
        ] : [
            'id' => 0,
            'title' => 'Annual Examination / Final Assessment',
            'date' => date('Y-m-d'),
        ],
        'subjects' => $subjectList,
        'students' => $tabulationRows,
        'stats' => [
            'total_students' => count($students),
            'total_appeared' => count($studentMarksMap),
            'passed' => $passedCount,
            'failed' => $failedCount,
            'pass_rate' => count($students) > 0 ? round(($passedCount / max(1, count($studentMarksMap))) * 100, 1) : 0,
            'grade_distribution' => $gradeDist,
        ],
        'grading_scale' => getBangladeshGradingScale(),
        'generated_at' => date('d F, Y'),
    ]);
}

/**
 * Bulk Marks Entry for Class or Exam
 */
function bulkSaveResults($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    $input = json_decode(file_get_contents('php://input'), true);
    
    $examId = !empty($input['exam_id']) ? intval($input['exam_id']) : null;
    $assignmentId = !empty($input['assignment_id']) ? intval($input['assignment_id']) : null;
    $totalMarks = !empty($input['total_marks']) ? intval($input['total_marks']) : 100;
    $results = $input['results'] ?? [];
    
    if (!$examId && !$assignmentId) {
        Response::error('Either exam_id or assignment_id must be provided');
    }
    
    if (!is_array($results) || empty($results)) {
        Response::error('Results array is required and must not be empty');
    }
    
    $savedCount = 0;
    $updatedCount = 0;
    
    foreach ($results as $item) {
        $studentId = $item['student_id'] ?? '';
        $score = isset($item['score']) ? intval($item['score']) : null;
        
        if (empty($studentId) || $score === null) {
            continue;
        }
        
        $itemTotal = !empty($item['total_marks']) ? intval($item['total_marks']) : $totalMarks;
        $bd = calculateBangladeshGrade($score, $itemTotal);
        
        $cq = isset($item['cq_marks']) ? floatval($item['cq_marks']) : null;
        $mcq = isset($item['mcq_marks']) ? floatval($item['mcq_marks']) : null;
        $prac = isset($item['practical_marks']) ? floatval($item['practical_marks']) : null;
        
        // Check if result already exists
        $existing = null;
        if ($examId) {
            $existing = $db->fetchOne("SELECT id FROM results WHERE student_id = ? AND exam_id = ?", [$studentId, $examId]);
        } elseif ($assignmentId) {
            $existing = $db->fetchOne("SELECT id FROM results WHERE student_id = ? AND assignment_id = ?", [$studentId, $assignmentId]);
        }
        
        $recordData = [
            'score' => $score,
            'total_marks' => $itemTotal,
            'cq_marks' => $cq,
            'mcq_marks' => $mcq,
            'practical_marks' => $prac,
            'grade' => $bd['grade'],
            'point' => $bd['point'],
            'remarks' => $bd['remarks'],
        ];
        
        if ($existing) {
            $db->update('results', $recordData, 'id = ?', [$existing['id']]);
            $updatedCount++;
        } else {
            $recordData['exam_id'] = $examId;
            $recordData['assignment_id'] = $assignmentId;
            $recordData['student_id'] = $studentId;
            $db->insert('results', $recordData);
            $savedCount++;
        }
    }
    
    Response::success("Results recorded successfully ({$savedCount} added, {$updatedCount} updated)", [
        'added' => $savedCount,
        'updated' => $updatedCount,
        'total_processed' => $savedCount + $updatedCount
    ]);
}

/**
 * Single Result details
 */
function getResult($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher', 'student', 'parent']);
    
    $result = $db->fetchOne(
        "SELECT r.*, 
                st.name as student_name, st.surname as student_surname, st.username as student_roll, st.img as student_img,
                ex.title as exam_title, ex.total_marks as exam_total_marks,
                asg.title as assignment_title,
                COALESCE(s_ex.name, s_asg.name) as subject_name,
                COALESCE(c_ex.name, c_asg.name) as class_name
         FROM results r
         INNER JOIN students st ON r.student_id = st.id
         LEFT JOIN exams ex ON r.exam_id = ex.id
         LEFT JOIN lessons l_ex ON ex.lesson_id = l_ex.id
         LEFT JOIN subjects s_ex ON COALESCE(ex.subject_id, l_ex.subject_id) = s_ex.id
         LEFT JOIN classes c_ex ON COALESCE(ex.class_id, l_ex.class_id) = c_ex.id
         LEFT JOIN assignments asg ON r.assignment_id = asg.id
         LEFT JOIN lessons l_asg ON asg.lesson_id = l_asg.id
         LEFT JOIN subjects s_asg ON COALESCE(asg.subject_id, l_asg.subject_id) = s_asg.id
         LEFT JOIN classes c_asg ON COALESCE(asg.class_id, l_asg.class_id) = c_asg.id
         WHERE r.id = ?" . ($user['role'] === 'student' ? " AND st.id = ?" : ($user['role'] === 'parent' ? " AND st.parent_id = ?" : "")),
        $user['role'] === 'student'
            ? [$id, $user['user_id']]
            : ($user['role'] === 'parent' ? [$id, $user['user_id']] : [$id])
    );
    
    if (!$result) {
        Response::notFound('Result not found');
    }
    
    $full = !empty($result['exam_total_marks']) ? intval($result['exam_total_marks']) : (!empty($result['total_marks']) ? intval($result['total_marks']) : 100);
    $bd = calculateBangladeshGrade($result['score'], $full);
    $result['total_marks'] = $full;
    $result['grade'] = $bd['grade'];
    $result['point'] = $bd['point'];
    $result['remarks'] = $bd['remarks'];
    $result['status'] = $bd['status'];
    $result['percentage'] = $bd['percentage'];
    
    Response::success('Result retrieved successfully', [
        'result' => $result,
        'grading_scale' => getBangladeshGradingScale()
    ]);
}

/**
 * Create a new Result with Bangladesh grade calculation
 */
function createResult($db) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['score']) || empty($input['student_id'])) {
        Response::error('Score and student_id are required');
    }
    
    $examId = !empty($input['exam_id']) ? $input['exam_id'] : null;
    $assignmentId = !empty($input['assignment_id']) ? $input['assignment_id'] : null;
    
    if (!$examId && !$assignmentId) {
        Response::error('Either exam_id or assignment_id must be provided');
    }
    
    $totalMarks = !empty($input['total_marks']) ? intval($input['total_marks']) : 100;
    if ($examId) {
        $examRow = $db->fetchOne("SELECT total_marks FROM exams WHERE id = ?", [$examId]);
        if ($examRow && !empty($examRow['total_marks'])) {
            $totalMarks = intval($examRow['total_marks']);
        }
    }
    
    $score = intval($input['score']);
    $bd = calculateBangladeshGrade($score, $totalMarks);
    
    $data = [
        'score' => $score,
        'exam_id' => $examId,
        'assignment_id' => $assignmentId,
        'student_id' => $input['student_id'],
        'total_marks' => $totalMarks,
        'grade' => $bd['grade'],
        'point' => $bd['point'],
        'remarks' => $bd['remarks'],
    ];
    
    if (isset($input['cq_marks'])) $data['cq_marks'] = floatval($input['cq_marks']);
    if (isset($input['mcq_marks'])) $data['mcq_marks'] = floatval($input['mcq_marks']);
    if (isset($input['practical_marks'])) $data['practical_marks'] = floatval($input['practical_marks']);
    
    $resultId = $db->insert('results', $data);
    
    Response::success('Result recorded successfully with Bangladesh Grade ' . $bd['grade'], [
        'id' => $resultId,
        'grade' => $bd['grade'],
        'point' => $bd['point'],
        'status' => $bd['status']
    ], 201);
}

/**
 * Update an existing Result with Bangladesh grade calculation
 */
function updateResult($db, $id) {
    $user = AuthMiddleware::requireAnyRole(['admin', 'teacher']);
    $input = json_decode(file_get_contents('php://input'), true);
    
    $result = $db->fetchOne("SELECT * FROM results WHERE id = ?", [$id]);
    if (!$result) {
        Response::notFound('Result not found');
    }
    
    $data = [];
    $score = isset($input['score']) ? intval($input['score']) : intval($result['score']);
    $totalMarks = isset($input['total_marks']) ? intval($input['total_marks']) : intval($result['total_marks'] ?: 100);
    
    if (isset($input['score'])) $data['score'] = $score;
    if (isset($input['total_marks'])) $data['total_marks'] = $totalMarks;
    if (array_key_exists('exam_id', $input)) $data['exam_id'] = $input['exam_id'] ?: null;
    if (array_key_exists('assignment_id', $input)) $data['assignment_id'] = $input['assignment_id'] ?: null;
    if (isset($input['student_id'])) $data['student_id'] = $input['student_id'];
    if (isset($input['cq_marks'])) $data['cq_marks'] = floatval($input['cq_marks']);
    if (isset($input['mcq_marks'])) $data['mcq_marks'] = floatval($input['mcq_marks']);
    if (isset($input['practical_marks'])) $data['practical_marks'] = floatval($input['practical_marks']);
    
    // Recalculate Bangladesh Grade
    $bd = calculateBangladeshGrade($score, $totalMarks);
    $data['grade'] = $bd['grade'];
    $data['point'] = $bd['point'];
    $data['remarks'] = $bd['remarks'];
    
    $db->update('results', $data, 'id = ?', [$id]);
    Response::success('Result updated successfully (' . $bd['grade'] . ' / GP: ' . $bd['point'] . ')', [
        'grade' => $bd['grade'],
        'point' => $bd['point']
    ]);
}

/**
 * Delete a Result
 */
function deleteResult($db, $id) {
    $user = AuthMiddleware::requireRole('admin');
    
    $result = $db->fetchOne("SELECT * FROM results WHERE id = ?", [$id]);
    if (!$result) {
        Response::notFound('Result not found');
    }
    
    $db->delete('results', 'id = ?', [$id]);
    Response::success('Result deleted successfully');
}
