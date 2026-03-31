export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  JOBS: "/jobs",
  ROADMAP: "/roadmap",
  PROFILE: "/profile",
  STUDENT_DASHBOARD: "/student/dashboard",
  STUDENT_RESUME_BUILDER: "/student/resume-builder",
  ATS_CHECKER: "/student/ats-checker",
  RECRUITER_DASHBOARD: "/recruiter/dashboard",
  RECRUITER_APPLICANTS: "/recruiter/applicants",
  RECRUITER_APPLICANT_PROFILE: "/recruiter/applicant/:id",
  RECRUITER_POST_JOB: "/recruiter/post-job",
  RECRUITER_INTERVIEWS: "/recruiter/interviews",
  HIRING_PIPELINE: "/recruiter/pipeline/:jobId",
  INTERVIEW: "/interview",
  ADMIN_DASHBOARD: "/admin/dashboard"
};

export const USER_ROLES = {
  JOB_SEEKER: "jobseeker",
  STUDENT: "jobseeker",
  RECRUITER: "recruiter",
  ADMIN: "admin"
};

export const JOBSEEKER_EXPERIENCE_LEVELS = [
  { value: "fresher", label: "Fresher" },
  { value: "experienced", label: "Experienced" }
];

export const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract"];

export const CAREER_PATHS = ["Frontend", "Backend", "AI/ML", "DevOps", "Product Design"];
