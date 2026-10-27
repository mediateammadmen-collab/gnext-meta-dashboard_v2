"use client";

import { createContext, useCallback, useContext, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_RANGE, DEFAULT_COUNTRY } from "@/lib/constants";

// Shared across the filter bar so changing the date range, the country, or
// hitting Refresh all drive the same pending state — one loading indicator
// instead of three uncoordinated ones.
const DashboardTransitionContext = createContext(null);

export function DashboardTransitionProvider({ children }) {
  const [isPending, startTransition] = useTransition();
  return (
    <DashboardTransitionContext.Provider value={{ isPending, startTransition }}>
      {children}
    </DashboardTransitionContext.Provider>
  );
}

export function useDashboardTransition() {
  return useContext(DashboardTransitionContext);
}

/**
 * Reads the current range/country/start/end filters from the URL and
 * returns a setter that patches the query string via router.replace, so
 * filter changes are shareable and survive a refresh without piling up
 * browser history entries.
 */
export function useDashboardFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const transition = useContext(DashboardTransitionContext);

  const range = searchParams.get("range") || DEFAULT_RANGE;
  const country = searchParams.get("country") || DEFAULT_COUNTRY;
  const start = searchParams.get("start") || "";
  const end = searchParams.get("end") || "";

  const setParams = useCallback(
    (patch) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const navigate = () => router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      if (transition) {
        transition.startTransition(navigate);
      } else {
        navigate();
      }
    },
    [router, pathname, searchParams, transition]
  );

  return { range, country, start, end, setParams, isPending: transition?.isPending ?? false };
}
