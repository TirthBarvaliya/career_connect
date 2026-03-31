import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, PlayCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import RoadmapTimeline from "../components/roadmap/RoadmapTimeline";
import GlassCard from "../components/common/GlassCard";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import usePageTitle from "../hooks/usePageTitle";
import apiClient from "../utils/api";
import getErrorMessage from "../utils/errorMessage";
import { addToast } from "../redux/slices/uiSlice";
import { ROADMAP_STACKS, getRoadmapBySlug } from "../utils/roadmapCatalog";

const LOCAL_PROGRESS_KEY_PREFIX = "career_roadmap_progress_v1";
const STACK_SLUGS = new Set(ROADMAP_STACKS.map((stack) => stack.slug));
const LEGACY_SYNC_PATHS = new Set(["frontend", "backend", "mern", "ai-ml", "devops"]);

const normalizeIdArray = (value) =>
  Array.isArray(value)
    ? Array.from(
        new Set(
          value
            .map((item) => String(item || "").trim())
            .filter(Boolean)
        )
      )
    : [];

const normalizeProgressMap = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result = {};
  for (const [key, entries] of Object.entries(value)) {
    const normalizedKey = String(key || "").trim();
    if (!normalizedKey) continue;
    result[normalizedKey] = normalizeIdArray(entries);
  }
  return result;
};

const normalizeStack = (stack) => {
  const slug = String(stack?.slug || stack?.id || "")
    .toLowerCase()
    .trim();
  const title = String(stack?.title || "").trim();
  const description = String(stack?.description || "").trim();
  return {
    id: slug,
    slug,
    title: title || slug.toUpperCase(),
    description
  };
};

const computeProgressMeta = (steps = [], completedSubStepsSet = new Set()) => {
  const stepProgress = [];
  const unlockedStepIds = [];
  const completedStepIds = [];
  let totalSubSteps = 0;
  let totalCompleted = 0;

  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    const stepId = String(step.id);
    const subSteps = step.subSteps || [];
    const totalForStep = subSteps.length;
    const completedForStep = subSteps.filter((subStep) =>
      completedSubStepsSet.has(String(subStep.id))
    ).length;
    const completion = totalForStep ? Math.round((completedForStep / totalForStep) * 100) : 0;
    const unlockThreshold = Number(step.unlockThreshold || 70);
    const previousStep = stepProgress[index - 1];
    const unlocked =
      index === 0 || Boolean(previousStep && previousStep.completion >= previousStep.unlockThreshold);

    if (unlocked) unlockedStepIds.push(stepId);
    if (completion >= unlockThreshold) completedStepIds.push(stepId);

    stepProgress.push({
      stepId,
      completion,
      completedCount: completedForStep,
      totalSubSteps: totalForStep,
      unlockThreshold,
      unlocked
    });

    totalSubSteps += totalForStep;
    totalCompleted += completedForStep;
  }

  let firstIncompleteSubStep = null;
  for (const row of stepProgress) {
    if (!row.unlocked) continue;
    const step = steps.find((item) => String(item.id) === row.stepId);
    const firstPending = (step?.subSteps || []).find(
      (subStep) => !completedSubStepsSet.has(String(subStep.id))
    );
    if (firstPending) {
      firstIncompleteSubStep = { stepId: row.stepId, subStepId: String(firstPending.id) };
      break;
    }
  }

  return {
    stepProgress,
    unlockedStepIds,
    completedStepIds,
    progressPercentage: totalSubSteps ? Math.round((totalCompleted / totalSubSteps) * 100) : 0,
    firstIncompleteSubStep
  };
};

