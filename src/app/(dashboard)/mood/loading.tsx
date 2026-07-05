export default function MoodLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex flex-col gap-1.5">
        <div className="h-7 w-32 rounded-r3 shimmer" />
        <div className="h-4 w-56 rounded-r3 shimmer" />
      </div>
      <div className="rounded-r5 border border-border bg-bg-surface p-5 h-48 shimmer" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-r5 border border-border bg-bg-surface h-36 shimmer" />
        ))}
      </div>
    </div>
  );
}
