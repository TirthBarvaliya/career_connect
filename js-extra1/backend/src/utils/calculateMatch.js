/**
 * Dynamic match score calculator.
 * Produces a 0-99 integer based on weighted comparison of job requirements
 * against a candidate profile.
 *
 * Weights:
 *   Skill match     — 60 %
 *   Experience      — 20 %
 *   Location        — 10 %
 *   Education       — 10 %
 */

const normalise = (str) => (str || "").trim().toLowerCase();

/**
 * 60 % weight — compare job.tags (required skills) with user.skills.
 * If the job specifies no tags, default to 100 %.
 */
const skillMatch = (job, user) => {
  const required = (job.tags || []).map(normalise).filter(Boolean);
  if (!required.length) return 100;

  const userSkillSet = new Set((user.skills || []).map(normalise));
  const matched = required.filter((tag) => userSkillSet.has(tag)).length;
  return Math.round((matched / required.length) * 100);
};

/**
 * 20 % weight — presence-based experience score.
 * If the user has experience entries → 100 %, otherwise → 60 %.
 * Additional bonus: more entries = slightly higher (capped at 100).
 */
const experienceMatch = (_job, user) => {
  const entries = (user.experience || []).filter(
    (e) => e && (e.title || e.company)
  );
  if (!entries.length) return 60;
  // 1 entry = 80, 2 = 90, 3+ = 100
  return Math.min(100, 70 + entries.length * 10);
};

/**
 * 10 % weight — compare job.location with user.location.
 * Case-insensitive substring match or remote job → 100 %, else → 50 %.
 */
const locationMatch = (job, user) => {
  if (job.remote) return 100;
  const jobLoc = normalise(job.location);
  const userLoc = normalise(user.location);
  if (!jobLoc || !userLoc) return 50;
  if (jobLoc === userLoc || jobLoc.includes(userLoc) || userLoc.includes(jobLoc)) return 100;
  return 50;
};

/**
 * 10 % weight — education presence check.
 * Any education entries → 100 %, else → 60 %.
 */
const educationMatch = (_job, user) => {
  const entries = (user.education || []).filter(
    (e) => e && (e.degree || e.institute)
  );
  return entries.length ? 100 : 60;
};

/**
 * Calculate final weighted match score (0-99).
 * @param {Object} job  — Mongoose job document / plain object
 * @param {Object} user — Mongoose user document / plain object
 * @returns {number}
 */
const calculateMatch = (job, user) => {
  if (!job || !user) return 55; // safe fallback

  const score =
    skillMatch(job, user) * 0.6 +
    experienceMatch(job, user) * 0.2 +
    locationMatch(job, user) * 0.1 +
    educationMatch(job, user) * 0.1;

  return Math.min(99, Math.max(0, Math.round(score)));
};

export default calculateMatch;
