import styles from "./CampaignCards.module.css";
import CampaignCard from "./CampaignCard";

export default function CampaignCards({ campaigns, variant = "standard" }) {
  if (campaigns.length === 0) {
    return <p className={styles.empty}>No campaigns found for this account.</p>;
  }

  return (
    <div className={styles.grid}>
      {campaigns.map((c) => (
        <CampaignCard key={c.id} campaign={c} variant={variant} />
      ))}
    </div>
  );
}
