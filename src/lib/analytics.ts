import posthog from "posthog-js";

let initialised = false;

export function initAnalytics(hasConsent: boolean) {
  if (typeof window === "undefined" || !hasConsent) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || key === "YOUR_POSTHOG_KEY_HERE") return;
  if (initialised) return;
  try {
    posthog.init(key, {
      api_host: "https://app.posthog.com",
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: false,
      persistence: "localStorage",
    });
    initialised = true;
  } catch {}
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!initialised) return;
  try { posthog.capture(event, properties); } catch {}
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (!initialised) return;
  try { posthog.identify(userId, traits); } catch {}
}

export function resetAnalytics() {
  if (!initialised) return;
  try { posthog.reset(); } catch {}
}
