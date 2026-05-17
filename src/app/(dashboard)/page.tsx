export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-5">
      <DashboardGreeting />
      <DashboardGrid />
    </div>
  );
}

function DashboardGreeting() {
  return (
    <div className="flex flex-col gap-1">
      <div className="shimmer h-8 w-48 rounded-r3" />
      <div className="shimmer h-4 w-80 rounded-r2 mt-1" />
    </div>
  );
}

function DashboardGrid() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        <WeeklyRingSkeleton />
      </div>
      <StreakCardSkeleton />

      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />

      <div className="col-span-3">
        <HeatmapSkeleton />
      </div>

      <div className="col-span-2">
        <AIInsightSkeleton />
      </div>
      <StatCardSkeleton />
    </div>
  );
}

function WeeklyRingSkeleton() {
  return (
    <div className="rounded-r5 border border-border bg-bg-surface p-5 h-48 flex items-center gap-6">
      <div className="shimmer w-32 h-32 rounded-full flex-shrink-0" />
      <div className="flex flex-col gap-3 flex-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="shimmer w-2 h-2 rounded-full" />
            <div className="shimmer h-3 flex-1 rounded-r2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StreakCardSkeleton() {
  return (
    <div className="rounded-r5 border border-border bg-bg-surface p-5 h-48 flex flex-col items-center justify-center gap-3">
      <div className="shimmer w-12 h-12 rounded-r4" />
      <div className="shimmer h-10 w-20 rounded-r3" />
      <div className="shimmer h-3 w-32 rounded-r2" />
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-r5 border border-border bg-bg-surface p-5 h-36 flex flex-col justify-between">
      <div className="shimmer h-3 w-24 rounded-r2" />
      <div className="flex items-end gap-2">
        <div className="shimmer h-8 w-16 rounded-r3" />
        <div className="shimmer h-4 w-8 rounded-r2 mb-1" />
      </div>
      <div className="shimmer h-2 w-full rounded-pill" />
    </div>
  );
}

function HeatmapSkeleton() {
  return (
    <div className="rounded-r5 border border-border bg-bg-surface p-5">
      <div className="shimmer h-3 w-32 rounded-r2 mb-4" />
      <div className="flex gap-1">
        {Array.from({ length: 26 }).map((_, w) => (
          <div key={w} className="flex flex-col gap-1 flex-1">
            {Array.from({ length: 7 }).map((_, d) => (
              <div key={d} className="shimmer aspect-square rounded-r1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function AIInsightSkeleton() {
  return (
    <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="shimmer w-6 h-6 rounded-r3" />
        <div className="shimmer h-4 w-56 rounded-r2" />
      </div>
      <div className="shimmer h-3 w-full rounded-r2" />
      <div className="shimmer h-3 w-4/5 rounded-r2" />
      <div className="shimmer h-8 w-28 rounded-r3 mt-1" />
    </div>
  );
}
