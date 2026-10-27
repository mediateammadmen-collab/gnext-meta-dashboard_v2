import { cn } from "@/lib/utils";
import { STATUS_STYLES, CREATIVE_FORMAT_STYLES } from "@/lib/constants";

export function StatusBadge({ status, className }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.DEFAULT;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        style,
        className
      )}
    >
      {status?.toLowerCase().replace(/_/g, " ") || "unknown"}
    </span>
  );
}

export function FormatBadge({ format, className }) {
  if (!format) return null;
  const style = CREATIVE_FORMAT_STYLES[format] || CREATIVE_FORMAT_STYLES.DEFAULT;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        style,
        className
      )}
    >
      {format}
    </span>
  );
}
