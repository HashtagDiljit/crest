"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, RefreshCw, X, ChevronDown, ChevronUp, Dumbbell, Moon, Target, Leaf, Zap, Loader2 } from "lucide-react";

interface Insight {
  id: string;
  category: string;
  title: string;
  body: string;
  action_cta: string | null;
  action_type: string | null;
  generated_at: string;
  dismissed_at: string | null;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  sleep: { icon: <Moon size={14} />, color: "#A39CFF", bg: "rgba(163,156,255,0.12)", label: "Sleep" },
  workout: { icon: <Dumbbell size={14} />, color: "var(--color-accent)", bg: "var(--color-accent-soft)", label: "Workout" },
  habit: { icon: <Target size={14} />, color: "var(--color-warning)", bg: "rgba(245,158,11,0.12)", label: "Habit" },
  nutrition: { icon: <Leaf size={14} />, color: "var(--color-success)", bg: "rgba(34,197,94,0.12)", label: "Nutrition" },
  recovery: { icon: <Zap size={14} />, color: "#38BDF8", bg: "rgba(56,189,248,0.12)", label: "Recovery" },
};

function hoursUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.ceil((midnight.getTime() - now.getTime()) / (1000 * 60 * 60));
}

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dismissed, setDismissed] = useState<Insight[]>([]);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDismissed, setShowDismissed] = useState(false);

  const fetchInsights = useCallback(async () => {
    const res = await fetch("/api/insights/generate");
    if (res.ok) {
      const json = await res.json() as { insights: Insight[]; dismissed: Insight[]; lastGenerated: string | null };
      setInsights(json.insights ?? []);
      setDismissed(json.dismissed ?? []);
      setLastGenerated(json.lastGenerated);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    const res = await fetch("/api/insights/generate", { method: "POST" });
    const json = await res.json() as { error?: string; message?: string; insights?: Insight[] };
    if (res.status === 429) {
      setError("Already generated today. Next refresh available tomorrow.");
    } else if (res.status === 422) {
      setError("Not enough data yet. Log workouts, sleep, and habits for a week to unlock insights.");
    } else if (!res.ok) {
      setError(json.error ?? "Something went wrong");
    } else {
      await fetchInsights();
    }
    setGenerating(false);
  }

  async function handleDismiss(id: string) {
    setInsights((prev) => prev.filter((i) => i.id !== id));
    await fetch("/api/insights/generate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchInsights();
  }

  const generatedToday = lastGenerated
    ? new Date(lastGenerated).toISOString().split("T")[0] === new Date().toISOString().split("T")[0]
    : false;

  const lastGeneratedStr = lastGenerated
    ? new Date(lastGenerated).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-32 font-semibold text-text-primary tracking-tight flex items-center gap-2">
            <Sparkles size={26} className="text-accent" />
            AI Insights
          </h1>
          <p className="text-13 text-text-secondary mt-0.5">
            {lastGeneratedStr ? `Last generated ${lastGeneratedStr}` : "Generate your first insights"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={handleGenerate}
            disabled={generating || generatedToday}
            className="flex items-center gap-1.5 px-4 py-2 rounded-pill bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-50"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {generating ? "Generating…" : "Generate insights"}
          </button>
          {generatedToday && (
            <p className="text-11 text-text-disabled font-mono">
              Next refresh in {hoursUntilMidnight()}h
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-r4 border border-warning border-opacity-30 bg-warning bg-opacity-5 px-4 py-3 text-13 text-warning">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-text-disabled" />
        </div>
      )}

      {/* Empty state */}
      {!loading && insights.length === 0 && !error && (
        <div className="rounded-r5 border border-border bg-bg-surface p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-r5 bg-bg-elevated flex items-center justify-center">
            <Sparkles size={24} className="text-text-disabled" />
          </div>
          <div>
            <p className="font-display text-16 font-semibold text-text-primary">No insights yet</p>
            <p className="text-13 text-text-secondary mt-1 max-w-xs mx-auto">
              Log workouts, sleep, and habits for a week, then generate your first AI insights.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-5 py-2 rounded-pill bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            Generate insights
          </button>
        </div>
      )}

      {/* Insights feed */}
      {insights.length > 0 && (
        <div className="flex flex-col gap-3">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} onDismiss={handleDismiss} />
          ))}
        </div>
      )}

      {/* Dismissed section */}
      {dismissed.length > 0 && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowDismissed((v) => !v)}
            className="flex items-center gap-2 text-13 font-semibold text-text-muted hover:text-text-secondary transition-colors"
          >
            {showDismissed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Dismissed ({dismissed.length})
          </button>
          {showDismissed && (
            <div className="flex flex-col gap-3 opacity-50">
              {dismissed.map((insight) => (
                <InsightCard key={insight.id} insight={insight} onDismiss={() => {}} disabled />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InsightCard({
  insight,
  onDismiss,
  disabled = false,
}: {
  insight: Insight;
  onDismiss: (id: string) => void;
  disabled?: boolean;
}) {
  const cat = CATEGORY_CONFIG[insight.category] ?? CATEGORY_CONFIG.recovery;

  return (
    <div
      className="rounded-r5 border border-border p-5 flex flex-col gap-3 relative"
      style={{ background: cat.bg }}
    >
      {/* Dismiss */}
      {!disabled && (
        <button
          onClick={() => onDismiss(insight.id)}
          className="absolute top-3 right-3 w-7 h-7 rounded-pill hover:bg-bg-elevated flex items-center justify-center text-text-disabled hover:text-text-muted transition-colors"
          aria-label="Dismiss"
        >
          <X size={13} />
        </button>
      )}

      {/* Category pill */}
      <div className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-pill text-11 font-semibold"
        style={{ background: "var(--color-bg-elevated)", color: cat.color }}>
        {cat.icon}
        {cat.label}
      </div>

      {/* Content */}
      <div className="pr-6">
        <p className="font-display text-17 font-semibold text-text-primary leading-snug">{insight.title}</p>
        <p className="text-13 text-text-secondary mt-1.5 leading-relaxed">{insight.body}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {insight.action_cta && insight.action_type !== "dismiss" ? (
          <button className="text-12 font-semibold px-3 py-1.5 rounded-r3 border border-border bg-bg-elevated hover:bg-bg-overlay text-text-primary transition-colors">
            {insight.action_cta}
          </button>
        ) : (
          <div />
        )}
        <p className="text-10 font-mono text-text-disabled">Generated from your last 30 days</p>
      </div>
    </div>
  );
}
