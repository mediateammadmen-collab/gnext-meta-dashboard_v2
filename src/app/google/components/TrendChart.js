"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function formatValue(value, format) {
  if (format === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function formatDate(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Styled to match the Meta dashboard's CountrySpendChart exactly (same
// tooltip card, grid, and accent color) even though this one plots a daily
// trend line rather than a per-country bar.
function ChartTooltip({ active, payload, label, format }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-zinc-100">{formatDate(label)}</p>
      <p className="text-zinc-400">{formatValue(payload[0].value, format)}</p>
    </div>
  );
}

export default function TrendChart({ title, data, metric, format }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="mb-4 text-sm text-zinc-400">{title}</p>
      {data.length === 0 ? (
        <div className="flex h-72 items-center justify-center text-sm text-zinc-500">
          No data for this period
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#71717a"
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <YAxis
                stroke="#71717a"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tickFormatter={(v) => formatValue(v, format)}
                width={70}
              />
              <Tooltip
                content={<ChartTooltip format={format} />}
                cursor={{ stroke: "#a78bfa", strokeWidth: 1, strokeDasharray: "3 3" }}
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke="#a78bfa"
                strokeWidth={2}
                fill="#a78bfa"
                fillOpacity={0.12}
                dot={false}
                activeDot={{ r: 5, fill: "#a78bfa", stroke: "#18181b", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
