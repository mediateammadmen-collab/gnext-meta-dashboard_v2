import { formatMoney, formatNumber, formatPercent } from "@/lib/google/format";
import { cn } from "@/lib/utils";

function formatValue(value, format) {
  if (format === "money") return formatMoney(value);
  if (format === "percent") return formatPercent(value);
  return formatNumber(value);
}

// Matches the Meta dashboard's week-comparison DeltaBadge exactly: a 0→0
// pair reads as flat, a 0→nonzero jump reads as a full +100%, everything
// else is a normal percent change.
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

export default function ComparisonBar({ label, week1Value, week2Value, format }) {
  const max = Math.max(week1Value, week2Value, 1);
  const change = week1Value !== 0 ? ((week2Value - week1Value) / week1Value) * 100 : week2Value !== 0 ? 100 : 0;

  return (
    <div className="flex items-center gap-4">
      <p className="w-32 shrink-0 text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <div className="flex flex-1 flex-col gap-1.5">
        <div
          className="flex h-7 min-w-12 items-center rounded-md bg-sky-500/80 px-2.5 text-xs font-semibold text-zinc-950"
          style={{ width: `${Math.max((week1Value / max) * 100, 8)}%` }}
        >
          {formatValue(week1Value, format)}
        </div>
        <div
          className="flex h-7 min-w-12 items-center rounded-md bg-violet-500/80 px-2.5 text-xs font-semibold text-zinc-950"
          style={{ width: `${Math.max((week2Value / max) * 100, 8)}%` }}
        >
          {formatValue(week2Value, format)}
        </div>
      </div>
      <DeltaBadge change={change} />
    </div>
  );
}
