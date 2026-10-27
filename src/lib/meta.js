import "server-only";
import {
  RANGE_OPTIONS,
  EXTRA_ACTION_CANDIDATES,
  ENGAGEMENT_ACTION_TYPES,
  INTERACTION_ACTION_TYPES,
  VIDEO_VIEW_ACTION_TYPES,
  COUNTRIES,
} from "./constants";
import { getWeekStartDate, getWeekEndDate, todayDateString } from "./weeks";

// The ad account occasionally serves stray impressions outside the markets
// we actually run campaigns in (CN, IN, LK, TH, GB, US, "unknown" have shown
// up in insights). Only the countries in the dashboard's own country filter
// are real markets, so every insights response is restricted to those.
const TRACKED_COUNTRY_CODES = new Set(COUNTRIES.map((c) => c.code).filter(Boolean));

function filterToTrackedCountries(rows) {
  return rows.filter((row) => TRACKED_COUNTRY_CODES.has(row.country));
}

const GRAPH_BASE = "https://graph.facebook.com";
const MAX_RETRIES = 4;
const MAX_PAGES = 20;
const REVALIDATE_SECONDS = 300;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Add it to .env.local (see README.md).`
    );
  }
  return value;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches a single Graph API URL with retry/backoff for rate limiting
 * (HTTP 429 and Meta's own "application request limit reached" errors)
 * and transient 5xx failures.
 */
async function fetchWithRetry(url, attempt = 0, init) {
  // POST requests (e.g. the batch endpoint) carry the access token in the
  // body, so they aren't safe to cache the way GETs are.
  const fetchInit = init ? init : { next: { revalidate: REVALIDATE_SECONDS } };
  const res = await fetch(url, fetchInit);

  if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
    if (attempt >= MAX_RETRIES) {
      throw new Error(`Meta Graph API failed after ${MAX_RETRIES} retries (HTTP ${res.status})`);
    }
    const backoffMs = 500 * 2 ** attempt + Math.random() * 250;
    await sleep(backoffMs);
    return fetchWithRetry(url, attempt + 1, init);
  }

  const body = await res.json().catch(() => null);

  if (!res.ok || body?.error) {
    const code = body?.error?.code;
    const isRateLimit = code === 4 || code === 17 || code === 32 || code === 613;
    if (isRateLimit && attempt < MAX_RETRIES) {
      const backoffMs = 500 * 2 ** attempt + Math.random() * 250;
      await sleep(backoffMs);
      return fetchWithRetry(url, attempt + 1, init);
    }
    const message = body?.error?.message || `HTTP ${res.status}`;
    throw new Error(`Meta Graph API error: ${message}`);
  }

  return body;
}

function buildUrl(path, params) {
  const apiVersion = requireEnv("META_API_VERSION");
  const accessToken = requireEnv("META_ACCESS_TOKEN");
  const url = new URL(`${GRAPH_BASE}/${apiVersion}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  }
  url.searchParams.set("access_token", accessToken);
  return url.toString();
}

/** GET a Graph API edge, following `paging.next` cursors up to MAX_PAGES. */
async function getEdge(path, params) {
  let url = buildUrl(path, params);
  const results = [];
  let pages = 0;

  while (url && pages < MAX_PAGES) {
    const body = await fetchWithRetry(url);
    if (Array.isArray(body?.data)) {
      results.push(...body.data);
    }
    url = body?.paging?.next ?? null;
    pages += 1;
  }

  return results;
}

/**
 * Executes up to 50 GET sub-requests in a single Graph API batch call
 * (POST /{version}/ with a `batch` param). Meta deprecated the root
 * `?ids=` multi-node lookup in v26.0, so this is the supported way to
 * fetch many nodes by ID without one round trip per node.
 */
async function postBatch(relativeUrls) {
  const apiVersion = requireEnv("META_API_VERSION");
  const accessToken = requireEnv("META_ACCESS_TOKEN");
  const body = new URLSearchParams();
  body.set("access_token", accessToken);
  body.set("batch", JSON.stringify(relativeUrls.map((relative_url) => ({ method: "GET", relative_url }))));

  const results = await fetchWithRetry(`${GRAPH_BASE}/${apiVersion}/`, 0, {
    method: "POST",
    body,
  });

  return results.map((entry) => {
    if (!entry || entry.code >= 400) return null;
    try {
      return JSON.parse(entry.body);
    } catch {
      return null;
    }
  });
}

