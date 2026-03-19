import { useState } from "react";
import {
  generateData, fetchTransactions, fetchSettlements, fetchReconcile, fetchSummary,
} from "./api";
import SummaryBar    from "./components/SummaryBar";
import GapTable      from "./components/GapTable";
import TimelineChart from "./components/TimelineChart";
import RawDataTabs   from "./components/RawDataTabs";
import "./App.css";

const NAV = [
  { key: "gaps",     label: "Gap Analysis",  icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" },
  { key: "timeline", label: "Timeline",      icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" },
  { key: "raw",      label: "Raw Data",      icon: "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75-.125V5.625m0 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75.125V5.625m0 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 9.375v1.5m1.5-3.75C19.496 8.25 19 8.754 19 9.375v1.5m0-5.25v5.25m0 0c0 .621.504 1.125 1.125 1.125h1.5" },
];

export default function App() {
  const [ready, setReady]         = useState(false);   // has data been generated?
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [summary, setSummary]     = useState(null);
  const [reconcile, setReconcile] = useState(null);
  const [transactions, setTxns]   = useState(null);
  const [settlements, setStls]    = useState(null);
  const [active, setActive]       = useState("gaps");

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      await generateData();
      const [sum, rec, txns, stls] = await Promise.all([
        fetchSummary(), fetchReconcile(), fetchTransactions(), fetchSettlements(),
      ]);
      setSummary(sum); setReconcile(rec); setTxns(txns); setStls(stls);
      setReady(true);
    } catch {
      setError("Cannot reach backend. Make sure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans antialiased">

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-900 tracking-tight">Reconcile</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 mb-2">Analysis</p>
          {NAV.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                active === key
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={icon} />
              </svg>
              {label}
            </button>
          ))}
        </nav>

        {/* Period badge */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-lg px-3 py-2.5 text-xs text-slate-500">
            <p className="font-semibold text-slate-700 text-xs mb-0.5">Reporting Period</p>
            <p>January 2025</p>
          </div>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              {NAV.find(n => n.key === active)?.label || "Dashboard"}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Transactions vs. bank settlements — January 2025</p>
          </div>
          <div className="flex items-center gap-2">
            {summary && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span>{summary.total_gaps} gaps detected</span>
              </div>
            )}
            {ready && (
              <>
                <a
                  href="http://localhost:8000/api/export/transactions"
                  download
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Transactions CSV
                </a>
                <a
                  href="http://localhost:8000/api/export/settlements"
                  download
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Settlements CSV
                </a>
              </>
            )}
            <button
              onClick={loadAll}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold bg-slate-900 text-white px-3.5 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? "Generating…" : ready ? "Regenerate" : "Generate Data"}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6">

          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3.5">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Loading spinner */}
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
              <p className="text-sm font-medium text-slate-600">Generating data and running reconciliation…</p>
              <p className="text-xs text-slate-400 max-w-xs">
                This may take a moment — the backend is hosted on a free tier and may need a few seconds to wake up.
              </p>
            </div>
          )}

          {/* Empty state — before first generate */}
          {!loading && !ready && !error && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-1">No data yet</h2>
                <p className="text-sm text-slate-500 max-w-sm">
                  Click <span className="font-semibold text-slate-700">Generate Data</span> to create synthetic transactions and settlements with planted reconciliation gaps.
                </p>
              </div>
              <button
                onClick={loadAll}
                className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Generate Data
              </button>
              <div className="grid grid-cols-2 gap-3 mt-2 max-w-md w-full">
                {[
                  { label: "Cross-Month Settlements", count: "3", color: "bg-amber-100 text-amber-700" },
                  { label: "Rounding Differences",    count: "3", color: "bg-blue-100 text-blue-700" },
                  { label: "Duplicate Settlements",   count: "2", color: "bg-red-100 text-red-700" },
                  { label: "Orphan Refunds",          count: "2", color: "bg-purple-100 text-purple-700" },
                ].map(({ label, count, color }) => (
                  <div key={label} className={`rounded-lg px-3 py-2.5 text-xs font-medium ${color} flex items-center justify-between`}>
                    <span>{label}</span>
                    <span className="font-bold text-sm">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dashboard */}
          {!loading && ready && !error && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <SummaryBar summary={summary} />
              <div className="border-t border-slate-200 pt-6">
                {active === "gaps"     && <GapTable      gaps={reconcile?.gaps} />}
                {active === "timeline" && <TimelineChart reconcile={reconcile} />}
                {active === "raw"      && <RawDataTabs   transactions={transactions} settlements={settlements} />}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
