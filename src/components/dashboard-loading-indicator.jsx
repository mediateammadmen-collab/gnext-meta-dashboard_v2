"use client";

import { Loader2 } from "lucide-react";
import { useDashboardTransition } from "@/hooks/use-dashboard-filters";

export function DashboardLoadingIndicator() {
  const transition = useDashboardTransition();
  if (!transition?.isPending) return null;

  return (
    <>
      <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-zinc-800">
        <div className="h-full w-1/4 animate-[loading-bar_1.1s_ease-in-out_infinite] bg-violet-400" />
      </div>
      <div className="pointer-events-none fixed inset-x-0 top-24 z-40 flex justify-center">
        <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/90 px-4 py-2 text-sm text-zinc-200 shadow-lg backdrop-blur">
          <Loader2 className="size-4 animate-spin text-violet-400" />
          Updating dashboard…
        </div>
      </div>
    </>
  );
}
