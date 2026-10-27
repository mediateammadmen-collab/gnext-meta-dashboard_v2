"use client";

import { useState } from "react";
import styles from "./CampaignCard.module.css";
import CampaignDetail, { hasDrilldownContent } from "./CampaignDetail";
import { formatMoney, formatNumber, formatPercent } from "@/lib/google/format";

function StatusBadge({ status }) {
  const isEnabled = status === "ENABLED";
  return (
    <span className={styles.status}>
      <span
        className={styles.statusDot}
        style={{ background: isEnabled ? "var(--status-good)" : "var(--text-muted)" }}
      />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function Metric({ label, value }) {
  return (
    <div className={styles.metric}>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricValue}>{value}</div>
    </div>
  );
}

function Preview({ channelType, ads }) {
  if (channelType === "VIDEO") {
    const ad = ads.find((a) => a.videoId);
    if (ad) {
      return (
        <img
          src={`https://img.youtube.com/vi/${ad.videoId}/hqdefault.jpg`}
          alt="Video ad thumbnail"
          className={styles.thumbnail}
        />
      );
    }
  }

  if (channelType === "DISPLAY") {
    const ad = ads.find((a) => a.imageUrl);
    if (ad) {
      return <img src={ad.imageUrl} alt="Display ad creative" className={styles.thumbnail} />;
    }
  }

  if (channelType === "SEARCH") {
    const ad = ads.find((a) => a.headlines.length > 0);
    if (ad) {
      return (
        <div className={styles.textPreview}>
          <span className={styles.textPreviewQuote}>&ldquo;</span>
          {ad.headlines[0]}
        </div>
      );
    }
  }

  return <div className={styles.noPreview}>No creative preview available</div>;
}

export default function CampaignCard({ campaign, variant }) {
  const [expanded, setExpanded] = useState(false);
  const isVideo = variant === "video";

  const ctr = campaign.impressions ? (campaign.clicks / campaign.impressions) * 100 : 0;
  const avgCpc = campaign.clicks ? campaign.cost / campaign.clicks : 0;
  const viewRate = campaign.impressions ? (campaign.videoViews / campaign.impressions) * 100 : 0;
  const avgCpv = campaign.videoViews ? campaign.cost / campaign.videoViews : 0;

  return (
    <div className={styles.card}>
      <div className={styles.previewArea}>
        <Preview channelType={campaign.channelType} ads={campaign.ads} />
      </div>

      <div className={styles.body}>
        <div className={styles.header}>
          <h3 className={styles.name} title={campaign.name}>
            {campaign.name}
          </h3>
          <StatusBadge status={campaign.status} />
        </div>

        <div className={styles.metrics}>
          <Metric label="Impressions" value={formatNumber(campaign.impressions)} />
          {isVideo ? (
            <>
              <Metric label="Views" value={formatNumber(campaign.videoViews)} />
              <Metric label="View rate" value={formatPercent(viewRate)} />
              <Metric label="Avg. CPV" value={formatMoney(avgCpv)} />
            </>
          ) : (
            <>
              <Metric label="Clicks" value={formatNumber(campaign.clicks)} />
              <Metric label="CTR" value={formatPercent(ctr)} />
              <Metric label="Avg. CPC" value={formatMoney(avgCpc)} />
            </>
          )}
          <Metric label="Cost" value={formatMoney(campaign.cost)} />
          {campaign.conversions > 0 && (
            <Metric label="Conversions" value={formatNumber(campaign.conversions)} />
          )}
        </div>

        {hasDrilldownContent(campaign) && (
          <>
            <button type="button" className={styles.toggle} onClick={() => setExpanded((e) => !e)}>
              {expanded ? "Hide ads & keywords" : "Show ads & keywords"}
              <span className={expanded ? styles.chevronOpen : styles.chevron}>▸</span>
            </button>

            {expanded && (
              <div className={styles.detailWrap}>
                <CampaignDetail campaign={campaign} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
