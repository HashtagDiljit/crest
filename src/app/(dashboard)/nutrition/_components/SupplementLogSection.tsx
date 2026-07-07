"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import type { SupplementLogRow } from "../types";
import { SUPPLEMENT_EVIDENCE } from "../types";
import type { UserSupplement } from "../supplement-actions";
import { EditSupplementsSheet } from "./EditSupplementsSheet";

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
  userSupplements,
}: {
  supplementLogs: SupplementLogRow[];
  userSupplements: UserSupplement[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  const activeSupplements = userSupplements.filter(s => s.enabled).map(s => s.name);

  if (!userSupplements.length) return null;

  return (
    <>
    {showEdit && <EditSupplementsSheet supplements={userSupplements} onClose={() => setShowEdit(false)} />}
    <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-16 font-semibold text-text-primary">Supplement log</h2>
        <button onClick={() => setShowEdit(true)} className="flex items-center gap-1 text-12 text-text-muted hover:text-text-primary transition-colors">
          <Settings2 size={13} /> Edit
        </button>
      </div>
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
                <div className="px-4 pb-4 flex flex-col gap-3">
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
                  <div className="flex justify-between text-10 text-text-muted">
                    <span>{fmtMonth(calendar[0]?.date ?? "")}</span>
                    <span>{fmtMonth(calendar[calendar.length - 1]?.date ?? "")}</span>
                  </div>
                  {/* Evidence note */}
                  {SUPPLEMENT_EVIDENCE[name] && (
                    <div className="rounded-r3 border border-border bg-bg-surface p-3 flex flex-col gap-2 mt-1">
                      <span className="text-10 font-semibold uppercase tracking-widest text-accent">{SUPPLEMENT_EVIDENCE[name].tier}</span>
                      <p className="text-12 text-text-secondary leading-relaxed">{SUPPLEMENT_EVIDENCE[name].evidence}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <span className="text-11 text-text-muted"><span className="font-semibold text-text-secondary">Dose:</span> {SUPPLEMENT_EVIDENCE[name].dose}</span>
                        <span className="text-11 text-text-muted"><span className="font-semibold text-text-secondary">Timing:</span> {SUPPLEMENT_EVIDENCE[name].timing}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
}
