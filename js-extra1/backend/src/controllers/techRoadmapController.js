import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";

const TECH_STACKS = [
  {
    id: "frontend",
    title: "Frontend",
    slug: "frontend",
    description: "Build modern user interfaces with React and Tailwind."
  },
  {
    id: "backend",
    title: "Backend",
    slug: "backend",
    description: "Build secure APIs with Node.js, Express, and MongoDB."
  },
  {
    id: "mern",
    title: "MERN",
    slug: "mern",
    description: "Learn full-stack development across MongoDB, Express, React, and Node."
  },
  {
    id: "ai-ml",
    title: "AI/ML",
    slug: "ai-ml",
    description: "Learn practical machine learning and applied AI engineering."
  },
  {
    id: "devops",
    title: "DevOps",
    slug: "devops",
    description: "Learn CI/CD, cloud fundamentals, and production deployment practices."
  }
];

const emptySelection = () => ({
  hasSelected: false,
  techStackSlug: "",
  techStackTitle: "",
  selectedAt: null
});

const normalizeSelection = (selection) => {
  if (!selection?.hasSelected || !selection?.techStackSlug) return emptySelection();
  return {
    hasSelected: true,
    techStackSlug: selection.techStackSlug,
    techStackTitle: selection.techStackTitle || "",
    selectedAt: selection.selectedAt || null
  };
};

const findTechStackBySlug = (slug) => TECH_STACKS.find((stack) => stack.slug === slug);

export const getTechStacks = asyncHandler(async (req, res) => {
  return res.status(200).json({ techStacks: TECH_STACKS });
});

export const getRoadmapSelection = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("roadmapSelection");
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  return res.status(200).json({ selection: normalizeSelection(user.roadmapSelection) });
});

export const updateRoadmapSelection = asyncHandler(async (req, res) => {
  const techStackSlug = String(req.body?.techStackSlug || "").toLowerCase().trim();

  if (!techStackSlug) {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { roadmapSelection: emptySelection() },
      { new: true, runValidators: true }
    ).select("roadmapSelection");

    if (!user) {
      res.status(404);
      throw new Error("User not found.");
    }

    return res.status(200).json({
      message: "Roadmap selection cleared.",
      selection: normalizeSelection(user.roadmapSelection)
    });
  }

  const techStack = findTechStackBySlug(techStackSlug);
  if (!techStack) {
    res.status(400);
    throw new Error("Invalid tech stack.");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      roadmapSelection: {
        hasSelected: true,
        techStackSlug: techStack.slug,
        techStackTitle: techStack.title,
        selectedAt: new Date()
      }
    },
    { new: true, runValidators: true }
  ).select("roadmapSelection");

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  return res.status(200).json({
    message: "Roadmap selection saved.",
    selection: normalizeSelection(user.roadmapSelection)
  });
});

