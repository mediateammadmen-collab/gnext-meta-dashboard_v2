"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, retry }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <h2 className="text-lg font-semibold text-zinc-100">Couldn&apos;t load the dashboard</h2>
      <p className="max-w-md text-sm text-zinc-400">
        {error?.message || "Something went wrong talking to the Meta Marketing API."}
      </p>
      <Button variant="outline" onClick={() => retry()} className="mt-2">
        Try again
      </Button>
    </div>
  );
}
