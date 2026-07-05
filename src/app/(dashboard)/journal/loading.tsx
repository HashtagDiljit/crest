export default function JournalLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="h-7 w-28 rounded-r3 shimmer" />
          <div className="h-4 w-48 rounded-r3 shimmer" />
        </div>
        <div className="h-9 w-28 rounded-r3 shimmer" />
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-3">
          <div className="h-4 w-24 rounded-r3 shimmer" />
          <div className="h-16 rounded-r3 shimmer" />
        </div>
      ))}
    </div>
  );
}
