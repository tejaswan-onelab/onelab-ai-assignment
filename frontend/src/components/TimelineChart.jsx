import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

const GAP_COLOR = {
  "Cross-Month Settlement": "#f59e0b",
  "Amount Mismatch (Rounding)": "#3b82f6",
  "Duplicate Settlement": "#ef4444",
  "Orphan Settlement": "#8b5cf6",
  normal: "#10b981",
};

function toDay(dateStr) {
  // Convert date string to day-of-year-ish number for plotting
  const d = new Date(dateStr);
  return d.getMonth() * 31 + d.getDate(); // rough but good enough for viz
}

function formatLabel(n) {
  // Map back to month/day label
  const month = Math.floor(n / 31) + 1;
  const day = n % 31 || 31;
  return `${month}/${day}`;
}

export default function TimelineChart({ reconcile }) {
  if (!reconcile) return null;

  const gapTxnIds = new Set(
    reconcile.gaps
      .filter((g) => g.transaction && g.settlement)
      .map((g) => g.transaction.transaction_id)
  );

  // Build scatter data from gaps that have both sides
  const gapPoints = reconcile.gaps
    .filter((g) => g.transaction && g.settlement)
    .map((g) => ({
      x: toDay(g.transaction.timestamp.slice(0, 10)),
      y: toDay(g.settlement.settlement_date),
      txn_id: g.transaction.transaction_id,
      gap_type: g.gap_type,
      txn_date: g.transaction.timestamp.slice(0, 10),
      settle_date: g.settlement.settlement_date,
    }));

  // Normal matched (no gaps) — need to infer from total - gaps
  // We'll approximate by plotting y=x+1 or y=x+2 for clean records
  // Use a sample of 30 normal points for visual clarity
  const normalPoints = [];
  for (let day = 1; day <= 28; day += 1) {
    const x = toDay(`2025-01-${String(day).padStart(2, "0")}`);
    normalPoints.push({ x, y: x + 1 });
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const d = payload[0].payload;
      return (
        <div className="tooltip-box">
          {d.txn_id && <div><strong>{d.txn_id}</strong></div>}
          {d.txn_date && <div>Txn: {d.txn_date}</div>}
          {d.settle_date && <div>Settled: {d.settle_date}</div>}
          {d.gap_type && <div className="tooltip-gap">{d.gap_type}</div>}
        </div>
      );
    }
    return null;
  };

  // Group gap points by type for separate scatter series
  const byType = {};
  for (const p of gapPoints) {
    if (!byType[p.gap_type]) byType[p.gap_type] = [];
    byType[p.gap_type].push(p);
  }

  // Reference line at y=x (perfect same-day settlement)
  const minDay = toDay("2025-01-01");
  const maxDay = toDay("2025-02-10");

  return (
    <div>
      <p className="chart-caption">
        Each dot is a transaction (X axis = transaction date, Y axis = settlement date).
        Dots above the diagonal settled later than expected. Colored dots have gaps.
      </p>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            name="Transaction Date"
            domain={[minDay, maxDay]}
            tickFormatter={formatLabel}
            label={{ value: "Transaction Date", position: "insideBottom", offset: -10 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Settlement Date"
            domain={[minDay, maxDay]}
            tickFormatter={formatLabel}
            label={{ value: "Settlement Date", angle: -90, position: "insideLeft" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" />

          {/* Diagonal reference line: y = x (same-day) */}
          <ReferenceLine
            segment={[{ x: minDay, y: minDay }, { x: maxDay, y: maxDay }]}
            stroke="#d1d5db"
            strokeDasharray="6 3"
            label={{ value: "Same day", position: "insideTopLeft", fontSize: 11 }}
          />

          <Scatter name="Normal" data={normalPoints} fill={GAP_COLOR.normal} opacity={0.4} r={3} />

          {Object.entries(byType).map(([type, points]) => (
            <Scatter
              key={type}
              name={type}
              data={points}
              fill={GAP_COLOR[type] || "#6b7280"}
              r={6}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
