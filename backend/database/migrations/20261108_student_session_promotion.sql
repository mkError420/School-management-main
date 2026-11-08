-- Migration: Student Session Progression & Historical Academic / Fee Preservation Schema
-- Safe for import via phpMyAdmin, cPanel, or command line across all MySQL / MariaDB versions

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Safely add session_year column to students table if not exists
SET @col_exists_sess = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'session_year');
SET @sql_sess = IF(@col_exists_sess = 0, 'ALTER TABLE students ADD COLUMN session_year VARCHAR(50) DEFAULT \'2026-2027\' AFTER version', 'SELECT 1');
PREPARE stmt_sess FROM @sql_sess;
EXECUTE stmt_sess;
DEALLOCATE PREPARE stmt_sess;

-- 2. Safely add status column to students table if not exists
SET @col_exists_stat = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'status');
SET @sql_stat = IF(@col_exists_stat = 0, 'ALTER TABLE students ADD COLUMN status VARCHAR(50) DEFAULT \'ACTIVE\' AFTER session_year', 'SELECT 1');
PREPARE stmt_stat FROM @sql_stat;
EXECUTE stmt_stat;
DEALLOCATE PREPARE stmt_stat;

-- 3. Create student_session_history table
-- Note: Indexes on (student_id, session_year, class_id) provide blazing fast queries.
-- Foreign key constraint is intentionally avoided in the DDL to prevent MySQL errno 150 (collation/charset mismatch between tables on shared hosting).
CREATE TABLE IF NOT EXISTS student_session_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    session_year VARCHAR(50) NOT NULL,
    class_id INT NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    grade_id INT NULL,
    grade_level INT NULL,
    section VARCHAR(50) NULL,
    roll VARCHAR(50) NULL,
    version VARCHAR(50) DEFAULT 'Bangla',
    shift VARCHAR(50) DEFAULT 'Day',
    promotion_status ENUM('PROMOTED', 'RETAINED', 'PASSED_OUT', 'TRANSFERRED') NOT NULL DEFAULT 'PROMOTED',
    gpa DECIMAL(3,2) NULL,
    total_marks DECIMAL(7,2) NULL,
    grade_letter VARCHAR(10) NULL,
    merit_position INT NULL,
    attendance_total_days INT NOT NULL DEFAULT 0,
    attendance_present_days INT NOT NULL DEFAULT 0,
    attendance_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    fee_billed DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    fee_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    fee_due DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    fee_clearance_status ENUM('CLEARED', 'DUE') NOT NULL DEFAULT 'CLEARED',
    next_session_year VARCHAR(50) NULL,
    next_class_id INT NULL,
    next_class_name VARCHAR(100) NULL,
    next_roll VARCHAR(50) NULL,
    remarks TEXT NULL,
    promoted_by VARCHAR(255) NULL,
    promoted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ssh_student (student_id),
    INDEX idx_ssh_session (session_year),
    INDEX idx_ssh_class (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
