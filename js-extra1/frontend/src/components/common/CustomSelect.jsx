import { useState, useRef, useEffect, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

const dropdownVariants = {
    hidden: { opacity: 0, y: -6, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 28 } },
    exit: { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.12 } }
};

/**
 * CustomSelect — Modern themed dropdown replacing native <select>.
 *
 * Props:
 *  - value         current value
 *  - onChange       (value) => void
 *  - options        [{ value, label }]
 *  - placeholder    text when nothing selected
 *  - className      extra wrapper classes
 *  - name           for form compatibility
 *  - register       react-hook-form register return (optional)
 */
const CustomSelect = ({
    value,
    onChange,
    options = [],
    placeholder = "Select…",
    className = "",
    name,
    register: rhfRegister
}) => {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);
    const uid = useId();

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open]);

    const selected = options.find((o) => o.value === value);
    const displayLabel = selected?.label || placeholder;

    const handleSelect = (optValue) => {
        onChange?.(optValue);
        // If react-hook-form register is used, trigger onChange through hidden input
        if (rhfRegister) {
            const hiddenInput = wrapperRef.current?.querySelector("input[type=hidden], select");
            if (hiddenInput) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLSelectElement.prototype || window.HTMLInputElement.prototype,
                    "value"
                )?.set;
                nativeInputValueSetter?.call(hiddenInput, optValue);
                hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
            }
        }
        setOpen(false);
    };

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            {/* Hidden native select for form compatibility */}
            {rhfRegister ? (
                <select className="sr-only" tabIndex={-1} aria-hidden {...rhfRegister} value={value}>
                    {options.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
            ) : (
                <input type="hidden" name={name} value={value || ""} />
            )}

            {/* Custom trigger button */}
            <button
                type="button"
                id={uid}
                onClick={() => setOpen((prev) => !prev)}
                className={`field-input flex w-full cursor-pointer items-center justify-between gap-2 text-left transition-all duration-200
          ${open
                        ? "border-brand-indigo ring-2 ring-brand-indigo/30 shadow-[0_0_0_4px_rgba(99,102,241,0.12)]"
                        : "hover:border-brand-indigo/50 hover:shadow-[0_0_0_3px_rgba(99,102,241,0.08)]"
                    }
        `}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className={`truncate ${!selected ? "text-slate-400 dark:text-slate-500" : ""}`}>
                    {displayLabel}
                </span>
                <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 text-brand-indigo dark:text-cyan-300"
                >
                    <ChevronDown size={16} />
                </motion.span>
            </button>

            {/* Dropdown menu */}
            <AnimatePresence>
                {open && (
                    <motion.ul
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        role="listbox"
                        aria-labelledby={uid}
                        className="absolute left-0 right-0 z-50 mt-1.5 max-h-60 overflow-auto rounded-xl border border-white/20 bg-white/90 py-1 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90"
                    >
                        {options.map((option) => {
                            const isSelected = option.value === value;
                            return (
                                <li key={option.value} role="option" aria-selected={isSelected}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(option.value)}
                                        className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors duration-150
                      ${isSelected
                                                ? "bg-brand-indigo/10 font-semibold text-brand-indigo dark:bg-brand-indigo/20 dark:text-cyan-300"
                                                : "text-slate-700 hover:bg-brand-indigo/5 hover:text-brand-indigo dark:text-slate-200 dark:hover:bg-brand-indigo/10 dark:hover:text-cyan-300"
                                            }
                    `}
                                    >
                                        <span className="flex-1 truncate">{option.label}</span>
                                        {isSelected && <Check size={14} className="shrink-0 text-brand-indigo dark:text-cyan-300" />}
                                    </button>
                                </li>
                            );
                        })}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomSelect;
