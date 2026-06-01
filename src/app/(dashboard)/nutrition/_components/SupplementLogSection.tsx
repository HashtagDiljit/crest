"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { SupplementLogRow, NutritionSettings } from "../types";

function buildCalendar(logs: SupplementLogRow[], name: string): Array<{ date: string; taken: boolean }> {
  const taken = new Set(
    logs.filter((l) => l.supplement_name === name).map((l) => l.logged_date)
  );
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000).toISOString().split("T")[0];
    return { date: d, taken: taken.has(d) };
  });
}

function streak(logs: SupplementLogRow[], name: string): number {
  const dates = logs
    .filter((l) => l.supplement_name === name)
    .map((l) => l.logged_date)
    .sort()
    .reverse();
  if (!dates.length) return 0;
  let s = 0;
  let cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  for (let i = 0; i < 60; i++) {
    const d = cursor.toISOString().split("T")[0];
    if (dates.includes(d)) {
      s++;
    } else if (i > 0) {
      break;
    }
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return s;
}

function monthAdherence(logs: SupplementLogRow[], name: string): number {
  const since30 = new Date(Date.now() - 29 * 86400000).toISOString().split("T")[0];
  return logs.filter((l) => l.supplement_name === name && l.logged_date >= since30).length;
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.getDate().toString();
}

function fmtMonth(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-GB", { month: "short" });
}

export function SupplementLogSection({
  supplementLogs,
  settings,
}: {
  supplementLogs: SupplementLogRow[];
  settings: NutritionSettings;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const activeSupplements = Object.entries(settings.supplements)
    .filter(([, on]) => on)
    .map(([name]) => name);

  if (!activeSupplements.length) return null;

  return (
    <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-4">
      <h2 className="font-display text-16 font-semibold text-text-primary">Supplement log</h2>
      <div className="flex flex-col gap-2">
        {activeSupplements.map((name) => {
          const s = streak(supplementLogs, name);
          const count = monthAdherence(supplementLogs, name);
          const isOpen = expanded === name;
          const calendar = isOpen ? buildCalendar(supplementLogs, name) : [];

          return (
            <div key={name} className="rounded-r3 border border-border bg-bg-elevated overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : name)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-surface transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-pill flex-shrink-0"
                    style={{ background: s > 0 ? "var(--color-success)" : "var(--color-border)" }}
                  />
                  <span className="text-13 font-medium text-text-primary">{name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {s > 0 && (
                    <span className="text-12 text-text-muted">🔥 {s}d streak</span>
                  )}
                  <span className="text-12 text-text-muted">{count}/30 this month</span>
                  {isOpen ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4">
                  {/* 30-day calendar grid */}
                  <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
                    {calendar.map(({ date, taken }) => {
                      const today = new Date().toISOString().split("T")[0];
                      const isToday = date === today;
                      return (
                        <div
                          key={date}
                          title={date}
                          className="relative flex flex-col items-center gap-0.5"
                        >
                          <div
                            className={`w-full aspect-square rounded-r2 flex items-center justify-center text-10 font-medium transition-colors ${
                              taken
                                ? "bg-accent text-white"
                                : "bg-bg-surface border border-border text-text-disabled"
                            } ${isToday ? "ring-1 ring-offset-1 ring-accent" : ""}`}
                          >
                            {fmtDate(date)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Month label context */}
                  <div className="flex justify-between mt-2 text-10 text-text-muted">
                    <span>{fmtMonth(calendar[0]?.date ?? "")}</span>
                    <span>{fmtMonth(calendar[calendar.length - 1]?.date ?? "")}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
