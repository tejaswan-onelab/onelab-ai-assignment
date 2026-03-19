from collections import defaultdict
from models import Transaction, Settlement, Gap, ReconciliationResult

ROUNDING_THRESHOLD = 0.02  # flag diffs smaller than this as rounding


def reconcile(
    transactions: list[Transaction],
    settlements: list[Settlement],
) -> ReconciliationResult:
    # Build lookups
    txn_by_id: dict[str, Transaction] = {t.transaction_id: t for t in transactions}
    stls_by_txn: dict[str, list[Settlement]] = defaultdict(list)
    for s in settlements:
        stls_by_txn[s.transaction_id].append(s)

    gaps: list[Gap] = []
    matched_txn_ids: set[str] = set()

    # ── Check every transaction ───────────────────────────────────────────────
    for txn in transactions:
        matched_stls = stls_by_txn.get(txn.transaction_id, [])

        if not matched_stls:
            # Gap: no settlement found
            gaps.append(Gap(
                gap_type="Unsettled Transaction",
                description=f"{txn.transaction_id} has no matching settlement.",
                transaction=txn,
            ))
            continue

        # Gap: duplicate settlements (more than one settlement for this txn)
        if len(matched_stls) > 1:
            for stl in matched_stls:
                gaps.append(Gap(
                    gap_type="Duplicate Settlement",
                    description=(
                        f"{txn.transaction_id} has {len(matched_stls)} settlements "
                        f"(settlement {stl.settlement_id})."
                    ),
                    transaction=txn,
                    settlement=stl,
                ))
            matched_txn_ids.add(txn.transaction_id)
            continue

        stl = matched_stls[0]
        matched_txn_ids.add(txn.transaction_id)

        # Gap: cross-month settlement
        if txn.timestamp.month != stl.settlement_date.month:
            gaps.append(Gap(
                gap_type="Cross-Month Settlement",
                description=(
                    f"{txn.transaction_id} transacted on {txn.timestamp.date()} "
                    f"but settled on {stl.settlement_date} (different month)."
                ),
                transaction=txn,
                settlement=stl,
            ))

        # Gap: amount mismatch (rounding)
        diff = round(abs(txn.amount - stl.settled_amount), 6)
        if diff > 0:
            label = "Amount Mismatch (Rounding)" if diff < ROUNDING_THRESHOLD else "Amount Mismatch"
            gaps.append(Gap(
                gap_type=label,
                description=(
                    f"{txn.transaction_id}: platform recorded ${txn.amount:.4f}, "
                    f"bank settled ${stl.settled_amount:.4f} (diff ${diff:.4f})."
                ),
                transaction=txn,
                settlement=stl,
                amount_difference=diff,
            ))

    # ── Check every settlement for orphans ───────────────────────────────────
    for stl in settlements:
        if stl.transaction_id not in txn_by_id:
            gaps.append(Gap(
                gap_type="Orphan Settlement",
                description=(
                    f"Settlement {stl.settlement_id} references {stl.transaction_id} "
                    f"which has no matching transaction."
                ),
                settlement=stl,
            ))

    total_matched = len(matched_txn_ids) - sum(
        1 for txn in transactions
        if txn.transaction_id in matched_txn_ids
        and any(g.gap_type in ("Duplicate Settlement", "Cross-Month Settlement", "Amount Mismatch (Rounding)", "Amount Mismatch")
                for g in gaps if g.transaction and g.transaction.transaction_id == txn.transaction_id)
    )

    return ReconciliationResult(
        total_transactions=len(transactions),
        total_settlements=len(settlements),
        matched=len(matched_txn_ids),
        gaps=gaps,
    )
