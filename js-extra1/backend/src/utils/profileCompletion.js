const calculateProfileCompletion = (user) => {
  const hasResume = Boolean(user.resumeDocument?.dataUrl || user.resumeUrl);
  const hasAvatar = Boolean(user.avatar?.dataUrl);
  const hasSocial =
    Boolean(user.socialLinks?.linkedin) ||
    Boolean(user.socialLinks?.github) ||
    Boolean(user.socialLinks?.instagram) ||
    Boolean(user.socialLinks?.portfolio);

  const checks = [
    Boolean(user.name),
    Boolean(user.email),
    Boolean(user.location),
    Boolean(user.headline),
    Boolean(user.bio),
    Array.isArray(user.skills) && user.skills.length > 0,
    Array.isArray(user.experience) && user.experience.length > 0,
    Array.isArray(user.education) && user.education.length > 0,
    hasResume,
    hasAvatar,
    hasSocial
  ];

  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
};

export default calculateProfileCompletion;
