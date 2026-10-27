const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("en-US");

// Cost-per-engagement on a cheap, high-engagement ad is routinely a
// fraction of a cent (e.g. $0.00018) — the standard 2-decimal formatter
// rounds all of those down to an indistinguishable "$0.00", which defeats
// ranking by this metric. Below one cent, fall back to 2 significant
// figures instead of 2 decimal places.
const microCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumSignificantDigits: 2,
});

export function formatCurrency(value) {
  return currencyFormatter.format(value || 0);
}

export function formatSmallCurrency(value) {
  if (value == null) return "—";
  if (value > 0 && value < 0.01) {
    return microCurrencyFormatter.format(value);
  }
  return formatCurrency(value);
}

export function formatCompactNumber(value) {
  return compactFormatter.format(value || 0);
}

export function formatNumber(value) {
  return numberFormatter.format(Math.round(value || 0));
}

export function formatPercent(value, digits = 2) {
  return `${(value || 0).toFixed(digits)}%`;
}

export function formatDecimal(value, digits = 2) {
  return (value || 0).toFixed(digits);
}

export function formatDateRange(startTime, endTime) {
  if (!startTime && !endTime) return null;
  const start = startTime ? dateFormatter.format(new Date(startTime)) : "Unknown";
  const end = endTime ? dateFormatter.format(new Date(endTime)) : "Ongoing";
  return `${start} – ${end}`;
}

export function prettifyObjective(objective) {
  if (!objective) return "Unknown";
  return objective
    .replace(/^OUTCOME_/, "")
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}
