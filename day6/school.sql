-- SQLite Database Schema for School System

-- Enable foreign key constraints in SQLite
PRAGMA foreign_keys = ON;

-- Drop tables if they exist for clean execution
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

-- 1. CREATE TABLE: Students
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. CREATE TABLE: Courses
CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    credits INTEGER NOT NULL
);

-- 3. CREATE TABLE: Enrolments (Join Table for Many-to-Many Relationship)
CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE(student_id, course_id) -- Prevents duplicate enrolments for the same course
);

-- INSERT Sample Data

-- Add 4 Students (including Diana who has no enrolments)
INSERT INTO students (first_name, last_name, email) VALUES
('Alice', 'Smith', 'alice.smith@example.com'),
('Bob', 'Jones', 'bob.jones@example.com'),
('Charlie', 'Brown', 'charlie.brown@example.com'),
('Diana', 'Prince', 'diana.prince@example.com');

-- Add 3 Courses
INSERT INTO courses (course_name, code, credits) VALUES
('Web Foundations', 'CS101', 3),
('Database Design & SQL', 'CS102', 4),
('JavaScript Programming', 'CS103', 3);

-- Add 5 Enrolments
INSERT INTO enrolments (student_id, course_id, grade) VALUES
(1, 1, 'A'),  -- Alice in Web Foundations
(1, 2, 'B+'), -- Alice in Database Design
(2, 1, 'B'),  -- Bob in Web Foundations
(2, 3, 'A-'), -- Bob in JavaScript
(3, 2, 'A');  -- Charlie in Database Design

-- FIVE REQUIRED QUERIES

-- Query 1: All courses for one student (by name: 'Alice Smith')
SELECT c.course_id, c.code, c.course_name, c.credits, e.grade
FROM courses c
JOIN enrolments e ON c.course_id = e.course_id
JOIN students s ON e.student_id = s.student_id
WHERE s.first_name = 'Alice' AND s.last_name = 'Smith';

-- Query 2: All students on one course ('Web Foundations')
SELECT s.student_id, s.first_name, s.last_name, s.email, e.grade
FROM students s
JOIN enrolments e ON s.student_id = e.student_id
JOIN courses c ON e.course_id = c.course_id
WHERE c.course_name = 'Web Foundations';

-- Query 3: The number of students per course
SELECT c.course_name, COUNT(e.student_id) AS student_count
FROM courses c
LEFT JOIN enrolments e ON c.course_id = e.course_id
GROUP BY c.course_id, c.course_name;

-- Query 4: Students who have no enrolments
SELECT s.student_id, s.first_name, s.last_name, s.email
FROM students s
LEFT JOIN enrolments e ON s.student_id = e.student_id
WHERE e.enrolment_id IS NULL;

-- Query 5: Update of one enrolment's grade (e.g., updating Bob's Web Foundations grade from 'B' to 'A')
UPDATE enrolments
SET grade = 'A'
WHERE student_id = 2 AND course_id = 1;
