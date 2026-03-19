# Tasks — Payments Reconciliation Dashboard

## Backend

- [x] **1. Models** — Create Pydantic schemas in `backend/models.py` (Transaction, Settlement, Gap, ReconciliationResult, Summary)
- [x] **2. Data Generator** — Create `backend/data_generator.py` with:
  - [x] 2a. Generate ~100 normal transactions (Jan 1–28, 2025) with matching settlements
  - [x] 2b. Plant 3 cross-month settlements (Jan 30/31 → Feb 1/2)
  - [x] 2c. Plant 3 rounding differences ($0.01 and $0.005 diffs)
  - [x] 2d. Plant 2 duplicate settlements (same txn_id, two settlement entries)
  - [x] 2e. Plant 2 orphan refunds (REF- IDs with no matching transaction)
  - [x] 2f. Fixed seed (42) for reproducibility
- [x] **3. Reconciler** — Create `backend/reconciler.py` with:
  - [x] 3a. Match transactions to settlements by transaction_id
  - [x] 3b. Detect unmatched transactions (no settlement)
  - [x] 3c. Detect cross-month settlements (txn month ≠ settlement month)
  - [x] 3d. Detect amount mismatches (rounding diffs)
  - [x] 3e. Detect duplicate settlements (multiple settlements per txn)
  - [x] 3f. Detect orphan refunds/settlements (no matching transaction)
  - [x] 3g. Return categorized gaps with both sides of data
- [x] **4. FastAPI App** — Create `backend/main.py` with:
  - [x] 4a. CORS middleware
  - [x] 4b. `POST /api/generate` — generate & store data in memory
  - [x] 4c. `GET /api/transactions` — return all transactions
  - [x] 4d. `GET /api/settlements` — return all settlements
  - [x] 4e. `GET /api/reconcile` — run reconciliation, return gaps
  - [x] 4f. `GET /api/summary` — aggregate stats
  - [x] 4g. `GET /api/export/transactions` — download CSV
  - [x] 4h. `GET /api/export/settlements` — download CSV
- [x] **5. Requirements** — Create `backend/requirements.txt`

## Frontend

- [x] **6. Scaffold** — Create React app with Vite (`frontend/`)
- [x] **7. API Service** — Create `frontend/src/api.js` to call backend endpoints
- [x] **8. SummaryBar** — Stat cards: total transactions, matched, total gaps, gap value, gaps by type
- [x] **9. GapTable** — Filterable table of gaps with transaction + settlement side-by-side, diff highlighted
- [x] **10. TimelineChart** — Recharts scatter/bar showing txn date vs settlement date
- [x] **11. RawDataTabs** — Tabbed view of raw transactions & settlements tables
- [x] **12. Download Buttons** — CSV download for transactions and settlements
- [x] **13. App Layout** — Wire all components into `App.jsx`, data fetching on mount

## Tests

- [ ] **14. Test Data Generator** — `backend/tests/test_data_generator.py`
  - [ ] 14a. Verify correct number of records generated
  - [ ] 14b. Verify all 4 gap types are present in raw data
- [ ] **15. Test Reconciler** — `backend/tests/test_reconciler.py`
  - [ ] 15a. Verify all 4 gap types are detected
  - [ ] 15b. Verify no false positives on clean data
  - [ ] 15c. Verify summary math (gap counts + amounts)
- [ ] **16. Test API** — `backend/tests/test_api.py`
  - [ ] 16a. Endpoint response codes
  - [ ] 16b. CSV export format validation

## Polish & Deploy

- [x] **17. Dockerize** — Dockerfile for backend + frontend, docker-compose.yml
- [x] **18. Deploy** — Deploy to cloud (Render/Railway + Vercel or single service)
- [ ] **19. Demo Video** — Record walkthrough
- [ ] **20. Production Caveats** — Write 3-sentence summary of what would fail in prod
