<?php

// Unified Global Search API
$db = Database::getInstance();
$user = AuthMiddleware::requireAnyRole(['admin', 'super_admin', 'teacher', 'student', 'parent']);

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'GET') {
    Response::error('Method not allowed', 405);
}

$query = trim($_GET['q'] ?? $_GET['query'] ?? $_GET['search'] ?? '');
$categoryFilter = strtolower(trim($_GET['type'] ?? $_GET['category'] ?? 'all'));
$limit = max(1, min(20, intval($_GET['limit'] ?? 5)));

if ($query === '') {
    Response::success('Search query is empty', [
        'query' => '',
        'total' => 0,
        'results' => [],
        'categories' => [
            'students' => [],
            'teachers' => [],
            'courses' => [],
            'classes' => [],
            'lessons' => [],
            'announcements' => [],
            'events' => [],
            'exams' => [],
            'assignments' => []
        ]
    ]);
}

$searchLike = '%' . $query . '%';
$categories = [
    'students' => [],
    'teachers' => [],
    'courses' => [],
    'classes' => [],
    'lessons' => [],
    'announcements' => [],
    'events' => [],
    'exams' => [],
    'assignments' => []
];

// 1. Search Students
if ($categoryFilter === 'all' || $categoryFilter === 'students') {
    try {
        $sql = "SELECT s.id, s.roll, s.name, s.surname, s.email, s.phone, s.img, c.name as class_name
                FROM students s
                LEFT JOIN classes c ON s.class_id = c.id
                WHERE s.name LIKE ? 
                   OR s.surname LIKE ? 
                   OR CONCAT(s.name, ' ', s.surname) LIKE ? 
                   OR s.id LIKE ? 
                   OR (s.roll IS NOT NULL AND s.roll LIKE ?) 
                   OR (s.email IS NOT NULL AND s.email LIKE ?)
                ORDER BY s.name ASC, s.surname ASC
                LIMIT {$limit}";
        $rows = $db->fetchAll($sql, [$searchLike, $searchLike, $searchLike, $searchLike, $searchLike, $searchLike]);
        foreach ($rows as $r) {
            $categories['students'][] = [
                'id' => $r['id'],
                'type' => 'student',
                'title' => trim($r['name'] . ' ' . $r['surname']),
                'subtitle' => 'ID: ' . $r['id'] . (!empty($r['roll']) ? ' • Roll: ' . $r['roll'] : '') . (!empty($r['class_name']) ? ' • ' . $r['class_name'] : ''),
                'badge' => $r['class_name'] ?? 'Student',
                'img' => !empty($r['img']) ? $r['img'] : null,
                'url' => '/list/students/' . $r['id'],
                'list_url' => '/list/students?search=' . urlencode($query)
            ];
        }
    } catch (Exception $e) {}
}

// 2. Search Teachers
if ($categoryFilter === 'all' || $categoryFilter === 'teachers') {
    try {
        $sql = "SELECT t.id, t.name, t.surname, t.email, t.phone, t.img
                FROM teachers t
                WHERE t.name LIKE ? 
                   OR t.surname LIKE ? 
                   OR CONCAT(t.name, ' ', t.surname) LIKE ? 
                   OR t.id LIKE ? 
                   OR (t.email IS NOT NULL AND t.email LIKE ?) 
                   OR (t.phone IS NOT NULL AND t.phone LIKE ?)
                ORDER BY t.name ASC, t.surname ASC
                LIMIT {$limit}";
        $rows = $db->fetchAll($sql, [$searchLike, $searchLike, $searchLike, $searchLike, $searchLike, $searchLike]);
        foreach ($rows as $r) {
            $categories['teachers'][] = [
                'id' => $r['id'],
                'type' => 'teacher',
                'title' => trim($r['name'] . ' ' . $r['surname']),
                'subtitle' => !empty($r['email']) ? $r['email'] : (!empty($r['phone']) ? $r['phone'] : 'Teacher'),
                'badge' => 'Teacher',
                'img' => !empty($r['img']) ? $r['img'] : null,
                'url' => '/list/teachers/' . $r['id'],
                'list_url' => '/list/teachers?search=' . urlencode($query)
            ];
        }
    } catch (Exception $e) {}
}

