"use client";

import { useEffect } from "react";
import { applyAccent } from "@/lib/theme";

export function ThemeInit() {
  useEffect(() => {
    try {
      const accent = localStorage.getItem("arc-accent");
      if (accent) applyAccent(accent);
    } catch {}
  }, []);
  return null;
}
