/**
 * seedDemo.js — Idempotent demo-data seeder
 *
 * Creates two demo users (Job Seeker + Recruiter) with realistic profiles,
 * job listings, applications, and roadmap progress.
 *
 * Safe to run multiple times — it only touches documents flagged isDemoUser
 * or linked to demo users. Real user data is never modified.
 *
 * Usage:  npm run seed:demo
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import RoadmapProgress from "../models/RoadmapProgress.js";
import Transaction from "../models/Transaction.js";
import roadmapTemplates from "../data/roadmapTemplates.js";

dotenv.config();

// ─── Demo credentials (must match frontend DEMO_CREDENTIALS) ────────────────
const DEMO_JOBSEEKER_EMAIL = "demo.jobseeker@mail.com";
const DEMO_RECRUITER_EMAIL = "demo.recruiter@mail.com";
const DEMO_PASSWORD = "123456";

// ─── Realistic profile data ─────────────────────────────────────────────────

const jobSeekerProfile = {
  name: "Arjun Mehta",
  email: DEMO_JOBSEEKER_EMAIL,
  password: DEMO_PASSWORD,
  role: "jobseeker",
  isDemoUser: true,
  experienceLevel: "fresher",
  location: "Mumbai, India",
  headline: "Full-Stack Developer | React & Node.js Enthusiast",
  bio: "Passionate full-stack developer with hands-on experience building modern web applications. Skilled in React, Node.js, and MongoDB. I love solving real-world problems through clean, performant code and intuitive user experiences. Currently exploring AI/ML integration in web apps.",
  skills: ["React", "Node.js", "MongoDB", "Express.js", "JavaScript", "TypeScript", "Tailwind CSS", "Git", "REST APIs", "Python"],
  experience: [
    {
      title: "Frontend Developer Intern",
      company: "TechVista Solutions",
      period: "Jun 2025 – Dec 2025",
      description: "Built responsive dashboards and data-visualization components using React and Chart.js. Improved page load performance by 35% through code splitting and lazy loading."
    },
    {
      title: "Freelance Web Developer",
      company: "Self-employed",
      period: "Jan 2025 – May 2025",
      description: "Developed full-stack portfolio websites and e-commerce landing pages for 4 clients using the MERN stack. Deployed on Vercel and Render."
    }
  ],
  education: [
    {
      degree: "B.Tech Computer Engineering",
      institute: "Gujarat Technological University",
      period: "2022 – 2026"
    },
    {
      degree: "Higher Secondary (Science)",
      institute: "Delhi Public School",
      period: "2020 – 2022"
    }
  ],
  socialLinks: {
    linkedin: "https://linkedin.com/in/demo-arjun",
    github: "https://github.com/demo-arjun",
    portfolio: "https://arjunmehta.dev",
    instagram: ""
  },
  resumeBuilder: {
    template: "modern",
    spacing: "medium",
    fontFamily: "Inter",
    fontSize: "medium",
    themeColor: "blue",
    includePhoto: true,
    fullName: "Arjun Mehta",
    headline: "Full-Stack Developer | React & Node.js Enthusiast",
    email: DEMO_JOBSEEKER_EMAIL,
    phone: "+91 98765 43210",
    location: "Mumbai, India",
    summary: "Passionate full-stack developer with hands-on experience building modern web applications. Skilled in React, Node.js, and MongoDB.",
    skills: ["React", "Node.js", "MongoDB", "Express.js", "JavaScript", "TypeScript", "Tailwind CSS", "Git"],
    experience: [
      {
        title: "Frontend Developer Intern",
        company: "TechVista Solutions",
        period: "Jun 2025 – Dec 2025",
        description: "Built responsive dashboards and data-visualization components using React and Chart.js."
      }
    ],
    education: [
      {
        degree: "B.Tech Computer Engineering",
        institute: "Gujarat Technological University",
        period: "2022 – 2026"
      }
    ],
    projects: [
      {
        name: "Career Connect",
        link: "https://github.com/demo-arjun/career-connect",
        description: "Full-stack job portal with AI-powered resume checker and career roadmap."
      },
      {
        name: "TaskFlow",
        link: "https://github.com/demo-arjun/taskflow",
        description: "Kanban board app with drag-and-drop, real-time sync, and team collaboration."
      }
    ],
    lastUpdatedAt: new Date()
  },
  roadmapSelection: {
    hasSelected: true,
    techStackSlug: "mern",
    techStackTitle: "MERN",
    selectedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
  }
};

const recruiterProfile = {
  name: "Priya Sharma",
  email: DEMO_RECRUITER_EMAIL,
  password: DEMO_PASSWORD,
  role: "recruiter",
  isDemoUser: true,
  credits: 10,
  freePostsUsed: 3,
  companyName: "InnovateTech India",
  location: "Bangalore, India",
  headline: "Senior Technical Recruiter at InnovateTech India",
  bio: "Hiring top engineering talent for one of India's fastest-growing product companies. We build enterprise SaaS tools used by 50K+ businesses. Looking for passionate developers who love shipping great products.",
  skills: ["Technical Recruiting", "Talent Acquisition", "Engineering Hiring"],
  socialLinks: {
    linkedin: "https://linkedin.com/in/demo-priya",
    github: "",
    portfolio: "https://innovatetech.in/careers",
    instagram: ""
  }
};

// ─── Job listings posted by demo recruiter ───────────────────────────────────

const demoJobs = [
  {
    title: "Senior React Developer",
    company: "InnovateTech India",
    location: "Bangalore, India",
    salary: 1800000,
    salaryMax: 2800000,
    type: "Full-time",
    remote: true,
    level: "Senior",
    tags: ["React", "TypeScript", "Redux", "Next.js", "Tailwind CSS"],
    experienceRequired: "experienced",
    minExperience: 3,
    maxExperience: 7,
    status: "active"
  },
  {
    title: "Backend Engineer (Node.js)",
    company: "InnovateTech India",
    location: "Bangalore, India",
    salary: 1500000,
    salaryMax: 2400000,
    type: "Full-time",
    remote: false,
    level: "Mid",
    tags: ["Node.js", "Express.js", "MongoDB", "REST APIs", "Docker"],
    experienceRequired: "both",
    status: "active"
  },
  {
    title: "Full-Stack Developer Intern",
    company: "InnovateTech India",
    location: "Mumbai, India",
    salary: 300000,
    salaryMax: 480000,
    type: "Internship",
    remote: true,
    level: "Entry",
    tags: ["React", "Node.js", "MongoDB", "JavaScript", "Git"],
    experienceRequired: "fresher",
    status: "active"
  },
  {
    title: "DevOps Engineer",
    company: "InnovateTech India",
    location: "Hyderabad, India",
    salary: 2000000,
    salaryMax: 3200000,
    type: "Full-time",
    remote: true,
    level: "Senior",
    tags: ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform"],
    experienceRequired: "experienced",
    minExperience: 4,
    maxExperience: 10,
    status: "active"
  },
  {
    title: "UI/UX Designer (Contract)",
    company: "InnovateTech India",
    location: "Remote",
    salary: 800000,
    salaryMax: 1400000,
    type: "Contract",
    remote: true,
    level: "Mid",
    tags: ["Figma", "UI Design", "User Research", "Design Systems", "Prototyping"],
    experienceRequired: "both",
    status: "active"
  }
];

// ─── Roadmap progress for demo job seeker ────────────────────────────────────

const createDemoRoadmapDocs = (userId) => {
  const progressValues = { frontend: 72, backend: 55, mern: 65, "ai-ml": 30, devops: 18, "product-design": 10 };

  return roadmapTemplates.map((template) => ({
    user: userId,
    pathKey: template.pathKey,
    pathTitle: template.pathTitle,
    completion: progressValues[template.pathKey] || 20,
    milestones: template.milestones.map((milestone, idx) => ({
      title: milestone.title,
      complete: idx === 0, // first milestone always done
      resources: milestone.resources
    })),
    certifications: template.certifications.map((cert, idx) => ({
      name: cert.name,
      progress: idx === 0 ? progressValues[template.pathKey] || 20 : Math.floor((progressValues[template.pathKey] || 20) / 2)
    }))
  }));
};

// ─── Main seed function ──────────────────────────────────────────────────────

const runDemoSeed = async () => {
  try {
    await connectDB();
    console.log("Connected to database. Seeding demo data...\n");

    // 1) Clean up previous demo data (idempotent)
    const prevJobSeeker = await User.findOne({ email: DEMO_JOBSEEKER_EMAIL });
    const prevRecruiter = await User.findOne({ email: DEMO_RECRUITER_EMAIL });
    const prevDemoUserIds = [prevJobSeeker?._id, prevRecruiter?._id].filter(Boolean);

    if (prevDemoUserIds.length) {
      const prevDemoJobs = await Job.find({ recruiter: { $in: prevDemoUserIds } });
      const prevDemoJobIds = prevDemoJobs.map((j) => j._id);

      await Application.deleteMany({
        $or: [
          { student: { $in: prevDemoUserIds } },
          { job: { $in: prevDemoJobIds } }
        ]
      });
      await Job.deleteMany({ recruiter: { $in: prevDemoUserIds } });
      await RoadmapProgress.deleteMany({ user: { $in: prevDemoUserIds } });
      await Transaction.deleteMany({ user: { $in: prevDemoUserIds } });
      await User.deleteMany({ _id: { $in: prevDemoUserIds } });
      console.log("  ✓ Cleaned previous demo data");
    }

    // 2) Create demo users
    const [jobSeeker, recruiter] = await User.create([jobSeekerProfile, recruiterProfile]);
    console.log(`  ✓ Created Job Seeker:  ${jobSeeker.name} (${jobSeeker.email})`);
    console.log(`  ✓ Created Recruiter:   ${recruiter.name} (${recruiter.email})`);

    // 3) Create job listings
    const jobDocs = demoJobs.map((job) => ({ ...job, recruiter: recruiter._id }));
    const jobs = await Job.create(jobDocs);

    // Stagger createdAt so the time-based filter shows different results per tab
    // Must use raw collection to bypass Mongoose timestamps overriding createdAt
    const staggerDays = [0, 2, 5, 15, 25]; // today, 2d ago, 5d ago, 15d ago, 25d ago
    const jobCollection = mongoose.connection.collection("jobs");
    for (let i = 0; i < jobs.length; i++) {
      const daysAgo = staggerDays[i] || 0;
      const staggeredDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      await jobCollection.updateOne(
        { _id: jobs[i]._id },
        { $set: { createdAt: staggeredDate } }
      );
    }
    console.log(`  ✓ Created ${jobs.length} job listings (staggered dates)`);

    // 4) Save some jobs for the job seeker
    jobSeeker.savedJobs = [jobs[0]._id, jobs[2]._id];
    await jobSeeker.save();

    // 5) Create applications from job seeker to recruiter's jobs
    const applications = await Application.create([
      {
        job: jobs[0]._id,
        student: jobSeeker._id,
        status: "Shortlisted",
        message: "I'm very excited about this opportunity. My experience with React and TypeScript aligns perfectly with your requirements.",
        resumeUrl: "",
        matchScore: 88
      },
      {
        job: jobs[1]._id,
        student: jobSeeker._id,
        status: "Applied",
        message: "Looking forward to contributing to your backend systems using Node.js and MongoDB.",
        resumeUrl: "",
        matchScore: 76
      },
      {
        job: jobs[2]._id,
        student: jobSeeker._id,
        status: "Interviewing",
        message: "As a fresher with strong MERN fundamentals, I'd love to intern with InnovateTech.",
        resumeUrl: "",
        matchScore: 92
      }
    ]);
    console.log(`  ✓ Created ${applications.length} applications`);

    // 6) Seed roadmap progress
    const roadmapDocs = createDemoRoadmapDocs(jobSeeker._id);
    await RoadmapProgress.insertMany(roadmapDocs);
    console.log(`  ✓ Created ${roadmapDocs.length} roadmap progress entries`);

    // 7) Seed sample transactions for recruiter
    await Transaction.create([
      {
        user: recruiter._id,
        type: "credit_purchase",
        amount: 15,
        planId: "standard",
        planLabel: "Standard Plan",
        price: 499,
        paymentMethod: "upi",
        description: "Purchased 15 credits via Standard Plan"
      },
      {
        user: recruiter._id,
        type: "credit_usage",
        amount: 1,
        description: "Posted job: Senior React Developer"
      },
      {
        user: recruiter._id,
        type: "credit_usage",
        amount: 1,
        description: "Posted job: Backend Engineer (Node.js)"
      },
      {
        user: recruiter._id,
        type: "credit_usage",
        amount: 1,
        description: "Posted job: Full-Stack Developer Intern"
      },
      {
        user: recruiter._id,
        type: "credit_usage",
        amount: 1,
        description: "Posted job: DevOps Engineer"
      },
      {
        user: recruiter._id,
        type: "credit_usage",
        amount: 1,
        description: "Posted job: UI/UX Designer (Contract)"
      }
    ]);
    console.log("  ✓ Created sample transaction history");

    console.log("\n══════════════════════════════════════════════════");
    console.log("  Demo seed completed successfully!");
    console.log("══════════════════════════════════════════════════");
    console.log(`\n  Job Seeker login:  ${DEMO_JOBSEEKER_EMAIL} / ${DEMO_PASSWORD}`);
    console.log(`  Recruiter login:   ${DEMO_RECRUITER_EMAIL} / ${DEMO_PASSWORD}\n`);

    process.exit(0);
  } catch (error) {
    console.error("\n  ✗ Demo seed failed:", error.message || error);
    process.exit(1);
  }
};

runDemoSeed();
