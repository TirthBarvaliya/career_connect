import { motion, AnimatePresence } from "framer-motion";
import { X, Download, FileText } from "lucide-react";

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 30 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 28 } },
    exit: { opacity: 0, scale: 0.92, y: 30, transition: { duration: 0.18 } }
};

const ResumeViewerModal = ({ open, onClose, resumeUrl, candidateName = "Candidate" }) => {
    if (!resumeUrl) return null;

    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = resumeUrl;
        link.download = `${candidateName.replace(/\s+/g, "_")}_Resume.pdf`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed inset-4 z-[80] flex items-center justify-center sm:inset-8 lg:inset-12"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <div className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-3.5 dark:border-slate-700">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-indigo to-brand-cyan">
                                        <FileText size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{candidateName}'s Resume</p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">PDF Document Viewer</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleDownload}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-indigo/40 bg-brand-indigo/10 px-3 py-1.5 text-xs font-semibold text-brand-indigo transition hover:bg-brand-indigo/20 active:scale-95 dark:bg-brand-indigo/20 dark:text-cyan-300 dark:hover:bg-brand-indigo/30"
                                    >
                                        <Download size={13} />
                                        Download
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:scale-90 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                        aria-label="Close resume viewer"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* PDF Viewer */}
                            <div className="flex-1 overflow-hidden bg-slate-100 dark:bg-slate-800/50">
                                <iframe
                                    src={resumeUrl}
                                    title={`${candidateName}'s Resume`}
                                    className="h-full w-full border-0"
                                    style={{ minHeight: "400px" }}
                                />
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ResumeViewerModal;
