"use client";

import { useState, useEffect } from "react";
import { X, Minus, Plus as PlusIcon } from "lucide-react";
import {
  quickLogWater, quickLogMood,
  quickLogWeight, quickLogSleep, quickLogNote, quickLogBP,
  getLastSleepTimes, getLastWeight,
} from "@/app/(dashboard)/quick-log-actions";
import { MealLoggerModal } from "@/app/(dashboard)/nutrition/_components/MealLoggerModal";
import { enqueueAction, type QueuedActionType } from "@/lib/offlineQueue";

// If offline, queue the action in IndexedDB for later sync instead of
// hitting the (unreachable) server action.
async function submitOrQueue(
  type: QueuedActionType,
  payload: unknown,
  fn: () => Promise<unknown>
): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await enqueueAction(type, payload);
    return;
  }
  await fn();
}

// ─── shared shell ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative z-10 w-full rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-4 shadow-2xl overflow-hidden box-border [&_*]:box-border"
        style={{ maxWidth: 400 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-16 font-semibold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SaveBtn({ saving, label = "Save" }: { saving: boolean; label?: string }) {
  return (
    <button type="submit" disabled={saving} className="w-full py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-50">
      {saving ? "Saving…" : label}
    </button>
  );
}

// ─── Water ────────────────────────────────────────────────────────────────────

export function WaterModal({ onClose }: { onClose: () => void }) {
  const [ml, setMl] = useState(250);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await submitOrQueue("water", { ml }, () => quickLogWater(ml));
    onClose();
  }

  return (
    <Modal title="Log water" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-2">
          {[150, 250, 330, 500].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setMl(preset)}
              className={`flex-1 py-2 rounded-r3 text-12 font-semibold border transition-colors ${
                ml === preset ? "bg-accent text-white border-accent" : "bg-bg-elevated border-border text-text-muted hover:border-border-strong"
              }`}
            >
              {preset}ml
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={ml}
            onChange={(e) => setMl(Number(e.target.value))}
            className="flex-1 rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary outline-none focus:border-accent transition-colors"
            min={50}
            max={2000}
          />
          <span className="text-13 text-text-muted">ml</span>
        </div>
        <SaveBtn saving={saving} label={`Log ${ml}ml`} />
      </form>
    </Modal>
  );
}

// ─── Mood ─────────────────────────────────────────────────────────────────────

const MOOD_OPTIONS = [
  { score: 1, emoji: "😞", label: "Rough" },
  { score: 2, emoji: "😕", label: "Low" },
  { score: 3, emoji: "😐", label: "Okay" },
  { score: 4, emoji: "🙂", label: "Good" },
  { score: 5, emoji: "😄", label: "Great" },
];

export function MoodModal({ onClose }: { onClose: () => void }) {
  const [score, setScore] = useState(3);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await submitOrQueue("mood", { score, note }, () => quickLogMood(score, note));
    onClose();
  }

  return (
    <Modal title="Log mood" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex justify-between gap-1">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m.score}
              type="button"
              onClick={() => setScore(m.score)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-r4 border transition-all ${
                score === m.score ? "border-[var(--color-accent-ring)] bg-[var(--color-accent-soft)]" : "border-border bg-bg-elevated"
              }`}
            >
              <span className="text-20">{m.emoji}</span>
              <span className={`text-10 ${score === m.score ? "text-text-primary" : "text-text-muted"}`}>{m.label}</span>
            </button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Short note (optional)…"
          rows={2}
          className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors resize-none"
        />
        <SaveBtn saving={saving} />
      </form>
    </Modal>
  );
}

// ─── Food / Protein — delegates to full MealLoggerModal ──────────────────────

export function FoodModal({ onClose }: { onClose: () => void }) {
  return <MealLoggerModal onClose={onClose} />;
}

// ─── Weight ───────────────────────────────────────────────────────────────────

export function WeightModal({ onClose }: { onClose: () => void }) {
  const [kg, setKg] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getLastWeight().then((last) => { if (last !== null) setKg(Math.round(last * 10) / 10); });
  }, []);

  function step(delta: number) {
    setKg((prev) => Math.round(((prev ?? 70) + delta) * 10) / 10);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (kg === null) return;
    setSaving(true);
    await submitOrQueue("weight", { kg }, () => quickLogWeight(kg));
    onClose();
  }

  const display = kg !== null ? String(kg) : "";

  return (
    <Modal title="Log weight" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => step(-0.1)} className="w-10 h-10 flex items-center justify-center rounded-r3 border border-border bg-bg-elevated hover:bg-bg-overlay text-text-muted transition-colors flex-shrink-0">
            <Minus size={14} />
          </button>
          <input
            autoFocus
            type="number"
            step="0.1"
            value={display}
            onChange={(e) => setKg(parseFloat(e.target.value) || null)}
            placeholder="75.0"
            className="flex-1 min-w-0 rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-20 font-mono text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors text-center"
          />
          <button type="button" onClick={() => step(0.1)} className="w-10 h-10 flex items-center justify-center rounded-r3 border border-border bg-bg-elevated hover:bg-bg-overlay text-text-muted transition-colors flex-shrink-0">
            <PlusIcon size={14} />
          </button>
          <span className="text-15 font-semibold text-text-muted">kg</span>
        </div>
        <SaveBtn saving={saving} label={kg !== null ? `Log ${kg}kg` : "Log weight"} />
      </form>
    </Modal>
  );
}

// ─── Sleep ────────────────────────────────────────────────────────────────────

export function SleepModal({ onClose }: { onClose: () => void }) {
  const [bedtime, setBedtime] = useState("22:30");
  const [wakeTime, setWakeTime] = useState("06:30");
  const [quality, setQuality] = useState(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getLastSleepTimes().then(({ bedtime: b, wakeTime: w }) => {
      if (b) setBedtime(b);
      if (w) setWakeTime(w);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await submitOrQueue("sleep", { bedtime, wakeTime, quality }, () => quickLogSleep(bedtime, wakeTime, quality));
    onClose();
  }

  return (
    <Modal title="Log sleep" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Bedtime</label>
            <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary outline-none focus:border-accent transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Wake time</label>
            <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary outline-none focus:border-accent transition-colors" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Quality</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((q) => (
              <label key={q} className="flex-1 cursor-pointer">
                <input type="radio" name="quality" className="sr-only peer" checked={quality === q} onChange={() => setQuality(q)} />
                <span className="flex h-9 items-center justify-center rounded-r3 border border-border bg-bg-elevated text-13 font-semibold text-text-muted peer-checked:bg-accent peer-checked:text-white peer-checked:border-accent transition-colors cursor-pointer">
                  {q}
                </span>
              </label>
            ))}
          </div>
        </div>
        <SaveBtn saving={saving} />
      </form>
    </Modal>
  );
}

// ─── Blood pressure ───────────────────────────────────────────────────────────

export function BPModal({ onClose }: { onClose: () => void }) {
  const [sys, setSys] = useState("");
  const [dia, setDia] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const s = parseInt(sys), d = parseInt(dia);
    if (isNaN(s) || isNaN(d)) return;
    setSaving(true);
    await quickLogBP(s, d);
    onClose();
  }

  return (
    <Modal title="Log blood pressure" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Systolic</label>
            <input
              autoFocus
              type="number"
              value={sys}
              onChange={(e) => setSys(e.target.value)}
              placeholder="120"
              className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-20 font-mono text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors text-center"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-11 font-semibold uppercase tracking-widest text-text-muted">Diastolic</label>
            <input
              type="number"
              value={dia}
              onChange={(e) => setDia(e.target.value)}
              placeholder="80"
              className="rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-20 font-mono text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors text-center"
            />
          </div>
        </div>
        <p className="text-11 text-text-muted text-center">mmHg — measure sitting, arm at heart level</p>
        <SaveBtn saving={saving} label={sys && dia ? `Log ${sys}/${dia} mmHg` : "Log BP"} />
      </form>
    </Modal>
  );
}

// ─── Note ─────────────────────────────────────────────────────────────────────

export function NoteModal({ onClose }: { onClose: () => void }) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    await submitOrQueue("note", { body }, () => quickLogNote(body));
    onClose();
  }

  return (
    <Modal title="Quick note" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <textarea
            autoFocus
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, 500))}
            placeholder="What's on your mind?"
            rows={5}
            className="w-full rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors resize-none"
          />
          <span className="absolute bottom-2 right-3 text-10 font-mono text-text-disabled">{body.length}/500</span>
        </div>
        <SaveBtn saving={saving} label="Save note" />
      </form>
    </Modal>
  );
}