// 3. Search Courses / Subjects
if ($categoryFilter === 'all' || $categoryFilter === 'courses' || $categoryFilter === 'subjects') {
    try {
        $sql = "SELECT sub.id, sub.name
                FROM subjects sub
                WHERE sub.name LIKE ?
                ORDER BY sub.name ASC
                LIMIT {$limit}";
        $rows = $db->fetchAll($sql, [$searchLike]);
        foreach ($rows as $r) {
            $categories['courses'][] = [
                'id' => $r['id'],
                'type' => 'course',
                'title' => $r['name'],
                'subtitle' => 'Subject Course',
                'badge' => 'Course',
                'img' => null,
                'url' => '/list/subjects?search=' . urlencode($r['name']),
                'list_url' => '/list/subjects?search=' . urlencode($query)
            ];
        }
    } catch (Exception $e) {}
}

// 4. Search Classes
if ($categoryFilter === 'all' || $categoryFilter === 'classes') {
    try {
        $sql = "SELECT c.id, c.name, c.capacity, g.level as grade_level
                FROM classes c
                LEFT JOIN grades g ON c.grade_id = g.id
                WHERE c.name LIKE ?
                ORDER BY c.name ASC
                LIMIT {$limit}";
        $rows = $db->fetchAll($sql, [$searchLike]);
        foreach ($rows as $r) {
            $categories['classes'][] = [
                'id' => $r['id'],
                'type' => 'class',
                'title' => $r['name'],
                'subtitle' => 'Class • Capacity: ' . $r['capacity'] . (!empty($r['grade_level']) ? ' (Grade ' . $r['grade_level'] . ')' : ''),
                'badge' => 'Class',
                'img' => null,
                'url' => '/list/classes?search=' . urlencode($r['name']),
                'list_url' => '/list/classes?search=' . urlencode($query)
            ];
        }
    } catch (Exception $e) {}
}

// 5. Search Lessons
if ($categoryFilter === 'all' || $categoryFilter === 'lessons') {
    try {
        $sql = "SELECT l.id, l.name, l.day, sub.name as subject_name, c.name as class_name
                FROM lessons l
                LEFT JOIN subjects sub ON l.subject_id = sub.id
                LEFT JOIN classes c ON l.class_id = c.id
                WHERE l.name LIKE ? OR (sub.name IS NOT NULL AND sub.name LIKE ?)
                ORDER BY l.name ASC
                LIMIT {$limit}";
        $rows = $db->fetchAll($sql, [$searchLike, $searchLike]);
        foreach ($rows as $r) {
            $categories['lessons'][] = [
                'id' => $r['id'],
                'type' => 'lesson',
                'title' => $r['name'],
                'subtitle' => (!empty($r['subject_name']) ? $r['subject_name'] . ' • ' : '') . $r['day'] . (!empty($r['class_name']) ? ' (' . $r['class_name'] . ')' : ''),
                'badge' => 'Lesson',
                'img' => null,
                'url' => '/list/lessons?search=' . urlencode($r['name']),
                'list_url' => '/list/lessons?search=' . urlencode($query)
            ];
        }
    } catch (Exception $e) {}
}

