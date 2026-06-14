"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Dumbbell, Heart, Target, Smile,
  MoreHorizontal, PenLine, Trophy, Sparkles, Settings, X, Plus,
  Droplets, Utensils, Weight, Moon,
  type LucideIcon,
} from "lucide-react";
import { WaterModal, MoodModal, FoodModal, WeightModal, SleepModal, NoteModal } from "./QuickLogModals";
import { startBlankSession } from "@/app/(dashboard)/workouts/actions";

type ModalKey = "water" | "mood" | "food" | "weight" | "sleep" | "note" | null;

const TAB_ITEMS: Array<{ id: string; label: string; icon: LucideIcon; href: string }> = [
  { id: "dashboard", label: "Home",      icon: LayoutDashboard, href: "/dashboard" },
  { id: "workouts",  label: "Workouts",  icon: Dumbbell,        href: "/workouts" },
  { id: "health",    label: "Health",    icon: Heart,           href: "/health" },
  { id: "habits",    label: "Habits",    icon: Target,          href: "/habits" },
  { id: "mood",      label: "Mood",      icon: Smile,           href: "/mood" },
];

const MORE_ITEMS: Array<{ id: string; label: string; icon: LucideIcon; href: string }> = [
  { id: "nutrition",    label: "Nutrition",   icon: Utensils, href: "/nutrition" },
  { id: "journal",      label: "Journal",     icon: PenLine,  href: "/journal" },
  { id: "goals",        label: "Goals",       icon: Target,   href: "/goals" },
  { id: "achievements", label: "Trophy room", icon: Trophy,   href: "/achievements" },
  { id: "insights",     label: "AI insights", icon: Sparkles, href: "/ai-insights" },
  { id: "settings",     label: "Settings",    icon: Settings, href: "/settings" },
];

const QUICK_LOG_ITEMS = [
  { key: "water"  as const, label: "Water",  icon: Droplets, color: "var(--color-info)" },
  { key: "mood"   as const, label: "Mood",   icon: Smile,    color: "#F472B6" },
  { key: "food"   as const, label: "Food",   icon: Utensils, color: "var(--color-success)" },
  { key: "weight" as const, label: "Weight", icon: Weight,   color: "var(--color-text-secondary)" },
  { key: "sleep"  as const, label: "Sleep",  icon: Moon,     color: "#A39CFF" },
  { key: "note"   as const, label: "Note",   icon: PenLine,  color: "var(--color-warning)" },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function BottomTabBar({ hiddenNavIds = [] }: { hiddenNavIds?: string[] }) {
  const pathname = usePathname();
  const visibleTabItems = TAB_ITEMS.filter((item) => item.id === "dashboard" || !hiddenNavIds.includes(item.id));
  const visibleMoreItems = MORE_ITEMS.filter((item) => item.id === "settings" || !hiddenNavIds.includes(item.id));
  const [showMore, setShowMore] = useState(false);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [openModal, setOpenModal] = useState<ModalKey>(null);

  function openLog(key: ModalKey) {
    setOpenModal(key);
    setShowQuickLog(false);
  }

  return (
    <>
      {/* FAB — quick log trigger */}
      <button
        type="button"
        onClick={() => setShowQuickLog((v) => !v)}
        className="lg:hidden fixed z-40 w-12 h-12 rounded-pill bg-accent text-white flex items-center justify-center transition-all"
        style={{
          bottom: "calc(72px + env(safe-area-inset-bottom))",
          right: "16px",
          boxShadow: "0 0 0 1px var(--color-accent-ring), 0 8px 22px rgba(108,99,255,0.30)",
        }}
        aria-label="Quick log"
      >
        <Plus
          size={22}
          strokeWidth={2.5}
          style={{ transform: showQuickLog ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        />
      </button>

      {/* Quick log popup */}
      {showQuickLog && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-30"
            onClick={() => setShowQuickLog(false)}
          />
          <div
            className="lg:hidden fixed z-40 rounded-r5 border border-border bg-bg-surface p-3"
            style={{
              bottom: "calc(128px + env(safe-area-inset-bottom))",
              right: "8px",
              boxShadow: "var(--shadow-3)",
            }}
          >
            <div className="grid grid-cols-3 gap-2 mb-2">
              {QUICK_LOG_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => openLog(item.key)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-r3 bg-bg-elevated min-w-[68px]"
                  >
                    <Icon size={18} style={{ color: item.color }} />
                    <span className="text-11 font-medium text-text-muted">{item.label}</span>
                  </button>
                );
              })}
            </div>
            <form action={async () => { await startBlankSession(); setShowQuickLog(false); }}>
              <button
                type="submit"
                className="w-full py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors"
              >
                Log workout
              </button>
            </form>
          </div>
        </>
      )}

      {/* More drawer */}
      {showMore && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowMore(false)}
          />
          <div
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-r5 border-t border-border bg-bg-surface px-4 pt-4"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-display text-15 font-semibold text-text-primary">More</span>
              <button
                onClick={() => setShowMore(false)}
                className="w-8 h-8 flex items-center justify-center rounded-pill text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex flex-col gap-0.5">
              {visibleMoreItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, pathname);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-r3 text-15 font-medium transition-colors ${
                      active
                        ? "bg-[var(--color-accent-soft)] text-text-primary"
                        : "text-text-secondary hover:bg-bg-elevated"
                    }`}
                  >
                    <Icon size={18} className={active ? "text-accent" : "text-text-muted"} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}

      {/* Bottom tab bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch border-t border-border bg-bg-surface"
        style={{ height: "calc(56px + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {visibleTabItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? "text-accent" : "text-text-muted"
              }`}
            >
              <Icon size={20} />
              <span className="text-10 font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setShowMore(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-text-muted"
        >
          <MoreHorizontal size={20} />
          <span className="text-10 font-medium">More</span>
        </button>
      </nav>

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
