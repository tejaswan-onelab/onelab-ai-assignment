const GAP_COLORS = {
  "Cross-Month Settlement": "#f59e0b",
  "Amount Mismatch (Rounding)": "#3b82f6",
  "Duplicate Settlement": "#ef4444",
  "Orphan Settlement": "#8b5cf6",
  "Unsettled Transaction": "#6b7280",
};

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${color || "#e5e7eb"}` }}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function SummaryBar({ summary }) {
  if (!summary) return null;

  return (
    <div>
      <div className="summary-grid">
        <StatCard label="Total Transactions" value={summary.total_transactions} color="#6b7280" />
        <StatCard label="Total Settlements" value={summary.total_settlements} color="#6b7280" />
        <StatCard label="Matched" value={summary.total_matched} color="#10b981" />
        <StatCard
          label="Total Gaps"
          value={summary.total_gaps}
          sub={`$${summary.gap_value.toFixed(2)} in discrepancies`}
          color="#ef4444"
        />
      </div>

      <div className="gap-type-grid">
        {Object.entries(summary.gaps_by_type).map(([type, count]) => (
          <StatCard
            key={type}
            label={type}
            value={count}
            color={GAP_COLORS[type] || "#6b7280"}
          />
        ))}
      </div>
    </div>
  );
}
