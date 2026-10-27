"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COUNTRIES } from "@/lib/constants";
import { useDashboardFilters } from "@/hooks/use-dashboard-filters";

export function CountryFilter() {
  const { country, setParams, isPending } = useDashboardFilters();
  const current = COUNTRIES.find((c) => c.value === country) || COUNTRIES[0];

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-zinc-400">Country</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={isPending}
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
              onSelect={() => setParams({ country: option.value })}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
