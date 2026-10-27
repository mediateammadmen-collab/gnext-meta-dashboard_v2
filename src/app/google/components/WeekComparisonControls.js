"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { COUNTRIES } from "@/lib/google/countries";
import { listWeekNumbers, weekOptionLabel } from "@/lib/google/weeks";
import styles from "./WeekComparisonControls.module.css";

export default function WeekComparisonControls({ country, week1, week2 }) {
  const router = useRouter();
  const [pendingCountry, setPendingCountry] = useState(country ?? "all");
  const [pendingWeek1, setPendingWeek1] = useState(week1);
  const [pendingWeek2, setPendingWeek2] = useState(week2);

  const weekNumbers = listWeekNumbers();

  function handleShow() {
    const params = new URLSearchParams();
    if (pendingCountry !== "all") params.set("country", pendingCountry);
    params.set("week1", String(pendingWeek1));
    params.set("week2", String(pendingWeek2));
    router.push(`/google/week-comparison?${params.toString()}`);
  }

  return (
    <div className={styles.controls}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="wc-country">
          Country
        </label>
        <select
          id="wc-country"
          className={styles.select}
          value={pendingCountry}
          onChange={(e) => setPendingCountry(e.target.value)}
        >
          <option value="all">All countries</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="wc-week1">
          Week 1
        </label>
        <select
          id="wc-week1"
          className={styles.select}
          value={pendingWeek1}
          onChange={(e) => setPendingWeek1(Number(e.target.value))}
        >
          {weekNumbers.map((w) => (
            <option key={w} value={w}>
              {weekOptionLabel(w)}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="wc-week2">
          Week 2
        </label>
        <select
          id="wc-week2"
          className={styles.select}
          value={pendingWeek2}
          onChange={(e) => setPendingWeek2(Number(e.target.value))}
        >
          {weekNumbers.map((w) => (
            <option key={w} value={w}>
              {weekOptionLabel(w)}
            </option>
          ))}
        </select>
      </div>

      <button type="button" className={styles.showButton} onClick={handleShow}>
        Show
      </button>

      <Link href="/google" className={styles.backLink}>
        &larr; Back to dashboard
      </Link>
    </div>
  );
}
