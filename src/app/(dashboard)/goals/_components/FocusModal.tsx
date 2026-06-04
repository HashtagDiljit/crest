"use client";

import { useState } from "react";
import { X, Target, Trash2 } from "lucide-react";
import { setFocus, clearFocus, logFocusCheckin } from "../focus-actions";
import type { FocusData } from "../focus-actions";

interface Props {
  focus: FocusData;
  onClose: () => void;
  onChanged: () => void;
}

function daysRemaining(endDate: string | null): number {
  if (!endDate) return 0;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function daysSince(startDate: string | null): number {
  if (!startDate) return 0;
  const diff = Date.now() - new Date(startDate).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

export function FocusModal({ focus, onClose, onChanged }: Props) {
  const [newFocus, setNewFocus] = useState("");
  const [checkinNote, setCheckinNote] = useState("");
  const [checkinDone, setCheckinDone] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"main" | "checkin" | "set">(
    focus.current_focus ? "main" : "set"
  );

  const today = new Date().toISOString().split("T")[0];
  const todayCheckin = focus.focus_checkins.find((c) => c.date === today);
  const remaining = daysRemaining(focus.focus_end_date);
  const elapsed = daysSince(focus.focus_start_date);
  const progress = focus.focus_start_date ? Math.min(Math.round((elapsed / 90) * 100), 100) : 0;

  async function handleSet() {
    if (!newFocus.trim()) return;
    setSaving(true);
    await setFocus(newFocus);
    setSaving(false);
    onChanged();
    onClose();
  }

  async function handleCheckin() {
    setSaving(true);
    await logFocusCheckin(checkinNote, checkinDone);
    setSaving(false);
    onChanged();
    onClose();
  }

  async function handleClear() {
    if (!confirm("Clear your 90-day focus? This can't be undone.")) return;
    setSaving(true);
    await clearFocus();
    setSaving(false);
    onChanged();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative z-10 w-full max-w-md rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-accent" />
            <h2 className="font-display text-16 font-semibold text-text-primary">90-Day Focus</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors"><X size={16} /></button>
        </div>

        {view === "set" && (
          <>
            <p className="text-13 text-text-secondary">Choose one thing to focus on for the next 90 days. One goal compounds faster than many.</p>
            <div className="flex flex-col gap-2">
              <label className="text-11 font-semibold text-text-muted uppercase tracking-widest">Your focus</label>
              <input
                autoFocus
                type="text"
                value={newFocus}
                onChange={(e) => setNewFocus(e.target.value.slice(0, 120))}
                placeholder="e.g. Hit 80kg squat, lose 8kg, run a 5K"
                className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-14 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
              />
              <p className="text-11 text-text-muted">{newFocus.length}/120</p>
            </div>
            <button
              onClick={handleSet}
              disabled={saving || !newFocus.trim()}
              className="w-full py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Start 90-day focus"}
            </button>
          </>
        )}

        {view === "main" && focus.current_focus && (
          <>
            <div className="rounded-r4 border border-border bg-bg-elevated p-4">
              <p className="text-11 font-semibold text-text-muted uppercase tracking-widest mb-1">Current focus</p>
              <p className="text-15 font-semibold text-text-primary">{focus.current_focus}</p>
              <div className="mt-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-11 text-text-muted">
                  <span>Day {elapsed} of 90</span>
                  <span>{remaining} days left</span>
                </div>
                <div className="h-1.5 rounded-pill bg-bg-overlay overflow-hidden">
                  <div className="h-full rounded-pill bg-accent transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            {todayCheckin ? (
              <div className="rounded-r3 border border-border bg-bg-elevated p-3 flex items-start gap-2">
                <span className="text-14 mt-0.5">{todayCheckin.completed ? "✅" : "🔄"}</span>
                <div>
                  <p className="text-12 font-semibold text-text-secondary">Today checked in</p>
                  {todayCheckin.note && <p className="text-12 text-text-muted mt-0.5">{todayCheckin.note}</p>}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setView("checkin")}
                className="w-full py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors"
              >
                Sunday check-in
              </button>
            )}

            <div className="flex items-center justify-between">
              <button onClick={() => setView("set")} className="text-12 text-text-muted hover:text-text-secondary transition-colors">Change focus</button>
              <button onClick={handleClear} disabled={saving} className="flex items-center gap-1 text-12 text-error hover:opacity-80 transition-opacity">
                <Trash2 size={12} /> Clear focus
              </button>
            </div>

            {focus.focus_checkins.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-11 font-semibold text-text-muted uppercase tracking-widest">Recent check-ins ({focus.focus_checkins.length})</p>
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                  {[...focus.focus_checkins].reverse().slice(0, 5).map((c) => (
                    <div key={c.date} className="flex items-start gap-2 text-12 text-text-secondary">
                      <span className="text-11 text-text-muted flex-shrink-0 mt-0.5">{c.date}</span>
                      <span>{c.completed ? "✅" : "🔄"}</span>
                      {c.note && <span className="text-text-muted truncate">{c.note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {view === "checkin" && (
          <>
            <p className="text-13 text-text-secondary">Quick weekly reflection — how&apos;s your focus going?</p>
            <div className="flex flex-col gap-2">
              <label className="text-11 font-semibold text-text-muted uppercase tracking-widest">On track this week?</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCheckinDone(true)}
                  className={`flex-1 py-2.5 rounded-r3 border text-13 font-semibold transition-colors ${checkinDone ? "bg-accent text-white border-accent" : "border-border text-text-secondary hover:bg-bg-elevated"}`}
                >
                  Yes ✅
                </button>
                <button
                  type="button"
                  onClick={() => setCheckinDone(false)}
                  className={`flex-1 py-2.5 rounded-r3 border text-13 font-semibold transition-colors ${!checkinDone ? "bg-accent text-white border-accent" : "border-border text-text-secondary hover:bg-bg-elevated"}`}
                >
                  Working on it 🔄
                </button>
              </div>
            </div>
            <textarea
              value={checkinNote}
              onChange={(e) => setCheckinNote(e.target.value.slice(0, 300))}
              placeholder="Short note — what went well, what to adjust…"
              rows={3}
              className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent resize-none"
            />
            <button
              onClick={handleCheckin}
              disabled={saving}
              className="w-full py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save check-in"}
            </button>
            <button onClick={() => setView("main")} className="text-12 text-text-muted hover:text-text-secondary transition-colors text-center">Back</button>
          </>
        )}
      </div>
    </div>
  );
}
