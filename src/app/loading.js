function CardSkeleton() {
  return <div className="h-24 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900" />;
}

function TileSkeleton() {
  return <div className="h-16 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/60" />;
}

function CreativeSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="aspect-square w-full animate-pulse bg-zinc-950" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-800" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-end gap-4 border-b border-zinc-800 bg-zinc-950 px-6 py-4">
        <div className="h-16 w-64 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900" />
        <div className="h-16 w-52 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900" />
      </div>
      <div className="flex flex-col gap-4 px-6 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <TileSkeleton key={i} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 px-6 pb-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CreativeSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
