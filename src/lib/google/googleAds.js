const API_VERSION = "v25";
const MICROS_PER_UNIT = 1_000_000;

let cachedAccessToken = null;
let cachedAccessTokenExpiry = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedAccessToken && now < cachedAccessTokenExpiry) {
    return cachedAccessToken;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to refresh Google access token (${res.status}): ${body}`);
  }

  const data = await res.json();
  cachedAccessToken = data.access_token;
  cachedAccessTokenExpiry = now + (data.expires_in - 60) * 1000;
  return cachedAccessToken;
}

async function gaqlSearch(query) {
  const accessToken = await getAccessToken();
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;

  const res = await fetch(
    `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Ads API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.results ?? [];
}

// dateRange is { start, end } (ISO date strings) or { start: null, end: null }
// for "lifetime" (no date restriction at all).
function dateRangeClause(dateRange) {
  if (!dateRange?.start || !dateRange?.end) return null;
  return `segments.date BETWEEN '${dateRange.start}' AND '${dateRange.end}'`;
}

function whereClause(...conditions) {
  const parts = conditions.filter(Boolean);
  return parts.length > 0 ? `WHERE ${parts.join(" AND ")}` : "";
}

// This dashboard is scoped to the Gnext client only - the account also runs
// unrelated Jac and MGI campaigns that should never be fetched or shown here.
const GNEXT_FILTER = `campaign.name LIKE 'Gnext%'`;

