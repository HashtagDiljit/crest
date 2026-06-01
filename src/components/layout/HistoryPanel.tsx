"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Dumbbell, Moon, Smile, Target, PenLine, Clock } from "lucide-react";
import { getRecentActivity, type ActivityItem } from "@/app/(dashboard)/actions";

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 2) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" });
}

const MODULE_ICON: Record<ActivityItem["module"], React.ElementType> = {
  workout: Dumbbell,
  sleep: Moon,
  mood: Smile,
  habit: Target,
  journal: PenLine,
};

const MODULE_COLOR: Record<ActivityItem["module"], string> = {
  workout: "var(--color-accent)",
  sleep: "var(--color-warning)",
  mood: "#F472B6",
  habit: "var(--color-success)",
  journal: "var(--color-info)",
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function HistoryPanel({ open, onClose }: Props) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getRecentActivity()
      .then(setItems)
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />

      {/* panel */}
      <div
        className="relative z-10 w-full sm:w-[400px] h-full bg-bg-surface border-l border-border flex flex-col"
        style={{ animation: "slideInRight 0.18s ease" }}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Clock size={16} className="text-text-muted" />
            <span className="font-display text-15 font-semibold text-text-primary">
              Recent activity
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-r2 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="flex flex-col gap-2 px-4 py-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="shimmer h-14 rounded-r3" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 px-8 text-center">
              <Clock size={28} className="text-text-disabled" />
              <p className="text-13 text-text-muted">
                No activity yet. Start logging to see your history here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5 px-2">
              {items.map((item) => {
                const Icon = MODULE_ICON[item.module];
                const color = MODULE_COLOR[item.module];
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-3 rounded-r3 hover:bg-bg-elevated transition-colors group"
                  >
                    <div
                      className="w-8 h-8 rounded-r3 flex items-center justify-center flex-shrink-0"
                      style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}
                    >
                      <Icon size={15} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-13 text-text-primary truncate">
                        {item.description}
                      </p>
                    </div>
                    <span className="text-11 text-text-muted flex-shrink-0">
                      {relativeTime(item.timestamp)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
