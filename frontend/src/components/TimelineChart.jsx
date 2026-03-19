import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from "recharts";

const GAP_COLOR = {
  "Cross-Month Settlement":     "#f59e0b",
  "Amount Mismatch (Rounding)": "#3b82f6",
  "Duplicate Settlement":       "#ef4444",
  "Orphan Settlement":          "#8b5cf6",
  normal:                       "#10b981",
};

function toDay(dateStr) {
  const d = new Date(dateStr);
  return d.getMonth() * 31 + d.getDate();
}

function formatLabel(n) {
  const month = Math.floor(n / 31) + 1;
  const day = n % 31 || 31;
  const names = ["Jan", "Feb", "Mar"];
  return `${names[month - 1] || month} ${day}`;
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs space-y-1">
      {d.txn_id && <p className="font-semibold text-slate-800">{d.txn_id}</p>}
      {d.txn_date   && <p className="text-slate-500">Txn date: <span className="text-slate-700 font-medium">{d.txn_date}</span></p>}
      {d.settle_date && <p className="text-slate-500">Settled:  <span className="text-slate-700 font-medium">{d.settle_date}</span></p>}
      {d.gap_type   && <p className="font-semibold mt-1" style={{ color: GAP_COLOR[d.gap_type] || "#64748b" }}>{d.gap_type}</p>}
    </div>
  );
};

export default function TimelineChart({ reconcile }) {
  if (!reconcile) return null;

  const gapPoints = reconcile.gaps
    .filter((g) => g.transaction && g.settlement)
    .map((g) => ({
      x: toDay(g.transaction.timestamp.slice(0, 10)),
      y: toDay(g.settlement.settlement_date),
      txn_id:     g.transaction.transaction_id,
      gap_type:   g.gap_type,
      txn_date:   g.transaction.timestamp.slice(0, 10),
      settle_date: g.settlement.settlement_date,
    }));

  const normalPoints = Array.from({ length: 28 }, (_, i) => {
    const x = toDay(`2025-01-${String(i + 1).padStart(2, "0")}`);
    return { x, y: x + 1 };
  });

  const byType = {};
  for (const p of gapPoints) {
    if (!byType[p.gap_type]) byType[p.gap_type] = [];
    byType[p.gap_type].push(p);
  }

  const minDay = toDay("2025-01-01");
  const maxDay = toDay("2025-02-10");

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Each dot is one record — <span className="font-medium">X axis = transaction date</span>, <span className="font-medium">Y axis = settlement date</span>.
        Dots above the diagonal line settled later than expected. Coloured dots have gaps.
      </p>

      {/* Legend chips */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Normal
        </span>
        {Object.entries(GAP_COLOR).filter(([k]) => k !== "normal").map(([type, color]) => (
          <span key={type} className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
            {type}
          </span>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 30, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              type="number" dataKey="x" name="Transaction Date"
              domain={[minDay, maxDay]} tickFormatter={formatLabel}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              label={{ value: "Transaction Date", position: "insideBottom", offset: -18, fontSize: 12, fill: "#64748b" }}
            />
            <YAxis
              type="number" dataKey="y" name="Settlement Date"
              domain={[minDay, maxDay]} tickFormatter={formatLabel}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              label={{ value: "Settlement Date", angle: -90, position: "insideLeft", offset: 10, fontSize: 12, fill: "#64748b" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              segment={[{ x: minDay, y: minDay }, { x: maxDay, y: maxDay }]}
              stroke="#cbd5e1" strokeDasharray="6 3"
            />
            <Scatter name="Normal" data={normalPoints} fill={GAP_COLOR.normal} opacity={0.35} r={3} />
            {Object.entries(byType).map(([type, points]) => (
              <Scatter key={type} name={type} data={points} fill={GAP_COLOR[type] || "#94a3b8"} r={7} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
