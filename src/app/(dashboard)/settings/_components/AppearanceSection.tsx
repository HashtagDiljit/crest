"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { updateAppearance } from "../actions";
import { applyTheme, applyAccent } from "@/lib/theme";

const ACCENT_SWATCHES = [
  { label: "Violet", value: "#6C63FF" },
  { label: "Indigo", value: "#6366F1" },
  { label: "Sky", value: "#38BDF8" },
  { label: "Emerald", value: "#22C55E" },
  { label: "Amber", value: "#F59E0B" },
  { label: "Rose", value: "#F472B6" },
];

const THEMES = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
];

interface Props {
  theme: string | null;
  accentColour: string | null;
}

export function AppearanceSection({ theme: initTheme, accentColour: initAccent }: Props) {
  const [theme, setTheme] = useState(initTheme ?? "dark");
  const [accent, setAccent] = useState(initAccent ?? "#6C63FF");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);

  function handleThemeChange(value: string) {
    setTheme(value);
    applyTheme(value); // instant visual update
  }

  function handleAccentChange(value: string) {
    setAccent(value);
    applyAccent(value); // instant visual update
  }

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    const res = await updateAppearance(theme, accent);
    setSaving(false);
    setMsg(res.error ? { text: res.error } : { ok: true, text: "Saved" });
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
                  ? "border-accent bg-accent-soft text-text-primary"
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
        <div className="flex gap-2.5">
          {ACCENT_SWATCHES.map((s) => (
            <button
              key={s.value}
              title={s.label}
              onClick={() => handleAccentChange(s.value)}
              className="w-9 h-9 rounded-pill flex items-center justify-center transition-transform hover:scale-110"
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
