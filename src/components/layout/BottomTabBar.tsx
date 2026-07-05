"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, Dumbbell, Heart, Target, CheckCircle2, Smile,
  MoreHorizontal, PenLine, Trophy, Sparkles, Settings, X, Plus,
  Droplets, Utensils, Weight, Moon,
  type LucideIcon,
} from "lucide-react";
import { WaterModal, MoodModal, FoodModal, WeightModal, SleepModal, NoteModal } from "./QuickLogModals";
import { startBlankSession } from "@/app/(dashboard)/workouts/actions";
import { updateBottomNavItems } from "@/app/(dashboard)/settings/actions";

type ModalKey = "water" | "mood" | "food" | "weight" | "sleep" | "note" | null;

const HOME_ITEM = { id: "dashboard", label: "Home", icon: LayoutDashboard, href: "/dashboard" };

// All sections that can occupy one of the 4 customisable slots, or appear in the "More" drawer.
const SECTION_ITEMS: Array<{ id: string; label: string; icon: LucideIcon; href: string }> = [
  { id: "workouts",     label: "Workouts",    icon: Dumbbell,     href: "/workouts" },
  { id: "health",       label: "Health",      icon: Heart,        href: "/health" },
  { id: "habits",       label: "Habits",      icon: CheckCircle2, href: "/habits" },
  { id: "mood",         label: "Mood",        icon: Smile,        href: "/mood" },
  { id: "nutrition",    label: "Nutrition",   icon: Utensils,     href: "/nutrition" },
  { id: "journal",      label: "Journal",     icon: PenLine,      href: "/journal" },
  { id: "goals",        label: "Goals",       icon: Target,       href: "/goals" },
  { id: "achievements", label: "Trophy room", icon: Trophy,       href: "/achievements" },
  { id: "insights",     label: "AI insights", icon: Sparkles,     href: "/ai-insights" },
  { id: "settings",     label: "Settings",    icon: Settings,     href: "/settings" },
];

const MORE_ITEM: { id: string; label: string; icon: LucideIcon; href?: string } = { id: "more", label: "More", icon: MoreHorizontal };

const DEFAULT_SLOTS = ["workouts", "health", "habits", "more"];

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

function findSection(id: string): { id: string; label: string; icon: LucideIcon; href?: string } {
  if (id === "more") return MORE_ITEM;
  return SECTION_ITEMS.find((item) => item.id === id) ?? MORE_ITEM;
}

const LONG_PRESS_MS = 500;

