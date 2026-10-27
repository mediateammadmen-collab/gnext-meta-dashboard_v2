export function formatMoney(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatNumber(n) {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

export function formatCompact(n) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function formatPercent(n, digits = 2) {
  return `${n.toFixed(digits)}%`;
}
