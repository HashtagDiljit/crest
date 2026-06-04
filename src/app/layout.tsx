import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { ThemeInit } from "@/components/ThemeInit";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Arc",
  description: "Your life. Tracked. Understood.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Arc",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#0D0D12" },
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Inline script prevents flash of wrong theme on load */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeInit />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
