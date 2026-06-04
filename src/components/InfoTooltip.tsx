"use client";

import { useState } from "react";
import { Info } from "lucide-react";

interface Props {
  text: string;
  size?: number;
}

export function InfoTooltip({ text, size = 12 }: Props) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        onClick={() => setShow((v) => !v)}
        aria-label="More information"
        className="text-text-muted hover:text-text-secondary transition-colors"
      >
        <Info size={size} />
      </button>
      {show && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 text-11 text-text-secondary bg-bg-overlay border border-border rounded-r3 px-3 py-2 shadow-2xl leading-relaxed pointer-events-none"
        >
          {text}
        </span>
      )}
    </span>
  );
}
