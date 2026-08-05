Here is the cleaned, formatted, and properly structured version of your Product Requirements Document (PRD).

---

# Product Requirements Document (PRD)

## Quiz Management & Online Assessment Platform

### 1. Introduction

The Quiz Management & Online Assessment Platform is a web-based application that allows students or users to participate in online quizzes and assessments.

The platform will have two roles: **Admin** and **Student/User**.

- The **Admin** will have complete control over the platform, including creating quizzes, managing questions, managing users, monitoring quiz attempts, and viewing overall performance.
- The **Student/User** will be able to browse available quizzes, attempt quizzes, view results, review answers, and track their performance.

The project is designed to provide practical experience with frontend development, backend development, authentication, authorization, CRUD operations, database management, REST APIs, timers, scoring systems, dashboards, and responsive web design.

### 2. Project Objectives

The main objectives are:

- Build a complete online quiz platform.
- Implement secure user authentication.
- Implement Admin and Student roles.
- Allow Admin to create and manage quizzes and questions.
- Allow students to attempt quizzes online.
- Implement automatic scoring and a countdown timer.
- Store quiz attempts and results.
- Provide performance analytics and a leaderboard.
- Create separate Admin and Student dashboards.
- Build a responsive web application.

### 3. User Roles

The application will have only two roles.

#### 3.1 Admin

The Admin has complete control over the platform.
**Admin Features:**

- Admin login & dashboard
- Manage students/users (activate/deactivate users)
- Create, edit, delete, and publish/unpublish quizzes
- Create, edit, and delete questions
- Manage categories and difficulty levels
- View all quiz attempts and individual student results
- View quiz performance and platform analytics
- Manage leaderboard

#### 3.2 Student/User

Students can participate in quizzes available on the platform.
**Student Features:**

- Register, login, and logout
- View, search, and filter available quizzes
- View quiz details and start quiz
- Answer questions, navigate between questions, and view remaining time
- Submit quiz and view result
- Review answers and previous attempts
- Track performance and view leaderboard

---

### 4. Main Application Modules

#### Module 1: Authentication

The application should provide authentication for Admin and Students.

- **Student Authentication:** Registration, Login, Logout, Forgot password, Reset password.
- **Admin Authentication:** Admin login, Logout, Password reset. (Admin accounts can either be created manually by the system owner or through a secure admin-management mechanism).

---

### 5. Admin Dashboard

The Admin Dashboard will be the central control panel of the application.

**Dashboard Statistics (Admin should see):**

- Total students, quizzes (published & draft), and questions
- Total quiz attempts
- Average score
- Total passed/failed attempts

**Dashboard Analytics (Display charts for):**

- Quiz attempts over time
- Student registrations
- Average quiz scores
- Pass/fail ratio
- Most popular quizzes and categories

---

### 6. User Management

The Admin can manage all registered students.

**Features:**

- View all students & search students
- View student profile, quiz history, and performance
- Activate/deactivate or delete account

**Student Information tracked:**

- Name, Email, Registration Date, Account Status
- Quizzes Attempted, Average Score, Highest Score

---

### 7. Quiz Management

All quiz management will be performed by the Admin.

**Create Quiz Configuration:**
Admin can create a quiz containing: Title, Description, Category, Difficulty, Duration, Passing percentage, Maximum attempts, Quiz status, and an optional thumbnail/image.

> **Example Quiz Configuration:**
>
> - **Quiz:** JavaScript Fundamentals
> - **Category:** JavaScript
> - **Difficulty:** Intermediate
> - **Duration:** 20 minutes
> - **Passing Score:** 60%
> - **Maximum Attempts:** 2
> - **Status:** Published

**Quiz Status:**
A quiz can be **Draft**, **Published**, or **Unpublished**. Only published quizzes should be available to students.

---

### 8. Category Management

Admin can manage quiz categories.

- **Examples:** HTML, CSS, JavaScript, React, Node.js, Python, Java, Database, Computer Networks, Cyber Security.
- **Admin Features:** Create, edit, delete categories, and view quizzes under a category.

---

### 9. Question Management

Admin can manage questions for every quiz.

**Question Information:**
Each question can contain: Question text, Options, Correct answer, Explanation, Marks, Difficulty.

> **Example Question:**
>
> - **Q:** Which method converts a JSON string into a JavaScript object?
> - A. `JSON.stringify()`
> - B. `JSON.parse()`
> - C. `JSON.convert()`
> - D. `JSON.object()`
> - **Correct Answer:** `JSON.parse()`
> - **Explanation:** `JSON.parse()` converts a JSON string into a JavaScript object.

---

### 10. Question Types

- **Initial Version:** Multiple Choice Question (One correct answer).
- **Future Enhancements:** Multiple correct answers, True/False, Fill in the blanks, Match the following, Image-based questions, Code-based questions.

---

### 11. Quiz Attempt System

Students can start any published quiz. The quiz interface should display:

