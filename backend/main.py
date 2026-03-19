import csv
import io
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from data_generator import generate_data
from reconciler import reconcile
from models import Transaction, Settlement, ReconciliationResult, Summary

app = FastAPI(title="Payments Reconciliation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store
_transactions: list[Transaction] = []
_settlements: list[Settlement] = []


def _require_data():
    if not _transactions:
        raise HTTPException(status_code=400, detail="No data loaded. Call POST /api/generate first.")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.post("/api/generate")
def generate():
    global _transactions, _settlements
    _transactions, _settlements = generate_data()
    return {
        "message": "Data generated successfully.",
        "transactions": len(_transactions),
        "settlements": len(_settlements),
    }


@app.get("/api/transactions", response_model=list[Transaction])
def get_transactions():
    _require_data()
    return _transactions


@app.get("/api/settlements", response_model=list[Settlement])
def get_settlements():
    _require_data()
    return _settlements


@app.get("/api/reconcile", response_model=ReconciliationResult)
def get_reconcile():
    _require_data()
    return reconcile(_transactions, _settlements)


@app.get("/api/summary", response_model=Summary)
def get_summary():
    _require_data()
    result = reconcile(_transactions, _settlements)

    gaps_by_type: dict[str, int] = {}
    for gap in result.gaps:
        gaps_by_type[gap.gap_type] = gaps_by_type.get(gap.gap_type, 0) + 1

    gap_value = sum(
        abs(g.amount_difference) for g in result.gaps if g.amount_difference is not None
    )

    return Summary(
        total_transactions=result.total_transactions,
        total_settlements=result.total_settlements,
        total_matched=result.matched,
        total_gaps=len(result.gaps),
        gap_value=round(gap_value, 2),
        gaps_by_type=gaps_by_type,
    )


@app.get("/api/export/transactions")
def export_transactions():
    _require_data()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["transaction_id", "customer_id", "amount", "timestamp", "type", "status"])
    for t in _transactions:
        writer.writerow([t.transaction_id, t.customer_id, t.amount, t.timestamp.isoformat(), t.type, t.status])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"},
    )


@app.get("/api/export/settlements")
def export_settlements():
    _require_data()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["settlement_id", "transaction_id", "settled_amount", "settlement_date", "batch_id"])
    for s in _settlements:
        writer.writerow([s.settlement_id, s.transaction_id, s.settled_amount, s.settlement_date.isoformat(), s.batch_id])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=settlements.csv"},
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)