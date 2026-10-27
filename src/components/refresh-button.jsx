"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshDashboard } from "@/app/actions";
import { useDashboardTransition } from "@/hooks/use-dashboard-filters";
import { cn } from "@/lib/utils";

export function RefreshButton() {
  const shared = useDashboardTransition();
  const [localPending, startLocalTransition] = useTransition();
  const startTransition = shared?.startTransition ?? startLocalTransition;
  const isPending = shared?.isPending ?? localPending;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(async () => refreshDashboard())}
      className="gap-2 rounded-lg border-zinc-700 bg-zinc-900 text-zinc-100"
    >
      <RefreshCw className={cn("size-4", isPending && "animate-spin")} />
      Refresh
    </Button>
  );
}
