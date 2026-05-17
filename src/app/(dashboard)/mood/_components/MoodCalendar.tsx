"use client";

import { useState } from "react";
import type { MoodLogRow } from "../actions";

const MOOD_PALETTE = [
  "transparent",   // 0 = no data
  "#4C1D95",       // 1 = very low (deep purple)
  "#7C3AED",       // 2 = low
  "#6C63FF",       // 3 = okay (accent)
  "#34D399",       // 4 = good
  "#22C55E",       // 5 = great (bright green)
];

const MOOD_LABELS = ["", "Rough", "Low", "Okay", "Good", "Great"];
const MOOD_EMOJIS = ["", "😞", "😕", "😐", "🙂", "😄"];

interface Props {
  logs: MoodLogRow[];
}

export function MoodCalendar({ logs }: Props) {
  const [selected, setSelected] = useState<MoodLogRow | null>(null);

  // Build 5 weeks × 7 days, ending today
  const today = new Date();
  const todayDow = today.getDay();
  // end of the Mon-Sun week containing today
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - ((todayDow + 6) % 7)));

  const gridStart = new Date(endOfWeek);
  gridStart.setDate(endOfWeek.getDate() - 34);

  const logMap = new Map(logs.map((l) => [l.logged_date, l]));

  const weeks: Array<Array<{ date: string; log: MoodLogRow | null; isFuture: boolean }>> = [];
  for (let w = 0; w < 5; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + w * 7 + d);
      const dateStr = day.toISOString().split("T")[0];
      week.push({
        date: dateStr,
        log: logMap.get(dateStr) ?? null,
        isFuture: day > today,
      });
    }
    weeks.push(week);
  }

  return (
    <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-4">
      <h2 className="font-display text-15 font-semibold text-text-primary">Last 5 weeks</h2>

      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <span key={d} className="text-10 font-mono text-text-muted text-center">{d}</span>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map(({ date, log, isFuture }) => {
              const score = log?.score ?? 0;
              const isSelected = selected?.logged_date === date;
              return (
                <button
                  key={date}
                  onClick={() => !isFuture && setSelected(isSelected ? null : log)}
                  disabled={isFuture || !log}
                  title={date}
                  className={`h-9 rounded-r3 transition-all border-2 ${
                    isSelected ? "border-white scale-105" : "border-transparent"
                  } ${isFuture || !log ? "cursor-default" : "cursor-pointer hover:opacity-80"}`}
                  style={{ background: isFuture ? "transparent" : MOOD_PALETTE[score] || "var(--color-bg-elevated)" }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {selected && selected.score && (
        <div className="rounded-r4 border border-border bg-bg-elevated p-3 flex items-start gap-3">
          <span className="text-24">{MOOD_EMOJIS[selected.score]}</span>
          <div className="min-w-0">
            <p className="text-13 font-semibold text-text-primary">
              {MOOD_LABELS[selected.score]} · <span className="font-mono text-text-muted">{selected.logged_date}</span>
            </p>
            {selected.note && <p className="text-12 text-text-secondary mt-0.5 truncate">{selected.note}</p>}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-11 text-text-muted">Mood:</span>
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-[2px]" style={{ background: MOOD_PALETTE[s] }} />
            <span className="text-11 text-text-muted">{MOOD_LABELS[s]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
