# SmartAttendance — Commercial-Grade Student Attendance Management System

A high-performance, enterprise-ready **Student Attendance Management System** crafted with a modern SaaS aesthetic inspired by **Linear**, **Stripe**, and **Notion**. Built with strict adherence to vanilla web standards on the frontend and an Express & MongoDB Atlas backend.

---

## 🌟 Key Features

### 🛡️ Admin Portal
- **Real-Time Analytics Dashboard**: Visualizes college-wide attendance rates, active students, faculty counts, and a 14-day trend line chart with Chart.js.
- **Academic Directory Management**: Full CRUD operations for **Students**, **Faculty**, **Classes**, and **Subjects**.
- **Faculty Course Assignment**: Easily assign or reassign faculty members to courses and divisions.
- **Automated Defaulter Tracking**: Dedicated defaulter list dynamically flagging learners falling below the mandatory **75% threshold**.
- **Consecutive Classes Recovery Target**: Real-time projection indicating the exact number of consecutive lectures a defaulter must attend to restore eligibility.
- **Monthly Attendance Reports**: Filterable by Class, Subject, Month, and Year with export-ready layouts.

### 👨‍🏫 Faculty Portal
- **Instructor Dashboard**: Overview of assigned subjects, enrolled learners, and today's attendance tracking status.
- **Attendance Marking Console**:
  - Select subject, class division, and date (defaults to today).
  - Conflict-free attendance submission and editing powered by MongoDB compound unique indexes `{ student, subject, date }` and upserts.
  - Interactive Present / Absent pill toggles with real-time counters.
  - One-click bulk actions: **"Mark All Present"** and **"Mark All Absent"**.
- **Attendance History**: Audit historical lecture entries with date range filters.

