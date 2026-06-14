"use client";

import { motion } from "framer-motion";

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
}

/** Pill switch with an animated thumb + colour transition (150ms). */
export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-pill"
    >
      <motion.span
        className="absolute inset-0 rounded-pill"
        animate={{ background: checked ? "var(--color-accent)" : "var(--color-bg-elevated)" }}
        transition={{ duration: 0.15 }}
      />
      <motion.span
        className="relative inline-block h-4 w-4 rounded-pill bg-white"
        animate={{ x: checked ? 18 : 2 }}
        transition={{ duration: 0.15, type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}
