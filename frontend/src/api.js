const BASE = "http://localhost:8000";

export async function generateData() {
  const res = await fetch(`${BASE}/api/generate`, { method: "POST" });
  return res.json();
}

export async function fetchTransactions() {
  const res = await fetch(`${BASE}/api/transactions`);
  return res.json();
}

export async function fetchSettlements() {
  const res = await fetch(`${BASE}/api/settlements`);
  return res.json();
}

export async function fetchReconcile() {
  const res = await fetch(`${BASE}/api/reconcile`);
  return res.json();
}

export async function fetchSummary() {
  const res = await fetch(`${BASE}/api/summary`);
  return res.json();
}

export function downloadCSV(type) {
  window.open(`${BASE}/api/export/${type}`, "_blank");
}
