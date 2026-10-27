import { NextResponse } from "next/server";
import {
  getAdsByIds,
  getAdInsightsByCountry,
  getLargeThumbnails,
  getVideoSourcesForAds,
  resolveDateParams,
  shapeCreatives,
} from "@/lib/meta";
import { COUNTRIES, DEFAULT_RANGE, DEFAULT_COUNTRY } from "@/lib/constants";

export const revalidate = 300;

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get("range") || DEFAULT_RANGE;
  const country = searchParams.get("country") || DEFAULT_COUNTRY;
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  try {
    const dateParams = resolveDateParams(range, start, end);
    const adInsightRows = await getAdInsightsByCountry(dateParams);
    const adIds = adInsightRows.map((row) => row.ad_id);
    const ads = await getAdsByIds(adIds);

    const videoIds = ads.map((ad) => ad.creative?.video_id).filter(Boolean);
    const thumbnailCreativeIds = ads
      .filter((ad) => !ad.creative?.image_url)
      .map((ad) => ad.creative?.id);
    const [videoSources, largeThumbnails] = await Promise.all([
      getVideoSourcesForAds(videoIds),
      getLargeThumbnails(thumbnailCreativeIds),
    ]);

    const countryMeta = COUNTRIES.find((c) => c.value === country);
    const creatives = shapeCreatives(
      ads,
      adInsightRows,
      countryMeta?.code || null,
      videoSources,
      largeThumbnails
    );

    return NextResponse.json({ range, country, creatives });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch creatives" },
      { status: 502 }
    );
  }
}
