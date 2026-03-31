import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import apiClient from "../utils/api";
import getErrorMessage from "../utils/errorMessage";
import { addToast } from "../redux/slices/uiSlice";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import usePageTitle from "../hooks/usePageTitle";
import { ROUTES } from "../utils/constants";
import ResumeViewerModal from "../components/common/ResumeViewerModal";
import Modal from "../components/common/Modal";

const PIPELINE_COLUMNS = [
  { id: "Applied", label: "Applied", color: "text-slate-500", dot: "bg-slate-400", border: "border-slate-200", bg: "bg-white" },
  { id: "Review", label: "Screening", color: "text-amber-500", dot: "bg-amber-400", border: "border-amber-300", bg: "bg-amber-50/30" },
  { id: "Shortlisted", label: "Shortlisted", color: "text-blue-500", dot: "bg-blue-400", border: "border-blue-300", bg: "bg-blue-50/30" },
  { id: "Interview Scheduled", label: "Interview Scheduled", color: "text-purple-500", dot: "bg-purple-400", border: "border-purple-300", bg: "bg-purple-50/30" },
  { id: "Interview Completed", label: "Interview Completed", color: "text-indigo-500", dot: "bg-indigo-400", border: "border-indigo-300", bg: "bg-indigo-50/30" },
  { id: "Offer Sent", label: "Offer Sent", color: "text-orange-500", dot: "bg-orange-400", border: "border-orange-300", bg: "bg-orange-50/30" },
  { id: "Hired", label: "Hired", color: "text-emerald-500", dot: "bg-emerald-400", border: "border-emerald-300", bg: "bg-emerald-50/30" },
  { id: "Rejected", label: "Rejected", color: "text-rose-500", dot: "bg-rose-400", border: "border-rose-300", bg: "bg-rose-50/30" }
];

