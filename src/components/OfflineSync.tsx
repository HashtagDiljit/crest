"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { getQueuedActions, removeQueuedAction, type QueuedAction } from "@/lib/offlineQueue";
import {
  quickLogWater, quickLogMood, quickLogWeight, quickLogSleep, quickLogNote,
} from "@/app/(dashboard)/quick-log-actions";

async function replay(action: QueuedAction): Promise<void> {
  switch (action.type) {
    case "water":
      await quickLogWater(action.payload.ml);
      break;
    case "mood":
      await quickLogMood(action.payload.score, action.payload.note);
      break;
    case "weight":
      await quickLogWeight(action.payload.kg);
      break;
    case "sleep":
      await quickLogSleep(action.payload.bedtime, action.payload.wakeTime, action.payload.quality);
      break;
    case "note":
      await quickLogNote(action.payload.body);
      break;
  }
}

async function flushQueue(): Promise<void> {
  const actions = await getQueuedActions();
  for (const action of actions) {
    try {
      await replay(action);
      if (action.id !== undefined) await removeQueuedAction(action.id);
    } catch {
      // leave in queue, retry on next sync
    }
  }
}

export function OfflineSync() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);

    function handleOnline() {
      setOffline(false);
      void flushQueue();
    }
    function handleOffline() {
      setOffline(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (navigator.onLine) void flushQueue();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 px-4 py-2 text-12 font-medium text-white bg-warning"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}>
      <WifiOff size={14} />
      You&apos;re offline — changes will sync when reconnected
    </div>
  );
}
