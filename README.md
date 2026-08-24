# HireHub — AI-Powered Bias-Free Hiring Platform
An end-to-end job marketplace with identity-blind resume screening, multi-criteria scoring, explainable AI decisions, and full EEOC/GDPR compliance.
A unified, full-stack **MERN** application integrating:
1. **HireHub AI Job Marketplace**: Multi-role platform for Job Seekers, Employers, and Admins featuring automated matching, job management, application tracking, and profile analytics.
2. **Bias-Aware OCR & Heuristic Resume Screener Suite (Project 1)**: Demographically blind resume evaluation engine with local Multi-Pass OCR (Tesseract + Sharp), transferable adjacent skills graph, tenure validation, batch ranking leaderboards (10–150+ resumes), and job description inclusivity auditing.

---

## 🌟 Key Capabilities

### 1. Zero-Demographic-Bias Screening Engine
- **Automated PII Redaction**: Automatically scrubs phone numbers, emails, physical addresses, external URLs, gender pronouns, graduation dates (ageism prevention), and university names before evaluation.
- **Canonical Skill Synonym Graph**: Resolves variations like `js` -> `javascript`, `postgres` -> `postgresql`, `k8s` -> `kubernetes`.
- **Transferable Adjacent Skills Engine**: Credits candidates for related adjacent technologies (e.g. `vue` / `angular` for `react`, `flask` for `django`, `aws` for `azure`).
- **Comprehensive Narrative Evaluation**: Generates detailed, transparent rationale explaining why a candidate was shortlisted or rejected.

### 2. Multi-Pass Local OCR Processing
- Multi-tier pre-processing with **Sharp** (grayscale normalization, sharpening, adaptive contrast binarization).
- **Tesseract 5.0** OCR text extraction with noise filtering and line-by-line voting merger.
- Zero external API dependencies required for local OCR and heuristic evaluation.

### 3. High-Throughput Batch Ranking Leaderboard
- Screen 10 to 150+ resumes simultaneously with concurrency-limited worker pools (`asyncPool`).
- Automatic score ranking, Top-K filtering, and one-click CSV/JSON export.

### 4. Job Description Inclusivity & Bias Auditor
- Real-time scanning for exclusionary keywords (e.g. *ninja*, *rockstar*, *aggressive*, *dominate*, *young and energetic*).
- Inclusivity score calculation (0–100%) with one-click inclusive terminology replacement.

### 5. Employer & Applicant Workflow Integration
- Employers can trigger instant bias-aware screening directly on applicants inside the hiring pipeline.

---

## 📁 Unified Project Structure

```
hackathon/
├── package.json              # Unified root scripts (dev, build, seed, install:all)
├── README.md                 # Project documentation
│
├── Backend/                  # Express.js REST API Server (Port 8000)
│   ├── src/
│   │   ├── config/           # Database and environment configurations
│   │   ├── controllers/      # Auth, Job, Employer, Admin, and Screener controllers
│   │   ├── middleware/       # JWT Auth, Role validation, and Upload handlers
│   │   ├── models/           # Mongoose schemas (User, Job, Application, Profiles)
│   │   ├── routes/           # REST endpoints (/api/screener, /api/jobs, etc.)
│   │   ├── services/         # OCR Service, Screener Engine, Bias Auditor, Gemini AI
│   │   └── app.js            # Express application setup
│   └── server.js             # API entry point
│
└── Frontend/                 # Vite + React 19 + Tailwind CSS SPA (Port 5173)
    ├── src/
    │   ├── api/              # Axios instance with JWT interceptors
    │   ├── components/       # Layout, Navbar, Sidebar, Card, Badge, Modal, Buttons
    │   ├── pages/
    │   │   ├── screener/     # AI Resume Screener & ATS Suite (3-in-1 tool)
    │   │   ├── employer/     # Employer dashboard, job posting, applicant manager
    │   │   ├── jobseeker/    # Job search, profile, application tracker, recommendations
    │   │   └── admin/        # Platform analytics, user manager, moderation
    │   ├── routes/           # Protected routing and navigation
    │   └── store/            # Zustand state management
    └── index.html
```

---

## 🚀 Quick Start & Execution

### 1. Install All Dependencies
Run from the root directory:
```bash
npm run install:all
```

### 2. Start Both Backend & Frontend Simultaneously
```bash
npm run dev
```
- **Backend API**: `http://localhost:8000`
- **Frontend App**: `http://localhost:5173`

### 3. Individual Commands
- **Start Backend only**: `npm run dev:backend`
- **Start Frontend only**: `npm run dev:frontend`
- **Build for Production**: `npm run build`
- **Seed Sample Database**: `npm run seed`

---

## 📡 Key Screener API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/screener/screen-resume` | Upload single resume image/PDF + JD for OCR & screening |
| `POST` | `/api/screener/screen-text` | Screen raw pasted resume text against a JD |
| `POST` | `/api/screener/screen-batch` | Bulk upload up to 150 resumes for parallel ATS ranking |
| `POST` | `/api/screener/audit-jd` | Audit Job Description for bias, aggressive words & inclusivity |
| `POST` | `/api/screener/screen-application/:id` | Run bias-aware AI screen on an existing HireHub application |
