"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CollapsibleSectionProps {
  /** Heading text shown in the section header. */
  title: ReactNode;
  /** Stable localStorage key used to persist collapsed/expanded state. */
  storageKey: string;
  /** Optional content rendered alongside the title (e.g. counts/badges). */
  headerExtra?: ReactNode;
  /** Section body, hidden when collapsed. */
  children: ReactNode;
  /** Optional extra classes for the outer wrapper. */
  className?: string;
  /** Optional extra classes for the header row. */
  headerClassName?: string;
  /** Optional extra classes for the title text. */
  titleClassName?: string;
}

/**
 * A section with a clickable header that toggles a chevron and
 * collapses/expands its body with a height + opacity animation.
 * Collapsed state is persisted to localStorage per `storageKey`, and
 * sections start expanded if no stored value exists.
 */
export function CollapsibleSection({
  title,
  storageKey,
  headerExtra,
  children,
  className = "",
  headerClassName = "",
  titleClassName = "",
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored !== null) setExpanded(stored === "expanded");
    } catch {
      // ignore (e.g. localStorage unavailable)
    }
    setHydrated(true);
  }, [storageKey]);

  function toggle() {
    setExpanded((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(storageKey, next ? "expanded" : "collapsed");
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        className={`flex w-full items-center justify-between gap-2 text-left ${headerClassName}`}
      >
        <span className={`flex items-center gap-2 ${titleClassName}`}>
          {title}
          {headerExtra}
        </span>
        {expanded ? (
          <ChevronDown size={16} className="text-text-muted flex-shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-text-muted flex-shrink-0" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={hydrated ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
