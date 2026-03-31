# CareerPulse Backend (MERN)

Production-ready Express + MongoDB backend for the CareerPulse frontend.

## Features

- JWT authentication (`student` / `recruiter`)
- Role-based route protection
- Jobs API with search/filter/sort
- Apply flow + applicant management
- Student and recruiter dashboard APIs
- Profile management (skills, experience, education, resume URL)
- Career roadmap templates + per-user progress tracking
- Seed script for quick local testing

## Setup

1. Create env file:
   - Copy `.env.example` to `.env`
   - Add `PUTER_AUTH_TOKEN` for CareerAI chatbot route
2. Install dependencies:
   - `npm install`
3. Start development server:
   - `npm run dev`

Server runs at: `http://localhost:5000`

## Seed Data

- Run: `npm run seed`
- Creates:
  - student user
  - recruiter user
  - sample jobs
  - one sample application
  - roadmap progress docs

## API Overview

### Health
- `GET /api/health`

### Career AI
- `POST /api/career-ai`

If you do not have a Puter token yet, run:
- `npm run puter:token`

Then copy the printed value into `.env` as `PUTER_AUTH_TOKEN=...` and restart backend.

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (protected)

### Users
- `GET /api/users/profile` (protected)
- `PUT /api/users/profile` (protected)
- `GET /api/users/saved-jobs` (protected)
- `POST /api/users/saved-jobs/:jobId` (protected)
- `DELETE /api/users/saved-jobs/:jobId` (protected)
- `GET /api/users/applied-jobs` (protected)

### Jobs
- `GET /api/jobs` (public)
- `GET /api/jobs/:jobId` (public)
- `POST /api/jobs` (recruiter)
- `GET /api/jobs/recruiter/mine` (recruiter)
- `PUT /api/jobs/:jobId` (recruiter owner)
- `DELETE /api/jobs/:jobId` (recruiter owner)
- `POST /api/jobs/:jobId/apply` (student)
- `GET /api/jobs/:jobId/applicants` (recruiter owner)
- `PATCH /api/jobs/applications/:applicationId/status` (recruiter owner)

### Roadmap
- `GET /api/roadmap/paths`
- `GET /api/roadmap/progress` (protected)
- `PUT /api/roadmap/progress/:pathKey` (protected)

### Dashboard
- `GET /api/dashboard/student` (student)
- `GET /api/dashboard/recruiter` (recruiter)

## Frontend integration

In frontend `.env`, set:

`VITE_API_BASE_URL=http://localhost:5000/api`
