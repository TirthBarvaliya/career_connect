export const ROLE_RECRUITER = "recruiter";
export const ROLE_JOBSEEKER = "jobseeker";
export const ROLE_STUDENT_LEGACY = "student";
export const ROLE_ADMIN = "admin";

export const normalizeRole = (role) =>
  role === ROLE_STUDENT_LEGACY ? ROLE_JOBSEEKER : role;

export const isJobSeekerRole = (role) => normalizeRole(role) === ROLE_JOBSEEKER;
export const isAdminRole = (role) => normalizeRole(role) === ROLE_ADMIN;