export async function getCampaignPerformance(dateRange) {
  const rows = await gaqlSearch(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.video_trueview_views
    FROM campaign
    ${whereClause(GNEXT_FILTER, dateRangeClause(dateRange))}
    ORDER BY metrics.cost_micros DESC
  `);

  return rows.map((row) => ({
    id: row.campaign.id,
    name: row.campaign.name,
    status: row.campaign.status,
    channelType: row.campaign.advertisingChannelType,
    impressions: Number(row.metrics.impressions ?? 0),
    clicks: Number(row.metrics.clicks ?? 0),
    cost: Number(row.metrics.costMicros ?? 0) / MICROS_PER_UNIT,
    conversions: Number(row.metrics.conversions ?? 0),
    videoViews: Number(row.metrics.videoTrueviewViews ?? 0),
  }));
}

// Returns one row per campaign per day (not pre-aggregated) so callers can
// roll it up however they need - e.g. per brand for the dashboard tabs.
export async function getDailyTrend(dateRange) {
  const rows = await gaqlSearch(`
    SELECT
      campaign.id,
      campaign.name,
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM campaign
    ${whereClause(GNEXT_FILTER, dateRangeClause(dateRange))}
    ORDER BY segments.date ASC
  `);

  return rows.map((row) => ({
    date: row.segments.date,
    campaignId: row.campaign.id,
    campaignName: row.campaign.name,
    impressions: Number(row.metrics.impressions ?? 0),
    clicks: Number(row.metrics.clicks ?? 0),
    cost: Number(row.metrics.costMicros ?? 0) / MICROS_PER_UNIT,
    conversions: Number(row.metrics.conversions ?? 0),
  }));
}

// Ad-level creative: Search ad copy (with approval status), Video's YouTube
// asset (both the legacy video_ad and the modern video_responsive_ad format),
// and Display's marketing image asset. Performance Max isn't covered - it
// uses asset_groups instead of ad_group_ad, a different resource shape.
export async function getAdCreatives(dateRange) {
  const rows = await gaqlSearch(`
    SELECT
      campaign.id,
      ad_group_ad.ad.id,
      ad_group_ad.status,
      ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.ad.responsive_search_ad.descriptions,
      ad_group_ad.ad.video_ad.video.asset,
      ad_group_ad.ad.video_responsive_ad.videos,
      ad_group_ad.ad.responsive_display_ad.marketing_images,
      ad_group_ad.ad.responsive_display_ad.square_marketing_images,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.youtube_likes,
      metrics.youtube_shares,
      metrics.youtube_comments
    FROM ad_group_ad
    ${whereClause(GNEXT_FILTER, dateRangeClause(dateRange))}
    ORDER BY metrics.cost_micros DESC
  `);

  const assetResourceNames = new Set();
  const ads = rows.map((row) => {
    const ad = row.adGroupAd.ad;
    const videoAssetResourceName =
      ad.videoAd?.video?.asset ?? ad.videoResponsiveAd?.videos?.[0]?.asset ?? null;
    const imageAssetResourceName =
      ad.responsiveDisplayAd?.marketingImages?.[0]?.asset ??
      ad.responsiveDisplayAd?.squareMarketingImages?.[0]?.asset ??
      null;

    if (videoAssetResourceName) assetResourceNames.add(videoAssetResourceName);
    if (imageAssetResourceName) assetResourceNames.add(imageAssetResourceName);

    return {
      campaignId: row.campaign.id,
      adId: ad.id,
      status: row.adGroupAd.status,
      headlines: (ad.responsiveSearchAd?.headlines ?? []).map((h) => h.text),
      descriptions: (ad.responsiveSearchAd?.descriptions ?? []).map((d) => d.text),
      videoAssetResourceName,
      imageAssetResourceName,
      impressions: Number(row.metrics.impressions ?? 0),
      clicks: Number(row.metrics.clicks ?? 0),
      cost: Number(row.metrics.costMicros ?? 0) / MICROS_PER_UNIT,
      likes: Number(row.metrics.youtubeLikes ?? 0),
      shares: Number(row.metrics.youtubeShares ?? 0),
      comments: Number(row.metrics.youtubeComments ?? 0),
    };
  });

  const assetMap = await resolveAssets(Array.from(assetResourceNames));

  return ads.map((ad) => ({
    ...ad,
    videoId: ad.videoAssetResourceName
      ? assetMap.get(ad.videoAssetResourceName)?.youtubeVideoId ?? null
      : null,
    imageUrl: ad.imageAssetResourceName
      ? assetMap.get(ad.imageAssetResourceName)?.imageUrl ?? null
      : null,
  }));
}

async function resolveAssets(resourceNames) {
  const map = new Map();
  if (resourceNames.length === 0) return map;

  const ids = resourceNames.map((rn) => rn.split("/").pop());
  const rows = await gaqlSearch(`
    SELECT
      asset.id,
      asset.youtube_video_asset.youtube_video_id,
      asset.image_asset.full_size.url
    FROM asset
    WHERE asset.id IN (${ids.join(",")})
  `);

  for (const row of rows) {
    map.set(row.asset.resourceName, {
      youtubeVideoId: row.asset.youtubeVideoAsset?.youtubeVideoId ?? null,
      imageUrl: row.asset.imageAsset?.fullSize?.url ?? null,
    });
  }
  return map;
}

export async function getKeywords(dateRange) {
  const rows = await gaqlSearch(`
    SELECT
      campaign.id,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.quality_info.quality_score,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM keyword_view
    ${whereClause(
      "campaign.advertising_channel_type = SEARCH",
      GNEXT_FILTER,
      dateRangeClause(dateRange)
    )}
    ORDER BY metrics.clicks DESC
  `);

  return rows.map((row) => ({
    campaignId: row.campaign.id,
    text: row.adGroupCriterion.keyword.text,
    matchType: row.adGroupCriterion.keyword.matchType,
    qualityScore: row.adGroupCriterion.qualityInfo?.qualityScore ?? null,
    impressions: Number(row.metrics.impressions ?? 0),
    clicks: Number(row.metrics.clicks ?? 0),
    cost: Number(row.metrics.costMicros ?? 0) / MICROS_PER_UNIT,
    conversions: Number(row.metrics.conversions ?? 0),
  }));
}

// Campaign-level location targeting, resolved to country codes. Not
// date-bound - it reflects current targeting settings, not historical spend.
export async function getCampaignCountries() {
  const rows = await gaqlSearch(`
    SELECT
      campaign.id,
      campaign_criterion.location.geo_target_constant
    FROM campaign_criterion
    WHERE campaign_criterion.type = LOCATION
      AND campaign_criterion.negative = false
      AND ${GNEXT_FILTER}
  `);

  const geoIdsByCampaign = new Map();
  const allGeoIds = new Set();
  for (const row of rows) {
    const geoId = row.campaignCriterion.location.geoTargetConstant.split("/").pop();
    allGeoIds.add(geoId);
    const list = geoIdsByCampaign.get(row.campaign.id) ?? [];
    list.push(geoId);
    geoIdsByCampaign.set(row.campaign.id, list);
  }

  if (allGeoIds.size === 0) return new Map();

  const geoRows = await gaqlSearch(`
    SELECT geo_target_constant.id, geo_target_constant.country_code
    FROM geo_target_constant
    WHERE geo_target_constant.id IN (${Array.from(allGeoIds).join(",")})
  `);
  const countryCodeByGeoId = new Map(
    geoRows.map((row) => [row.geoTargetConstant.id, row.geoTargetConstant.countryCode])
  );

  const countryCodesByCampaign = new Map();
  for (const [campaignId, geoIds] of geoIdsByCampaign) {
    const codes = new Set(geoIds.map((id) => countryCodeByGeoId.get(id)).filter(Boolean));
    countryCodesByCampaign.set(campaignId, codes);
  }
  return countryCodesByCampaign;
}

// Account-wide totals for one date range, optionally scoped to a country -
// used by the week-on-week comparison view.
export async function getGnextTotals(dateRange, countryCode = null) {
  let campaigns = await getCampaignPerformance(dateRange);

  if (countryCode) {
    const countriesByCampaign = await getCampaignCountries();
    campaigns = campaigns.filter((c) => countriesByCampaign.get(c.id)?.has(countryCode));
  }

  return campaigns.reduce(
    (acc, c) => {
      acc.impressions += c.impressions;
      acc.clicks += c.clicks;
      acc.cost += c.cost;
      acc.videoViews += c.videoViews;
      return acc;
    },
    { impressions: 0, clicks: 0, cost: 0, videoViews: 0 }
  );
}
