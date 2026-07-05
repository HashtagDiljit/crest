export default function AchievementsLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex flex-col gap-1.5">
        <div className="h-7 w-36 rounded-r3 shimmer" />
        <div className="h-4 w-52 rounded-r3 shimmer" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-r5 border border-border bg-bg-surface p-4 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full shimmer" />
            <div className="h-4 w-20 rounded-r3 shimmer" />
            <div className="h-3 w-16 rounded-r3 shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
