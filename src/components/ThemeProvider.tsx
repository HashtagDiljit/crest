"use client";

import { useEffect, useRef } from "react";
import { applyTheme, applyAccent } from "@/lib/theme";

interface Props {
  theme: string | null;
  accent: string | null;
}

export function ThemeProvider({ theme, accent }: Props) {
  const mqlRef = useRef<MediaQueryList | null>(null);

  useEffect(() => {
    // Apply profile values (overrides localStorage on fresh session from another device)
    if (theme) {
      applyTheme(theme);

      // Watch system preference changes when theme is "system"
      if (theme === "system") {
        mqlRef.current = window.matchMedia("(prefers-color-scheme: light)");
        const handler = () => applyTheme("system");
        mqlRef.current.addEventListener("change", handler);
        return () => mqlRef.current?.removeEventListener("change", handler);
      }
    }
    if (accent) applyAccent(accent);
  }, [theme, accent]);

  return null;
}
