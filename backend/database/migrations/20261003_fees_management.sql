-- Migration: Add Fees Management tables and default categories
-- Tables: fee_categories, fee_invoices, fee_payments
-- Safe for importing into any existing database / phpMyAdmin

SET FOREIGN_KEY_CHECKS = 0;

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
    INDEX idx_fee_status (status)
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
    INDEX idx_pay_date (payment_date)
);

-- Insert default fee categories
INSERT IGNORE INTO fee_categories (name, code, description, default_amount, frequency, status) VALUES
('Monthly Tuition Fee', 'TUIT', 'Standard monthly academic tuition fee', 150.00, 'MONTHLY', 'ACTIVE'),
('Admission / Enrollment Fee', 'ADMS', 'One-time admission registration fee', 350.00, 'ONE_TIME', 'ACTIVE'),
('Term Examination Fee', 'EXAM', 'Comprehensive term evaluation and exam fee', 50.00, 'TERMLY', 'ACTIVE'),
('School Transport Fee', 'TRAN', 'Bus route pickup and drop-off facility', 80.00, 'MONTHLY', 'ACTIVE'),
('Library & Learning Resources', 'LIBR', 'Annual library membership and digital catalog access', 30.00, 'ANNUALLY', 'ACTIVE'),
('Computer & Science Lab Fee', 'LAB', 'Practical laboratory materials and computer system maintenance', 45.00, 'TERMLY', 'ACTIVE'),
('Sports & Extra-Curricular', 'SPRT', 'Clubs, athletic training, and sports equipment', 40.00, 'ANNUALLY', 'ACTIVE'),
('Uniform & Study Pack', 'UNIF', 'School uniform sets, badge, and textbooks', 120.00, 'ONE_TIME', 'ACTIVE');

-- Add foreign key constraints safely if the database collation and engine allow
SET @has_fk_fee_student = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_fee_student'
);
SET @sql_fk_fee_student = IF(
    @has_fk_fee_student = 0,
    'ALTER TABLE fee_invoices ADD CONSTRAINT fk_fee_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE',
    'SELECT 1'
);
PREPARE stmt_fee_student FROM @sql_fk_fee_student;
EXECUTE stmt_fee_student;
DEALLOCATE PREPARE stmt_fee_student;

SET @has_fk_fee_category = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_fee_category'
);
SET @sql_fk_fee_category = IF(
    @has_fk_fee_category = 0,
    'ALTER TABLE fee_invoices ADD CONSTRAINT fk_fee_category FOREIGN KEY (fee_category_id) REFERENCES fee_categories(id) ON DELETE RESTRICT',
    'SELECT 1'
);
PREPARE stmt_fee_category FROM @sql_fk_fee_category;
EXECUTE stmt_fee_category;
DEALLOCATE PREPARE stmt_fee_category;

SET @has_fk_pay_invoice = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_pay_invoice'
);
SET @sql_fk_pay_invoice = IF(
    @has_fk_pay_invoice = 0,
    'ALTER TABLE fee_payments ADD CONSTRAINT fk_pay_invoice FOREIGN KEY (invoice_id) REFERENCES fee_invoices(id) ON DELETE CASCADE',
    'SELECT 1'
);
PREPARE stmt_pay_invoice FROM @sql_fk_pay_invoice;
EXECUTE stmt_pay_invoice;
DEALLOCATE PREPARE stmt_pay_invoice;

SET @has_fk_pay_student = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_pay_student'
);
SET @sql_fk_pay_student = IF(
    @has_fk_pay_student = 0,
    'ALTER TABLE fee_payments ADD CONSTRAINT fk_pay_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE',
    'SELECT 1'
);
PREPARE stmt_pay_student FROM @sql_fk_pay_student;
EXECUTE stmt_pay_student;
DEALLOCATE PREPARE stmt_pay_student;

SET FOREIGN_KEY_CHECKS = 1;
