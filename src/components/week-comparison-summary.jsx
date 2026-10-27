import {
  formatCompactNumber,
  formatCurrency,
  formatDateRange,
  formatDecimal,
  formatPercent,
} from "@/lib/format";
import { cn } from "@/lib/utils";

// Each metric's raw value lives in `summary` under `key`. `toPercentValue`
// normalizes fields that are stored as a 0-1 fraction (engagementRate) so
// every metric can share the same percent-change math.
const METRICS = [
  { key: "spend", label: "Spend", format: (v) => formatCurrency(v) },
  { key: "reach", label: "Reach", format: (v) => formatCompactNumber(v) },
  { key: "impressions", label: "Impressions", format: (v) => formatCompactNumber(v) },
  { key: "engagements", label: "Engagement", format: (v) => formatCompactNumber(v) },
  { key: "frequency", label: "Frequency", format: (v) => formatDecimal(v) },
  {
    key: "engagementRate",
    label: "Engagement Rate",
    format: (v) => formatPercent(v * 100),
    toPercentValue: (v) => v * 100,
  },
  { key: "ctr", label: "CTR", format: (v) => formatPercent(v) },
];

function percentChange(a, b) {
  if (a !== 0) return ((b - a) / a) * 100;
  return b !== 0 ? 100 : 0;
}

function buildRows(summaryA, summaryB) {
  return METRICS.map((metric) => {
    const a = summaryA[metric.key] || 0;
    const b = summaryB[metric.key] || 0;
    return { ...metric, a, b, change: percentChange(a, b) };
  });
}

function buildNarrative(rows, weekBLabel) {
  const spendRow = rows.find((r) => r.key === "spend");
  const movers = rows
    .filter((r) => r.key !== "spend")
    .filter((r) => Math.abs(r.change) >= 0.1)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 3);

  const verb = (change) => (change >= 0 ? "rose" : "fell");
  const sentences = [];

  if (spendRow) {
    sentences.push(
      `${weekBLabel} spend ${verb(spendRow.change)} ${Math.abs(spendRow.change).toFixed(1)}% to ${spendRow.format(spendRow.b)}.`
    );
  }
  if (movers.length > 0) {
    const parts = movers.map(
      (r) => `${r.label} ${verb(r.change)} ${Math.abs(r.change).toFixed(1)}% to ${r.format(r.b)}`
    );
    sentences.push(`${parts.join(", ")}.`);
  }
  return sentences.join(" ");
}

function DeltaBadge({ change }) {
  const isFlat = Math.abs(change) < 0.05;
  const isUp = change > 0;
  return (
    <span
      className={cn(
        "inline-flex w-20 shrink-0 items-center justify-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold",
        isFlat
          ? "bg-zinc-800 text-zinc-400"
          : isUp
            ? "bg-emerald-500/15 text-emerald-400"
            : "bg-rose-500/15 text-rose-400"
      )}
    >
      {isFlat ? "–" : isUp ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
    </span>
  );
}

function MetricRow({ row }) {
  const max = Math.max(row.a, row.b, 1);
  return (
    <div className="flex items-center gap-4">
      <p className="w-32 shrink-0 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {row.label}
      </p>
      <div className="flex flex-1 flex-col gap-1.5">
        <div
          className="flex h-7 min-w-12 items-center rounded-md bg-sky-500/80 px-2.5 text-xs font-semibold text-zinc-950"
          style={{ width: `${Math.max((row.a / max) * 100, 8)}%` }}
        >
          {row.format(row.a)}
        </div>
        <div
          className="flex h-7 min-w-12 items-center rounded-md bg-violet-500/80 px-2.5 text-xs font-semibold text-zinc-950"
          style={{ width: `${Math.max((row.b / max) * 100, 8)}%` }}
        >
          {row.format(row.b)}
        </div>
      </div>
      <DeltaBadge change={row.change} />
    </div>
  );
}

export function WeekComparisonSummary({ weekAData, weekBData, countryLabel }) {
  const rows = buildRows(weekAData.summary, weekBData.summary);
  const weekALabel = `Week ${weekAData.weekNumber} (${formatDateRange(weekAData.startDate, weekAData.endDate)})`;
  const weekBLabel = `Week ${weekBData.weekNumber} (${formatDateRange(weekBData.startDate, weekBData.endDate)})`;
  const narrative = buildNarrative(rows, weekBLabel);

  return (
    <section className="flex flex-col gap-5 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Week-on-week comparison</h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-sky-500" />
            {weekALabel}
          </span>
          <span>vs</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-violet-500" />
            {weekBLabel}
          </span>
          <span>· {countryLabel}</span>
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {rows.map((row) => (
          <MetricRow key={row.key} row={row} />
        ))}
      </div>

      {narrative ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
          <p className="mb-1 text-sm font-semibold text-zinc-200">What changed</p>
          <p className="text-sm text-zinc-400">{narrative}</p>
        </div>
      ) : null}
    </section>
  );
}
