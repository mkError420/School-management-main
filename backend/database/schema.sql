-- School Management System Database Schema
-- MySQL Database
-- Note: This file creates tables in your existing database

SET FOREIGN_KEY_CHECKS = 0;

-- Users tables
CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'super_admin') NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    img VARCHAR(255),
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
    supervisor_id VARCHAR(255) DEFAULT NULL,
    grade_id INT NOT NULL,
    FOREIGN KEY (supervisor_id) REFERENCES teachers(id) ON DELETE SET NULL,
    FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE
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

CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    sender_role ENUM('admin', 'teacher', 'student', 'parent') NOT NULL,
    recipient_id VARCHAR(255) NOT NULL,
    recipient_role ENUM('admin', 'teacher', 'student', 'parent') NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_messages_conversation (conversation_id, created_at),
    INDEX idx_messages_recipient (recipient_id, recipient_role, created_at),
    INDEX idx_messages_sender (sender_id, sender_role, created_at)
);

CREATE TABLE IF NOT EXISTS message_attachments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message_id BIGINT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    storage_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(127) NOT NULL,
    file_size INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_message_attachments_message (message_id),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS site_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_no VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    date_of_birth DATE,
    gender ENUM('MALE', 'FEMALE') NOT NULL DEFAULT 'MALE',
    blood_type VARCHAR(10) DEFAULT 'A+',
    address TEXT,
    grade_id INT,
    class_id INT,
    parent_name VARCHAR(255),
    parent_phone VARCHAR(50),
    parent_email VARCHAR(255),
    parent_id VARCHAR(255),
    previous_school VARCHAR(255),
    status ENUM('PENDING', 'APPROVED', 'WAITLISTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    applied_date DATE NULL,
    enrolled_student_id VARCHAR(255),
    username VARCHAR(255) NULL,
    password VARCHAR(255) NULL,
    img VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES ('site_name', 'ACADEMIA');

-- Insert default admin user (password: admin123 - should be changed in production)
INSERT INTO admins (id, username, password) VALUES 
('admin001', 'admin', '$2y$12$dmjlIC/C2DyDhHvYOMZmgumXtNxBo/ub5egttmCaZ8YYhTgojsiFG')
ON DUPLICATE KEY UPDATE username=username;

INSERT INTO admins (id, username, email, password, role) VALUES
('super-admin-001', 'mk.rabbani.cse', 'mk.rabbani.cse@gmail.com', '$2y$12$f/6vmqM/Gay2PVwQnYJX0.a3ykAHLVtToQ3jpLs4Y9pkpnOmwq5Pm', 'super_admin')
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

-- Fees management tables
CREATE TABLE IF NOT EXISTS fee_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NULL,
    default_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    frequency ENUM('ONE_TIME', 'MONTHLY', 'TERMLY', 'ANNUALLY') NOT NULL DEFAULT 'MONTHLY',
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fee_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_no VARCHAR(60) UNIQUE NOT NULL,
    student_id VARCHAR(255) NOT NULL,
    fee_category_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('PAID', 'PARTIAL', 'UNPAID', 'OVERDUE') NOT NULL DEFAULT 'UNPAID',
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026-2027',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fee_student (student_id),
    INDEX idx_fee_category (fee_category_id),
    INDEX idx_fee_status (status),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (fee_category_id) REFERENCES fee_categories(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS fee_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receipt_no VARCHAR(60) UNIQUE NOT NULL,
    invoice_id INT NOT NULL,
    student_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('CASH', 'BANK_TRANSFER', 'CARD', 'MOBILE_BANKING', 'CHEQUE', 'OTHER') NOT NULL DEFAULT 'CASH',
    transaction_ref VARCHAR(100) NULL,
    payment_date DATE NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pay_invoice (invoice_id),
    INDEX idx_pay_student (student_id),
    INDEX idx_pay_date (payment_date),
    FOREIGN KEY (invoice_id) REFERENCES fee_invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

INSERT IGNORE INTO fee_categories (name, code, description, default_amount, frequency, status) VALUES
('Monthly Tuition Fee', 'TUIT', 'Standard monthly academic tuition fee', 150.00, 'MONTHLY', 'ACTIVE'),
('Admission / Enrollment Fee', 'ADMS', 'One-time admission registration fee', 350.00, 'ONE_TIME', 'ACTIVE'),
('Term Examination Fee', 'EXAM', 'Comprehensive term evaluation and exam fee', 50.00, 'TERMLY', 'ACTIVE'),
('School Transport Fee', 'TRAN', 'Bus route pickup and drop-off facility', 80.00, 'MONTHLY', 'ACTIVE'),
('Library & Learning Resources', 'LIBR', 'Annual library membership and digital catalog access', 30.00, 'ANNUALLY', 'ACTIVE'),
('Computer & Science Lab Fee', 'LAB', 'Practical laboratory materials and computer system maintenance', 45.00, 'TERMLY', 'ACTIVE'),
('Sports & Extra-Curricular', 'SPRT', 'Clubs, athletic training, and sports equipment', 40.00, 'ANNUALLY', 'ACTIVE'),
('Uniform & Study Pack', 'UNIF', 'School uniform sets, badge, and textbooks', 120.00, 'ONE_TIME', 'ACTIVE');

-- Expenses management tables
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expense_no VARCHAR(60) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category ENUM('SALARY', 'UTILITIES', 'MAINTENANCE', 'SUPPLIES', 'TRANSPORT', 'MARKETING', 'EVENTS', 'OTHER') NOT NULL DEFAULT 'SUPPLIES',
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('PENDING', 'APPROVED', 'PAID', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    payment_method ENUM('CASH', 'BANK_TRANSFER', 'CARD', 'MOBILE_BANKING', 'CHEQUE', 'OTHER') NOT NULL DEFAULT 'CASH',
    vendor VARCHAR(255) NULL,
    expense_date DATE NOT NULL,
    due_date DATE NULL,
    paid_date DATE NULL,
    transaction_ref VARCHAR(100) NULL,
    receipt_url VARCHAR(255) NULL,
    notes TEXT NULL,
    created_by VARCHAR(255) NULL,
    approved_by VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_exp_status (status),
    INDEX idx_exp_category (category),
    INDEX idx_exp_date (expense_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
