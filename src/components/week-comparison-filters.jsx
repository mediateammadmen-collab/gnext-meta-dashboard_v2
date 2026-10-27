"use client";

import { ArrowLeft, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardLoadingIndicator } from "@/components/dashboard-loading-indicator";
import {
  DashboardTransitionProvider,
  useDashboardTransition,
} from "@/hooks/use-dashboard-filters";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/constants";
import { formatDateRange } from "@/lib/format";

function useWeekComparisonNavigate() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const transition = useDashboardTransition();

  const navigate = useCallback(
    (values) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(values)) {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }
      const go = () => router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      if (transition) {
        transition.startTransition(go);
      } else {
        go();
      }
    },
    [router, pathname, searchParams, transition]
  );

  return { navigate, isPending: transition?.isPending ?? false };
}

function CountryPicker({ country, onChange, disabled }) {
  const current = COUNTRIES.find((c) => c.value === country) || COUNTRIES[0];
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-zinc-400">Country</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="w-52 justify-between rounded-lg border-zinc-700 bg-zinc-900 font-normal text-zinc-100"
          >
            <span className="truncate">{current.label}</span>
            <ChevronDown className="size-4 shrink-0 text-zinc-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {COUNTRIES.map((option) => (
            <DropdownMenuItem
              key={option.value}
              active={option.value === country}
              onSelect={() => onChange(option.value)}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function WeekPicker({ label, value, options, onChange, disabled }) {
  const current = options.find((o) => o.value === value);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-zinc-400">{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="w-60 justify-between rounded-lg border-zinc-700 bg-zinc-900 font-normal text-zinc-100"
          >
            <span className="truncate">
              {current
                ? `Week ${current.value} · ${formatDateRange(current.startDate, current.endDate)}`
                : "Select week"}
            </span>
            <ChevronDown className="size-4 shrink-0 text-zinc-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <div className="max-h-72 overflow-y-auto">
            {options.map((option) => (
              <DropdownMenuItem
                key={option.value}
                active={option.value === value}
                onSelect={() => onChange(option.value)}
              >
                Week {option.value} · {formatDateRange(option.startDate, option.endDate)}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Picks are staged locally and only pushed to the URL (which triggers the
// actual data fetch) when "Show" is pressed — selecting a week shouldn't
// immediately reload the page. Picking just one week and pressing Show is
// valid too: the page then renders a single week instead of a comparison.
function WeekComparisonControls({ country, week1, week2, weekOptions }) {
  const { navigate, isPending } = useWeekComparisonNavigate();
  const [pendingCountry, setPendingCountry] = useState(country || DEFAULT_COUNTRY);
  const [pendingWeek1, setPendingWeek1] = useState(week1 ?? null);
  const [pendingWeek2, setPendingWeek2] = useState(week2 ?? null);

  return (
    <div className="relative flex flex-wrap items-end gap-4 border-b border-zinc-800 bg-zinc-950 px-6 py-4">
      <DashboardLoadingIndicator />
      <CountryPicker country={pendingCountry} onChange={setPendingCountry} disabled={isPending} />
      <WeekPicker
        label="Week 1"
        value={pendingWeek1}
        options={weekOptions}
        onChange={setPendingWeek1}
        disabled={isPending}
      />
      <WeekPicker
        label="Week 2"
        value={pendingWeek2}
        options={weekOptions}
        onChange={setPendingWeek2}
        disabled={isPending}
      />
      <Button
        type="button"
        variant="default"
        disabled={isPending || (pendingWeek1 == null && pendingWeek2 == null)}
        onClick={() => navigate({ country: pendingCountry, week1: pendingWeek1, week2: pendingWeek2 })}
      >
        Show
      </Button>
      <Link
        href="/"
        className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>
    </div>
  );
}

export function WeekComparisonFilters(props) {
  return (
    <DashboardTransitionProvider>
      <WeekComparisonControls {...props} />
    </DashboardTransitionProvider>
  );
}
