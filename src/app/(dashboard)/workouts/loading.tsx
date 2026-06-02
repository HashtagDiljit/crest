export default function WorkoutsLoading() {
  return (
    <div className="flex flex-col gap-5">
      <div className="h-8 w-40 rounded-r3 shimmer" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-r5 border border-border bg-bg-surface h-48 shimmer" />
        ))}
      </div>
    </div>
  );
}
