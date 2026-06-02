export default function HealthLoading() {
  return (
    <div className="flex flex-col gap-5">
      <div className="h-8 w-32 rounded-r3 shimmer" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-r5 border border-border bg-bg-surface h-64 shimmer" />
        ))}
      </div>
    </div>
  );
}
