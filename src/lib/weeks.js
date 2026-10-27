// Week 1 is fixed to this calendar date by business rule, not derived from
// account data. Weeks before it count down through 0, -1, -2, etc., rather
// than starting at 1.
const WEEK_ANCHOR_DATE = "2026-09-27";
const DAY_MS = 24 * 60 * 60 * 1000;

function toUTCDate(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`);
}

export function getWeekNumber(dateStr) {
  const diffDays = Math.floor((toUTCDate(dateStr) - toUTCDate(WEEK_ANCHOR_DATE)) / DAY_MS);
  return Math.floor(diffDays / 7) + 1;
}

export function getWeekStartDate(weekNumber) {
  const start = new Date(toUTCDate(WEEK_ANCHOR_DATE).getTime() + (weekNumber - 1) * 7 * DAY_MS);
  return start.toISOString().slice(0, 10);
}

export function getWeekEndDate(weekNumber) {
  const end = new Date(toUTCDate(getWeekStartDate(weekNumber)).getTime() + 6 * DAY_MS);
  return end.toISOString().slice(0, 10);
}

export function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

// Selectable weeks for the week-vs-week comparison picker: a couple of
// years back (plenty of account history) through a few weeks into the
// future (so Week 1 onward is pickable in advance, even before it starts).
const WEEKS_BACK = 104;
const WEEKS_FORWARD = 6;

export function buildWeekOptions() {
  const currentWeek = getWeekNumber(todayDateString());
  const options = [];
  for (let n = currentWeek + WEEKS_FORWARD; n >= currentWeek - WEEKS_BACK; n--) {
    options.push({
      value: n,
      label: `Week ${n}`,
      startDate: getWeekStartDate(n),
      endDate: getWeekEndDate(n),
    });
  }
  return options;
}
