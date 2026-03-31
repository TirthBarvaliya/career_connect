import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Download, Mail, Phone, MapPin, BriefcaseBusiness } from "lucide-react";
import { useDispatch } from "react-redux";
import apiClient from "../utils/api";
import getErrorMessage from "../utils/errorMessage";
import usePageTitle from "../hooks/usePageTitle";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import GlassCard from "../components/common/GlassCard";
import GradientButton from "../components/common/GradientButton";
import ResumeViewerModal from "../components/common/ResumeViewerModal";
import { addToast } from "../redux/slices/uiSlice";
import { ROUTES } from "../utils/constants";

const statusTone = {
  Applied: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200",
  Review: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
  Shortlisted: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-200",
  "Interview Scheduled": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200",
  "Interview Completed": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-200",
  Interviewing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200",
  Accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
  Hired: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
  Selected: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
  "Offer Sent": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200",
  Rejected: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200",
  Withdrawn: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleString();
};

const RecruiterApplicantProfilePage = () => {
  usePageTitle("Applicant Profile");
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [apiError, setApiError] = useState("");
  const [profile, setProfile] = useState(null);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setApiError("");
      const response = await apiClient.get(`/recruiter/applicant/${id}`);
      setProfile(response.data.application || null);
    } catch (error) {
      setApiError(getErrorMessage(error, "Failed to load applicant profile."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const resumeUrl = useMemo(() => String(profile?.candidate?.resumeUrl || "").trim(), [profile]);
  const resumeFileName = profile?.candidate?.resumeDocument?.fileName || "resume.pdf";
  const status = profile?.status || "Applied";
  const isWithdrawn = status === "Withdrawn";

  const updateStatus = async (nextStatus) => {
    if (!id) return;
    try {
      setUpdatingStatus(true);
      await apiClient.patch(`/jobs/applications/${id}/status`, { status: nextStatus });

      if (nextStatus === "Shortlisted") {
        dispatch(addToast({ type: "success", message: "Applicant shortlisted. Redirecting to hiring pipeline..." }));
        const jobId = profile?.job?.id || profile?.job?._id;
        if (jobId) {
          navigate(ROUTES.HIRING_PIPELINE.replace(":jobId", jobId));
          return;
        }
      }

      dispatch(addToast({ type: "success", message: `Applicant marked as ${nextStatus}.` }));
      await loadProfile();
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to update applicant status.") }));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDownloadResume = () => {
    if (!resumeUrl) return;
    const link = document.createElement("a");
    link.href = resumeUrl;
    link.download = resumeFileName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-24 w-full" />
        <LoadingSkeleton className="h-64 w-full" />
        <LoadingSkeleton className="h-72 w-full" />
      </div>
    );
  }

  if (apiError || !profile) {
    return (
      <GlassCard className="p-6" hoverable={false}>
        <p className="text-sm font-medium text-rose-600 dark:text-rose-300">{apiError || "Applicant not found."}</p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.RECRUITER_APPLICANTS)}
          className="mt-3 inline-flex items-center gap-1 rounded-lg border border-slate-300/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-indigo hover:text-brand-indigo dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
        >
          <ArrowLeft size={13} />
          Back to Applicants
        </button>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-4" hoverable={false}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.RECRUITER_APPLICANTS)}
              className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-brand-indigo dark:text-slate-300 dark:hover:text-cyan-300"
            >
              <ArrowLeft size={13} />
              Back to Applicants
            </button>
            <h2 className="font-poppins text-xl font-semibold text-slate-900 dark:text-white">{profile.candidate?.name || "Applicant"}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-300">{profile.candidate?.headline || "No headline available."}</p>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              statusTone[status] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            {status}
          </span>
        </div>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <GlassCard className="p-4 space-y-4" hoverable={false}>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200/70 bg-white/75 p-3 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Email</p>
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-800 dark:text-slate-100">
                <Mail size={13} />
                {profile.candidate?.email || "N/A"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-white/75 p-3 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Phone</p>
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-800 dark:text-slate-100">
                <Phone size={13} />
                {profile.candidate?.phone || "N/A"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-white/75 p-3 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Location</p>
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-800 dark:text-slate-100">
                <MapPin size={13} />
                {profile.candidate?.location || "N/A"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-white/75 p-3 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Applied Date</p>
              <p className="mt-1 text-sm text-slate-800 dark:text-slate-100">{formatDate(profile.appliedAt)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/70 bg-white/75 p-3 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Applied Job</p>
            <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-slate-800 dark:text-slate-100">
              <BriefcaseBusiness size={13} />
              {profile.job?.title || "N/A"}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
              {profile.job?.company || "N/A"} {profile.job?.location ? `• ${profile.job.location}` : ""}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/70 bg-white/75 p-3 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Skills</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(profile.candidate?.skills || []).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-brand-indigo/10 px-2.5 py-1 text-xs font-medium text-brand-indigo dark:bg-brand-indigo/20 dark:text-cyan-300"
                >
                  {skill}
                </span>
              ))}
              {!profile.candidate?.skills?.length && (
                <p className="text-sm text-slate-500 dark:text-slate-300">No skills provided.</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200/70 bg-white/75 p-3 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Education</p>
              <div className="mt-2 space-y-2">
                {(profile.candidate?.education || []).map((item, index) => (
                  <div key={`${item.degree || "education"}-${index}`} className="rounded-lg border border-slate-200/70 p-2 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.degree || "Degree"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">
                      {item.institute || "Institute"} {item.period ? `• ${item.period}` : ""}
                    </p>
                  </div>
                ))}
                {!profile.candidate?.education?.length && (
                  <p className="text-sm text-slate-500 dark:text-slate-300">No education details provided.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/70 bg-white/75 p-3 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Experience</p>
              <div className="mt-2 space-y-2">
                {(profile.candidate?.experience || []).map((item, index) => (
                  <div key={`${item.title || "experience"}-${index}`} className="rounded-lg border border-slate-200/70 p-2 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.title || "Role"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">
                      {item.company || "Company"} {item.period ? `• ${item.period}` : ""}
                    </p>
                    {item.description ? (
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.description}</p>
                    ) : null}
                  </div>
                ))}
                {!profile.candidate?.experience?.length && (
                  <p className="text-sm text-slate-500 dark:text-slate-300">No experience details provided.</p>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 space-y-3" hoverable={false}>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Resume & Actions</h3>
          {resumeUrl ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setResumeModalOpen(true)}
                className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-brand-indigo/40 bg-brand-indigo/10 px-3 py-2 text-xs font-semibold text-brand-indigo transition hover:bg-brand-indigo/15 dark:bg-brand-indigo/20 dark:text-cyan-300"
              >
                <ExternalLink size={13} />
                View Resume
              </button>
              <button
                type="button"
                onClick={handleDownloadResume}
                className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-slate-300/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-indigo hover:text-brand-indigo dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              >
                <Download size={13} />
                Download Resume
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-300">No resume available.</p>
          )}

          <div className="h-px bg-slate-200/70 dark:bg-slate-700" />

          <GradientButton
            type="button"
            disabled={updatingStatus || isWithdrawn}
            onClick={() => updateStatus("Shortlisted")}
            className="w-full py-2 text-xs"
          >
            {updatingStatus ? "Updating..." : "Shortlist"}
          </GradientButton>

          <button
            type="button"
            disabled={updatingStatus || isWithdrawn}
            onClick={() => updateStatus("Rejected")}
            className="w-full rounded-lg border border-rose-300/70 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-700/60 dark:bg-rose-900/30 dark:text-rose-200"
          >
            Reject
          </button>

          <button
            type="button"
            onClick={() => navigate(ROUTES.HIRING_PIPELINE.replace(":jobId", profile.job.id))}
            className="w-full rounded-lg border border-slate-300/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-indigo hover:text-brand-indigo dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
          >
            Open Hiring Pipeline
          </button>

          {isWithdrawn && (
            <p className="text-xs text-slate-500 dark:text-slate-300">
              This application is withdrawn, so status updates are disabled.
            </p>
          )}
        </GlassCard>
      </div>

      <ResumeViewerModal
        open={resumeModalOpen}
        onClose={() => setResumeModalOpen(false)}
        resumeUrl={resumeUrl}
        candidateName={profile.candidate?.name || "Candidate"}
      />
    </div>
  );
};

export default RecruiterApplicantProfilePage;
