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
    late_fine DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH',
    transaction_ref VARCHAR(100) NULL,
    payment_date DATE NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pay_invoice (invoice_id),
    INDEX idx_pay_student (student_id),
    INDEX idx_pay_date (payment_date)
);

-- Insert default fee categories for Bangladesh School / College
INSERT IGNORE INTO fee_categories (name, code, description, default_amount, frequency, status) VALUES
('Monthly Tuition Fee (মাসিক বেতন)', 'TUIT', 'মাসিক নিয়মিত একাডেমিক বেতন (Monthly Academic Tuition Fee)', 800.00, 'MONTHLY', 'ACTIVE'),
('Admission Fee (ভর্তি ফি)', 'ADMS', 'নতুন শিক্ষার্থী ভর্তি ও রেজিস্ট্রেশন ফি (New Admission Registration)', 2500.00, 'ONE_TIME', 'ACTIVE'),
('Session Charge / Re-Admission (সেশন ফি / পুনর্ভর্তি)', 'SESS', 'বার্ষিক সেশন চার্জ ও পুনর্ভর্তি ফি (Annual Session Charge & Re-admission)', 2000.00, 'ANNUALLY', 'ACTIVE'),
('1st Term Exam Fee (১ম সাময়িক পরীক্ষা ফি)', 'EXAM1', '১ম সাময়িক / মিড-টার্ম পরীক্ষা মূল্যায়ন ও খাতা-প্রশ্ন ফি', 450.00, 'TERMLY', 'ACTIVE'),
('Half-Yearly Exam Fee (অর্ধবার্ষিক পরীক্ষা ফি)', 'EXAM2', 'অর্ধবার্ষিক পরীক্ষা মূল্যায়ন ফি (Half-Yearly Evaluation)', 500.00, 'TERMLY', 'ACTIVE'),
('Annual / Final Exam Fee (বার্ষিক / ফাইনাল পরীক্ষা ফি)', 'EXAM_FIN', 'চূড়ান্ত বার্ষিক পরীক্ষা ফি (Year Final Exam Evaluation)', 600.00, 'ANNUALLY', 'ACTIVE'),
('Pre-Test & Test Exam Fee (প্রাক-নির্বাচনী ও টেস্ট পরীক্ষা ফি)', 'TEST_EXAM', 'এসএসসি / এইচএসসি নির্বাচনী পরীক্ষা মূল্যায়ন ফি', 700.00, 'TERMLY', 'ACTIVE'),
('Board Registration Fee (বোর্ড রেজিস্ট্রেশন ফি)', 'BD_REG', 'শিক্ষা বোর্ড রেজিস্ট্রেশন ও প্রত্যয়ন ফি (JSC/SSC/HSC Board Registration)', 850.00, 'ONE_TIME', 'ACTIVE'),
('Board Form Fill-up & Center Fee (বোর্ড ফরম পূরণ ও কেন্দ্র ফি)', 'BD_FORM', 'বোর্ড ফাইনাল পরীক্ষার ফরম পূরণ ও কেন্দ্র ফি', 2200.00, 'ONE_TIME', 'ACTIVE'),
('ICT & Computer Lab Fee (আইসিটি ও কম্পিউটার ল্যাব ফি)', 'ICT_LAB', 'ডিজিটাল কম্পিউটার ল্যাব ব্যবহার ও আইসিটি প্রশিক্ষণ ফি', 250.00, 'MONTHLY', 'ACTIVE'),
('Science Practical Lab Fee (বিজ্ঞানাগার ল্যাব ফি)', 'SCI_LAB', 'পদার্থ, রসায়ন, জীববিজ্ঞান ও ব্যবহারিক ল্যাব ফি', 300.00, 'TERMLY', 'ACTIVE'),
('Digital ID Card & Lanyard (ডিজিটাল আইডি কার্ড ও ফিতা)', 'ID_CARD', 'স্মার্ট শিক্ষার্থী পরিচয়পত্র ও ফিতা ফি', 150.00, 'ONE_TIME', 'ACTIVE'),
('Diary, Syllabus & Calendar (ডায়েরি, সিলেবাস ও ক্যালেন্ডার)', 'DIARY_SYL', 'বিদ্যালয় ডায়েরি, বাৎসরিক একাডেমিক সিলেবাস ও ক্যালেন্ডার ফি', 200.00, 'ANNUALLY', 'ACTIVE'),
('Sports, Cultural & Scout Fund (ক্রীড়া, সাংস্কৃতিক ও স্কাউট)', 'SPRT_CLT', 'বার্ষিক ক্রীড়া প্রতিযোগিতা, সাংস্কৃতিক সপ্তাহ ও স্কাউট/রোভার ফান্ড', 350.00, 'ANNUALLY', 'ACTIVE'),
('Library & Reading Room (লাইব্রেরি ও রিডিং রুম)', 'LIBR', 'গ্রন্থাগার উন্নয়ন ও নিয়মিত বই ইস্যু সেবা ফি', 150.00, 'ANNUALLY', 'ACTIVE'),
('Religious & Milad / Puja Fund (ধর্মীয় ও মিলাদ তহবিল)', 'RELG_FND', 'ধর্মীয় অনুষ্ঠান, মিলাদ মাহফিল ও পূজা উদযাপন ফান্ড', 120.00, 'ANNUALLY', 'ACTIVE'),
('School Development & Mosque (উন্নয়ন ও মসজিদ তহবিল)', 'DEV_MOSQ', 'প্রতিষ্ঠান উন্নয়ন, অবকাঠামো সংস্কার ও মসজিদ তহবিল', 300.00, 'ANNUALLY', 'ACTIVE'),
('Transport / Bus Service Fee (পরিবহন / বাস সার্ভিস ফি)', 'TRAN', 'স্কুল ও কলেজ বাস যাতায়াত সার্ভিস ফি (Monthly Transport)', 1200.00, 'MONTHLY', 'ACTIVE'),
('Hostel & Dining Charge (হোস্টেল ও আবাসিক মেস ফি)', 'HOSTEL', 'আবাসিক ছাত্রাবাস সিট ভাড়া ও নিয়মিত ডাইনিং মেস ফি', 4500.00, 'MONTHLY', 'ACTIVE'),
('Coaching & Special Class Fee (বিশেষ কোচিং ফি)', 'COACHING', 'দুর্বল শিক্ষার্থীদের বিশেষ কোচিং ও অতিরিক্ত ক্লাস ফি', 1000.00, 'MONTHLY', 'ACTIVE'),
('Certificate & TC Fee (প্রশংসাপত্র ও ছাড়পত্র ফি)', 'CERT_TC', 'মূল প্রশংসাপত্র, প্রত্যয়ন পত্র ও ছাড়পত্র (TC) ফি', 250.00, 'ONE_TIME', 'ACTIVE'),
('Late Payment Fine (বিলম্ব ফি / জরিমানা)', 'LATE_FINE', 'নির্ধারিত তারিখের পর বিল পরিশোধের বিলম্ব জরিমানা', 50.00, 'ONE_TIME', 'ACTIVE');

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
