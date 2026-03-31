import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Edit3, Plus, FileText, Sparkles, Upload, UserCircle2, X, Briefcase, Trash2, Loader2, GraduationCap } from "lucide-react";
import { getSkillIconUrl } from "../utils/skillIcons";
import GlassCard from "../components/common/GlassCard";
import GradientButton from "../components/common/GradientButton";
import Modal from "../components/common/Modal";
import { AnimatePresence } from "framer-motion";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import usePageTitle from "../hooks/usePageTitle";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/slices/authSlice";
import { addToast } from "../redux/slices/uiSlice";
import apiClient from "../utils/api";
import getErrorMessage from "../utils/errorMessage";
import {
  fileToDataUrl,
  IMAGE_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  PDF_MIME_TYPES,
  validateFileByTypeAndSize
} from "../utils/fileUpload";

const emptyAvatar = { dataUrl: "", mimeType: "", size: 0, updatedAt: null };
const emptyResumeDocument = {
  fileName: "",
  dataUrl: "",
  mimeType: "",
  size: 0,
  source: "profile",
  uploadedAt: null
};

const formatSize = (bytes = 0) => {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const ProfilePage = () => {
  usePageTitle("Profile");
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [avatar, setAvatar] = useState(emptyAvatar);
  const [resumeDocument, setResumeDocument] = useState(emptyResumeDocument);
  const [assetSaving, setAssetSaving] = useState({ avatar: false, resume: false });

  // Experience timeline state
  const [experiences, setExperiences] = useState([]);
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [editingExpIdx, setEditingExpIdx] = useState(null);
  const [expForm, setExpForm] = useState({ title: "", company: "", period: "", description: "" });
  const [expSaving, setExpSaving] = useState(false);

  // Education state
  const [educations, setEducations] = useState([]);
  const [eduModalOpen, setEduModalOpen] = useState(false);
  const [editingEduIdx, setEditingEduIdx] = useState(null);
  const [eduForm, setEduForm] = useState({ degree: "", institute: "", fieldOfStudy: "", startYear: "", endYear: "", cgpa: "", description: "", period: "" });
  const [eduSaving, setEduSaving] = useState(false);

  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const [autoSaved, setAutoSaved] = useState(false);
  const autoSaveTimer = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    getValues,
    formState: { isSubmitting }
  } = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      location: "",
      headline: "",
      bio: "",
      linkedin: "",
      github: "",
      instagram: "",
      portfolio: ""
    }
  });

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const response = await apiClient.get("/users/profile");
        if (!active) return;
        const profileData = response.data.profile;
        setProfile(profileData);
        setSkills(profileData.skills || []);
        setAvatar(profileData.avatar || emptyAvatar);
        setResumeDocument(profileData.resumeDocument || emptyResumeDocument);
        setExperiences(profileData.experience || []);
        setEducations(profileData.education || []);
        dispatch(setUser(profileData));
        reset({
          fullName: profileData.name || "",
          email: profileData.email || "",
          location: profileData.location || "",
          headline: profileData.headline || "",
          bio: profileData.bio || "",
          linkedin: profileData.socialLinks?.linkedin || "",
          github: profileData.socialLinks?.github || "",
          instagram: profileData.socialLinks?.instagram || "",
          portfolio: profileData.socialLinks?.portfolio || ""
        });
      } catch (error) {
        dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to load profile.") }));
      } finally {
        if (active) setLoading(false);
      }
    };
    loadProfile();
    return () => {
      active = false;
    };
  }, [dispatch, reset]);

  // Debounced auto-save for form fields (2s after last keystroke)
  useEffect(() => {
    if (!profile) return;
    const subscription = watch((_, { type }) => {
      if (type !== "change") return;
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(async () => {
        const v = getValues();
        const payload = {
          name: v.fullName,
          location: v.location,
          headline: v.headline,
          bio: v.bio
        };
        // Only include social links that are empty or valid URLs
        const tryUrl = (val) => {
          const s = (val || "").trim();
          if (!s) return "";
          try {
            const u = new URL(s);
            return u.protocol === "http:" || u.protocol === "https:" ? s : undefined;
          } catch {
            return undefined;
          }
        };
        const sl = {
          linkedin: tryUrl(v.linkedin),
          github: tryUrl(v.github),
          instagram: tryUrl(v.instagram),
          portfolio: tryUrl(v.portfolio)
        };
        if (Object.values(sl).every((x) => x !== undefined)) {
          payload.socialLinks = sl;
        }
        try {
          const response = await apiClient.put("/users/profile", payload);
          const next = response.data.profile;
          setProfile(next);
          dispatch(setUser(next));
          setAutoSaved(true);
          setTimeout(() => setAutoSaved(false), 2500);
        } catch {
          // silent — user can click Save Profile for explicit feedback
        }
      }, 2000);
    });
    return () => {
      subscription.unsubscribe();
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [profile, watch, getValues, dispatch]);

  const profileStrength = useMemo(() => {
    if (typeof profile?.profileCompletion === "number") return profile.profileCompletion;
    return Math.min(100, Math.round((skills.length / 7) * 100) + 32);
  }, [profile?.profileCompletion, skills.length]);

  const applyAssetResponse = (nextProfile) => {
    const nextAvatar = nextProfile?.avatar || emptyAvatar;
    const nextResume = nextProfile?.resumeDocument || emptyResumeDocument;

    setAvatar(nextAvatar);
    setResumeDocument(nextResume);
    setProfile((prev) => ({
      ...(prev || {}),
      avatar: nextAvatar,
      resumeDocument: nextResume,
      resumeUrl: nextProfile?.resumeUrl || "",
      profileCompletion:
        typeof nextProfile?.profileCompletion === "number"
          ? nextProfile.profileCompletion
          : prev?.profileCompletion
    }));
    dispatch(setUser(nextProfile));
  };

  const saveAvatar = async (nextAvatar, successMessage) => {
    setAssetSaving((prev) => ({ ...prev, avatar: true }));
    try {
      const response = await apiClient.put("/users/profile", { avatar: nextAvatar });
      applyAssetResponse(response.data.profile);
      dispatch(addToast({ type: "success", message: successMessage }));
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to update profile photo.") }));
    } finally {
      setAssetSaving((prev) => ({ ...prev, avatar: false }));
    }
  };

  const saveResumeDocument = async (nextResumeDoc, successMessage) => {
    setAssetSaving((prev) => ({ ...prev, resume: true }));
    try {
      const response = await apiClient.put("/users/profile", { resumeDocument: nextResumeDoc });
      applyAssetResponse(response.data.profile);
      dispatch(addToast({ type: "success", message: successMessage }));
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to update resume.") }));
    } finally {
      setAssetSaving((prev) => ({ ...prev, resume: false }));
    }
  };

  const onPhotoSelected = async (event) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      validateFileByTypeAndSize({
        file,
        allowedMimeTypes: IMAGE_MIME_TYPES,
        maxBytes: MAX_UPLOAD_BYTES,
        fileLabel: "Profile photo"
      });
      const dataUrl = await fileToDataUrl(file);
      await saveAvatar(
        {
          dataUrl,
          mimeType: file.type,
          size: file.size,
          updatedAt: new Date().toISOString()
        },
        "Profile photo uploaded and saved."
      );
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error) }));
    } finally {
      event.target.value = "";
    }
  };

  const onRemovePhoto = async () => {
    await saveAvatar(null, "Profile photo removed.");
  };

  const onResumeSelected = async (event) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      validateFileByTypeAndSize({
        file,
        allowedMimeTypes: PDF_MIME_TYPES,
        maxBytes: MAX_UPLOAD_BYTES,
        fileLabel: "Resume PDF"
      });
      const dataUrl = await fileToDataUrl(file);
      await saveResumeDocument(
        {
          fileName: file.name,
          dataUrl,
          mimeType: file.type,
          size: file.size,
          source: "profile",
          uploadedAt: new Date().toISOString()
        },
        "Resume uploaded and saved."
      );
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error) }));
    } finally {
      event.target.value = "";
    }
  };

  const onRemoveResume = async () => {
    await saveResumeDocument(null, "Resume removed.");
  };

  const onSubmit = async (values) => {
    try {
      const payload = {
        name: values.fullName,
        location: values.location,
        headline: values.headline,
        bio: values.bio,
        skills,
        experience: profile?.experience || [],
        education: profile?.education || [],
        avatar,
        resumeDocument,
        socialLinks: {
          linkedin: values.linkedin,
          github: values.github,
          instagram: values.instagram,
          portfolio: values.portfolio
        },
        companyName: profile?.companyName || ""
      };

      const response = await apiClient.put("/users/profile", payload);
      const nextProfile = response.data.profile;
      setProfile(nextProfile);
      setSkills(nextProfile.skills || []);
      setAvatar(nextProfile.avatar || emptyAvatar);
      setResumeDocument(nextProfile.resumeDocument || emptyResumeDocument);
      setExperiences(nextProfile.experience || []);
      setEducations(nextProfile.education || []);
      dispatch(setUser(nextProfile));
      reset({
        fullName: nextProfile.name || "",
        email: nextProfile.email || "",
        location: nextProfile.location || "",
        headline: nextProfile.headline || "",
        bio: nextProfile.bio || "",
        linkedin: nextProfile.socialLinks?.linkedin || "",
        github: nextProfile.socialLinks?.github || "",
        instagram: nextProfile.socialLinks?.instagram || "",
        portfolio: nextProfile.socialLinks?.portfolio || ""
      });
      dispatch(addToast({ type: "success", message: "Profile updated." }));
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to update profile.") }));
    }
  };

  if (loading) {
    return (
      <div className="container-4k py-8">
        <LoadingSkeleton className="mb-3 h-12 w-1/3" />
        <LoadingSkeleton className="mb-3 h-72 w-full" />
        <LoadingSkeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="container-4k py-8">
      <div className="mb-5">
        <h1 className="font-poppins text-2xl font-semibold text-slate-900 dark:text-white">Profile</h1>
        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
          Manage your profile details, skills, experience, and education.
        </p>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <GlassCard className="p-5" hoverable={false}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Personal Details</h2>
              <Edit3 size={15} className="text-brand-indigo" />
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2">
              <input className="field-input" placeholder="Full name" {...register("fullName", { required: true })} />
              <input className="field-input opacity-70" placeholder="Email" type="email" disabled {...register("email")} />
              <input className="field-input" placeholder="Location" {...register("location")} />
              <input className="field-input" placeholder="Headline" {...register("headline")} />
              <textarea className="field-input sm:col-span-2" rows="3" placeholder="Bio" {...register("bio")} />

              <div className="sm:col-span-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  Social Links
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="field-input" placeholder="LinkedIn URL" {...register("linkedin")} />
                  <input className="field-input" placeholder="GitHub URL" {...register("github")} />
                  <input className="field-input" placeholder="Instagram URL" {...register("instagram")} />
                  <input className="field-input" placeholder="Portfolio URL" {...register("portfolio")} />
                </div>
              </div>

              <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
                <GradientButton type="submit" className="w-fit px-4 py-2 text-sm" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Profile"}
                </GradientButton>
                {autoSaved && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-medium text-brand-emerald"
                  >
                    ✓ Auto-saved
                  </motion.span>
                )}
              </div>
            </form>
          </GlassCard>

          <GlassCard className="p-5" hoverable={false}>
            <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Skills</h2>
            <div className="mb-3 flex flex-wrap gap-2">
              {skills.map((skill) => {
                const iconUrl = getSkillIconUrl(skill);
                return (
                  <motion.span
                    key={skill}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand-indigo/10 py-1 pl-2.5 pr-1.5 text-sm font-medium text-brand-indigo dark:bg-brand-indigo/20 dark:text-cyan-300"
                  >
                    {iconUrl && (
                      <img src={iconUrl} alt="" className="h-4 w-4 shrink-0 object-contain" loading="lazy" />
                    )}
                    {skill}
                    <button
                      type="button"
                      onClick={async () => {
                        const next = skills.filter((s) => s !== skill);
                        setSkills(next);
                        try {
                          await apiClient.put("/users/profile", { skills: next });
                        } catch (error) {
                          dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to remove skill.") }));
                          setSkills(skills);
                        }
                      }}
                      className="flex h-5 w-5 items-center justify-center rounded-full transition hover:bg-brand-indigo/20 dark:hover:bg-brand-indigo/30"
                      aria-label={`Remove ${skill}`}
                    >
                      <X size={12} />
                    </button>
                  </motion.span>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const trimmed = newSkill.trim();
                    if (!trimmed || skills.includes(trimmed)) return;
                    const next = [...skills, trimmed].sort((a, b) => a.localeCompare(b));
                    setSkills(next);
                    setNewSkill("");
                    apiClient.put("/users/profile", { skills: next }).catch((error) => {
                      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to save skill.") }));
                      setSkills(skills);
                    });
                  }
                }}
                className="field-input"
                placeholder="Add a skill"
              />
              <button
                type="button"
                onClick={() => {
                  const trimmed = newSkill.trim();
                  if (!trimmed || skills.includes(trimmed)) return;
                  const next = [...skills, trimmed].sort((a, b) => a.localeCompare(b));
                  setSkills(next);
                  setNewSkill("");
                  apiClient.put("/users/profile", { skills: next }).catch((error) => {
                    dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to save skill.") }));
                    setSkills(skills);
                  });
                }}
                className="rounded-xl border border-slate-300/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:shadow-soft dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
              >
                <span className="inline-flex items-center gap-1">
                  <Plus size={14} />
                  Add
                </span>
              </button>
            </div>
          </GlassCard>

          <GlassCard className="p-5" hoverable={false}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Experience</h2>
              <button
                type="button"
                onClick={() => {
                  setEditingExpIdx(null);
                  setExpForm({ title: "", company: "", period: "", description: "" });
                  setExpModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-brand-indigo/30 bg-brand-indigo/5 px-3 py-1.5 text-xs font-semibold text-brand-indigo transition hover:bg-brand-indigo/10 dark:text-cyan-300"
              >
                <Plus size={13} />
                Add
              </button>
            </div>
            <div className="relative pl-6">
              <span className="absolute left-2 top-2 h-[92%] w-[2px] bg-gradient-to-b from-brand-indigo to-brand-cyan" />
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {experiences.length ? (
                    experiences.map((item, idx) => (
                      <motion.div
                        key={item.title + item.company + idx}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="group relative rounded-xl border border-slate-200/70 bg-white/75 p-4 transition hover:shadow-soft dark:border-slate-700 dark:bg-slate-900/75"
                      >
                        <span className="absolute -left-[23px] top-5 h-3 w-3 rounded-full bg-brand-indigo ring-4 ring-white dark:ring-slate-950" />
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-indigo/10 dark:bg-brand-indigo/20">
                              <Briefcase size={16} className="text-brand-indigo dark:text-cyan-300" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-300">{item.company}</p>
                              <p className="mt-0.5 text-xs text-brand-indigo/70 dark:text-cyan-300/70">{item.period}</p>
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingExpIdx(idx);
                                setExpForm({ ...item });
                                setExpModalOpen(true);
                              }}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-brand-indigo/10 hover:text-brand-indigo dark:hover:text-cyan-300"
                              aria-label="Edit experience"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const next = experiences.filter((_, i) => i !== idx);
                                setExperiences(next);
                                try {
                                  const resp = await apiClient.put("/users/profile", { experience: next });
                                  dispatch(setUser(resp.data.profile));
                                } catch (error) {
                                  dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to remove experience.") }));
                                  setExperiences(experiences);
                                }
                              }}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-100 hover:text-rose-500 dark:hover:bg-rose-900/30"
                              aria-label="Delete experience"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        {item.description && (
                          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.description}</p>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                      <Briefcase size={28} className="text-slate-300 dark:text-slate-600" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">No experience added yet.</p>
                      <button
                        type="button"
                        onClick={() => { setEditingExpIdx(null); setExpForm({ title: "", company: "", period: "", description: "" }); setExpModalOpen(true); }}
                        className="text-xs font-semibold text-brand-indigo dark:text-cyan-300"
                      >
                        + Add your first experience
                      </button>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </GlassCard>

          {/* Education */}
          <GlassCard className="p-5" hoverable={false}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Education</h2>
              <button
                type="button"
                onClick={() => {
                  setEditingEduIdx(null);
                  setEduForm({ degree: "", institute: "", fieldOfStudy: "", startYear: "", endYear: "", cgpa: "", description: "", period: "" });
                  setEduModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-brand-indigo/30 bg-brand-indigo/5 px-3 py-1.5 text-xs font-semibold text-brand-indigo transition hover:bg-brand-indigo/10 dark:text-cyan-300"
              >
                <Plus size={13} />
                Add
              </button>
            </div>
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {educations.length ? (
                  educations.map((edu, idx) => (
                    <motion.div
                      key={edu.degree + edu.institute + idx}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200/70 bg-white/75 p-4 text-sm transition hover:shadow-soft dark:border-slate-700 dark:bg-slate-900/75"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-indigo/10 dark:bg-brand-indigo/20">
                          <GraduationCap size={16} className="text-brand-indigo dark:text-cyan-300" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{edu.degree}</p>
                          {edu.fieldOfStudy && <p className="text-sm text-slate-600 dark:text-slate-300">{edu.fieldOfStudy}</p>}
                          <p className="text-slate-500 dark:text-slate-300">{edu.institute}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-brand-indigo/70 dark:text-cyan-300/70">
                              {edu.startYear && edu.endYear ? `${edu.startYear} – ${edu.endYear}` : edu.period || ""}
                            </span>
                            {edu.cgpa && (
                              <span className="rounded-md bg-brand-indigo/10 px-1.5 py-0.5 text-[11px] font-medium text-brand-indigo dark:bg-brand-indigo/20 dark:text-cyan-300">
                                CGPA: {edu.cgpa}
                              </span>
                            )}
                          </div>
                          {edu.description && (
                            <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{edu.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEduIdx(idx);
                            setEduForm({ ...edu });
                            setEduModalOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-brand-indigo/10 hover:text-brand-indigo dark:hover:text-cyan-300"
                          aria-label="Edit education"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const next = educations.filter((_, i) => i !== idx);
                            setEducations(next);
                            try {
                              const resp = await apiClient.put("/users/profile", { education: next });
                              dispatch(setUser(resp.data.profile));
                            } catch (error) {
                              dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to remove education.") }));
                              setEducations(educations);
                            }
                          }}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-100 hover:text-rose-500 dark:hover:bg-rose-900/30"
                          aria-label="Delete education"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <GraduationCap size={28} className="text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No education added yet.</p>
                    <button
                      type="button"
                      onClick={() => { setEditingEduIdx(null); setEduForm({ degree: "", institute: "", fieldOfStudy: "", startYear: "", endYear: "", cgpa: "", description: "", period: "" }); setEduModalOpen(true); }}
                      className="text-xs font-semibold text-brand-indigo dark:text-cyan-300"
                    >
                      + Add your first education
                    </button>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>
        </div>

        {/* ─── Right Sidebar ─── */}
        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <GlassCard className="p-5" hoverable={false}>
            <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Profile Strength</h3>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Completeness</span>
              <span className="text-sm font-semibold text-brand-indigo dark:text-cyan-300">{profileStrength}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand-indigo via-brand-cyan to-brand-emerald"
                initial={{ width: 0 }}
                animate={{ width: `${profileStrength}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Keep photo, social links, and resume updated to improve profile score.
            </p>
          </GlassCard>

          <GlassCard className="p-5" hoverable={false}>
            <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Profile Photo</h3>
            <div className="mb-3 flex items-center gap-3">
              {avatar?.dataUrl ? (
                <img src={avatar.dataUrl} alt="Profile" className="h-20 w-20 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <UserCircle2 size={34} className="text-slate-400" />
                </div>
              )}
              <div className="text-xs text-slate-500 dark:text-slate-300">
                <p>Allowed: JPG, JPEG, PNG</p>
                <p>Max size: 5MB</p>
                {avatar?.size ? <p>Current size: {formatSize(avatar.size)}</p> : null}
              </div>
            </div>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-brand-indigo/40 bg-brand-indigo/5 px-4 py-3 text-sm font-medium text-brand-indigo transition hover:bg-brand-indigo/10 dark:bg-brand-indigo/10 dark:text-cyan-300">
              <Upload size={15} />
              {assetSaving.avatar ? "Saving..." : "Upload Photo"}
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/jpg,image/png"
                onChange={onPhotoSelected}
                disabled={assetSaving.avatar}
              />
            </label>
            <button
              type="button"
              onClick={onRemovePhoto}
              disabled={assetSaving.avatar || !avatar?.dataUrl}
              className="mt-2 text-xs text-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Remove photo
            </button>
          </GlassCard>

          <GlassCard className="p-5" hoverable={false}>
            <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Resume PDF</h3>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-brand-indigo/40 bg-brand-indigo/5 px-4 py-3 text-sm font-medium text-brand-indigo transition hover:bg-brand-indigo/10 dark:bg-brand-indigo/10 dark:text-cyan-300">
              <FileText size={15} />
              {assetSaving.resume ? "Saving..." : "Upload Resume PDF"}
              <input
                type="file"
                className="hidden"
                accept="application/pdf"
                onChange={onResumeSelected}
                disabled={assetSaving.resume}
              />
            </label>

            {resumeDocument?.dataUrl ? (
              <div className="mt-3 rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/80">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {resumeDocument.fileName || "resume.pdf"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  {formatSize(resumeDocument.size)} • Uploaded from {resumeDocument.source || "profile"}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="text-xs font-semibold text-brand-indigo dark:text-cyan-300"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={onRemoveResume}
                    disabled={assetSaving.resume}
                    className="text-xs text-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">
                No resume uploaded yet. You can also upload from Job Seeker Dashboard Resume Builder.
              </p>
            )}
          </GlassCard>

          <GlassCard className="p-5" hoverable={false}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                <Sparkles size={16} className="text-brand-indigo" />
                AI Suggestions
              </h3>
              <button
                type="button"
                disabled={suggestionsLoading}
                onClick={async () => {
                  setSuggestionsLoading(true);
                  try {
                    const resp = await apiClient.get("/users/ai-suggestions");
                    setAiSuggestions(resp.data.suggestions || []);
                  } catch (error) {
                    dispatch(addToast({ type: "error", message: getErrorMessage(error, "AI suggestion failed.") }));
                  } finally {
                    setSuggestionsLoading(false);
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl border border-brand-indigo/30 bg-brand-indigo/5 px-3 py-1.5 text-xs font-semibold text-brand-indigo transition hover:bg-brand-indigo/10 disabled:opacity-60 dark:text-cyan-300"
              >
                {suggestionsLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    Suggest with AI
                  </>
                )}
              </button>
            </div>
            {suggestionsLoading && !aiSuggestions.length ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" style={{ width: `${80 - i * 10}%` }} />
                ))}
              </div>
            ) : aiSuggestions.length ? (
              <ul className="space-y-2">
                <AnimatePresence>
                  {aiSuggestions.map((tip, idx) => (
                    <motion.li
                      key={tip}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex gap-2 rounded-lg border border-slate-200/60 bg-white/60 p-2.5 text-sm text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300"
                    >
                      <Sparkles size={14} className="mt-0.5 shrink-0 text-brand-indigo dark:text-cyan-300" />
                      {tip}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Click &ldquo;Suggest with AI&rdquo; to get personalized profile improvement tips powered by AI.
              </p>
            )}
          </GlassCard>
        </div>
      </div>

      <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title="Resume Preview">
        {resumeDocument?.dataUrl ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {resumeDocument.fileName || "resume.pdf"}
            </p>
            <iframe
              src={resumeDocument.dataUrl}
              title="Resume"
              className="h-[70vh] w-full rounded-xl border border-slate-200/70 dark:border-slate-700"
            />
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-300">No resume available to preview.</p>
        )}
      </Modal>

      {/* Experience Add/Edit Modal */}
      <Modal
        isOpen={expModalOpen}
        onClose={() => setExpModalOpen(false)}
        title={editingExpIdx !== null ? "Edit Experience" : "Add Experience"}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!expForm.title.trim() || !expForm.company.trim()) return;
            setExpSaving(true);
            try {
              let next;
              if (editingExpIdx !== null) {
                next = experiences.map((exp, i) => (i === editingExpIdx ? { ...expForm } : exp));
              } else {
                next = [...experiences, { ...expForm }];
              }
              const resp = await apiClient.put("/users/profile", { experience: next });
              setExperiences(resp.data.profile.experience || next);
              setProfile((p) => ({ ...p, experience: resp.data.profile.experience || next }));
              dispatch(setUser(resp.data.profile));
              dispatch(addToast({ type: "success", message: editingExpIdx !== null ? "Experience updated." : "Experience added." }));
              setExpModalOpen(false);
            } catch (error) {
              dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to save experience.") }));
            } finally {
              setExpSaving(false);
            }
          }}
          className="grid gap-3"
        >
          <input
            className="field-input"
            placeholder="Job Title *"
            value={expForm.title}
            onChange={(e) => setExpForm((p) => ({ ...p, title: e.target.value }))}
            required
          />
          <input
            className="field-input"
            placeholder="Company / Organization *"
            value={expForm.company}
            onChange={(e) => setExpForm((p) => ({ ...p, company: e.target.value }))}
            required
          />
          <input
            className="field-input"
            placeholder="Duration (e.g. Jan 2023 - Present)"
            value={expForm.period}
            onChange={(e) => setExpForm((p) => ({ ...p, period: e.target.value }))}
          />
          <textarea
            className="field-input"
            rows="3"
            placeholder="Description - What did you accomplish?"
            value={expForm.description}
            onChange={(e) => setExpForm((p) => ({ ...p, description: e.target.value }))}
          />
          <GradientButton type="submit" className="w-fit px-4 py-2 text-sm" disabled={expSaving}>
            {expSaving ? "Saving..." : editingExpIdx !== null ? "Update Experience" : "Add Experience"}
          </GradientButton>
        </form>
      </Modal>

      {/* Education Add/Edit Modal */}
      <Modal
        isOpen={eduModalOpen}
        onClose={() => setEduModalOpen(false)}
        title={editingEduIdx !== null ? "Edit Education" : "Add Education"}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!eduForm.degree.trim() || !eduForm.institute.trim()) return;
            setEduSaving(true);
            try {
              let next;
              const entry = {
                ...eduForm,
                period: eduForm.startYear && eduForm.endYear ? `${eduForm.startYear} – ${eduForm.endYear}` : eduForm.period
              };
              if (editingEduIdx !== null) {
                next = educations.map((ed, i) => (i === editingEduIdx ? entry : ed));
              } else {
                next = [...educations, entry];
              }
              const resp = await apiClient.put("/users/profile", { education: next });
              setEducations(resp.data.profile.education || next);
              setProfile((p) => ({ ...p, education: resp.data.profile.education || next }));
              dispatch(setUser(resp.data.profile));
              dispatch(addToast({ type: "success", message: editingEduIdx !== null ? "Education updated." : "Education added." }));
              setEduModalOpen(false);
            } catch (error) {
              dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to save education.") }));
            } finally {
              setEduSaving(false);
            }
          }}
          className="grid gap-3"
        >
          <input
            className="field-input"
            placeholder="Degree / Qualification *"
            value={eduForm.degree}
            onChange={(e) => setEduForm((p) => ({ ...p, degree: e.target.value }))}
            required
          />
          <input
            className="field-input"
            placeholder="Field of Study (e.g. Computer Science)"
            value={eduForm.fieldOfStudy}
            onChange={(e) => setEduForm((p) => ({ ...p, fieldOfStudy: e.target.value }))}
          />
          <input
            className="field-input"
            placeholder="Institution / University *"
            value={eduForm.institute}
            onChange={(e) => setEduForm((p) => ({ ...p, institute: e.target.value }))}
            required
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className="field-input"
              placeholder="Start Year"
              value={eduForm.startYear}
              onChange={(e) => setEduForm((p) => ({ ...p, startYear: e.target.value }))}
            />
            <input
              className="field-input"
              placeholder="End Year (or Present)"
              value={eduForm.endYear}
              onChange={(e) => setEduForm((p) => ({ ...p, endYear: e.target.value }))}
            />
          </div>
          <input
            className="field-input"
            placeholder="CGPA / Percentage (optional)"
            value={eduForm.cgpa}
            onChange={(e) => setEduForm((p) => ({ ...p, cgpa: e.target.value }))}
          />
          <textarea
            className="field-input"
            rows="2"
            placeholder="Description (achievements, activities...)"
            value={eduForm.description}
            onChange={(e) => setEduForm((p) => ({ ...p, description: e.target.value }))}
          />
          <GradientButton type="submit" className="w-fit px-4 py-2 text-sm" disabled={eduSaving}>
            {eduSaving ? "Saving..." : editingEduIdx !== null ? "Update Education" : "Add Education"}
          </GradientButton>
        </form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
