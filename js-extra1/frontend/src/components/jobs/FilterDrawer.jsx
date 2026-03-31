import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { drawerMotion } from "../../animations/motionVariants";
import { JOB_TYPES } from "../../utils/constants";
import CustomSelect from "../common/CustomSelect";

const SALARY_RANGES = [
  { label: "0-3 Lakhs", min: 0, max: 300000 },
  { label: "3-6 Lakhs", min: 300000, max: 600000 },
  { label: "6-10 Lakhs", min: 600000, max: 1000000 },
  { label: "10-15 Lakhs", min: 1000000, max: 1500000 },
  { label: "15-25 Lakhs", min: 1500000, max: 2500000 },
  { label: "25-50 Lakhs", min: 2500000, max: 5000000 }
];

const FilterDrawer = ({ open, onClose, filters, setFilters }) => {
  const setField = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }));

  const toggleSalaryRange = (rangeLabel) => {
    setFilters((prev) => {
      const current = prev.salaryRanges || [];
      const next = current.includes(rangeLabel)
        ? current.filter((r) => r !== rangeLabel)
        : [...current, rangeLabel];
      return { ...prev, salaryRanges: next };
    });
  };

  const content = (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          Salary
        </label>
        <div className="space-y-2">
          {SALARY_RANGES.map((range) => (
            <label
              key={range.label}
              className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200"
            >
              <input
                type="checkbox"
                checked={(filters.salaryRanges || []).includes(range.label)}
                onChange={() => toggleSalaryRange(range.label)}
                className="h-4 w-4 rounded border-slate-300 accent-brand-indigo"
              />
              {range.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          Location
        </label>
        <input
          type="text"
          value={filters.location}
          onChange={(e) => setField("location", e.target.value)}
          placeholder="City or Remote"
          className="field-input"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          Job Type
        </label>
        <CustomSelect
          value={filters.type}
          onChange={(val) => setField("type", val)}
          options={[
            { value: "", label: "All Types" },
            ...JOB_TYPES.map((type) => ({ value: type, label: type }))
          ]}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          checked={filters.remoteOnly}
          onChange={(e) => setField("remoteOnly", e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 accent-brand-indigo"
        />
        Remote only
      </label>
    </div>
  );

  return (
    <>
      <div className="glass-panel hidden h-fit p-5 lg:block">
        <div className="mb-4 flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-brand-indigo" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">Filters</h3>
        </div>
        {content}
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-900/45 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              variants={drawerMotion}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-panel fixed bottom-0 right-0 top-0 z-50 w-full max-w-sm p-5 lg:hidden"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Filter Jobs</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export { SALARY_RANGES };
export default FilterDrawer;
