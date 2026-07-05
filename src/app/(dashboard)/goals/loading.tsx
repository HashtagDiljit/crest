export default function GoalsLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="h-7 w-24 rounded-r3 shimmer" />
          <div className="h-4 w-52 rounded-r3 shimmer" />
        </div>
        <div className="h-9 w-24 rounded-r3 shimmer" />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-40 rounded-r3 shimmer" />
            <div className="h-5 w-16 rounded-pill shimmer" />
          </div>
          <div className="h-2 rounded-pill shimmer" />
          <div className="h-4 w-32 rounded-r3 shimmer" />
        </div>
      ))}
    </div>
  );
}
