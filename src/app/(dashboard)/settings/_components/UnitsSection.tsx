"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { updateUnits } from "../actions";
import { useRouter } from "next/navigation";
import type { ProfilePrefs } from "../actions";

const OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  weight_unit: [{ value: "kg", label: "Kilograms (kg)" }, { value: "lbs", label: "Pounds (lbs)" }],
  distance_unit: [{ value: "km", label: "Kilometres (km)" }, { value: "mi", label: "Miles (mi)" }],
  time_format: [{ value: "24h", label: "24-hour" }, { value: "12h", label: "12-hour" }],
  week_starts: [{ value: "monday", label: "Monday" }, { value: "sunday", label: "Sunday" }],
};

type UnitKey = "weight_unit" | "distance_unit" | "time_format" | "week_starts";

interface Props {
  prefs: Pick<ProfilePrefs, UnitKey>;
}

export function UnitsSection({ prefs }: Props) {
  const router = useRouter();
  const [values, setValues] = useState({
    weight_unit: prefs.weight_unit ?? "kg",
    distance_unit: prefs.distance_unit ?? "km",
    time_format: prefs.time_format ?? "24h",
    week_starts: prefs.week_starts ?? "monday",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    const res = await updateUnits(values);
    setSaving(false);
    if (res.error) {
      setMsg({ text: res.error });
    } else {
      setMsg({ ok: true, text: "Saved" });
      router.refresh();
    }
  }

  const LABELS: Record<UnitKey, string> = {
    weight_unit: "Weight unit",
    distance_unit: "Distance unit",
    time_format: "Time format",
    week_starts: "Week starts on",
  };

  return (
    <div className="flex flex-col gap-5">
      {(Object.keys(LABELS) as UnitKey[]).map((key) => (
        <div key={key} className="flex flex-col gap-2">
          <label className="text-12 font-medium text-text-secondary">{LABELS[key]}</label>
          <div className="flex gap-2">
            {OPTIONS[key].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setValues((v) => ({ ...v, [key]: opt.value }))}
                className={`flex-1 py-2 rounded-r3 border text-13 font-medium transition-colors ${
                  values[key] === opt.value
                    ? "border-accent bg-accent-soft text-text-primary"
                    : "border-border bg-bg-elevated text-text-secondary hover:text-text-primary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : null}
          Save preferences
        </button>
        {msg && <p className={`text-12 ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
      </div>
    </div>
  );
}
