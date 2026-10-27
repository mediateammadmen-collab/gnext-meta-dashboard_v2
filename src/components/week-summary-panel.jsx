import { SummarySection } from "@/components/summary-section";
import { formatDateRange } from "@/lib/format";

export function WeekSummaryPanel({
  label,
  data,
  countryLabel,
  isAllCountries,
  compact = false,
  hideCountryChart = false,
}) {
  return (
    <div className="flex flex-col gap-6 rounded-xl border border-zinc-800">
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-6 py-4">
        <h2 className="text-lg font-semibold text-zinc-100">
          {label} <span className="text-zinc-500">· Week {data.weekNumber}</span>
        </h2>
        <p className="text-sm text-zinc-500">
          {formatDateRange(data.startDate, data.endDate)} · {countryLabel}
        </p>
      </div>
      <SummarySection
        summary={data.summary}
        isAllCountries={isAllCountries}
        compact={compact}
        hideCountryChart={hideCountryChart}
      />
    </div>
  );
}
