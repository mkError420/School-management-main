-- Migration: Add routine attachment and extra fields to exams table
-- Run this migration to enable exam routine uploads

ALTER TABLE exams
    ADD COLUMN IF NOT EXISTS description TEXT NULL AFTER title,
    ADD COLUMN IF NOT EXISTS total_marks INT NULL AFTER description,
    ADD COLUMN IF NOT EXISTS routine_attachment VARCHAR(500) NULL AFTER end_time,
    ADD COLUMN IF NOT EXISTS attachment_original_name VARCHAR(255) NULL AFTER routine_attachment,
    ADD COLUMN IF NOT EXISTS attachment_mime_type VARCHAR(127) NULL AFTER attachment_original_name,
    ADD COLUMN IF NOT EXISTS attachment_size INT UNSIGNED NULL AFTER attachment_mime_type,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER lesson_id;

-- Create uploads directory record (handled by PHP, not SQL)
-- Note: Ensure /backend/uploads/exam_routines/ directory exists with proper write permissions.
