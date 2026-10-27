"use client";

import { Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge, FormatBadge } from "@/components/ui/badge";
import { AdMetricsGrid } from "@/components/ad-metrics-grid";
import { countryLabelFromCode } from "@/lib/constants";
import { formatDateRange, prettifyObjective } from "@/lib/format";

export function AdModal({ creative, open, onOpenChange }) {
  if (!creative) return null;
  const countryLabel = creative.countries.map(countryLabelFromCode).join(", ") || "Unknown";
  const dateRange = formatDateRange(creative.startTime, creative.endTime);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="overflow-hidden rounded-lg bg-black">
          {creative.media.type === "video" ? (
            <video
              src={creative.media.videoUrl || undefined}
              poster={creative.media.posterUrl || undefined}
              controls
              autoPlay
              muted
              className="max-h-[70vh] w-full object-contain"
            />
          ) : creative.media.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Meta CDN URLs are signed and expire.
            <img
              src={creative.media.imageUrl}
              alt={creative.name}
              className="max-h-[70vh] w-full object-contain"
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
              No preview available
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-4">
          <DialogTitle className="text-lg font-semibold text-zinc-50">
            {creative.name}
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={creative.status} />
            <FormatBadge format={creative.creativeFormat} />
            <span className="text-sm text-zinc-400">
              {countryLabel} · {prettifyObjective(creative.objective)}
            </span>
            {dateRange ? (
              <span className="flex items-center gap-1 text-sm text-zinc-400">
                <Calendar className="size-3.5 shrink-0" />
                {dateRange}
              </span>
            ) : null}
          </div>
          <AdMetricsGrid metrics={creative.metrics} campaignType={creative.campaignType} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
