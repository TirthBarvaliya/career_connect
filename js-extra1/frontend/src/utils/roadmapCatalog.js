const RESOURCE_BANK = {
  frontend: [
    { title: "React Docs", url: "https://react.dev/learn", type: "documentation" },
    { title: "freeCodeCamp Frontend", url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/", type: "practice" },
    { title: "Frontend YouTube", url: "https://www.youtube.com/@freecodecamp", type: "video" },
    { title: "MDN Web Docs", url: "https://developer.mozilla.org/en-US/", type: "documentation" }
  ],
  backend: [
    { title: "Node.js Docs", url: "https://nodejs.org/en/docs", type: "documentation" },
    { title: "Express Docs", url: "https://expressjs.com/", type: "documentation" },
    { title: "MongoDB Learn", url: "https://learn.mongodb.com/", type: "practice" },
    { title: "Backend YouTube", url: "https://www.youtube.com/@TraversyMedia", type: "video" }
  ],
  mern: [
    { title: "MERN Overview", url: "https://www.mongodb.com/resources/languages/mern-stack", type: "article" },
    { title: "Redux Toolkit Docs", url: "https://redux-toolkit.js.org/", type: "documentation" },
    { title: "React Router Docs", url: "https://reactrouter.com/en/main", type: "documentation" },
    { title: "freeCodeCamp MERN", url: "https://www.youtube.com/watch?v=7CqJlxBYj-M", type: "video" }
  ],
  "ai-ml": [
    { title: "Python Docs", url: "https://docs.python.org/3/tutorial/", type: "documentation" },
    { title: "scikit-learn Guide", url: "https://scikit-learn.org/stable/user_guide.html", type: "documentation" },
    { title: "Kaggle Learn", url: "https://www.kaggle.com/learn", type: "practice" },
    { title: "PyTorch Tutorials", url: "https://pytorch.org/tutorials/", type: "documentation" }
  ],
  devops: [
    { title: "Docker Docs", url: "https://docs.docker.com/", type: "documentation" },
    { title: "Kubernetes Docs", url: "https://kubernetes.io/docs/home/", type: "documentation" },
    { title: "GitHub Actions Docs", url: "https://docs.github.com/en/actions", type: "documentation" },
    { title: "Terraform Docs", url: "https://developer.hashicorp.com/terraform/docs", type: "documentation" }
  ]
};

const r = (stackSlug, indexes = [0, 1]) =>
  indexes.map((index) => RESOURCE_BANK[stackSlug][index]).filter(Boolean);

const BLUEPRINTS = [
  {
    title: "Frontend",
    slug: "frontend",
    description: "Modern frontend roadmap with React and UI engineering.",
    steps: [
      {
        title: "Web Foundations",
        description: "HTML, CSS, and JavaScript basics.",
        estimatedHours: 22,
        subSteps: [
          { title: "Semantic HTML", description: "Build accessible structure.", miniTask: "Create semantic landing page.", resources: [3, 1] },
          { title: "Responsive CSS", description: "Master Flexbox and Grid.", miniTask: "Build responsive card layout.", resources: [3, 2] },
          { title: "DOM and Events", description: "Control browser interactions.", miniTask: "Build to-do app with persistence.", resources: [1, 2] }
        ]
      },
      {
        title: "React Fundamentals",
        description: "Components, props, hooks, and state.",
        estimatedHours: 28,
        subSteps: [
          { title: "Component Design", description: "Create reusable UI blocks.", miniTask: "Refactor a page into components.", resources: [0, 2] },
          { title: "State and Effects", description: "Manage dynamic behavior.", miniTask: "Fetch API data in dashboard.", resources: [0, 1] },
          { title: "Forms and Validation", description: "Build reliable forms.", miniTask: "Create multi-step signup form.", resources: [0, 1] }
        ]
      },
      {
        title: "Routing and App Structure",
        description: "Scale pages and navigation patterns.",
        estimatedHours: 20,
        subSteps: [
          { title: "React Router", description: "Nested and protected routes.", miniTask: "Add protected dashboard routes.", resources: [0, 2] },
          { title: "State Management", description: "Global state with Redux Toolkit.", miniTask: "Manage auth and jobs in store.", resources: [0, 1] },
          { title: "Code Splitting", description: "Lazy load large routes.", miniTask: "Implement route-based lazy loading.", resources: [0, 2] }
        ]
      },
      {
        title: "Quality and Performance",
        description: "Testing and optimization essentials.",
        estimatedHours: 18,
        subSteps: [
          { title: "Unit Testing", description: "Test critical components.", miniTask: "Test login and profile forms.", resources: [0, 2] },
          { title: "UX Performance", description: "Improve load and interaction.", miniTask: "Optimize hero and list rendering.", resources: [3, 2] },
          { title: "Production Build", description: "Prepare deployment config.", miniTask: "Deploy frontend with env setup.", resources: [0, 1] }
        ]
      },
      {
        title: "Frontend Capstone",
        description: "Ship a production-style portfolio app.",
        estimatedHours: 34,
        subSteps: [
          { title: "Planning", description: "Define pages and user flow.", miniTask: "Create feature checklist and timeline.", resources: [0, 1] },
          { title: "Implementation", description: "Build all major modules.", miniTask: "Deliver 4-6 complete pages.", resources: [0, 2] },
          { title: "Publish", description: "Document and showcase project.", miniTask: "Publish case-study README with demo.", resources: [3, 2] }
        ]
      }
    ]
  },
  {
    title: "Backend",
    slug: "backend",
    description: "Node.js, Express, MongoDB, and API security roadmap.",
    steps: [
      {
        title: "Node and Express Basics",
        description: "Build robust REST APIs.",
        estimatedHours: 24,
        subSteps: [
          { title: "Node Runtime", description: "Async patterns and modules.", miniTask: "Write a small file-processing service.", resources: [0, 3] },
          { title: "Express Routing", description: "Route handlers and middleware.", miniTask: "Build task CRUD endpoints.", resources: [1, 3] },
          { title: "Validation and Errors", description: "Input validation and errors.", miniTask: "Add centralized error middleware.", resources: [1, 0] }
        ]
      },
      {
        title: "Database Layer",
        description: "Schema design and query efficiency.",
        estimatedHours: 26,
        subSteps: [
          { title: "MongoDB Core", description: "Collections and indexes.", miniTask: "Create indexed job search queries.", resources: [2, 0] },
          { title: "Mongoose Models", description: "Schema relations and hooks.", miniTask: "Model users/jobs/applications.", resources: [2, 1] },
          { title: "Filtering and Pagination", description: "Scalable list endpoints.", miniTask: "Add filter + sort + paginate API.", resources: [2, 3] }
        ]
      },
      {
        title: "Auth and Authorization",
        description: "Secure access and role controls.",
        estimatedHours: 22,
        subSteps: [
          { title: "JWT Flow", description: "Issue and verify tokens.", miniTask: "Protect private endpoints with JWT.", resources: [0, 1] },
          { title: "Role Permissions", description: "Job seeker/recruiter access.", miniTask: "Implement role-based middleware.", resources: [1, 3] },
          { title: "Security Middleware", description: "Helmet, CORS, limits.", miniTask: "Harden API defaults for production.", resources: [0, 1] }
        ]
      },
      {
        title: "Testing and Documentation",
        description: "Confidence and clarity in APIs.",
        estimatedHours: 18,
        subSteps: [
          { title: "API Testing", description: "Unit and integration checks.", miniTask: "Add tests for auth and jobs.", resources: [0, 3] },
          { title: "Postman Collection", description: "Shareable API workflows.", miniTask: "Export API collection for team.", resources: [1, 2] },
          { title: "OpenAPI Basics", description: "Machine-readable docs.", miniTask: "Document key API endpoints.", resources: [1, 3] }
        ]
      },
      {
        title: "Backend Capstone",
        description: "Ship and monitor production API.",
        estimatedHours: 32,
        subSteps: [
          { title: "Architecture", description: "Design entities and contracts.", miniTask: "Define ERD and endpoint map.", resources: [0, 2] },
          { title: "Implementation", description: "Build complete feature set.", miniTask: "Deliver auth/jobs/dashboard APIs.", resources: [1, 2] },
          { title: "Deploy and Observe", description: "Release and monitor uptime.", miniTask: "Deploy API and add health alerts.", resources: [2, 3] }
        ]
      }
    ]
  },
  {
    title: "MERN",
    slug: "mern",
    description: "Full-stack MERN roadmap from architecture to launch.",
    steps: [
      {
        title: "MERN Architecture",
        description: "Understand end-to-end request lifecycle.",
        estimatedHours: 16,
        subSteps: [
          { title: "Request Lifecycle", description: "UI to DB flow mapping.", miniTask: "Map one complete user journey.", resources: [0, 3] },
          { title: "Schema Contracts", description: "Shared payload definitions.", miniTask: "Define schemas for auth/jobs.", resources: [1, 2] },
          { title: "Project Structure", description: "Clean repo architecture.", miniTask: "Set scripts for FE and BE.", resources: [0, 1] }
        ]
      },
      {
        title: "Cross-Stack Auth",
        description: "Secure login and role-based access.",
        estimatedHours: 20,
        subSteps: [
          { title: "Backend Auth", description: "JWT and protected routes.", miniTask: "Implement recruiter/job seeker guards.", resources: [0, 1] },
          { title: "Frontend Session", description: "Persist user/token safely.", miniTask: "Hydrate auth state on load.", resources: [1, 2] },
          { title: "API Interceptors", description: "Attach token to requests.", miniTask: "Centralize API auth behavior.", resources: [2, 3] }
        ]
      },
      {
        title: "Core Features",
        description: "Jobs, profile, and roadmap modules.",
        estimatedHours: 30,
        subSteps: [
          { title: "Jobs Workflow", description: "Search and apply flow.", miniTask: "Add advanced filters and sorting.", resources: [0, 3] },
          { title: "Profile Workflow", description: "Editable profile and uploads.", miniTask: "Enable avatar and resume updates.", resources: [1, 2] },
          { title: "Roadmap Workflow", description: "Track path and progress.", miniTask: "Enable checklist and resume point.", resources: [2, 3] }
        ]
      },
      {
        title: "Quality and Deploy",
        description: "Prepare for production delivery.",
        estimatedHours: 24,
        subSteps: [
          { title: "Health and Logging", description: "Operational checks.", miniTask: "Add health endpoint and logs.", resources: [0, 1] },
          { title: "CI/CD", description: "Automate build checks.", miniTask: "Create FE/BE CI pipelines.", resources: [1, 2] },
          { title: "Security Review", description: "Final hardening pass.", miniTask: "Run release security checklist.", resources: [0, 3] }
        ]
      },
      {
        title: "MERN Capstone",
        description: "Launch complete product.",
        estimatedHours: 38,
        subSteps: [
          { title: "Plan Sprint", description: "Define milestones.", miniTask: "Prepare sprint board and stories.", resources: [0, 1] },
          { title: "Build End-to-End", description: "Deliver core journeys.", miniTask: "Complete recruiter + user flows.", resources: [2, 3] },
          { title: "Publish and Document", description: "Ship with docs.", miniTask: "Deploy and write setup guide.", resources: [0, 2] }
        ]
      }
    ]
  },
  {
    title: "AI/ML",
    slug: "ai-ml",
    description: "Practical AI/ML roadmap from fundamentals to deployment.",
    steps: [
      {
        title: "Python and Math Foundations",
        description: "Core prerequisites for ML.",
        estimatedHours: 24,
        subSteps: [
          { title: "Python Basics", description: "Language and notebooks.", miniTask: "Create a data-cleaning script.", resources: [0, 2] },
          { title: "Math Intuition", description: "Linear algebra and probability.", miniTask: "Solve matrix/probability tasks.", resources: [0, 2] },
          { title: "Data Libraries", description: "NumPy and pandas workflows.", miniTask: "Build EDA notebook on sample data.", resources: [0, 1] }
        ]
      },
      {
        title: "Machine Learning Core",
        description: "Train and evaluate classical models.",
        estimatedHours: 30,
        subSteps: [
          { title: "Supervised Learning", description: "Regression and classification.", miniTask: "Train baseline models on dataset.", resources: [1, 2] },
          { title: "Model Evaluation", description: "Metrics and validation.", miniTask: "Report precision/recall/F1.", resources: [1, 0] },
          { title: "Feature Engineering", description: "Improve model input quality.", miniTask: "Build repeatable feature pipeline.", resources: [2, 1] }
        ]
      },
      {
        title: "Deep Learning",
        description: "Neural nets and training loops.",
        estimatedHours: 32,
        subSteps: [
          { title: "Neural Network Basics", description: "Backpropagation essentials.", miniTask: "Implement simple NN from scratch.", resources: [3, 0] },
          { title: "PyTorch Pipeline", description: "Train and evaluate models.", miniTask: "Train image classifier prototype.", resources: [3, 2] },
          { title: "Experiment Tracking", description: "Compare model runs.", miniTask: "Track and compare 5 experiments.", resources: [1, 3] }
        ]
      },
      {
        title: "LLM and RAG Basics",
        description: "Applied LLM systems.",
        estimatedHours: 26,
        subSteps: [
          { title: "Prompt Design", description: "Reliable prompt patterns.", miniTask: "Create tested prompt templates.", resources: [2, 0] },
          { title: "Retrieval Workflow", description: "Grounded responses with context.", miniTask: "Build simple RAG QA prototype.", resources: [1, 3] },
          { title: "Evaluation and Safety", description: "Quality and guardrails.", miniTask: "Define evaluation checklist.", resources: [1, 2] }
        ]
      },
      {
        title: "AI/ML Capstone",
        description: "Complete and present a production-style project.",
        estimatedHours: 40,
        subSteps: [
          { title: "Problem Framing", description: "Define success metrics.", miniTask: "Write project proposal.", resources: [2, 1] },
          { title: "Build and Deploy", description: "Train model and expose app.", miniTask: "Deploy inference demo.", resources: [3, 2] },
          { title: "Responsible AI Report", description: "Document limitations.", miniTask: "Publish model card and report.", resources: [0, 1] }
        ]
      }
    ]
  },
  {
    title: "DevOps",
    slug: "devops",
    description: "Cloud, CI/CD, observability, and operations roadmap.",
    steps: [
      {
        title: "Linux and Git Foundations",
        description: "Terminal, version control, and collaboration.",
        estimatedHours: 18,
        subSteps: [
          { title: "Linux CLI", description: "Daily terminal workflow.", miniTask: "Automate backup with shell script.", resources: [0, 2] },
          { title: "Git Workflow", description: "Branching and PR practices.", miniTask: "Run feature-branch PR lifecycle.", resources: [2, 0] },
          { title: "Networking Basics", description: "Ports, DNS, HTTP, TLS.", miniTask: "Map request path end-to-end.", resources: [1, 2] }
        ]
      },
      {
        title: "Cloud Essentials",
        description: "Core compute, storage, and IAM.",
        estimatedHours: 22,
        subSteps: [
          { title: "Compute and Storage", description: "Deploy core services.", miniTask: "Host app service in cloud.", resources: [0, 1] },
          { title: "IAM and Access", description: "Role-based cloud security.", miniTask: "Set least-privilege policy.", resources: [2, 3] },
          { title: "Load Balancing", description: "Route and scale traffic.", miniTask: "Configure app with DNS + LB.", resources: [1, 0] }
        ]
      },
      {
        title: "Containers and Orchestration",
        description: "Docker and Kubernetes fundamentals.",
        estimatedHours: 28,
        subSteps: [
          { title: "Docker Images", description: "Containerize services.", miniTask: "Containerize frontend and backend.", resources: [0, 1] },
          { title: "Kubernetes Basics", description: "Pods, deployments, services.", miniTask: "Deploy app to local k8s.", resources: [1, 0] },
          { title: "Config and Helm", description: "Manage environments.", miniTask: "Create helm values for envs.", resources: [1, 3] }
        ]
      },
      {
        title: "CI/CD and IaC",
        description: "Automate builds, tests, and infra.",
        estimatedHours: 26,
        subSteps: [
          { title: "CI Pipelines", description: "Lint/test/build automation.", miniTask: "Set CI for FE and BE.", resources: [2, 0] },
          { title: "Deployment Automation", description: "Safe release patterns.", miniTask: "Create staging-to-prod flow.", resources: [2, 1] },
          { title: "Terraform Intro", description: "Infrastructure as code.", miniTask: "Provision infra using Terraform.", resources: [3, 2] }
        ]
      },
      {
        title: "Monitoring and Capstone",
        description: "Observe and operate production reliably.",
        estimatedHours: 32,
        subSteps: [
          { title: "Metrics Dashboards", description: "Track service health.", miniTask: "Build latency/error dashboard.", resources: [1, 2] },
          { title: "Logs and Traces", description: "Debug incidents faster.", miniTask: "Centralize logs and tracing.", resources: [2, 0] },
          { title: "Reliability Playbook", description: "Incident response routines.", miniTask: "Write runbook and postmortem.", resources: [3, 1] }
        ]
      }
    ]
  }
];

const ROADMAP_CATALOG = BLUEPRINTS.map((roadmap) => ({
  ...roadmap,
  id: roadmap.slug,
  steps: (roadmap.steps || []).map((step, stepIndex) => ({
    ...step,
    id: `${roadmap.slug}-step-${stepIndex + 1}`,
    order: stepIndex + 1,
    unlockThreshold: Number(step.unlockThreshold || 70),
    subSteps: (step.subSteps || []).map((subStep, subStepIndex) => ({
      id: `${roadmap.slug}-step-${stepIndex + 1}-sub-${subStepIndex + 1}`,
      title: subStep.title,
      description: subStep.description,
      resources: r(roadmap.slug, subStep.resources),
      miniTask: subStep.miniTask
    }))
  }))
}));

export const ROADMAP_STACKS = ROADMAP_CATALOG.map((roadmap) => ({
  id: roadmap.id,
  title: roadmap.title,
  slug: roadmap.slug,
  description: roadmap.description
}));

export { ROADMAP_CATALOG };

export const getRoadmapBySlug = (slug) =>
  ROADMAP_CATALOG.find((roadmap) => roadmap.slug === slug) || ROADMAP_CATALOG[0];

