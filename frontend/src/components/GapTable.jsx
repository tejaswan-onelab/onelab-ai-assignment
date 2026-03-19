import { useState } from "react";

const GAP_BADGE = {
  "Cross-Month Settlement": "badge-yellow",
  "Amount Mismatch (Rounding)": "badge-blue",
  "Duplicate Settlement": "badge-red",
  "Orphan Settlement": "badge-purple",
  "Unsettled Transaction": "badge-gray",
};

export default function GapTable({ gaps }) {
  const [filter, setFilter] = useState("All");

  if (!gaps) return null;

  const types = ["All", ...new Set(gaps.map((g) => g.gap_type))];
  const filtered = filter === "All" ? gaps : gaps.filter((g) => g.gap_type === filter);

  return (
    <div>
      <div className="table-controls">
        <label>Filter by type: </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          {types.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <span className="count-badge">{filtered.length} gap{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Gap Type</th>
              <th>Transaction ID</th>
              <th>Txn Amount</th>
              <th>Txn Date</th>
              <th>Settlement ID</th>
              <th>Settled Amount</th>
              <th>Settlement Date</th>
              <th>Diff</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((gap, i) => {
              const diff = gap.amount_difference;
              const txnAmount = gap.transaction?.amount;
              const stlAmount = gap.settlement?.settled_amount;
              const isMismatch = diff != null && diff > 0;

              return (
                <tr key={i}>
                  <td>
                    <span className={`badge ${GAP_BADGE[gap.gap_type] || "badge-gray"}`}>
                      {gap.gap_type}
                    </span>
                  </td>
                  <td>{gap.transaction?.transaction_id ?? "—"}</td>
                  <td className={isMismatch ? "highlight-red" : ""}>
                    {txnAmount != null ? `$${txnAmount.toFixed(2)}` : "—"}
                  </td>
                  <td>{gap.transaction?.timestamp?.slice(0, 10) ?? "—"}</td>
                  <td>{gap.settlement?.settlement_id ?? "—"}</td>
                  <td className={isMismatch ? "highlight-red" : ""}>
                    {stlAmount != null ? `$${stlAmount.toFixed(2)}` : "—"}
                  </td>
                  <td className={
                    gap.gap_type === "Cross-Month Settlement" ? "highlight-yellow" : ""
                  }>
                    {gap.settlement?.settlement_date ?? "—"}
                  </td>
                  <td className={isMismatch ? "highlight-red" : ""}>
                    {diff != null ? `$${diff.toFixed(4)}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="empty-state">No gaps found for this filter.</p>
      )}
    </div>
  );
}
