"use client";

import { useEffect } from "react";
import { initAnalytics, identifyUser } from "@/lib/analytics";

interface Props {
  userId?: string;
  hasAnalyticsConsent: boolean;
}

export function AnalyticsProvider({ userId, hasAnalyticsConsent }: Props) {
  useEffect(() => {
    initAnalytics(hasAnalyticsConsent);
    if (userId && hasAnalyticsConsent) identifyUser(userId);
  }, [userId, hasAnalyticsConsent]);

  return null;
}
