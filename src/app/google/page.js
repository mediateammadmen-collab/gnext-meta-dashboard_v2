import {
  getCampaignPerformance,
  getDailyTrend,
  getAdCreatives,
  getKeywords,
  getCampaignCountries,
} from "@/lib/google/googleAds";
import { buildBrandTabs } from "@/lib/google/campaignGrouping";
import { resolveDateRange } from "@/lib/google/dateRange";
import Link from "next/link";
import { CalendarRange } from "lucide-react";
import Filters from "./components/Filters";
import CampaignOverview from "./components/CampaignOverview";
import RefreshButton from "./components/RefreshButton";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

export default async function GoogleAdsPage({ searchParams }) {
  const sp = await searchParams;
  const dateRange = resolveDateRange(sp);
  const countryFilter = sp?.country || null;

  let campaigns = [];
  let trendRows = [];
  let ads = [];
  let keywords = [];
  let countriesByCampaign = new Map();
  let error = null;

  try {
    [campaigns, trendRows, ads, keywords, countriesByCampaign] =
      await Promise.all([
        getCampaignPerformance(dateRange),
        getDailyTrend(dateRange),
        getAdCreatives(dateRange),
        getKeywords(dateRange),
        getCampaignCountries(),
      ]);
  } catch (e) {
    error = e.message;
  }

  if (error) {
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Google Ads Dashboard</h1>
        <p className={styles.error}>Couldn&apos;t load data: {error}</p>
      </main>
    );
  }

  const adsByCampaign = groupBy(ads, (ad) => ad.campaignId);
  const keywordsByCampaign = groupBy(keywords, (kw) => kw.campaignId);

  let enrichedCampaigns = campaigns.map((c) => ({
    ...c,
    ads: adsByCampaign.get(c.id) ?? [],
    keywords: keywordsByCampaign.get(c.id) ?? [],
  }));

  let filteredTrendRows = trendRows;

  if (countryFilter) {
    enrichedCampaigns = enrichedCampaigns.filter((c) =>
      countriesByCampaign.get(c.id)?.has(countryFilter),
    );
    const allowedIds = new Set(enrichedCampaigns.map((c) => c.id));
    filteredTrendRows = trendRows.filter((r) => allowedIds.has(r.campaignId));
  }

  const [gnext] = buildBrandTabs(enrichedCampaigns, filteredTrendRows);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Gnext Google Ads Dashboard</h1>
      </header>

      <div className="flex flex-wrap items-end gap-4">
        <Filters dateRange={dateRange} country={countryFilter} />
        <div className="ml-auto flex items-end gap-2">
          <Link
            href="/google/week-comparison"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800"
          >
            <CalendarRange className="size-4" />
            Week on Week Comparison
          </Link>
          <RefreshButton />
        </div>
      </div>

      <CampaignOverview tab={gnext} />
    </main>
  );
}
