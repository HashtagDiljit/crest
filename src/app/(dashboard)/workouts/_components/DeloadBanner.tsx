import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface Props {
  weekCount: number;
}

export function DeloadBanner({ weekCount }: Props) {
  return (
    <div className="rounded-r4 border border-[var(--color-warning)] bg-[rgba(245,158,11,0.08)] px-5 py-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="text-warning flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-display text-14 font-semibold text-text-primary">
            Deload week due — week {weekCount} completed
          </p>
          <p className="text-12 text-text-secondary mt-0.5">
            Reduce all working weights by 40% this week to let your body recover and adapt.
          </p>
        </div>
      </div>
      <Link
        href="/workouts/start?deload=1"
        className="flex-shrink-0 px-4 py-2 rounded-r3 bg-warning text-bg-base text-12 font-semibold hover:opacity-90 transition-opacity"
      >
        Start deload week
      </Link>
    </div>
  );
}
