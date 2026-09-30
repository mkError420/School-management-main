-- School Management System Seed Data
-- Import this after schema.sql
-- Note: This file inserts data into your existing database

-- 1. Ensure Admin exists
-- Password is 'admin123'
INSERT INTO admins (id, username, password) VALUES 
('admin001', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON DUPLICATE KEY UPDATE username=username;

-- 2. Grades
INSERT INTO grades (id, level) VALUES 
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6),
(7, 7), (8, 8), (9, 9), (10, 10), (11, 11), (12, 12)
ON DUPLICATE KEY UPDATE level=VALUES(level);

-- 3. Subjects
INSERT INTO subjects (id, name) VALUES 
(1, 'Math'), 
(2, 'English'), 
(3, 'Physics'), 
(4, 'Chemistry'), 
(5, 'Biology'), 
(6, 'History'), 
(7, 'Geography'), 
(8, 'Art'), 
(9, 'Music'), 
(10, 'Literature'),
(11, 'Computer Science'), 
(12, 'Physical Education')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4. Teachers (Password: 'teacher123' -> $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi)
INSERT INTO teachers (id, username, password, name, surname, email, phone, address, img, blood_type, sex) VALUES
('t1', 'johndoe', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Doe', 'john@doe.com', '1234567890', '123 Main St, Anytown, USA', 'https://images.pexels.com/photos/2888150/pexels-photo-2888150.jpeg?auto=compress&cs=tinysrgb&w=1200', 'A+', 'MALE'),
('t2', 'janedoe', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane', 'Doe', 'jane@doe.com', '1234567891', '456 Oak St, Anytown, USA', 'https://images.pexels.com/photos/936126/pexels-photo-936126.jpeg?auto=compress&cs=tinysrgb&w=1200', 'B+', 'FEMALE'),
('t3', 'mikegeller', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mike', 'Geller', 'mike@geller.com', '1234567892', '789 Pine St, Anytown, USA', 'https://images.pexels.com/photos/428328/pexels-photo-428328.jpeg?auto=compress&cs=tinysrgb&w=1200', 'O+', 'MALE'),
('t4', 'jayfrench', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jay', 'French', 'jay@gmail.com', '1234567893', '321 Elm St, Anytown, USA', 'https://images.pexels.com/photos/1187765/pexels-photo-1187765.jpeg?auto=compress&cs=tinysrgb&w=1200', 'AB+', 'MALE'),
('t5', 'janesmith', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane', 'Smith', 'jane@gmail.com', '1234567894', '654 Maple St, Anytown, USA', 'https://images.pexels.com/photos/1102341/pexels-photo-1102341.jpeg?auto=compress&cs=tinysrgb&w=1200', 'A-', 'FEMALE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 5. Classes
INSERT INTO classes (id, name, capacity, supervisor_id, grade_id) VALUES
(1, '1A', 25, 't1', 1),
(2, '1B', 25, 't2', 1),
(3, '2A', 25, 't3', 2),
(4, '2B', 25, 't4', 2),
(5, '3A', 25, 't5', 3),
(6, '3B', 25, 't1', 3),
(7, '4A', 25, 't2', 4),
(8, '4B', 25, 't3', 4),
(9, '5A', 25, 't4', 5),
(10, '5B', 25, 't5', 5),
(11, '6A', 25, 't1', 6),
(12, '6B', 25, 't2', 6)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 6. Teacher-Subject & Teacher-Class relationships
INSERT IGNORE INTO teacher_subjects (teacher_id, subject_id) VALUES
('t1', 1), ('t1', 2),
('t2', 3), ('t2', 4),
('t3', 5), ('t3', 1),
('t4', 6), ('t4', 7),
('t5', 8), ('t5', 9);

INSERT IGNORE INTO teacher_classes (teacher_id, class_id) VALUES
('t1', 1), ('t1', 2), ('t1', 6),
('t2', 2), ('t2', 7), ('t2', 12),
('t3', 3), ('t3', 4), ('t3', 8),
('t4', 4), ('t4', 9), ('t4', 10),
('t5', 5), ('t5', 10), ('t5', 11);

-- 7. Parents (Password: 'parent123')
INSERT INTO parents (id, username, password, name, surname, email, phone, address) VALUES
('p1', 'sarahconnor', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah', 'Connor', 'sarah@gmail.com', '1234567880', '124 Main St, Anytown, USA'),
('p2', 'tomholland', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Tom', 'Holland', 'tom@gmail.com', '1234567881', '458 Oak St, Anytown, USA'),
('p3', 'emmastone', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Emma', 'Stone', 'emma@gmail.com', '1234567882', '790 Pine St, Anytown, USA'),
('p4', 'brucewayne', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bruce', 'Wayne', 'bruce@wayne.com', '1234567883', '1007 Mountain Dr, Gotham'),
('p5', 'clarkkent', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Clark', 'Kent', 'clark@dailyplanet.com', '1234567884', '344 Clinton St, Metropolis')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 8. Students (Password: 'student123')
INSERT INTO students (id, username, password, name, surname, email, phone, address, img, blood_type, sex, parent_id, class_id, grade_id) VALUES
('s1', 'johnconnor', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Connor', 'johnc@gmail.com', '1234567801', '124 Main St, Anytown, USA', 'https://images.pexels.com/photos/2888150/pexels-photo-2888150.jpeg?auto=compress&cs=tinysrgb&w=1200', 'O+', 'MALE', 'p1', 1, 1),
('s2', 'peterparker', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Peter', 'Parker', 'peter@gmail.com', '1234567802', '20 Ingram St, Forest Hills', 'https://images.pexels.com/photos/936126/pexels-photo-936126.jpeg?auto=compress&cs=tinysrgb&w=1200', 'A+', 'MALE', 'p2', 2, 1),
('s3', 'gwenstacy', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Gwen', 'Stacy', 'gwen@gmail.com', '1234567803', '790 Pine St, Anytown, USA', 'https://images.pexels.com/photos/1102341/pexels-photo-1102341.jpeg?auto=compress&cs=tinysrgb&w=1200', 'B+', 'FEMALE', 'p3', 3, 2),
('s4', 'dickgrayson', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dick', 'Grayson', 'dick@wayne.com', '1234567804', '1007 Mountain Dr, Gotham', 'https://images.pexels.com/photos/428328/pexels-photo-428328.jpeg?auto=compress&cs=tinysrgb&w=1200', 'AB+', 'MALE', 'p4', 4, 2),
('s5', 'jonathanlewis', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jonathan', 'Lewis', 'jonathan@dailyplanet.com', '1234567805', '344 Clinton St, Metropolis', 'https://images.pexels.com/photos/1187765/pexels-photo-1187765.jpeg?auto=compress&cs=tinysrgb&w=1200', 'A-', 'MALE', 'p5', 7, 4)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 9. Lessons
INSERT INTO lessons (id, name, day, start_time, end_time, subject_id, class_id, teacher_id) VALUES
(1, 'Math 101', 'MONDAY', '2026-09-30 08:30:00', '2026-09-30 09:30:00', 1, 1, 't1'),
(2, 'English Literature', 'MONDAY', '2026-09-30 09:45:00', '2026-09-30 10:45:00', 2, 1, 't1'),
(3, 'Physics Fundamentals', 'TUESDAY', '2026-09-30 08:30:00', '2026-09-30 09:30:00', 3, 2, 't2'),
(4, 'Chemistry Lab', 'TUESDAY', '2026-09-30 10:00:00', '2026-09-30 11:30:00', 4, 2, 't2'),
(5, 'Biology Exploration', 'WEDNESDAY', '2026-09-30 08:30:00', '2026-09-30 09:30:00', 5, 3, 't3'),
(6, 'World History', 'THURSDAY', '2026-09-30 09:00:00', '2026-09-30 10:00:00', 6, 4, 't4')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 10. Exams
INSERT INTO exams (id, title, start_time, end_time, lesson_id) VALUES
(1, 'Math Midterm Exam', '2026-10-15 09:00:00', '2026-10-15 11:00:00', 1),
(2, 'English Essay Evaluation', '2026-10-18 10:00:00', '2026-10-18 11:30:00', 2),
(3, 'Physics Mechanics Test', '2026-10-22 09:00:00', '2026-10-22 10:30:00', 3),
(4, 'Chemistry Acid-Base Exam', '2026-10-25 10:00:00', '2026-10-25 11:30:00', 4)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 11. Assignments
INSERT INTO assignments (id, title, start_date, due_date, lesson_id) VALUES
(1, 'Calculus Problem Set 1', '2026-10-01 08:00:00', '2026-10-08 23:59:59', 1),
(2, 'Shakespeare Essay Draft', '2026-10-02 08:00:00', '2026-10-09 23:59:59', 2),
(3, 'Kinematics Lab Report', '2026-10-03 08:00:00', '2026-10-10 23:59:59', 3),
(4, 'Organic Chemistry Worksheet', '2026-10-04 08:00:00', '2026-10-11 23:59:59', 4)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 12. Results
INSERT INTO results (id, score, exam_id, assignment_id, student_id) VALUES
(1, 92, 1, NULL, 's1'),
(2, 88, NULL, 1, 's1'),
(3, 95, 2, NULL, 's2'),
(4, 91, NULL, 2, 's2'),
(5, 84, 3, NULL, 's3')
ON DUPLICATE KEY UPDATE score=VALUES(score);

-- 13. Attendance
INSERT INTO attendance (id, date, present, student_id, lesson_id) VALUES
(1, '2026-09-25', TRUE, 's1', 1),
(2, '2026-09-26', TRUE, 's1', 1),
(3, '2026-09-27', FALSE, 's1', 1),
(4, '2026-09-28', TRUE, 's1', 1),
(5, '2026-09-25', TRUE, 's2', 2),
(6, '2026-09-26', TRUE, 's2', 2),
(7, '2026-09-27', TRUE, 's2', 2)
ON DUPLICATE KEY UPDATE present=VALUES(present);

-- 14. Events
INSERT INTO events (id, title, description, start_time, end_time, class_id) VALUES
(1, 'Annual Science Fair', 'Showcase of scientific models and innovative projects.', '2026-10-20 09:00:00', '2026-10-20 15:00:00', NULL),
(2, 'Parent-Teacher Conference', 'Discussing academic progress and student development.', '2026-10-25 14:00:00', '2026-10-25 18:00:00', NULL),
(3, 'Class 1A Field Trip', 'Museum of Natural Science educational visit.', '2026-11-05 08:00:00', '2026-11-05 16:00:00', 1),
(4, 'Sports Day Meet', 'Inter-class track and field tournament.', '2026-11-12 08:30:00', '2026-11-12 17:00:00', NULL)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 15. Announcements
INSERT INTO announcements (id, title, description, date, class_id) VALUES
(1, 'Term 1 Exam Schedule Released', 'The mid-term examination timetable is now officially published.', '2026-10-01', NULL),
(2, 'Library Renovation Opening', 'The newly renovated school digital library opens next Monday.', '2026-10-03', NULL),
(3, 'Math Olympiad Registration', 'Students interested in participating should register with their teacher.', '2026-10-05', 1),
(4, 'Winter Uniform Notice', 'All students are requested to switch to the winter school uniform.', '2026-10-10', NULL)
ON DUPLICATE KEY UPDATE title=VALUES(title);
