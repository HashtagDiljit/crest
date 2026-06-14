"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";

const ReducedMotionContext = createContext(false);

export function useReducedMotionPref(): boolean {
  return useContext(ReducedMotionContext);
}

interface Props {
  /** Reduce-motion preference saved on the user's profile. */
  forceReduced?: boolean;
  children: React.ReactNode;
}

/**
 * Wraps children in framer-motion's MotionConfig and exposes a
 * `useReducedMotionPref` hook for components using plain CSS transitions.
 * Reduced motion is on if the user enabled it in Settings, OR if the OS
 * has `prefers-reduced-motion: reduce` set.
 */
export function MotionProvider({ forceReduced = false, children }: Props) {
  const [systemReduced, setSystemReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setSystemReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setSystemReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const reduced = forceReduced || systemReduced;

  return (
    <ReducedMotionContext.Provider value={reduced}>
      <MotionConfig reducedMotion={reduced ? "always" : "never"} transition={{ duration: 0.2 }}>
        {children}
      </MotionConfig>
    </ReducedMotionContext.Provider>
  );
}
