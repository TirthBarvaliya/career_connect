import { CAREER_PATHS, ROUTES, USER_ROLES } from "./constants";

export const topCategories = [
  { id: 1, title: "Software Engineering", openRoles: 1280, icon: "Code2" },
  { id: 2, title: "Data & AI", openRoles: 940, icon: "Brain" },
  { id: 3, title: "Product Management", openRoles: 510, icon: "Boxes" },
  { id: 4, title: "Design", openRoles: 430, icon: "Palette" },
  { id: 5, title: "Cloud & DevOps", openRoles: 680, icon: "CloudCog" },
  { id: 6, title: "Cybersecurity", openRoles: 350, icon: "ShieldCheck" }
];

export const featuredCompanies = [
  { id: 1, name: "NovaTech Systems", openings: 42, rating: 4.8 },
  { id: 2, name: "ByteBridge Labs", openings: 29, rating: 4.6 },
  { id: 3, name: "Aether AI", openings: 33, rating: 4.9 },
  { id: 4, name: "CloudArc Inc.", openings: 18, rating: 4.5 }
];

export const testimonials = [
  {
    id: 1,
    name: "Ava Martinez",
    role: "Frontend Engineer",
    quote:
      "The roadmap guidance helped me switch careers in six months. The personalized job recommendations felt spot on."
  },
  {
    id: 2,
    name: "Ethan Brooks",
    role: "Campus Recruiter",
    quote:
      "Filtering and applicant insights are fast and actionable. It reduced our hiring turnaround significantly."
  },
  {
    id: 3,
    name: "Noah Kim",
    role: "Data Analyst",
    quote:
      "Resume tracking and skill gap analytics made upskilling much clearer. The platform feels premium and focused."
  }
];

export const platformFeatures = [
  {
    id: "roadmaps",
    title: "Guided Career Roadmaps",
    icon: "Route",
    audience: "Job Seekers",
    summary: "Track weekly milestones, unlock badges, and follow curated learning paths for your target role.",
    bullets: [
      "Role-wise roadmap selection: Frontend, Backend, AI, DevOps",
      "Milestone progress with completion percentages",
      "Skill-gap hints tied to job demand"
    ],
    metrics: [
      { label: "Career Paths", value: `${CAREER_PATHS.length}+` },
      { label: "Milestones", value: "30+" },
      { label: "Progress Tracking", value: "Live" }
    ],
    ctaLabel: "Explore Roadmaps",
    ctaRoute: ROUTES.ROADMAP
  },
  {
    id: "hiring",
    title: "Recruiter Hiring Pipeline",
    icon: "BriefcaseBusiness",
    audience: "Recruiters",
    summary: "Post jobs, review applicants, and move candidates through shortlist, accept, or reject actions.",
    bullets: [
      "Role-based recruiter dashboard",
      "Applicant filtering with status workflows",
      "Real-time applicant + listing analytics"
    ],
    metrics: [
      { label: "Hiring Actions", value: "Shortlist / Accept / Reject" },
      { label: "Dashboard Refresh", value: "12s" },
      { label: "Applicant Insights", value: "Detailed" }
    ],
    ctaLabel: "Go to Jobs",
    ctaRoute: ROUTES.JOBS
  },
  {
    id: "resume",
    title: "Interactive Resume Builder",
    icon: "FileText",
    audience: "Job Seekers",
    summary: "Create professional resumes with template switching, live preview, PDF download, and profile sync.",
    bullets: [
      "Three template styles with live rendering",
      "One-click PDF export",
      "Upload generated resume directly to profile"
    ],
    metrics: [
      { label: "Templates", value: "20+" },
      { label: "Export", value: "PDF" },
      { label: "Storage", value: "MongoDB Synced" }
    ],
    ctaLabel: "Build Resume",
    ctaRoute: ROUTES.STUDENT_RESUME_BUILDER
  },
  {
    id: "matching",
    title: "Smart Job Discovery",
    icon: "Target",
    audience: "Job Seekers",
    summary: "Discover relevant jobs using skill-based relevance, advanced filters, and saved/apply workflows.",
    bullets: [
      "Search + debounce with dynamic filters",
      "Skill-aligned relevance scoring",
      "Track saved and applied jobs from dashboard"
    ],
    metrics: [
      { label: "Filters", value: "Location, Salary, Remote" },
      { label: "Sorting", value: "Relevance / Recent / Salary" },
      { label: "Apply Flow", value: "1-click" }
    ],
    ctaLabel: "Find Jobs",
    ctaRoute: ROUTES.JOBS
  },
  {
    id: "ai-chatbot",
    title: "AI Career Chatbot",
    icon: "Bot",
    audience: "Everyone",
    summary: "Get instant career guidance from an AI-powered chatbot. Ask about skills, career paths, interview tips, and job market trends.",
    bullets: [
      "Real-time AI-powered career conversations",
      "Domain-specific guidance across tech roles",
      "Available on every page as a floating assistant"
    ],
    metrics: [
      { label: "Response Time", value: "Instant" },
      { label: "Domains Covered", value: "10+" },
      { label: "Availability", value: "24/7" }
    ],
    ctaLabel: "Chat Now",
    ctaRoute: ROUTES.HOME
  },
  {
    id: "ai-interview",
    title: "AI Interview Prep",
    icon: "Brain",
    audience: "Job Seekers",
    summary: "Practice mock interviews with an AI coach. Get domain-specific technical questions, instant scoring, and detailed feedback.",
    bullets: [
      "5 specialized domains: Frontend, Backend, AI/ML, UI/UX, Data",
      "AI-generated technical questions with follow-ups",
      "Instant feedback with scoring after each session"
    ],
    metrics: [
      { label: "Domains", value: "5" },
      { label: "Questions/Session", value: "5" },
      { label: "AI Model", value: "Llama 3.1" }
    ],
    ctaLabel: "Start Practicing",
    ctaRoute: ROUTES.INTERVIEW
  }
];

