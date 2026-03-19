"""
Task 16 — Test API
  16a. Endpoint response codes
  16b. CSV export format validation
"""

import csv
import io

import pytest
from fastapi.testclient import TestClient

import main as app_module
from main import app

client = TestClient(app)


# ── Helpers ───────────────────────────────────────────────────────────────────

def reset_state():
    """Clear the in-memory store between tests that need a clean slate."""
    app_module._transactions = []
    app_module._settlements = []


def generate():
    return client.post("/api/generate")


# ── 16a: Endpoint response codes ─────────────────────────────────────────────

class TestResponseCodesBeforeGenerate:
    def setup_method(self):
        reset_state()

    def test_transactions_before_generate_returns_400(self):
        r = client.get("/api/transactions")
        assert r.status_code == 400

    def test_settlements_before_generate_returns_400(self):
        r = client.get("/api/settlements")
        assert r.status_code == 400

    def test_reconcile_before_generate_returns_400(self):
        r = client.get("/api/reconcile")
        assert r.status_code == 400

    def test_summary_before_generate_returns_400(self):
        r = client.get("/api/summary")
        assert r.status_code == 400

    def test_export_transactions_before_generate_returns_400(self):
        r = client.get("/api/export/transactions")
        assert r.status_code == 400

    def test_export_settlements_before_generate_returns_400(self):
        r = client.get("/api/export/settlements")
        assert r.status_code == 400


class TestResponseCodesAfterGenerate:
    @pytest.fixture(autouse=True)
    def setup(self):
        reset_state()
        r = generate()
        assert r.status_code == 200

    def test_generate_returns_200(self):
        r = generate()
        assert r.status_code == 200

    def test_generate_response_has_counts(self):
        r = generate()
        body = r.json()
        assert "transactions" in body
        assert "settlements" in body
        assert body["transactions"] == 108
        assert body["settlements"] == 112

    def test_transactions_returns_200(self):
        assert client.get("/api/transactions").status_code == 200

    def test_settlements_returns_200(self):
        assert client.get("/api/settlements").status_code == 200

    def test_reconcile_returns_200(self):
        assert client.get("/api/reconcile").status_code == 200

    def test_summary_returns_200(self):
        assert client.get("/api/summary").status_code == 200

    def test_export_transactions_returns_200(self):
        assert client.get("/api/export/transactions").status_code == 200

    def test_export_settlements_returns_200(self):
        assert client.get("/api/export/settlements").status_code == 200


# ── 16b: CSV export format validation ────────────────────────────────────────

class TestCSVExport:
    @pytest.fixture(autouse=True)
    def setup(self):
        reset_state()
        generate()

    def _parse_csv(self, response):
        content = response.text
        reader = csv.DictReader(io.StringIO(content))
        rows = list(reader)
        return reader.fieldnames, rows

    def test_transactions_csv_headers(self):
        r = client.get("/api/export/transactions")
        fieldnames, _ = self._parse_csv(r)
        assert list(fieldnames) == [
            "transaction_id", "customer_id", "amount", "timestamp", "type", "status"
        ]

    def test_settlements_csv_headers(self):
        r = client.get("/api/export/settlements")
        fieldnames, _ = self._parse_csv(r)
        assert list(fieldnames) == [
            "settlement_id", "transaction_id", "settled_amount", "settlement_date", "batch_id"
        ]

    def test_transactions_csv_row_count(self):
        r = client.get("/api/export/transactions")
        _, rows = self._parse_csv(r)
        assert len(rows) == 108

    def test_settlements_csv_row_count(self):
        r = client.get("/api/export/settlements")
        _, rows = self._parse_csv(r)
        assert len(rows) == 112

    def test_transactions_csv_content_type(self):
        r = client.get("/api/export/transactions")
        assert "text/csv" in r.headers["content-type"]

    def test_settlements_csv_content_type(self):
        r = client.get("/api/export/settlements")
        assert "text/csv" in r.headers["content-type"]

    def test_transactions_csv_amounts_are_numeric(self):
        r = client.get("/api/export/transactions")
        _, rows = self._parse_csv(r)
        for row in rows:
            float(row["amount"])  # should not raise

    def test_settlements_csv_amounts_are_numeric(self):
        r = client.get("/api/export/settlements")
        _, rows = self._parse_csv(r)
        for row in rows:
            float(row["settled_amount"])  # should not raise

    def test_transactions_csv_content_disposition(self):
        r = client.get("/api/export/transactions")
        assert "transactions.csv" in r.headers.get("content-disposition", "")

    def test_settlements_csv_content_disposition(self):
        r = client.get("/api/export/settlements")
        assert "settlements.csv" in r.headers.get("content-disposition", "")

    def test_transactions_csv_first_row_has_expected_txn_id(self):
        r = client.get("/api/export/transactions")
        _, rows = self._parse_csv(r)
        txn_ids = {row["transaction_id"] for row in rows}
        assert "TXN-0001" in txn_ids

    def test_settlements_csv_contains_orphan_ref_ids(self):
        r = client.get("/api/export/settlements")
        _, rows = self._parse_csv(r)
        stl_txn_ids = {row["transaction_id"] for row in rows}
        assert "REF-9901" in stl_txn_ids
        assert "REF-9902" in stl_txn_ids
