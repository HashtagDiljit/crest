"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Dumbbell, Heart, Target, Smile, Trophy,
  Sparkles, Plus, Droplets, Utensils, Weight, Moon, PenLine, Settings,
  type LucideIcon,
} from "lucide-react";
import { WaterModal, MoodModal, FoodModal, WeightModal, SleepModal, NoteModal } from "./QuickLogModals";

type ModalKey = "water" | "mood" | "food" | "weight" | "sleep" | "note" | null;

const NAV_PRIMARY: Array<{ id: string; label: string; icon: LucideIcon; href: string }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { id: "workouts", label: "Workouts", icon: Dumbbell, href: "/workouts" },
  { id: "health", label: "Health", icon: Heart, href: "/health" },
  { id: "habits", label: "Habits", icon: Target, href: "/habits" },
  { id: "mood", label: "Mood", icon: Smile, href: "/mood" },
  { id: "journal", label: "Journal", icon: PenLine, href: "/journal" },
  { id: "goals", label: "Goals", icon: Target, href: "/goals" },
];

const NAV_PROGRESS: Array<{ id: string; label: string; icon: LucideIcon; href: string; badge?: string; badgeAccent?: boolean }> = [
  { id: "achievements", label: "Trophy room", icon: Trophy, href: "/achievements" },
  { id: "insights", label: "AI insights", icon: Sparkles, href: "/ai-insights" },
];

const QUICK_LOG: Array<{ key: ModalKey & string; label: string; icon: LucideIcon; color: string }> = [
  { key: "water", label: "Water", icon: Droplets, color: "var(--color-info)" },
  { key: "mood", label: "Mood", icon: Smile, color: "#F472B6" },
  { key: "food", label: "Food", icon: Utensils, color: "var(--color-success)" },
  { key: "weight", label: "Weight", icon: Weight, color: "var(--color-text-secondary)" },
  { key: "sleep", label: "Sleep", icon: Moon, color: "#A39CFF" },
  { key: "note", label: "Note", icon: PenLine, color: "var(--color-warning)" },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  const [openModal, setOpenModal] = useState<ModalKey>(null);

  return (
    <>
      <aside className="w-sidebar bg-bg-inset border-r border-border flex flex-col gap-0.5 px-3.5 py-5 h-full overflow-y-auto fixed left-0 top-0 bottom-0 z-20">
        <SidebarBrand />

        {/* Primary nav */}
        <nav className="flex flex-col gap-0.5">
          {NAV_PRIMARY.map((item) => {
            const active = isActive(item.href, pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-r3 text-13 font-medium transition-colors ${
                  active ? "bg-[var(--color-accent-soft)] text-text-primary" : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                }`}
              >
                <Icon size={16} className={active ? "text-accent-hover" : "text-text-muted"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Progress nav */}
        <div className="mt-2">
          <div className="text-11 font-semibold uppercase tracking-[0.1em] text-text-muted px-2.5 py-3">Progress</div>
          <nav className="flex flex-col gap-0.5">
            {NAV_PROGRESS.map((item) => {
              const active = isActive(item.href, pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-r3 text-13 font-medium transition-colors ${
                    active ? "bg-[var(--color-accent-soft)] text-text-primary" : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                  }`}
                >
                  <Icon size={16} className={active ? "text-accent-hover" : "text-text-muted"} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className={`font-mono text-11 ${item.badgeAccent ? "text-accent-hover" : "text-text-muted"}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Log workout CTA */}
        <Link
          href="/workouts/start"
          className="flex items-center justify-center gap-2 w-full rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold py-2.5 mt-3.5 mb-1 transition-colors"
          style={{ boxShadow: "0 0 0 1px var(--color-accent-ring), 0 8px 22px rgba(108,99,255,0.25)" }}
        >
          <Plus size={16} strokeWidth={2} />
          Log workout
        </Link>

        {/* Quick log */}
        <div>
          <div className="text-11 font-semibold uppercase tracking-[0.1em] text-text-muted px-1.5 py-3">Quick log</div>
          <div className="grid grid-cols-3 gap-1.5 px-0.5">
            {QUICK_LOG.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setOpenModal(item.key)}
                  className="flex flex-col items-center gap-1 p-2 rounded-r3 bg-bg-surface border border-border hover:bg-bg-elevated text-text-muted text-11 font-medium transition-colors"
                  title={`Log ${item.label.toLowerCase()}`}
                >
                  <span className="w-7 h-7 rounded-r2 bg-bg-inset flex items-center justify-center">
                    <Icon size={14} style={{ color: item.color }} />
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-r3 text-13 text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors mt-auto"
        >
          <Settings size={16} className="text-text-muted" />
          Settings
        </Link>
      </aside>

      {/* Quick log modals */}
      {openModal === "water"  && <WaterModal  onClose={() => setOpenModal(null)} />}
      {openModal === "mood"   && <MoodModal   onClose={() => setOpenModal(null)} />}
      {openModal === "food"   && <FoodModal   onClose={() => setOpenModal(null)} />}
      {openModal === "weight" && <WeightModal onClose={() => setOpenModal(null)} />}
      {openModal === "sleep"  && <SleepModal  onClose={() => setOpenModal(null)} />}
      {openModal === "note"   && <NoteModal   onClose={() => setOpenModal(null)} />}
    </>
  );
}

function SidebarBrand() {
  return (
    <div className="flex items-center gap-2.5 px-2 pb-4">
      <CrestLogo />
      <span className="font-display text-18 font-semibold text-text-primary tracking-tight">Crest</span>
    </div>
  );
}

function CrestLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="14" style={{ fill: "var(--color-bg-elevated)" }} />
      <path d="M14 42 L32 18 L50 42" style={{ stroke: "var(--color-accent)" }} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 48 L32 32 L44 48" style={{ stroke: "var(--color-text-primary)" }} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}
