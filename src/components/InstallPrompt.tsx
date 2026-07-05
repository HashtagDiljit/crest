"use client";

import { useEffect, useState } from "react";
import { X, Share, Download } from "lucide-react";

const DISMISS_KEY = "kairos-install-dismissed-at";
const VISIT_KEY = "kairos-visit-count";
const DISMISS_DAYS = 7;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [iosInstructions, setIosInstructions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || !isMobile()) return;

    // Track visit count — only show from the second visit onward.
    let visits = 0;
    try {
      visits = parseInt(localStorage.getItem(VISIT_KEY) ?? "0", 10) + 1;
      localStorage.setItem(VISIT_KEY, String(visits));
    } catch { /* noop */ }
    if (visits < 2) return;

    // Respect a recent dismissal.
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const daysSince = (Date.now() - Number(dismissedAt)) / 86400000;
        if (daysSince < DISMISS_DAYS) return;
      }
    } catch { /* noop */ }

    if (isIOS()) {
      setIosInstructions(true);
      setShow(true);
      return;
    }

    function handlePrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    }
    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  function dismiss() {
    setShow(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* noop */ }
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      className="fixed bottom-[64px] lg:bottom-4 left-3 right-3 z-50 flex items-center gap-3 rounded-r4 border border-border bg-bg-elevated p-3 shadow-2xl mx-auto max-w-md"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="w-10 h-10 rounded-r3 bg-bg-surface flex items-center justify-center flex-shrink-0">
        {iosInstructions ? <Share size={18} className="text-accent" /> : <Download size={18} className="text-accent" />}
      </div>
      <div className="flex-1 min-w-0">
        {iosInstructions ? (
          <p className="text-12 text-text-secondary leading-snug">
            Tap the <Share size={11} className="inline -mt-0.5" /> share button, then{" "}
            <span className="font-semibold text-text-primary">&quot;Add to Home Screen&quot;</span> for the full experience.
          </p>
        ) : (
          <p className="text-12 text-text-secondary leading-snug">
            Add Kairos to your home screen for the full experience.
          </p>
        )}
      </div>
      {!iosInstructions && (
        <button
          onClick={install}
          className="px-3 py-1.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-12 font-semibold transition-colors flex-shrink-0"
        >
          Install
        </button>
      )}
      <button onClick={dismiss} className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0" aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}
