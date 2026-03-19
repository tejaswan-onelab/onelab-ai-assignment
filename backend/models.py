from pydantic import BaseModel
from datetime import datetime, date
from typing import Literal, Optional


class Transaction(BaseModel):
    transaction_id: str
    customer_id: str
    amount: float
    timestamp: datetime
    type: Literal["payment", "refund"]
    status: str


class Settlement(BaseModel):
    settlement_id: str
    transaction_id: str
    settled_amount: float
    settlement_date: date
    batch_id: str


class Gap(BaseModel):
    gap_type: str
    description: str
    transaction: Optional[Transaction] = None
    settlement: Optional[Settlement] = None
    amount_difference: Optional[float] = None


class ReconciliationResult(BaseModel):
    total_transactions: int
    total_settlements: int
    matched: int
    gaps: list[Gap]


class Summary(BaseModel):
    total_transactions: int
    total_settlements: int
    total_matched: int
    total_gaps: int
    gap_value: float
    gaps_by_type: dict[str, int]
