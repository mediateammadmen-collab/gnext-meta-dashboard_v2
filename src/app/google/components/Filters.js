"use client";

import { useRouter, usePathname } from "next/navigation";
import DateRangePicker from "./DateRangePicker";
import { COUNTRIES } from "@/lib/google/countries";
import styles from "./Filters.module.css";

export default function Filters({ dateRange, country }) {
  const router = useRouter();
  const pathname = usePathname();

  function navigate({ range, start, end, country: nextCountry }) {
    const params = new URLSearchParams();

    const effectiveRange = range ?? dateRange.key;
    params.set("range", effectiveRange);
    if (effectiveRange === "custom") {
      params.set("start", start ?? dateRange.start);
      params.set("end", end ?? dateRange.end);
    }

    const effectiveCountry = nextCountry !== undefined ? nextCountry : country;
    if (effectiveCountry) params.set("country", effectiveCountry);

    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className={styles.filters}>
      <DateRangePicker
        range={dateRange.key}
        start={dateRange.start}
        end={dateRange.end}
        onChange={(next) => navigate(next)}
      />

      <div className={styles.field}>
        <label htmlFor="country-select" className={styles.label}>
          Country
        </label>
        <select
          id="country-select"
          className={styles.select}
          value={country ?? "all"}
          onChange={(e) => navigate({ country: e.target.value === "all" ? null : e.target.value })}
        >
          <option value="all">All countries</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
