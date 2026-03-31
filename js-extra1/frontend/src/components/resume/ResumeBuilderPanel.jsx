import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileUp, Save, Sparkles, Edit3, Layout, Palette, Loader2, Eye, ChevronDown, ChevronUp, Bold, Italic, Underline, List } from "lucide-react";
import GradientButton from "../common/GradientButton";
import GlassCard from "../common/GlassCard";
import CustomSelect from "../common/CustomSelect";
import TemplateSelector from "./TemplateSelector";
import FormattingPanel from "./FormattingPanel";
import AiWriteModal from "./AiWriteModal";
import { addToast } from "../../redux/slices/uiSlice";
import apiClient from "../../utils/api";
import getErrorMessage from "../../utils/errorMessage";
import { blobToDataUrl } from "../../utils/fileUpload";
import { buildResumePdf } from "../../utils/resumePdf";
import { useDispatch } from "react-redux";
import { SearchableDropdown } from "./SearchableDropdown";
import { InstituteSearch } from "./InstituteSearch";

const markdownToHtml = (md) => {
  if (!md) return "";
  let html = md.toString();
  html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  html = html.replace(/\*(.*?)\*/g, '<i>$1</i>');
  html = html.replace(/__(.*?)__/g, '<u>$1</u>');
  html = html.replace(/_(.*?)_/g, '<i>$1</i>');
  html = html.replace(/^[\s]*-\s+(.*)/gm, '<li>$1</li>');
  html = html.replace(/^[\s]*\*\s+(.*)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  html = html.replace(/\n/g, '<br>');
  return html;
};

const RichTextArea = ({ value, onChange, placeholder, id, minHeight = "120px" }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = (e) => {
    onChange(e.currentTarget.innerHTML);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '\t');
    }
  };

  return (
    <div
      ref={editorRef}
      id={id}
      contentEditable
      className="w-full bg-transparent p-3 pb-6 text-sm text-slate-800 focus:outline-none dark:text-slate-200 overflow-y-auto whitespace-pre-wrap outline-none empty:before:content-[attr(placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none"
      placeholder={placeholder}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      style={{ minHeight }}
    />
  );
};

