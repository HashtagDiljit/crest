"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { updateNotifications } from "../actions";

const NOTIF_OPTIONS = [
  { key: "daily_reminder", label: "Daily log reminder", description: "Remind you to complete your daily logs" },
  { key: "streak_warning", label: "Streak at risk", description: "Alert when your streak is about to break" },
  { key: "achievement_unlocked", label: "Achievement unlocked", description: "Notify when you earn a new badge" },
  { key: "goal_deadline", label: "Goal deadline", description: "Remind you of upcoming goal deadlines" },
  { key: "weekly_summary", label: "Weekly summary", description: "A recap of your week every Sunday" },
];

interface Props {
  prefs: Record<string, boolean> | null;
}

export function NotificationsSection({ prefs }: Props) {
  const [values, setValues] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NOTIF_OPTIONS.map((o) => [o.key, prefs?.[o.key] ?? true]))
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);

  function toggle(key: string) {
    setValues((v) => ({ ...v, [key]: !v[key] }));
  }

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    const res = await updateNotifications(values);
    setSaving(false);
    setMsg(res.error ? { text: res.error } : { ok: true, text: "Saved" });
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-12 text-text-muted">Notification delivery is UI-only — configure your device notifications separately.</p>
      {NOTIF_OPTIONS.map((o) => (
        <div key={o.key} className="flex items-center justify-between gap-4">
          <div>
            <p className="text-13 font-medium text-text-primary">{o.label}</p>
            <p className="text-12 text-text-muted mt-0.5">{o.description}</p>
          </div>
          <button
            role="switch"
            aria-checked={values[o.key]}
            onClick={() => toggle(o.key)}
            className={`relative w-10 h-5.5 rounded-pill transition-colors flex-shrink-0 ${values[o.key] ? "bg-accent" : "bg-bg-elevated border border-border"}`}
            style={{ height: "22px", width: "40px" }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-pill bg-white transition-transform"
              style={{ transform: values[o.key] ? "translateX(18px)" : "translateX(0)" }}
            />
          </button>
        </div>
      ))}

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : null}
          Save notifications
        </button>
        {msg && <p className={`text-12 ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
      </div>
    </div>
  );
}
