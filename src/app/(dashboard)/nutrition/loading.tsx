export default function NutritionLoading() {
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="h-5 w-36 rounded-r3 shimmer" />
            <div className="h-3.5 w-28 rounded-r3 shimmer" />
          </div>
          <div className="h-8 w-16 rounded-r3 shimmer" />
        </div>
        <div className="h-3 rounded-pill shimmer" />
      </div>
      <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-28 rounded-r3 shimmer" />
          <div className="h-7 w-20 rounded-r3 shimmer" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 rounded-r3 shimmer" />
        ))}
      </div>
      <div className="rounded-r5 border border-border bg-bg-surface h-40 shimmer" />
    </div>
  );
}
