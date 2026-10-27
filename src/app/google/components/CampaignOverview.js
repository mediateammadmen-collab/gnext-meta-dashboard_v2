import StatTile from "./StatTile";
import TrendChart from "./TrendChart";
import CampaignCards from "./CampaignCards";
import { channelTypeLabel } from "@/lib/google/campaignGrouping";
import { formatMoney, formatCompact } from "@/lib/google/format";
import styles from "./CampaignOverview.module.css";

export default function CampaignOverview({ tab }) {
  if (!tab) {
    return <p className={styles.empty}>No campaigns match the current filters.</p>;
  }

  return (
    <div className={styles.panel}>
      <section className={styles.stats}>
        <StatTile label="Spend" value={formatMoney(tab.totals.cost)} />
        <StatTile label="Impressions" value={formatCompact(tab.totals.impressions)} />
        <StatTile label="Clicks" value={formatCompact(tab.totals.clicks)} />
        {tab.totals.conversions > 0 && (
          <StatTile label="Conversions" value={formatCompact(tab.totals.conversions)} />
        )}
      </section>

      <section className={styles.charts}>
        <TrendChart title="Spend" data={tab.trend} metric="cost" format="currency" />
        <TrendChart title="Clicks" data={tab.trend} metric="clicks" format="number" />
      </section>

      {tab.channelGroups.map(({ channelType, campaigns }) => (
        <section className={styles.tableSection} key={channelType}>
          <h2 className={styles.sectionTitle}>{channelTypeLabel(channelType)} campaigns</h2>
          <CampaignCards
            campaigns={campaigns}
            variant={channelType === "VIDEO" ? "video" : "standard"}
          />
        </section>
      ))}
    </div>
  );
}