const AccordionSection = ({ title, badge, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-200/60 dark:border-slate-700/60">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-4 text-left focus:outline-none"
      >
        <span className="flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
          {title}
          {badge}
        </span>
        {isOpen ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4 pt-1 space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BUILT_IN_TEMPLATES = new Set(["modern", "classic", "minimal"]);

const emptyExperience = { title: "", company: "", period: "", description: "" };
const emptyEducation = { degree: "", specialization: "", institute: "", instituteDomain: "", instituteLogo: "", period: "" };
const emptyProject = { name: "", link: "", description: "" };

const INDIAN_DEGREES = [
  "B.Tech", "B.E", "B.Sc", "B.Com", "BBA", "BCA", "MBA", "M.Tech",
  "M.Sc", "MCA", "PhD", "Diploma", "12th Standard", "10th Standard"
];

const SPECIALIZATIONS = {
  "B.Tech": ["Computer Science Engineering", "Information Technology", "Mechanical Engineering", "Civil Engineering", "Electrical Engineering", "Electronics Engineering", "Chemical Engineering", "Aerospace Engineering"],
  "B.E": ["Computer Science Engineering", "Information Technology", "Mechanical Engineering", "Civil Engineering", "Electrical Engineering", "Electronics Engineering", "Chemical Engineering", "Automobile Engineering"],
  "B.Sc": ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Science", "Information Technology", "Biotechnology", "Microbiology"],
  "B.Com": ["General", "Honours", "Accounting and Finance", "Taxation", "Banking and Insurance", "Corporate Secretaryship"],
  "MBA": ["Finance", "Marketing", "Human Resources", "Operations", "Business Analytics", "International Business", "IT Systems"],
  "M.Tech": ["Computer Science", "Structural Engineering", "Thermal Engineering", "VLSI Design", "Power Electronics", "Data Science"],
  "M.Sc": ["Physics", "Chemistry", "Mathematics", "Botany", "Zoology", "Computer Science", "Data Analytics"],
  "BBA": ["General", "Finance", "Marketing", "Human Resources", "International Business"],
  "BCA": ["General", "Cloud Computing", "Data Science", "Cyber Security"],
  "MCA": ["General", "Artificial Intelligence", "Cloud Computing"],
  "Diploma": ["Mechanical", "Computer Engineering", "Civil", "Electrical", "Electronics", "Automobile"],
  "12th Standard": ["Science (PCM)", "Science (PCB)", "Commerce", "Arts/Humanities"],
  "10th Standard": ["General"]
};

const normalizeResumeBuilder = (profile) => {
  const builder = profile?.resumeBuilder || {};
  const safeExperience =
    Array.isArray(builder.experience) && builder.experience.length ? builder.experience : profile?.experience || [];
  const safeEducation =
    Array.isArray(builder.education) && builder.education.length ? builder.education : profile?.education || [];

  return {
    template: builder.template || "modern",
    spacing: builder.spacing || "medium",
    fontFamily: builder.fontFamily || "Inter",
    fontSize: builder.fontSize || "medium",
    themeColor: builder.themeColor || "blue",
    includePhoto: typeof builder.includePhoto === "boolean" ? builder.includePhoto : true,
    fullName: builder.fullName || profile?.name || "",
    headline: builder.headline || profile?.headline || "",
    email: builder.email || profile?.email || "",
    phone: builder.phone || "",
    location: builder.location || profile?.location || "",
    summary: builder.summary || profile?.bio || "",
    skills: Array.isArray(builder.skills) && builder.skills.length ? builder.skills : profile?.skills || [],
    experience: safeExperience.length ? safeExperience : [emptyExperience],
    education: safeEducation.length ? safeEducation : [emptyEducation],
    projects: Array.isArray(builder.projects) && builder.projects.length ? builder.projects : [emptyProject]
  };
};

const splitSkills = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

// ── Built-in template previews (kept for modern/classic/minimal) ─────

const templateSurface = {
  modern:
    "border-brand-indigo/35 bg-gradient-to-br from-white via-white to-brand-indigo/5 dark:from-slate-900 dark:via-slate-900 dark:to-brand-indigo/10",
  classic:
    "border-slate-400/45 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900",
  minimal:
    "border-emerald-300/40 bg-gradient-to-br from-white via-emerald-50/40 to-cyan-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-900/20"
};

const PreviewSection = ({ title, children }) => (
  <div>
    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
    {children}
  </div>
);

const ModernPreview = ({ payload, avatar }) => (
  <div className="space-y-3 text-sm">
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <p className="text-2xl font-semibold text-slate-900 dark:text-white">{payload.fullName || "Your Name"}</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">{payload.headline || "Professional Headline"}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {[payload.email, payload.phone, payload.location].filter(Boolean).join(" • ")}
        </p>
      </div>
      {payload.includePhoto && avatar?.dataUrl ? (
        <img src={avatar.dataUrl} alt="Profile" className="h-16 w-16 rounded-xl object-cover" />
      ) : null}
    </div>
    <PreviewSection title="Summary">
      <p className="text-slate-600 dark:text-slate-300">{payload.summary || "Add your summary."}</p>
    </PreviewSection>
    <PreviewSection title="Skills">
      <div className="flex flex-wrap gap-1.5">
        {(payload.skills || []).map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-brand-indigo/10 px-2 py-1 text-xs font-medium text-brand-indigo dark:bg-brand-indigo/20 dark:text-cyan-300"
          >
            {skill}
          </span>
        ))}
        {!payload.skills?.length && <p className="text-slate-500 dark:text-slate-400">No skills yet.</p>}
      </div>
    </PreviewSection>
    <PreviewSection title="Experience">
      <div className="space-y-2">
        {(payload.experience || []).slice(0, 3).map((item, idx) => (
          <div key={`m-exp-${idx}`} className="rounded-lg border border-slate-200/70 bg-white/70 p-2 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="font-medium text-slate-800 dark:text-slate-100">
              {item.title || "Role"} {item.company ? `• ${item.company}` : ""}
            </p>
            {item.period && <p className="text-xs text-slate-500 dark:text-slate-400">{item.period}</p>}
          </div>
        ))}
      </div>
    </PreviewSection>
    <PreviewSection title="Education">
      <div className="space-y-2">
        {(payload.education || []).slice(0, 3).map((item, idx) => (
          <div key={`m-edu-${idx}`} className="rounded-lg border border-slate-200/70 bg-white/70 p-2 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="font-medium text-slate-800 dark:text-slate-100">
              {[item.degree, item.specialization].filter(Boolean).join(" in ") || "Degree"} {item.institute ? `• ${item.institute}` : ""}
            </p>
            {item.period && <p className="text-xs text-slate-500 dark:text-slate-400">{item.period}</p>}
          </div>
        ))}
      </div>
    </PreviewSection>
  </div>
);

const ClassicPreview = ({ payload, avatar }) => (
  <div className="space-y-3 text-sm">
    <div className="rounded-lg border border-slate-300/70 bg-white/80 p-4 text-center dark:border-slate-700 dark:bg-slate-900/70">
      <p className="font-poppins text-2xl font-semibold uppercase tracking-wide text-slate-900 dark:text-white">
        {payload.fullName || "Your Name"}
      </p>
      <p className="mt-1 text-xs uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300">
        {payload.headline || "Professional Headline"}
      </p>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {[payload.email, payload.phone, payload.location].filter(Boolean).join(" | ")}
      </p>
      {payload.includePhoto && avatar?.dataUrl ? (
        <img src={avatar.dataUrl} alt="Profile" className="mx-auto mt-3 h-14 w-14 rounded-full object-cover" />
      ) : null}
    </div>
    <div className="space-y-3 border-t border-b border-slate-300/70 py-3 dark:border-slate-700">
      <PreviewSection title="Professional Summary">
        <p className="leading-relaxed text-slate-700 dark:text-slate-300">{payload.summary || "Add your summary."}</p>
      </PreviewSection>
      <PreviewSection title="Core Skills">
        <p className="text-slate-700 dark:text-slate-300">
          {(payload.skills || []).length ? payload.skills.join(" • ") : "No skills yet."}
        </p>
      </PreviewSection>
    </div>
    <PreviewSection title="Experience">
      <div className="space-y-2">
        {(payload.experience || []).slice(0, 3).map((item, idx) => (
          <div key={`c-exp-${idx}`} className="rounded-lg border border-slate-300/70 bg-white/80 p-2.5 dark:border-slate-700 dark:bg-slate-900/65">
            <p className="font-semibold text-slate-900 dark:text-white">{item.title || "Role"}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {[item.company, item.period].filter(Boolean).join(" | ")}
            </p>
          </div>
        ))}
      </div>
    </PreviewSection>
    <PreviewSection title="Education">
      <div className="space-y-2">
        {(payload.education || []).slice(0, 3).map((item, idx) => (
          <div key={`c-edu-${idx}`} className="rounded-lg border border-slate-300/70 bg-white/80 p-2.5 dark:border-slate-700 dark:bg-slate-900/65">
            <p className="font-semibold text-slate-900 dark:text-white">
              {[item.degree, item.specialization].filter(Boolean).join(" in ") || "Degree"}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {[item.institute, item.period].filter(Boolean).join(" | ")}
            </p>
          </div>
        ))}
      </div>
    </PreviewSection>
  </div>
);

const MinimalPreview = ({ payload, avatar }) => (
  <div className="grid gap-3 md:grid-cols-[180px_1fr]">
    <div className="rounded-lg border border-emerald-300/40 bg-emerald-50/70 p-3 dark:border-emerald-800/40 dark:bg-emerald-900/25">
      {payload.includePhoto && avatar?.dataUrl ? (
        <img src={avatar.dataUrl} alt="Profile" className="mb-3 h-16 w-16 rounded-xl object-cover" />
      ) : null}
      <p className="text-base font-semibold text-slate-900 dark:text-white">{payload.fullName || "Your Name"}</p>
      <p className="text-xs text-slate-600 dark:text-slate-300">{payload.headline || "Headline"}</p>
      <div className="mt-3 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
        <p>{payload.email || "email@example.com"}</p>
        <p>{payload.phone || "+00 0000 0000"}</p>
        <p>{payload.location || "Location"}</p>
      </div>
      <div className="mt-3">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Skills</p>
        <div className="space-y-1">
          {(payload.skills || []).slice(0, 8).map((skill) => (
            <p key={skill} className="text-[11px] text-slate-700 dark:text-slate-200">
              {skill}
            </p>
          ))}
        </div>
      </div>
    </div>
    <div className="space-y-3 text-sm">
      <PreviewSection title="Summary">
        <p className="text-slate-700 dark:text-slate-300">{payload.summary || "Add your summary."}</p>
      </PreviewSection>
      <PreviewSection title="Experience">
        <div className="space-y-2">
          {(payload.experience || []).slice(0, 3).map((item, idx) => (
            <div key={`n-exp-${idx}`} className="rounded-lg border border-slate-200/70 bg-white/75 p-2 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="font-medium text-slate-800 dark:text-slate-100">
                {item.title || "Role"} {item.company ? `• ${item.company}` : ""}
              </p>
              {item.period ? <p className="text-xs text-slate-500 dark:text-slate-400">{item.period}</p> : null}
              {item.description ? <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.description}</p> : null}
            </div>
          ))}
        </div>
      </PreviewSection>
      <PreviewSection title="Education">
        <div className="space-y-2">
          {(payload.education || []).slice(0, 3).map((item, idx) => (
            <div key={`n-edu-${idx}`} className="rounded-lg border border-slate-200/70 bg-white/75 p-2 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="font-medium text-slate-800 dark:text-slate-100">
                {[item.degree, item.specialization].filter(Boolean).join(" in ") || "Degree"} {item.institute ? `• ${item.institute}` : ""}
              </p>
              {item.period ? <p className="text-xs text-slate-500 dark:text-slate-400">{item.period}</p> : null}
            </div>
          ))}
        </div>
      </PreviewSection>
    </div>
  </div>
);

