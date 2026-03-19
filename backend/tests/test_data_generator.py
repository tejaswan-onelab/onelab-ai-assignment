"""
Task 14 — Test Data Generator
  14a. Verify correct number of records generated
  14b. Verify all 4 gap types are present in raw data
"""

from datetime import date
from collections import defaultdict

import pytest
from data_generator import generate_data


@pytest.fixture(scope="module")
def generated():
    transactions, settlements = generate_data()
    return transactions, settlements


# ── 14a: Record counts ────────────────────────────────────────────────────────

def test_transaction_count(generated):
    transactions, _ = generated
    # 100 normal + 3 cross-month + 3 rounding + 2 duplicate = 108
    assert len(transactions) == 108


def test_settlement_count(generated):
    _, settlements = generated
    # 100 normal + 3 cross-month + 3 rounding + 4 duplicate (2 txns × 2) + 2 orphans = 112
    assert len(settlements) == 112


def test_transaction_ids_are_unique(generated):
    transactions, _ = generated
    ids = [t.transaction_id for t in transactions]
    assert len(ids) == len(set(ids))


# ── 14b: All 4 gap types present in raw data ─────────────────────────────────

def test_gap1_cross_month_settlements_present(generated):
    """Gap 1: TXN-0101/0102/0103 transact in Jan, settle in Feb."""
    transactions, settlements = generated
    cross_month_txn_ids = {"TXN-0101", "TXN-0102", "TXN-0103"}

    txn_months = {
        t.transaction_id: t.timestamp.month
        for t in transactions
        if t.transaction_id in cross_month_txn_ids
    }
    stl_months = {
        s.transaction_id: s.settlement_date.month
        for s in settlements
        if s.transaction_id in cross_month_txn_ids
    }

    assert txn_months.keys() == cross_month_txn_ids, "Missing cross-month transactions"
    assert stl_months.keys() == cross_month_txn_ids, "Missing cross-month settlements"
    for txn_id in cross_month_txn_ids:
        assert txn_months[txn_id] != stl_months[txn_id], (
            f"{txn_id}: expected different months, got same"
        )


def test_gap2_rounding_differences_present(generated):
    """Gap 2: TXN-0104/0105/0106 have different platform vs bank amounts."""
    transactions, settlements = generated
    rounding_txn_ids = {"TXN-0104", "TXN-0105", "TXN-0106"}

    txn_amounts = {
        t.transaction_id: t.amount
        for t in transactions
        if t.transaction_id in rounding_txn_ids
    }
    stl_amounts = {
        s.transaction_id: s.settled_amount
        for s in settlements
        if s.transaction_id in rounding_txn_ids
    }

    assert txn_amounts.keys() == rounding_txn_ids
    assert stl_amounts.keys() == rounding_txn_ids
    for txn_id in rounding_txn_ids:
        assert txn_amounts[txn_id] != stl_amounts[txn_id], (
            f"{txn_id}: expected amount mismatch but amounts are equal"
        )


def test_gap3_duplicate_settlements_present(generated):
    """Gap 3: TXN-0107/0108 each have exactly 2 settlements."""
    _, settlements = generated
    duplicate_txn_ids = {"TXN-0107", "TXN-0108"}

    stl_count: dict[str, int] = defaultdict(int)
    for s in settlements:
        if s.transaction_id in duplicate_txn_ids:
            stl_count[s.transaction_id] += 1

    for txn_id in duplicate_txn_ids:
        assert stl_count[txn_id] == 2, (
            f"{txn_id}: expected 2 settlements, got {stl_count[txn_id]}"
        )


def test_gap4_orphan_refunds_present(generated):
    """Gap 4: REF-9901/REF-9902 appear in settlements but not in transactions."""
    transactions, settlements = generated
    orphan_ref_ids = {"REF-9901", "REF-9902"}

    txn_ids = {t.transaction_id for t in transactions}
    stl_ref_txn_ids = {s.transaction_id for s in settlements if s.transaction_id in orphan_ref_ids}

    # Must appear in settlements
    assert stl_ref_txn_ids == orphan_ref_ids, "Orphan refund settlement entries missing"
    # Must NOT appear in transactions
    assert orphan_ref_ids.isdisjoint(txn_ids), "Orphan ref IDs should not be in transactions"


def test_orphan_amounts_are_negative(generated):
    """Orphan refund settlements have negative amounts."""
    _, settlements = generated
    orphan_stls = [s for s in settlements if s.transaction_id in {"REF-9901", "REF-9902"}]
    assert len(orphan_stls) == 2
    for s in orphan_stls:
        assert s.settled_amount < 0, f"{s.settlement_id} should have negative amount"
