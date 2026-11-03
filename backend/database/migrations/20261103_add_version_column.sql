-- Migration: Add version column to admissions and students tables
-- Version options: Bangla, English (Default: Bangla)

SET @col_exists_adm = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admissions' AND COLUMN_NAME = 'version');
SET @sql_adm = IF(@col_exists_adm = 0, 'ALTER TABLE admissions ADD COLUMN version VARCHAR(50) DEFAULT \'Bangla\' AFTER student_type', 'SELECT 1');
PREPARE stmt_adm FROM @sql_adm;
EXECUTE stmt_adm;
DEALLOCATE PREPARE stmt_adm;

SET @col_exists_stu = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'version');
SET @sql_stu = IF(@col_exists_stu = 0, 'ALTER TABLE students ADD COLUMN version VARCHAR(50) DEFAULT \'Bangla\' AFTER student_type', 'SELECT 1');
PREPARE stmt_stu FROM @sql_stu;
EXECUTE stmt_stu;
DEALLOCATE PREPARE stmt_stu;

