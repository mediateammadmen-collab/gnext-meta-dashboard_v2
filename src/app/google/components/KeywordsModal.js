"use client";

import { useEffect, useState } from "react";
import { formatMoney, formatNumber, formatPercent } from "@/lib/google/format";
import styles from "./KeywordsModal.module.css";

export default function KeywordsModal({ keywords }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button type="button" className={styles.trigger} onClick={() => setOpen(true)}>
        View all {keywords.length} keyword{keywords.length === 1 ? "" : "s"}
      </button>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Keywords</h3>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Keyword</th>
                    <th>Match type</th>
                    <th className={styles.num}>Quality score</th>
                    <th className={styles.num}>Impressions</th>
                    <th className={styles.num}>Clicks</th>
                    <th className={styles.num}>CTR</th>
                    <th className={styles.num}>Cost</th>
                    <th className={styles.num}>Conversions</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((k, i) => {
                    const ctr = k.impressions ? (k.clicks / k.impressions) * 100 : 0;
                    return (
                      <tr key={i}>
                        <td>{k.text}</td>
                        <td>{k.matchType.charAt(0) + k.matchType.slice(1).toLowerCase()}</td>
                        <td className={styles.num}>{k.qualityScore ?? "–"}</td>
                        <td className={styles.num}>{formatNumber(k.impressions)}</td>
                        <td className={styles.num}>{formatNumber(k.clicks)}</td>
                        <td className={styles.num}>{formatPercent(ctr)}</td>
                        <td className={styles.num}>{formatMoney(k.cost)}</td>
                        <td className={styles.num}>{formatNumber(k.conversions)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
