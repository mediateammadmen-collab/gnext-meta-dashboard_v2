"use client";

import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { cn } from "@/lib/utils";

const RDP_THEME_VARS = {
  "--rdp-accent-color": "#a78bfa",
  "--rdp-accent-background-color": "rgba(167, 139, 250, 0.16)",
  "--rdp-today-color": "#a78bfa",
  "--rdp-range_middle-color": "#e4e4e7",
};

export function Calendar({ className, ...props }) {
  return (
    <DayPicker
      showOutsideDays
      style={RDP_THEME_VARS}
      className={cn("rdp-dark text-zinc-100", className)}
      {...props}
    />
  );
}
