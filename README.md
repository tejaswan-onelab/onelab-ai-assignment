# Payments Reconciliation Dashboard

A full-stack tool that generates synthetic payment data, runs month-end reconciliation, and surfaces gaps between platform transactions and bank settlements.

Built for the **Onelab AI Fitness Assessment**.

---

## What It Does

A payments company's books don't balance at month-end. This dashboard:

1. Generates ~108 synthetic transactions and ~112 settlements for January 2025
2. Runs reconciliation logic to match transactions against bank settlements
3. Detects and categorises 4 types of gaps — cross-month settlements, rounding differences, duplicates, and orphan refunds
4. Displays results in a SaaS-style dashboard with filtering, a timeline chart, and CSV export

---

## Stack

| Layer    | Tech                          |
|----------|-------------------------------|
| Frontend | React 19 + Vite + Tailwind CSS |
| Charts   | Recharts                      |
| Backend  | FastAPI + Pydantic            |
| Data     | In-memory (generated on demand) |

---

## Project Structure

```
assignment/
├── backend/
│   ├── main.py            # FastAPI app + all endpoints
│   ├── models.py          # Pydantic schemas
│   ├── data_generator.py  # Synthetic data with 4 planted gap types
│   ├── reconciler.py      # Matching and gap detection logic
│   ├── requirements.txt
│   └── tests/
│       └── __init__.py
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       └── components/
│           ├── SummaryBar.jsx
│           ├── GapTable.jsx
│           ├── TimelineChart.jsx
│           └── RawDataTabs.jsx
├── plan.md
├── tasks.md
└── README.md
```

---

## Running Locally

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API will be available at `http://localhost:8000`.
Interactive docs at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App will be available at `http://localhost:5173`.

---

## How to Use

1. Open the dashboard at `http://localhost:5173`
2. Click **Generate Data** — this calls `POST /api/generate` and runs reconciliation
3. View the **Summary** metrics at the top
4. Navigate between:
   - **Gap Analysis** — filterable table of all detected gaps
   - **Timeline** — scatter chart of transaction date vs settlement date
   - **Raw Data** — paginated tables of transactions and settlements
5. Download CSVs via the **Transactions CSV** / **Settlements CSV** buttons in the top bar

---

## API Endpoints

| Method | Path                        | Description                          |
|--------|-----------------------------|--------------------------------------|
| POST   | `/api/generate`             | Generate data and store in memory    |
| GET    | `/api/transactions`         | All transactions                     |
| GET    | `/api/settlements`          | All settlements                      |
| GET    | `/api/reconcile`            | Reconciliation results with all gaps |
| GET    | `/api/summary`              | Aggregate stats                      |
| GET    | `/api/export/transactions`  | Download transactions as CSV         |
| GET    | `/api/export/settlements`   | Download settlements as CSV          |

---

## Planted Gap Types

| Gap Type | Count | How Planted | How Detected |
|---|---|---|---|
| Cross-Month Settlement | 3 | Jan 30/31 transactions settled Feb 1/2 | Transaction month ≠ settlement month |
| Amount Mismatch (Rounding) | 3 | Platform records $10.01, bank records $10.00 | Amounts differ after matching by ID |
| Duplicate Settlement | 4 entries (2 txns × 2) | Same transaction settled twice in different batches | Multiple settlements per transaction ID |
| Orphan Settlement | 2 | Refund settlements with no matching transaction | Settlement transaction ID not found in transactions |

---

## Assumptions

- All amounts are USD (single currency)
- Reconciliation window is January 2025
- Transaction IDs are unique strings; orphan refunds use a `REF-` prefix
- Settlement lag is 1–2 days after transaction
- Data is generated fresh per session (no persistence)
- Rounding differences stem from floating-point representation across systems
- Random seed is fixed at `42` for reproducibility

---

## What It Would Get Wrong in Production

This reconciliation assumes single-currency transactions and deterministic transaction IDs — in production, multi-currency conversions introduce FX-rate discrepancies that simple rounding checks would miss. Timezone differences between platform servers and bank batch processing could silently shift transactions across month boundaries depending on UTC offset interpretation. The duplicate detection relies on exact transaction ID matching, which breaks when multiple payment processors generate IDs independently or when a single transaction is partially settled across multiple bank entries.
