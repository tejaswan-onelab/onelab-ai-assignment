import random
from datetime import datetime, date, timedelta
from models import Transaction, Settlement

SEED = 42


def generate_data() -> tuple[list[Transaction], list[Settlement]]:
    random.seed(SEED)
    transactions: list[Transaction] = []
    settlements: list[Settlement] = []

    # ── Normal records (TXN-0001 to TXN-0100) ───────────────────────────────
    for i in range(1, 101):
        txn_id = f"TXN-{i:04d}"
        customer_id = f"CUST-{random.randint(1, 20):03d}"
        amount = round(random.uniform(5.0, 500.0), 2)
        txn_day = random.randint(1, 28)
        timestamp = datetime(2025, 1, txn_day, random.randint(0, 23), random.randint(0, 59))
        lag_days = random.randint(1, 2)
        settlement_date = (timestamp + timedelta(days=lag_days)).date()

        transactions.append(Transaction(
            transaction_id=txn_id,
            customer_id=customer_id,
            amount=amount,
            timestamp=timestamp,
            type="payment",
            status="completed",
        ))
        settlements.append(Settlement(
            settlement_id=f"STL-{i:04d}",
            transaction_id=txn_id,
            settled_amount=amount,
            settlement_date=settlement_date,
            batch_id=f"BATCH-{settlement_date}",
        ))

    # ── Gap 1: Cross-month settlements (3 records) ───────────────────────────
    cross_month = [
        ("TXN-0101", "CUST-021", 150.00, datetime(2025, 1, 30, 18, 0), date(2025, 2, 1)),
        ("TXN-0102", "CUST-022", 275.50, datetime(2025, 1, 31, 9, 0),  date(2025, 2, 1)),
        ("TXN-0103", "CUST-023", 89.99,  datetime(2025, 1, 31, 22, 0), date(2025, 2, 2)),
    ]
    for idx, (txn_id, cust, amount, ts, settle_date) in enumerate(cross_month, start=101):
        transactions.append(Transaction(
            transaction_id=txn_id,
            customer_id=cust,
            amount=amount,
            timestamp=ts,
            type="payment",
            status="completed",
        ))
        settlements.append(Settlement(
            settlement_id=f"STL-{idx:04d}",
            transaction_id=txn_id,
            settled_amount=amount,
            settlement_date=settle_date,
            batch_id=f"BATCH-{settle_date}",
        ))

    # ── Gap 2: Rounding differences (3 records) ──────────────────────────────
    rounding = [
        # (txn_id, cust, platform_amount, bank_amount, date)
        ("TXN-0104", "CUST-024", 10.01,    10.00,   datetime(2025, 1, 10, 10, 0), date(2025, 1, 11)),
        ("TXN-0105", "CUST-025", 49.99,    50.00,   datetime(2025, 1, 12, 14, 0), date(2025, 1, 13)),
        ("TXN-0106", "CUST-026", 125.13,   125.12,  datetime(2025, 1, 15, 9, 0),  date(2025, 1, 16)),
    ]
    for idx, (txn_id, cust, plat_amt, bank_amt, ts, settle_date) in enumerate(rounding, start=104):
        transactions.append(Transaction(
            transaction_id=txn_id,
            customer_id=cust,
            amount=plat_amt,
            timestamp=ts,
            type="payment",
            status="completed",
        ))
        settlements.append(Settlement(
            settlement_id=f"STL-{idx:04d}",
            transaction_id=txn_id,
            settled_amount=bank_amt,
            settlement_date=settle_date,
            batch_id=f"BATCH-{settle_date}",
        ))

    # ── Gap 3: Duplicate settlements (2 transactions, 2 settlements each) ────
    duplicates = [
        ("TXN-0107", "CUST-027", 200.00, datetime(2025, 1, 8, 11, 0),  date(2025, 1, 9)),
        ("TXN-0108", "CUST-028", 350.00, datetime(2025, 1, 20, 16, 0), date(2025, 1, 21)),
    ]
    dup_stl_idx = 107
    for txn_id, cust, amount, ts, settle_date in duplicates:
        transactions.append(Transaction(
            transaction_id=txn_id,
            customer_id=cust,
            amount=amount,
            timestamp=ts,
            type="payment",
            status="completed",
        ))
        # Two settlements for the same transaction
        settlements.append(Settlement(
            settlement_id=f"STL-{dup_stl_idx:04d}-A",
            transaction_id=txn_id,
            settled_amount=amount,
            settlement_date=settle_date,
            batch_id=f"BATCH-{settle_date}",
        ))
        settlements.append(Settlement(
            settlement_id=f"STL-{dup_stl_idx:04d}-B",
            transaction_id=txn_id,
            settled_amount=amount,
            settlement_date=settle_date,
            batch_id=f"BATCH-{settle_date}-2",
        ))
        dup_stl_idx += 1

    # ── Gap 4: Orphan refunds (settlements with no matching transaction) ──────
    orphans = [
        ("STL-REF-001", "REF-9901", -75.00,  date(2025, 1, 18)),
        ("STL-REF-002", "REF-9902", -120.00, date(2025, 1, 25)),
    ]
    for stl_id, ref_txn_id, amount, settle_date in orphans:
        settlements.append(Settlement(
            settlement_id=stl_id,
            transaction_id=ref_txn_id,
            settled_amount=amount,
            settlement_date=settle_date,
            batch_id=f"BATCH-{settle_date}",
        ))

    return transactions, settlements
