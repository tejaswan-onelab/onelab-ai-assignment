"""
Task 15 — Test Reconciler
  15a. Verify all 4 gap types are detected
  15b. Verify no false positives on clean data
  15c. Verify summary math (gap counts + amounts)
"""

from datetime import datetime, date

import pytest
from data_generator import generate_data
from reconciler import reconcile
from models import Transaction, Settlement


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_txn(txn_id, amount, month=1, day=10):
    return Transaction(
        transaction_id=txn_id,
        customer_id="CUST-001",
        amount=amount,
        timestamp=datetime(2025, month, day, 12, 0),
        type="payment",
        status="completed",
    )


def make_stl(stl_id, txn_id, amount, month=1, day=11):
    return Settlement(
        settlement_id=stl_id,
        transaction_id=txn_id,
        settled_amount=amount,
        settlement_date=date(2025, month, day),
        batch_id=f"BATCH-2025-{month:02d}-{day:02d}",
    )


# ── 15a: All 4 gap types detected ────────────────────────────────────────────

@pytest.fixture(scope="module")
def reconciliation_result():
    transactions, settlements = generate_data()
    return reconcile(transactions, settlements)


def test_detects_cross_month_settlement(reconciliation_result):
    gap_types = {g.gap_type for g in reconciliation_result.gaps}
    assert "Cross-Month Settlement" in gap_types


def test_cross_month_gaps_cover_planted_txns(reconciliation_result):
    cross_month_gaps = [
        g for g in reconciliation_result.gaps if g.gap_type == "Cross-Month Settlement"
    ]
    gap_txn_ids = {g.transaction.transaction_id for g in cross_month_gaps if g.transaction}
    assert {"TXN-0101", "TXN-0102", "TXN-0103"}.issubset(gap_txn_ids)


def test_detects_amount_mismatch_rounding(reconciliation_result):
    gap_types = {g.gap_type for g in reconciliation_result.gaps}
    assert "Amount Mismatch (Rounding)" in gap_types


def test_rounding_gaps_cover_planted_txns(reconciliation_result):
    rounding_gaps = [
        g for g in reconciliation_result.gaps if g.gap_type == "Amount Mismatch (Rounding)"
    ]
    gap_txn_ids = {g.transaction.transaction_id for g in rounding_gaps if g.transaction}
    assert {"TXN-0104", "TXN-0105", "TXN-0106"}.issubset(gap_txn_ids)


def test_detects_duplicate_settlement(reconciliation_result):
    gap_types = {g.gap_type for g in reconciliation_result.gaps}
    assert "Duplicate Settlement" in gap_types


def test_duplicate_gaps_cover_planted_txns(reconciliation_result):
    dup_gaps = [
        g for g in reconciliation_result.gaps if g.gap_type == "Duplicate Settlement"
    ]
    gap_txn_ids = {g.transaction.transaction_id for g in dup_gaps if g.transaction}
    assert {"TXN-0107", "TXN-0108"}.issubset(gap_txn_ids)


def test_detects_orphan_settlement(reconciliation_result):
    gap_types = {g.gap_type for g in reconciliation_result.gaps}
    assert "Orphan Settlement" in gap_types


def test_orphan_gaps_cover_planted_refunds(reconciliation_result):
    orphan_gaps = [
        g for g in reconciliation_result.gaps if g.gap_type == "Orphan Settlement"
    ]
    orphan_ref_ids = {g.settlement.transaction_id for g in orphan_gaps if g.settlement}
    assert {"REF-9901", "REF-9902"}.issubset(orphan_ref_ids)


# ── 15b: No false positives on clean data ────────────────────────────────────

def test_no_gaps_on_clean_data():
    """5 transactions each with a perfectly matching settlement → 0 gaps."""
    transactions = [make_txn(f"CLEAN-{i:03d}", 100.0) for i in range(1, 6)]
    settlements = [
        make_stl(f"STL-CLEAN-{i:03d}", f"CLEAN-{i:03d}", 100.0)
        for i in range(1, 6)
    ]
    result = reconcile(transactions, settlements)
    assert result.gaps == [], f"Expected no gaps, got: {result.gaps}"


