import {
  formatCurrency,
  formatCompactNumber,
  formatNumber,
  formatPercent,
  formatDecimal,
} from "@/lib/format";
import { CountrySpendChart } from "@/components/country-spend-chart";
import { cn } from "@/lib/utils";

function BigCard({ label, value, compact }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p
        className={cn(
          "mt-2 font-semibold tracking-tight text-zinc-50",
          compact ? "text-xl" : "text-3xl"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function SmallStat({ label, value, compact }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className={cn("mt-1 font-medium text-zinc-100", compact ? "text-sm" : "text-lg")}>
        {value}
      </p>
    </div>
  );
}

// `compact` shrinks the stat text and pins the grids to 2 columns instead of
// the usual responsive up-to-4/5 columns — those breakpoints are keyed off
// viewport width, so inside a half-width panel (e.g. the week-comparison
// side-by-side layout) they'd still expand to 4-5 columns and get crushed.
// `hideCountryChart` drops the "Spend by country" chart even when viewing
// all countries, for contexts (like that same side-by-side layout) where
// showing it twice is redundant.
export function SummarySection({ summary, isAllCountries, compact = false, hideCountryChart = false }) {
  return (
    <section className="flex flex-col gap-4 px-6 py-6">
      <div className={cn("grid grid-cols-1 gap-4", compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4")}>
        <BigCard label="Spend" value={formatCurrency(summary.spend)} compact={compact} />
        <BigCard label="Reach" value={formatCompactNumber(summary.reach)} compact={compact} />
        <BigCard label="Impressions" value={formatCompactNumber(summary.impressions)} compact={compact} />
        <BigCard label="Engagements" value={formatCompactNumber(summary.engagements)} compact={compact} />
      </div>

      <div className={cn("grid grid-cols-2 gap-3", compact ? "" : "sm:grid-cols-3 lg:grid-cols-5")}>
        <SmallStat label="Frequency" value={formatDecimal(summary.frequency)} compact={compact} />
        <SmallStat
          label="Engagement rate"
          value={formatPercent(summary.engagementRate * 100)}
          compact={compact}
        />
        <SmallStat
          label="Interaction rate"
          value={formatPercent(summary.interactionRate * 100)}
          compact={compact}
        />
        <SmallStat label="Link clicks" value={formatNumber(summary.linkClicks)} compact={compact} />
        <SmallStat label="CTR" value={formatPercent(summary.ctr)} compact={compact} />
        <SmallStat label="CPM" value={formatCurrency(summary.cpm)} compact={compact} />
        {summary.extraActions.map((action) => (
          <SmallStat
            key={action.label}
            label={action.label}
            value={formatNumber(action.value)}
            compact={compact}
          />
        ))}
      </div>

      {!hideCountryChart && isAllCountries && summary.byCountry.length > 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="mb-4 text-sm text-zinc-400">Spend by country</p>
          <CountrySpendChart data={summary.byCountry} />
        </div>
      ) : null}
    </section>
  );
}
