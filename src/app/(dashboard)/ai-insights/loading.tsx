export default function AiInsightsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <div className="h-7 w-32 rounded-r3 shimmer" />
        <div className="h-4 w-56 rounded-r3 shimmer" />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-r3 shimmer" />
            <div className="h-5 w-40 rounded-r3 shimmer" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-4 rounded-r3 shimmer" />
            <div className="h-4 w-4/5 rounded-r3 shimmer" />
            <div className="h-4 w-3/5 rounded-r3 shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
