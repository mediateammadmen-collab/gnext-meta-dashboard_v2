import styles from "./StatTile.module.css";

export default function StatTile({ label, value }) {
  return (
    <div className={styles.tile}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
    </div>
  );
}
