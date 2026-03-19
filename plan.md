# Payments Reconciliation Dashboard — Implementation Plan

## Context

A payments company's books don't balance at month-end. We need to build a tool that ingests platform transactions and bank settlements, reconciles them, and surfaces gaps with explanations. This is for an AI fitness assessment — we generate our own test data with 4 specific gap types planted.

**Stack:** React (frontend) + FastAPI (backend), no database — all in-memory.

---

## Assumptions

- All amounts are in USD (single currency)
- Transaction IDs are strings; refunds use `ref_` prefix
- Settlement happens 1–2 days after transaction
- Month-end reconciliation window is January 2025
- No authentication needed
- Data is generated fresh per session (no persistence)
- Rounding issues stem from floating-point representation (e.g., $10.005 rounding differently in each system)

---

## Data Model

**Transactions** (platform records):

```
transaction_id: str, customer_id: str, amount: float, timestamp: datetime, type: "payment"|"refund", status: str
```

**Settlements** (bank records):

```
settlement_id: str, transaction_id: str, settled_amount: float, settlement_date: date, batch_id: str
```

---

## 4 Planted Gap Types

| #   | Gap Type              | How Planted                                                         | How Detected                                        |
| --- | --------------------- | ------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | Next-month settlement | Transaction on Jan 30/31, settlement on Feb 1/2                     | Transaction month != settlement month               |
| 2   | Rounding difference   | Amount $10.005 → platform records $10.01, bank records $10.00       | Matched by ID but amounts differ by < $0.02         |
| 3   | Duplicate settlement  | Same transaction_id appears twice in settlements                    | Group settlements by transaction_id, flag count > 1 |
| 4   | Orphan refund         | Refund entry in settlements with `ref_` ID, no matching transaction | Settlement transaction_id not found in transactions |

---

## Backend — FastAPI

**Files:**

- `backend/main.py` — FastAPI app, CORS, endpoint wiring
- `backend/data_generator.py` — synthetic data with planted gaps
- `backend/reconciler.py` — matching/gap detection logic
- `backend/models.py` — Pydantic models

**Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/generate` | Generate fresh dataset, store in memory, return summary |
| GET | `/api/transactions` | Return all generated transactions |
| GET | `/api/settlements` | Return all generated settlements |
| GET | `/api/reconcile` | Run reconciliation, return categorized gaps |
| GET | `/api/summary` | Aggregate stats: matched count, gap count by type, total gap $ |

**Reconciliation logic (`reconciler.py`):**

1. Build lookup: `transaction_id → transaction`
2. Build lookup: `transaction_id → [settlements]`
3. For each transaction: find matching settlement(s)
   - No match → "Unsettled Transaction"
   - Match but different month → "Cross-Month Settlement"
   - Match but amount differs → "Amount Mismatch" (rounding)
   - Multiple settlements for same txn → "Duplicate Settlement"
4. For each settlement: check if transaction_id exists
   - Not found → "Orphan" (covers orphan refunds)
5. Return all gaps categorized with both sides of data

**Data generation (`data_generator.py`):**

- Generate ~100 normal transactions in Jan 2025 with matching settlements
- Plant 2-3 instances of each gap type
- Use `random` with a seed for reproducibility

---

## Test Data Specification

### Overview
- **Volume:** ~100 normal transactions + planted gap records (~110 total)
- **Period:** January 1–31, 2025
- **Seed:** Fixed random seed (42) for reproducibility
- **Export:** Served via API + downloadable as CSV from the UI

### Normal Records (~100)
- Transaction IDs: `TXN-0001` to `TXN-0100`
- Customer IDs: `CUST-001` to `CUST-020` (randomly assigned)
- Amounts: Random between $5.00 and $500.00, rounded to 2 decimals
- Timestamps: Random datetime within Jan 1–28, 2025
- Type: all `"payment"`, status: `"completed"`
- Each has exactly 1 matching settlement with:
  - Same amount (no rounding issues)
  - Settlement date = transaction date + 1 or 2 days
  - Settlement ID: `STL-XXXX`, Batch ID: `BATCH-YYYY-MM-DD`

### Planted Gap 1: Cross-Month Settlements (3 records)
| Transaction ID | Txn Date | Amount | Settlement Date | Notes |
|---|---|---|---|---|
| `TXN-0101` | Jan 30, 2025 | $150.00 | Feb 1, 2025 | 2-day lag crosses month |
| `TXN-0102` | Jan 31, 2025 | $275.50 | Feb 1, 2025 | Last day of month |
| `TXN-0103` | Jan 31, 2025 | $89.99 | Feb 2, 2025 | Weekend delay |

### Planted Gap 2: Rounding Differences (3 records)
| Transaction ID | Platform Amount | Bank Settled Amount | Diff | Notes |
|---|---|---|---|---|
| `TXN-0104` | $10.01 | $10.00 | $0.01 | Half-cent rounds up in platform, down in bank |
| `TXN-0105` | $49.99 | $50.00 | $0.01 | Opposite direction rounding |
| `TXN-0106` | $125.125 | $125.12 | $0.005 | Sub-cent precision diff, visible when summed with others |

### Planted Gap 3: Duplicate Settlements (2 records)
| Transaction ID | Settlements | Notes |
|---|---|---|
| `TXN-0107` | `STL-0107-A` ($200.00) + `STL-0107-B` ($200.00) | Exact duplicate |
| `TXN-0108` | `STL-0108-A` ($350.00) + `STL-0108-B` ($350.00) | Exact duplicate, different batch |

### Planted Gap 4: Orphan Refunds (2 records)
| Settlement ID | Transaction ID | Amount | Notes |
|---|---|---|---|
| `STL-REF-001` | `REF-9901` | -$75.00 | Refund with no matching original transaction |
| `STL-REF-002` | `REF-9902` | -$120.00 | Refund with no matching original transaction |

### CSV Export Format

**transactions.csv:**
```
transaction_id,customer_id,amount,timestamp,type,status
TXN-0001,CUST-003,45.99,2025-01-05T14:32:00,payment,completed
...
```

**settlements.csv:**
```
settlement_id,transaction_id,settled_amount,settlement_date,batch_id
STL-0001,TXN-0001,45.99,2025-01-06,BATCH-2025-01-06
...
```

### Download Endpoint
- `GET /api/export/transactions` — returns transactions.csv
- `GET /api/export/settlements` — returns settlements.csv
- Frontend has a "Download CSV" button for each dataset

---

## Frontend — React

**Files:**

- `frontend/src/App.jsx` — layout, data fetching, state
- `frontend/src/components/SummaryBar.jsx` — stat cards (total txns, matched, gaps by type, gap $)
- `frontend/src/components/GapTable.jsx` — filterable table of gaps with both sides shown
- `frontend/src/components/TimelineChart.jsx` — scatter/bar chart: txn date vs settlement date
- `frontend/src/components/RawDataTabs.jsx` — tabbed view of raw transactions & settlements

**UI library:** Use a lightweight CSS approach (plain CSS or Tailwind via CDN). Use Recharts for the timeline chart.

**Flow:**

1. App mounts → calls `/api/generate` to create data
2. Then calls `/api/reconcile` and `/api/summary`
3. Renders summary bar, gap table (default view), timeline, raw data tabs
4. Gap table has filter dropdown by gap type
5. Amount mismatches highlight the diff

---

## Build Order

### Step 1: Backend data generation

- `backend/models.py` — Pydantic schemas
- `backend/data_generator.py` — generate transactions + settlements with all 4 gaps
- Write standalone test to verify gaps are present in generated data

### Step 2: Backend reconciliation

- `backend/reconciler.py` — implement matching logic
- Write test to verify all 4 gap types are detected correctly

### Step 3: FastAPI wiring

- `backend/main.py` — endpoints + CORS
- `requirements.txt`
- Manual test with curl/httpie

### Step 4: React frontend

- Scaffold with Vite (`npm create vite@latest frontend -- --template react`)
- Build components: SummaryBar → GapTable → TimelineChart → RawDataTabs
- Connect to backend API

### Step 5: Tests

- `backend/tests/test_data_generator.py` — verify gap planting
- `backend/tests/test_reconciler.py` — verify detection of each gap type
- `backend/tests/test_api.py` — endpoint integration tests

### Step 6: Polish & deploy

- Docker Compose or simple deploy (Render/Railway for backend, Vercel for frontend)
- Record demo video
- Write the 3-sentence production caveat

---

## Test Cases

1. **All 4 gaps detected:** Generate data → reconcile → assert each gap type appears
2. **No false positives on clean data:** Generate data with no gaps → reconcile → assert 0 gaps
3. **Rounding detection:** Create txn $10.005 with settlement $10.00 → flagged as mismatch
4. **Cross-month:** Jan 31 txn with Feb 1 settlement → flagged
5. **Duplicate:** Two settlements for same txn_id → flagged
6. **Orphan refund:** Settlement with `ref_xxx` ID, no matching txn → flagged
7. **Summary math:** Sum of gap amounts matches individual gap entries

---

## Verification

1. Start backend: `cd backend && uvicorn main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Open browser → dashboard loads with data
4. Verify summary shows correct counts
5. Filter gap table by each type — confirm entries match planted gaps
6. Check timeline chart shows the cross-month settlement visually
7. Run `pytest backend/tests/` — all pass

---

## Production Caveats (3 sentences)

This reconciliation assumes single-currency transactions and deterministic transaction IDs — in production, multi-currency conversions introduce FX-rate discrepancies that simple rounding checks would miss. Timezone differences between platform servers and bank batch processing could shift transactions across month boundaries differently depending on UTC offset interpretation. The duplicate detection relies on exact transaction_id matching, which breaks when multiple payment processors generate IDs independently or when partial settlements split a single transaction across multiple bank entries.
