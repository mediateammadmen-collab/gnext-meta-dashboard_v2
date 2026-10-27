import styles from "./CampaignDetail.module.css";
import { formatNumber, formatMoney } from "@/lib/google/format";
import KeywordsModal from "./KeywordsModal";

function hasVideo(ads) {
  return ads.some((ad) => ad.videoId);
}
function hasImage(ads) {
  return ads.some((ad) => ad.imageUrl);
}
function hasAdCopy(ads) {
  return ads.some((ad) => ad.headlines.length > 0 || ad.descriptions.length > 0);
}

// Whether there's anything at all to reveal in an expanded/detail view -
// used to decide whether to show a "show more" affordance in the first place.
export function hasDrilldownContent(campaign) {
  return (
    hasVideo(campaign.ads) ||
    hasImage(campaign.ads) ||
    hasAdCopy(campaign.ads) ||
    campaign.keywords.length > 0
  );
}

function AdMeta({ ad }) {
  return (
    <div className={styles.adMeta}>
      {formatNumber(ad.impressions)} impr · {formatNumber(ad.clicks)} clicks · {formatMoney(ad.cost)}
    </div>
  );
}

function VideoEngagement({ ad }) {
  return (
    <div className={styles.adMeta}>
      {formatNumber(ad.likes)} likes · {formatNumber(ad.shares)} shares ·{" "}
      {formatNumber(ad.comments)} comments
    </div>
  );
}

function AdCopyList({ ads }) {
  const withCopy = ads.filter((ad) => ad.headlines.length > 0 || ad.descriptions.length > 0);
  return (
    <div className={styles.adList}>
      {withCopy.map((ad) => (
        <div key={ad.adId} className={styles.adCard}>
          <AdMeta ad={ad} />
          <div className={styles.chipGroup}>
            {ad.headlines.map((text, i) => (
              <span key={i} className={styles.chip}>
                {text}
              </span>
            ))}
          </div>
          <div className={styles.chipGroup}>
            {ad.descriptions.map((text, i) => (
              <span key={i} className={`${styles.chip} ${styles.chipDescription}`}>
                {text}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function VideoCreativeList({ ads }) {
  const withVideo = ads.filter((ad) => ad.videoId);
  return (
    <div className={styles.creativeGrid}>
      {withVideo.map((ad) => (
        <a
          key={ad.adId}
          href={`https://www.youtube.com/watch?v=${ad.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.creativeCard}
        >
          <img
            src={`https://img.youtube.com/vi/${ad.videoId}/hqdefault.jpg`}
            alt="Video ad thumbnail"
            className={styles.thumbnail}
          />
          <AdMeta ad={ad} />
          <VideoEngagement ad={ad} />
        </a>
      ))}
    </div>
  );
}

function ImageCreativeList({ ads }) {
  const withImage = ads.filter((ad) => ad.imageUrl);
  return (
    <div className={styles.creativeGrid}>
      {withImage.map((ad) => (
        <div key={ad.adId} className={styles.creativeCard}>
          <img src={ad.imageUrl} alt="Display ad creative" className={styles.thumbnail} />
          <AdMeta ad={ad} />
        </div>
      ))}
    </div>
  );
}

export default function CampaignDetail({ campaign }) {
  const { channelType, ads, keywords } = campaign;

  return (
    <div className={styles.detail}>
      {channelType === "VIDEO" && hasVideo(ads) && (
        <div className={styles.block}>
          <h4 className={styles.blockTitle}>Video creative</h4>
          <VideoCreativeList ads={ads} />
        </div>
      )}

      {channelType === "DISPLAY" && hasImage(ads) && (
        <div className={styles.block}>
          <h4 className={styles.blockTitle}>Image creative</h4>
          <ImageCreativeList ads={ads} />
        </div>
      )}

      {channelType === "SEARCH" && hasAdCopy(ads) && (
        <div className={styles.block}>
          <h4 className={styles.blockTitle}>Ad copy</h4>
          <AdCopyList ads={ads} />
        </div>
      )}

      {channelType === "SEARCH" && keywords.length > 0 && (
        <div className={styles.block}>
          <h4 className={styles.blockTitle}>Keywords</h4>
          <KeywordsModal keywords={keywords} />
        </div>
      )}

      {channelType === "PERFORMANCE_MAX" && (
        <p className={styles.empty}>
          Performance Max uses asset groups rather than standard ads - creative-level data for
          this channel isn&apos;t wired up yet.
        </p>
      )}
    </div>
  );
}