export function resolveDateParams(range, start, end) {
  if (range === "custom") {
    if (!start || !end) {
      throw new Error("Custom range requires both start and end dates");
    }
    return { time_range: { since: start, until: end } };
  }
  const option = RANGE_OPTIONS.find((o) => o.value === range);
  if (!option) {
    throw new Error(`Unknown date range "${range}"`);
  }
  return { date_preset: option.preset };
}

function sumActions(actions, types) {
  if (!Array.isArray(actions)) return 0;
  return actions
    .filter((a) => types.includes(a.action_type))
    .reduce((sum, a) => sum + Number(a.value || 0), 0);
}

function numberOr0(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// Meta Ads Manager's "Results" column is whatever metric the campaign is
// actually optimizing for. We classify that from the campaign name (see
// classifyCampaignType above) rather than Meta's coarser `objective` enum,
// so the label shown next to the number always matches the campaign type
// bucket the ad is grouped under.
const PAGE_LIKE_ACTION_TYPES = ["like", "page_like"];
// "landing_page_view" is what Meta actually fires for a Page Visits
// objective (confirmed against real Page Visit campaigns in this account —
// they never populate the IG-profile-visit action types). Both kept since
// an ad optimizing for an IG profile visit instead would use those; the two
// families don't co-occur on the same ad, so summing all is safe.
const PAGE_VISIT_ACTION_TYPES = [
  "landing_page_view",
  "ig_profile_visit",
  "onsite_conversion.total_profile_visit",
  "profile_visit",
];

function resultsForCampaignType(campaignType, agg) {
  switch (campaignType) {
    case "Reach":
      return { label: "Reach", value: agg.reach };
    case "Engagement":
      return { label: "Engagement", value: agg.engagements };
    case "Traffic":
      return { label: "Link Clicks", value: agg.linkClicks };
    case "Page Visit":
      return { label: "Page Visits", value: sumActions(agg.allActions, PAGE_VISIT_ACTION_TYPES) };
    case "Page Like":
      return { label: "Page Likes", value: sumActions(agg.allActions, PAGE_LIKE_ACTION_TYPES) };
    default:
      return { label: "Results", value: agg.engagements };
  }
}

/**
 * Fetches account-level insights broken down by country.
 * Returns one row per country the account served ads in during the range.
 */
export async function getAccountInsightsByCountry(dateParams) {
  const accountId = requireEnv("META_AD_ACCOUNT_ID");
  const rows = await getEdge(`${accountId}/insights`, {
    level: "account",
    breakdowns: "country",
    fields: "spend,reach,impressions,frequency,clicks,cpm,actions",
    limit: 500,
    ...dateParams,
  });
  return filterToTrackedCountries(rows);
}

/**
 * Fetches ad-level insights broken down by country, so creatives can be
 * filtered/aggregated per selected country without relying on campaign
 * naming conventions.
 */
export async function getAdInsightsByCountry(dateParams) {
  const accountId = requireEnv("META_AD_ACCOUNT_ID");
  const rows = await getEdge(`${accountId}/insights`, {
    level: "ad",
    breakdowns: "country",
    fields: "ad_id,ad_name,spend,reach,impressions,frequency,clicks,cpm,actions",
    limit: 500,
    ...dateParams,
  });
  return filterToTrackedCountries(rows);
}

const AD_FIELDS =
  "id,name,effective_status,campaign{name,objective},adset{start_time,end_time},creative{id,object_story_spec,image_url,thumbnail_url,video_id}";

// Campaign names encode their intent (e.g. "Gnext Nepal | Reach | Sep '26")
// more reliably than Meta's `objective` enum, which collapses several
// distinct campaign types into the same OUTCOME_* value. To add a new
// recognized type later, just add an entry here — unmatched names fall
// under "Other". When a name mentions more than one keyword (e.g.
// "Engagement | Page Visit"), whichever appears first in the name wins,
// since that's consistently the segment naming the campaign's real intent.
const CAMPAIGN_TYPE_KEYWORDS = [
  { type: "Reach", pattern: /reach/i },
  { type: "Engagement", pattern: /engagement/i },
  { type: "Traffic", pattern: /traffic/i },
  { type: "Page Visit", pattern: /visit/i },
  { type: "Page Like", pattern: /like/i },
];

// Ad names encode the creative format as one of their "|"-separated
// segments (e.g. "iPhone | Static | Open Audience | ..."), with occasional
// typos ("Dyanmic", "Influcner Reel"). Patterns are anchored to the start of
// a segment so a format word mentioned mid-sentence in body copy (e.g.
// "...brings you Dynamic Island...") is never mistaken for the tag.
const CREATIVE_FORMAT_KEYWORDS = [
  { format: "Influencer Reel", pattern: /^infl\w*\s+reel\b/i },
  { format: "Reel", pattern: /^reel\b/i },
  { format: "Carousel", pattern: /^carousel\b/i },
  { format: "Dynamic", pattern: /^(dynamic|dyanmic)\b/i },
  { format: "Static", pattern: /^static\b/i },
];

function classifyCreativeFormat(adName) {
  if (!adName) return null;
  const segments = adName.split("|").map((s) => s.trim());
  for (const segment of segments) {
    const match = CREATIVE_FORMAT_KEYWORDS.find(({ pattern }) => pattern.test(segment));
    if (match) return match.format;
  }
  return null;
}

// Strips the format-tag segment out of an ad name for display, since it's
// surfaced as its own badge instead. Handles both a clean standalone
// segment ("A | Static | B" -> "A | B") and a segment missing its trailing
// delimiter ("A | Static B" -> "A | B").
function stripCreativeFormatFromName(adName) {
  if (!adName) return adName;
  const cleaned = adName
    .split("|")
    .map((segment) => {
      const trimmed = segment.trim();
      const match = CREATIVE_FORMAT_KEYWORDS.find(({ pattern }) => pattern.test(trimmed));
      return match ? trimmed.replace(match.pattern, "").trim() : trimmed;
    })
    .filter(Boolean);
  return cleaned.length > 0 ? cleaned.join(" | ") : adName;
}

function classifyCampaignType(campaignName) {
  if (!campaignName) return "Other";
  let best = null;
  for (const { type, pattern } of CAMPAIGN_TYPE_KEYWORDS) {
    const match = campaignName.match(pattern);
    if (match && (best === null || match.index < best.index)) {
      best = { type, index: match.index };
    }
  }
  return best?.type || "Other";
}

/**
 * Fetches a set of nodes by ID via the Graph API batch endpoint (up to
 * `batchSize` nodes per HTTP request), with bounded concurrency across
 * batches. This keeps the number of round trips — and exposure to
 * per-app rate limits — proportional to batches of IDs rather than to the
 * number of individual nodes.
 */
async function batchGetNodes(ids, fields, { concurrency = 4, batchSize = 50, extraParams = "" } = {}) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  const batches = [];
  for (let i = 0; i < uniqueIds.length; i += batchSize) {
    batches.push(uniqueIds.slice(i, i + batchSize));
  }

  const nodes = [];
  let cursor = 0;

  async function worker() {
    while (cursor < batches.length) {
      const batch = batches[cursor];
      cursor += 1;
      const relativeUrls = batch.map(
        (id) => `${id}?fields=${encodeURIComponent(fields)}${extraParams}`
      );
      const results = await postBatch(relativeUrls);
      for (const node of results) {
        if (node) nodes.push(node);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, batches.length) }, worker));
  return nodes;
}

