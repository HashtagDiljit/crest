"use client";

import { Zap, BedDouble, Dumbbell, RefreshCw, TrendingUp } from "lucide-react";

interface Props {
  readinessScore: number;
  readinessLabel: string;
  lastSleepHrs: number | null;
  hrv: number | null;
  hasEnoughData: boolean;
}

interface Suggestion {
  type: "rest" | "recovery" | "moderate" | "push";
  headline: string;
  description: string;
  reasoning: string;
  icon: React.ElementType;
  color: string;
}

function getSuggestion(score: number): Omit<Suggestion, "reasoning"> {
  if (score < 40) {
    return {
      type: "rest",
      headline: "Rest day recommended",
      description: "Your body is fatigued. Focus on sleep, light walking, and mobility work today.",
      icon: BedDouble,
      color: "#EF4444",
    };
  }
  if (score < 65) {
    return {
      type: "recovery",
      headline: "Active recovery",
      description: "Keep today light — a short walk, yoga, or mobility session. Avoid heavy lifting.",
      icon: RefreshCw,
      color: "#F59E0B",
    };
  }
  if (score < 85) {
    return {
      type: "moderate",
      headline: "Moderate intensity",
      description: "You're ready to train. Stick to your planned session and avoid going to failure.",
      icon: Dumbbell,
      color: "#6C63FF",
    };
  }
  return {
    type: "push",
    headline: "Push hard today",
    description: "Optimal readiness — ideal for a PR attempt, high-volume session, or new intensity milestone.",
    icon: TrendingUp,
    color: "#22C55E",
  };
}

function buildReasoning(score: number, lastSleepHrs: number | null, hrv: number | null): string {
  const parts: string[] = [];
  if (lastSleepHrs !== null) {
    parts.push(`${lastSleepHrs.toFixed(1)}h sleep`);
  }
  if (hrv !== null) {
    const hrvLabel = hrv >= 60 ? "good HRV" : hrv >= 40 ? "average HRV" : "low HRV";
    parts.push(hrvLabel);
  }
  if (parts.length === 0) return `Based on your readiness score of ${score}.`;
  return `Based on ${parts.join(" and ")} last night (score ${score}/100).`;
}

export function WorkoutSuggestion({ readinessScore, readinessLabel, lastSleepHrs, hrv, hasEnoughData }: Props) {
  if (!hasEnoughData) return null;

  const suggestion = getSuggestion(readinessScore);
  const reasoning = buildReasoning(readinessScore, lastSleepHrs, hrv);
  const Icon = suggestion.icon;

  return (
    <div className="flex items-start gap-4 rounded-r5 border border-border bg-bg-surface p-5" style={{ borderLeftColor: suggestion.color, borderLeftWidth: 3 }}>
      <div
        className="w-10 h-10 rounded-r3 flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: `color-mix(in oklab, ${suggestion.color} 15%, transparent)` }}
      >
        <Icon size={18} style={{ color: suggestion.color }} />
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-14 font-semibold text-text-primary">{suggestion.headline}</p>
          <span
            className="px-2 py-0.5 rounded-pill text-10 font-semibold"
            style={{
              color: suggestion.color,
              background: `color-mix(in oklab, ${suggestion.color} 15%, transparent)`,
            }}
          >
            <Zap size={9} className="inline mr-0.5 -mt-0.5" />
            {readinessLabel} · {readinessScore}/100
          </span>
        </div>
        <p className="text-13 text-text-secondary">{suggestion.description}</p>
        <p className="text-11 text-text-muted mt-0.5">{reasoning}</p>
      </div>
    </div>
  );
}
