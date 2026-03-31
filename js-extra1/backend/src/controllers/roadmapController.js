import asyncHandler from "../utils/asyncHandler.js";
import RoadmapProgress from "../models/RoadmapProgress.js";
import Job from "../models/Job.js";
import roadmapTemplates from "../data/roadmapTemplates.js";

const normalizeTemplate = (template) => ({
  pathKey: template.pathKey,
  pathTitle: template.pathTitle,
  completion: 0,
  milestones: template.milestones.map((milestone) => ({
    title: milestone.title,
    complete: false,
    resources: milestone.resources
  })),
  certifications: template.certifications.map((certificate) => ({
    name: certificate.name,
    progress: certificate.progress
  }))
});

const PATH_KEYWORDS = {
  frontend: ["frontend", "react", "javascript", "css", "ui", "tailwind", "web"],
  backend: ["backend", "node", "express", "api", "server", "database", "mongodb"],
  mern: ["mern", "full stack", "full-stack", "mongodb", "express", "react", "node"],
  "ai-ml": ["ai", "ml", "machine learning", "llm", "python", "data"],
  devops: ["devops", "cloud", "aws", "docker", "kubernetes", "sre", "infra"],
  "product-design": ["design", "ux", "ui", "figma", "product"]
};

const buildDemandMap = (jobs = []) => {
  const demandCounter = new Map();
  Object.keys(PATH_KEYWORDS).forEach((pathKey) => demandCounter.set(pathKey, 0));

  for (const job of jobs) {
    const haystack = `${job?.title || ""} ${(job?.tags || []).join(" ")} ${job?.company || ""}`
      .toLowerCase()
      .trim();
    if (!haystack) continue;

    for (const [pathKey, keywords] of Object.entries(PATH_KEYWORDS)) {
      const matched = keywords.some((keyword) => haystack.includes(keyword));
      if (matched) {
        demandCounter.set(pathKey, (demandCounter.get(pathKey) || 0) + 1);
      }
    }
  }

  const maxDemand = Math.max(...Array.from(demandCounter.values()), 0);
  if (maxDemand <= 0) {
    const baseline = {};
    for (const template of roadmapTemplates) {
      baseline[template.pathKey] = 12;
    }
    return baseline;
  }

  const normalized = {};
  for (const [pathKey, demand] of demandCounter.entries()) {
    normalized[pathKey] = Math.max(12, Math.round((demand / maxDemand) * 100));
  }
  return normalized;
};

export const getRoadmapPaths = asyncHandler(async (req, res) => {
  return res.status(200).json({ paths: roadmapTemplates });
});

export const getUserRoadmapProgress = asyncHandler(async (req, res) => {
  const existing = await RoadmapProgress.find({ user: req.user._id }).sort({ pathTitle: 1 });
  const existingMap = new Map(existing.map((item) => [item.pathKey, item]));

  const progress = [];
  for (const template of roadmapTemplates) {
    if (!existingMap.has(template.pathKey)) {
      const created = await RoadmapProgress.create({
        user: req.user._id,
        ...normalizeTemplate(template)
      });
      progress.push(created);
      continue;
    }
    progress.push(existingMap.get(template.pathKey));
  }

  const payload = progress.map((item) => ({
    id: String(item._id),
    pathKey: item.pathKey,
    pathTitle: item.pathTitle,
    completion: item.completion,
    milestones: item.milestones,
    certifications: item.certifications,
    updatedAt: item.updatedAt
  }));

  return res.status(200).json({ progress: payload });
});

export const updateRoadmapProgress = asyncHandler(async (req, res) => {
  const { pathKey } = req.params;
  const updates = {};

  if (typeof req.body.completion === "number") {
    updates.completion = Math.max(0, Math.min(100, req.body.completion));
  }
  if (Array.isArray(req.body.milestones)) {
    updates.milestones = req.body.milestones.map((item) => ({
      title: item.title,
      complete: Boolean(item.complete),
      resources: Array.isArray(item.resources) ? item.resources : []
    }));
  }
  if (Array.isArray(req.body.certifications)) {
    updates.certifications = req.body.certifications.map((item) => ({
      name: item.name,
      progress: Math.max(0, Math.min(100, Number(item.progress || 0)))
    }));
  }

  const existing = await RoadmapProgress.findOne({ user: req.user._id, pathKey });
  if (!existing) {
    const template = roadmapTemplates.find((item) => item.pathKey === pathKey);
    if (!template) {
      res.status(404);
      throw new Error("Roadmap path not found.");
    }
    const created = await RoadmapProgress.create({
      user: req.user._id,
      ...normalizeTemplate(template),
      ...updates
    });
    return res.status(201).json({ message: "Progress created", roadmap: created });
  }

  Object.assign(existing, updates);
  await existing.save();
  return res.status(200).json({ message: "Progress updated", roadmap: existing });
});

export const getPublicRoadmapSnapshot = asyncHandler(async (req, res) => {
  const [progressRows, activeJobs] = await Promise.all([
    RoadmapProgress.aggregate([
      {
        $group: {
          _id: "$pathKey",
          pathTitle: { $first: "$pathTitle" },
          avgCompletion: { $avg: "$completion" },
          learners: { $sum: 1 },
          updatedAt: { $max: "$updatedAt" }
        }
      }
    ]),
    Job.find({ status: "active" }).select("title tags company").lean()
  ]);

  const progressMap = new Map(
    progressRows.map((row) => [
      String(row?._id || ""),
      {
        title: String(row?.pathTitle || ""),
        avgCompletion: Number(row?.avgCompletion || 0),
        learners: Number(row?.learners || 0),
        updatedAt: row?.updatedAt || null
      }
    ])
  );
  const demandMap = buildDemandMap(activeJobs);

  const snapshot = roadmapTemplates.map((template) => {
    const pathKey = template.pathKey;
    const row = progressMap.get(pathKey);
    const fromLearners = Boolean(row && row.learners > 0);
    const completion = fromLearners
      ? Math.max(0, Math.min(100, Math.round(row.avgCompletion)))
      : Math.max(0, Math.min(100, Number(demandMap[pathKey] || 0)));

    return {
      id: pathKey,
      pathKey,
      title: row?.title || template.pathTitle,
      completion,
      source: fromLearners ? "learner-progress" : "market-demand",
      learners: row?.learners || 0,
      updatedAt: row?.updatedAt || null
    };
  });

  return res.status(200).json({
    snapshot,
    generatedAt: new Date().toISOString()
  });
});
