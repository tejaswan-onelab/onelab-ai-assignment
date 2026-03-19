import { useState } from "react";

const BADGE = {
  "Cross-Month Settlement":     "bg-amber-100 text-amber-800 ring-amber-200",
  "Amount Mismatch (Rounding)": "bg-blue-100 text-blue-800 ring-blue-200",
  "Duplicate Settlement":       "bg-red-100 text-red-800 ring-red-200",
  "Orphan Settlement":          "bg-purple-100 text-purple-800 ring-purple-200",
  "Unsettled Transaction":      "bg-slate-100 text-slate-700 ring-slate-200",
};

function Badge({ type }) {
  const cls = BADGE[type] || "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${cls}`}>
      {type}
    </span>
  );
}

export default function GapTable({ gaps }) {
  const [filter, setFilter] = useState("All");

  if (!gaps) return null;

  const types = ["All", ...new Set(gaps.map((g) => g.gap_type))];
  const filtered = filter === "All" ? gaps : gaps.filter((g) => g.gap_type === filter);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-slate-500 font-medium">Filter:</span>
        <div className="flex gap-2 flex-wrap">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                filter === t
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
          {filtered.length} gap{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Gap Type", "Transaction ID", "Txn Amount", "Txn Date", "Settlement ID", "Settled Amount", "Settlement Date", "Diff"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((gap, i) => {
                const diff = gap.amount_difference;
                const txnAmt = gap.transaction?.amount;
                const stlAmt = gap.settlement?.settled_amount;
                const isMismatch = diff != null && diff > 0;
                const isCrossMonth = gap.gap_type === "Cross-Month Settlement";

                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge type={gap.gap_type} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {gap.transaction?.transaction_id ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className={`px-4 py-3 font-medium ${isMismatch ? "text-red-600" : "text-slate-700"}`}>
                      {txnAmt != null ? `$${txnAmt.toFixed(2)}` : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {gap.transaction?.timestamp?.slice(0, 10) ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {gap.settlement?.settlement_id ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className={`px-4 py-3 font-medium ${isMismatch ? "text-red-600" : "text-slate-700"}`}>
                      {stlAmt != null ? `$${stlAmt.toFixed(2)}` : <span className="text-slate-300">—</span>}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap font-medium ${isCrossMonth ? "text-amber-600" : "text-slate-600"}`}>
                      {gap.settlement?.settlement_date ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className={`px-4 py-3 font-mono text-xs ${isMismatch ? "text-red-600 font-semibold" : "text-slate-300"}`}>
                      {diff != null ? `$${diff.toFixed(4)}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm">No gaps for this filter.</div>
        )}
      </div>

      {/* Description legend */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1.5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Gap Explanations</p>
        {filtered.slice(0, 5).map((g, i) => (
          <p key={i} className="text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold">{g.transaction?.transaction_id || g.settlement?.settlement_id}:</span>{" "}
            {g.description}
          </p>
        ))}
        {filtered.length > 5 && (
          <p className="text-xs text-slate-400 italic">…and {filtered.length - 5} more</p>
        )}
      </div>
    </div>
  );
}