const CareerRoadmapPage = () => {
  usePageTitle("Career Roadmap");

  const dispatch = useDispatch();
  const subStepRefs = useRef({});
  const userId = useSelector((state) => state.auth.user?.id || "anonymous");
  const progressStorageKey = `${LOCAL_PROGRESS_KEY_PREFIX}:${userId}`;

  const [loading, setLoading] = useState(true);
  const [techStacks, setTechStacks] = useState([]);
  const [activeTechStackId, setActiveTechStackId] = useState("");
  const [activeTechStackTitle, setActiveTechStackTitle] = useState("");
  const [localProgressMap, setLocalProgressMap] = useState({});
  const [hydratedProgressKey, setHydratedProgressKey] = useState("");
  const [expandedStepIds, setExpandedStepIds] = useState([]);
  const [updatingSubStepId, setUpdatingSubStepId] = useState("");
  const [insightTab, setInsightTab] = useState("resources");
  const [insightQuery, setInsightQuery] = useState("");
  const [showAllInsights, setShowAllInsights] = useState(false);
  const lastExpandedStackRef = useRef("");
  const legacySyncWarningShownRef = useRef(false);

  useEffect(() => {
    setHydratedProgressKey("");
    try {
      const stored = localStorage.getItem(progressStorageKey);
      const parsed = stored ? JSON.parse(stored) : {};
      setLocalProgressMap(normalizeProgressMap(parsed));
    } catch {
      setLocalProgressMap({});
    } finally {
      setHydratedProgressKey(progressStorageKey);
    }
  }, [progressStorageKey]);

  useEffect(() => {
    if (hydratedProgressKey !== progressStorageKey) return;
    try {
      localStorage.setItem(progressStorageKey, JSON.stringify(localProgressMap));
    } catch {
      // Ignore storage failures.
    }
  }, [hydratedProgressKey, localProgressMap, progressStorageKey]);

  useEffect(() => {
    let active = true;

    const loadRoadmapSelection = async () => {
      setLoading(true);
      let stacks = ROADMAP_STACKS;
      let selectedSlug = "";

      try {
        const stacksResponse = await apiClient.get("/tech-stacks");
        const apiStacks = (stacksResponse.data?.techStacks || [])
          .map(normalizeStack)
          .filter((stack) => STACK_SLUGS.has(stack.slug));
        if (apiStacks.length) stacks = apiStacks;
      } catch (error) {
        dispatch(
          addToast({
            type: "warning",
            message: getErrorMessage(error, "Using local roadmap list.")
          })
        );
      }

      try {
        const selectionResponse = await apiClient.get("/progress/selection");
        const storedSlug = String(selectionResponse.data?.selection?.techStackSlug || "")
          .toLowerCase()
          .trim();
        if (storedSlug && stacks.some((stack) => stack.slug === storedSlug)) {
          selectedSlug = storedSlug;
        }
      } catch {
        // Selection endpoint is optional for UI load; fallback to first stack.
      }

      if (!active) return;

      const initialSlug = selectedSlug || stacks[0]?.slug || ROADMAP_STACKS[0]?.slug || "";
      const initialTitle = stacks.find((stack) => stack.slug === initialSlug)?.title || "";

      setTechStacks(stacks);
      setActiveTechStackId(initialSlug);
      setActiveTechStackTitle(initialTitle);
      setLoading(false);
    };

    loadRoadmapSelection();
    return () => {
      active = false;
    };
  }, [dispatch]);

  const activeRoadmap = useMemo(
    () =>
      getRoadmapBySlug(
        activeTechStackId || techStacks[0]?.slug || ROADMAP_STACKS[0]?.slug || "frontend"
      ),
    [activeTechStackId, techStacks]
  );

  const completedSubSteps = useMemo(
    () => normalizeIdArray(localProgressMap[activeTechStackId]),
    [activeTechStackId, localProgressMap]
  );

  const completedSubStepSet = useMemo(
    () => new Set(completedSubSteps.map((id) => String(id))),
    [completedSubSteps]
  );

  const progress = useMemo(() => {
    const meta = computeProgressMeta(activeRoadmap?.steps || [], completedSubStepSet);
    return {
      ...meta,
      completedSubSteps: Array.from(completedSubStepSet),
      completedSteps: meta.completedStepIds
    };
  }, [activeRoadmap?.steps, completedSubStepSet]);

  const stepProgressMap = useMemo(() => {
    const map = new Map();
    (progress.stepProgress || []).forEach((row) => map.set(String(row.stepId), row));
    return map;
  }, [progress.stepProgress]);

  const totalEstimatedHours = useMemo(
    () =>
      (activeRoadmap?.steps || []).reduce((sum, step) => sum + Number(step.estimatedHours || 0), 0),
    [activeRoadmap?.steps]
  );

  const enrichedSteps = useMemo(
    () =>
      (activeRoadmap?.steps || []).map((step) => {
        const fallbackTotal = (step.subSteps || []).length;
        const row = stepProgressMap.get(String(step.id)) || {
          completion: 0,
          completedCount: 0,
          totalSubSteps: fallbackTotal,
          unlockThreshold: Number(step.unlockThreshold || 70),
          unlocked: Number(step.order || 1) === 1
        };
        return {
          ...step,
          completion: row.completion,
          completedCount: row.completedCount,
          totalSubSteps: row.totalSubSteps,
          unlocked: row.unlocked,
          unlockThreshold: row.unlockThreshold,
          subSteps: (step.subSteps || []).map((subStep) => ({
            ...subStep,
            completed: completedSubStepSet.has(String(subStep.id))
          }))
        };
      }),
    [activeRoadmap?.steps, completedSubStepSet, stepProgressMap]
  );

  const timelinePaths = useMemo(
    () => {
      const sourceStacks = (techStacks || []).length ? techStacks : ROADMAP_STACKS;
      return sourceStacks.map((stack) => {
        const roadmap = getRoadmapBySlug(stack.slug);
        const completedSet = new Set(normalizeIdArray(localProgressMap[stack.slug]));
        const meta = computeProgressMeta(roadmap.steps || [], completedSet);
        return {
          ...stack,
          id: stack.slug,
          progressPercentage: meta.progressPercentage
        };
      });
    },
    [localProgressMap, techStacks]
  );

  const resources = useMemo(() => {
    const seen = new Set();
    const rows = [];
    for (const step of enrichedSteps) {
      for (const subStep of step.subSteps || []) {
        for (const resource of subStep.resources || []) {
          if (!resource || typeof resource !== "object") continue;
          const title = String(resource.title || "").trim();
          const link = String(resource.url || "").trim();
          const type = String(resource.type || "article").trim();
          if (!title || !link) continue;
          const key = String(resource.url || resource.title || "")
            .toLowerCase()
            .trim();
          if (!key || seen.has(key)) continue;
          seen.add(key);
          rows.push({
            id: `${subStep.id}-${link}`,
            title,
            link,
            provider: `${step.title} • ${type}`
          });
        }
      }
    }
    return rows;
  }, [enrichedSteps]);

  const miniProjects = useMemo(() => {
    const rows = [];
    for (const step of enrichedSteps) {
      for (const subStep of step.subSteps || []) {
        if (!subStep.miniTask) continue;
        rows.push({
          id: `${step.id}-${subStep.id}`,
          title: subStep.title,
          task: subStep.miniTask
        });
      }
    }
    return rows;
  }, [enrichedSteps]);

  const filteredResources = useMemo(() => {
    const q = insightQuery.toLowerCase().trim();
    if (!q) return resources;
    return resources.filter(
      (item) =>
        String(item?.title || "")
          .toLowerCase()
          .includes(q) ||
        String(item?.provider || "")
          .toLowerCase()
          .includes(q) ||
        String(item?.link || "")
          .toLowerCase()
          .includes(q)
    );
  }, [insightQuery, resources]);

  const filteredMiniProjects = useMemo(() => {
    const q = insightQuery.toLowerCase().trim();
    if (!q) return miniProjects;
    return miniProjects.filter(
      (item) =>
        String(item?.title || "")
          .toLowerCase()
          .includes(q) ||
        String(item?.task || "")
          .toLowerCase()
          .includes(q)
    );
  }, [insightQuery, miniProjects]);

  const visibleResources = useMemo(
    () => (showAllInsights ? filteredResources : filteredResources.slice(0, 8)),
    [filteredResources, showAllInsights]
  );
  const visibleMiniProjects = useMemo(
    () => (showAllInsights ? filteredMiniProjects : filteredMiniProjects.slice(0, 8)),
    [filteredMiniProjects, showAllInsights]
  );

  const registerSubStepRef = useCallback((subStepId, node) => {
    if (!subStepId) return;
    if (node) subStepRefs.current[subStepId] = node;
    else delete subStepRefs.current[subStepId];
  }, []);

  useEffect(() => {
    if (!activeTechStackId || lastExpandedStackRef.current === activeTechStackId) return;
    lastExpandedStackRef.current = activeTechStackId;
    const initialStepId =
      progress.firstIncompleteSubStep?.stepId ||
      enrichedSteps.find((step) => step.unlocked)?.id ||
      enrichedSteps[0]?.id ||
      "";
    setExpandedStepIds(initialStepId ? [initialStepId] : []);
  }, [activeTechStackId, enrichedSteps, progress.firstIncompleteSubStep?.stepId]);

  useEffect(() => {
    if (!activeTechStackId || !LEGACY_SYNC_PATHS.has(activeTechStackId)) return undefined;

    const timeoutId = window.setTimeout(async () => {
      try {
        await apiClient.put(`/roadmap/progress/${activeTechStackId}`, {
          completion: Number(progress.progressPercentage || 0)
        });
      } catch (error) {
        if (legacySyncWarningShownRef.current) return;
        legacySyncWarningShownRef.current = true;
        dispatch(
          addToast({
            type: "warning",
            message: getErrorMessage(error, "Roadmap progress sync to backend failed.")
          })
        );
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [activeTechStackId, dispatch, progress.progressPercentage]);

  const handleToggleStep = (stepId) => {
    setExpandedStepIds((prev) => (prev.includes(stepId) ? [] : [stepId]));
  };

  const handleSubStepToggle = (step, subStep, nextCompleted) => {
    if (!step?.unlocked) {
      dispatch(addToast({ type: "warning", message: "Complete current step to unlock." }));
      return;
    }
    if (!activeTechStackId) return;

    setUpdatingSubStepId(subStep.id);
    setLocalProgressMap((prev) => {
      const safePrev = normalizeProgressMap(prev);
      const set = new Set(normalizeIdArray(safePrev[activeTechStackId]));
      if (nextCompleted) set.add(String(subStep.id));
      else set.delete(String(subStep.id));
      return {
        ...safePrev,
        [activeTechStackId]: Array.from(set)
      };
    });
    window.setTimeout(() => setUpdatingSubStepId(""), 120);
  };

  const handleResumeLearning = () => {
    const target = progress.firstIncompleteSubStep;
    if (!target?.stepId || !target?.subStepId) {
      dispatch(addToast({ type: "success", message: "Roadmap complete. Great work." }));
      return;
    }

    setExpandedStepIds((prev) => (prev.includes(target.stepId) ? prev : [...prev, target.stepId]));

    window.setTimeout(() => {
      const node = subStepRefs.current[target.subStepId];
      if (node && typeof node.scrollIntoView === "function") {
        node.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 120);
  };

  const handlePathChange = async (path) => {
    const slug = String(path?.slug || path?.id || "")
      .toLowerCase()
      .trim();
    if (!slug || slug === activeTechStackId) return;

    setActiveTechStackId(slug);
    setActiveTechStackTitle(path?.title || "");
    setInsightQuery("");
    setShowAllInsights(false);

    try {
      await apiClient.put("/progress/selection", { techStackSlug: slug });
    } catch (error) {
      dispatch(
        addToast({
          type: "warning",
          message: getErrorMessage(error, "Roadmap opened, but selection could not be synced.")
        })
      );
    }
  };

  useEffect(() => {
    if (activeTechStackId) return;
    const fallbackPath = timelinePaths[0];
    if (!fallbackPath?.slug) return;
    setActiveTechStackId(fallbackPath.slug);
    setActiveTechStackTitle(fallbackPath.title || "");
  }, [activeTechStackId, timelinePaths]);

  if (loading) {
    return (
      <div className="container-4k py-10">
        <LoadingSkeleton className="mb-4 h-14 w-1/3" />
        <LoadingSkeleton className="mb-4 h-32 w-full" />
        <LoadingSkeleton className="mb-4 h-96 w-full" />
        <LoadingSkeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="container-4k py-10">
      <div className="mb-6">
        <h1 className="font-poppins text-3xl font-semibold text-slate-900 dark:text-white">
          Career Roadmap Guidance
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Choose your path, unlock milestones, track progress, and follow curated free resources.
        </p>
      </div>

      <GlassCard className="mb-6 p-5" hoverable={false}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-300">Overall Progress</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {progress.progressPercentage || 0}%
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Total estimated time: {totalEstimatedHours} hours
            </p>
          </div>
          <button
            type="button"
            onClick={handleResumeLearning}
            className="rounded-xl border border-brand-indigo/40 bg-brand-indigo/10 px-4 py-2 text-sm font-semibold text-brand-indigo transition hover:bg-brand-indigo/15 dark:bg-brand-indigo/20 dark:text-cyan-300"
          >
            <span className="inline-flex items-center gap-2">
              <PlayCircle size={15} />
              Resume Learning
            </span>
          </button>
        </div>
        <div className="mt-4 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand-indigo via-brand-cyan to-brand-emerald"
            initial={{ width: 0 }}
            animate={{ width: `${progress.progressPercentage || 0}%` }}
            transition={{ duration: 0.65 }}
          />
        </div>
      </GlassCard>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div>
          <RoadmapTimeline
            paths={timelinePaths}
            activePathId={activeTechStackId}
            activePathTitle={activeTechStackTitle}
            steps={enrichedSteps}
            expandedStepIds={expandedStepIds}
            updatingSubStepId={updatingSubStepId}
            onPathChange={handlePathChange}
            onToggleStep={handleToggleStep}
            onSubStepToggle={handleSubStepToggle}
            registerSubStepRef={registerSubStepRef}
          />
        </div>

        <div className="learning-hub-sticky xl:self-start">
          <GlassCard className="p-4 sm:p-5" hoverable={false}>
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Learning Hub</h3>
              <span className="rounded-full bg-slate-200/75 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {activeTechStackTitle}
              </span>
            </div>

            <div className="mb-3 flex rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setInsightTab("resources");
                  setShowAllInsights(false);
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  insightTab === "resources"
                    ? "bg-white text-brand-indigo shadow-sm dark:bg-slate-700 dark:text-cyan-300"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                }`}
              >
                Resources ({filteredResources.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setInsightTab("projects");
                  setShowAllInsights(false);
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  insightTab === "projects"
                    ? "bg-white text-brand-indigo shadow-sm dark:bg-slate-700 dark:text-cyan-300"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                }`}
              >
                Projects ({filteredMiniProjects.length})
              </button>
            </div>

            <input
              type="text"
              value={insightQuery}
              onChange={(event) => setInsightQuery(event.target.value)}
              placeholder={insightTab === "resources" ? "Search resources..." : "Search mini projects..."}
              className="mb-3 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm outline-none transition focus:border-brand-indigo/50 focus:ring-2 focus:ring-brand-indigo/20 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-cyan-400/50 dark:focus:ring-cyan-400/20"
            />

            <div className="max-h-[58vh] space-y-2 overflow-y-auto pr-1">
              {insightTab === "resources" ? (
                <>
                  {!visibleResources.length && (
                    <p className="text-sm text-slate-500 dark:text-slate-300">No resources found.</p>
                  )}
                  {visibleResources.map((resource) => (
                    <motion.a
                      key={resource.id}
                      href={resource.link}
                      target="_blank"
                      rel="noreferrer"
                      whileHover={{ y: -1 }}
                      className="group block rounded-xl border border-slate-200/70 bg-white/80 p-3 transition hover:border-brand-indigo/35 dark:border-slate-700 dark:bg-slate-900/75 dark:hover:border-brand-cyan/35"
                    >
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{resource.title}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{resource.provider}</p>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-indigo dark:text-cyan-300">
                        Open <ExternalLink size={12} />
                      </span>
                    </motion.a>
                  ))}
                </>
              ) : (
                <>
                  {!visibleMiniProjects.length && (
                    <p className="text-sm text-slate-500 dark:text-slate-300">No mini projects found.</p>
                  )}
                  {visibleMiniProjects.map((item, index) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -1 }}
                      className="rounded-xl border border-slate-200/70 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/75"
                    >
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {index + 1}. {item.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{item.task}</p>
                    </motion.div>
                  ))}
                </>
              )}
            </div>

            {((insightTab === "resources" && filteredResources.length > 8) ||
              (insightTab === "projects" && filteredMiniProjects.length > 8)) && (
              <button
                type="button"
                onClick={() => setShowAllInsights((prev) => !prev)}
                className="mt-3 w-full rounded-xl border border-brand-indigo/30 bg-brand-indigo/10 px-3 py-2 text-xs font-semibold text-brand-indigo transition hover:bg-brand-indigo/15 dark:bg-brand-indigo/20 dark:text-cyan-300"
              >
                {showAllInsights ? "Show Less" : "Show More"}
              </button>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default CareerRoadmapPage;
