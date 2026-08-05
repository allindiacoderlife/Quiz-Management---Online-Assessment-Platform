# Quiz Management & Online Assessment Platform

A web-based online quiz and assessment application designed to facilitate study guides, timed tests, and student performance tracking. The platform features two core roles: **Admin** (for full CRUD management of quizzes, categories, questions, and students) and **Student** (for browsing, attempting quizzes, viewing leaderboards, and checking results history).

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Tailwind CSS, React Router, Axios, Recharts (Charts/Analytics)
- **Backend**: Node.js, Express.js (ES Modules)
- **Database / ORM**: PostgreSQL (Neon Database), Drizzle ORM, Drizzle Kit (Migrations)
- **Utilities**: JWT (Session Protection), Nodemailer (OTP Transmission), Zod (Request Validation), BcryptJS (Password Hashing)

---

## 🚀 Key Features

### 🔐 1. Authentication & Security
- Register, login, and profile verification.
- **Secure OTP Verification**: Generates a 6-digit numeric OTP valid for 10 minutes upon registration or login (if unverified).
- **Password Reset**: Secure forgot-password flow delivering reset codes via email.
- **Role-Based Middlewares**: Strict server-side route guards enforcing Student/Admin permissions.

### 📊 2. Admin Dashboards & Management
- **Dashboard Analytics**: Key performance charts tracking quiz attempts over time, pass/fail ratios, and student sign-ups.
- **Category & Quiz Management**: Configuration options including difficulty levels (Easy/Intermediate/Hard), duration limits, and custom passing percentage marks.
- **Question Banks**: Create multiple-choice questions with answer explanations.
- **User Management**: Search registered students, toggle active/inactive account status, or view user-specific attempt sheets.

### ⏱️ 3. Timed Quiz Attempt Engine
- Countdown timers with secure backend expiration validation.
- **Cheating Prevention**: Option answer keys (`isCorrect`) and explanation text are completely omitted from client payloads during active quiz sessions.
- **Backend Score Evaluator**: Scores and percentage marks are calculated strictly on the backend to prevent frontend client spoofing.
- **Detailed Result Sheets**: Reviews correct keys, user options selected, and detailed explanations upon submit.

### 🏆 4. Interactive Leaderboards
- Rankings of students based on completed quizzes, passed attempt tallies, and average percentages.

---

## 📂 Project Structure

```text
├── backend
│   ├── src
│   │   ├── config          # Environment configuration
│   │   ├── controllers     # Route request handlers
│   │   ├── db              # Database schemas and migration files
│   │   ├── lib             # Database clients (Drizzle/Neon)
│   │   ├── middleware      # Auth guards and validation filters
│   │   ├── routes          # API endpoints router definitions
│   │   ├── services        # Transporters (Nodemailer, SMTP)
│   │   └── utils           # Helper classes (ApiError, asyncHandler)
│   ├── .env                # App environment secrets
│   ├── drizzle.config.js   # Drizzle kit config file
│   └── package.json
├── docs
│   └── prd.md              # Product Requirements Document
├── frontend                # Frontend codebase
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **PostgreSQL Database** (e.g. Neon.tech cloud database)

### 2. Backend Installation & Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your Environment Variables by creating a `.env` file inside `backend/`:
   ```env
   # Database connection strings
   DATABASE_URL=postgresql://<username>:<password>@<host>/<database>?sslmode=require

   # JWT secret key configuration
   JWT_SECRET=your_jwt_signing_secret_here
   JWT_EXPIRES_IN=7d

   # Nodemailer SMTP configurations (Optional - defaults to mock logger)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   SMTP_FROM=noreply@quizplatform.com
   ```

4. Push schemas and generate migration files:
   ```bash
   # Synchronize Drizzle schema directly with your PostgreSQL database
   npm run db:push

   # Generate migrations snapshots
   npm run db:generate
   ```

5. Launch the backend server in development mode:
   ```bash
   npm run dev
   ```

---

## 🔌 API Documentation

### Authentication Enpoints
- `POST /api/auth/register` - Create student account.
- `POST /api/auth/login` - Login, check verification status, return JWT.
- `POST /api/auth/verify-otp` - Verify OTP registration code.
- `POST /api/auth/resend-otp` - Re-deliver registration OTP.
- `POST /api/auth/forgot-password` - Request a password reset OTP code.
- `POST /api/auth/reset-password` - Update account credentials with new password.
- `GET /api/auth/me` - Fetch authenticated user details.

### Student Quiz & Attempts Endpoints
- `GET /api/categories` - Fetch quiz categories.
- `GET /api/quizzes` - List available quizzes (Students only see `PUBLISHED`).
- `GET /api/quizzes/:id` - Fetch metadata for a specific quiz.
- `POST /api/quizzes/:quizId/start` - Create quiz attempt (returns questions without answers/explanations).
- `POST /api/quizzes/:quizId/submit` - Submit answers, evaluate score, complete attempt.
- `GET /api/attempts` - Retrieve logged-in student's historical attempts.
- `GET /api/attempts/:id` - Detailed result sheet review (shows correct answers and explanations).
- `GET /api/leaderboard` - Public ranked leaderboards.

### Admin-Only Administration Endpoints
- `GET /api/users` - Search and filter registered students.
- `GET /api/users/:id` - Detailed student profile, history, and average stats.
- `PUT /api/users/:id` - Update student profile.
- `PATCH /api/users/:id/status` - Toggle account status (`ACTIVE`/`INACTIVE`).
- `DELETE /api/users/:id` - Permanently delete student account.
- `POST /api/categories` - Create quiz category.
- `PUT /api/categories/:id` - Update category.
- `DELETE /api/categories/:id` - Delete category.
- `POST /api/quizzes` - Create quiz.
- `PUT /api/quizzes/:id` - Update quiz details.
- `DELETE /api/quizzes/:id` - Delete quiz.
- `PATCH /api/quizzes/:id/publish` - Set status (`DRAFT`, `PUBLISHED`, `UNPUBLISHED`).
- `GET /api/quizzes/:quizId/questions` - View questions list (shows correct option keys and explanations).
- `POST /api/quizzes/:quizId/questions` - Create question with multiple options.
- `PUT /api/questions/:id` - Update question details and options lists.
- `DELETE /api/questions/:id` - Remove question.
- `GET /api/admin/attempts` - View platform-wide attempts list.
- `GET /api/admin/attempts/:id` - Review individual attempt sheets of any user.
- `GET /api/admin/analytics` - Pull overall platform KPIs and chart analytics.
