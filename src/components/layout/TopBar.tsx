import { History } from "lucide-react";
import Link from "next/link";
import { CalendarButton } from "./CalendarButton";

interface TopBarProps {
  level: number;
  xp: number;
  xpNeeded: number;
  streak: number;
  username: string;
  initials: string;
}

export function TopBar({ level, xp, xpNeeded, streak, username, initials }: TopBarProps) {
  const xpPct = Math.max(0, Math.min(100, (xp / xpNeeded) * 100));
  const xpRemaining = xpNeeded - xp;

  return (
    <div className="sticky top-4 z-10 mx-6 mt-4 flex items-center gap-3.5 rounded-pill border border-border px-4 py-2 backdrop-blur-[14px]"
      style={{ background: "rgba(22,22,30,0.72)", boxShadow: "var(--shadow-2)" }}
    >
      <LevelPill level={level} username={username} />
      <XpBar xp={xp} xpRemaining={xpRemaining} xpPct={xpPct} nextLevel={level + 1} />
      <StreakChip streak={streak} />
      <button
        type="button"
        aria-label="History"
        className="w-[34px] h-[34px] rounded-pill border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
      >
        <History size={16} />
      </button>
      <CalendarButton />
      <Avatar initials={initials} />
    </div>
  );
}

function LevelPill({ level, username }: { level: number; username: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-pill px-3 py-1"
      style={{
        background: "var(--color-accent-soft)",
        border: "1px solid var(--color-accent-ring)",
      }}
    >
      <span
        className="w-[26px] h-[26px] rounded-pill bg-accent flex items-center justify-center font-mono text-11 font-semibold text-white"
        style={{ fontFeatureSettings: '"tnum" 1' }}
      >
        {level}
      </span>
      <span className="text-13 font-semibold text-text-primary">{username}</span>
    </div>
  );
}

interface XpBarProps {
  xp: number;
  xpRemaining: number;
  xpPct: number;
  nextLevel: number;
}

function XpBar({ xp, xpRemaining, xpPct, nextLevel }: XpBarProps) {
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-1">
      <div className="flex justify-between font-mono text-[10px] text-text-muted tracking-wide">
        <span className="text-text-secondary">{xp.toLocaleString()} XP</span>
        <span>{xpRemaining.toLocaleString()} → lvl {nextLevel}</span>
      </div>
      <div
        className="h-1.5 rounded-pill overflow-hidden"
        style={{ background: "var(--color-xp-track)" }}
      >
        <div
          className="h-full rounded-pill transition-[width] duration-500"
          style={{
            width: `${xpPct}%`,
            background: "linear-gradient(90deg, var(--color-accent), color-mix(in oklab, var(--color-accent) 60%, white))",
          }}
        />
      </div>
    </div>
  );
}

function StreakChip({ streak }: { streak: number }) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill font-mono text-12 text-text-primary"
      style={{
        background: "rgba(255,138,61,0.08)",
        border: "1px solid rgba(255,138,61,0.25)",
        fontFeatureSettings: '"tnum" 1',
      }}
    >
      <FlameIcon />
      <span>
        <strong className="font-medium">{streak}</strong>
        <span className="text-text-muted ml-1">day streak</span>
      </span>
    </div>
  );
}

function FlameIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24">
      <defs>
        <linearGradient id="flame-topbar" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#FF8A3D" />
          <stop offset="100%" stopColor="#FFC46B" />
        </linearGradient>
      </defs>
      <path
        fill="url(#flame-topbar)"
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
      />
    </svg>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <Link href="/profile" aria-label="Profile">
      <div
        className="w-[34px] h-[34px] rounded-pill flex items-center justify-center font-mono text-11 font-semibold text-white hover:opacity-80 transition-opacity"
        style={{
          background: "linear-gradient(135deg, var(--color-accent), #FF8A3D)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {initials}
      </div>
    </Link>
  );
}
