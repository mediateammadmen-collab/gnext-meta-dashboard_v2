export const RANGE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 days" },
  { key: "last14", label: "Last 14 days" },
  { key: "last30", label: "Last 30 days" },
  { key: "last90", label: "Last 90 days" },
  { key: "thismonth", label: "This month" },
  { key: "lastmonth", label: "Last month" },
  { key: "lifetime", label: "Lifetime" },
];

const PRESET_LABELS = Object.fromEntries(RANGE_PRESETS.map((p) => [p.key, p.label]));

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(offset) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - offset);
  return isoDate(d);
}

// searchParams -> { key, start, end } where start/end are ISO date strings,
// or both null for "lifetime" (no date restriction at all).
export function resolveDateRange(searchParams) {
  const key = searchParams?.range ?? "last30";

  if (key === "custom" && searchParams?.start) {
    const start = searchParams.start;
    const end = searchParams.end ?? searchParams.start;
    return { key: "custom", start, end };
  }

  switch (key) {
    case "today":
      return { key, start: daysAgo(0), end: daysAgo(0) };
    case "yesterday":
      return { key, start: daysAgo(1), end: daysAgo(1) };
    case "last7":
      return { key, start: daysAgo(6), end: daysAgo(0) };
    case "last14":
      return { key, start: daysAgo(13), end: daysAgo(0) };
    case "last90":
      return { key, start: daysAgo(89), end: daysAgo(0) };
    case "thismonth": {
      const now = new Date();
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      return { key, start: isoDate(start), end: daysAgo(0) };
    }
    case "lastmonth": {
      const now = new Date();
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
      return { key, start: isoDate(start), end: isoDate(end) };
    }
    case "lifetime":
      // Google Ads requires an explicit date filter on any query that selects
      // segments.date, so "lifetime" uses a fixed wide range rather than no
      // filter at all.
      return { key, start: "2000-01-01", end: daysAgo(0) };
    case "last30":
    default:
      return { key: "last30", start: daysAgo(29), end: daysAgo(0) };
  }
}

export function dateRangeLabel(range) {
  if (range.key === "custom") {
    return range.start === range.end ? range.start : `${range.start} – ${range.end}`;
  }
  return PRESET_LABELS[range.key] ?? "Last 30 days";
}
