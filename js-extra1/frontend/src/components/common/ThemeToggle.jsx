import { Moon, Sun } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleTheme } from "../../redux/slices/uiSlice";

const ThemeToggle = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.ui.theme);

  return (
    <button
      type="button"
      onClick={() => dispatch(toggleTheme())}
      className="rounded-xl border border-slate-300/70 bg-white/70 p-2 text-slate-700 transition hover:-translate-y-0.5 hover:shadow-soft dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

export default ThemeToggle;