export const jobsMock = [
  {
    id: "job-1",
    title: "Frontend Developer",
    company: "NovaTech Systems",
    location: "New York, NY",
    salary: 110000,
    type: "Full-time",
    remote: true,
    level: "Mid",
    postedAt: "2 days ago",
    postedHours: 48,
    tags: ["React", "Tailwind", "TypeScript"],
    relevance: 96
  },
  {
    id: "job-2",
    title: "Backend Engineer",
    company: "CloudArc Inc.",
    location: "Austin, TX",
    salary: 125000,
    type: "Full-time",
    remote: false,
    level: "Senior",
    postedAt: "1 day ago",
    postedHours: 24,
    tags: ["Node.js", "MongoDB", "Microservices"],
    relevance: 92
  },
  {
    id: "job-3",
    title: "AI Engineer Intern",
    company: "Aether AI",
    location: "San Francisco, CA",
    salary: 48000,
    type: "Internship",
    remote: true,
    level: "Entry",
    postedAt: "5 hours ago",
    postedHours: 5,
    tags: ["Python", "LLM", "PyTorch"],
    relevance: 89
  },
  {
    id: "job-4",
    title: "Product Designer",
    company: "ByteBridge Labs",
    location: "Seattle, WA",
    salary: 97000,
    type: "Full-time",
    remote: true,
    level: "Mid",
    postedAt: "4 days ago",
    postedHours: 96,
    tags: ["Figma", "Design Systems", "UX Research"],
    relevance: 87
  },
  {
    id: "job-5",
    title: "DevOps Engineer",
    company: "NovaTech Systems",
    location: "Remote",
    salary: 133000,
    type: "Contract",
    remote: true,
    level: "Senior",
    postedAt: "3 days ago",
    postedHours: 72,
    tags: ["AWS", "Kubernetes", "Terraform"],
    relevance: 90
  },
  {
    id: "job-6",
    title: "Junior MERN Developer",
    company: "Arcline Digital",
    location: "Boston, MA",
    salary: 84000,
    type: "Full-time",
    remote: false,
    level: "Entry",
    postedAt: "6 days ago",
    postedHours: 144,
    tags: ["MongoDB", "Express", "React"],
    relevance: 82
  }
];

