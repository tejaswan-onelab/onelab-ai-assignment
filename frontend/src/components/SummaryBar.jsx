const GAP_STYLES = {
  "Cross-Month Settlement":       { dot: "bg-amber-400",  text: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200" },
  "Amount Mismatch (Rounding)":   { dot: "bg-blue-400",   text: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200" },
  "Duplicate Settlement":         { dot: "bg-red-400",    text: "text-red-700",    bg: "bg-red-50",    border: "border-red-200" },
  "Orphan Settlement":            { dot: "bg-purple-400", text: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  "Unsettled Transaction":        { dot: "bg-slate-400",  text: "text-slate-700",  bg: "bg-slate-50",  border: "border-slate-200" },
};

function MetricCard({ label, value, sub, accent }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-1 shadow-sm`}>
      <div className={`text-3xl font-bold tracking-tight ${accent || "text-slate-900"}`}>{value}</div>
      <div className="text-sm font-medium text-slate-500">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function GapTypeCard({ type, count }) {
  const s = GAP_STYLES[type] || { dot: "bg-slate-400", text: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200" };
  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} p-4 flex items-center gap-3`}>
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.dot}`} />
      <div>
        <div className={`text-xl font-bold ${s.text}`}>{count}</div>
        <div className={`text-xs font-medium ${s.text} opacity-80`}>{type}</div>
      </div>
    </div>
  );
}

export default function SummaryBar({ summary }) {
  if (!summary) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Total Transactions" value={summary.total_transactions} />
        <MetricCard label="Total Settlements"  value={summary.total_settlements} />
        <MetricCard label="Matched"            value={summary.total_matched} accent="text-emerald-600" />
        <MetricCard
          label="Total Gaps"
          value={summary.total_gaps}
          sub={`$${summary.gap_value.toFixed(2)} in discrepancies`}
          accent="text-red-600"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(summary.gaps_by_type).map(([type, count]) => (
          <GapTypeCard key={type} type={type} count={count} />
        ))}
      </div>
    </div>
  );
}
