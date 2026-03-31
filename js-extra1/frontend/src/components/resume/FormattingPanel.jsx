import { motion } from "framer-motion";

const SPACING_OPTIONS = [
    { value: "compact", label: "Compact" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" }
];

const FONT_OPTIONS = [
    { value: "Inter", label: "Inter" },
    { value: "Satoshi", label: "Satoshi" },
    { value: "Poppins", label: "Poppins" },
    { value: "Roboto", label: "Roboto" }
];

const FONT_SIZE_OPTIONS = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" }
];

const COLOR_OPTIONS = [
    { value: "blue", hex: "#4F46E5", label: "Blue" },
    { value: "teal", hex: "#0D9488", label: "Teal" },
    { value: "green", hex: "#16A34A", label: "Green" },
    { value: "purple", hex: "#7C3AED", label: "Purple" },
    { value: "brown", hex: "#92400E", label: "Brown" }
];

const RadioGroup = ({ label, options, value, onChange }) => (
    <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${value === opt.value
                            ? "border-brand-indigo bg-brand-indigo/10 text-brand-indigo dark:border-cyan-400 dark:bg-cyan-400/10 dark:text-cyan-300"
                            : "border-slate-200/70 text-slate-600 hover:border-brand-indigo/30 dark:border-slate-700 dark:text-slate-300"
                        }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    </div>
);

const FormattingPanel = ({ formatting, onChange }) => {
    const set = (key) => (val) => onChange({ ...formatting, [key]: val });

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
        >
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Customize your resume appearance
            </p>

            <RadioGroup
                label="Section Spacing"
                options={SPACING_OPTIONS}
                value={formatting.spacing}
                onChange={set("spacing")}
            />

            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Font Family
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {FONT_OPTIONS.map((font) => (
                        <button
                            key={font.value}
                            type="button"
                            onClick={() => set("fontFamily")(font.value)}
                            className={`rounded-lg border px-3 py-2 text-sm transition ${formatting.fontFamily === font.value
                                    ? "border-brand-indigo bg-brand-indigo/10 font-semibold text-brand-indigo dark:border-cyan-400 dark:bg-cyan-400/10 dark:text-cyan-300"
                                    : "border-slate-200/70 text-slate-600 hover:border-brand-indigo/30 dark:border-slate-700 dark:text-slate-300"
                                }`}
                            style={{ fontFamily: font.value + ", sans-serif" }}
                        >
                            {font.label}
                        </button>
                    ))}
                </div>
            </div>

            <RadioGroup
                label="Font Size"
                options={FONT_SIZE_OPTIONS}
                value={formatting.fontSize}
                onChange={set("fontSize")}
            />

            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Theme Color
                </p>
                <div className="flex gap-3">
                    {COLOR_OPTIONS.map((color) => (
                        <button
                            key={color.value}
                            type="button"
                            onClick={() => set("themeColor")(color.value)}
                            title={color.label}
                            className="group relative"
                        >
                            <div
                                className={`h-8 w-8 rounded-full border-2 transition ${formatting.themeColor === color.value
                                        ? "scale-110 border-slate-900 ring-2 ring-offset-2 dark:border-white dark:ring-offset-slate-900"
                                        : "border-transparent hover:scale-105"
                                    }`}
                                style={{ backgroundColor: color.hex, ringColor: color.hex }}
                            />
                            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-slate-500 opacity-0 transition group-hover:opacity-100 dark:text-slate-400">
                                {color.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default FormattingPanel;
