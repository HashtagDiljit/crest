"use client";

import { Sun, Coffee, Dumbbell, Moon, Wind } from "lucide-react";
import type { SleepLogRow } from "../actions";

interface Props {
  sleepLogs: SleepLogRow[];
}

function addMinutes(timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + mins;
  const hh = Math.floor(((total % 1440) + 1440) % 1440 / 60);
  const mm = ((total % 1440) + 1440) % 1440 % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function fmtTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
}

interface Window {
  icon: React.ElementType;
  label: string;
  time: string;
  note: string;
  color: string;
}

export function CircadianCard({ sleepLogs }: Props) {
  const recent = sleepLogs.filter((l) => l.wake_time).slice(0, 7);

  if (recent.length < 3) {
    return (
      <div className="rounded-r5 border border-border bg-bg-surface p-5">
        <h2 className="font-display text-16 font-semibold text-text-primary mb-1">Your day optimised</h2>
        <p className="text-13 text-text-secondary">Log at least 3 nights of sleep with wake times to see your personalised circadian timing windows.</p>
      </div>
    );
  }

  // Average wake time and bedtime from recent logs
  function avgTime(times: string[]): string {
    const totalMins = times.reduce((sum, t) => {
      const [h, m] = t.split(":").map(Number);
      return sum + h * 60 + m;
    }, 0);
    const avg = Math.round(totalMins / times.length);
    return `${String(Math.floor(avg / 60)).padStart(2, "0")}:${String(avg % 60).padStart(2, "0")}`;
  }

  const wakeTimes = recent.map((l) => l.wake_time!);
  const bedTimes = recent.filter((l) => l.bedtime).map((l) => l.bedtime!);

  const avgWake = avgTime(wakeTimes);
  const avgBed = bedTimes.length >= 3 ? avgTime(bedTimes) : addMinutes(avgWake, 16 * 60);

  const windows: Window[] = [
    {
      icon: Sun,
      label: "Rise & hydrate",
      time: `${fmtTime(avgWake)}`,
      note: "Drink 500ml water. 10–20 min outdoor light resets your circadian clock.",
      color: "var(--color-warning)",
    },
    {
      icon: Dumbbell,
      label: "Peak training window",
      time: `${fmtTime(addMinutes(avgWake, 60))}–${fmtTime(addMinutes(avgWake, 3 * 60))}`,
      note: "Cortisol and core temperature are rising. Best time for strength or HIIT.",
      color: "var(--color-accent)",
    },
    {
      icon: Coffee,
      label: "First meal",
      time: fmtTime(addMinutes(avgWake, 90)),
      note: "Delay first coffee 90 min after waking to let adenosine clear naturally.",
      color: "var(--color-success)",
    },
    {
      icon: Sun,
      label: "Last meal",
      time: fmtTime(addMinutes(avgBed, -3 * 60)),
      note: "Finish eating 3h before bed to protect sleep quality and HRV.",
      color: "var(--color-info)",
    },
    {
      icon: Wind,
      label: "Wind-down",
      time: fmtTime(addMinutes(avgBed, -60)),
      note: "Dim lights, end screens, and cool the room to 18–19°C.",
      color: "#A39CFF",
    },
    {
      icon: Moon,
      label: "Target bedtime",
      time: fmtTime(avgBed),
      note: `Based on your average over the last ${recent.length} nights.`,
      color: "#7C70E8",
    },
  ];

  return (
    <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-4">
      <div>
        <h2 className="font-display text-16 font-semibold text-text-primary">Your day optimised</h2>
        <p className="text-12 text-text-secondary mt-0.5">Timing windows based on your average wake time ({fmtTime(avgWake)})</p>
      </div>
      <div className="flex flex-col divide-y divide-border">
        {windows.map(({ icon: Icon, label, time, note, color }) => (
          <div key={label} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <div className="w-8 h-8 rounded-r3 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
              <Icon size={14} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-13 font-semibold text-text-primary">{label}</span>
                <span className="text-12 font-mono text-text-muted flex-shrink-0">{time}</span>
              </div>
              <p className="text-11 text-text-muted mt-0.5 leading-relaxed">{note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
