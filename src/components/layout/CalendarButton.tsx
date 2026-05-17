"use client";

import { useState, useEffect, useRef } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X, Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DaySession {
  template_name: string | null;
  sets_count: number;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Su","Mo","Tu","We","Th","Fr","Sa"];

async function fetchMonthSessions(year: number, month: number): Promise<Record<string, DaySession>> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const start = new Date(year, month - 1, 1).toISOString();
  const end = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, started_at, template_id")
    .eq("user_id", user.id)
    .not("ended_at", "is", null)
    .gte("started_at", start)
    .lte("started_at", end);

  if (!sessions?.length) return {};

  const sessArr = sessions as Array<{ id: string; started_at: string; template_id: string | null }>;
  const templateIds = Array.from(new Set(sessArr.map((s) => s.template_id).filter(Boolean) as string[]));
  const sessionIds = sessArr.map((s) => s.id);

  const [tmplRes, setsRes] = await Promise.all([
    templateIds.length > 0
      ? supabase.from("workout_templates").select("id, name").in("id", templateIds)
      : Promise.resolve({ data: [] }),
    supabase.from("session_sets").select("id, session_id").in("session_id", sessionIds),
  ]);

  const tmplMap = new Map(((tmplRes.data ?? []) as Array<{ id: string; name: string }>).map((t) => [t.id, t.name]));
  const setsMap = new Map<string, number>();
  for (const s of (setsRes.data ?? []) as Array<{ session_id: string }>) {
    setsMap.set(s.session_id, (setsMap.get(s.session_id) ?? 0) + 1);
  }

  const result: Record<string, DaySession> = {};
  for (const s of sessArr) {
    const date = s.started_at.split("T")[0];
    result[date] = {
      template_name: s.template_id ? (tmplMap.get(s.template_id) ?? null) : null,
      sets_count: setsMap.get(s.id) ?? 0,
    };
  }
  return result;
}

export function CalendarButton() {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [sessions, setSessions] = useState<Record<string, DaySession>>({});
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchMonthSessions(year, month).then((data) => { setSessions(data); setLoading(false); });
  }, [open, year, month]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const prevMonth = () => { if (month === 1) { setYear((y) => y - 1); setMonth(12); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 12) { setYear((y) => y + 1); setMonth(1); } else setMonth((m) => m + 1); };

  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: Array<number | null> = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = today.toISOString().split("T")[0];
  const selectedSession = selected ? sessions[selected] : null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label="Training calendar"
        onClick={() => setOpen((v) => !v)}
        className={`w-[34px] h-[34px] rounded-pill border flex items-center justify-center transition-colors ${
          open ? "bg-bg-elevated border-border-strong text-text-primary" : "border-border text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
        }`}
      >
        <CalendarDays size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] w-80 rounded-r5 border border-border bg-bg-surface z-50" style={{ boxShadow: "var(--shadow-3)" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <button onClick={prevMonth} className="w-7 h-7 rounded-r2 hover:bg-bg-elevated flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"><ChevronLeft size={14} /></button>
            <span className="font-display text-14 font-semibold text-text-primary">{MONTHS[month - 1]} {year}</span>
            <button onClick={nextMonth} className="w-7 h-7 rounded-r2 hover:bg-bg-elevated flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"><ChevronRight size={14} /></button>
          </div>

          <div className="p-3">
            <div className="grid grid-cols-7 mb-1">
              {DOW.map((d) => (
                <div key={d} className="text-center font-mono text-10 text-text-muted py-1">{d}</div>
              ))}
            </div>
            {loading ? (
              <div className="h-40 flex items-center justify-center text-11 text-text-muted">Loading…</div>
            ) : (
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((day, i) => {
                  if (!day) return <div key={i} />;
                  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const hasSession = !!sessions[dateStr];
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selected;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelected(isSelected ? null : dateStr)}
                      className={`aspect-square rounded-r2 flex items-center justify-center font-mono text-12 transition-colors relative ${
                        isSelected ? "bg-accent text-white" :
                        hasSession ? "bg-[var(--color-accent-soft)] text-text-primary hover:bg-accent hover:text-white" :
                        isToday ? "border border-border-strong text-text-primary hover:bg-bg-elevated" :
                        "text-text-muted hover:bg-bg-elevated"
                      }`}
                    >
                      {day}
                      {hasSession && !isSelected && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selected && (
            <div className="border-t border-border px-4 py-3">
              {selectedSession ? (
                <div className="flex items-start gap-3">
                  <Dumbbell size={15} className="text-accent mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-13 font-semibold text-text-primary truncate">
                      {selectedSession.template_name ?? "Workout"}
                    </p>
                    <p className="font-mono text-11 text-text-muted">{selectedSession.sets_count} sets</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-text-muted hover:text-text-primary"><X size={13} /></button>
                </div>
              ) : (
                <p className="text-12 text-text-muted">No workout logged on this day.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
