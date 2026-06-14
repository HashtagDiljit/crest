"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { updateAppearance, updateHiddenNavItems, updateReduceMotion } from "../actions";
import { applyTheme, applyAccent } from "@/lib/theme";
import { Toggle } from "@/components/ui/Toggle";

const ACCENT_SWATCHES = [
  { label: "Teal",    value: "#2DD4BF" },
  { label: "Indigo",  value: "#6366F1" },
  { label: "Violet",  value: "#A855F7" },
  { label: "Rose",    value: "#F43F5E" },
  { label: "Coral",   value: "#F97316" },
  { label: "Amber",   value: "#F59E0B" },
  { label: "Yellow",  value: "#EAB308" },
  { label: "Lime",    value: "#84CC16" },
  { label: "Emerald", value: "#10B981" },
  { label: "Sky",     value: "#0EA5E9" },
  { label: "Slate",   value: "#94A3B8" },
  { label: "Pink",    value: "#EC4899" },
];

const THEMES = [
  { value: "dark",   label: "Dark" },
  { value: "light",  label: "Light" },
  { value: "amoled", label: "AMOLED" },
  { value: "system", label: "System" },
];

const NAV_TOGGLES = [
  { id: "workouts",     label: "Workouts" },
  { id: "health",       label: "Health" },
  { id: "nutrition",    label: "Nutrition" },
  { id: "habits",       label: "Habits" },
  { id: "mood",         label: "Mood" },
  { id: "journal",      label: "Journal" },
  { id: "goals",        label: "Goals" },
  { id: "achievements", label: "Trophy room" },
  { id: "insights",     label: "AI insights" },
];

interface Props {
  theme: string | null;
  accentColour: string | null;
  hiddenNavItems: string[] | null;
  reduceMotion: boolean;
}

export function AppearanceSection({ theme: initTheme, accentColour: initAccent, hiddenNavItems, reduceMotion: initReduceMotion }: Props) {
  const [theme, setTheme] = useState(initTheme ?? "dark");
  const [accent, setAccent] = useState(initAccent ?? "#2DD4BF");
  const [hiddenNav, setHiddenNav] = useState<string[]>(hiddenNavItems ?? []);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [navSaving, setNavSaving] = useState(false);
  const [navMsg, setNavMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [reduceMotion, setReduceMotion] = useState(initReduceMotion);
  const [motionMsg, setMotionMsg] = useState<{ ok?: boolean; text: string } | null>(null);

  function handleThemeChange(value: string) {
    setTheme(value);
    applyTheme(value);
  }

  function handleAccentChange(value: string) {
    setAccent(value);
    applyAccent(value);
  }

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    const res = await updateAppearance(theme, accent);
    setSaving(false);
    setMsg(res.error ? { text: res.error } : { ok: true, text: "Saved" });
  }

  function toggleNavItem(id: string) {
    setHiddenNav((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function handleSaveNav() {
    setNavSaving(true);
    setNavMsg(null);
    const res = await updateHiddenNavItems(hiddenNav);
    setNavSaving(false);
    setNavMsg(res.error ? { text: res.error } : { ok: true, text: "Saved" });
  }

  async function handleToggleReduceMotion() {
    const next = !reduceMotion;
    setReduceMotion(next);
    setMotionMsg(null);
    const res = await updateReduceMotion(next);
    setMotionMsg(res.error ? { text: res.error } : { ok: true, text: "Saved" });
  }

  return (
    <div className="flex flex-col gap-6">
      <Field label="Theme">
        <div className="flex gap-2">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => handleThemeChange(t.value)}
              className={`flex-1 py-2.5 rounded-r3 border text-13 font-medium transition-colors ${
                theme === t.value
                  ? "border-accent bg-[var(--color-accent-soft)] text-text-primary"
                  : "border-border bg-bg-elevated text-text-secondary hover:text-text-primary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-11 text-text-disabled mt-1">Changes apply instantly. Save to persist across sessions.</p>
      </Field>

      <Field label="Accent colour">
        <div className="grid grid-cols-6 gap-2">
          {ACCENT_SWATCHES.map((s) => (
            <button
              key={s.value}
              title={s.label}
              onClick={() => handleAccentChange(s.value)}
              className="w-full aspect-square rounded-pill flex items-center justify-center transition-transform hover:scale-110 min-h-[44px]"
              style={{
                background: s.value,
                boxShadow: accent === s.value ? `0 0 0 2px var(--color-bg-base), 0 0 0 4px ${s.value}` : "none",
              }}
            >
              {accent === s.value && <Check size={14} className="text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </Field>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : null}
          Save appearance
        </button>
        {msg && <p className={`text-12 ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
      </div>

      <div className="border-t border-border pt-6 flex flex-col gap-4">
        <div>
          <p className="text-14 font-semibold text-text-primary">Navigation</p>
          <p className="text-12 text-text-secondary mt-0.5">Choose which sections appear in your sidebar and bottom navigation. Dashboard is always visible.</p>
        </div>
        <div className="flex flex-col gap-1">
          {NAV_TOGGLES.map((item) => {
            const visible = !hiddenNav.includes(item.id);
            return (
              <div key={item.id} className="flex items-center justify-between gap-3 py-2 px-1">
                <span className="text-13 text-text-primary">{item.label}</span>
                <Toggle checked={visible} onChange={() => toggleNavItem(item.id)} label={item.label} />
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveNav}
            disabled={navSaving}
            className="px-5 py-2 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {navSaving ? <Loader2 size={13} className="animate-spin" /> : null}
            Save navigation
          </button>
          {navMsg && <p className={`text-12 ${navMsg.ok ? "text-success" : "text-danger"}`}>{navMsg.text}</p>}
        </div>
      </div>

      <div className="border-t border-border pt-6 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-14 font-semibold text-text-primary">Reduce motion</p>
            <p className="text-12 text-text-secondary mt-0.5">Turn off animations and transitions throughout the app.</p>
          </div>
          <Toggle checked={reduceMotion} onChange={handleToggleReduceMotion} label="Reduce motion" />
        </div>
        {motionMsg && <p className={`text-12 ${motionMsg.ok ? "text-success" : "text-danger"}`}>{motionMsg.text}</p>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-12 font-medium text-text-secondary">{label}</label>
      {children}
    </div>
  );
}
