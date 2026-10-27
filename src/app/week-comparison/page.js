import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/constants";
import { loadWeekDashboardData } from "@/lib/meta";
import { buildWeekOptions } from "@/lib/weeks";
import { WeekComparisonFilters } from "@/components/week-comparison-filters";
import { WeekComparisonSummary } from "@/components/week-comparison-summary";
import { WeekSummaryPanel } from "@/components/week-summary-panel";
import { WeekCreativesTabs } from "@/components/week-creatives-tabs";
import { AdCreativesGrid } from "@/components/ad-creatives-grid";

export const revalidate = 300;

function parseWeek(value) {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default async function WeekComparisonPage({ searchParams }) {
  const params = await searchParams;
  const country = params?.country || DEFAULT_COUNTRY;
  const countryMeta = COUNTRIES.find((c) => c.value === country) || COUNTRIES[0];
  const countryCode = countryMeta.code || null;
  const isAllCountries = country === "all";

  const weekOptions = buildWeekOptions();
  const week1 = parseWeek(params?.week1);
  const week2 = parseWeek(params?.week2);

  const filters = (
    <WeekComparisonFilters country={country} week1={week1} week2={week2} weekOptions={weekOptions} />
  );

  if (week1 == null && week2 == null) {
    return (
      <div className="flex flex-1 flex-col">
        {filters}
        <main className="flex flex-1 items-center justify-center px-6 py-16">
          <p className="text-sm text-zinc-500">
            Pick a country and at least one week above, then press Show.
          </p>
        </main>
      </div>
    );
  }

  if (week1 != null && week2 != null) {
    const [week1Data, week2Data] = await Promise.all([
      loadWeekDashboardData(week1, countryCode),
      loadWeekDashboardData(week2, countryCode),
    ]);

    return (
      <div className="flex flex-1 flex-col">
        {filters}
        <main className="flex flex-1 flex-col gap-8 px-6 py-6">
          <WeekComparisonSummary
            weekAData={week1Data}
            weekBData={week2Data}
            countryLabel={countryMeta.label}
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <WeekSummaryPanel
              label="First week"
              data={week1Data}
              countryLabel={countryMeta.label}
              isAllCountries={isAllCountries}
              compact
              hideCountryChart
            />
            <WeekSummaryPanel
              label="Second week"
              data={week2Data}
              countryLabel={countryMeta.label}
              isAllCountries={isAllCountries}
              compact
              hideCountryChart
            />
          </div>
          <WeekCreativesTabs weekAData={week1Data} weekBData={week2Data} />
        </main>
      </div>
    );
  }

  // Exactly one week selected — show it on its own, no comparison.
  const singleWeek = week1 ?? week2;
  const singleData = await loadWeekDashboardData(singleWeek, countryCode);

  return (
    <div className="flex flex-1 flex-col">
      {filters}
      <main className="flex flex-1 flex-col gap-8 px-6 py-6">
        <WeekSummaryPanel
          label="Selected week"
          data={singleData}
          countryLabel={countryMeta.label}
          isAllCountries={isAllCountries}
        />
        <section className="flex flex-col gap-4 rounded-xl border border-zinc-800 px-6 py-6">
          <h2 className="text-lg font-semibold text-zinc-100">Ad creatives</h2>
          <AdCreativesGrid creatives={singleData.creatives} />
        </section>
      </main>
    </div>
  );
}
