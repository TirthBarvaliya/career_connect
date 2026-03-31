import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, ChevronLeft, FileText, HelpCircle, Home, LogIn, Maximize2, MessageSquare, Minimize2, Plus, Send, Sparkles, Trash2, X } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/api";
import getErrorMessage from "../../utils/errorMessage";
import { fileToDataUrl, MAX_UPLOAD_BYTES, PDF_MIME_TYPES, validateFileByTypeAndSize } from "../../utils/fileUpload";

const GUEST_USAGE_KEY = "careerAI_guest_uses";
const GUEST_MAX_USES = 1;

const QUICK_ACTIONS = [
  { label: "Resume", mode: "resume" },
  { label: "Roadmap", mode: "roadmap" },
  { label: "Jobs", mode: "job" },
  { label: "Interview", mode: "interview" },
  { label: "Courses", mode: "course" }
];

const LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" }
];

const JOB_LOCATION_OPTIONS = [
  { value: "remote-only", label: "Remote only" },
  { value: "any-location", label: "Any location" }
];

const DEFAULT_ROADMAP_PATHS = ["Full Stack Developer", "Data Scientist", "UI/UX Designer", "DevOps Engineer"];

const WELCOME_TEXT = `CareerAI is ready.

I can help with:
1. Resume Analyzer
2. Career Roadmap Suggestion
3. Job Recommendation
4. Interview Preparation
5. Course Recommendations`;

const CAREER_AI_TIMEOUT_MS = 120000;

const createMessage = (role, content) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  role,
  content
});

const createFlowState = (activeMode = null, step = 0, collectedData = {}) => ({
  activeMode,
  step,
  collectedData
});

const normalizeLevelValue = (value) => {
  const text = String(value || "").toLowerCase();
  if (text.includes("begin")) return "beginner";
  if (text.includes("inter")) return "intermediate";
  if (text.includes("adv")) return "advanced";
  return "";
};

