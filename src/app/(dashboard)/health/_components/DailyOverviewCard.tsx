"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Footprints, Heart, Activity } from "lucide-react";
import type { SleepLogRow, ReadinessRow, BodyMeasurementRow, MetricRow } from "../actions";
import { LogSleepModal } from "./LogSleepModal";

interface Props {
  todaySleep: SleepLogRow | null;
  todayReadiness: ReadinessRow | null;
  todayMeasurement: BodyMeasurementRow | null;
  latestHr: MetricRow | null;
}

function computeWellbeing(sleep: SleepLogRow | null, readiness: ReadinessRow | null): number {
  let score = 0;
  if (sleep?.duration_hrs) {
    const hrs = sleep.duration_hrs;
    score += hrs >= 8 ? 40 : hrs >= 6 ? 25 : 10;
  }
  if (readiness?.score) {
    score += Math.round((readiness.score / 10) * 40);
  }
  const steps = 0; // steps component
  score += Math.min(20, steps);
  return Math.min(100, score);
}

function aiSummary(sleep: SleepLogRow | null, readiness: ReadinessRow | null): string {
  const dur = sleep?.duration_hrs ?? 0;
  const r = readiness?.score ?? 0;
  if (dur >= 8 && r >= 8) return "Solid sleep and high readiness — great day to train hard.";
  if (dur >= 7 && r >= 6) return "Good recovery. You're on track today.";
  if (dur < 6) return "Short sleep detected — consider a lighter session today.";
  if (r < 5) return "Low readiness — focus on recovery and technique work.";
  return "Log more data to get personalised insights.";
}

export function DailyOverviewCard({ todaySleep, todayReadiness, todayMeasurement, latestHr }: Props) {
  const router = useRouter();
  const [showSleep, setShowSleep] = useState(false);
  const wellbeing = computeWellbeing(todaySleep, todayReadiness);
  const circumference = 2 * Math.PI * 42;
  const dash = (wellbeing / 100) * circumference;

  return (
    <>
      <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-4">
        <h2 className="font-display text-15 font-semibold text-text-primary">Daily overview</h2>
        <div className="flex items-center gap-6 overflow-x-auto overscroll-x-contain" style={{ touchAction: "pan-x" }}>
          {/* Wellbeing ring */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <svg width="104" height="104" viewBox="0 0 104 104">
              <circle cx="52" cy="52" r="42" fill="none" stroke="var(--color-bg-elevated)" strokeWidth="8" />
              <circle
                cx="52" cy="52" r="42" fill="none"
                stroke={wellbeing >= 70 ? "var(--color-success)" : wellbeing >= 40 ? "var(--color-warning)" : "var(--color-danger)"}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                transform="rotate(-90 52 52)"
                style={{ transition: "stroke-dasharray 0.8s ease" }}
              />
              <text x="52" y="48" textAnchor="middle" fill="var(--color-text-primary)" fontSize="20" fontWeight="700" fontFamily="var(--font-mono)">{wellbeing}</text>
              <text x="52" y="64" textAnchor="middle" fill="var(--color-text-muted)" fontSize="10">wellbeing</text>
            </svg>
          </div>

          {/* Quick stats — horizontal-scrollable row on narrow screens */}
          <div className="flex gap-3 flex-shrink-0">
            <StatChip
              icon={<Moon size={14} className="text-info" />}
              label="Sleep"
              value={todaySleep?.duration_hrs ? `${todaySleep.duration_hrs}h` : "—"}
              sub={todaySleep?.bedtime && todaySleep?.wake_time ? `${todaySleep.bedtime}–${todaySleep.wake_time}` : "Not logged"}
              onClick={() => setShowSleep(true)}
            />
            <StatChip
              icon={<Footprints size={14} className="text-success" />}
              label="Steps"
              value={todayMeasurement?.steps ? todayMeasurement.steps.toLocaleString() : "—"}
              sub="Target: 7–10k"
            />
            <StatChip
              icon={<Heart size={14} className="text-danger" />}
              label="Resting HR"
              value={latestHr ? `${latestHr.value} bpm` : "—"}
              sub={latestHr ? "Latest reading" : "Log in Recovery"}
            />
            <StatChip
              icon={<Activity size={14} className="text-accent" />}
              label="Readiness"
              value={todayReadiness ? `${todayReadiness.score}/10` : "—"}
              sub={todayReadiness ? "Logged today" : "Not logged"}
            />
          </div>
        </div>

        {/* AI summary */}
        <div className="rounded-r4 border border-border bg-bg-elevated px-4 py-3">
          <p className="text-12 text-text-secondary italic">{aiSummary(todaySleep, todayReadiness)}</p>
        </div>
      </div>

      {showSleep && (
        <LogSleepModal
          current={todaySleep}
          onClose={() => setShowSleep(false)}
          onSaved={() => { setShowSleep(false); router.refresh(); }}
        />
      )}
    </>
  );
}

function StatChip({ icon, label, value, sub, onClick }: { icon: React.ReactNode; label: string; value: string; sub: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`flex items-center gap-2.5 p-3 rounded-r4 border border-border bg-bg-elevated text-left transition-colors ${onClick ? "hover:border-border-strong cursor-pointer" : "cursor-default"}`}
    >
      <div className="w-7 h-7 rounded-r3 bg-bg-overlay flex items-center justify-center flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="font-mono text-14 font-semibold text-text-primary leading-none">{value}</p>
        <p className="text-11 text-text-muted mt-0.5">{label} · {sub}</p>
      </div>
    </button>
  );
}
