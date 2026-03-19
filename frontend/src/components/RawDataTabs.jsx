import { useState } from "react";
import { downloadCSV } from "../api";

export default function RawDataTabs({ transactions, settlements }) {
  const [tab, setTab] = useState("transactions");

  return (
    <div>
      <div className="tab-bar">
        <button
          className={`tab-btn ${tab === "transactions" ? "active" : ""}`}
          onClick={() => setTab("transactions")}
        >
          Transactions ({transactions?.length ?? 0})
        </button>
        <button
          className={`tab-btn ${tab === "settlements" ? "active" : ""}`}
          onClick={() => setTab("settlements")}
        >
          Settlements ({settlements?.length ?? 0})
        </button>
        <button
          className="download-btn"
          onClick={() => downloadCSV(tab)}
        >
          ↓ Download CSV
        </button>
      </div>

      <div className="table-wrapper">
        {tab === "transactions" && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Customer ID</th>
                <th>Amount</th>
                <th>Timestamp</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(transactions ?? []).map((t) => (
                <tr key={t.transaction_id}>
                  <td>{t.transaction_id}</td>
                  <td>{t.customer_id}</td>
                  <td>${t.amount.toFixed(2)}</td>
                  <td>{t.timestamp.slice(0, 19).replace("T", " ")}</td>
                  <td>{t.type}</td>
                  <td>{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "settlements" && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Settlement ID</th>
                <th>Transaction ID</th>
                <th>Settled Amount</th>
                <th>Settlement Date</th>
                <th>Batch ID</th>
              </tr>
            </thead>
            <tbody>
              {(settlements ?? []).map((s) => (
                <tr key={s.settlement_id}>
                  <td>{s.settlement_id}</td>
                  <td>{s.transaction_id}</td>
                  <td>${s.settled_amount.toFixed(2)}</td>
                  <td>{s.settlement_date}</td>
                  <td>{s.batch_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
