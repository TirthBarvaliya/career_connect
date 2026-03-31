import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, RotateCcw, Check, Loader2 } from "lucide-react";
import apiClient from "../../utils/api";

const AiWriteModal = ({ open, section, text, onInsert, onClose }) => {
    const [generatedText, setGeneratedText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const sectionLabels = {
        summary: "Profile Summary",
        experience: "Work Experience",
        project: "Project Description"
    };

    useEffect(() => {
        if (open) {
            setGeneratedText("");
            setError("");
            setLoading(false);
        }
    }, [open, section]);

    const generate = async () => {
        setLoading(true);
        setError("");
        setGeneratedText("");
        try {
            const resp = await apiClient.post("/ai/write", { section, text }, { timeout: 30000 });
            setGeneratedText(resp.data.generatedText || "");
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.message ||
                "Failed to generate text. Please try again.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="glass-panel w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden rounded-2xl shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-200/60 px-5 py-4 dark:border-slate-700/60">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center rounded-lg bg-brand-indigo/10 p-2 dark:bg-brand-indigo/20">
                                    <Sparkles size={18} className="text-brand-indigo dark:text-cyan-300" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                        AI Generated Suggestion
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {sectionLabels[section] || "Resume Section"}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                            {!generatedText && !loading && !error && (
                                <div className="rounded-xl border border-slate-200/70 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
                                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Current Text
                                    </p>
                                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                                        {text || <span className="italic text-slate-400">No text provided. AI will generate from scratch based on your profile context.</span>}
                                    </div>
                                    <div className="mt-4 rounded-lg bg-brand-indigo/5 p-3 text-xs text-brand-indigo dark:bg-cyan-900/20 dark:text-cyan-300">
                                        <p className="flex items-center gap-1.5 font-medium">
                                            <Sparkles size={14} /> Ready to optimize?
                                        </p>
                                        <p className="mt-1 opacity-80">Click Generate to automatically rewrite this for better ATS visibility, professional tone, and clarity.</p>
                                    </div>
                                </div>
                            )}

                            {loading && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 size={28} className="mb-3 animate-spin text-brand-indigo dark:text-cyan-300" />
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                        Writing with AI...
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                        This may take a few seconds
                                    </p>
                                </div>
                            )}

                            {error && !loading && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/30">
                                    <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
                                </div>
                            )}

                            {generatedText && !loading && (
                                <div className="rounded-xl border border-brand-indigo/20 bg-brand-indigo/5 p-4 dark:border-cyan-800/30 dark:bg-cyan-900/10">
                                    <p className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-brand-indigo dark:text-cyan-300">
                                        <Sparkles size={12} /> AI Suggestion
                                    </p>
                                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                                        {generatedText}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-2 border-t border-slate-200/60 bg-slate-50/50 px-5 py-3 dark:border-slate-700/60 dark:bg-slate-900/30">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </button>

                            {!generatedText ? (
                                <button
                                    type="button"
                                    onClick={generate}
                                    disabled={loading}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-indigo px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-indigo/90 disabled:opacity-50 dark:bg-cyan-500 dark:hover:bg-cyan-500/90"
                                >
                                    <Sparkles size={13} />
                                    Generate
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={generate}
                                        disabled={loading}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-brand-indigo/30 bg-white px-4 py-2 text-xs font-semibold text-brand-indigo transition hover:bg-brand-indigo/5 disabled:opacity-50 dark:border-cyan-400/30 dark:bg-slate-900 dark:text-cyan-300 dark:hover:bg-cyan-400/5"
                                    >
                                        <RotateCcw size={13} />
                                        Regenerate
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => onInsert(generatedText)}
                                        disabled={loading}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-indigo px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-indigo/90 disabled:opacity-50 dark:bg-cyan-500 dark:hover:bg-cyan-500/90"
                                    >
                                        <Check size={14} />
                                        Insert Text
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AiWriteModal;
