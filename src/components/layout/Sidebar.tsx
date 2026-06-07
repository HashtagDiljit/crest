"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Dumbbell, Heart, Target, Smile, Trophy,
  Sparkles, Plus, Droplets, Utensils, Weight, Moon, PenLine, Settings,
  ChevronLeft, ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { WaterModal, MoodModal, FoodModal, WeightModal, SleepModal, NoteModal } from "./QuickLogModals";
import { startBlankSession } from "@/app/(dashboard)/workouts/actions";

type ModalKey = "water" | "mood" | "food" | "weight" | "sleep" | "note" | null;

const NAV_PRIMARY: Array<{ id: string; label: string; icon: LucideIcon; href: string }> = [
  { id: "dashboard",  label: "Dashboard",  icon: LayoutDashboard, href: "/dashboard" },
  { id: "workouts",   label: "Workouts",   icon: Dumbbell,        href: "/workouts" },
  { id: "health",     label: "Health",     icon: Heart,           href: "/health" },
  { id: "nutrition",  label: "Nutrition",  icon: Utensils,        href: "/nutrition" },
  { id: "habits",     label: "Habits",     icon: Target,          href: "/habits" },
  { id: "mood",       label: "Mood",       icon: Smile,           href: "/mood" },
  { id: "journal",    label: "Journal",    icon: PenLine,         href: "/journal" },
  { id: "goals",      label: "Goals",      icon: Target,          href: "/goals" },
];

const NAV_PROGRESS: Array<{ id: string; label: string; icon: LucideIcon; href: string }> = [
  { id: "achievements", label: "Trophy room", icon: Trophy,   href: "/achievements" },
  { id: "insights",     label: "AI insights", icon: Sparkles, href: "/ai-insights" },
];

