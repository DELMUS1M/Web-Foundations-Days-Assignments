# School Database Design

## 1. Table Explanations

- **`students`**: Stores core biographical and contact information for each registered student. The `student_id` serves as the primary key, and `email` is enforced as `UNIQUE` to prevent duplicate student accounts.
- **`courses`**: Contains catalog information about academic courses offered. The `course_id` is the primary key, `code` uniquely identifies the course (e.g., `CS101`), and `credits` indicates the credit value.
- **`enrolments`**: Serves as a bridge (join) table representing a student's registration in a specific course. It includes foreign keys referencing both `students` and `courses`, stores the student's `grade`, and enforces a composite `UNIQUE(student_id, course_id)` constraint to prevent a student from enrolling in the same course multiple times.

## 2. Entity Relationships & Join Table Explanation

- **One-to-Many Relationships**:
  - A single student can have many enrolment records (`students` 1 → N `enrolments`).
  - A single course can have many enrolment records (`courses` 1 → N `enrolments`).
- **Many-to-Many Relationship**:
  - The direct relationship between `students` and `courses` is **Many-to-Many**, because one student can enroll in multiple courses, and one course can contain multiple students.
- **Why a Join Table is Needed**:
  - Relational databases cannot directly model a Many-to-Many relationship in First Normal Form (1NF) without causing data duplication or requiring multi-valued attributes.
  - The `enrolments` join table decomposes the Many-to-Many relationship into two One-to-Many relationships. Additionally, attributes specific to the relationship itself—such as the student's `grade` or `enrolled_at` date—belong logically to the enrolment instance, not solely to the student or the course.

## 3. Database Indexing Recommendation

- **Index Recommendation**: `CREATE INDEX idx_students_name ON students(last_name, first_name);`
- **Reason**: Student lookups by name (e.g., finding all courses for "Alice Smith") are frequent operations in school systems. Without an index, the database engine must perform a full table scan over every row in `students`. Adding a composite index on `(last_name, first_name)` creates a B-tree lookup structure, allowing query execution in $O(\log N)$ time rather than $O(N)$.

## 4. Architecture Choice: SQL vs. NoSQL

For a school administration system, a **relational SQL database (such as PostgreSQL or SQLite)** is the superior choice over a NoSQL database. School data is inherently structured, highly relational, and requires strict data consistency and integrity. SQL databases provide ACID compliance (ensuring transactions like course enrolment or grade updates are atomic and durable) and support declarative foreign key constraints (`ON DELETE CASCADE`), which prevent orphaned records. In contrast, document or key-value NoSQL stores would lead to either heavy data duplication across student/course documents or complex application-level joining, increasing the risk of data anomalies when student or course details change.
