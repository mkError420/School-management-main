-- School Management System Database Schema
-- MySQL Database

CREATE DATABASE IF NOT EXISTS school_management;
USE school_management;

-- Users tables
CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    surname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(255) UNIQUE,
    address TEXT NOT NULL,
    img VARCHAR(255),
    blood_type VARCHAR(10) NOT NULL,
    sex ENUM('MALE', 'FEMALE') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    parent_id VARCHAR(255) NOT NULL,
    class_id INT NOT NULL,
    grade_id INT NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teachers (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    surname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(255) UNIQUE,
    address TEXT NOT NULL,
    img VARCHAR(255),
    blood_type VARCHAR(10) NOT NULL,
    sex ENUM('MALE', 'FEMALE') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parents (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    surname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(255) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Academic structure tables
CREATE TABLE IF NOT EXISTS grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level INT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    capacity INT NOT NULL,
    supervisor_id VARCHAR(255) NOT NULL,
    grade_id INT NOT NULL,
    FOREIGN KEY (supervisor_id) REFERENCES teachers(id) ON DELETE SET NULL,
    FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

-- Teacher-Subject relationship (many-to-many)
CREATE TABLE IF NOT EXISTS teacher_subjects (
    teacher_id VARCHAR(255) NOT NULL,
    subject_id INT NOT NULL,
    PRIMARY KEY (teacher_id, subject_id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Teacher-Class relationship (many-to-many)
CREATE TABLE IF NOT EXISTS teacher_classes (
    teacher_id VARCHAR(255) NOT NULL,
    class_id INT NOT NULL,
    PRIMARY KEY (teacher_id, class_id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Academic activities tables
CREATE TABLE IF NOT EXISTS lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    day ENUM('SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY') NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    subject_id INT NOT NULL,
    class_id INT NOT NULL,
    teacher_id VARCHAR(255) NOT NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    lesson_id INT NOT NULL,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    start_date DATETIME NOT NULL,
    due_date DATETIME NOT NULL,
    lesson_id INT NOT NULL,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    score INT NOT NULL,
    exam_id INT,
    assignment_id INT,
    student_id VARCHAR(255) NOT NULL,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT chk_result_type CHECK (
        (exam_id IS NOT NULL AND assignment_id IS NULL) OR
        (exam_id IS NULL AND assignment_id IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    present BOOLEAN NOT NULL DEFAULT FALSE,
    student_id VARCHAR(255) NOT NULL,
    lesson_id INT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (student_id, lesson_id, date)
);

CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    class_id INT,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    class_id INT,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Insert default admin user (password: admin123 - should be changed in production)
INSERT INTO admins (id, username, password) VALUES 
('admin001', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON DUPLICATE KEY UPDATE username=username;

-- Insert default grades
INSERT INTO grades (level) VALUES 
(1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11), (12)
ON DUPLICATE KEY UPDATE level=level;

-- Insert default subjects
INSERT INTO subjects (name) VALUES 
('Math'), ('English'), ('Physics'), ('Chemistry'), ('Biology'), 
('History'), ('Geography'), ('Art'), ('Music'), ('Literature'),
('Computer Science'), ('Physical Education')
ON DUPLICATE KEY UPDATE name=name;
