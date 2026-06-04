export default function HabitsLoading() {
  return (
    <div className="flex flex-col gap-5">
      <div className="h-8 w-32 rounded-r3 shimmer" />
      <div className="flex flex-col gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-r4 border border-border bg-bg-surface h-16 shimmer" />
        ))}
      </div>
    </div>
  );
}
