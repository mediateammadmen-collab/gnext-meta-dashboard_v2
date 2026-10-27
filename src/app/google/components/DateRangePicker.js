"use client";

import { useEffect, useRef, useState } from "react";
import { RANGE_PRESETS, dateRangeLabel } from "@/lib/google/dateRange";
import styles from "./DateRangePicker.module.css";

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function startOfMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function buildMonthGrid(monthDate) {
  const first = startOfMonth(monthDate);
  const startWeekday = first.getUTCDay();
  const daysInMonth = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)
  ).getUTCDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), d)));
  }
  return cells;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function DateRangePicker({ range, start, end, onChange }) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(end ? new Date(`${end}T00:00:00Z`) : new Date())
  );
  const [pendingStart, setPendingStart] = useState(range === "custom" ? start : null);
  const [pendingEnd, setPendingEnd] = useState(range === "custom" ? end : null);
  const rootRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function pickPreset(key) {
    onChange({ range: key });
    setOpen(false);
  }

  function pickDay(day) {
    if (!day) return;
    const iso = isoDate(day);
    if (!pendingStart || (pendingStart && pendingEnd)) {
      setPendingStart(iso);
      setPendingEnd(null);
    } else if (iso < pendingStart) {
      setPendingStart(iso);
      setPendingEnd(null);
    } else {
      setPendingEnd(iso);
    }
  }

  function applyCustom() {
    if (!pendingStart) return;
    onChange({ range: "custom", start: pendingStart, end: pendingEnd ?? pendingStart });
    setOpen(false);
  }

  function changeMonth(delta) {
    setViewMonth((m) => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + delta, 1)));
  }

  function isInRange(day) {
    if (!day || !pendingStart) return false;
    const iso = isoDate(day);
    const endIso = pendingEnd ?? pendingStart;
    return iso >= pendingStart && iso <= endIso;
  }

  function isEndpoint(day) {
    if (!day) return false;
    const iso = isoDate(day);
    return iso === pendingStart || iso === pendingEnd;
  }

  const cells = buildMonthGrid(viewMonth);
  const monthLabel = viewMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className={styles.field} ref={rootRef}>
      <label className={styles.label}>Date range</label>
      <button type="button" className={styles.trigger} onClick={() => setOpen((o) => !o)}>
        {dateRangeLabel({ key: range, start, end })}
        <span className={styles.chevron}>▾</span>
      </button>

      {open && (
        <div className={styles.popover}>
          <div className={styles.presetList}>
            {RANGE_PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={`${styles.presetItem} ${range === p.key ? styles.presetItemActive : ""}`}
                onClick={() => pickPreset(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className={styles.calendarPane}>
            <p className={styles.calendarHint}>Pick one date for a single day, or two for a range.</p>
            <div className={styles.calendarHeader}>
              <span className={styles.monthLabel}>{monthLabel}</span>
              <div className={styles.monthNav}>
                <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month">
                  ‹
                </button>
                <button type="button" onClick={() => changeMonth(1)} aria-label="Next month">
                  ›
                </button>
              </div>
            </div>
            <div className={styles.weekdays}>
              {WEEKDAYS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className={styles.dayGrid}>
              {cells.map((day, i) => (
                <button
                  type="button"
                  key={i}
                  disabled={!day}
                  className={`${styles.day} ${isInRange(day) ? styles.dayInRange : ""} ${
                    isEndpoint(day) ? styles.dayEndpoint : ""
                  }`}
                  onClick={() => pickDay(day)}
                >
                  {day ? day.getUTCDate() : ""}
                </button>
              ))}
            </div>
            <div className={styles.calendarFooter}>
              <button
                type="button"
                className={styles.applyButton}
                onClick={applyCustom}
                disabled={!pendingStart}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
