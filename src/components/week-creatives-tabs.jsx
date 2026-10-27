"use client";

import { useState } from "react";
import { AdCreativesGrid } from "@/components/ad-creatives-grid";
import { formatDateRange } from "@/lib/format";
import { cn } from "@/lib/utils";

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative shrink-0 px-4 py-2 text-sm font-medium transition-colors",
        active ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
      )}
    >
      {children}
      {active ? <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-violet-400" /> : null}
    </button>
  );
}

export function WeekCreativesTabs({ weekAData, weekBData }) {
  const [active, setActive] = useState("A");
  const current = active === "A" ? weekAData : weekBData;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-800 px-6 py-6">
      <h2 className="text-lg font-semibold text-zinc-100">Ad creatives</h2>
      <div className="flex flex-wrap items-center gap-1 border-b border-zinc-800">
        <TabButton active={active === "A"} onClick={() => setActive("A")}>
          First week <span className="text-zinc-500">· Week {weekAData.weekNumber}</span>
        </TabButton>
        <TabButton active={active === "B"} onClick={() => setActive("B")}>
          Second week <span className="text-zinc-500">· Week {weekBData.weekNumber}</span>
        </TabButton>
      </div>
      <p className="text-xs text-zinc-500">{formatDateRange(current.startDate, current.endDate)}</p>
      <AdCreativesGrid creatives={current.creatives} />
    </section>
  );
}
