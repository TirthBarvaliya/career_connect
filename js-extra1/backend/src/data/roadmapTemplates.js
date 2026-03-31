const roadmapTemplates = [
  {
    pathKey: "frontend",
    pathTitle: "Frontend",
    milestones: [
      { title: "HTML, CSS, JavaScript Fundamentals", resources: ["MDN Docs", "Frontend Mentor"] },
      { title: "React and State Management", resources: ["React Docs", "Redux Toolkit Docs"] },
      { title: "Performance and Accessibility", resources: ["Lighthouse Guide", "a11y checklist"] }
    ],
    certifications: [
      { name: "Frontend Performance", progress: 0 },
      { name: "React Professional", progress: 0 }
    ]
  },
  {
    pathKey: "backend",
    pathTitle: "Backend",
    milestones: [
      { title: "Node.js and Express APIs", resources: ["Node Docs", "Express Docs"] },
      { title: "Databases and Caching", resources: ["MongoDB University", "Redis Basics"] },
      { title: "Security and Deployment", resources: ["OWASP Top 10", "Docker Basics"] }
    ],
    certifications: [
      { name: "Backend APIs", progress: 0 },
      { name: "System Design Foundations", progress: 0 }
    ]
  },
  {
    pathKey: "mern",
    pathTitle: "MERN",
    milestones: [
      { title: "MERN Architecture Basics", resources: ["MERN Overview", "MongoDB Docs"] },
      { title: "Authentication Across Stack", resources: ["JWT Guide", "Redux Toolkit Docs"] },
      { title: "Deployment and Monitoring", resources: ["Render Docs", "Vercel Docs"] }
    ],
    certifications: [
      { name: "MERN Foundations", progress: 0 },
      { name: "Full-Stack Delivery", progress: 0 }
    ]
  },
  {
    pathKey: "ai-ml",
    pathTitle: "AI/ML",
    milestones: [
      { title: "Python for ML", resources: ["Python Docs", "NumPy"] },
      { title: "Model Training and Evaluation", resources: ["Scikit-learn", "Kaggle"] },
      { title: "LLM Applications", resources: ["Hugging Face", "Prompt Engineering Guide"] }
    ],
    certifications: [
      { name: "ML Foundations", progress: 0 },
      { name: "Applied LLM Engineer", progress: 0 }
    ]
  },
  {
    pathKey: "devops",
    pathTitle: "DevOps",
    milestones: [
      { title: "Linux and Networking", resources: ["Linux Journey", "Cloudflare Learning"] },
      { title: "CI/CD and Containers", resources: ["GitHub Actions", "Docker Docs"] },
      { title: "Monitoring and Reliability", resources: ["Prometheus", "SRE Workbook"] }
    ],
    certifications: [
      { name: "Cloud Fundamentals", progress: 0 },
      { name: "Kubernetes Associate", progress: 0 }
    ]
  },
  {
    pathKey: "product-design",
    pathTitle: "Product Design",
    milestones: [
      { title: "UX Research Basics", resources: ["Nielsen Norman Group", "UX Planet"] },
      { title: "Wireframing and Design Systems", resources: ["Figma Docs", "Design System Repo"] },
      { title: "User Testing and Iteration", resources: ["Maze", "UsabilityHub"] }
    ],
    certifications: [
      { name: "UX Research", progress: 0 },
      { name: "Design System Specialist", progress: 0 }
    ]
  }
];

export default roadmapTemplates;