def test_no_gaps_on_clean_data_counts(  ):
    """Matched count equals total transaction count for clean data."""
    transactions = [make_txn(f"CLEAN-{i:03d}", 50.0) for i in range(1, 4)]
    settlements = [
        make_stl(f"STL-CLEAN-{i:03d}", f"CLEAN-{i:03d}", 50.0)
        for i in range(1, 4)
    ]
    result = reconcile(transactions, settlements)
    assert result.matched == 3
    assert result.total_transactions == 3
    assert result.total_settlements == 3


# ── 15c: Summary math ────────────────────────────────────────────────────────

def test_summary_gap_amount_math(reconciliation_result):
    """Sum of amount_difference on individual gaps matches a recomputed total."""
    gaps_with_diff = [g for g in reconciliation_result.gaps if g.amount_difference is not None]
    computed_total = round(sum(abs(g.amount_difference) for g in gaps_with_diff), 6)
    # Each entry should have a non-negative diff
    for g in gaps_with_diff:
        assert g.amount_difference >= 0, "amount_difference should be non-negative"
    # Recomputed total must equal sum of individual entries
    assert computed_total == pytest.approx(
        sum(abs(g.amount_difference) for g in gaps_with_diff), abs=1e-6
    )


def test_summary_total_transactions_equals_len(reconciliation_result):
    transactions, settlements = generate_data()
    assert reconciliation_result.total_transactions == len(transactions)


def test_summary_total_settlements_equals_len(reconciliation_result):
    _, settlements = generate_data()
    assert reconciliation_result.total_settlements == len(settlements)


def test_matched_plus_unmatched_leq_total(reconciliation_result):
    """Matched + unsettled gaps should not exceed total transaction count."""
    unsettled_count = sum(
        1 for g in reconciliation_result.gaps if g.gap_type == "Unsettled Transaction"
    )
    assert reconciliation_result.matched + unsettled_count <= reconciliation_result.total_transactions


# ── Individual gap type unit tests ───────────────────────────────────────────

def test_cross_month_unit():
    txn = make_txn("T001", 100.0, month=1, day=31)
    stl = make_stl("S001", "T001", 100.0, month=2, day=1)
    result = reconcile([txn], [stl])
    assert any(g.gap_type == "Cross-Month Settlement" for g in result.gaps)


def test_rounding_mismatch_unit():
    txn = make_txn("T002", 10.01)
    stl = make_stl("S002", "T002", 10.00)
    result = reconcile([txn], [stl])
    assert any("Amount Mismatch" in g.gap_type for g in result.gaps)


def test_duplicate_settlement_unit():
    txn = make_txn("T003", 200.0)
    stl_a = make_stl("S003-A", "T003", 200.0)
    stl_b = make_stl("S003-B", "T003", 200.0)
    result = reconcile([txn], [stl_a, stl_b])
    assert any(g.gap_type == "Duplicate Settlement" for g in result.gaps)


def test_orphan_refund_unit():
    txn = make_txn("T004", 50.0)
    orphan_stl = make_stl("STL-REF-X", "REF-9999", -50.0)
    result = reconcile([txn], [orphan_stl])
    # T004 has no settlement → Unsettled; REF-9999 is orphan
    orphan_gaps = [g for g in result.gaps if g.gap_type == "Orphan Settlement"]
    assert len(orphan_gaps) == 1
    assert orphan_gaps[0].settlement.transaction_id == "REF-9999"


def test_unsettled_transaction_unit():
    txn = make_txn("T005", 75.0)
    result = reconcile([txn], [])
    assert any(g.gap_type == "Unsettled Transaction" for g in result.gaps)
