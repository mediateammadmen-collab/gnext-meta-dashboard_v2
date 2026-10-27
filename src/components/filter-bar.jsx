import Link from "next/link";
import { CalendarRange } from "lucide-react";
import { DateRangeFilter } from "@/components/date-range-filter";
import { CountryFilter } from "@/components/country-filter";
import { RefreshButton } from "@/components/refresh-button";
import { DashboardLoadingIndicator } from "@/components/dashboard-loading-indicator";
import { DashboardTransitionProvider } from "@/hooks/use-dashboard-filters";

export function FilterBar() {
  return (
    <DashboardTransitionProvider>
      <div className="relative flex flex-wrap items-end gap-4 border-b border-zinc-800 bg-zinc-950 px-6 py-4">
        <DashboardLoadingIndicator />
        <DateRangeFilter />
        <CountryFilter />
        <div className="ml-auto flex items-end gap-2">
          <Link
            href="/week-comparison"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800"
          >
            <CalendarRange className="size-4" />
            Week on Week Comparison
          </Link>
          <RefreshButton />
        </div>
      </div>
    </DashboardTransitionProvider>
  );
}