export const roadmapData = CAREER_PATHS.map((path, index) => ({
  id: path.toLowerCase().replace("/", "-"),
  title: path,
  completion: 40 + index * 10,
  milestones: [
    {
      id: `${path}-m1`,
      title: `Fundamentals of ${path}`,
      complete: true,
      resources: ["Roadmap docs", "Video course", "Practice project"]
    },
    {
      id: `${path}-m2`,
      title: `Intermediate ${path} Projects`,
      complete: index < 3,
      resources: ["Case study", "Build challenge"]
    },
    {
      id: `${path}-m3`,
      title: `${path} Career Sprint`,
      complete: false,
      resources: ["Mentor review", "Mock interview kit"]
    }
  ]
}));

export const studentStats = {
  profileCompletion: 78,
  recommendedJobs: 12,
  savedJobs: 6,
  appliedJobs: 4,
  roadmapProgress: 64,
  skillsRadar: [
    { skill: "React", value: 82 },
    { skill: "Node", value: 68 },
    { skill: "DSA", value: 61 },
    { skill: "System Design", value: 54 },
    { skill: "Testing", value: 74 }
  ],
  timeline: [
    { label: "Week 1", progress: 20 },
    { label: "Week 2", progress: 42 },
    { label: "Week 3", progress: 55 },
    { label: "Week 4", progress: 64 }
  ]
};

export const recruiterStats = {
  kpis: [
    { id: "kpi-1", label: "Active Listings", value: 24, delta: "+12%" },
    { id: "kpi-2", label: "Total Applicants", value: 438, delta: "+18%" },
    { id: "kpi-3", label: "Interviews Scheduled", value: 71, delta: "+9%" },
    { id: "kpi-4", label: "Offer Acceptance", value: 64, delta: "+7%" }
  ],
  applicationsChart: [
    { job: "Frontend Dev", applicants: 124 },
    { job: "Backend Eng", applicants: 88 },
    { job: "QA Engineer", applicants: 64 },
    { job: "Data Analyst", applicants: 73 },
    { job: "Product Designer", applicants: 52 }
  ],
  applicants: [
    { id: "a1", name: "Riya Patel", role: "Frontend Developer", score: 92, status: "Shortlisted" },
    { id: "a2", name: "Daniel Scott", role: "Backend Engineer", score: 86, status: "Interviewing" },
    { id: "a3", name: "Maya Chen", role: "Product Designer", score: 81, status: "Review" },
    { id: "a4", name: "Liam Moore", role: "Data Analyst", score: 78, status: "Review" }
  ]
};

export const defaultProfile = {
  fullName: "Alex Carter",
  email: "alex.carter@careerconnect.dev",
  role: USER_ROLES.JOB_SEEKER,
  location: "Chicago, IL",
  headline: "Aspiring Full-Stack Developer",
  bio: "Focused on building performant MERN applications with delightful user experiences.",
  skills: ["React", "Node.js", "MongoDB", "Tailwind", "REST APIs"],
  experience: [
    {
      id: "e1",
      title: "Web Development Intern",
      company: "ByteBridge Labs",
      period: "May 2025 - Aug 2025",
      description: "Built internal dashboards using React and improved component load times."
    }
  ],
  education: [
    {
      id: "ed1",
      degree: "B.Sc. Computer Science",
      institute: "Illinois Tech",
      period: "2022 - 2026"
    }
  ]
};

export const notificationsMock = [
  { id: "n1", message: "Your resume was viewed by NovaTech Systems.", type: "success" },
  { id: "n2", message: "New roadmap milestone unlocked in Frontend path.", type: "info" },
  { id: "n3", message: "Application deadline approaching for AI Engineer Intern.", type: "warning" }
];
