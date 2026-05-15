function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl border border-border bg-card/70 ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <SkeletonBlock className="h-4 w-40" />
          <SkeletonBlock className="h-10 w-72 max-w-full" />
          <SkeletonBlock className="h-4 w-[34rem] max-w-full" />
        </div>
        <SkeletonBlock className="h-12 w-72 max-w-full" />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-32" />
        ))}
      </section>

      <SkeletonBlock className="h-44" />

      <section className="grid gap-5 xl:grid-cols-2">
        <SkeletonBlock className="h-80" />
        <SkeletonBlock className="h-80" />
      </section>

      <SkeletonBlock className="h-72" />
    </div>
  );
}
