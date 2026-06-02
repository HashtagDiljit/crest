export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-5">
      {/* Page title skeleton */}
      <div className="h-8 w-48 rounded-r3 shimmer" />

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`rounded-r5 border border-border bg-bg-surface h-36 shimmer ${i === 0 || i === 4 ? "md:col-span-2" : ""}`} />
        ))}
      </div>

      {/* Heatmap skeleton */}
      <div className="rounded-r5 border border-border bg-bg-surface h-28 shimmer" />
    </div>
  );
}
