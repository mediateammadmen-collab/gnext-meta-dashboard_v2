// Week numbering matches the Meta dashboard exactly: Week 1 is fixed to this
// calendar date, and weeks before it count down through 0, -1, -2, etc.
// (see src/lib/weeks.js — kept as a separate file since this one is scoped
// to the Google Ads section, but the anchor and math must stay identical).
const WEEK_ANCHOR_DATE = "2026-09-27";
const DAY_MS = 24 * 60 * 60 * 1000;

function toUTCDate(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`);
}

export function getWeekNumber(dateStr) {
  const diffDays = Math.floor((toUTCDate(dateStr) - toUTCDate(WEEK_ANCHOR_DATE)) / DAY_MS);
  return Math.floor(diffDays / 7) + 1;
}

function getWeekStartDate(weekNumber) {
  const start = new Date(toUTCDate(WEEK_ANCHOR_DATE).getTime() + (weekNumber - 1) * 7 * DAY_MS);
  return start.toISOString().slice(0, 10);
}

function getWeekEndDate(weekNumber) {
  const end = new Date(toUTCDate(getWeekStartDate(weekNumber)).getTime() + 6 * DAY_MS);
  return end.toISOString().slice(0, 10);
}

export function weekRange(weekNumber) {
  return { start: getWeekStartDate(weekNumber), end: getWeekEndDate(weekNumber) };
}

export function describeWeek(weekNumber) {
  const { start, end } = weekRange(weekNumber);
  return { weekNumber, start, end };
}

export function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function formatShortDate(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function weekOptionLabel(weekNumber) {
  const { start, end } = weekRange(weekNumber);
  return `Week ${weekNumber} · ${formatShortDate(start)} – ${formatShortDate(end)}`;
}

// Selectable weeks for the picker: `span` weeks back and forward from the
// current week (not a fixed point), so the list always includes "now".
export function listWeekNumbers(span = 12) {
  const currentWeek = getWeekNumber(todayDateString());
  const weeks = [];
  for (let n = currentWeek + span; n >= currentWeek - span; n--) weeks.push(n);
  return weeks;
}
