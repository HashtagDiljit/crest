"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
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

type FilterTab = "all" | "bronze" | "silver" | "gold" | "locked";

interface Props {
  achievements: AchievementRow[];
}

export function AchievementGrid({ achievements }: Props) {
  const [filter, setFilter] = useState<FilterTab>("all");

  const earned = achievements.filter((a) => a.unlocked_at);
  const bronzeCount = earned.filter((a) => a.tier === "bronze").length;
  const silverCount = earned.filter((a) => a.tier === "silver").length;
  const goldCount = earned.filter((a) => a.tier === "gold").length;

  const filtered = achievements
    .filter((a) => {
      if (filter === "all") return true;
      if (filter === "locked") return !a.unlocked_at;
      return a.tier === filter;
    })
    .sort((a, b) => {
      // earned first, then by tier, then by name
      if (!!a.unlocked_at !== !!b.unlocked_at) return a.unlocked_at ? -1 : 1;
      const ta = TIER_ORDER[a.tier ?? ""] ?? 0;
      const tb = TIER_ORDER[b.tier ?? ""] ?? 0;
      return ta - tb || a.name.localeCompare(b.name);
    });

  const TABS: Array<{ key: FilterTab; label: string }> = [
    { key: "all", label: `All (${achievements.length})` },
    { key: "bronze", label: `Bronze (${achievements.filter((a) => a.tier === "bronze").length})` },
    { key: "silver", label: `Silver (${achievements.filter((a) => a.tier === "silver").length})` },
    { key: "gold", label: `Gold (${achievements.filter((a) => a.tier === "gold").length})` },
    { key: "locked", label: `Locked (${achievements.filter((a) => !a.unlocked_at).length})` },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3">
        <SummaryTile label="Earned" value={`${earned.length}/${achievements.length}`} color="var(--color-accent)" />
        <SummaryTile label="Bronze" value={`${bronzeCount}`} color={TIER_COLORS.bronze} />
        <SummaryTile label="Silver" value={`${silverCount}`} color={TIER_COLORS.silver} />
        <SummaryTile label="Gold" value={`${goldCount}`} color={TIER_COLORS.gold} />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-3 py-1.5 rounded-pill text-12 font-medium border transition-colors ${
              filter === t.key
                ? "bg-[var(--color-accent-soft)] border-[var(--color-accent-ring)] text-text-primary"
                : "border-border bg-bg-elevated text-text-muted hover:text-text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
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

  return (
    <div
      className={`rounded-r5 border p-4 flex flex-col gap-3 transition-all ${
        earned ? "border-border" : "border-border opacity-50 grayscale"
      }`}
      style={earned ? { background: bg } : { background: "var(--color-bg-elevated)" }}
    >
      <div className="flex items-start justify-between">
        <span className="text-32">{earned ? TIER_ICONS[tier] : "🔒"}</span>
        {earned && (
          <span
            className="text-10 font-mono font-semibold px-2 py-0.5 rounded-pill"
            style={{ background: `${color}22`, color }}
          >
            +{a.xp_reward} XP
          </span>
        )}
        {!earned && <Lock size={12} className="text-text-disabled mt-1" />}
      </div>

      <div>
        <p className="text-13 font-semibold text-text-primary leading-tight">{a.name}</p>
        <p className="text-11 text-text-muted mt-0.5 leading-snug">{a.description}</p>
      </div>

      {earned && a.unlocked_at && (
        <p className="text-10 font-mono text-text-disabled mt-auto">
          {new Date(a.unlocked_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      )}
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
