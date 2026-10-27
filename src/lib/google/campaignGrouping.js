const CHANNEL_TYPE_ORDER = [
  "SEARCH",
  "PERFORMANCE_MAX",
  "SHOPPING",
  "DISPLAY",
  "VIDEO",
  "DEMAND_GEN",
  "DISCOVERY",
  "LOCAL",
  "SMART",
  "MULTI_CHANNEL",
];

const CHANNEL_TYPE_LABELS = {
  SEARCH: "Search",
  PERFORMANCE_MAX: "Performance Max",
  SHOPPING: "Shopping",
  DISPLAY: "Display",
  VIDEO: "Video",
  DEMAND_GEN: "Demand Gen",
  DISCOVERY: "Demand Gen",
  LOCAL: "Local",
  SMART: "Smart",
  MULTI_CHANNEL: "Multi-channel",
};

export function channelTypeLabel(channelType) {
  return (
    CHANNEL_TYPE_LABELS[channelType] ??
    channelType
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

// Campaigns follow a "Brand | ..." or "Brand ..." naming convention in this
// account (e.g. "Gnext Search | Mongolia", "Jac T9 | Video views ..."), with
// no Google Ads labels applied to group them structurally. This heuristic
// takes the first word before the first "|" as the brand.
export function getBrand(campaignName) {
  const segment = campaignName.split("|")[0].trim();
  const firstWord = segment.split(/\s+/)[0];
  return firstWord || "Other";
}

export function groupByBrand(campaigns) {
  const groups = new Map();
  for (const c of campaigns) {
    const brand = getBrand(c.name);
    const group = groups.get(brand) ?? {
      brand,
      campaignCount: 0,
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
    };
    group.campaignCount += 1;
    group.impressions += c.impressions;
    group.clicks += c.clicks;
    group.cost += c.cost;
    group.conversions += c.conversions;
    groups.set(brand, group);
  }
  return Array.from(groups.values()).sort((a, b) => b.cost - a.cost);
}

export function aggregateTrend(trendRows, brandFilter = null) {
  const byDate = new Map();
  for (const row of trendRows) {
    if (brandFilter && getBrand(row.campaignName) !== brandFilter) continue;
    const entry = byDate.get(row.date) ?? {
      date: row.date,
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
    };
    entry.impressions += row.impressions;
    entry.clicks += row.clicks;
    entry.cost += row.cost;
    entry.conversions += row.conversions;
    byDate.set(row.date, entry);
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// Precomputes everything a brand's dropdown entry needs: its totals, its own
// trend series, and its campaigns split into channel-type tables.
export function buildBrandTabs(campaigns, trendRows) {
  const brandGroups = groupByBrand(campaigns);

  return brandGroups.map((group) => {
    // Totals/brand list keep every campaign (so a brand with a quiet period
    // stays selectable) - only the campaign tables drop zero-activity rows.
    const brandCampaigns = campaigns
      .filter((c) => getBrand(c.name) === group.brand)
      .filter((c) => c.impressions > 0);
    return {
      key: group.brand,
      label: group.brand,
      totals: {
        impressions: group.impressions,
        clicks: group.clicks,
        cost: group.cost,
        conversions: group.conversions,
      },
      trend: aggregateTrend(trendRows, group.brand),
      channelGroups: groupByChannelType(brandCampaigns),
    };
  });
}

export function groupByChannelType(campaigns) {
  const groups = new Map();
  for (const c of campaigns) {
    const list = groups.get(c.channelType) ?? [];
    list.push(c);
    groups.set(c.channelType, list);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => {
      const ai = CHANNEL_TYPE_ORDER.indexOf(a);
      const bi = CHANNEL_TYPE_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .map(([channelType, group]) => ({ channelType, campaigns: group }));
}
