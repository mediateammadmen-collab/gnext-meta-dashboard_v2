// Maps directly to Meta's native `date_preset` values so we can pass them
// straight through to the Graph API instead of computing since/until ourselves.
export const RANGE_OPTIONS = [
  { value: "today", label: "Today", preset: "today" },
  { value: "yesterday", label: "Yesterday", preset: "yesterday" },
  { value: "7d", label: "Last 7 days", preset: "last_7d" },
  { value: "14d", label: "Last 14 days", preset: "last_14d" },
  { value: "30d", label: "Last 30 days", preset: "last_30d" },
  { value: "90d", label: "Last 90 days", preset: "last_90d" },
  { value: "this_month", label: "This month", preset: "this_month" },
  { value: "last_month", label: "Last month", preset: "last_month" },
  { value: "lifetime", label: "Lifetime", preset: "maximum" },
  { value: "custom", label: "Custom range", preset: null },
];

export const DEFAULT_RANGE = "14d";

export const COUNTRIES = [
  { value: "all", label: "All countries", code: null },
  { value: "bangladesh", label: "Bangladesh", code: "BD" },
  { value: "nepal", label: "Nepal", code: "NP" },
  { value: "myanmar", label: "Myanmar", code: "MM" },
  { value: "mongolia", label: "Mongolia", code: "MN" },
  { value: "maldives", label: "Maldives", code: "MV" },
  { value: "bhutan", label: "Bhutan", code: "BT" },
  { value: "brunei", label: "Brunei", code: "BN" },
];

export const DEFAULT_COUNTRY = "all";

export function countryLabelFromCode(code) {
  return COUNTRIES.find((c) => c.code === code)?.label || code;
}

// Meta action_type values that roll up into "Engagements" per the product spec.
// `page_engagement` and `post_engagement` report the same underlying events
// for ad-level insights (confirmed against real account data — they're
// either exactly equal or page_engagement is a superset), so only one may
// be counted; post_engagement is what Meta Ads Manager shows as the result
// for Page Post Engagement campaigns.
export const ENGAGEMENT_ACTION_TYPES = ["post_engagement"];

export const LINK_CLICK_ACTION_TYPES = ["link_click"];

// Optional metrics surfaced only when present in the `actions` payload for
// the current selection. Each label maps to one or more candidate
// action_type strings (Meta's naming varies slightly by placement/objective).
export const EXTRA_ACTION_CANDIDATES = [
  { label: "Page likes", types: ["like", "page_like"] },
  { label: "Post reactions", types: ["post_reaction"] },
  {
    label: "Profile visits",
    types: ["ig_profile_visit", "onsite_conversion.total_profile_visit", "profile_visit"],
  },
  { label: "Comments", types: ["comment"] },
];

export const STATUS_STYLES = {
  ACTIVE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  PAUSED: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  DEFAULT: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

// Ad names encode the creative format as one of their "|"-separated
// segments (e.g. "iPhone | Static | Open Audience | ..."). Each format gets
// its own color so the badge reads at a glance next to the status badge.
export const CREATIVE_FORMAT_STYLES = {
  Static: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  Dynamic: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  Carousel: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Reel: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  "Influencer Reel": "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
  DEFAULT: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};
