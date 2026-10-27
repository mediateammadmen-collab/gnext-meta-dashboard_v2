import { getGnextTotals } from "@/lib/google/googleAds";
import { weekRange } from "@/lib/google/weeks";
import { formatMoney, formatNumber, formatPercent } from "@/lib/google/format";
import { COUNTRIES } from "@/lib/google/countries";
import WeekComparisonControls from "../components/WeekComparisonControls";
import ComparisonBar from "../components/ComparisonBar";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const METRICS = [
  { key: "videoViews", label: "Video views", format: "number" },
  { key: "ctr", label: "CTR", format: "percent" },
  { key: "cpc", label: "Avg. CPC", format: "money" },
  { key: "spend", label: "Spend", format: "money" },
  { key: "cpv", label: "Avg. CPV", format: "money" },
  { key: "cpm", label: "Avg. CPM", format: "money" },
];

function computeMetrics({ impressions, clicks, cost, videoViews }) {
  return {
    spend: cost,
    videoViews,
    ctr: impressions ? (clicks / impressions) * 100 : 0,
    cpc: clicks ? cost / clicks : 0,
    cpv: videoViews ? cost / videoViews : 0,
    cpm: impressions ? (cost / impressions) * 1000 : 0,
  };
}

function formatValue(value, format) {
  if (format === "money") return formatMoney(value);
  if (format === "percent") return formatPercent(value);
  return formatNumber(value);
}

function formatDateRange(start, end) {
  const fmt = (d) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  return `${fmt(start)} – ${fmt(end)}`;
}

function buildSummary(week2Number, range2, metrics1, metrics2) {
  const changes = METRICS.map((m) => {
    const from = metrics1[m.key];
    const to = metrics2[m.key];
    if (from === 0) return null;
    const pct = ((to - from) / from) * 100;
    return { label: m.label, pct, to, format: m.format };
  })
    .filter((c) => c && Math.abs(c.pct) >= 1)
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
    .slice(0, 4);

  if (changes.length === 0) return null;

  const parts = changes.map((c) => {
    const direction = c.pct >= 0 ? "rose" : "fell";
    return `${c.label} ${direction} ${Math.abs(c.pct).toFixed(1)}% to ${formatValue(c.to, c.format)}`;
  });

  return `Week ${week2Number} (${formatDateRange(range2.start, range2.end)}): ${parts.join(", ")}.`;
}

function Stat({ label, value }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
    </div>
  );
}

function WeekCard({ title, weekNumber, range, totals, metrics }) {
  return (
    <div className={styles.weekCard}>
      <div className={styles.weekCardHeader}>
        <h3 className={styles.weekCardTitle}>
          {title} &middot; Week {weekNumber}
        </h3>
        <p className={styles.weekCardDates}>{formatDateRange(range.start, range.end)}</p>
      </div>
      <div className={styles.statGrid}>
        <Stat label="Spend" value={formatMoney(metrics.spend)} />
        <Stat label="Impressions" value={formatNumber(totals.impressions)} />
        <Stat label="Clicks" value={formatNumber(totals.clicks)} />
        <Stat label="CTR" value={formatPercent(metrics.ctr)} />
        <Stat label="Avg. CPC" value={formatMoney(metrics.cpc)} />
        <Stat label="Avg. CPM" value={formatMoney(metrics.cpm)} />
        <Stat label="Video views" value={formatNumber(metrics.videoViews)} />
        <Stat label="Avg. CPV" value={formatMoney(metrics.cpv)} />
      </div>
    </div>
  );
}

export default async function WeekComparisonPage({ searchParams }) {
  const sp = await searchParams;
  const week1Number = Number(sp?.week1 ?? -1);
  const week2Number = Number(sp?.week2 ?? 1);
  const countryCode = sp?.country || null;

  const range1 = weekRange(week1Number);
  const range2 = weekRange(week2Number);

  let totals1 = { impressions: 0, clicks: 0, cost: 0, videoViews: 0 };
  let totals2 = { impressions: 0, clicks: 0, cost: 0, videoViews: 0 };
  let error = null;

  try {
    [totals1, totals2] = await Promise.all([
      getGnextTotals(range1, countryCode),
      getGnextTotals(range2, countryCode),
    ]);
  } catch (e) {
    error = e.message;
  }

  const metrics1 = computeMetrics(totals1);
  const metrics2 = computeMetrics(totals2);
  const countryName = COUNTRIES.find((c) => c.code === countryCode)?.name ?? "All countries";
  const summary = error ? null : buildSummary(week2Number, range2, metrics1, metrics2);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Week-on-week comparison</h1>
        <p className={styles.subtitle}>Gnext campaign performance</p>
      </header>

      <WeekComparisonControls country={countryCode} week1={week1Number} week2={week2Number} />

      {error ? (
        <p className={styles.error}>Couldn&apos;t load data: {error}</p>
      ) : (
        <>
          <section className={styles.card}>
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <span className={`${styles.dot} ${styles.dotWeek1}`} />
                Week {week1Number} ({formatDateRange(range1.start, range1.end)})
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.dot} ${styles.dotWeek2}`} />
                Week {week2Number} ({formatDateRange(range2.start, range2.end)})
              </span>
              <span className={styles.legendCountry}>{countryName}</span>
            </div>

            <div className="flex flex-col gap-4">
              {METRICS.map((m) => (
                <ComparisonBar
                  key={m.key}
                  label={m.label}
                  week1Value={metrics1[m.key]}
                  week2Value={metrics2[m.key]}
                  format={m.format}
                />
              ))}
            </div>

            {summary && (
              <div className={styles.summaryBox}>
                <h3 className={styles.summaryTitle}>What changed</h3>
                <p className={styles.summaryText}>{summary}</p>
              </div>
            )}
          </section>

          <section className={styles.weekCards}>
            <WeekCard
              title="First week"
              weekNumber={week1Number}
              range={range1}
              totals={totals1}
              metrics={metrics1}
            />
            <WeekCard
              title="Second week"
              weekNumber={week2Number}
              range={range2}
              totals={totals2}
              metrics={metrics2}
            />
          </section>
        </>
      )}
    </main>
  );
}
