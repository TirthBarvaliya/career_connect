import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Building2, Loader2, X } from "lucide-react";

export const InstituteSearch = ({ value, onChange, onDomainChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value || "");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Sync internal search term when external value changes
    useEffect(() => {
        if (value !== searchTerm && !isOpen) {
            setSearchTerm(value || "");
        }
    }, [value, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const searchInstitutes = useCallback(async (query) => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            // Route through AllOrigins CORS proxy to avoid Mixed Content (HTTP) and CORS browser blocks
            const apiUrl = `http://universities.hipolabs.com/search?country=India&name=${encodeURIComponent(query)}`;
            const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`);
            if (!response.ok) throw new Error("API failed");

            const text = await response.text();
            try {
                const data = JSON.parse(text);
                if (Array.isArray(data)) {
                    // Remove duplicates by name
                    const unique = Array.from(new Map(data.map(item => [item.name, item])).values());
                    // Limit to 20 results for performance
                    setResults(unique.slice(0, 20));
                } else {
                    setResults([]);
                }
            } catch (e) {
                // If the proxy or Hipolabs returns an HTML error page instead of JSON, fail safely.
                console.warn("API returned invalid JSON format.");
                setResults([]);
            }
        } catch (error) {
            console.error("Failed to fetch institutes:", error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounce effect
    useEffect(() => {
        if (!isOpen) return;

        const timeoutId = setTimeout(() => {
            searchInstitutes(searchTerm);
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, searchInstitutes, isOpen]);

    const handleSelect = (institute) => {
        const domain = institute.domains && institute.domains.length > 0 ? institute.domains[0] : "";
        setSearchTerm(institute.name);
        onChange(institute.name);
        onDomainChange(domain);
        setIsOpen(false);
    };

    const handleManualTyping = (e) => {
        setSearchTerm(e.target.value);
        onChange(e.target.value);
        onDomainChange(""); // Clear domain on manual typing
        if (!isOpen) setIsOpen(true);
    };

    const clearSelection = () => {
        setSearchTerm("");
        onChange("");
        onDomainChange("");
        setResults([]);
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div className="relative flex w-full items-center rounded-xl border border-slate-200/70 bg-slate-50/50 p-1 transition focus-within:ring-2 focus-within:ring-brand-indigo/30 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:ring-cyan-500/30">
                <div className="pl-2.5 text-slate-400">
                    <Building2 size={16} />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleManualTyping}
                    onClick={() => setIsOpen(true)}
                    placeholder={placeholder || "Search Institute..."}
                    className="w-full bg-transparent p-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none dark:text-slate-200"
                />
                {searchTerm && (
                    <button
                        type="button"
                        onClick={clearSelection}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {isOpen && (searchTerm.length >= 2 || loading || results.length > 0) && (
                <div className="absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    {loading ? (
                        <div className="flex items-center justify-center p-4 text-xs text-slate-500 dark:text-slate-400">
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            Searching institutes...
                        </div>
                    ) : results.length > 0 ? (
                        results.map((inst, idx) => {
                            const domain = inst.domains && inst.domains.length > 0 ? inst.domains[0] : "";
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSelect(inst)}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                                >
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-700 overflow-hidden">
                                        {domain ? (
                                            <img
                                                src={`https://img.logo.dev/${domain}?token=${import.meta.env.VITE_LOGO_DEV_TOKEN}`}
                                                alt=""
                                                className="h-full w-full object-contain p-1"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className="flex h-full w-full items-center justify-center text-slate-400" style={{ display: domain ? 'none' : 'flex' }}>
                                            <Building2 size={14} />
                                        </div>
                                    </div>
                                    <span className="truncate">{inst.name}</span>
                                </button>
                            );
                        })
                    ) : searchTerm.length >= 2 ? (
                        <div className="p-2">
                            <button
                                type="button"
                                onClick={() => handleSelect({ name: searchTerm, domains: [] })}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-brand-indigo/10 text-brand-indigo dark:bg-cyan-900/30 dark:text-cyan-400">
                                    <Building2 size={14} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="truncate font-medium">{searchTerm}</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Press to use this custom institute</span>
                                </div>
                            </button>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};
