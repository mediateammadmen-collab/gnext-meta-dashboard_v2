import { formatCurrency, formatDecimal, formatNumber, formatPercent, formatSmallCurrency } from "@/lib/format";

function StatTile({ label, value }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

export function AdMetricsGrid({ metrics, campaignType, highlightCostPerEngagement }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <StatTile label="Impressions" value={formatNumber(metrics.impressions)} />
      <StatTile label="Spend" value={formatCurrency(metrics.spend)} />
      <StatTile label="Clicks" value={formatNumber(metrics.linkClicks)} />
      <StatTile label="CTR" value={formatPercent(metrics.ctr)} />
      {highlightCostPerEngagement ? (
        <StatTile label="Cost/Engmt" value={formatSmallCurrency(metrics.costPerEngagement)} />
      ) : campaignType === "Reach" ? (
        <StatTile label="Frequency" value={formatDecimal(metrics.frequency)} />
      ) : (
        <StatTile
          label="CPC"
          value={metrics.costPerClick != null ? formatCurrency(metrics.costPerClick) : "—"}
        />
      )}
      <StatTile label={metrics.resultsLabel || "Results"} value={formatNumber(metrics.results)} />
      {metrics.videoViews != null ? (
        <StatTile label="3s Views" value={formatNumber(metrics.videoViews)} />
      ) : null}
    </div>
  );
}