/**
 * Fetches ad metadata + creative assets for a specific set of ad IDs.
 * Scoping to known ad IDs (typically the IDs that appear in a date-ranged
 * insights response) avoids paging through an account's entire ad history
 * just to render a handful of creatives that delivered in the selected
 * window.
 */
export async function getAdsByIds(ids) {
  return batchGetNodes(ids, AD_FIELDS);
}

/** Resolves real playable video URLs + posters for many video creatives at once. */
export async function getVideoSourcesForAds(videoIds) {
  const videos = await batchGetNodes(videoIds, "id,source,picture");
  return new Map(videos.map((video) => [video.id, video]));
}

/**
 * `creative.thumbnail_url`, when nested under an ad's `creative{...}` field
 * expansion, always comes back as a 64x64 crop — Meta only honors the
 * `thumbnail_width`/`thumbnail_height` sizing params when `thumbnail_url`
 * is requested on the creative node directly. This re-fetches a much
 * larger version for creatives that have no `image_url` (dynamic/PHOTO
 * creatives, and video posters), which is what the grid otherwise falls
 * back to.
 */
export async function getLargeThumbnails(creativeIds) {
  const creatives = await batchGetNodes(creativeIds, "id,thumbnail_url", {
    extraParams: "&thumbnail_width=1200&thumbnail_height=1200",
  });
  return new Map(creatives.map((creative) => [creative.id, creative.thumbnail_url]));
}