export default function HiringPipelinePage() {
  usePageTitle("Hiring Pipeline");
  const { jobId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(ROUTES.RECRUITER_DASHBOARD);
  };

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [applicantsRaw, setApplicantsRaw] = useState([]);
  
  // Profile View Modal State
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [resumeModalData, setResumeModalData] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState("");
  const [emailSendingId, setEmailSendingId] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobRes, applicantsRes] = await Promise.all([
        apiClient.get(`/jobs/${jobId}`),
        apiClient.get(`/jobs/${jobId}/applicants`)
      ]);
      setJob(jobRes.data.job);
      setApplicantsRaw(applicantsRes.data.applicants || []);
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to load pipeline data.") }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const handleStatusChange = async (applicationId, status) => {
    try {
      setStatusUpdatingId(applicationId);
      await apiClient.patch(`/jobs/applications/${applicationId}/status`, { status });
      dispatch(addToast({ type: "success", message: `Applicant moved to ${status}.` }));
      
      // Update local state without full reload
      setApplicantsRaw(prev => prev.map(app => 
        app.id === applicationId ? { ...app, status } : app
      ));
      
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(prev => ({ ...prev, status }));
      }
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to update status.") }));
    } finally {
      setStatusUpdatingId("");
    }
  };

  const handleViewProfile = async (applicationId) => {
    try {
      // Fetch full details
      const response = await apiClient.get(`/jobs/applications/${applicationId}`);
      setSelectedApplication(response.data.application);
      setProfileModalOpen(true);
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to load applicant details.") }));
    }
  };

  const handleSendEmail = async (applicationId) => {
    try {
      setEmailSendingId(applicationId);
      await apiClient.post(`/jobs/applications/${applicationId}/send-email`, { decisionMessage: "Congratulations! We are pleased to move forward with your application." });
      dispatch(addToast({ type: "success", message: "Email sent successfully." }));
      
      setApplicantsRaw(prev => prev.map(app => 
        app.id === applicationId ? { ...app, emailSent: true } : app
      ));
    } catch (error) {
      dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to send email.") }));
    } finally {
      setEmailSendingId("");
    }
  };

  const grouped = useMemo(() => {
    const groups = {};
    PIPELINE_COLUMNS.forEach(col => { groups[col.id] = []; });

    applicantsRaw.forEach((appl) => {
      let col = appl.status;
      // Map legacy/edge statuses to columns
      if (col === "Applied") col = "Applied";
      else if (col === "Review") col = "Review";
      else if (col === "Shortlisted") col = "Shortlisted";
      else if (col === "Interview Scheduled" || col === "Interviewing") col = "Interview Scheduled";
      else if (col === "Interview Completed") col = "Interview Completed";
      else if (col === "Offer Sent" || col === "Selected") col = "Offer Sent";
      else if (col === "Hired" || col === "Accepted") col = "Hired";
      else if (col === "Rejected" || col === "Withdrawn") col = "Rejected";
      else col = "Applied"; // Fallback

      if (!groups[col]) groups[col] = [];
      groups[col].push(appl);
    });
    return groups;
  }, [applicantsRaw]);

  // Compute stat counts for top row
  const stats = useMemo(() => {
    const count = (keys) => keys.reduce((sum, key) => sum + (grouped[key]?.length || 0), 0);
    return [
      { label: "TOTAL", value: applicantsRaw.length, color: "text-slate-800" },
      { label: "SCREENING", value: count(["Review"]), color: "text-amber-500" },
      { label: "SHORTLISTED", value: count(["Shortlisted"]), color: "text-blue-500" },
      { label: "INTERVIEWS", value: count(["Interview Scheduled", "Interview Completed"]), color: "text-purple-500" },
      { label: "OFFERS", value: count(["Offer Sent"]), color: "text-orange-500" },
      { label: "HIRED", value: count(["Hired"]), color: "text-emerald-500" },
      { label: "REJECTED", value: count(["Rejected"]), color: "text-rose-500" }
    ];
  }, [grouped, applicantsRaw.length]);

  if (loading) {
    return (
      <div className="container-4k py-8 space-y-6">
        <LoadingSkeleton className="h-20 w-1/3" />
        <div className="flex gap-4"><LoadingSkeleton className="h-24 flex-1" count={7} inline /></div>
        <div className="flex gap-4"><LoadingSkeleton className="h-96 w-80" count={4} inline /></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container-4k py-20 text-center">
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">Job not found</h2>
        <button onClick={goBack} className="mt-4 text-brand-indigo hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  const activeStagesCount = PIPELINE_COLUMNS.filter(col => grouped[col.id]?.length > 0).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] pb-10">
      <div className="px-6 py-6 border-b border-slate-200/80 bg-white/50 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center gap-4">
          <button 
            onClick={goBack}
            className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold font-poppins text-slate-900 dark:text-white tracking-tight">
              Hiring Pipeline — <span className="text-brand-indigo">{job.title}</span>
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Drag-free Kanban board • {applicantsRaw.length} applicant{applicantsRaw.length !== 1 ? 's' : ''} across {activeStagesCount} stage{activeStagesCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 mt-8">
        {/* Stat Cards Row */}
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar mb-4">
          {stats.map((stat, idx) => (
            <div 
              key={idx} 
              className="px-6 py-5 min-w-[140px] flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200/80 shadow-sm dark:bg-slate-800/80 dark:border-slate-700"
            >
              <span className={`text-3xl font-bold mb-1 ${stat.color}`}>{stat.value}</span>
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Kanban Board */}
        <div className="flex gap-5 overflow-x-auto pb-6 tracking-wide snap-x custom-scrollbar min-h-[650px]">
          {PIPELINE_COLUMNS.map((col) => {
            const columnApplicants = grouped[col.id] || [];
            return (
              <div 
                key={col.id} 
                className={`flex flex-col w-[320px] shrink-0 snap-start rounded-3xl border-2 ${col.border} ${col.bg} p-2.5 transition-colors`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-3 py-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                    <h3 className={`font-bold text-[15px] ${col.color}`}>{col.label}</h3>
                  </div>
                  <span className="flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-black/5 text-[11px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                    {columnApplicants.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 space-y-3 overflow-y-auto px-1 custom-scrollbar pb-2">
                  <AnimatePresence>
                    {columnApplicants.map((applicant) => (
                      <motion.div
                        key={applicant.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700 relative group"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-slate-800 text-[15px] leading-tight dark:text-slate-100 line-clamp-1 pr-2">
                            {applicant.name}
                          </h4>
                          <span className="text-sm font-bold text-slate-600 dark:text-slate-300 shrink-0">
                            {applicant.score}%
                          </span>
                        </div>
                        
                        <p className="text-xs text-slate-500 font-medium mb-0.5 dark:text-slate-400">{applicant.role}</p>
                        <p className="text-[11px] text-slate-400 mb-3 truncate dark:text-slate-500">{applicant.email}</p>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {applicant.skills.slice(0, 3).map((skill, i) => (
                            <span key={i} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300 tracking-tight">
                              "{skill}"
                            </span>
                          ))}
                          {applicant.skills.length > 3 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300">
                              +{applicant.skills.length - 3}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-auto">
                          {applicant.status === "Applied" ? (
                            <button 
                              onClick={() => handleStatusChange(applicant.id, "Review")}
                              disabled={statusUpdatingId === applicant.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 bg-amber-50 transition hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300"
                            >
                              Screen
                            </button>
                          ) : applicant.status === "Review" ? (
                            <button 
                              onClick={() => handleStatusChange(applicant.id, "Shortlisted")}
                              disabled={statusUpdatingId === applicant.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300"
                            >
                              Shortlist
                            </button>
                          ) : applicant.status === "Shortlisted" ? (
                            <button 
                              onClick={() => navigate(ROUTES.RECRUITER_INTERVIEWS)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-purple-600 bg-purple-50 transition hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300"
                            >
                              Schedule
                            </button>
                          ) : applicant.status === "Interview Scheduled" ? (
                            <button 
                              onClick={() => handleStatusChange(applicant.id, "Interview Completed")}
                              disabled={statusUpdatingId === applicant.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 transition hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300"
                            >
                              Complete
                            </button>
                          ) : applicant.status === "Interview Completed" ? (
                            <button 
                              onClick={() => handleStatusChange(applicant.id, "Offer Sent")}
                              disabled={statusUpdatingId === applicant.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-orange-600 bg-orange-50 transition hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300"
                            >
                              Offer
                            </button>
                          ) : applicant.status === "Offer Sent" || applicant.status === "Selected" || applicant.status === "Accepted" ? (
                            <>
                              <button 
                                onClick={() => handleSendEmail(applicant.id)}
                                disabled={emailSendingId === applicant.id || applicant.emailSent}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${applicant.emailSent ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300" : "text-brand-indigo bg-brand-indigo/10 hover:bg-brand-indigo/20 dark:bg-brand-indigo/30 dark:text-cyan-300"}`}
                              >
                                {applicant.emailSent ? "Email Sent" : "Send Email"}
                              </button>
                              <button 
                                onClick={() => handleStatusChange(applicant.id, "Hired")}
                                disabled={statusUpdatingId === applicant.id}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 bg-emerald-50 transition hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300"
                              >
                                Hire
                              </button>
                            </>
                          ) : null}

                          {applicant.status !== "Rejected" && applicant.status !== "Hired" && (
                            <button 
                              onClick={() => handleStatusChange(applicant.id, "Rejected")}
                              disabled={statusUpdatingId === applicant.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-500 bg-rose-50 transition hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300"
                            >
                              Reject
                            </button>
                          )}

                          <button 
                            onClick={() => handleViewProfile(applicant.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 bg-slate-50 transition hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 ml-auto"
                          >
                            Profile
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {columnApplicants.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 rounded-2xl bg-white/40 dark:bg-slate-800/20">
                      <p className="text-xs font-medium text-slate-400 dark:text-slate-500">No candidates</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Basic Profile Viewer Modal */}
      <Modal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} title="Applicant Profile" maxWidthClass="max-w-2xl">
        {selectedApplication ? (
           <div className="space-y-4 pb-2">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-xl font-bold text-brand-indigo shrink-0">
                {selectedApplication.candidate?.name?.charAt(0) || "U"}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedApplication.candidate?.name || "Unknown Candidate"}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">{selectedApplication.candidate?.headline || "No headline provided"}</p>
                <div className="flex gap-2 mt-2">
                   <span className="px-2 py-1 text-xs font-bold rounded bg-emerald-100 text-emerald-700">Match score: {selectedApplication.matchScore}%</span>
                   <span className="px-2 py-1 text-xs font-bold rounded bg-brand-indigo/10 text-brand-indigo">Status: {selectedApplication.status}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 dark:bg-slate-800/50 dark:border-slate-700 mt-4">
              <h4 className="font-bold text-sm mb-2 text-slate-800 dark:text-slate-200">Contact Details</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Email: {selectedApplication.candidate?.email || "N/A"}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 dark:bg-slate-800/50 dark:border-slate-700">
              <h4 className="font-bold text-sm mb-2 text-slate-800 dark:text-slate-200">Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {(selectedApplication.candidate?.skills || []).map((s, i) => (
                  <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 font-medium dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300">{s}</span>
                ))}
            </div>
            </div>

            {(selectedApplication.candidate?.resumeDocument?.dataUrl || selectedApplication.resumeUrl || selectedApplication.candidate?.resumeUrl) && (
              <button
                onClick={() => setResumeModalData({ 
                  url: selectedApplication.candidate?.resumeDocument?.dataUrl || selectedApplication.resumeUrl || selectedApplication.candidate?.resumeUrl, 
                  name: selectedApplication.candidate?.name 
                })}
                className="w-full py-2 bg-brand-indigo text-white font-bold text-sm rounded-xl mt-2 transition hover:opacity-90"
              >
                View Full Resume PDF
              </button>
            )}
           </div>
        ) : (
          <p className="text-sm text-slate-500">Loading...</p>
        )}
      </Modal>

      <ResumeViewerModal
        open={!!resumeModalData}
        onClose={() => setResumeModalData(null)}
        resumeUrl={resumeModalData?.url || ""}
        candidateName={resumeModalData?.name || "Candidate"}
      />
    </div>
  );
}
