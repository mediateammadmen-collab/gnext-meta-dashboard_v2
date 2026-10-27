import Image from "next/image";
import Link from "next/link";
import { AppSwitcherButton } from "@/components/app-switcher-button";

export function DashboardHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950 px-6 py-5">
      <Link
        href="/"
        aria-label="Go to home"
        className="flex items-center gap-4 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
      >
        <div className="bg-white rounded px-1">
          <Image
            src="/gnext.png"
            alt="GNext"
            width={127}
            height={41}
            priority
          />
        </div>
        <div className="hidden h-8 w-px bg-zinc-800 sm:block" />
        <div className="hidden flex-col sm:flex">
          <h1 className="text-sm font-semibold text-zinc-100">
            Ads Performance Dashboard
          </h1>
          <p className="text-xs text-zinc-500">
            Real-time spend, reach, and creative insights from Meta.
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        <AppSwitcherButton />
        <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-zinc-400">Live data</span>
        </div>
      </div>
    </header>
  );
}
