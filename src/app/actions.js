"use server";

import { revalidatePath } from "next/cache";

/** Busts the 5-minute Graph API cache so the Refresh button gets live data, not a stale hit. */
export async function refreshDashboard() {
  revalidatePath("/");
}
