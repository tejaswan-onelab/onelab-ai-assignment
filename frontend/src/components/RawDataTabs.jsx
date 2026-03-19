import { useState } from "react";
import { downloadCSV } from "../api";

export default function RawDataTabs({ transactions, settlements }) {
  const [tab, setTab] = useState("transactions");
  const data = tab === "transactions" ? transactions : settlements;

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-0">
        {[
          { key: "transactions", label: `Transactions (${transactions?.length ?? 0})` },
          { key: "settlements",  label: `Settlements (${settlements?.length ?? 0})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}

        <button
          onClick={() => downloadCSV(tab)}
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download CSV
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
              <tr>
                {tab === "transactions"
                  ? ["Transaction ID", "Customer ID", "Amount", "Timestamp", "Type", "Status"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))
                  : ["Settlement ID", "Transaction ID", "Settled Amount", "Settlement Date", "Batch ID"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))
                }
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tab === "transactions"
                ? (transactions ?? []).map((t) => (
                    <tr key={t.transaction_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{t.transaction_id}</td>
                      <td className="px-4 py-3 text-slate-600">{t.customer_id}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">${t.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{t.timestamp.slice(0, 19).replace("T", " ")}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          t.type === "payment" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        }`}>{t.type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">{t.status}</span>
                      </td>
                    </tr>
                  ))
                : (settlements ?? []).map((s) => (
                    <tr key={s.settlement_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{s.settlement_id}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.transaction_id}</td>
                      <td className={`px-4 py-3 font-medium ${s.settled_amount < 0 ? "text-red-600" : "text-slate-800"}`}>
                        ${s.settled_amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{s.settlement_date}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.batch_id}</td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
