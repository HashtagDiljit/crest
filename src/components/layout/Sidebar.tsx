import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Dumbbell,
  Heart,
  Target,
  Smile,
  Trophy,
  Sparkles,
  Plus,
  Droplets,
  Utensils,
  Weight,
  Moon,
  PenLine,
  Settings,
  type LucideIcon,
} from "lucide-react";

const NAV_PRIMARY = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { id: "workouts", label: "Workouts", icon: Dumbbell, href: "/workouts" },
  { id: "health", label: "Health", icon: Heart, href: "/health" },
  { id: "habits", label: "Habits", icon: Target, href: "/habits" },
  { id: "mood", label: "Mood", icon: Smile, href: "/mood" },
  { id: "journal", label: "Journal", icon: PenLine, href: "/journal" },
  { id: "goals", label: "Goals", icon: Target, href: "/goals" },
] as const;

const NAV_PROGRESS: Array<{
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: string;
  badgeAccent?: boolean;
}> = [
  { id: "achievements", label: "Trophy room", icon: Trophy, href: "/achievements", badge: "12" },
  { id: "insights", label: "AI insights", icon: Sparkles, href: "/insights", badge: "3 new", badgeAccent: true },
];

const QUICK_LOG = [
  { key: "water", label: "Water", icon: Droplets, color: "var(--color-info)" },
  { key: "mood", label: "Mood", icon: Smile, color: "#F472B6" },
  { key: "food", label: "Food", icon: Utensils, color: "var(--color-success)" },
  { key: "weight", label: "Weight", icon: Weight, color: "var(--color-text-secondary)" },
  { key: "sleep", label: "Sleep", icon: Moon, color: "#A39CFF" },
  { key: "note", label: "Note", icon: PenLine, color: "var(--color-warning)" },
] as const;

interface SidebarProps {
  activeId: string;
}

export function Sidebar({ activeId }: SidebarProps) {
  return (
    <aside className="w-sidebar bg-bg-inset border-r border-border flex flex-col gap-0.5 px-3.5 py-5 h-full overflow-y-auto fixed left-0 top-0 bottom-0 z-20">
      <SidebarBrand />
      <SidebarNavPrimary activeId={activeId} />
      <SidebarNavProgress activeId={activeId} />
      <SidebarLogCta />
      <SidebarQuickLog />
      <SidebarSettings />
    </aside>
  );
}

function SidebarBrand() {
  return (
    <div className="flex items-center gap-2.5 px-2 pb-4">
      <CrestLogo />
      <span className="font-display text-18 font-semibold text-text-primary tracking-tight">
        Crest
      </span>
    </div>
  );
}

function SidebarNavPrimary({ activeId }: { activeId: string }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_PRIMARY.map((item) => {
        const active = activeId === item.id;
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-r3 text-13 font-medium transition-colors ${
              active
                ? "bg-[var(--color-accent-soft)] text-text-primary"
                : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
            }`}
          >
            <Icon
              size={16}
              className={active ? "text-accent-hover" : "text-text-muted"}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarNavProgress({ activeId }: { activeId: string }) {
  return (
    <div className="mt-2">
      <div className="text-11 font-semibold uppercase tracking-[0.1em] text-text-muted px-2.5 py-3">
        Progress
      </div>
      <nav className="flex flex-col gap-0.5">
        {NAV_PROGRESS.map((item) => {
          const active = activeId === item.id;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-r3 text-13 font-medium transition-colors ${
                active
                  ? "bg-[var(--color-accent-soft)] text-text-primary"
                  : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
              }`}
            >
              <Icon
                size={16}
                className={active ? "text-accent-hover" : "text-text-muted"}
              />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span
                  className={`font-mono text-11 ${
                    item.badgeAccent ? "text-accent-hover" : "text-text-muted"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function SidebarLogCta() {
  return (
    <button
      className="flex items-center justify-center gap-2 w-full rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold py-2.5 mt-3.5 mb-1 transition-colors"
      style={{ boxShadow: "0 0 0 1px var(--color-accent-ring), 0 8px 22px rgba(108,99,255,0.25)" }}
      type="button"
    >
      <Plus size={16} strokeWidth={2} />
      Log workout
    </button>
  );
}

function SidebarQuickLog() {
  return (
    <div>
      <div className="text-11 font-semibold uppercase tracking-[0.1em] text-text-muted px-1.5 py-3">
        Quick log
      </div>
      <div className="grid grid-cols-3 gap-1.5 px-0.5">
        {QUICK_LOG.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              className="flex flex-col items-center gap-1 p-2 rounded-r3 bg-bg-surface border border-border hover:bg-bg-elevated text-text-muted text-11 font-medium transition-colors"
              title={`Log ${item.label.toLowerCase()}`}
            >
              <span
                className="w-7 h-7 rounded-r2 bg-bg-inset flex items-center justify-center"
              >
                <Icon size={14} style={{ color: item.color }} />
              </span>
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SidebarSettings() {
  return (
    <Link
      href="/settings"
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-r3 text-13 text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors mt-auto"
    >
      <Settings size={16} className="text-text-muted" />
      Settings
    </Link>
  );
}

function CrestLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="14" fill="#16161E" />
      <path
        d="M14 42 L32 18 L50 42"
        stroke="#8B83FF"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 48 L32 32 L44 48"
        stroke="#E8E6E0"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  );
}
