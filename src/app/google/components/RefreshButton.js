"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={handleClick}
      className="gap-2 rounded-lg border-zinc-700 bg-zinc-900 text-zinc-100"
    >
      <RefreshCw className={cn("size-4", isPending && "animate-spin")} />
      {isPending ? "Refreshing…" : "Refresh"}
    </Button>
  );
}
