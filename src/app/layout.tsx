import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { ThemeInit } from "@/components/ThemeInit";

export const metadata: Metadata = {
  title: "Crest",
  description: "Your personal life tracking OS",
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
      </body>
    </html>
  );
}
