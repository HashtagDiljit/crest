"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Target } from "lucide-react";
import { LogSleepModal } from "./LogSleepModal";
import type { SleepLogRow } from "../actions";

interface Props {
  sleepLogs: SleepLogRow[];
}

const QUALITY_COLORS = ["", "#4C1D95", "#7C3AED", "#6C63FF", "#34D399", "#22C55E"];

export function SleepPanel({ sleepLogs }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const today = sleepLogs[0] ?? null;
  const target = { min: 8, max: 9 };
  const hitTarget = today?.duration_hrs ? today.duration_hrs >= target.min && today.duration_hrs <= target.max : false;

  // Last 7 days for bar chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const log = sleepLogs.find((l) => l.logged_date === dateStr);
    return { date: dateStr, hours: log?.duration_hrs ?? null, quality: log?.quality_score ?? null };
  });

  const maxHrs = 12;

  return (
    <>
      <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-15 font-semibold text-text-primary">Sleep</h2>
          <button onClick={() => setShowModal(true)} className="text-12 text-accent hover:text-accent-hover transition-colors flex items-center gap-1">
            <Moon size={12} /> Log sleep
          </button>
        </div>

        {/* Last night summary */}
        {today ? (
          <div className="flex items-center gap-4">
            <div>
              <p className="font-display text-40 font-bold text-text-primary leading-none">{today.duration_hrs}h</p>
              <div className="flex items-center gap-2 mt-1">
                <Target size={11} className={hitTarget ? "text-success" : "text-warning"} />
                <span className={`text-11 ${hitTarget ? "text-success" : "text-warning"}`}>
                  {hitTarget ? "Target hit (8–9h)" : `Target: 8–9h`}
                </span>
              </div>
              {today.bedtime && today.wake_time && (
                <p className="text-11 text-text-muted mt-0.5">{today.bedtime} → {today.wake_time}</p>
              )}
            </div>

            {/* Sleep quality / stage estimate bar */}
            {today.quality_score && (
              <div className="flex-1">
                <p className="text-11 text-text-muted mb-1.5">Sleep quality</p>
                <div className="flex h-5 rounded-pill overflow-hidden gap-0.5">
                  <div className="flex-none w-[8%] rounded-l-pill" style={{ background: "#4B5563" }} title="Awake" />
                  <div className="flex-1 rounded-none" style={{ background: QUALITY_COLORS[Math.min(5, Math.max(1, Math.round(today.quality_score * 0.4)))] || "#4C1D95" }} title="Light" />
                  <div className="flex-none rounded-none" style={{ width: `${today.quality_score * 5}%`, background: "#6C63FF" }} title="Deep" />
                  <div className="flex-1 rounded-r-pill" style={{ background: QUALITY_COLORS[today.quality_score] || "#22C55E" }} title="REM" />
                </div>
                <div className="flex gap-3 mt-1">
                  {[["Awake", "#4B5563"], ["Light", "#7C3AED"], ["Deep", "#6C63FF"], ["REM", "#22C55E"]].map(([label, color]) => (
                    <div key={label} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="text-10 text-text-muted">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <button onClick={() => setShowModal(true)} className="text-13 text-text-muted hover:text-text-secondary transition-colors text-left">
            No sleep logged yet tonight — tap to log
          </button>
        )}

        {/* 7-day bar chart */}
        <div>
          <p className="text-11 font-mono text-text-muted mb-2">Last 7 nights</p>
          <div className="flex items-end gap-1.5 h-14">
            {last7.map(({ date, hours, quality }) => (
              <div key={date} className="flex-1 flex flex-col items-center gap-0.5" title={`${date}: ${hours ?? "—"}h`}>
                <div
                  className="w-full rounded-t-[3px] transition-all"
                  style={{
                    height: hours ? `${(hours / maxHrs) * 100}%` : "4px",
                    background: hours ? QUALITY_COLORS[quality ?? 3] || "var(--color-accent)" : "var(--color-bg-elevated)",
                    minHeight: "4px",
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 mt-1">
            {last7.map(({ date }) => (
              <span key={date} className="flex-1 text-center text-10 font-mono text-text-disabled">
                {new Date(date + "T00:00:00").toLocaleDateString("en", { weekday: "narrow" })}
              </span>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <LogSleepModal
          current={sleepLogs[0] ?? null}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); router.refresh(); }}
        />
      )}
    </>
  );
}
