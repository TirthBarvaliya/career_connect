import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Layout } from "lucide-react";
import apiClient from "../../utils/api";

const TemplateSelector = ({ selected, onSelect, excludeBuiltIn = false }) => {
    const [themes, setThemes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchThemes = async () => {
            try {
                const resp = await apiClient.get("/resume/themes");
                const allThemes = resp.data.themes || [];
                setThemes(excludeBuiltIn ? allThemes.filter(t => !t.builtIn) : allThemes);
            } catch {
                // Fallback to built-in themes on error
                let fallbackThemes = [
                    { id: "modern", name: "Modern", description: "Clean layout with indigo accents", builtIn: true },
                    { id: "classic", name: "Classic", description: "Traditional centered resume style", builtIn: true },
                    { id: "minimal", name: "Minimal", description: "Two-column minimal design", builtIn: true }
                ];
                setThemes(excludeBuiltIn ? fallbackThemes.filter(t => !t.builtIn) : fallbackThemes);
            } finally {
                setLoading(false);
            }
        };
        fetchThemes();
    }, [excludeBuiltIn]);

    // Color accent per theme (deterministic via hash)
    const accentColors = [
        "from-indigo-500 to-blue-600",
        "from-emerald-500 to-teal-600",
        "from-purple-500 to-indigo-600",
        "from-cyan-500 to-blue-500",
        "from-rose-500 to-pink-600",
        "from-amber-500 to-orange-600",
        "from-fuchsia-500 to-purple-600",
        "from-lime-500 to-green-600"
    ];

    if (loading) {
        return (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-36 animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800/70" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {themes.length} templates available
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {themes.map((theme, i) => {
                    const isActive = selected === theme.id;
                    const gradient = accentColors[i % accentColors.length];

                    return (
                        <motion.button
                            key={theme.id}
                            type="button"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => onSelect(theme.id)}
                            className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all ${isActive
                                ? "border-brand-indigo ring-2 ring-brand-indigo/30 dark:border-cyan-400 dark:ring-cyan-400/30"
                                : "border-slate-200/70 hover:border-brand-indigo/40 dark:border-slate-700 dark:hover:border-cyan-400/40"
                                }`}
                        >
                            {/* Mini preview header */}
                            <div className={`flex h-20 items-end bg-gradient-to-br ${gradient} p-3`}>
                                <div className="space-y-1">
                                    <div className="h-2 w-16 rounded-full bg-white/80" />
                                    <div className="h-1.5 w-12 rounded-full bg-white/50" />
                                    <div className="h-1 w-20 rounded-full bg-white/30" />
                                </div>
                                <div className="ml-auto flex gap-0.5 self-start">
                                    <div className="h-1 w-6 rounded-full bg-white/20" />
                                    <div className="h-1 w-4 rounded-full bg-white/20" />
                                </div>
                            </div>

                            {/* Content lines (faux body) */}
                            <div className="flex-1 bg-white/80 p-3 dark:bg-slate-900/80">
                                <div className="mb-2 flex items-center gap-2">
                                    <Layout size={12} className="shrink-0 text-slate-400" />
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{theme.name}</p>
                                    {theme.builtIn && (
                                        <span className="ml-auto rounded-full bg-brand-indigo/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-indigo dark:bg-brand-indigo/20 dark:text-cyan-300">
                                            Built-in
                                        </span>
                                    )}
                                    {theme.custom && (
                                        <span className="ml-auto rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
                                            Custom
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                    {theme.description}
                                </p>
                            </div>

                            {/* Selection badge */}
                            {isActive && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-indigo text-white shadow-md dark:bg-cyan-400 dark:text-slate-900"
                                >
                                    <Check size={14} strokeWidth={3} />
                                </motion.div>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default TemplateSelector;
