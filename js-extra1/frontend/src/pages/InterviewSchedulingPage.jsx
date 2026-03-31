import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarHeart, Video, MapPin, Link as LinkIcon, FileText, CheckCircle2, Search, CalendarDays } from "lucide-react";
import { useDispatch } from "react-redux";
import usePageTitle from "../hooks/usePageTitle";
import GlassCard from "../components/common/GlassCard";
import GradientButton from "../components/common/GradientButton";
import CustomSelect from "../components/common/CustomSelect";
import LoadingSkeleton from "../components/common/LoadingSkeleton";
import { addToast } from "../redux/slices/uiSlice";
import getErrorMessage from "../utils/errorMessage";
import apiClient from "../utils/api";

const statusTone = {
    Shortlisted: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/35 dark:text-cyan-200",
    "Interview Scheduled": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/35 dark:text-indigo-200",
    "Interview Completed": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200"
};

const InterviewSchedulingPage = () => {
    usePageTitle("Interview Scheduling");
    const dispatch = useDispatch();

    const [loading, setLoading] = useState(true);
    const [candidates, setCandidates] = useState([]);
    const [search, setSearch] = useState("");
    const [schedulingId, setSchedulingId] = useState("");
    const [expandedId, setExpandedId] = useState("");

    const [formData, setFormData] = useState({
        date: "",
        time: "",
        ampm: "AM",
        mode: "Online",
        meetingLink: "",
        notes: "",
        sendEmail: true
    });

    const loadCandidates = useCallback(async () => {
        try {
            // 1. Get all jobs for recruiter
            const jobsRes = await apiClient.get("/jobs/recruiter/mine");
            const jobs = jobsRes.data.jobs || [];

            // 2. Fetch applicants for each active job
            const applicantPromises = jobs.map((job) => apiClient.get(`/jobs/${job.id}/applicants`));
            const applicantResponses = await Promise.all(applicantPromises);

            // 3. Flatten and filter
            const allApplicants = [];
            applicantResponses.forEach((res, index) => {
                const jobApplicants = res.data.applicants || [];
                const jobTitle = jobs[index].title;
                jobApplicants.forEach((appl) => {
                    if (["Shortlisted", "Interview Scheduled", "Interview Completed"].includes(appl.status)) {
                        allApplicants.push({ ...appl, jobTitle });
                    }
                });
            });

            // Sort by recently applied
            allApplicants.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
            setCandidates(allApplicants);
        } catch (error) {
            dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to load candidates.") }));
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => {
        loadCandidates();
    }, [loadCandidates]);

    const handleOpenSchedule = (candidate) => {
        if (expandedId === candidate.id) {
            setExpandedId("");
            return;
        }
        const existing = candidate.interview || {};

        let datePart = "";
        let timePart = "10:00";
        let ampmPart = "AM";

        if (existing.date) {
            const d = new Date(existing.date);
            datePart = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
            let hours = d.getHours();
            const mins = d.getMinutes().toString().padStart(2, '0');
            ampmPart = hours >= 12 ? "PM" : "AM";
            hours = hours % 12 || 12;
            timePart = `${hours.toString().padStart(2, '0')}:${mins}`;
        }

        setFormData({
            date: datePart,
            time: timePart,
            ampm: ampmPart,
            mode: existing.mode || "Online",
            meetingLink: existing.meetingLink || "",
            notes: existing.notes || "",
            sendEmail: true
        });
        setExpandedId(candidate.id);
    };

    const handleScheduleSubmit = async (e, applicationId) => {
        e.preventDefault();
        if (!formData.date || !formData.time) {
            dispatch(addToast({ type: "error", message: "Please select an interview date and time." }));
            return;
        }

        let [hourStr, minStr] = formData.time.split(":");
        let hour = parseInt(hourStr, 10);
        if (formData.ampm === "PM" && hour !== 12) hour += 12;
        if (formData.ampm === "AM" && hour === 12) hour = 0;

        const hourFormatted = hour.toString().padStart(2, '0');
        const localDate = new Date(`${formData.date}T${hourFormatted}:${minStr || '00'}:00`);
        const payloadDate = localDate.toISOString();

        setSchedulingId(applicationId);
        try {
            const payload = { ...formData, date: payloadDate };
            const res = await apiClient.put(`/jobs/applications/${applicationId}/interview`, payload);
            setCandidates((prev) =>
                prev.map((c) => (c.id === applicationId ? { ...c, status: res.data.status, interview: res.data.interview } : c))
            );
            dispatch(addToast({ type: "success", message: "Interview scheduled successfully." }));
            setExpandedId("");
        } catch (error) {
            dispatch(addToast({ type: "error", message: getErrorMessage(error, "Failed to schedule interview.") }));
        } finally {
            setSchedulingId("");
        }
    };

    const filteredCandidates = candidates.filter((c) =>
        `${c.name} ${c.jobTitle} ${c.email}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="container-4k space-y-6 pb-20 pt-6 lg:space-y-8 lg:pt-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <h1 className="font-poppins text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
                        Interview Scheduling
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Manage your shortlisted candidates and schedule interviews.
                    </p>
                </div>
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search candidates by name or role..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="field-input pl-10 text-sm"
                    />
                </div>
            </div>

            <GlassCard className="p-0 overflow-hidden" hoverable={false}>
                {loading ? (
                    <div className="p-6 space-y-4">
                        <LoadingSkeleton className="h-16 w-full rounded-xl" />
                        <LoadingSkeleton className="h-16 w-full rounded-xl" />
                        <LoadingSkeleton className="h-16 w-full rounded-xl" />
                    </div>
                ) : filteredCandidates.length === 0 ? (
                    <div className="flex flex-col py-16 items-center justify-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                            <CalendarHeart size={32} />
                        </div>
                        <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">No pipelines found</h3>
                        <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
                            Shortlist applicants from your dashboard to see them here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200/70 dark:divide-slate-700/70">
                        {filteredCandidates.map((candidate) => (
                            <div key={candidate.id} className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 last:border-0 relative">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                                            {candidate.name}
                                        </h4>
                                        <p className="text-sm font-medium text-brand-indigo dark:text-cyan-400">
                                            {candidate.jobTitle}
                                        </p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusTone[candidate.status] || statusTone.Shortlisted}`}>
                                                {candidate.status}
                                            </span>
                                            {candidate.interview?.date && (
                                                <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                    <CalendarDays size={12} />
                                                    {new Date(candidate.interview.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <GradientButton
                                        variant={expandedId === candidate.id ? "outline" : "primary"}
                                        size="sm"
                                        onClick={() => handleOpenSchedule(candidate)}
                                    >
                                        {candidate.status === "Interview Completed" ? "Review Notes" : "Schedule Interview"}
                                    </GradientButton>
                                </div>

                                <AnimatePresence>
                                    {expandedId === candidate.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <form
                                                onSubmit={(e) => handleScheduleSubmit(e, candidate.id)}
                                                className="mt-4 rounded-xl border border-slate-200/70 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50"
                                            >
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="space-y-1.5 sm:col-span-2">
                                                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                            Date & Time (12-hour format)
                                                        </label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="date"
                                                                required
                                                                min={new Date().toISOString().split('T')[0]}
                                                                value={formData.date}
                                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                                className="field-input text-sm flex-1"
                                                            />
                                                            <input
                                                                type="text"
                                                                required
                                                                placeholder="10:30"
                                                                pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]$"
                                                                title="Format HH:MM (1-12)"
                                                                value={formData.time}
                                                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                                                className="field-input text-sm w-24 text-center"
                                                            />
                                                            <CustomSelect
                                                                value={formData.ampm}
                                                                onChange={(val) => setFormData({ ...formData, ampm: val })}
                                                                className="w-20"
                                                                options={[
                                                                    { value: "AM", label: "AM" },
                                                                    { value: "PM", label: "PM" }
                                                                ]}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                            Mode
                                                        </label>
                                                        <CustomSelect
                                                            value={formData.mode}
                                                            onChange={(val) => setFormData({ ...formData, mode: val })}
                                                            options={[
                                                                { value: "Online", label: "Online Video Call" },
                                                                { value: "Offline", label: "In-Person" },
                                                                { value: "Phone", label: "Phone Call" }
                                                            ]}
                                                        />
                                                    </div>
                                                    {(formData.mode === "Online" || formData.mode === "Phone") && (
                                                        <div className="space-y-1.5 sm:col-span-2">
                                                            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                                <LinkIcon size={12} /> Meeting Link / Phone Number
                                                            </label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. Zoom link or Phone number"
                                                                value={formData.meetingLink}
                                                                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                                                                className="field-input text-sm"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="space-y-1.5 sm:col-span-2">
                                                        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                            <FileText size={12} /> Notes & Instructions
                                                        </label>
                                                        <textarea
                                                            rows={2}
                                                            placeholder="Any special instructions for the candidate..."
                                                            value={formData.notes}
                                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                            className="field-input text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.sendEmail}
                                                            onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                                                            className="rounded border-slate-300 h-4 w-4 text-brand-indigo focus:ring-brand-indigo dark:border-slate-600 dark:bg-slate-800"
                                                        />
                                                        Send email notification to candidate
                                                    </label>
                                                    <GradientButton
                                                        type="submit"
                                                        size="sm"
                                                        isLoading={schedulingId === candidate.id}
                                                    >
                                                        <CheckCircle2 size={16} className="mr-1.5" />
                                                        Save Interview
                                                    </GradientButton>
                                                </div>
                                            </form>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                )}
            </GlassCard>
        </div>
    );
};

export default InterviewSchedulingPage;
