import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import RoadmapProgress from "../models/RoadmapProgress.js";
import roadmapTemplates from "../data/roadmapTemplates.js";

dotenv.config();

const createRoadmapDocs = (userId) =>
  roadmapTemplates.map((template, index) => ({
    user: userId,
    pathKey: template.pathKey,
    pathTitle: template.pathTitle,
    completion: index === 0 ? 62 : index === 1 ? 48 : 26,
    milestones: template.milestones.map((milestone, milestoneIndex) => ({
      title: milestone.title,
      complete: milestoneIndex === 0,
      resources: milestone.resources
    })),
    certifications: template.certifications.map((certificate) => ({
      name: certificate.name,
      progress: certificate.progress
    }))
  }));

const runSeed = async () => {
  try {
    await connectDB();

    await Promise.all([
      Application.deleteMany({}),
      Job.deleteMany({}),
      RoadmapProgress.deleteMany({}),
      User.deleteMany({})
    ]);

    const [student, recruiter] = await User.create([
      {
        name: "Alex Carter",
        email: "jobseeker@careerconnect.dev",
        password: "password123",
        role: "jobseeker",
        experienceLevel: "fresher",
        location: "Chicago, IL",
        headline: "Aspiring Full-Stack Developer",
        bio: "Focused on MERN and product-ready UI engineering.",
        skills: ["React", "Node.js", "MongoDB", "Tailwind"],
        experience: [
          {
            title: "Web Development Intern",
            company: "ByteBridge Labs",
            period: "May 2025 - Aug 2025",
            description: "Built internal tooling and dashboards in React."
          }
        ],
        education: [
          {
            degree: "B.Sc. Computer Science",
            institute: "Illinois Tech",
            period: "2022 - 2026"
          }
        ],
        resumeUrl: "https://example.com/resumes/alex-carter.pdf"
      },
      {
        name: "Mia Reynolds",
        email: "recruiter@careerconnect.dev",
        password: "password123",
        role: "recruiter",
        companyName: "NovaTech Systems",
        location: "New York, NY",
        headline: "Hiring top engineering talent",
        bio: "Recruiting for product engineering and data teams."
      }
    ]);

    const jobs = await Job.create([
      {
        title: "Frontend Developer",
        company: "NovaTech Systems",
        location: "New York, NY",
        salary: 110000,
        type: "Full-time",
        remote: true,
        level: "Mid",
        tags: ["React", "Tailwind", "TypeScript"],
        recruiter: recruiter._id
      },
      {
        title: "Backend Engineer",
        company: "NovaTech Systems",
        location: "Austin, TX",
        salary: 125000,
        type: "Full-time",
        remote: false,
        level: "Senior",
        tags: ["Node.js", "MongoDB", "Microservices"],
        recruiter: recruiter._id
      },
      {
        title: "AI Engineer Intern",
        company: "NovaTech Systems",
        location: "San Francisco, CA",
        salary: 48000,
        type: "Internship",
        remote: true,
        level: "Entry",
        tags: ["Python", "LLM", "PyTorch"],
        recruiter: recruiter._id
      }
    ]);

    student.savedJobs = [jobs[0]._id];
    await student.save();

    await Application.create({
      job: jobs[0]._id,
      student: student._id,
      status: "Shortlisted",
      message: "Excited about this opportunity.",
      resumeUrl: student.resumeUrl,
      matchScore: 92
    });

    await RoadmapProgress.insertMany(createRoadmapDocs(student._id));

    // eslint-disable-next-line no-console
    console.log("Seed completed.");
    // eslint-disable-next-line no-console
    console.log("Job seeker login: jobseeker@careerconnect.dev / password123");
    // eslint-disable-next-line no-console
    console.log("Recruiter login: recruiter@careerconnect.dev / password123");
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Seed failed:", error);
    process.exit(1);
  }
};

runSeed();
