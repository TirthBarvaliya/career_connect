/**
 * Converts the existing resumeBuilder data into the JSON Resume schema.
 * @see https://jsonresume.org/schema
 */

const toArray = (v) => (Array.isArray(v) ? v : []);

const parsePeriod = (period) => {
  if (!period) return { startDate: "", endDate: "" };
  const parts = String(period).split(/[-–—~to]+/i).map((p) => p.trim());
  return { startDate: parts[0] || "", endDate: parts[1] || "" };
};

const convertToJsonResume = (data) => {
  const d = data || {};

  return {
    basics: {
      name: d.fullName || "",
      label: d.headline || "",
      image: d.includePhoto && d.avatarUrl ? d.avatarUrl : "",
      email: d.email || "",
      phone: d.phone || "",
      url: "",
      summary: d.summary || "",
      location: {
        address: "",
        postalCode: "",
        city: d.location || "",
        countryCode: "",
        region: ""
      },
      profiles: []
    },

    work: toArray(d.experience).map((item) => {
      const { startDate, endDate } = parsePeriod(item.period);
      return {
        name: item.company || "",
        position: item.title || "",
        startDate,
        endDate,
        summary: item.description || "",
        highlights: []
      };
    }),

    education: toArray(d.education).map((item) => {
      const { startDate, endDate } = parsePeriod(item.period);
      return {
        institution: item.institute || "",
        area: item.specialization || item.fieldOfStudy || "",
        studyType: item.degree || "",
        startDate: item.startYear || startDate || "",
        endDate: item.endYear || endDate || "",
        gpa: item.cgpa || "",
        score: item.cgpa || "",
        courses: []
      };
    }),

    skills: toArray(d.skills).length
      ? [
          {
            name: "",
            level: "",
            keywords: toArray(d.skills)
          }
        ]
      : [],

    projects: toArray(d.projects).map((item) => ({
      name: item.name || "",
      description: item.description || "",
      summary: item.description || "",
      url: item.link || "",
      startDate: "",
      endDate: "",
      entity: "",
      type: "application",
      highlights: item.description ? [item.description] : [],
      keywords: [],
      roles: []
    })),

    // Empty sections to satisfy schema
    volunteer: [],
    awards: [],
    certificates: [],
    publications: [],
    languages: [],
    interests: [],
    references: [],
    meta: {
      canonical: "",
      version: "v1.0.0",
      lastModified: new Date().toISOString()
    }
  };
};

export default convertToJsonResume;