> **JavaScript Fundamentals** | _Time Remaining: 14:32_
> **Question 5 of 20**
> Which keyword is used to declare a constant?
> ◯ var
> ◯ let
> ◉ const
> ◯ static
> `[Previous]` `[Next]` `[Submit Quiz]`

**Student Capabilities:**
Select an answer, move to next/previous questions, navigate directly to a specific question, see answered/unanswered questions, and submit the quiz.

---

### 12. Timer System

Every quiz can have a predefined duration (e.g., 10, 20, 30, or 60 minutes).
**The timer should:**

- Start when the quiz starts.
- Display remaining time.
- Continue correctly after page refresh where possible.
- Automatically submit the quiz when the time expires.
- _Security Note:_ The actual quiz start time and expiry time should be validated by the backend rather than relying only on the browser timer.

---

### 13. Quiz Submission

When the student submits the quiz, the backend should process the submission.

**The system calculates:**

- Correct/Incorrect/Unanswered questions
- Total and Obtained marks
- Percentage
- Pass/fail status
- Time taken

> **Example Result Output:**
> Total Questions: 20 | Correct: 16 | Incorrect: 3 | Unanswered: 1
> **Score:** 80% | **Status:** PASSED

_Security Note:_ Scoring calculation **must** happen on the backend so students cannot manipulate their score through frontend code.

---

### 14. Result System

After completing a quiz, students receive a detailed result page. Students should also be able to review the question, their selected answer, the correct answer, the explanation, and whether their answer was correct.

---

### 15. Student Dashboard

The Student Dashboard provides an overview of the student's quiz activity.

**Statistics:**

- Total quizzes attempted, passed, and failed
- Average score & Highest score
- Total questions answered
- Recent attempt history and scores

---

### 16. Quiz Discovery

Students should be able to find quizzes easily.

- **Search by:** Quiz title, Category
- **Filter by:** Category, Difficulty, Duration, Recently added, Popularity

---

### 17. Quiz Details Page

Before starting a quiz, students should see the metadata: Description, Category, Difficulty, Total Questions, Duration, Passing Score, and Maximum Attempts allowed.

---

### 18. Quiz Attempt History

Students should be able to view their previous attempts. Clicking an attempt should open its detailed result.

| Quiz       | Date   | Score | Status |
| ---------- | ------ | ----- | ------ |
| JavaScript | 04 Aug | 86%   | Passed |
| React      | 02 Aug | 72%   | Passed |
| Python     | 30 Jul | 48%   | Failed |

---

### 19. Leaderboard

The platform provides a leaderboard to increase engagement. Rankings can be based on highest score, average score, or number of quizzes completed.

- **Filters:** Overall, Category-wise, Monthly, Weekly.

---

### 20. Database Design (PostgreSQL / MySQL)

- **`users`**: id, name, email, password, role (ADMIN/STUDENT), status, created_at
- **`categories`**: id, name, description, created_at
- **`quizzes`**: id, title, description, category_id, difficulty, duration, passing_score, max_attempts, status, created_at, updated_at
- **`questions`**: id, quiz_id, question_text, marks, explanation, difficulty, created_at
- **`options`**: id, question_id, option_text, is_correct
- **`attempts`**: id, quiz_id, user_id, score, percentage, correct_answers, incorrect_answers, unanswered, time_taken, status, started_at, completed_at
- **`answers`**: id, attempt_id, question_id, selected_option_id, is_correct

---

### 21. Recommended Tech Stack

- **Frontend:** React.js, Tailwind CSS (Additional: React Router, Axios, Recharts, React Hook Form)
- **Backend:** Node.js, Express.js (MERN-style JavaScript Stack)

### 22. Database

- **Recommended:** PostgreSQL (Ideal due to clear relational structures).
- **Alternatives:** MySQL, MongoDB.

---

### 23. Application Architecture

```text
       ┌──────────────────┐
       │     Student      │
       └────────┬─────────┘
                │
                ▼
       ┌──────────────────┐
       │     Frontend     │
       │ React + Tailwind │
       └────────┬─────────┘
                │
                │ REST API
                ▼
       ┌──────────────────┐
       │     Backend      │
       │   Node/Express   │
       └────────┬─────────┘
                │
                ▼
       ┌──────────────────┐
       │    PostgreSQL    │
       └──────────────────┘
                ▲
                │
       ┌────────┴─────────┐
       │      Admin       │
       │ Management Panel │
       └──────────────────┘

```

---

### 24. Two-Week Development Schedule

**Week 1**

- **Day 1 – Project Setup:** Frontend/Backend/Database setup, Git repository, Environment config.
- **Day 2 – Authentication:** Registration, Login, Logout, Password hashing, JWT/sessions.
- **Day 3 – Role-Based Auth:** Admin/Student roles, Protected routes, Middlewares.
- **Day 4 – Admin Dashboard:** Layout, Statistics, Navigation, User management.
- **Day 5 – Quiz Management:** CRUD operations for quizzes, Publish/unpublish logic.
- **Day 6 – Category & Question Management:** Category CRUD, Adding questions, options, and correct answers.
- **Day 7 – Student Quiz Interface:** Quiz listing, details, starting a quiz, navigation, timer.

