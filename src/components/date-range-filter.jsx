"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { RANGE_OPTIONS } from "@/lib/constants";
import { useDashboardFilters } from "@/hooks/use-dashboard-filters";
import { cn } from "@/lib/utils";

const PRESETS = RANGE_OPTIONS.filter((option) => option.value !== "custom");

function currentLabel(range, start, end) {
  if (range === "custom" && start && end) {
    try {
      if (start === end) return format(new Date(start), "MMM d, yyyy");
      return `${format(new Date(start), "MMM d, yyyy")} – ${format(new Date(end), "MMM d, yyyy")}`;
    } catch {
      return "Custom range";
    }
  }
  return RANGE_OPTIONS.find((o) => o.value === range)?.label || "Select range";
}

export function DateRangeFilter() {
  const { range, start, end, setParams, isPending } = useDashboardFilters();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() =>
    start && end ? { from: new Date(start), to: new Date(end) } : undefined
  );

  function handleOpenChange(next) {
    setOpen(next);
    if (next) {
      setDraft(start && end ? { from: new Date(start), to: new Date(end) } : undefined);
    }
  }

  function selectPreset(value) {
    setParams({ range: value, start: null, end: null });
    setOpen(false);
  }

  function applyCustomRange() {
    if (!draft?.from) return;
    setParams({
      range: "custom",
      start: format(draft.from, "yyyy-MM-dd"),
      // A single clicked date (no second click for `to`) is treated as a
      // one-day "range" so the picker doubles as a specific-date filter.
      end: format(draft.to || draft.from, "yyyy-MM-dd"),
    });
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-zinc-400">Date Range</span>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={isPending}
            className="w-64 justify-between rounded-lg border-zinc-700 bg-zinc-900 font-normal text-zinc-100"
          >
            <span className="truncate">{currentLabel(range, start, end)}</span>
            <ChevronDown className="size-4 shrink-0 text-zinc-400" />
          </Button>
        </PopoverTrigger>
        {/* Presets and the calendar are peers in one row, not nested views —
            the date picker is always visible, not tucked behind a "Custom
            range" click. */}
        <PopoverContent className="flex w-auto gap-0 p-0">
          <div className="flex w-40 flex-col gap-0.5 border-r border-zinc-800 p-1">
            {PRESETS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => selectPreset(option.value)}
                className={cn(
                  "rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-zinc-800",
                  range === option.value && "bg-zinc-800 text-white"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col p-3">
            <p className="mb-2 px-1 text-xs text-zinc-500">
              Pick one date for a single day, or two for a range.
            </p>
            <Calendar
              mode="range"
              selected={draft}
              onSelect={setDraft}
              disabled={{ after: new Date() }}
              defaultMonth={draft?.from}
            />
            <div className="flex items-center justify-end border-t border-zinc-800 pt-3">
              <Button variant="default" size="sm" disabled={!draft?.from} onClick={applyCustomRange}>
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
