"use client";

import { useEffect } from "react";
import { applyAccent } from "@/lib/theme";

const MIGRATIONS: Array<[string, string]> = [
  ["crest-theme",             "kairos-theme"],
  ["crest-accent",            "kairos-accent"],
  ["crest-sidebar-collapsed", "kairos-sidebar-collapsed"],
  ["arc-theme",               "kairos-theme"],
  ["arc-accent",              "kairos-accent"],
  ["arc-sidebar-collapsed",   "kairos-sidebar-collapsed"],
];

function migrateKeys() {
  for (const [oldKey, newKey] of MIGRATIONS) {
    if (localStorage.getItem(newKey) === null) {
      const value = localStorage.getItem(oldKey);
      if (value !== null) {
        localStorage.setItem(newKey, value);
        localStorage.removeItem(oldKey);
      }
    }
  }
}

export function ThemeInit() {
  useEffect(() => {
    try {
      migrateKeys();
      const accent = localStorage.getItem("kairos-accent");
      if (accent) applyAccent(accent);
    } catch {}
  }, []);
  return null;
}