export function BottomTabBar({
  hiddenNavIds = [],
  bottomNavItems = DEFAULT_SLOTS,
}: {
  hiddenNavIds?: string[];
  bottomNavItems?: string[];
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Filter out hidden sections, and ensure exactly 4 slots (falling back to defaults if needed).
  const availableSections = SECTION_ITEMS.filter((item) => !hiddenNavIds.includes(item.id));
  const availableIds = new Set(availableSections.map((s) => s.id));
  availableIds.add("more");

  const rawSlots = (bottomNavItems.length === 4 ? bottomNavItems : DEFAULT_SLOTS)
    .map((id) => (availableIds.has(id) ? id : "more"));
  const slots: string[] = rawSlots.length === 4 ? rawSlots : DEFAULT_SLOTS;

  const [showMore, setShowMore] = useState(false);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [openModal, setOpenModal] = useState<ModalKey>(null);
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [pending, setPending] = useState(false);

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  function openLog(key: ModalKey) {
    setOpenModal(key);
    setShowQuickLog(false);
  }

  function startPress(slotIndex: number) {
    longPressFired.current = false;
    pressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setPickerSlot(slotIndex);
    }, LONG_PRESS_MS);
  }

  function cancelPress() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  function handleSlotClick(e: React.MouseEvent, item: { id: string; href?: string }) {
    if (longPressFired.current) {
      e.preventDefault();
      longPressFired.current = false;
      return;
    }
    if (item.id === "more") {
      e.preventDefault();
      setShowMore(true);
    }
  }

  async function chooseSection(sectionId: string) {
    if (pickerSlot === null) return;
    const newSlots = [...slots];
    newSlots[pickerSlot] = sectionId;
    setPickerSlot(null);
    setPending(true);
    try {
      await updateBottomNavItems(newSlots);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  // Sections currently occupying a visible slot
  const slotSectionIds = new Set(slots.filter((id) => id !== "more"));

  // "More" drawer contents: every available section not currently in a visible slot, plus settings always.
  const moreItems = availableSections.filter((item) => !slotSectionIds.has(item.id));

  // Picker options: all available sections (so user can re-pick) plus "More"
  const pickerOptions: Array<{ id: string; label: string; icon: LucideIcon }> = [
    ...availableSections,
    MORE_ITEM,
  ];

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
      <AnimatePresence>
        {showQuickLog && (
          <>
            <div
              className="lg:hidden fixed inset-0 z-30"
              onClick={() => setShowQuickLog(false)}
            />
            <motion.div
              className="lg:hidden fixed z-40 rounded-r5 border border-border bg-bg-surface p-3 origin-bottom-right"
              style={{
                bottom: "calc(128px + env(safe-area-inset-bottom))",
                right: "8px",
                boxShadow: "var(--shadow-3)",
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* More drawer */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
              onClick={() => setShowMore(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-r5 border-t border-border bg-bg-surface px-4 pt-4"
              style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.2 }}
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
                {moreItems.map((item) => {
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Slot picker — long-press customisation */}
      <AnimatePresence>
        {pickerSlot !== null && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
              onClick={() => setPickerSlot(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-r5 border-t border-border bg-bg-surface px-4 pt-4"
              style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-display text-15 font-semibold text-text-primary">Choose icon</span>
                <button
                  onClick={() => setPickerSlot(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-pill text-text-muted hover:text-text-primary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {pickerOptions.map((item) => {
                  const Icon = item.icon;
                  const selected = slots[pickerSlot] === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={pending}
                      onClick={() => chooseSection(item.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-r3 transition-colors ${
                        selected ? "bg-[var(--color-accent-soft)] text-accent" : "bg-bg-elevated text-text-muted"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-11 font-medium text-center">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom tab bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch border-t border-border bg-bg-surface"
        style={{
          height: "calc(56px + env(safe-area-inset-bottom))",
          paddingBottom: "env(safe-area-inset-bottom)",
          overscrollBehavior: "none",
          transform: "translateZ(0)",
        }}
      >
        {/* Left two slots */}
        {slots.slice(0, 2).map((slotId, i) => {
          const item = findSection(slotId);
          const Icon = item.icon;
          const href = item.href;
          const active = href ? isActive(href, pathname) : false;
          const content = (
            <>
              {active && (
                <motion.span
                  layoutId="bottom-nav-active-pill"
                  className="absolute inset-x-2 inset-y-1 rounded-r3 bg-[var(--color-accent-soft)]"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Icon size={20} className="relative" />
              <span className="text-10 font-medium relative">{item.label}</span>
            </>
          );
          const className = `relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors select-none ${
            active ? "text-accent" : "text-text-muted"
          }`;
          return href ? (
            <Link
              key={`slot-${i}`}
              href={href}
              className={className}
              onClick={(e) => handleSlotClick(e, item)}
              onPointerDown={() => startPress(i)}
              onPointerUp={cancelPress}
              onPointerLeave={cancelPress}
              onPointerCancel={cancelPress}
            >
              {content}
            </Link>
          ) : (
            <button
              key={`slot-${i}`}
              type="button"
              className={className}
              onClick={(e) => handleSlotClick(e, item)}
              onPointerDown={() => startPress(i)}
              onPointerUp={cancelPress}
              onPointerLeave={cancelPress}
              onPointerCancel={cancelPress}
            >
              {content}
            </button>
          );
        })}

        {/* Centre — fixed Home FAB */}
        <div className="flex-1 flex items-stretch justify-center relative">
          <Link
            href={HOME_ITEM.href}
            className="absolute -translate-y-4 flex flex-col items-center justify-center w-14 h-14 rounded-pill text-white transition-transform active:scale-95"
            style={{
              background: "var(--color-accent)",
            }}
            aria-label="Home"
          >
            <LayoutDashboard size={24} />
          </Link>
        </div>

        {/* Right two slots */}
        {slots.slice(2, 4).map((slotId, idx) => {
          const i = idx + 2;
          const item = findSection(slotId);
          const Icon = item.icon;
          const href = item.href;
          const active = href ? isActive(href, pathname) : false;
          const content = (
            <>
              {active && (
                <motion.span
                  layoutId="bottom-nav-active-pill"
                  className="absolute inset-x-2 inset-y-1 rounded-r3 bg-[var(--color-accent-soft)]"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Icon size={20} className="relative" />
              <span className="text-10 font-medium relative">{item.label}</span>
            </>
          );
          const className = `relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors select-none ${
            active ? "text-accent" : "text-text-muted"
          }`;
          return href ? (
            <Link
              key={`slot-${i}`}
              href={href}
              className={className}
              onClick={(e) => handleSlotClick(e, item)}
              onPointerDown={() => startPress(i)}
              onPointerUp={cancelPress}
              onPointerLeave={cancelPress}
              onPointerCancel={cancelPress}
            >
              {content}
            </Link>
          ) : (
            <button
              key={`slot-${i}`}
              type="button"
              className={className}
              onClick={(e) => handleSlotClick(e, item)}
              onPointerDown={() => startPress(i)}
              onPointerUp={cancelPress}
              onPointerLeave={cancelPress}
              onPointerCancel={cancelPress}
            >
              {content}
            </button>
          );
        })}
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
