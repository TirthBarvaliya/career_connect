import {
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";

const SkillsRadarChart = ({ data }) => {
  return (
    <div className="glass-panel h-80 p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Skills Graph</h3>
      <ResponsiveContainer width="100%" height="88%">
        <RadarChart data={data}>
          <PolarGrid strokeOpacity={0.3} />
          <PolarAngleAxis dataKey="skill" tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <PolarRadiusAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <Radar
            dataKey="value"
            stroke="#4f46e5"
            fill="url(#skillsGradient)"
            fillOpacity={0.75}
            animationDuration={900}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(15,23,42,0.85)",
              borderRadius: "12px",
              border: "1px solid rgba(148,163,184,0.2)",
              color: "#e2e8f0"
            }}
          />
          <defs>
            <linearGradient id="skillsGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SkillsRadarChart;
