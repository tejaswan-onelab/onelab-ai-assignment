import { useEffect, useState } from "react";
import {
  generateData,
  fetchTransactions,
  fetchSettlements,
  fetchReconcile,
  fetchSummary,
} from "./api";
import SummaryBar from "./components/SummaryBar";
import GapTable from "./components/GapTable";
import TimelineChart from "./components/TimelineChart";
import RawDataTabs from "./components/RawDataTabs";
import "./App.css";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [reconcile, setReconcile] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [settlements, setSettlements] = useState(null);
  const [activeSection, setActiveSection] = useState("gaps");

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      await generateData();
      const [sum, rec, txns, stls] = await Promise.all([
        fetchSummary(),
        fetchReconcile(),
        fetchTransactions(),
        fetchSettlements(),
      ]);
      setSummary(sum);
      setReconcile(rec);
      setTransactions(txns);
      setSettlements(stls);
    } catch (e) {
      setError("Could not connect to backend. Make sure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Payments Reconciliation Dashboard</h1>
          <p className="header-sub">
            January 2025 — surfacing gaps between platform transactions and bank settlements
          </p>
        </div>
        <button className="refresh-btn" onClick={loadAll} disabled={loading}>
          {loading ? "Loading…" : "↺ Regenerate Data"}
        </button>
      </header>

      {error && <div className="error-banner">{error}</div>}
      {loading && <div className="loading">Loading reconciliation data…</div>}

      {!loading && !error && (
        <>
          <section className="section">
            <h2 className="section-title">Summary</h2>
            <SummaryBar summary={summary} />
          </section>

          <nav className="section-nav">
            {[
              { key: "gaps", label: "Gap Analysis" },
              { key: "timeline", label: "Timeline" },
              { key: "raw", label: "Raw Data" },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`nav-btn ${activeSection === key ? "active" : ""}`}
                onClick={() => setActiveSection(key)}
              >
                {label}
              </button>
            ))}
          </nav>

          {activeSection === "gaps" && (
            <section className="section">
              <h2 className="section-title">Gap Analysis</h2>
              <GapTable gaps={reconcile?.gaps} />
            </section>
          )}

          {activeSection === "timeline" && (
            <section className="section">
              <h2 className="section-title">Settlement Timeline</h2>
              <TimelineChart reconcile={reconcile} />
            </section>
          )}

          {activeSection === "raw" && (
            <section className="section">
              <h2 className="section-title">Raw Data</h2>
              <RawDataTabs transactions={transactions} settlements={settlements} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
