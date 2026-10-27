"use client";

import { Calendar } from "lucide-react";
import { StatusBadge, FormatBadge } from "@/components/ui/badge";
import { AdMetricsGrid } from "@/components/ad-metrics-grid";
import { countryLabelFromCode } from "@/lib/constants";
import { formatDateRange, prettifyObjective } from "@/lib/format";

export function AdCard({ creative, onClick, highlightCostPerEngagement }) {
  const countryLabel = creative.countries.map(countryLabelFromCode).join(", ") || "Unknown";
  const dateRange = formatDateRange(creative.startTime, creative.endTime);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 text-left transition-colors hover:border-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
    >
      <div className="aspect-square w-full overflow-hidden bg-zinc-950">
        {creative.media.type === "video" ? (
          <video
            src={creative.media.videoUrl || undefined}
            poster={creative.media.posterUrl || undefined}
            controls
            className="size-full object-cover"
          />
        ) : creative.media.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Meta CDN URLs are signed and expire.
          <img
            src={creative.media.imageUrl}
            alt={creative.name}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-zinc-600">
            No preview
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="line-clamp-3 text-sm font-semibold text-zinc-100">{creative.name}</p>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={creative.status} />
          <FormatBadge format={creative.creativeFormat} />
        </div>
        <AdMetricsGrid
          metrics={creative.metrics}
          campaignType={creative.campaignType}
          highlightCostPerEngagement={highlightCostPerEngagement}
        />
        <div className="mt-auto flex flex-col gap-1">
          <p className="truncate text-xs text-zinc-500">
            {countryLabel} · {prettifyObjective(creative.objective)}
          </p>
          {dateRange ? (
            <p className="flex items-center gap-1 text-xs text-zinc-500">
              <Calendar className="size-3 shrink-0" />
              <span className="truncate">{dateRange}</span>
            </p>
          ) : null}
        </div>
      </div>
    </button>
  );
}