const toSizeLabel = (bytes = 0) => {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const isResumeAnalysisQuery = (message) => {
  const text = String(message || "").toLowerCase();
  return (
    text.includes("resume") ||
    text.includes("cv") ||
    text.includes("ats") ||
    text.includes("weakness") ||
    text.includes("improve")
  );
};

const CareerChatbot = () => {
  const isAuthenticated = useSelector((state) => Boolean(state.auth?.isAuthenticated));
  const user = useSelector((state) => state.auth?.user || null);
  const navigate = useNavigate();

  // Guest usage limiter — persists across refreshes via localStorage
  const [guestUsageExhausted, setGuestUsageExhausted] = useState(() => {
    if (isAuthenticated) return false;
    const count = parseInt(localStorage.getItem(GUEST_USAGE_KEY) || "0", 10);
    return count >= GUEST_MAX_USES;
  });

  // Reset exhausted flag when user logs in
  useEffect(() => {
    if (isAuthenticated) setGuestUsageExhausted(false);
  }, [isAuthenticated]);

  const incrementGuestUsage = useCallback(() => {
    if (isAuthenticated) return; // logged-in users have unlimited usage
    const current = parseInt(localStorage.getItem(GUEST_USAGE_KEY) || "0", 10);
    const next = current + 1;
    localStorage.setItem(GUEST_USAGE_KEY, String(next));
    if (next >= GUEST_MAX_USES) setGuestUsageExhausted(true);
  }, [isAuthenticated]);

  const isGuestBlocked = useCallback(() => {
    if (isAuthenticated) return false;
    const count = parseInt(localStorage.getItem(GUEST_USAGE_KEY) || "0", 10);
    return count >= GUEST_MAX_USES;
  }, [isAuthenticated]);

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([createMessage("assistant", WELCOME_TEXT)]);
  const [attachedResume, setAttachedResume] = useState(null);
  const [profileResume, setProfileResume] = useState(null);
  const [profileResumeChecked, setProfileResumeChecked] = useState(false);
  const [roadmapPaths, setRoadmapPaths] = useState(DEFAULT_ROADMAP_PATHS);
  const [roadmapPathsLoaded, setRoadmapPathsLoaded] = useState(false);
  const [conversationState, setConversationState] = useState(createFlowState());

  const scrollAnchorRef = useRef(null);
  const messagesRef = useRef(messages);
  const resumeFileInputRef = useRef(null);
  const streamIntervalRef = useRef(null);

  // Allow external components to open the chatbot via a custom event
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-chatbot", handleOpen);
    return () => window.removeEventListener("open-chatbot", handleOpen);
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing, isOpen]);

  useEffect(() => {
    if (!isOpen || !isAuthenticated || profileResumeChecked) return;

    let active = true;
    const loadProfileResume = async () => {
      try {
        const response = await apiClient.get("/users/profile");
        if (!active) return;
        const doc = response.data?.profile?.resumeDocument;
        const valid =
          doc &&
          typeof doc.dataUrl === "string" &&
          doc.dataUrl.startsWith("data:application/pdf;base64,") &&
          Number(doc.size || 0) > 0 &&
          Number(doc.size || 0) <= MAX_UPLOAD_BYTES;
        if (!valid) return;

        const normalized = {
          fileName: doc.fileName || "profile-resume.pdf",
          dataUrl: doc.dataUrl,
          mimeType: doc.mimeType || "application/pdf",
          size: Number(doc.size || 0),
          source: "profile"
        };
        setProfileResume(normalized);
        setAttachedResume((prev) => prev || normalized);
      } catch {
        // Keep chatbot usable.
      } finally {
        if (active) setProfileResumeChecked(true);
      }
    };

    loadProfileResume();
    return () => {
      active = false;
    };
  }, [isOpen, isAuthenticated, profileResumeChecked]);

  useEffect(() => {
    if (!isOpen || roadmapPathsLoaded) return;

    let active = true;
    const loadRoadmapPaths = async () => {
      try {
        const response = await apiClient.get("/tech-stacks");
        if (!active) return;
        const dynamicPaths = (response.data?.techStacks || [])
          .map((item) => String(item?.title || "").trim())
          .filter(Boolean);
        if (dynamicPaths.length) {
          setRoadmapPaths(Array.from(new Set([...DEFAULT_ROADMAP_PATHS, ...dynamicPaths])));
        }
      } catch {
        // Keep defaults.
      } finally {
        if (active) setRoadmapPathsLoaded(true);
      }
    };

    loadRoadmapPaths();
    return () => {
      active = false;
    };
  }, [isOpen, roadmapPathsLoaded]);

  const resetFlow = useCallback(() => {
    setConversationState(createFlowState());
  }, []);

  const appendAssistant = useCallback((text) => {
    setMessages((prev) => [...prev, createMessage("assistant", text)]);
  }, []);

  // Typewriter streaming: display reply word-by-word like ChatGPT
  const streamReply = useCallback((fullText) => {
    return new Promise((resolve) => {
      // Clear any existing stream
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);

      const msgId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setMessages((prev) => [...prev, { id: msgId, role: "assistant", content: "" }]);

      const CHARS_PER_TICK = 8;
      const TICK_MS = 15;
      let charIndex = 0;

      streamIntervalRef.current = setInterval(() => {
        charIndex = Math.min(charIndex + CHARS_PER_TICK, fullText.length);
        const partial = fullText.slice(0, charIndex);

        setMessages((prev) =>
          prev.map((msg) => (msg.id === msgId ? { ...msg, content: partial } : msg))
        );

        if (charIndex >= fullText.length) {
          clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = null;
          resolve();
        }
      }, TICK_MS);
    });
  }, []);

  const sendToAI = useCallback(
    async (displayText, promptText = displayText, options = {}) => {
      const visibleText = String(displayText || "").trim();
      const aiText = String(promptText || displayText || "").trim();
      if (!visibleText || !aiText || typing) return;

      // Guest usage gate
      if (isGuestBlocked()) {
        setMessages((prev) => [...prev, createMessage("user", visibleText)]);
        if (options.clearInput) setInput("");
        setMessages((prev) => [...prev, createMessage("assistant", "🔒 You've used your free CareerAI trial. Please log in to continue using the chatbot.")]);
        setGuestUsageExhausted(true);
        return;
      }

      const resumeForMessage = options.resumeOverride || attachedResume;
      setMessages((prev) => [...prev, createMessage("user", visibleText)]);
      if (options.clearInput) {
        setInput("");
      }
      setTyping(true);

      try {
        const baseHistory = messagesRef.current
          .filter((item) => item.role === "user" || item.role === "assistant")
          .map((item) => ({ role: item.role, content: item.content }))
          .slice(-10);
        const history = [...baseHistory, { role: "user", content: visibleText }].slice(-10);

        const payload = { message: aiText, history };
        const wantsResume = options.forceResume || isResumeAnalysisQuery(aiText);

        if (wantsResume) {
          if (resumeForMessage?.dataUrl) {
            payload.resumeDataUrl = resumeForMessage.dataUrl;
            payload.useProfileResume = resumeForMessage.source === "profile";
          } else if (isAuthenticated) {
            payload.useProfileResume = true;
          }
        }

        const response = await apiClient.post("/career-ai", payload, { timeout: CAREER_AI_TIMEOUT_MS });
        const reply = String(response?.data?.reply || "").trim() || "I could not generate a response right now.";
        // Stream the reply word-by-word
        await streamReply(reply);
        // Count this successful AI response as a guest usage
        incrementGuestUsage();
      } catch (error) {
        const timeoutError =
          String(error?.code || "").toUpperCase() === "ECONNABORTED" ||
          String(error?.message || "").toLowerCase().includes("timeout");
        setMessages((prev) => [
          ...prev,
          createMessage(
            "assistant",
            timeoutError
              ? "CareerAI is taking longer than expected. Please retry once."
              : getErrorMessage(error, "CareerAI is unavailable right now. Please try again in a moment.")
          )
        ]);
      } finally {
        setTyping(false);
      }
    },
    [attachedResume, isAuthenticated, typing, streamReply, isGuestBlocked, incrementGuestUsage]
  );

  const runRoadmapFlow = useCallback(
    async (path, level) => {
      await sendToAI(
        `Create a roadmap for ${path} (${level}).`,
        `Roadmap request:
Career path: ${path}
Current level: ${level}

Generate:
1. 6-month roadmap
2. Skills to learn
3. Projects to build
4. Certifications
5. Interview plan

Keep response medium-length and structured.`,
        { clearInput: true }
      );
    },
    [sendToAI]
  );

  const runJobsFlow = useCallback(
    async (role, location) => {
      await sendToAI(
        `Recommend jobs for ${role} in ${location}.`,
        `Job recommendation request:
Role: ${role}
Preferred location: ${location}
Experience level: ${user?.experienceLevel || "not specified"}

Provide:
1. 5 suitable roles
2. Required skills
3. Estimated salary ranges
4. Preparation tips

Keep response medium-length and structured.`,
        { clearInput: true }
      );
    },
    [sendToAI, user?.experienceLevel]
  );

  const runInterviewFlow = useCallback(
    async (role, level) => {
      await sendToAI(
        `Prepare interview plan for ${role} (${level}).`,
        `Interview preparation request:
Role: ${role}
Experience level: ${level}

Provide:
1. 10 technical questions
2. 5 HR questions
3. 3 scenario-based questions
4. Answering tips

Keep response medium-length and structured.`,
        { clearInput: true }
      );
    },
    [sendToAI]
  );

  const runCourseFlow = useCallback(
    async (careerPath, level) => {
      await sendToAI(
        `Recommend courses for ${careerPath} (${level}).`,
        `Course recommendation request:
Career path: ${careerPath}
Current level: ${level}

Provide:
1. Free resources
2. Paid certifications
3. Recommended learning order

Keep response medium-length and structured.`,
        { clearInput: true }
      );
    },
    [sendToAI]
  );

  const choiceOptions = useMemo(() => {
    const { activeMode, step } = conversationState;
    if (!activeMode) return [];

    if (activeMode === "roadmap" && step === 1) {
      return [...roadmapPaths.map((path) => ({ value: path, label: path })), { value: "custom", label: "Custom input" }];
    }
    if (activeMode === "roadmap" && step === 2) return LEVEL_OPTIONS;
    if (activeMode === "job" && step === 2) return JOB_LOCATION_OPTIONS;
    if (activeMode === "resume" && step === 1) {
      return [
        { value: "upload", label: "Upload new resume" },
        { value: "profile", label: "Analyze profile resume" }
      ];
    }
    if (activeMode === "interview" && step === 2) return LEVEL_OPTIONS;
    if (activeMode === "course" && step === 1) {
      return [...roadmapPaths.map((path) => ({ value: path, label: path })), { value: "custom", label: "Custom input" }];
    }
    if (activeMode === "course" && step === 2) return LEVEL_OPTIONS;
    return [];
  }, [conversationState, roadmapPaths]);

  const startGuidedMode = useCallback(
    (mode, label) => {
      if (typing) return;
      // Guest usage gate for guided modes
      if (isGuestBlocked()) {
        setMessages((prev) => [...prev, createMessage("user", `I need ${label.toLowerCase()} guidance.`)]);
        setMessages((prev) => [...prev, createMessage("assistant", "🔒 You've used your free CareerAI trial. Please log in to continue using the chatbot.")]);
        setGuestUsageExhausted(true);
        return;
      }
      setMessages((prev) => [...prev, createMessage("user", `I need ${label.toLowerCase()} guidance.`)]);

      if (mode === "roadmap") {
        setConversationState(createFlowState("roadmap", 1, {}));
        appendAssistant("What career path are you interested in?");
        return;
      }
      if (mode === "job") {
        setConversationState(createFlowState("job", 1, {}));
        appendAssistant("Which role are you looking for?");
        return;
      }
      if (mode === "resume") {
        setConversationState(createFlowState("resume", 1, {}));
        appendAssistant("Would you like to upload a new resume or analyze your existing profile resume?");
        return;
      }
      if (mode === "interview") {
        setConversationState(createFlowState("interview", 1, {}));
        appendAssistant("Which role are you preparing for?");
        return;
      }
      if (mode === "course") {
        setConversationState(createFlowState("course", 1, {}));
        appendAssistant("Which career path do you want course recommendations for?");
      }
    },
    [appendAssistant, typing, isGuestBlocked]
  );

  const handleChoiceSelect = useCallback(
    async (option) => {
      if (typing || !conversationState.activeMode) return;

      const value = String(option?.value || "").trim();
      const label = String(option?.label || value).trim();
      if (!value) return;

      const { activeMode, step, collectedData } = conversationState;

      if (activeMode === "roadmap" && step === 1) {
        setMessages((prev) => [...prev, createMessage("user", label)]);
        if (value === "custom") {
          setConversationState(createFlowState("roadmap", 11, { ...collectedData }));
          appendAssistant("Please type your custom career path.");
          return;
        }
        setConversationState(createFlowState("roadmap", 2, { ...collectedData, path: value }));
        appendAssistant("What is your current level?");
        return;
      }

      if (activeMode === "roadmap" && step === 2) {
        if (!collectedData.path) return;
        resetFlow();
        await runRoadmapFlow(collectedData.path, value);
        return;
      }

      if (activeMode === "job" && step === 2) {
        if (!collectedData.role) return;
        setMessages((prev) => [...prev, createMessage("user", label)]);
        resetFlow();
        await runJobsFlow(collectedData.role, label);
        return;
      }

      if (activeMode === "resume" && step === 1) {
        setMessages((prev) => [...prev, createMessage("user", label)]);
        if (value === "upload") {
          setConversationState(createFlowState("resume", 2, { source: "upload" }));
          appendAssistant("Please attach your resume PDF using the + button.");
          resumeFileInputRef.current?.click();
          return;
        }
        if (value === "profile") {
          if (profileResume?.dataUrl) {
            setAttachedResume(profileResume);
            resetFlow();
            await sendToAI(
              "Analyze my existing profile resume.",
              "Resume analyzer: Analyze my profile resume and provide strengths, weaknesses, missing skills, improvement suggestions, and ATS score out of 100.",
              { resumeOverride: profileResume, forceResume: true, clearInput: true }
            );
          } else {
            setConversationState(createFlowState("resume", 2, { source: "profile" }));
            appendAssistant("No profile resume found. Please attach a resume PDF to continue.");
          }
        }
        return;
      }

      if (activeMode === "interview" && step === 2) {
        if (!collectedData.role) return;
        setMessages((prev) => [...prev, createMessage("user", label)]);
        resetFlow();
        await runInterviewFlow(collectedData.role, value);
        return;
      }

      if (activeMode === "course" && step === 1) {
        setMessages((prev) => [...prev, createMessage("user", label)]);
        if (value === "custom") {
          setConversationState(createFlowState("course", 11, { ...collectedData }));
          appendAssistant("Please type your custom career path.");
          return;
        }
        setConversationState(createFlowState("course", 2, { ...collectedData, path: value }));
        appendAssistant("What is your current level?");
        return;
      }

      if (activeMode === "course" && step === 2) {
        if (!collectedData.path) return;
        setMessages((prev) => [...prev, createMessage("user", label)]);
        resetFlow();
        await runCourseFlow(collectedData.path, value);
      }
    },
    [
      appendAssistant,
      conversationState,
      profileResume,
      resetFlow,
      runCourseFlow,
      runInterviewFlow,
      runJobsFlow,
      runRoadmapFlow,
      sendToAI,
      typing
    ]
  );

  const handleGuidedTextInput = useCallback(
    async (rawText) => {
      const text = String(rawText || "").trim();
      if (!text || typing || !conversationState.activeMode) return;

      if (text.toLowerCase() === "cancel") {
        setMessages((prev) => [...prev, createMessage("user", text)]);
        resetFlow();
        appendAssistant("Guided mode cancelled. You can ask any career question.");
        return;
      }

      const { activeMode, step, collectedData } = conversationState;
      setMessages((prev) => [...prev, createMessage("user", text)]);

      if (activeMode === "roadmap" && (step === 1 || step === 11)) {
        setConversationState(createFlowState("roadmap", 2, { ...collectedData, path: text }));
        appendAssistant("What is your current level? (Beginner / Intermediate / Advanced)");
        return;
      }

      if (activeMode === "roadmap" && step === 2) {
        const level = normalizeLevelValue(text);
        if (!level) {
          appendAssistant("Please enter: Beginner, Intermediate, or Advanced.");
          return;
        }
        if (!collectedData.path) {
          setConversationState(createFlowState("roadmap", 1, {}));
          appendAssistant("What career path are you interested in?");
          return;
        }
        resetFlow();
        await runRoadmapFlow(collectedData.path, level);
        return;
      }

      if (activeMode === "job" && step === 1) {
        setConversationState(createFlowState("job", 2, { ...collectedData, role: text }));
        appendAssistant("What is your preferred location?");
        return;
      }

      if (activeMode === "job" && step === 2) {
        if (!collectedData.role) return;
        resetFlow();
        await runJobsFlow(collectedData.role, text);
        return;
      }

      if (activeMode === "resume" && step === 1) {
        const lowered = text.toLowerCase();
        if (lowered.includes("upload")) {
          setConversationState(createFlowState("resume", 2, { source: "upload" }));
          appendAssistant("Please attach your resume PDF using the + button.");
          resumeFileInputRef.current?.click();
          return;
        }
        if (lowered.includes("profile") || lowered.includes("existing")) {
          if (profileResume?.dataUrl) {
            setAttachedResume(profileResume);
            resetFlow();
            await sendToAI(
              "Analyze my existing profile resume.",
              "Resume analyzer: Analyze my profile resume and provide strengths, weaknesses, missing skills, improvement suggestions, and ATS score out of 100.",
              { resumeOverride: profileResume, forceResume: true, clearInput: true }
            );
          } else {
            setConversationState(createFlowState("resume", 2, { source: "profile" }));
            appendAssistant("No profile resume found. Please attach a resume PDF to continue.");
          }
          return;
        }
        appendAssistant("Please choose: upload new resume or analyze profile resume.");
        return;
      }

      if (activeMode === "resume" && step === 2) {
        appendAssistant("Please use the + button to upload your resume PDF (max 5MB).");
        return;
      }

      if (activeMode === "interview" && step === 1) {
        setConversationState(createFlowState("interview", 2, { ...collectedData, role: text }));
        appendAssistant("What is your current level?");
        return;
      }

      if (activeMode === "interview" && step === 2) {
        const level = normalizeLevelValue(text);
        if (!level) {
          appendAssistant("Please enter: Beginner, Intermediate, or Advanced.");
          return;
        }
        if (!collectedData.role) {
          setConversationState(createFlowState("interview", 1, {}));
          appendAssistant("Which role are you preparing for?");
          return;
        }
        resetFlow();
        await runInterviewFlow(collectedData.role, level);
        return;
      }

      if (activeMode === "course" && (step === 1 || step === 11)) {
        setConversationState(createFlowState("course", 2, { ...collectedData, path: text }));
        appendAssistant("What is your current level?");
        return;
      }

      if (activeMode === "course" && step === 2) {
        const level = normalizeLevelValue(text);
        if (!level) {
          appendAssistant("Please enter: Beginner, Intermediate, or Advanced.");
          return;
        }
        if (!collectedData.path) {
          setConversationState(createFlowState("course", 1, {}));
          appendAssistant("Which career path do you want course recommendations for?");
          return;
        }
        resetFlow();
        await runCourseFlow(collectedData.path, level);
      }
    },
    [
      appendAssistant,
      conversationState,
      profileResume,
      resetFlow,
      runCourseFlow,
      runInterviewFlow,
      runJobsFlow,
      runRoadmapFlow,
      sendToAI,
      typing
    ]
  );

  const onResumePicked = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        validateFileByTypeAndSize({
          file,
          allowedMimeTypes: PDF_MIME_TYPES,
          maxBytes: MAX_UPLOAD_BYTES,
          fileLabel: "Resume PDF"
        });
        const dataUrl = await fileToDataUrl(file);
        const nextResume = {
          fileName: file.name,
          dataUrl,
          mimeType: file.type || "application/pdf",
          size: file.size || 0,
          source: "upload"
        };
        setAttachedResume(nextResume);
        setMessages((prev) => [
          ...prev,
          createMessage("assistant", `Resume attached: ${nextResume.fileName}. Starting analysis now.`)
        ]);
        await sendToAI(
          `Analyze my uploaded resume (${nextResume.fileName}).`,
          "Resume analyzer: Analyze this resume and provide strengths, weaknesses, missing skills, improvement suggestions, and ATS score out of 100.",
          { resumeOverride: nextResume, forceResume: true, clearInput: true }
        );
        resetFlow();
      } catch (error) {
        setMessages((prev) => [...prev, createMessage("assistant", getErrorMessage(error, "Unable to attach resume PDF."))]);
      } finally {
        event.target.value = "";
      }
    },
    [resetFlow, sendToAI]
  );

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || typing) return;
    if (conversationState.activeMode) {
      setInput("");
      await handleGuidedTextInput(text);
      return;
    }
    await sendToAI(text, text, { clearInput: true });
  }, [conversationState.activeMode, handleGuidedTextInput, input, sendToAI, typing]);

  const onClearChat = useCallback(() => {
    setMessages([createMessage("assistant", WELCOME_TEXT)]);
    setInput("");
    resetFlow();
  }, [resetFlow]);

  const [chatTab, setChatTab] = useState("home"); // "home" | "messages" | "chat"
  const unreadCount = messages.filter((m) => m.role === "assistant").length;

  const chatPanelSizeClass = isExpanded
    ? "h-[min(78vh,620px)] w-[min(96vw,560px)]"
    : "h-[min(72vh,560px)] w-[min(92vw,420px)]";

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");

  /* â”€â”€ Home Tab â”€â”€ */
  const HomeView = (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Gradient hero area */}
      <div className="relative flex-1 overflow-hidden rounded-t-3xl bg-gradient-to-br from-brand-indigo/15 via-brand-cyan/10 to-brand-purple/15 dark:from-brand-indigo/30 dark:via-brand-cyan/20 dark:to-brand-purple/25">
        {/* Animated glow blobs */}
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-cyan/20 blur-2xl transform-gpu will-change-transform dark:bg-brand-cyan/15"
        />
        <div
          className="pointer-events-none absolute -left-8 top-12 h-24 w-24 rounded-full bg-brand-purple/15 blur-2xl transform-gpu will-change-transform dark:bg-brand-purple/12"
        />
        {/* Header */}
        <div className="relative flex items-center justify-between px-5 pb-2 pt-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo via-brand-cyan to-brand-purple text-white shadow-lg shadow-brand-indigo/25">
              <Bot size={20} />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-white">CareerAI</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/40 hover:text-slate-700 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
            aria-label="Close chatbot"
          >
            <X size={18} />
          </button>
        </div>

        {/* Welcome text inside gradient */}
        <div className="relative px-5 pb-6 pt-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Hey there {"\ud83d\udc4b"}
            <br />
            Welcome to CareerAI!
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Your AI career assistant {"\u2014"} get guidance on resume, roadmap, jobs, interviews, and courses.
          </p>
        </div>

        {/* Ask a question card */}
        <div className="relative px-5">
          <button
            type="button"
            onClick={() => setChatTab("messages")}
            className="mt-4 flex w-full items-center justify-between rounded-2xl border border-white/50 bg-white/60 px-4 py-3.5 text-left shadow-sm backdrop-blur-sm transition hover:shadow-md dark:border-slate-600/50 dark:bg-slate-800/50"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">Ask a question</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">AI Agent can help</p>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-cyan text-white">
              <HelpCircle size={14} />
            </div>
          </button>

          {/* Quick actions */}
          <div className="mt-4 flex flex-wrap gap-2 pb-4">
            {QUICK_ACTIONS.map((item) => (
              <button
                key={item.mode}
                type="button"
                onClick={() => {
                  setChatTab("chat");
                  startGuidedMode(item.mode, item.label);
                }}
                disabled={typing}
                className="rounded-full border border-white/50 bg-white/60 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm transition hover:border-brand-indigo hover:text-brand-indigo hover:shadow-md disabled:opacity-60 dark:border-slate-600/50 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:text-cyan-300"
              >
                <span className="inline-flex items-center gap-1">
                  <Sparkles size={11} />
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* â”€â”€ Messages List Tab â”€â”€ */
  const MessagesListView = (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/30 px-5 py-3 dark:border-white/10">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Messages</h3>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Close chatbot"
        >
          <X size={18} />
        </button>
      </div>

      {/* Chat thread preview */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <button
          type="button"
          onClick={() => setChatTab("chat")}
          className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-white/30 dark:hover:bg-white/5"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-cyan text-white shadow-sm">
            <Bot size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800 dark:text-white">Chat with CareerAI</p>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">now</span>
            </div>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {lastAssistantMsg
                ? `CareerAI: ${lastAssistantMsg.content.slice(0, 70)}...`
                : "Start a conversation..."}
            </p>
          </div>
        </button>
      </div>

      {/* Ask a question floating button */}
      <div className="flex justify-center px-4 pb-3">
        <button
          type="button"
          onClick={() => setChatTab("chat")}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-indigo to-brand-cyan px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-glow"
        >
          Ask a question
          <HelpCircle size={14} />
        </button>
      </div>
    </div>
  );

  /* â”€â”€ Chat Conversation View â”€â”€ */
  const ChatView = (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/30 px-4 py-3 dark:border-white/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setChatTab("messages")}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Back to messages"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo via-brand-cyan to-brand-purple text-white">
              <Bot size={14} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">CareerAI</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">AI Agent can also help</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onClearChat}
            disabled={typing}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-60 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Clear chat"
          >
            <Trash2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label={isExpanded ? "Restore size" : "Expand size"}
          >
            {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close chatbot"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4" onWheel={(event) => event.stopPropagation()}>
        {messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              {!isUser && (
                <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-cyan text-white">
                  <Bot size={12} />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${isUser
                  ? "rounded-br-md bg-gradient-to-r from-brand-indigo to-brand-cyan text-white shadow-md"
                  : "rounded-bl-md border border-white/40 bg-white/60 text-slate-700 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {!isUser && (
                  <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">CareerAI-Agent</p>
                )}
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="flex justify-start">
            <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-cyan text-white">
              <Bot size={12} />
            </div>
            <div className="rounded-2xl rounded-bl-md border border-white/40 bg-white/60 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-1.5">
                <motion.span className="h-2 w-2 rounded-full bg-brand-indigo" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }} />
                <motion.span className="h-2 w-2 rounded-full bg-brand-cyan" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
                <motion.span className="h-2 w-2 rounded-full bg-brand-purple" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} />
              </div>
            </div>
          </div>
        )}
        <div ref={scrollAnchorRef} />
      </div>

      {/* Choice options */}
      {choiceOptions.length > 0 && (
        <div className="border-t border-white/30 px-4 py-2 dark:border-white/10">
          <div className="flex flex-wrap gap-2">
            {choiceOptions.map((option) => (
              <button
                key={`${option.value}-${option.label}`}
                type="button"
                onClick={() => handleChoiceSelect(option)}
                disabled={typing}
                className="rounded-full border border-white/50 bg-white/60 px-3 py-1.5 text-xs font-medium text-slate-700 backdrop-blur-sm transition hover:border-brand-indigo hover:text-brand-indigo disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:text-cyan-300"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area or login gate */}
      <div className="border-t border-white/30 px-4 py-3 dark:border-white/10">
        {guestUsageExhausted && !isAuthenticated ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <p className="text-center text-sm font-medium text-slate-600 dark:text-slate-300">
              🔒 Free trial used. Log in to keep using CareerAI.
            </p>
            <button
              type="button"
              onClick={() => { setIsOpen(false); navigate("/login"); }}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-indigo to-brand-cyan px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-glow"
            >
              <LogIn size={16} />
              Log in to continue
            </button>
          </div>
        ) : (
          <>
            {attachedResume ? (
              <div className="mb-2 flex items-center justify-between rounded-xl border border-white/40 bg-white/50 px-2.5 py-1.5 text-[11px] text-slate-600 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    <FileText size={12} className="mr-1 inline-block" />
                    {attachedResume.fileName}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {toSizeLabel(attachedResume.size)} - {attachedResume.source === "profile" ? "Profile resume" : "Uploaded now"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {profileResume && attachedResume.source !== "profile" ? (
                    <button
                      type="button"
                      onClick={() => setAttachedResume(profileResume)}
                      className="rounded-lg border border-slate-300/80 px-1.5 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-brand-indigo hover:text-brand-indigo dark:border-slate-700 dark:text-slate-300 dark:hover:text-cyan-300"
                    >
                      Use Profile
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      setAttachedResume(profileResume && attachedResume.source !== "profile" ? profileResume : null)
                    }
                    className="rounded-lg border border-slate-300/80 px-1.5 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-500 dark:border-slate-700 dark:text-slate-300"
                  >
                    {profileResume && attachedResume.source !== "profile" ? "Clear" : "Remove"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="mb-2 text-[11px] text-slate-500 dark:text-slate-400">
                Attach resume PDF (max 5MB) with + or use your profile resume automatically.
              </p>
            )}

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => resumeFileInputRef.current?.click()}
                disabled={typing}
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-500 transition hover:border-brand-indigo hover:text-brand-indigo disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:text-cyan-300"
                aria-label="Attach resume PDF"
              >
                <Plus size={16} />
              </button>
              <input
                ref={resumeFileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={onResumePicked}
              />
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="Ask about career, resume, jobs..."
                className="field-input min-h-[42px] resize-none py-2.5 text-sm"
                disabled={typing}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={typing || !input.trim()}
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-brand-indigo to-brand-cyan text-white shadow-sm transition hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  /* â”€â”€ Tab Bar â”€â”€ */
  const TabBar = (
    <div className="flex border-t border-white/30 dark:border-white/10">
      <button
        type="button"
        onClick={() => setChatTab("home")}
        className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${chatTab === "home"
          ? "text-brand-indigo dark:text-cyan-300"
          : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          }`}
      >
        <Home size={18} />
        Home
      </button>
      <button
        type="button"
        onClick={() => setChatTab("messages")}
        className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${chatTab === "messages" || chatTab === "chat"
          ? "text-brand-indigo dark:text-cyan-300"
          : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          }`}
      >
        <div className="relative">
          <MessageSquare size={18} />
          {unreadCount > 0 && (
            <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-r from-brand-indigo to-brand-cyan px-1 text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        Messages
      </button>
    </div>
  );

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[65]">
      <AnimatePresence>
        {isOpen && (
          <motion.section
            initial={{ opacity: 0, y: 22, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24, mass: 0.8 }}
            style={{ transformOrigin: "bottom right" }}
            className={`pointer-events-auto absolute bottom-20 right-0 flex ${chatPanelSizeClass} flex-col overflow-hidden rounded-3xl border border-white/30 bg-gradient-to-br from-slate-50/95 via-indigo-50/80 to-cyan-50/70 shadow-2xl backdrop-blur-xl transition-[width,height] duration-200 dark:border-white/10 dark:from-slate-900/95 dark:via-indigo-950/90 dark:to-cyan-950/80`}
          >
            {chatTab === "home" && HomeView}
            {chatTab === "messages" && MessagesListView}
            {chatTab === "chat" && ChatView}
            {chatTab !== "chat" && TabBar}
          </motion.section>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="pointer-events-auto group relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo via-brand-cyan to-brand-purple text-white shadow-2xl ring-2 ring-white/60 transition dark:ring-slate-900/60"
        aria-label={isOpen ? "Close CareerAI" : "Open CareerAI"}
      >
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full border border-white/40"
          animate={{ scale: [1, 1.16, 1], opacity: [0.55, 0.1, 0.55] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-full border border-cyan-200/60"
          animate={{ scale: [1, 1.22, 1], opacity: [0.38, 0.08, 0.38] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        />
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-[7px] rounded-full bg-slate-900/15"
          whileHover={{ backgroundColor: "rgba(15, 23, 42, 0.28)" }}
        />
        <motion.span
          className="relative z-10 text-[11px] font-extrabold tracking-[0.16em]"
          animate={{ y: [0, -1.5, 0], letterSpacing: ["0.16em", "0.2em", "0.16em"] }}
          whileHover={{ scale: 1.08, rotate: -2 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          AI
        </motion.span>
        <motion.span
          aria-hidden
          className="pointer-events-none absolute right-[9px] top-[10px] text-[10px] text-cyan-100"
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.15, 0.8], rotate: [0, 10, 0] }}
          whileHover={{ rotate: 24, scale: 1.25 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          *
        </motion.span>
        <motion.span
          className="pointer-events-none absolute -top-8 rounded-full bg-slate-900/90 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100"
          initial={false}
          whileHover={{ y: -1 }}
        >
          {isOpen ? "Close CareerAI" : "Open CareerAI"}
        </motion.span>
      </button>
    </div>
  );
};

export default CareerChatbot;
