import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const SearchableDropdown = ({ value, onChange, options, placeholder, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`flex w-full items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/50 p-2.5 text-sm text-slate-800 transition focus-within:ring-2 focus-within:ring-brand-indigo/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus-within:ring-cyan-500/30 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
                <span className={value ? "text-slate-800 dark:text-slate-200" : "text-slate-400"}>
                    {value || placeholder}
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {isOpen && !disabled && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute z-[100] mt-1 hidden max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
                        style={{ display: "block" }} // override standard hidden since absolute z-index is sometimes clipped
                    >
                        <div className="sticky top-0 bg-white p-1 dark:bg-slate-800 z-10">
                            <div className="relative">
                                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 pl-8 text-xs focus:border-brand-indigo focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:border-cyan-400"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                        <div className="mt-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                                        onClick={() => {
                                            onChange(opt);
                                            setIsOpen(false);
                                            setSearchTerm("");
                                        }}
                                    >
                                        {opt}
                                    </button>
                                ))
                            ) : (
                                <div className="p-3 text-center text-xs text-slate-500">
                                    No results found.
                                    <button
                                        type="button"
                                        className="mt-2 block w-full rounded bg-slate-100 p-1.5 font-medium hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
                                        onClick={() => {
                                            onChange(searchTerm);
                                            setIsOpen(false);
                                        }}
                                    >
                                        Use "{searchTerm}" anyway
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