### 🎓 Student Portal
- **Personal Attendance Metric**: Prominent hero card displaying overall percentage and eligibility standing.
- **Subject-Wise Breakdown**: Detailed course-by-course breakdown with progress bars, attended/missed counts, and faculty information.
- **Chronological Attendance History**: Complete personal log of attendance marks.
- **Interactive 75% Target Calculator**:
  - Mathematical simulator solving $\frac{\text{present} + n}{\text{total} + n} \ge 0.75$.
  - Computes the minimum consecutive future classes needed to recover eligibility.
  - Shows safe absence capacity for students already $\ge 75\%$.
  - "What-if" scenario testing with adjustable target sliders (75%, 80%, 85%, etc.).

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System with CSS Variables), Vanilla JavaScript (ES6+), [Lucide Icons](https://lucide.dev) (Pinned CDN `0.469.0`), [Chart.js](https://www.chartjs.org) (Pinned CDN `4.4.7`). *No frontend frameworks or CSS libraries.*
- **Backend**: Node.js, Express.js REST API, JSON Web Tokens (`jsonwebtoken`), Password Hashing (`bcrypt`), Environment Configuration (`dotenv`).
- **Database**: MongoDB Atlas with Mongoose ODM (Schema validation, timestamps, compound indexes, relational populate).
- **Server Architecture**: Single Express server serving both the REST API (`/api/...`) and static frontend files.

---

## 📁 Project Structure

```text
attendance-system/
├── package.json                   # Root convenience runner
├── .gitignore                     # Git exclusion rules
├── README.md                      # Complete documentation
├── backend/
│   ├── package.json               # Backend dependencies and scripts
│   ├── .env                       # Local environment variables
│   ├── .env.example               # Environment template
│   ├── server.js                  # Main Express application entrypoint
│   ├── seed.js                    # Database seeder (realistic sample dataset)
│   ├── config/
│   │   └── db.js                  # MongoDB Atlas Mongoose connection
│   ├── models/
│   │   ├── User.js                # Core auth & credentials
│   │   ├── Student.js             # Student profile with roll number & class ref
│   │   ├── Faculty.js             # Faculty profile with employee ID & dept
│   │   ├── Class.js               # Academic class & division definition
│   │   ├── Subject.js             # Subject code, class, and assigned faculty
│   │   └── Attendance.js          # Attendance record with unique compound index
│   ├── middleware/
│   │   ├── auth.js                # JWT verification & request user attachment
│   │   ├── role.js                # Role-based access control (RBAC) guard
│   │   └── errorHandler.js        # Centralized JSON error normalizer
│   ├── utils/
│   │   ├── asyncHandler.js        # Route error catching wrapper
│   │   ├── generateToken.js       # JWT signer utility
│   │   └── attendanceCalc.js      # Attendance math & 75% target formulas
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── studentController.js
│   │   ├── facultyController.js
│   │   ├── classController.js
│   │   ├── subjectController.js
│   │   ├── attendanceController.js
│   │   └── reportController.js
│   └── routes/
│       ├── authRoutes.js
│       ├── dashboardRoutes.js
│       ├── studentRoutes.js
│       ├── facultyRoutes.js
│       ├── classRoutes.js
│       ├── subjectRoutes.js
│       ├── attendanceRoutes.js
│       └── reportRoutes.js
└── frontend/
    ├── index.html                 # Login page with demo auto-fill buttons
    ├── css/
    │   ├── base.css               # Design tokens, resets, typography (Inter)
    │   ├── layout.css             # Sidebar, topbar, responsive drawer
    │   ├── components.css         # Cards, tables, modals, badges, toasts
    │   └── login.css              # Linear/Stripe style login card styles
    ├── js/
    │   ├── config.js              # Base API URLs and role configurations
    │   ├── api.js                 # Shared fetch wrapper with JWT attachment
    │   ├── auth.js                # Route guard & local session management
    │   ├── ui.js                  # Toast notifications & confirm dialog modals
    │   ├── layout.js              # Dynamic navigation injector & icon renderer
    │   └── login.js               # Login form submission & demo pill handlers
    ├── admin/
    │   ├── dashboard.html
    │   ├── students.html
    │   ├── faculty.html
    │   ├── classes.html
    │   ├── subjects.html
    │   ├── defaulters.html
    │   └── reports.html
    ├── faculty/
    │   ├── dashboard.html
    │   ├── attendance.html
    │   └── history.html
    └── student/
        ├── dashboard.html
        ├── subjects.html
        ├── history.html
        └── calculator.html
```

---

## ⚡ Getting Started

### 1. Prerequisites
- Node.js (v18.x or v20.x+)
- MongoDB Atlas connection string (or local MongoDB running on `mongodb://127.0.0.1:27017`)

### 2. Installation
Open your terminal in the project root:

```bash
# Install backend dependencies
cd backend
npm install
```

### 3. Environment Variables
Verify or create `backend/.env` with your settings:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/attendance_system
JWT_SECRET=super_secret_jwt_key_attendance_system_2026_modern_secure
JWT_EXPIRE=7d
```

> **For MongoDB Atlas**: Replace `MONGO_URI` with your connection string:
> `mongodb+srv://<username>:<password>@cluster0.mongodb.net/attendance_system?retryWrites=true&w=majority`

### 4. Seed the Database
Populate the database with realistic demo accounts, classes, subjects, and 6 weeks of attendance records:

```bash
npm run seed
```

### 5. Start the Application
Run the Express server:

```bash
npm start
# or with live reloading:
npm run dev
```

Visit the application in your browser:
**`http://localhost:5000`**

---

## 🔑 Demo Credentials

All seeded accounts use the password: **`password123`**

| Role | Email | Details |
| :--- | :--- | :--- |
| **Admin** | `admin@college.edu` | Full Administrative Privileges |
| **Faculty** | `alan.turing@college.edu` | Computer Engineering Dept |
| **Faculty** | `grace.hopper@college.edu` | Computer Engineering Dept |
| **Faculty** | `donald.knuth@college.edu` | Information Technology Dept |
| **Faculty** | `ada.lovelace@college.edu` | Computer Engineering Dept |
| **Regular Student** | `arjun.mehta1@student.edu` | High Attendance (>85%) |
| **Defaulter Student** | `anvi.chopra5@student.edu` | Defaulter Attendance (<75%) |

*(Quick demo buttons on the login screen allow one-click credential auto-fill for instant evaluation)*

---

## 📡 REST API Overview

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT |
| `GET` | `/api/auth/me` | Protected | Fetch current profile |
| `GET` | `/api/dashboard/admin` | Admin | Admin analytics & charts |
| `GET` | `/api/dashboard/faculty` | Faculty | Assigned subjects & daily status |
| `GET` | `/api/dashboard/student` | Student | Personal stats & 75% projection |
| `GET` | `/api/students` | Admin, Faculty | Filter & search enrolled students |
| `POST` | `/api/students` | Admin | Register new student & user account |
| `PUT` | `/api/students/:id` | Admin | Update student information |
| `DELETE` | `/api/students/:id` | Admin | Remove student & attendance logs |
| `GET` | `/api/faculty` | Admin, Faculty | Faculty directory & subjects |
| `POST` | `/api/faculty` | Admin | Onboard new faculty member |
| `GET` | `/api/classes` | Protected | List all classes & sections |
| `POST` | `/api/classes` | Admin | Create academic class section |
| `GET` | `/api/subjects` | Protected | List subjects with assigned faculty |
| `POST` | `/api/subjects` | Admin | Create course subject |
| `GET` | `/api/attendance/sheet` | Admin, Faculty | Fetch class sheet for marking |
| `POST` | `/api/attendance/mark` | Admin, Faculty | Batch upsert attendance entries |
| `GET` | `/api/attendance/history` | Admin, Faculty | Session logs with date filters |
| `GET` | `/api/attendance/student/:id` | Protected | Chronological student marks |
| `GET` | `/api/reports/defaulters` | Admin, Faculty | Defaulter list with recovery needed |
| `GET` | `/api/reports/monthly` | Admin, Faculty | Monthly class attendance summary |

---

## 🧮 75% Attendance Formula Explanation

To determine the minimum number of consecutive classes $n$ a student must attend to reach or exceed a target threshold $T$ (default $0.75$):

$$\frac{\text{Present} + n}{\text{Total} + n} \ge T$$

$$\text{Present} + n \ge T \times \text{Total} + T \times n$$

$$n(1 - T) \ge T \times \text{Total} - \text{Present}$$

$$n \ge \frac{T \times \text{Total} - \text{Present}}{1 - T}$$

For $T = 75\% = 0.75$:

$$n = \lceil 3 \times \text{Total} - 4 \times \text{Present} \rceil$$

Conversely, for students already above 75%, the safe absence buffer $m$ they can afford to miss without dropping below 75% is computed as:

$$m = \left\lfloor \frac{4 \times \text{Present} - 3 \times \text{Total}}{3} \right\rfloor$$

---

## 💼 Portfolio & GitHub Recommendations

1. **Add Screenshots/GIFs**: Take screenshots of the Admin Dashboard (charts), Faculty Attendance Marking Console (toggle buttons), and Student 75% Calculator. Place them in an `assets/` folder and link them in the README.
2. **Repository About Section**:
   - Description: *"Commercial-grade Student Attendance Management System built with Express, MongoDB Atlas, and vanilla JS/CSS. Features automated 75% defaulter detection, predictive recovery calculator, and role-based access control."*
   - Topics / Tags: `javascript`, `nodejs`, `express`, `mongodb-atlas`, `mongoose`, `attendance-system`, `jwt-authentication`, `chartjs`, `vanilla-js`.
3. **Commit History**: Make descriptive commits (e.g. `feat(auth): implement JWT authentication & role-based middleware`, `feat(calculator): add 75% attendance recovery algorithm`).
