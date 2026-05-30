"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  quickLogWater, quickLogMood, quickLogFood, getTodayProtein,
  quickLogWeight, quickLogSleep, quickLogNote,
} from "@/app/(dashboard)/quick-log-actions";

// ─── shared shell ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative z-10 w-full max-w-sm rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-4 shadow-2xl"
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
    await quickLogWater(ml);
    onClose();
  }

  return (
    <Modal title="Log water" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-2">
          {[150, 250, 500, 750].map((preset) => (
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
    await quickLogMood(score, note);
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

// ─── Food / Protein ───────────────────────────────────────────────────────────

const PROTEIN_TARGET = 140;
const FOOD_PRESETS = [
  { key: "oats_protein", label: "Oats + protein", protein: 35 },
  { key: "eggs_3", label: "3 eggs", protein: 18 },
  { key: "whey_shake", label: "Whey shake", protein: 25 },
  { key: "chapatti_curry", label: "Chapatti + curry", protein: 15 },
  { key: "greek_yogurt", label: "Greek yogurt", protein: 15 },
  { key: "paneer_100g", label: "Paneer 100g", protein: 18 },
  { key: "dal_lentils", label: "Dal/lentils", protein: 12 },
  { key: "other", label: "Other…", protein: 0 },
];

export function FoodModal({ onClose }: { onClose: () => void }) {
  const [todayProtein, setTodayProtein] = useState(0);
  const [added, setAdded] = useState(0);
  const [customName, setCustomName] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getTodayProtein().then(setTodayProtein);
  }, []);

  async function addPreset(preset: typeof FOOD_PRESETS[0]) {
    if (preset.key === "other") { setShowCustom(true); return; }
    setSaving(true);
    await quickLogFood(preset.key, preset.protein, preset.label);
    setAdded((p) => p + preset.protein);
    setSaving(false);
  }

  async function addCustom() {
    const p = parseFloat(customProtein) || 0;
    setSaving(true);
    await quickLogFood("other", p, customName || "Custom");
    setAdded((prev) => prev + p);
    setShowCustom(false);
    setCustomName("");
    setCustomProtein("");
    setSaving(false);
  }

  const total = todayProtein + added;
  const pct = Math.min(100, (total / PROTEIN_TARGET) * 100);

  return (
    <Modal title="Log protein" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {/* Running total */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-12">
            <span className="text-text-secondary">Today&apos;s protein</span>
            <span className="font-mono font-semibold" style={{ color: pct >= 100 ? "var(--color-success)" : "var(--color-text-primary)" }}>
              {Math.round(total)}g / {PROTEIN_TARGET}g
            </span>
          </div>
          <div className="h-2 rounded-pill bg-bg-elevated overflow-hidden">
            <div className="h-full rounded-pill bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {showCustom ? (
          <div className="flex flex-col gap-2">
            <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Meal name" className="rounded-r3 border border-border bg-bg-base px-3 py-2 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors" />
            <div className="flex gap-2 items-center">
              <input type="number" value={customProtein} onChange={(e) => setCustomProtein(e.target.value)} placeholder="Protein (g)" className="flex-1 rounded-r3 border border-border bg-bg-base px-3 py-2 text-13 text-text-primary outline-none focus:border-accent transition-colors" />
              <button onClick={addCustom} disabled={saving} className="px-4 py-2 rounded-r3 bg-accent text-white text-12 font-semibold disabled:opacity-50">Add</button>
              <button onClick={() => setShowCustom(false)} className="px-3 py-2 rounded-r3 border border-border text-text-muted text-12 hover:text-text-primary transition-colors">✕</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {FOOD_PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => addPreset(p)}
                disabled={saving}
                className="flex items-center justify-between px-3 py-2 rounded-r3 border border-border bg-bg-elevated hover:border-border-strong text-left text-12 transition-colors disabled:opacity-50"
              >
                <span className="text-text-primary">{p.label}</span>
                {p.protein > 0 && <span className="font-mono text-11 text-accent">+{p.protein}g</span>}
              </button>
            ))}
          </div>
        )}

        <button onClick={onClose} className="w-full py-2 rounded-r3 border border-border text-text-muted text-12 hover:text-text-secondary transition-colors">Done</button>
      </div>
    </Modal>
  );
}

// ─── Weight ───────────────────────────────────────────────────────────────────

export function WeightModal({ onClose }: { onClose: () => void }) {
  const [kg, setKg] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = parseFloat(kg);
    if (isNaN(v)) return;
    setSaving(true);
    await quickLogWeight(v);
    onClose();
  }

  return (
    <Modal title="Log weight" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            autoFocus
            type="number"
            step="0.1"
            value={kg}
            onChange={(e) => setKg(e.target.value)}
            placeholder="75.0"
            className="flex-1 rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-20 font-mono text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
          />
          <span className="text-15 font-semibold text-text-muted">kg</span>
        </div>
        <SaveBtn saving={saving} label={kg ? `Log ${kg}kg` : "Log weight"} />
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await quickLogSleep(bedtime, wakeTime, quality);
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

// ─── Note ─────────────────────────────────────────────────────────────────────

export function NoteModal({ onClose }: { onClose: () => void }) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    await quickLogNote(body);
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
