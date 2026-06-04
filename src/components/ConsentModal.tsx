"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { saveConsent } from "@/app/(dashboard)/consent/actions";
import type { ConsentChoices } from "@/app/(dashboard)/consent/types";
import { useRouter } from "next/navigation";

interface ConsentItem {
  key: keyof ConsentChoices;
  label: string;
  description: string;
  detail: string;
  required: boolean;
}

const CONSENT_ITEMS: ConsentItem[] = [
  {
    key: "physical_health",
    label: "Physical health data",
    description: "Workouts, body measurements, sleep logs, and water intake.",
    detail: "This data powers your workout tracker, sleep panel, body metrics, and progress charts. Without this consent, core tracking features won't work.",
    required: true,
  },
  {
    key: "mental_emotional",
    label: "Mental and emotional data",
    description: "Mood logs, journal entries, and goal notes.",
    detail: "This covers anything you write in your journal, mood scores you log, and goal descriptions. This data stays entirely private and is never shared.",
    required: true,
  },
  {
    key: "biometric",
    label: "Biometric data",
    description: "Heart rate, HRV, and body fat estimates.",
    detail: "HRV, resting heart rate, and estimated body fat are special-category health data under UK GDPR Article 9. These are estimates and trends, not clinical measurements.",
    required: false,
  },
  {
    key: "correlation_analysis",
    label: "Correlation analysis",
    description: "We analyse patterns across your data to surface insights.",
    detail: "This enables features like 'your mood is higher on training days' and the Correlations page. All analysis runs on your own data only — nothing is shared.",
    required: false,
  },
  {
    key: "product_improvement",
    label: "Anonymous product improvement",
    description: "Aggregate, never identifiable usage analytics.",
    detail: "If enabled, we collect anonymous, aggregated data (e.g. 'X% of users log sleep daily') to understand how Arc is used. No individual tracking, no identifiers.",
    required: false,
  },
];

interface Props {
  onConsented: () => void;
}

export function ConsentModal({ onConsented }: Props) {
  const router = useRouter();
  const [choices, setChoices] = useState<ConsentChoices>({
    physical_health: false,
    mental_emotional: false,
    biometric: false,
    correlation_analysis: false,
    product_improvement: false,
  });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const requiredChecked = choices.physical_health && choices.mental_emotional;

  function toggle(key: keyof ConsentChoices) {
    setChoices((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSubmit() {
    if (!requiredChecked || saving) return;
    setSaving(true);
    await saveConsent(choices);
    setSaving(false);
    onConsented();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-r5 border border-border bg-bg-surface shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-r4 bg-accent flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <h2 className="font-display text-18 font-semibold text-text-primary">Before we start — your health data</h2>
          </div>
          <p className="text-13 text-text-secondary leading-relaxed">
            Arc stores health and fitness data about you. UK law requires your explicit consent for each type. Please choose what you&apos;re comfortable with.
          </p>
        </div>

        {/* Consent items */}
        <div className="flex flex-col divide-y divide-border overflow-y-auto flex-1">
          {CONSENT_ITEMS.map((item) => {
            const checked = choices[item.key];
            const isExpanded = expanded === item.key;
            return (
              <div key={item.key} className="px-6 py-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggle(item.key)}
                    className={`relative w-10 h-6 rounded-pill transition-colors flex-shrink-0 mt-0.5 ${checked ? "bg-accent" : "bg-bg-elevated border border-border"}`}
                    aria-label={`Toggle ${item.label}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-[left] ${checked ? "left-[18px]" : "left-0.5"}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-14 font-medium ${checked ? "text-text-primary" : "text-text-secondary"}`}>{item.label}</span>
                      {item.required && (
                        <span className="text-10 font-semibold px-1.5 py-0.5 rounded-pill bg-bg-elevated border border-border text-text-muted">Required for core features</span>
                      )}
                    </div>
                    <p className="text-12 text-text-muted mt-0.5">{item.description}</p>
                    <button
                      type="button"
                      onClick={() => setExpanded(isExpanded ? null : item.key)}
                      className="flex items-center gap-1 text-11 text-accent hover:text-accent-hover transition-colors mt-1"
                    >
                      {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      Learn more
                    </button>
                    {isExpanded && (
                      <p className="text-12 text-text-secondary leading-relaxed mt-2 p-3 rounded-r3 bg-bg-elevated border border-border">
                        {item.detail}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-border flex-shrink-0 flex flex-col gap-3">
          {!requiredChecked && (
            <p className="text-11 text-text-muted text-center">
              Please enable the two required categories to continue.
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!requiredChecked || saving}
            className="w-full py-3 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-40"
          >
            {saving ? "Saving…" : "I consent to the selected data types"}
          </button>
          <p className="text-11 text-text-disabled text-center leading-relaxed">
            You can change these choices at any time in Settings → Data &amp; Privacy.
            See our <a href="/privacy" className="underline hover:text-text-muted" target="_blank" rel="noopener">Privacy Policy</a> for details.
          </p>
        </div>
      </div>
    </div>
  );
}