function aggregateRows(rows) {
  const spend = rows.reduce((s, r) => s + numberOr0(r.spend), 0);
  const reach = rows.reduce((s, r) => s + numberOr0(r.reach), 0);
  const impressions = rows.reduce((s, r) => s + numberOr0(r.impressions), 0);
  const clicksAll = rows.reduce((s, r) => s + numberOr0(r.clicks), 0);
  const allActions = rows.flatMap((r) => r.actions || []);
  const engagements = sumActions(allActions, ENGAGEMENT_ACTION_TYPES);
  const interactions = sumActions(allActions, INTERACTION_ACTION_TYPES);
  const videoViews = sumActions(allActions, VIDEO_VIEW_ACTION_TYPES);
  const linkClicks = sumActions(allActions, ["link_click"]);
  // Weighted averages for rate-style metrics — computed from summed raw
  // counts, not by averaging each row's own ctr/frequency, so combining
  // rows (e.g. multiple countries) stays mathematically correct.
  const frequency = reach > 0 ? impressions / reach : 0;
  // CTR (all): every click type (link clicks, likes, comments, shares,
  // photo views, etc.) divided by impressions — matches Meta Ads Manager's
  // default "CTR (all)" column, unlike link-click-only CTR.
  const ctr = impressions > 0 ? (clicksAll / impressions) * 100 : 0;
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;

  return {
    spend,
    reach,
    impressions,
    engagements,
    interactions,
    videoViews,
    linkClicks,
    frequency,
    ctr,
    cpm,
    allActions,
  };
}

export function shapeSummary(countryRows, selectedCountryCode) {
  const relevantRows = selectedCountryCode
    ? countryRows.filter((r) => r.country === selectedCountryCode)
    : countryRows;

  const agg = aggregateRows(relevantRows);
  // Both rates are by reach (unique people), stored as a 0-1 fraction.
  const engagementRate = agg.reach > 0 ? agg.engagements / agg.reach : 0;
  const interactionRate = agg.reach > 0 ? agg.interactions / agg.reach : 0;

  const extraActions = [];
  for (const candidate of EXTRA_ACTION_CANDIDATES) {
    const value = sumActions(agg.allActions, candidate.types);
    if (value > 0) {
      extraActions.push({ label: candidate.label, value });
    }
  }

  const byCountry = countryRows
    .filter((r) => r.country && r.country !== "unknown")
    .map((r) => ({
      country: r.country,
      spend: numberOr0(r.spend),
    }))
    .sort((a, b) => b.spend - a.spend);

  return {
    spend: agg.spend,
    reach: agg.reach,
    impressions: agg.impressions,
    engagements: agg.engagements,
    frequency: agg.frequency,
    engagementRate,
    interactions: agg.interactions,
    interactionRate,
    linkClicks: agg.linkClicks,
    ctr: agg.ctr,
    cpm: agg.cpm,
    extraActions,
    byCountry,
  };
}