const QUICK_LOG: Array<{ key: NonNullable<ModalKey>; label: string; icon: LucideIcon; color: string }> = [
  { key: "water",  label: "Water",  icon: Droplets, color: "var(--color-info)" },
  { key: "mood",   label: "Mood",   icon: Smile,    color: "#F472B6" },
  { key: "food",   label: "Food",   icon: Utensils, color: "var(--color-success)" },
  { key: "weight", label: "Weight", icon: Weight,   color: "var(--color-text-secondary)" },
  { key: "sleep",  label: "Sleep",  icon: Moon,     color: "#A39CFF" },
  { key: "note",   label: "Note",   icon: PenLine,  color: "var(--color-warning)" },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

const EXPANDED_W = 240;
const COLLAPSED_W = 64;

export function Sidebar({ hiddenNavIds = [] }: { hiddenNavIds?: string[] }) {
  const pathname = usePathname();
  const [openModal, setOpenModal] = useState<ModalKey>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("arc-sidebar-collapsed");
    if (stored === "true") {
      setCollapsed(true);
      document.documentElement.style.setProperty("--sidebar-w", `${COLLAPSED_W}px`);
    }
  }, []);

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    const w = next ? COLLAPSED_W : EXPANDED_W;
    document.documentElement.style.setProperty("--sidebar-w", `${w}px`);
    try { localStorage.setItem("arc-sidebar-collapsed", String(next)); } catch { /* noop */ }
  }

  const c = collapsed;

  return (
    <>
      <aside
        className="hidden md:flex bg-bg-inset border-r border-border flex-col h-full overflow-y-auto overflow-x-hidden fixed left-0 top-0 bottom-0 z-20 transition-[width] duration-200"
        style={{ width: c ? COLLAPSED_W : EXPANDED_W }}
      >
        {/* Brand */}
        <div className={`flex items-center gap-2.5 px-3.5 py-5 pb-4 ${c ? "justify-center" : ""}`}>
          <ArcLogo />
          {!c && <span className="font-display text-18 font-semibold text-text-primary tracking-tight whitespace-nowrap">Arc</span>}
        </div>

        {/* Primary nav */}
        <nav className={`flex flex-col gap-0.5 ${c ? "px-2" : "px-3.5"}`}>
          {NAV_PRIMARY.filter((item) => !hiddenNavIds.includes(item.id)).map((item) => {
            const active = isActive(item.href, pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                title={c ? item.label : undefined}
                className={`flex items-center rounded-r3 text-13 font-medium transition-colors ${
                  c ? "justify-center p-2.5" : "gap-2.5 px-2.5 py-2"
                } ${
                  active
                    ? "bg-[var(--color-accent-soft)] text-text-primary"
                    : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                }`}
              >
                <Icon size={16} className={active ? "text-accent flex-shrink-0" : "text-text-muted flex-shrink-0"} />
                {!c && item.label}
              </Link>
            );
          })}
        </nav>

        {/* Progress section */}
        <div className={`mt-2 ${c ? "px-2" : "px-3.5"}`}>
          {!c && <div className="text-11 font-semibold uppercase tracking-[0.1em] text-text-muted px-2.5 py-3">Progress</div>}
          {c && <div className="h-px bg-border mx-1 my-3" />}
          <nav className="flex flex-col gap-0.5">
            {NAV_PROGRESS.map((item) => {
              const active = isActive(item.href, pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  title={c ? item.label : undefined}
                  className={`flex items-center rounded-r3 text-13 font-medium transition-colors ${
                    c ? "justify-center p-2.5" : "gap-2.5 px-2.5 py-2"
                  } ${
                    active
                      ? "bg-[var(--color-accent-soft)] text-text-primary"
                      : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                  }`}
                >
                  <Icon size={16} className={active ? "text-accent flex-shrink-0" : "text-text-muted flex-shrink-0"} />
                  {!c && item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Log workout CTA */}
        <form
          action={async () => { await startBlankSession(); }}
          className={`mt-3.5 mb-1 ${c ? "px-2" : "px-3.5"}`}
        >
          <button
            type="submit"
            title={c ? "Log workout" : undefined}
            className={`flex items-center justify-center w-full rounded-r3 bg-accent hover:bg-accent-hover text-white font-semibold transition-colors ${
              c ? "p-2.5" : "gap-2 py-2.5 text-13"
            }`}
            style={{ boxShadow: "0 0 0 1px var(--color-accent-ring), 0 8px 22px rgba(108,99,255,0.25)" }}
          >
            <Plus size={16} strokeWidth={2} className="flex-shrink-0" />
            {!c && "Log workout"}
          </button>
        </form>

        {/* Quick log — hidden when collapsed */}
        {!c && (
          <div className="px-3.5">
            <div className="text-11 font-semibold uppercase tracking-[0.1em] text-text-muted px-1.5 py-3">Quick log</div>
            <div className="grid grid-cols-3 gap-1.5 px-0.5">
              {QUICK_LOG.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setOpenModal(item.key)}
                    className="flex flex-col items-center gap-1 p-2 rounded-r3 bg-bg-surface border border-border hover:bg-bg-elevated text-text-muted text-11 font-medium transition-colors active:scale-95"
                    title={`Log ${item.label.toLowerCase()}`}
                  >
                    <span
                      className="w-8 h-8 rounded-pill flex items-center justify-center"
                      style={{ background: `color-mix(in oklab, ${item.color} 15%, transparent)` }}
                    >
                      <Icon size={24} style={{ color: item.color }} />
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom: settings + collapse toggle */}
        <div className={`mt-auto flex flex-col gap-0.5 ${c ? "px-2" : "px-3.5"} pb-3`}>
          <Link
            href="/settings"
            title={c ? "Settings" : undefined}
            className={`flex items-center rounded-r3 text-13 text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors ${
              c ? "justify-center p-2.5" : "gap-2.5 px-2.5 py-2"
            }`}
          >
            <Settings size={16} className="text-text-muted flex-shrink-0" />
            {!c && "Settings"}
          </Link>

          <button
            onClick={toggleCollapse}
            title={c ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex items-center rounded-r3 text-13 text-text-muted hover:text-text-secondary hover:bg-bg-elevated transition-colors ${
              c ? "justify-center p-2.5" : "gap-2.5 px-2.5 py-2"
            }`}
          >
            {c ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!c && <span className="text-12">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Quick log modals — always rendered so they're accessible even when sidebar is collapsed */}
      {openModal === "water"  && <WaterModal  onClose={() => setOpenModal(null)} />}
      {openModal === "mood"   && <MoodModal   onClose={() => setOpenModal(null)} />}
      {openModal === "food"   && <FoodModal   onClose={() => setOpenModal(null)} />}
      {openModal === "weight" && <WeightModal onClose={() => setOpenModal(null)} />}
      {openModal === "sleep"  && <SleepModal  onClose={() => setOpenModal(null)} />}
      {openModal === "note"   && <NoteModal   onClose={() => setOpenModal(null)} />}
    </>
  );
}

function ArcLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 64 64" fill="none" className="flex-shrink-0">
      <rect width="64" height="64" rx="14" style={{ fill: "var(--color-bg-elevated)" }} />
      <path d="M14 42 L32 18 L50 42" style={{ stroke: "var(--color-accent)" }} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 48 L32 32 L44 48" style={{ stroke: "var(--color-text-primary)" }} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}
