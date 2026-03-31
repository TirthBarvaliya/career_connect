import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, Bot, ArrowLeft, Loader2, Trophy, TrendingUp, AlertTriangle, Target, Sparkles } from "lucide-react";
import apiClient from "../utils/api";
import usePageTitle from "../hooks/usePageTitle";

const AiInterviewPage = () => {
    const { domain } = useParams();
    const navigate = useNavigate();
    const friendlyDomain = domain ? domain.replace(/-/g, " ") : "Interview";
    usePageTitle(`${friendlyDomain} Interview Prep`);

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(true); // initially true while starting
    const [questionCount, setQuestionCount] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [feedbackLoading, setFeedbackLoading] = useState(false);

    const scrollAnchorRef = useRef(null);
    const chatAreaRef = useRef(null);
    const hasUserSentMessage = useRef(false);

    // Auto-scroll to bottom of chat — only after the user has sent a message
    useEffect(() => {
        if (!hasUserSentMessage.current) return;
        scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // Force scroll to top on mount so the first AI question is visible
    useEffect(() => {
        window.scrollTo(0, 0);
        if (chatAreaRef.current) chatAreaRef.current.scrollTop = 0;
    }, []);

    // Start the interview session on mount
    useEffect(() => {
        let active = true;
        const startSession = async () => {
            try {
                const response = await apiClient.post("/interview/start", { domain });
                if (!active) return;

                if (response.data.success) {
                    setMessages([
                        { role: "assistant", content: response.data.data.message }
                    ]);
                    setQuestionCount(0);
                }
            } catch (error) {
                if (!active) return;
                setMessages([
                    { role: "assistant", content: "Sorry, I couldn't connect to the interview server right now. Please try again later." }
                ]);
            } finally {
                if (active) setIsTyping(false);
            }
        };
        startSession();
        return () => { active = false; };
    }, [domain]);

    // Fetch AI feedback when interview completes
    const fetchFeedback = async (allMessages) => {
        setFeedbackLoading(true);
        try {
            const response = await apiClient.post("/interview/feedback", {
                domain,
                conversations: allMessages
            });
            if (response.data.success) {
                setFeedback(response.data.data);
            }
        } catch (error) {
            console.error("Feedback error:", error);
            setFeedback({ error: true });
        } finally {
            setFeedbackLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isTyping || isComplete) return;

        const userMsg = input.trim();
        setInput("");
        const updatedMessages = [...messages, { role: "user", content: userMsg }];
        setMessages(updatedMessages);
        hasUserSentMessage.current = true;
        setIsTyping(true);

        try {
            const response = await apiClient.post("/interview/evaluate", {
                domain,
                question: messages[messages.length - 1]?.content,
                answer: userMsg,
                questionCount
            });

            if (response.data.success) {
                const data = response.data.data;

                if (data.isComplete) {
                    const finalMessages = [...updatedMessages, { role: "assistant", content: data.message }];
                    setMessages(finalMessages);
                    setIsComplete(true);
                    // Trigger feedback generation
                    fetchFeedback(finalMessages);
                } else {
                    // Construct a nice formatted response from the AI
                    const aiResponseString = `**Score: ${data.score}/10**\n\n${data.feedback}\n\n**Next Question:**\n${data.nextQuestion}`;
                    setMessages(prev => [...prev, { role: "assistant", content: aiResponseString }]);
                    setQuestionCount(data.newQuestionCount);
                }
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: "assistant", content: "I encountered an error evaluating that answer. Let's try to proceed. Are you ready for the next question?" }]);
        } finally {
            setIsTyping(false);
        }
    };

    // Helper to format basic markdown (bold text) in AI messages
    const formatMessageText = (text) => {
        return text.split("\n").map((line, i) => {
            // Very basic markdown bold parsing for **text**
            const formattedLine = line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                    return <strong key={j} className="text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
                }
                return part;
            });
            return <span key={i} className="block mb-2 last:mb-0">{formattedLine}</span>;
        });
    };

    // Score color helper
    const getScoreColor = (score) => {
        if (score >= 8) return "text-emerald-500";
        if (score >= 6) return "text-amber-500";
        return "text-red-500";
    };

    const getScoreRingColor = (score) => {
        if (score >= 8) return "from-emerald-500 to-teal-400";
        if (score >= 6) return "from-amber-500 to-orange-400";
        return "from-red-500 to-pink-400";
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-200">

            {/* Top Header Bar */}
            <header className="flex-none flex flex-col gap-3 border-b border-slate-200 bg-white/50 px-4 py-3 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/50 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="rounded-full p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="min-w-0">
                        <h1 className="truncate text-base font-bold capitalize text-slate-900 dark:text-white sm:text-lg">{friendlyDomain}</h1>
                        <p className="hidden text-xs text-brand-indigo dark:text-brand-cyan sm:block">AI Interview Coach Component</p>
                    </div>
                </div>

                <div className="self-end text-xs font-medium text-slate-600 dark:text-slate-400 sm:self-auto sm:text-sm">
                    <span className="text-slate-900 dark:text-white">{questionCount}</span> / 5 Questions
                </div>
            </header>

            {/* Chat Area */}
            <main ref={chatAreaRef} className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="mx-auto max-w-3xl space-y-6">

                    {messages.map((msg, idx) => {
                        const isUser = msg.role === "user";
                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
                            >
                                {!isUser && (
                                    <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-cyan text-white shadow-glow">
                                        <Bot size={16} />
                                    </div>
                                )}

                                <div
                                    className={`max-w-[85%] rounded-2xl px-5 py-4 ${isUser
                                        ? "rounded-br-sm bg-white border border-slate-200 text-slate-800 dark:bg-slate-800 dark:border-none dark:text-slate-200"
                                        : "rounded-bl-sm border border-brand-cyan/20 bg-gradient-to-br from-brand-indigo/10 to-brand-cyan/5 text-slate-700 dark:from-brand-indigo/20 dark:to-brand-cyan/10 dark:text-slate-300"
                                        }`}
                                >
                                    {isUser ? msg.content : formatMessageText(msg.content)}
                                </div>
                            </motion.div>
                        );
                    })}

                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex w-full justify-start"
                        >
                            <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-cyan text-white opacity-50">
                                <Bot size={16} />
                            </div>
                            <div className="flex items-center rounded-2xl rounded-bl-sm border border-brand-cyan/10 bg-brand-indigo/5 px-5 py-4">
                                <Loader2 size={18} className="animate-spin text-brand-cyan" />
                                <span className="ml-2 text-xs text-brand-cyan tracking-widest uppercase">Analyzing...</span>
                            </div>
                        </motion.div>
                    )}

                    {/* Feedback Loading State */}
                    {feedbackLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mx-auto mt-8 flex flex-col items-center gap-4 rounded-2xl border border-brand-cyan/20 bg-gradient-to-br from-brand-indigo/5 to-brand-cyan/5 p-8 dark:from-brand-indigo/15 dark:to-brand-cyan/10"
                        >
                            <Loader2 size={32} className="animate-spin text-brand-cyan" />
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">AI is analyzing your interview performance...</p>
                        </motion.div>
                    )}

                    {/* Feedback Card */}
                    {feedback && !feedback.error && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="mt-8 space-y-6"
                        >
                            {/* Score Header */}
                            <div className="rounded-2xl border border-brand-cyan/20 bg-gradient-to-br from-slate-50 to-white p-6 shadow-lg dark:border-white/10 dark:from-slate-900 dark:to-slate-800/80">
                                <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                                    <div className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getScoreRingColor(feedback.overallScore)} p-[3px]`}>
                                        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white dark:bg-slate-900">
                                            <span className={`text-3xl font-bold ${getScoreColor(feedback.overallScore)}`}>
                                                {feedback.overallScore}
                                            </span>
                                            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                                / {feedback.scoreOutOf || 10}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <div className="mb-1 flex items-center justify-center gap-2 sm:justify-start">
                                            <Trophy size={18} className="text-amber-500" />
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Interview Performance</h3>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">{feedback.summary}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Strengths & Weaknesses Grid */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Strengths */}
                                <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-5 dark:border-emerald-500/20 dark:bg-emerald-950/20">
                                    <div className="mb-3 flex items-center gap-2">
                                        <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Strengths</h4>
                                    </div>
                                    <ul className="space-y-2">
                                        {(feedback.strengths || []).map((s, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Weaknesses */}
                                <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-5 dark:border-amber-500/20 dark:bg-amber-950/20">
                                    <div className="mb-3 flex items-center gap-2">
                                        <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Areas to Improve</h4>
                                    </div>
                                    <ul className="space-y-2">
                                        {(feedback.weaknesses || []).map((w, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                                                {w}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Topics to Improve */}
                            {feedback.topicsToImprove && feedback.topicsToImprove.length > 0 && (
                                <div className="rounded-2xl border border-brand-indigo/20 bg-brand-indigo/5 p-5 dark:border-brand-indigo/30 dark:bg-brand-indigo/10">
                                    <div className="mb-4 flex items-center gap-2">
                                        <Target size={16} className="text-brand-indigo dark:text-brand-cyan" />
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-brand-indigo dark:text-brand-cyan">Topics to Focus On</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {feedback.topicsToImprove.map((topic, i) => (
                                            <div key={i} className="rounded-xl border border-slate-200/80 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-800/50">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{topic.topic}</p>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{topic.reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recommendation */}
                            {feedback.recommendation && (
                                <div className="rounded-2xl border border-purple-200/60 bg-gradient-to-br from-purple-50/70 to-indigo-50/50 p-5 dark:border-purple-500/20 dark:from-purple-950/20 dark:to-indigo-950/20">
                                    <div className="mb-3 flex items-center gap-2">
                                        <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">AI Recommendation</h4>
                                    </div>
                                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                        {feedback.recommendation}
                                    </p>
                                </div>
                            )}

                            {/* Try Again Button */}
                            <div className="flex justify-center pt-2">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="rounded-xl bg-gradient-to-r from-brand-indigo via-brand-cyan to-brand-purple px-6 py-3 font-semibold text-white shadow-glow transition duration-300 hover:scale-[1.03] hover:shadow-xl"
                                >
                                    Try Another Interview
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Feedback Error State */}
                    {feedback && feedback.error && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mx-auto mt-8 rounded-2xl border border-red-200/60 bg-red-50/50 p-6 text-center dark:border-red-500/20 dark:bg-red-950/20"
                        >
                            <p className="text-sm text-red-600 dark:text-red-400">Could not generate feedback. Please try the interview again.</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
                            >
                                Retry
                            </button>
                        </motion.div>
                    )}

                    <div ref={scrollAnchorRef} className="h-4" />
                </div>
            </main>

            {/* Input Area */}
            <footer className="flex-none border-t border-slate-200 bg-white/50 p-4 backdrop-blur-md md:p-6 dark:border-white/10 dark:bg-slate-900/50">
                <form
                    onSubmit={handleSend}
                    className="relative mx-auto flex max-w-3xl items-center gap-3 rounded-xl border border-slate-300 bg-white p-2 shadow-inner transition-all focus-within:border-brand-indigo/50 focus-within:ring-1 focus-within:ring-brand-indigo/50 dark:border-white/10 dark:bg-slate-950 dark:focus-within:border-brand-cyan/50 dark:focus-within:ring-brand-cyan/50"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isTyping || isComplete}
                        placeholder={isComplete ? "Interview finished." : "Type your answer..."}
                        className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-50 dark:text-white dark:placeholder:text-slate-500"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping || isComplete}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-indigo text-white transition hover:bg-indigo-600 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-40 dark:bg-brand-cyan dark:text-slate-950 dark:hover:bg-cyan-300"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </footer>

        </div>
    );
};

export default AiInterviewPage;
