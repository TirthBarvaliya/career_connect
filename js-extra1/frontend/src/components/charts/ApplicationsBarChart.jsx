import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const ApplicationsBarChart = ({ data }) => {
  return (
    <div className="glass-panel h-80 p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        Applications Per Job
      </h3>
      <ResponsiveContainer width="100%" height="88%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis dataKey="job" tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: "rgba(15,23,42,0.9)",
              borderRadius: "12px",
              border: "1px solid rgba(148,163,184,0.2)",
              color: "#e2e8f0"
            }}
          />
          <Bar dataKey="applicants" fill="url(#barGradient)" radius={[10, 10, 0, 0]} animationDuration={900} />
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ApplicationsBarChart;