// 6. Search Announcements
if ($categoryFilter === 'all' || $categoryFilter === 'announcements') {
    try {
        $sql = "SELECT a.id, a.title, a.date, a.description, c.name as class_name
                FROM announcements a
                LEFT JOIN classes c ON a.class_id = c.id
                WHERE a.title LIKE ? OR a.description LIKE ?
                ORDER BY a.date DESC
                LIMIT {$limit}";
        $rows = $db->fetchAll($sql, [$searchLike, $searchLike]);
        foreach ($rows as $r) {
            $categories['announcements'][] = [
                'id' => $r['id'],
                'type' => 'announcement',
                'title' => $r['title'],
                'subtitle' => 'Notice • ' . $r['date'] . (!empty($r['class_name']) ? ' (' . $r['class_name'] . ')' : ' (School-Wide)'),
                'badge' => 'Notice',
                'img' => null,
                'url' => '/list/announcements?search=' . urlencode($r['title']),
                'list_url' => '/list/announcements?search=' . urlencode($query)
            ];
        }
    } catch (Exception $e) {}
}

// 7. Search Events
if ($categoryFilter === 'all' || $categoryFilter === 'events') {
    try {
        $sql = "SELECT e.id, e.title, e.start_time, c.name as class_name
                FROM events e
                LEFT JOIN classes c ON e.class_id = c.id
                WHERE e.title LIKE ?
                ORDER BY e.start_time DESC
                LIMIT {$limit}";
        $rows = $db->fetchAll($sql, [$searchLike]);
        foreach ($rows as $r) {
            $categories['events'][] = [
                'id' => $r['id'],
                'type' => 'event',
                'title' => $r['title'],
                'subtitle' => 'Event • ' . substr($r['start_time'], 0, 10) . (!empty($r['class_name']) ? ' (' . $r['class_name'] . ')' : ''),
                'badge' => 'Event',
                'img' => null,
                'url' => '/list/events?search=' . urlencode($r['title']),
                'list_url' => '/list/events?search=' . urlencode($query)
            ];
        }
    } catch (Exception $e) {}
}

// 8. Search Exams
if ($categoryFilter === 'all' || $categoryFilter === 'exams') {
    try {
        $sql = "SELECT ex.id, ex.title, ex.start_time, l.name as lesson_name
                FROM exams ex
                LEFT JOIN lessons l ON ex.lesson_id = l.id
                WHERE ex.title LIKE ?
                ORDER BY ex.start_time DESC
                LIMIT {$limit}";
        $rows = $db->fetchAll($sql, [$searchLike]);
        foreach ($rows as $r) {
            $categories['exams'][] = [
                'id' => $r['id'],
                'type' => 'exam',
                'title' => $r['title'],
                'subtitle' => 'Exam' . (!empty($r['lesson_name']) ? ' • Lesson: ' . $r['lesson_name'] : ''),
                'badge' => 'Exam',
                'img' => null,
                'url' => '/list/exams?search=' . urlencode($r['title']),
                'list_url' => '/list/exams?search=' . urlencode($query)
            ];
        }
    } catch (Exception $e) {}
}

// 9. Search Assignments
if ($categoryFilter === 'all' || $categoryFilter === 'assignments') {
    try {
        $sql = "SELECT ass.id, ass.title, ass.due_date, c.name as class_name
                FROM assignments ass
                LEFT JOIN classes c ON ass.class_id = c.id
                WHERE ass.title LIKE ?
                ORDER BY ass.due_date DESC
                LIMIT {$limit}";
        $rows = $db->fetchAll($sql, [$searchLike]);
        foreach ($rows as $r) {
            $categories['assignments'][] = [
                'id' => $r['id'],
                'type' => 'assignment',
                'title' => $r['title'],
                'subtitle' => 'Assignment' . (!empty($r['due_date']) ? ' • Due: ' . substr($r['due_date'], 0, 10) : ''),
                'badge' => 'Assignment',
                'img' => null,
                'url' => '/list/assignments?search=' . urlencode($r['title']),
                'list_url' => '/list/assignments?search=' . urlencode($query)
            ];
        }
    } catch (Exception $e) {}
}

// Flatten results for easy consumption
$flatResults = [];
foreach ($categories as $catItems) {
    foreach ($catItems as $item) {
        $flatResults[] = $item;
    }
}

Response::success('Search results retrieved', [
    'query' => $query,
    'total' => count($flatResults),
    'results' => $flatResults,
    'categories' => $categories
]);