**Week 2**

- **Day 8 – Quiz Submission:** Auto/manual submission, Score & Pass/Fail calculation.
- **Day 9 – Results:** Result page, Answer review, Explanations, Attempt history.
- **Day 10 – Student Dashboard:** Statistics, History, Performance charts.
- **Day 11 – Admin Analytics:** Student/Quiz/Attempt/Pass-Fail statistics.
- **Day 12 – Leaderboard:** Ranking system, Overall and Category leaderboards.
- **Day 13 – Testing & Security:** Auth tests, CRUD tests, API validation, Input validation, timer/score spoofing checks.
- **Day 14 – Deployment & Documentation:** Deploy frontend/backend, Configure production DB, README, Presentation.

---

### 25. Important API Endpoints

**Authentication**

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

**Users (Admin Only)**

- `GET /api/users`
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `PATCH /api/users/:id/status`

**Categories (Admin Only)**

- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

**Quizzes**

- `GET /api/quizzes` (Student/Admin)
- `GET /api/quizzes/:id` (Student/Admin)
- `POST /api/quizzes` (Admin)
- `PUT /api/quizzes/:id` (Admin)
- `DELETE /api/quizzes/:id` (Admin)
- `PATCH /api/quizzes/:id/publish` (Admin)

**Questions (Admin Only)**

- `GET /api/quizzes/:quizId/questions`
- `POST /api/quizzes/:quizId/questions`
- `PUT /api/questions/:id`
- `DELETE /api/questions/:id`

**Quiz Attempts (Student)**

- `POST /api/quizzes/:quizId/start`
- `POST /api/quizzes/:quizId/submit`
- `GET /api/attempts`
- `GET /api/attempts/:id`

**Admin Results & Leaderboard**

- `GET /api/admin/attempts`
- `GET /api/admin/attempts/:id`
- `GET /api/admin/analytics`
- `GET /api/leaderboard` (Public/Student)

---

### 26. Advanced Features

_(For post-core requirement implementation)_

- **Randomization:** Randomize question order and answer option order.
- **Negative Marking:** e.g., Correct +2, Wrong -0.5, Skipped 0.
- **Maximum Attempts:** Admin configuration for attempt limits.
- **Quiz Scheduling:** Set start date, end date, and availability windows.
- **Certificate Generation:** Auto-generate upon passing.
- **Email Notifications:** For completion, results, and certificates.
- **Dark Mode:** UI theme switching.
- **Question Import:** Allow Admin to upload CSV/Excel files for bulk question generation.

---

### 27. Security Requirements

- Password hashing & JWT/session security.
- Role-based authorization and input validation.
- SQL injection and XSS prevention.
- CSRF protection and rate limiting.
- Secure HTTP headers and environment variable protection.
- **Crucial Rule:** The frontend _must never be trusted_ for correct answers, scores, user roles, quiz completion status, or attempt eligibility. The backend must independently validate all of these.

---

### 28. Testing Requirements

- **Functional Testing:** Registration, login, CRUD operations, attempting/submitting quizzes, score calculation.
- **API Testing (Postman/Insomnia):** Valid/invalid requests, unauthorized access, expired auth, missing parameters.
- **Responsive Testing:** Must work flawlessly on Desktop and Laptop screen sizes.

---

### 29. Learning Outcomes

Completing this project provides practical mastery over:

- Frontend (React.js, Form validation, State management, Data visualization)
- Backend (REST APIs, Node.js, Routing, Security)
- Database design (PostgreSQL/MySQL, Relational mapping)
- System mechanics (Timers, Scoring algorithms, Dashboards, Role-based auth)
- DevOps fundamentals (Deployment, Git/GitHub, Environment management)

---

### 30. Expected Final Application

```text
                             QUIZ PLATFORM
                                   │
                   ┌───────────────┴───────────────┐
                   │                               │
                 ADMIN                          STUDENT
                   │                               │
           ┌───────┴───────┐               ┌───────┴────────┐
           │               │               │                │
       Dashboard         Users         Dashboard      Quiz Listing
           │               │               │                │
        Quizzes       Categories        History       Quiz Details
           │               │               │                │
       Questions       Analytics      Performance     Quiz Attempt
           │               │               │                │
        Results       Leaderboard        Result             │

```

---

### 31. Conclusion

The Quiz Management & Online Assessment Platform is a complete full-stack web development project with a simple and practical role structure.

There are only two roles:

- **Admin:** Manages the entire platform.
- **Student:** Takes quizzes and tracks performance.

The Admin is responsible for creating quizzes, managing questions and categories, managing students, publishing quizzes, and monitoring results. Students can discover quizzes, attempt them within a time limit, receive automatic results, review their answers, and monitor their performance. The project provides students with practical experience making it highly suitable for an internship-level or portfolio full-stack project.
