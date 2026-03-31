import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, Send } from "lucide-react";

import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../utils/constants";

const statusTone = {
  Applied: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/35 dark:text-indigo-200",
  Shortlisted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200",
  Interviewing: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/35 dark:text-cyan-200",
  "Interview Scheduled": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/35 dark:text-indigo-200",
  "Interview Completed": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200",
  Review: "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-100",
  Selected: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200",
  "Offer Sent": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/35 dark:text-indigo-200",
  Hired: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200",
  Rejected: "bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-200",
  Accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200",
  Withdrawn: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
};
const FINAL_DECISION_STATUSES = new Set(["Accepted", "Rejected", "Selected", "Offer Sent", "Hired"]);

const ApplicantsTable = ({ applicants, onStatusChange, onViewProfile, onSendEmail, statusUpdatingId, profileLoadingId, emailSendingId }) => {
  const showActions = Boolean(onStatusChange || onViewProfile);
  const [decisionMessages, setDecisionMessages] = useState({});
  const [expandedId, setExpandedId] = useState("");
  const navigate = useNavigate();

  const getMsg = (id, fallback) => decisionMessages[id] ?? fallback ?? "";
  const setMsg = (id, value) => setDecisionMessages((prev) => ({ ...prev, [id]: value }));

  return (
    <div className="glass-panel overflow-hidden">
      <div className="border-b border-slate-200/70 p-4 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Applicants</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50/80 dark:bg-slate-900/70">
            <tr className="text-slate-500 dark:text-slate-300">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Match</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {showActions && <th className="px-4 py-3 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {applicants.map((applicant) => {
              const locked = applicant.status === "Withdrawn";
              const decisionLocked = FINAL_DECISION_STATUSES.has(applicant.status);
              const isExpanded = expandedId === applicant.id;
              return (
                <motion.tr
                  key={applicant.id}
                  whileHover={{ backgroundColor: "rgba(99,102,241,0.08)" }}
                  className="border-b border-slate-200/70 dark:border-slate-800"
                >
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{applicant.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{applicant.role}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{applicant.score}%</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[applicant.status] || statusTone.Review
                        }`}
                    >
                      {applicant.status}
                    </span>
                  </td>
                  {showActions && (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {decisionLocked && (
                          <>
                            <button
                              type="button"
                              disabled={statusUpdatingId === applicant.id}
                              onClick={() => onStatusChange?.(applicant.id, "Review")}
                              className="rounded-lg border border-amber-300/70 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-100 disabled:opacity-60 dark:border-amber-700/60 dark:bg-amber-900/25 dark:text-amber-200"
                            >
                              Withdraw Decision
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? "" : applicant.id)}
                              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition disabled:opacity-60 ${applicant.emailSent
                                ? "border-emerald-300/70 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/25 dark:text-emerald-200"
                                : "border-brand-indigo/40 bg-brand-indigo/10 text-brand-indigo hover:bg-brand-indigo/15 dark:bg-brand-indigo/20 dark:text-cyan-300"
                                }`}
                            >
                              {applicant.emailSent ? (
                                <><CheckCircle2 size={12} /> Email Sent</>
                              ) : (
                                <><Mail size={12} /> Send Email</>
                              )}
                            </button>
                          </>
                        )}
                        {!decisionLocked && (
                          <>
                            {["Applied", "Review"].includes(applicant.status) && (
                              <>
                                <button
                                  type="button"
                                  disabled={statusUpdatingId === applicant.id || locked}
                                  onClick={() => onStatusChange?.(applicant.id, "Shortlisted")}
                                  className="rounded-lg border border-cyan-300/70 bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-700 transition hover:bg-cyan-100 disabled:opacity-60 dark:border-cyan-700/60 dark:bg-cyan-900/25 dark:text-cyan-200"
                                >
                                  Shortlist
                                </button>
                                <button
                                  type="button"
                                  disabled={statusUpdatingId === applicant.id || locked}
                                  onClick={() => onStatusChange?.(applicant.id, "Rejected")}
                                  className="rounded-lg border border-rose-300/70 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-700/60 dark:bg-rose-900/25 dark:text-rose-200"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {["Shortlisted", "Interview Scheduled", "Interviewing"].includes(applicant.status) && (
                              <>
                                <button
                                  type="button"
                                  disabled={statusUpdatingId === applicant.id || locked}
                                  onClick={() => navigate(ROUTES.RECRUITER_INTERVIEWS)}
                                  className="rounded-lg border border-indigo-300/70 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60 dark:border-indigo-700/60 dark:bg-indigo-900/25 dark:text-indigo-200"
                                >
                                  Schedule Interview
                                </button>
                                <button
                                  type="button"
                                  disabled={statusUpdatingId === applicant.id || locked}
                                  onClick={() => onStatusChange?.(applicant.id, "Rejected")}
                                  className="rounded-lg border border-rose-300/70 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-700/60 dark:bg-rose-900/25 dark:text-rose-200"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {applicant.status === "Interview Completed" && (
                              <>
                                <button
                                  type="button"
                                  disabled={statusUpdatingId === applicant.id || locked}
                                  onClick={() => onStatusChange?.(applicant.id, "Selected")}
                                  className="rounded-lg border border-emerald-300/70 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-700/60 dark:bg-emerald-900/25 dark:text-emerald-200"
                                >
                                  Select
                                </button>
                                <button
                                  type="button"
                                  disabled={statusUpdatingId === applicant.id || locked}
                                  onClick={() => onStatusChange?.(applicant.id, "Rejected")}
                                  className="rounded-lg border border-rose-300/70 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-700/60 dark:bg-rose-900/25 dark:text-rose-200"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </>
                        )}
                        <button
                          type="button"
                          disabled={profileLoadingId === applicant.id}
                          onClick={() => onViewProfile?.(applicant.id)}
                          className="rounded-lg border border-slate-300/70 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          View
                        </button>
                      </div>

                      {/* ── Inline email panel ── */}
                      {decisionLocked && isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/60"
                        >
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Decision Message {["Accepted", "Selected", "Offer Sent", "Hired"].includes(applicant.status) ? "(Next Steps)" : "(Feedback)"}
                          </label>
                          <textarea
                            rows={3}
                            value={getMsg(applicant.id, applicant.decisionMessage)}
                            onChange={(e) => setMsg(applicant.id, e.target.value)}
                            placeholder={
                              ["Accepted", "Selected", "Offer Sent", "Hired"].includes(applicant.status)
                                ? "e.g. Congratulations! We'd like to schedule an interview next week..."
                                : "e.g. Thank you for applying. We encourage you to apply for future openings..."
                            }
                            className="field-input mb-2 text-sm"
                          />
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                              Email will be sent to: {applicant.email}
                            </p>
                            <button
                              type="button"
                              disabled={emailSendingId === applicant.id}
                              onClick={() => {
                                const msg = getMsg(applicant.id, applicant.decisionMessage);
                                onSendEmail?.(applicant.id, msg);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-indigo to-brand-cyan px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:shadow-glow disabled:opacity-60"
                            >
                              <Send size={12} />
                              {emailSendingId === applicant.id ? "Sending..." : "Send Email"}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </td>
                  )}
                </motion.tr>
              );
            })}
            {!applicants.length && (
              <tr>
                <td
                  colSpan={showActions ? 5 : 4}
                  className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-300"
                >
                  No applicants found for current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApplicantsTable;
