"use client";

import { useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import type { AchievementRow } from "../actions";

const TIER_ORDER: Record<string, number> = { bronze: 0, silver: 1, gold: 2 };
const TIER_COLORS: Record<string, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
};
const TIER_BG: Record<string, string> = {
  bronze: "rgba(205,127,50,0.12)",
  silver: "rgba(192,192,192,0.10)",
  gold: "rgba(255,215,0,0.12)",
};
const TIER_ICONS: Record<string, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
};

type CategoryTab = "all" | "workout" | "strength" | "health" | "nutrition" | "consistency" | "mindset";

const CATEGORY_LABELS: Record<CategoryTab, string> = {
  all: "All",
  workout: "Workout",
  strength: "Strength",
  health: "Health",
  nutrition: "Nutrition",
  consistency: "Consistency",
  mindset: "Mindset",
};

const CATEGORY_TABS: CategoryTab[] = ["all", "workout", "strength", "health", "nutrition", "consistency", "mindset"];

interface Props {
  achievements: AchievementRow[];
}

export function AchievementGrid({ achievements }: Props) {
  const [filter, setFilter] = useState<CategoryTab>("all");

  const earned = achievements.filter((a) => a.unlocked_at);
  const bronzeCount = earned.filter((a) => a.tier === "bronze").length;
  const silverCount = earned.filter((a) => a.tier === "silver").length;
  const goldCount = earned.filter((a) => a.tier === "gold").length;
  const pctComplete = achievements.length > 0 ? Math.round((earned.length / achievements.length) * 100) : 0;

  const recentlyUnlocked = [...earned]
    .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime())
    .slice(0, 3);

  const filtered = achievements
    .filter((a) => filter === "all" || a.category === filter)
    .sort((a, b) => {
      // earned first, then by tier, then by name
      if (!!a.unlocked_at !== !!b.unlocked_at) return a.unlocked_at ? -1 : 1;
      const ta = TIER_ORDER[a.tier ?? ""] ?? 0;
      const tb = TIER_ORDER[b.tier ?? ""] ?? 0;
      return ta - tb || a.name.localeCompare(b.name);
    });

  return (
    <div className="flex flex-col gap-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <SummaryTile label="Earned" value={`${earned.length}/${achievements.length}`} color="var(--color-accent)" />
        <SummaryTile label="Complete" value={`${pctComplete}%`} color="var(--color-accent)" />
        <SummaryTile label="Bronze" value={`${bronzeCount}`} color={TIER_COLORS.bronze} />
        <SummaryTile label="Silver" value={`${silverCount}`} color={TIER_COLORS.silver} />
        <SummaryTile label="Gold" value={`${goldCount}`} color={TIER_COLORS.gold} />
      </div>

      {/* Recently unlocked */}
      {recentlyUnlocked.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-accent" />
            <span className="font-display text-14 font-semibold text-text-primary">Recently unlocked</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recentlyUnlocked.map((a, i) => (
              <div
                key={a.id}
                className="rounded-r5 border border-border p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2"
                style={{ background: TIER_BG[a.tier ?? "bronze"], animationDelay: `${i * 80}ms`, animationDuration: "400ms", animationFillMode: "backwards" }}
              >
                <span className="text-28">{TIER_ICONS[a.tier ?? "bronze"]}</span>
                <div className="min-w-0">
                  <p className="text-13 font-semibold text-text-primary truncate">{a.name}</p>
                  <p className="text-10 font-mono text-text-disabled mt-0.5">
                    {new Date(a.unlocked_at!).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORY_TABS.map((c) => {
          const count = c === "all" ? achievements.length : achievements.filter((a) => a.category === c).length;
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-pill text-12 font-medium border transition-colors ${
                filter === c
                  ? "bg-[var(--color-accent-soft)] border-[var(--color-accent-ring)] text-text-primary"
                  : "border-border bg-bg-elevated text-text-muted hover:text-text-secondary"
              }`}
            >
              {CATEGORY_LABELS[c]} ({count})
            </button>
          );
        })}
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((a) => (
          <BadgeCard key={a.id} achievement={a} />
        ))}
      </div>
    </div>
  );
}

function BadgeCard({ achievement: a }: { achievement: AchievementRow }) {
  const earned = !!a.unlocked_at;
  const tier = a.tier ?? "bronze";
  const color = TIER_COLORS[tier];
  const bg = TIER_BG[tier];

  const progressPct = a.target && a.target > 0 ? Math.min(100, Math.round(((a.current ?? 0) / a.target) * 100)) : null;

  return (
    <div
      className={`rounded-r5 border p-4 flex flex-col gap-3 transition-all ${
        earned ? "border-border" : "border-border opacity-60"
      }`}
      style={{
        background: earned ? bg : "var(--color-bg-elevated)",
        boxShadow: earned ? `0 0 0 1px ${color}33` : undefined,
      }}
    >
      <div className="flex items-start justify-between">
        <span
          className={`text-32 ${earned ? "" : "grayscale opacity-50"}`}
          style={earned ? { filter: `drop-shadow(0 0 6px ${color}66)` } : undefined}
        >
          {TIER_ICONS[tier]}
        </span>
        {earned ? (
          <span
            className="text-10 font-mono font-semibold px-2 py-0.5 rounded-pill"
            style={{ background: `${color}22`, color }}
          >
            +{a.xp_reward} XP
          </span>
        ) : (
          <Lock size={12} className="text-text-disabled mt-1" />
        )}
      </div>

      <div>
        <p className="text-13 font-semibold text-text-primary leading-tight">{a.name}</p>
        <p className="text-11 text-text-muted mt-0.5 leading-snug">{a.description}</p>
      </div>

      {earned && a.unlocked_at ? (
        <p className="text-10 font-mono text-text-disabled mt-auto">
          {new Date(a.unlocked_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      ) : progressPct !== null ? (
        <div className="mt-auto flex flex-col gap-1">
          <div className="h-1.5 rounded-pill bg-bg-overlay overflow-hidden">
            <div
              className="h-full rounded-pill transition-all"
              style={{ width: `${progressPct}%`, background: "var(--color-accent)" }}
            />
          </div>
          <p className="text-10 font-mono text-text-disabled">
            {a.current}/{a.target} {a.unit ?? ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function SummaryTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-r4 border border-border bg-bg-surface p-3 flex flex-col gap-0.5">
      <span className="font-mono text-20 font-bold" style={{ color }}>{value}</span>
      <span className="text-11 text-text-muted">{label}</span>
    </div>
  );
}