const renderBuiltInPreview = ({ template, payload, avatar }) => {
  if (template === "classic") return <ClassicPreview payload={payload} avatar={avatar} />;
  if (template === "minimal") return <MinimalPreview payload={payload} avatar={avatar} />;
  return <ModernPreview payload={payload} avatar={avatar} />;
};

// ── Left panel tabs ─────────────────────────────────────────────────

const MOBILE_TABS = [
  { id: "preview", label: "Preview", icon: Eye },
  { id: "editor", label: "Editor", icon: Edit3 },
  { id: "templates", label: "Templates", icon: Layout },
  { id: "formatting", label: "Formatting", icon: Palette }
];
const DESKTOP_TABS = MOBILE_TABS.filter(t => t.id !== "preview");

// ── Main component ──────────────────────────────────────────────────

const ResumeBuilderPanel = ({ profile, onProfileUpdated, variant = "embedded" }) => {
  const dispatch = useDispatch();
  const [resumeData, setResumeData] = useState(() => normalizeResumeBuilder(profile));
  const [savingDraft, setSavingDraft] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");

  // AI Write modal state
  const [aiModal, setAiModal] = useState({ open: false, section: "", text: "", onInsert: null });

  const openAiModal = (section, text, insertFn) => {
    setAiModal({ open: true, section, text, onInsert: insertFn });
  };

  const closeAiModal = () => {
    setAiModal({ open: false, section: "", text: "", onInsert: null });
  };

  const handleAiInsert = (generatedText) => {
    if (aiModal.onInsert) aiModal.onInsert(generatedText);
    closeAiModal();
  };

  // Server-rendered HTML preview for JSON Resume themes
  const [themeHtml, setThemeHtml] = useState("");
  const [themeLoading, setThemeLoading] = useState(false);
  const [themeInitialized, setThemeInitialized] = useState(false);
  const renderTimer = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    setResumeData(normalizeResumeBuilder(profile));
  }, [profile]);

  // Utility to apply formatting in RichTextArea
  const applyFormat = (command) => {
    document.execCommand(command, false, null);
  };

  const skillsCsv = useMemo(() => (resumeData.skills || []).join(", "), [resumeData.skills]);
  const avatar = profile?.avatar || { dataUrl: "", mimeType: "", size: 0 };
  const isPage = variant === "page";
  const isBuiltIn = BUILT_IN_TEMPLATES.has(resumeData.template);

  // Serialize arrays for dependency tracking
  const experienceKey = JSON.stringify(resumeData.experience || []);
  const educationKey = JSON.stringify(resumeData.education || []);
  const projectsKey = JSON.stringify(resumeData.projects || []);

  // Debounced server render for JSON Resume themes
  const prevTemplateRef = useRef(resumeData.template);
  useEffect(() => {
    if (isBuiltIn) {
      setThemeHtml("");
      setThemeInitialized(false);
      return;
    }

    // Reset on template switch so iframe re-initializes via srcDoc
    const templateChanged = prevTemplateRef.current !== resumeData.template;
    prevTemplateRef.current = resumeData.template;
    if (templateChanged) {
      setThemeInitialized(false);
      setThemeHtml("");
    }

    clearTimeout(renderTimer.current);
    const needsFullLoad = templateChanged || !themeInitialized || !themeHtml;
    renderTimer.current = setTimeout(async () => {
      if (needsFullLoad) setThemeLoading(true);
      try {
        const resp = await apiClient.post("/resume/render", {
          resumeData: payloadForSave,
          themeId: resumeData.template,
          formatting: {
            spacing: resumeData.spacing,
            fontFamily: resumeData.fontFamily,
            fontSize: resumeData.fontSize,
            themeColor: resumeData.themeColor
          }
        });
        const html = resp.data.html || "";
        setThemeHtml(html);

        // Write directly to iframe contentDocument for smooth update (no reload)
        // Only do this if iframe already initialized (not first load)
        if (!needsFullLoad) {
          const iframe = iframeRef.current;
          if (iframe && iframe.contentDocument) {
            iframe.contentDocument.open();
            iframe.contentDocument.write(html);
            iframe.contentDocument.close();
          }
        }
        setThemeInitialized(true);
      } catch {
        setThemeHtml("<p style='color:red;padding:16px;'>Failed to render theme. Make sure the backend is running.</p>");
      } finally {
        setThemeLoading(false);
      }
    }, templateChanged ? 200 : 800);

    return () => clearTimeout(renderTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData.template, resumeData.spacing, resumeData.fontFamily, resumeData.fontSize, resumeData.themeColor, resumeData.fullName, resumeData.headline, resumeData.summary, resumeData.email, resumeData.phone, resumeData.location, skillsCsv, experienceKey, educationKey, projectsKey, isBuiltIn]);

  const setField = (field, value) => {
    setResumeData((prev) => ({ ...prev, [field]: value }));
  };

  const setNestedField = (key, index, field, value) => {
    setResumeData((prev) => {
      const next = Array.isArray(prev[key]) ? [...prev[key]] : [];
      next[index] = { ...(next[index] || {}), [field]: value };
      return { ...prev, [key]: next };
    });
  };

  const addRow = (key, payload) => {
    setResumeData((prev) => ({ ...prev, [key]: [...(prev[key] || []), payload] }));
  };

  const removeRow = (key, index) => {
    setResumeData((prev) => {
      const next = (prev[key] || []).filter((_, rowIndex) => rowIndex !== index);
      const fallback = key === "experience" ? emptyExperience : key === "education" ? emptyEducation : emptyProject;
      return { ...prev, [key]: next.length ? next : [fallback] };
    });
  };

  const payloadForSave = useMemo(
    () => ({
      ...resumeData,
      avatarUrl: avatar?.dataUrl || "",
      skills: splitSkills(skillsCsv),
      experience: resumeData.experience?.filter((item) => item.title || item.company || item.period || item.description) || [],
      education: resumeData.education?.filter((item) => item.degree || item.institute || item.period) || [],
      projects: resumeData.projects?.filter((item) => item.name || item.link || item.description) || []
    }),
    [resumeData, skillsCsv, avatar]
  );

  const saveDraft = async () => {
    try {
      setSavingDraft(true);
      const response = await apiClient.put("/users/resume-builder", {
        resumeBuilder: payloadForSave
      });
      onProfileUpdated?.(response.data.profile);
      dispatch(addToast({ type: "success", message: "Resume draft saved to profile." }));
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Unable to save resume draft.") }));
    } finally {
      setSavingDraft(false);
    }
  };

  const buildPdfDocument = () =>
    buildResumePdf({
      resumeData: payloadForSave,
      avatar
    });

  const downloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const baseName = (payloadForSave.fullName || "resume").toLowerCase().replace(/[^a-z0-9]+/g, "-") || "resume";

      if (isBuiltIn) {
        // Use existing jsPDF for built-in templates
        const doc = buildPdfDocument();
        doc.save(`${baseName}.pdf`);
      } else {
        // Try server-side Puppeteer, fall back to jsPDF
        try {
          const resp = await apiClient.post("/resume/export-pdf", {
            resumeData: payloadForSave,
            themeId: resumeData.template,
            formatting: {
              spacing: resumeData.spacing,
              fontFamily: resumeData.fontFamily,
              fontSize: resumeData.fontSize,
              themeColor: resumeData.themeColor
            }
          }, { responseType: "blob" });

          const url = URL.createObjectURL(resp.data);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${baseName}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        } catch {
          // Fallback: generate PDF client-side with jsPDF
          const doc = buildPdfDocument();
          doc.save(`${baseName}.pdf`);
        }
      }

      dispatch(addToast({ type: "success", message: "Resume PDF downloaded." }));
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Unable to download resume PDF.") }));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const uploadGeneratedPdfToProfile = async () => {
    try {
      setUploadingPdf(true);

      let dataUrl;
      let safeName = (payloadForSave.fullName || "resume").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      let blobSize;

      if (isBuiltIn) {
        const doc = buildPdfDocument();
        const blob = doc.output("blob");
        dataUrl = await blobToDataUrl(blob);
        blobSize = blob.size;
      } else {
        // Try server-side Puppeteer export first, fall back to jsPDF
        try {
          const resp = await apiClient.post("/resume/export-pdf", {
            resumeData: payloadForSave,
            themeId: resumeData.template,
            formatting: {
              spacing: resumeData.spacing,
              fontFamily: resumeData.fontFamily,
              fontSize: resumeData.fontSize,
              themeColor: resumeData.themeColor
            }
          }, { responseType: "blob" });
          dataUrl = await blobToDataUrl(resp.data);
          blobSize = resp.data.size;
        } catch {
          // Fallback: generate PDF client-side with jsPDF
          const doc = buildPdfDocument();
          const blob = doc.output("blob");
          dataUrl = await blobToDataUrl(blob);
          blobSize = blob.size;
        }
      }

      const response = await apiClient.put("/users/resume-builder", {
        resumeBuilder: payloadForSave,
        resumeDocument: {
          fileName: `${safeName || "resume"}-${Date.now()}.pdf`,
          dataUrl,
          mimeType: "application/pdf",
          size: blobSize,
          source: "builder"
        }
      });

      onProfileUpdated?.(response.data.profile);
      dispatch(addToast({ type: "success", message: "Generated PDF uploaded to your profile." }));
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Unable to upload generated PDF.") }));
    } finally {
      setUploadingPdf(false);
    }
  };

  // ── Built-in preview with projects ────

  const builtInPreviewThemeClass = templateSurface[resumeData.template] || templateSurface.modern;

  const renderProjectsSection = () =>
    payloadForSave.projects?.length ? (
      <div className="mt-3">
        <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Sparkles size={12} className="text-brand-indigo" />
          Projects
        </p>
        <div className="space-y-2">
          {payloadForSave.projects.slice(0, 3).map((item, idx) => (
            <div key={`preview-proj-${idx}`} className="rounded-lg border border-slate-200/70 bg-white/70 p-2 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.name || "Project"}</p>
              {item.link ? <p className="text-xs text-brand-indigo dark:text-cyan-300">{item.link}</p> : null}
              {item.description ? <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.description}</p> : null}
            </div>
          ))}
        </div>
      </div>
    ) : null;

  const activeLeftTab = activeTab === "preview" ? "editor" : activeTab;

  return (
    <div className="relative w-full pb-20 md:pb-0">
      <GlassCard className={isPage ? "p-6" : "p-5"} hoverable={false}>
        {/* ── Header Bar ── */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className={`${isPage ? "text-xl" : "text-lg"} font-semibold text-slate-900 dark:text-white`}>Resume Builder</h3>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Choose template, edit details, preview live, then export PDF.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <GradientButton className="px-3 py-2 text-xs sm:text-sm" onClick={saveDraft} disabled={savingDraft}>
              <span className="inline-flex items-center gap-1">
                <Save size={14} />
                {savingDraft ? "Saving..." : "Save Draft"}
              </span>
            </GradientButton>

            <button
              type="button"
              onClick={uploadGeneratedPdfToProfile}
              disabled={uploadingPdf}
              className="rounded-xl border border-emerald-300/70 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-200"
            >
              <span className="inline-flex items-center gap-1">
                <FileUp size={14} />
                {uploadingPdf ? "Uploading..." : "Upload PDF"}
              </span>
            </button>
          </div>
        </div>

        {/* ── Main Layout: Left Tabs + Right Preview ── */}
        <div className={`grid gap-5 md:grid-cols-2 ${isPage ? "xl:grid-cols-[1.2fr_1.1fr]" : ""}`}>
          {/* ── Left panel ── */}
          <div className={`rounded-xl border border-slate-200/70 bg-white/70 ${isPage ? "p-5" : "p-4"} dark:border-slate-700 dark:bg-slate-900/75 ${activeTab === "preview" ? "hidden md:block" : "block"}`}>
            {/* Tab bar (Desktop) */}
            <div className="hidden md:flex mb-4 gap-1 rounded-xl bg-slate-100/80 p-1 dark:bg-slate-800/80">
              {DESKTOP_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${activeTab === tab.id
                      ? "bg-white text-brand-indigo shadow-sm dark:bg-slate-700 dark:text-cyan-300"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {activeLeftTab === "editor" && (
                <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1">
                  <AccordionSection title="Personal details" defaultOpen={true}>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input className="field-input" placeholder="Full Name" value={resumeData.fullName} onChange={(e) => setField("fullName", e.target.value)} />
                      <input className="field-input" placeholder="Headline" value={resumeData.headline} onChange={(e) => setField("headline", e.target.value)} />
                      <input className="field-input" placeholder="Email" value={resumeData.email} onChange={(e) => setField("email", e.target.value)} />
                      <input className="field-input" placeholder="Phone" value={resumeData.phone} onChange={(e) => setField("phone", e.target.value)} />
                      <input className="field-input sm:col-span-2" placeholder="Location" value={resumeData.location} onChange={(e) => setField("location", e.target.value)} />
                    </div>
                  </AccordionSection>

                  <AccordionSection
                    title="Profile summary"
                    badge={<span className="inline-flex items-center justify-center gap-1 rounded-full bg-brand-indigo/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-brand-indigo dark:bg-cyan-900/30 dark:text-cyan-300"><Sparkles size={10} /> AI-powered</span>}
                  >
                    <div className="rounded-xl border border-slate-200/70 bg-white overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-brand-indigo/30 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:ring-cyan-500/30">
                      <RichTextArea
                        id="textarea-summary"
                        placeholder="Write a short paragraph about yourself. Include your role and what you've worked on. Talk about your biggest wins, what motivates you, and the key skills you bring to the table."
                        value={resumeData.summary}
                        onChange={(val) => setField("summary", val)}
                      />
                      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-3 py-2 dark:border-slate-700/60 dark:bg-slate-800/40">
                        <div className="flex gap-3 text-slate-400 dark:text-slate-500">
                          <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }} className="transition hover:text-slate-600 dark:hover:text-slate-300" aria-label="Bold"><Bold size={15} /></button>
                          <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }} className="transition hover:text-slate-600 dark:hover:text-slate-300" aria-label="Italic"><Italic size={15} /></button>
                          <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormat('underline'); }} className="transition hover:text-slate-600 dark:hover:text-slate-300" aria-label="Underline"><Underline size={15} /></button>
                          <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormat('insertUnorderedList'); }} className="transition hover:text-slate-600 dark:hover:text-slate-300" aria-label="List"><List size={15} /></button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{resumeData.summary?.replace(/<[^>]+>/g, '').length || 0}/1000</span>
                          <button
                            type="button"
                            onClick={() => openAiModal("summary", (resumeData.summary || "").replace(/<[^>]+>/g, ''), (text) => setField("summary", markdownToHtml(text)))}
                            className="inline-flex items-center gap-1.5 font-semibold text-brand-indigo text-[13px] transition hover:text-brand-indigo/80 dark:text-cyan-400 dark:hover:text-cyan-300"
                          >
                            Write with AI <Sparkles size={14} fill="currentColor" className="text-brand-indigo dark:text-cyan-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </AccordionSection>

                  <AccordionSection title="Key skills">
                    <input className="field-input" placeholder="Skills separated by comma" value={skillsCsv} onChange={(e) => setField("skills", splitSkills(e.target.value))} />
                  </AccordionSection>

                  <AccordionSection title="Photo & Settings">
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded accent-brand-indigo"
                        checked={resumeData.includePhoto}
                        onChange={(e) => setField("includePhoto", e.target.checked)}
                      />
                      Include profile picture
                    </label>
                  </AccordionSection>

                  <AccordionSection
                    title="Work experience"
                    badge={<span className="inline-flex items-center justify-center gap-1 rounded-full bg-brand-indigo/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-brand-indigo dark:bg-cyan-900/30 dark:text-cyan-300"><Sparkles size={10} /> AI-powered</span>}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Experience</p>
                        <button type="button" onClick={() => addRow("experience", emptyExperience)} className="text-xs font-semibold text-brand-indigo dark:text-cyan-300">+ Add</button>
                      </div>
                      {(resumeData.experience || []).map((item, index) => (
                        <div key={`exp-${index}`} className="rounded-xl border border-slate-200/70 p-3 dark:border-slate-700">
                          <div className="grid gap-2 sm:grid-cols-2">
                            <input className="field-input" placeholder="Role" value={item.title || ""} onChange={(e) => setNestedField("experience", index, "title", e.target.value)} />
                            <input className="field-input" placeholder="Company" value={item.company || ""} onChange={(e) => setNestedField("experience", index, "company", e.target.value)} />
                            <input className="field-input sm:col-span-2" placeholder="Period" value={item.period || ""} onChange={(e) => setNestedField("experience", index, "period", e.target.value)} />
                          </div>
                          <div className="mt-3 rounded-xl border border-slate-200/70 bg-white overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-brand-indigo/30 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:ring-cyan-500/30">
                            <RichTextArea
                              id={`textarea-experience-${index}`}
                              placeholder="What did you do? Describe your responsibilities and achievements."
                              value={item.description || ""}
                              onChange={(val) => setNestedField("experience", index, "description", val)}
                              minHeight="70px"
                            />
                            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-3 py-2 dark:border-slate-700/60 dark:bg-slate-800/40">
                              <div className="flex gap-3 text-slate-400 dark:text-slate-500">
                                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }} className="transition hover:text-slate-600 dark:hover:text-slate-300"><Bold size={14} /></button>
                                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }} className="transition hover:text-slate-600 dark:hover:text-slate-300"><Italic size={14} /></button>
                                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormat('underline'); }} className="transition hover:text-slate-600 dark:hover:text-slate-300"><Underline size={14} /></button>
                                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormat('insertUnorderedList'); }} className="transition hover:text-slate-600 dark:hover:text-slate-300"><List size={14} /></button>
                              </div>
                              <button
                                type="button"
                                onClick={() => openAiModal("experience", (item.description || "").replace(/<[^>]+>/g, ''), (text) => setNestedField("experience", index, "description", markdownToHtml(text)))}
                                className="inline-flex items-center gap-1.5 font-semibold text-brand-indigo text-xs transition hover:text-brand-indigo/80 dark:text-cyan-400 dark:hover:text-cyan-300"
                              >
                                Write with AI <Sparkles size={13} fill="currentColor" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 flex justify-end">
                            <button type="button" className="text-xs font-semibold text-rose-500 transition hover:text-rose-600 dark:text-rose-400" onClick={() => removeRow("experience", index)}>Remove Role</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionSection>

                  {/* Education */}
                  <AccordionSection title="Education">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Education</p>
                        <button type="button" onClick={() => addRow("education", emptyEducation)} className="text-xs font-semibold text-brand-indigo dark:text-cyan-300">+ Add</button>
                      </div>
                      {(resumeData.education || []).map((item, index) => (
                        <div key={`edu-${index}`} className="rounded-xl border border-slate-200/70 p-3 dark:border-slate-700">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <SearchableDropdown
                              placeholder="Degree (e.g., B.Tech)"
                              value={item.degree || ""}
                              options={INDIAN_DEGREES}
                              onChange={(val) => {
                                setNestedField("education", index, "degree", val);
                                setNestedField("education", index, "specialization", ""); // Reset spec
                              }}
                            />
                            <SearchableDropdown
                              placeholder="Specialization / Field"
                              value={item.specialization || ""}
                              options={SPECIALIZATIONS[item.degree] || []}
                              disabled={!item.degree}
                              onChange={(val) => setNestedField("education", index, "specialization", val)}
                            />

                            <div className="sm:col-span-2">
                              <InstituteSearch
                                placeholder="Institute Name (Search universities in India)"
                                value={item.institute || ""}
                                onChange={(val) => setNestedField("education", index, "institute", val)}
                                onDomainChange={(val) => setNestedField("education", index, "instituteDomain", val)}
                              />
                            </div>

                            <input className="field-input sm:col-span-2" placeholder="Period (e.g., 2020 - 2024)" value={item.period || ""} onChange={(e) => setNestedField("education", index, "period", e.target.value)} />
                          </div>
                          <button type="button" className="mt-2 text-xs text-rose-500" onClick={() => removeRow("education", index)}>Remove</button>
                        </div>
                      ))}
                    </div>
                  </AccordionSection>

                  <AccordionSection
                    title="Projects"
                    badge={<span className="inline-flex items-center justify-center gap-1 rounded-full bg-brand-indigo/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-brand-indigo dark:bg-cyan-900/30 dark:text-cyan-300"><Sparkles size={10} /> AI-powered</span>}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Projects</p>
                        <button type="button" onClick={() => addRow("projects", emptyProject)} className="text-xs font-semibold text-brand-indigo dark:text-cyan-300">+ Add</button>
                      </div>
                      {(resumeData.projects || []).map((item, index) => (
                        <div key={`proj-${index}`} className="rounded-xl border border-slate-200/70 p-3 dark:border-slate-700">
                          <input className="field-input" placeholder="Project Name" value={item.name || ""} onChange={(e) => setNestedField("projects", index, "name", e.target.value)} />
                          <input className="field-input mt-2" placeholder="Project Link (https://...)" value={item.link || ""} onChange={(e) => setNestedField("projects", index, "link", e.target.value)} />
                          <div className="mt-3 rounded-xl border border-slate-200/70 bg-white overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-brand-indigo/30 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:ring-cyan-500/30">
                            <RichTextArea
                              id={`textarea-projects-${index}`}
                              placeholder="Describe the project, tools used, and the impact."
                              value={item.description || ""}
                              onChange={(val) => setNestedField("projects", index, "description", val)}
                              minHeight="70px"
                            />
                            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-3 py-2 dark:border-slate-700/60 dark:bg-slate-800/40">
                              <div className="flex gap-3 text-slate-400 dark:text-slate-500">
                                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }} className="transition hover:text-slate-600 dark:hover:text-slate-300"><Bold size={14} /></button>
                                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }} className="transition hover:text-slate-600 dark:hover:text-slate-300"><Italic size={14} /></button>
                                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormat('underline'); }} className="transition hover:text-slate-600 dark:hover:text-slate-300"><Underline size={14} /></button>
                                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormat('insertUnorderedList'); }} className="transition hover:text-slate-600 dark:hover:text-slate-300"><List size={14} /></button>
                              </div>
                              <button
                                type="button"
                                onClick={() => openAiModal("project", (item.description || "").replace(/<[^>]+>/g, ''), (text) => setNestedField("projects", index, "description", markdownToHtml(text)))}
                                className="inline-flex items-center gap-1.5 font-semibold text-brand-indigo text-xs transition hover:text-brand-indigo/80 dark:text-cyan-400 dark:hover:text-cyan-300"
                              >
                                Write with AI <Sparkles size={13} fill="currentColor" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 flex justify-end">
                            <button type="button" className="text-xs font-semibold text-rose-500 transition hover:text-rose-600 dark:text-rose-400" onClick={() => removeRow("projects", index)}>Remove Project</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionSection>

                  {/* Download button */}
                  <GradientButton className="w-fit px-4 py-2 text-sm" onClick={downloadPdf} disabled={downloadingPdf}>
                    <span className="inline-flex items-center gap-2">
                      <Download size={14} />
                      {downloadingPdf ? "Preparing PDF..." : "Download PDF"}
                    </span>
                  </GradientButton>
                </motion.div>
              )}

              {activeTab === "templates" && (
                <motion.div key="templates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="overflow-y-auto pr-1 scrollbar-thin" style={{ maxHeight: "520px" }}>
                    <TemplateSelector selected={resumeData.template} onSelect={(id) => setField("template", id)} />
                  </div>
                </motion.div>
              )}

              {activeTab === "formatting" && (
                <motion.div key="formatting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <FormattingPanel
                    formatting={{
                      spacing: resumeData.spacing,
                      fontFamily: resumeData.fontFamily,
                      fontSize: resumeData.fontSize,
                      themeColor: resumeData.themeColor
                    }}
                    onChange={(f) => setResumeData((prev) => ({ ...prev, ...f }))}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right panel: Live Preview ── */}
          <motion.div
            layout
            className={`rounded-xl border p-4 shadow-soft ${isBuiltIn ? builtInPreviewThemeClass : "border-slate-200/70 bg-white dark:border-slate-700 dark:bg-slate-950"} ${isPage ? "lg:sticky lg:top-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-auto" : ""} ${activeTab !== "preview" ? "hidden md:block" : "block"}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Live Preview</p>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{resumeData.template}</p>
            </div>

            {isBuiltIn ? (
              <>
                {renderBuiltInPreview({ template: resumeData.template, payload: payloadForSave, avatar })}
                {renderProjectsSection()}
              </>
            ) : themeLoading && !themeHtml ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 size={24} className="mb-3 animate-spin text-brand-indigo dark:text-cyan-300" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Rendering template...</p>
              </div>
            ) : themeHtml ? (
              <div className="relative">
                {themeLoading && (
                  <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 shadow-sm backdrop-blur dark:bg-slate-800/90">
                    <Loader2 size={12} className="animate-spin text-brand-indigo dark:text-cyan-300" />
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Updating...</span>
                  </div>
                )}
                <iframe
                  ref={iframeRef}
                  title="Resume Preview"
                  srcDoc={themeHtml}
                  sandbox="allow-same-origin"
                  className="w-full rounded-lg border border-slate-200/50 bg-white dark:border-slate-700"
                  style={{ minHeight: "700px", height: "80vh", maxHeight: "1200px" }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Layout size={28} className="mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Select a JSON Resume theme to preview</p>
              </div>
            )}
          </motion.div>
        </div>
      </GlassCard>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] flex border-t border-slate-200 bg-white pb-3 pt-2 px-2 shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.05)] dark:border-slate-800 dark:bg-slate-900">
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col flex-1 items-center justify-center gap-1 pb-1 pt-1 transition-colors ${isActive ? "text-brand-indigo dark:text-cyan-400" : "text-slate-500 dark:text-slate-400"}`}
            >
              <div className={`rounded-xl p-1.5 transition-colors ${isActive ? "bg-brand-indigo/10 dark:bg-cyan-400/10" : "bg-transparent"}`}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* AI Write Modal */}
      <AiWriteModal
        open={aiModal.open}
        section={aiModal.section}
        text={aiModal.text}
        onInsert={handleAiInsert}
        onClose={closeAiModal}
      />
    </div>
  );
};

export default ResumeBuilderPanel;