/**
 * Merges ad metadata with per-ad, per-country insight rows into the shape
 * the creatives grid needs, filtering to ads that actually delivered for
 * the current selection and computing cost-per-engagement.
 */
export function shapeCreatives(ads, adInsightRows, selectedCountryCode, videoSources, largeThumbnails) {
  const rowsByAd = new Map();
  for (const row of adInsightRows) {
    if (selectedCountryCode && row.country !== selectedCountryCode) continue;
    const list = rowsByAd.get(row.ad_id) || [];
    list.push(row);
    rowsByAd.set(row.ad_id, list);
  }

  const creatives = [];
  for (const ad of ads) {
    const rows = rowsByAd.get(ad.id);
    if (!rows || rows.length === 0) continue;

    const agg = aggregateRows(rows);
    if (agg.impressions === 0) continue;

    const costPerEngagement = agg.engagements > 0 ? agg.spend / agg.engagements : null;
    const costPerClick = agg.linkClicks > 0 ? agg.spend / agg.linkClicks : null;
    const countries = [...new Set(rows.map((r) => r.country))].filter(
      (country) => country && country !== "unknown"
    );

    const campaignType = classifyCampaignType(ad.campaign?.name);
    const results = resultsForCampaignType(campaignType, agg);

    const creative = ad.creative || {};
    const videoId = creative.video_id;
    const video = videoId ? videoSources?.get(videoId) : null;
    const largeThumbnail = largeThumbnails?.get(creative.id) || null;

    let media;
    if (videoId) {
      media = {
        type: "video",
        videoUrl: video?.source || null,
        posterUrl: video?.picture || largeThumbnail || creative.thumbnail_url || null,
      };
    } else {
      const fallbackImage =
        creative.object_story_spec?.link_data?.picture ||
        creative.object_story_spec?.video_data?.image_url ||
        null;
      media = {
        type: "image",
        imageUrl: creative.image_url || fallbackImage || largeThumbnail || creative.thumbnail_url || null,
      };
    }

    creatives.push({
      id: ad.id,
      name: stripCreativeFormatFromName(ad.name),
      creativeFormat: classifyCreativeFormat(ad.name),
      status: ad.effective_status,
      objective: ad.campaign?.objective || null,
      campaignName: ad.campaign?.name || null,
      campaignType,
      startTime: ad.adset?.start_time || null,
      endTime: ad.adset?.end_time || null,
      countries,
      media,
      metrics: {
        spend: agg.spend,
        reach: agg.reach,
        impressions: agg.impressions,
        engagements: agg.engagements,
        // Only meaningful for video creatives; null hides the tile.
        videoViews: videoId ? agg.videoViews : null,
        linkClicks: agg.linkClicks,
        ctr: agg.ctr,
        frequency: agg.frequency,
        costPerEngagement,
        costPerClick,
        results: results.value,
        resultsLabel: results.label,
      },
    });
  }

  return creatives.sort((a, b) => b.metrics.spend - a.metrics.spend);
}

/**
 * Loads everything the main dashboard shows (summary + ad creatives),
 * scoped to one fixed week and one country, for the week-vs-week
 * comparison page. Mirrors DashboardPage's own data-loading sequence.
 */
export async function loadWeekDashboardData(weekNumber, selectedCountryCode) {
  const since = getWeekStartDate(weekNumber);
  const until = getWeekEndDate(weekNumber);

  // A week that hasn't started yet has no delivery data, and Meta's API
  // rejects a `since` date in the future outright ("(#100) since cannot be
  // in the future") — skip the fetch and return an empty result instead of
  // erroring. `until` in the future is fine; Meta just caps it to today.
  if (since > todayDateString()) {
    return {
      weekNumber,
      startDate: since,
      endDate: until,
      summary: shapeSummary([], selectedCountryCode),
      creatives: [],
    };
  }

  const dateParams = { time_range: { since, until } };

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

  const summary = shapeSummary(countryRows, selectedCountryCode);
  const creatives = shapeCreatives(ads, adInsightRows, selectedCountryCode, videoSources, largeThumbnails);

  return { weekNumber, startDate: since, endDate: until, summary, creatives };
}
