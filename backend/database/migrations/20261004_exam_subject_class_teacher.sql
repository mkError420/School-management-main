-- Migration: Add direct subject_id, class_id, teacher_id, and date to exams table
-- This allows exams to directly reference subject, class, and teacher while keeping lesson_id compatibility

ALTER TABLE exams
    ADD COLUMN IF NOT EXISTS subject_id INT NULL AFTER lesson_id,
    ADD COLUMN IF NOT EXISTS class_id INT NULL AFTER subject_id,
    ADD COLUMN IF NOT EXISTS teacher_id VARCHAR(255) NULL AFTER class_id,
    ADD COLUMN IF NOT EXISTS date DATE NULL AFTER teacher_id;

-- Backfill existing exams from lessons table
UPDATE exams e
JOIN lessons l ON e.lesson_id = l.id
SET e.subject_id = l.subject_id,
    e.class_id   = l.class_id,
    e.teacher_id = l.teacher_id,
    e.date       = DATE(e.start_time)
WHERE e.subject_id IS NULL;
