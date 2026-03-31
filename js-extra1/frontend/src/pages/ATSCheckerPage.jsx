import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud, FileText, ScanSearch, CheckCircle2, Target,
  Sparkles, Download, RotateCcw, BarChart3, Lightbulb, Eye
} from "lucide-react";
import { useDispatch } from "react-redux";
import usePageTitle from "../hooks/usePageTitle";
import { addToast } from "../redux/slices/uiSlice";
import apiClient from "../utils/api";
import ATSScoreRing from "../components/ats/ATSScoreRing";
import ImprovementCard from "../components/ats/ImprovementCard";
import ResumeComparison from "../components/ats/ResumeComparison";

const ATSCheckerPage = () => {
  usePageTitle("ATS Resume Checker & Scorer");
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const downloadEnhancedResumeRef = useRef(null);

  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState("");

  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [results, setResults] = useState(null);

  const getMatchStatus = (score) => {
    if (score < 50) return { label: "Poor Match", color: "text-rose-500", bg: "bg-rose-500/10 dark:bg-rose-900/30" };
    if (score < 70) return { label: "Fair Match", color: "text-amber-500", bg: "bg-amber-500/10 dark:bg-amber-900/30" };
    if (score < 85) return { label: "Good Match", color: "text-brand-cyan", bg: "bg-brand-cyan/10 dark:bg-cyan-900/30" };
    return { label: "Excellent Match", color: "text-emerald-500", bg: "bg-emerald-500/10 dark:bg-emerald-900/30" };
  };

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    validateAndSetFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e) => validateAndSetFile(e.target.files[0]);

  const validateAndSetFile = (inputFile) => {
    if (!inputFile) return;
    if (inputFile.type !== "application/pdf") {
      dispatch(addToast({ type: "error", message: "Only PDF files are supported." }));
      return;
    }
    if (inputFile.size > 2 * 1024 * 1024) {
      dispatch(addToast({ type: "error", message: "File size must be less than 2MB." }));
      return;
    }
    setFile(inputFile);
    setResults(null);
  };

  const removeFile = () => {
    setFile(null);
    setResults(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const convertToBase64 = (inputFile) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(inputFile);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleScan = async () => {
    if (!file) {
      dispatch(addToast({ type: "error", message: "Please upload your resume first." }));
      return;
    }
    setIsScanning(true);
    setScanStep(1);
    try {
      const base64PDF = await convertToBase64(file);
      setTimeout(() => setScanStep(2), 1500);
      setTimeout(() => setScanStep(3), 3500);
      setTimeout(() => setScanStep(4), 5500);
      const response = await apiClient.post("/resume/ats-check", {
        pdfBase64: base64PDF,
        jobDescription: jobDesc.trim() || undefined
      }, { timeout: 60000 });
      setResults(response.data);
      dispatch(addToast({ type: "success", message: "Analysis complete!" }));
    } catch (error) {
      dispatch(addToast({ type: "error", message: error.response?.data?.message || "Failed to analyze resume." }));
    } finally {
      setIsScanning(false);
      setScanStep(0);
    }
  };

  /* ═════════════════════════════════════════════════════════════════════ */

  return (
    <div className="space-y-5">

      {/* ── Page Header ── */}
      <div className="glass-panel p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-indigo to-brand-cyan text-white shadow-glow">
            <ScanSearch size={22} />
          </div>
          <div>
            <h1 className="font-poppins text-2xl font-bold text-slate-900 dark:text-white">
              AI ATS Resume Checker
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Upload your old PDF. Get a score, improvement tips, and a fully enhanced template instantly.
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  UPLOAD STATE                                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {!results && !isScanning && (
        <div className="glass-panel p-5 sm:p-6">
          <div className="mx-auto max-w-4xl">

            {/* Section label */}
            <div className="mb-5 text-center">
              <h2 className="font-poppins text-lg font-semibold text-slate-800 dark:text-slate-100">
                Upload &amp; Analyze
              </h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Upload your resume and optionally add a target job description for tailored analysis.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {/* Upload box */}
              <div className="flex flex-col gap-4">
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`relative flex h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all ${
                    file
                      ? "border-brand-indigo/50 bg-brand-indigo/[0.02] dark:border-cyan-500/50 dark:bg-cyan-500/[0.02]"
                      : "border-slate-300 bg-slate-50 hover:border-brand-indigo hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-cyan-400 dark:hover:bg-slate-800/80"
                  }`}
                  onClick={() => !file && fileInputRef.current?.click()}
                >
                  <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  {file ? (
                    <div className="flex flex-col items-center gap-2.5 p-5 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <FileText size={28} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200">{file.name}</h4>
                        <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(); }}
                        className="text-sm font-medium text-rose-500 hover:underline dark:text-rose-400"
                      >
                        Remove File
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2.5 p-5 text-center text-slate-500">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200/50 text-slate-400 dark:bg-slate-800/50">
                        <UploadCloud size={28} />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-700 dark:text-slate-300">Click or drag &amp; drop to upload</h4>
                        <p className="mt-0.5 text-xs">PDF only (Max 2MB)</p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleScan}
                  disabled={!file}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-brand-indigo to-brand-cyan px-6 py-4 font-bold text-white shadow-glow transition-all hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Sparkles size={20} />
                  Analyze &amp; Enhance Resume
                </button>
              </div>

              {/* Job Description */}
              <div className="glass-card flex h-full flex-col p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <Target size={18} className="text-brand-indigo dark:text-cyan-400" />
                    <h3 className="font-poppins font-semibold">Target Job Description</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    Optional
                  </span>
                </div>
                <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                  Paste the job description you are aiming for. The AI will tailor keywords, skills, and summary to match.
                </p>
                <textarea
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  placeholder="e.g. Seeking a Frontend Engineer with 3+ years experience in React, TypeScript, and modern CSS frameworks..."
                  className="h-full min-h-[140px] w-full resize-none rounded-xl border border-slate-200 bg-white/50 p-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200 dark:placeholder:text-slate-600 dark:focus:border-cyan-400 dark:focus:ring-cyan-400"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  SCANNING ANIMATION                                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-panel flex flex-col items-center justify-center py-16"
          >
            <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 max-h-full max-w-full animate-[spin_3s_linear_infinite] rounded-full border-4 border-slate-200 border-t-brand-indigo dark:border-slate-800 dark:border-t-cyan-400" />
              <div className="absolute inset-2 max-h-full max-w-full animate-[spin_2s_linear_infinite_reverse] rounded-full border-4 border-slate-200 border-b-brand-purple dark:border-slate-800 dark:border-b-purple-500" />
              <Sparkles className="animate-pulse text-brand-indigo dark:text-cyan-400" size={32} />
            </div>
            <div className="w-full max-w-md space-y-4">
              {[
                { id: 1, text: "Extracting raw text from PDF layout..." },
                { id: 2, text: "Running 16 ATS compatibility checks..." },
                { id: 3, text: "Analyzing impact metrics and keywords..." },
                { id: 4, text: "Formatting enhanced CV template..." }
              ].map((step) => (
                <div key={step.id} className="flex items-center gap-3">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                    scanStep > step.id ? "bg-emerald-500 text-white" : scanStep === step.id ? "bg-brand-indigo text-white dark:bg-cyan-500" : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                  }`}>
                    {scanStep > step.id ? <CheckCircle2 size={14} /> : <span className="text-[10px] font-bold">{step.id}</span>}
                  </div>
                  <span className={`text-sm font-medium transition-colors ${
                    scanStep >= step.id ? "text-slate-800 dark:text-slate-200" : "text-slate-400 dark:text-slate-600"
                  }`}>{step.text}</span>
                  {scanStep === step.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-indigo dark:bg-cyan-400"
                    />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  RESULTS STATE — each section is its own card                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {results && !isScanning && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-5"
        >

          {/* ─── CARD 1: Result Summary Bar ─── */}
          <div className="glass-panel overflow-hidden">
            <div className="border-b border-slate-200/70 bg-slate-50/50 px-5 py-3 dark:border-slate-700/60 dark:bg-slate-800/30">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <BarChart3 size={16} className="text-brand-indigo dark:text-cyan-400" />
                <h3 className="font-poppins text-sm font-semibold">Result Summary</h3>
              </div>
            </div>
            <div className="grid items-center gap-4 p-5 sm:grid-cols-3">
              {/* Score */}
              <div className="flex items-center gap-4">
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${getMatchStatus(results.score).bg}`}>
                  <span className={`font-poppins text-2xl font-bold ${getMatchStatus(results.score).color}`}>
                    {results.score}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">ATS Score</p>
                  <span className={`mt-0.5 inline-block text-sm font-bold ${getMatchStatus(results.score).color}`}>
                    {getMatchStatus(results.score).label}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="text-center hidden sm:block">
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  This score shows how well typical Applicant Tracking Systems can read and interpret your original PDF.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => downloadEnhancedResumeRef.current?.()}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-cyan px-4 py-2.5 text-xs font-semibold text-white shadow-glow transition-all hover:scale-[1.02]"
                >
                  <Download size={14} />
                  Download Enhanced PDF
                </button>
                <button
                  type="button"
                  onClick={removeFile}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300/70 bg-white/80 px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-slate-500"
                >
                  <RotateCcw size={12} />
                  Scan Again
                </button>
              </div>
            </div>
          </div>

          {/* ─── CARD 2: Score + Analysis Grid ─── */}
          <div className="grid gap-5 xl:grid-cols-[320px_1fr] xl:items-start">

            {/* Left: Score Ring Card */}
            <div className="glass-panel p-5">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-brand-indigo dark:text-cyan-400" />
                <h3 className="font-poppins text-sm font-semibold text-slate-800 dark:text-slate-100">Score Breakdown</h3>
              </div>
              <div className="flex flex-col items-center gap-4">
                <ATSScoreRing score={results.score} />
                <p className="max-w-[280px] text-center text-xs text-slate-500 dark:text-slate-400">
                  Based on 16 ATS compatibility checks across content, format, skills, and style.
                </p>
              </div>
            </div>

            {/* Right: Improvements 2×2 Grid */}
            <div className="glass-panel p-5">
              <div className="mb-4 flex items-center gap-2">
                <Lightbulb size={16} className="text-amber-500" />
                <h3 className="font-poppins text-sm font-semibold text-slate-800 dark:text-slate-100">Key Improvements Applied</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {results.improvements.map((imp, index) => (
                  <ImprovementCard key={index} index={index} improvement={imp} />
                ))}
              </div>
            </div>
          </div>

          {/* ─── CARD 3: Enhanced Resume Preview ─── */}
          <div className="glass-panel p-5">
            <div className="mb-5 flex items-center gap-2">
              <Eye size={16} className="text-brand-indigo dark:text-cyan-400" />
              <h3 className="font-poppins text-sm font-semibold text-slate-800 dark:text-slate-100">Enhanced Resume Preview</h3>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                <Sparkles size={10} />
                AI Enhanced
              </span>
            </div>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
              We've applied the fixes and mapped your data to an ATS-friendly premium template. Select a template and download.
            </p>
            <ResumeComparison enhancedResume={results.enhancedResume} downloadActionRef={downloadEnhancedResumeRef} />
          </div>

        </motion.div>
      )}

    </div>
  );
};

export default ATSCheckerPage;
