import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings, Trophy, Dumbbell, BookOpen, Zap, Flame, Target } from "lucide-react";
import { getProfilePageData } from "./actions";

function xpForLevel(level: number): number { return level * 500; }

export const dynamic = "force-dynamic";

const TIER_COLORS: Record<string, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
};

const TIER_ICONS: Record<string, string> = { bronze: "🥉", silver: "🥈", gold: "🥇" };

function getLevelTitle(level: number): string {
  if (level < 5) return "Novice";
  if (level < 10) return "Apprentice";
  if (level < 20) return "Journeyman";
  if (level < 35) return "Expert";
  if (level < 50) return "Master";
  return "Legend";
}

export default async function ProfilePage() {
  const data = await getProfilePageData();
  if (!data) redirect("/login");

  const { profile, stats, prs, recentAchievements } = data;
  const xpNeeded = xpForLevel(profile.level);
  const xpPct = Math.min(100, Math.round((profile.xp / xpNeeded) * 100));
  const initials = (profile.username ?? profile.email).slice(0, 2).toUpperCase();
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <h1 className="font-display text-32 font-semibold text-text-primary tracking-tight">Profile</h1>
        <Link href="/settings" className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill border border-border text-12 text-text-secondary hover:text-text-primary transition-colors">
          <Settings size={13} /> Settings
        </Link>
      </div>

      {/* Identity card */}
      <div className="rounded-r5 border border-border bg-bg-surface p-6 flex flex-col gap-5">
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-pill object-cover flex-shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-pill flex items-center justify-center font-mono text-24 font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, var(--color-accent), #FF8A3D)" }}>
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-display text-22 font-semibold text-text-primary">{profile.username ?? "Anonymous"}</p>
            <p className="text-13 text-text-muted mt-0.5">{profile.email}</p>
            <p className="text-11 text-text-disabled mt-1">Member since {memberSince}</p>
          </div>
        </div>

        {/* Level + XP bar */}
        <div className="rounded-r4 border border-border bg-bg-elevated p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-pill bg-accent flex items-center justify-center font-mono text-15 font-bold text-white">
                {profile.level}
              </div>
              <div>
                <p className="text-14 font-semibold text-text-primary">{getLevelTitle(profile.level)}</p>
                <p className="text-11 text-text-muted">Level {profile.level}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-14 font-bold text-text-primary">{profile.xp.toLocaleString()} XP</p>
              <p className="text-11 text-text-muted">{(xpNeeded - profile.xp).toLocaleString()} to next level</p>
            </div>
          </div>
          <div className="h-2.5 rounded-pill overflow-hidden" style={{ background: "var(--color-xp-track)" }}>
            <div className="h-full rounded-pill transition-all duration-500"
              style={{ width: `${xpPct}%`, background: "linear-gradient(90deg, var(--color-accent), color-mix(in oklab, var(--color-accent) 60%, white))" }} />
          </div>
        </div>
      </div>

      {/* Lifetime stats */}
      <div>
        <p className="text-14 font-semibold text-text-primary mb-3">Lifetime stats</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatTile icon={<Dumbbell size={16} />} label="Workouts" value={stats.totalWorkouts.toLocaleString()} />
          <StatTile icon={<Target size={16} />} label="Total volume" value={`${(stats.totalVolume / 1000).toFixed(1)}t`} />
          <StatTile icon={<Flame size={16} />} label="Longest streak" value={`${stats.longestStreak}d`} color="var(--color-streak)" />
          <StatTile icon={<Flame size={16} />} label="Current streak" value={`${stats.currentStreak}d`} color="var(--color-streak)" />
          <StatTile icon={<BookOpen size={16} />} label="Journal entries" value={stats.totalJournalEntries.toLocaleString()} />
          <StatTile icon={<Zap size={16} />} label="Habit completions" value={stats.totalHabitCompletions.toLocaleString()} />
        </div>
      </div>

      {/* Personal Records */}
      {prs.length > 0 && (
        <div>
          <p className="text-14 font-semibold text-text-primary mb-3">Personal records</p>
          <div className="rounded-r5 border border-border bg-bg-surface overflow-hidden">
            {prs.map((pr, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3 ${i < prs.length - 1 ? "border-b border-border" : ""}`}>
                <p className="text-13 font-medium text-text-primary">{pr.exercise_name}</p>
                <div className="text-right">
                  <span className="font-mono text-14 font-bold text-accent">{pr.weight_kg}kg</span>
                  <span className="text-11 text-text-muted ml-2">× {pr.reps} reps</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent achievements */}
      {recentAchievements.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-14 font-semibold text-text-primary">Recent achievements</p>
            <Link href="/achievements" className="text-12 text-accent hover:text-accent-hover transition-colors">View all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {recentAchievements.map((a) => {
              const color = TIER_COLORS[a.tier ?? ""] ?? "var(--color-accent)";
              return (
                <div key={a.id} className="rounded-r4 border border-border bg-bg-surface p-3 flex items-center gap-3"
                  style={{ background: `${color}10` }}>
                  <span className="text-20">{TIER_ICONS[a.tier ?? ""] ?? <Trophy size={18} />}</span>
                  <div className="min-w-0">
                    <p className="text-12 font-semibold text-text-primary truncate">{a.name}</p>
                    <p className="text-10 font-mono text-text-disabled mt-0.5">
                      {new Date(a.unlocked_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="rounded-r4 border border-border bg-bg-surface p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-text-muted">
        {icon}
        <span className="text-11 font-medium">{label}</span>
      </div>
      <span className="font-mono text-22 font-bold" style={{ color: color ?? "var(--color-text-primary)" }}>{value}</span>
    </div>
  );
}
