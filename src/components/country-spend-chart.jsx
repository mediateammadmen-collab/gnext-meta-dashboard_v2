"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/format";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-zinc-100">{label}</p>
      <p className="text-zinc-400">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export function CountrySpendChart({ data }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis dataKey="country" stroke="#71717a" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis
            stroke="#71717a"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tickFormatter={(v) => formatCurrency(v)}
            width={70}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(167,139,250,0.08)" }} />
          <Bar dataKey="spend" fill="#a78bfa" radius={[6, 6, 0, 0]} maxBarSize={56} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
