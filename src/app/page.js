import {
  getAccountInsightsByCountry,
  getAdInsightsByCountry,
  getAdsByIds,
  getLargeThumbnails,
  getVideoSourcesForAds,
  resolveDateParams,
  shapeCreatives,
  shapeSummary,
} from "@/lib/meta";
import { COUNTRIES, DEFAULT_COUNTRY, DEFAULT_RANGE } from "@/lib/constants";
import { FilterBar } from "@/components/filter-bar";
import { SummarySection } from "@/components/summary-section";
import { AdCreativesGrid } from "@/components/ad-creatives-grid";

export const revalidate = 300;

function sanitizeRange(range, start, end) {
  if (range === "custom" && start && end) return { range, start, end };
  if (range === "custom") return { range: DEFAULT_RANGE, start: null, end: null };
  return { range, start: null, end: null };
}

export default async function DashboardPage({ searchParams }) {
  const params = await searchParams;
  const rawRange = params?.range || DEFAULT_RANGE;
  const country = params?.country || DEFAULT_COUNTRY;
  const { range, start, end } = sanitizeRange(rawRange, params?.start, params?.end);

  const dateParams = resolveDateParams(range, start, end);
  const countryMeta = COUNTRIES.find((c) => c.value === country);
  const countryCode = countryMeta?.code || null;

  const [countryRows, adInsightRows] = await Promise.all([
    getAccountInsightsByCountry(dateParams),
    getAdInsightsByCountry(dateParams),
  ]);

  const ads = await getAdsByIds(adInsightRows.map((row) => row.ad_id));
  const videoIds = ads.map((ad) => ad.creative?.video_id).filter(Boolean);
  const thumbnailCreativeIds = ads
    .filter((ad) => !ad.creative?.image_url)
    .map((ad) => ad.creative?.id);
  const [videoSources, largeThumbnails] = await Promise.all([
    getVideoSourcesForAds(videoIds),
    getLargeThumbnails(thumbnailCreativeIds),
  ]);

  const summary = shapeSummary(countryRows, countryCode);
  const creatives = shapeCreatives(ads, adInsightRows, countryCode, videoSources, largeThumbnails);

  return (
    <div className="flex flex-1 flex-col">
      <FilterBar />
      <main className="flex flex-1 flex-col">
        <SummarySection summary={summary} isAllCountries={country === "all"} />
        <section className="flex flex-col gap-4 px-6 pb-10">
          <h2 className="text-lg font-semibold text-zinc-100">Ad creatives</h2>
          <AdCreativesGrid creatives={creatives} />
        </section>
      </main>
    </div>
  );
}
