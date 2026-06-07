import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-base": "var(--color-bg-base)",
        "bg-inset": "var(--color-bg-inset)",
        "bg-surface": "var(--color-bg-surface)",
        "bg-elevated": "var(--color-bg-elevated)",
        "bg-overlay": "var(--color-bg-overlay)",
        accent: "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        "accent-pressed": "var(--color-accent-pressed)",
        "accent-soft": "var(--color-accent-soft)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",
        "text-disabled": "var(--color-text-disabled)",
        border: "var(--color-border)",
        "border-strong": "var(--color-border-strong)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        info: "var(--color-info)",
        streak: "var(--color-streak)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        "10": ["10px", { lineHeight: "1.4" }],
        "11": ["11px", { lineHeight: "1.45" }],
        "12": ["12px", { lineHeight: "1.45" }],
        "13": ["13px", { lineHeight: "1.45" }],
        "14": ["14px", { lineHeight: "1.45" }],
        "15": ["15px", { lineHeight: "1.45" }],
        "16": ["16px", { lineHeight: "1.45" }],
        "18": ["18px", { lineHeight: "1.25" }],
        "20": ["20px", { lineHeight: "1.25" }],
        "22": ["22px", { lineHeight: "1.25" }],
        "24": ["24px", { lineHeight: "1.25" }],
        "28": ["28px", { lineHeight: "1.15" }],
        "32": ["32px", { lineHeight: "1.1" }],
        "48": ["48px", { lineHeight: "1.1" }],
      },
      borderRadius: {
        "r1": "4px",
        "r2": "6px",
        "r3": "8px",
        "r4": "12px",
        "r5": "16px",
        "r6": "20px",
        "pill": "999px",
      },
      width: {
        sidebar: "240px",
      },
      spacing: {
        sidebar: "240px",
      },
      boxShadow: {
        "1": "0 1px 0 rgba(255,255,255,0.02) inset, 0 1px 2px rgba(0,0,0,0.4)",
        "2": "0 1px 0 rgba(255,255,255,0.03) inset, 0 4px 14px rgba(0,0,0,0.45)",
        "3": "0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 32px rgba(0,0,0,0.55)",
        "accent": "0 0 0 1px var(--color-accent-ring), 0 10px 28px rgba(108,99,255,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
