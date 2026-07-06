"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { Plus, Timer, ChevronLeft } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/database";
import { logSet, finalizeSession, getExerciseHistory, updateSessionSet, deleteSessionSet, discardSession } from "../actions";
import { track } from "@vercel/analytics";
import type { TemplateExerciseRow, SessionSetRow, SessionRow, ExerciseSessionHistory, PRResult } from "../actions";
import type { LoggingType } from "../actions";
import { AdHocExercisePicker } from "./_components/AdHocExercisePicker";
import { RestTimer } from "./_components/RestTimer";
import { SessionSummary } from "./_components/SessionSummary";
import { ExerciseCard, SupersetConnector, categoryStyle } from "./_components/ExerciseCard";
import type { ExerciseRow } from "../actions";

// ─── Types ───────────────────────────────────────────────────────────────────
type WorkoutTemplate = Database["public"]["Tables"]["workout_templates"]["Row"];

export interface SessionData {
  session: SessionRow;
  template: WorkoutTemplate | null;
  exercises: TemplateExerciseRow[];
  sets: SessionSetRow[];
}

const ACTIVE_SESSION_KEY  = "kairos-active-session";
const SESSION_START_KEY   = "kairos-session-start-time";
const SESSION_MAX_AGE_MS  = 4 * 60 * 60 * 1000;

interface ActiveSessionSnapshot {
  session_id: string;
  template_id: string | null;
  started_at: string;
  saved_at: string;
  loggedSets: SessionSetRow[];
  currentExIdx: number;
  currentSetIdx: number;
  currentSetType: "warmup" | "working" | "dropset" | "failure";
  weight: number;
  reps: number;
  targetOverrides: Record<string, number>;
  supersetLinks: number[];
  adHocExercises: TemplateExerciseRow[];
  removedIds: string[];
}

function saveActiveSession(s: ActiveSessionSnapshot) {
  try { localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
function loadActiveSession(): ActiveSessionSnapshot | null {
  try { const r = localStorage.getItem(ACTIVE_SESSION_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
function clearActiveSession() {
  try { localStorage.removeItem(ACTIVE_SESSION_KEY); localStorage.removeItem(SESSION_START_KEY); } catch { /* ignore */ }
}

function fmtTime(secs: number): string {
  const s = Math.max(0, Math.round(secs));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function getDefaultRestSeconds(exercise: ExerciseRow | undefined): number {
  if (!exercise) return 120;
  const name = exercise.name.toLowerCase();
  const cat = (exercise.category ?? "").toLowerCase();
  if (cat === "cardio" || /cardio|running|cycling|bike|plank|crunch/.test(name)) return 60;
  if (/squat|deadlift|bench|row|press/.test(name)) return 180;
  return 90;
}

// ─── Notification helpers (native only) ──────────────────────────────────────
async function scheduleWorkoutNotification(sets: number, kg: number, elapsed: number) {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== "granted") return;
    }
    await LocalNotifications.schedule({
      notifications: [{
        id: 1001,
        title: "Kairos · Workout in progress",
        body: `${sets} sets · ${kg.toFixed(1)}kg · ${fmtTime(elapsed)} elapsed`,
        ongoing: true,
      }],
    });
  } catch { /* ignore on web */ }
}

async function updateWorkoutNotification(sets: number, kg: number, elapsed: number) {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.schedule({
      notifications: [{
        id: 1001,
        title: "Kairos · Workout in progress",
        body: `${sets} sets · ${kg.toFixed(1)}kg · ${fmtTime(elapsed)} elapsed`,
        ongoing: true,
      }],
    });
  } catch { /* ignore */ }
}

async function cancelWorkoutNotification() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });
  } catch { /* ignore */ }
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────
export default function SessionPageWrapper() {
  return (
    <Suspense fallback={<SessionSkeleton />}>
      <SessionPage />
    </Suspense>
  );
}

function SessionSkeleton() {
  return (
    <div className="flex flex-col gap-3 -mx-4 md:-mx-6 px-4">
      <div className="h-12 bg-bg-elevated rounded-r3 shimmer" />
      <div className="h-6 w-48 bg-bg-elevated rounded-r3 shimmer" />
      <div className="flex gap-2">{[1,2,3].map(i => <div key={i} className="h-7 w-20 bg-bg-elevated rounded-pill shimmer" />)}</div>
      {[1,2,3].map(i => <div key={i} className="h-28 bg-bg-elevated rounded-r4 shimmer" />)}
    </div>
  );
}

// ─── Muscle group filter tabs ─────────────────────────────────────────────────
function MuscleTab({ label, color, active, onClick }: { label: string; color?: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 h-7 px-3 rounded-pill text-11 font-semibold transition-colors border ${
        active
          ? "text-white border-transparent"
          : "border-border text-text-muted hover:text-text-secondary"
      }`}
      style={active ? { background: color ?? "var(--color-accent)", borderColor: "transparent" } : {}}
    >
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </button>
  );
}

// ─── Main session page ────────────────────────────────────────────────────────
function SessionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("id");
  const isDeload = searchParams.get("deload") === "1";

  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [currentSetIdx, setCurrentSetIdx] = useState(0);
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(5);
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [distanceKm, setDistanceKm] = useState(1);
  const [floors, setFloors] = useState(10);
  const [restRemaining, setRestRemaining] = useState(0);
  const [restTotal, setRestTotal] = useState(120);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loggedSets, setLoggedSets] = useState<SessionSetRow[]>([]);
  const [ending, setEnding] = useState(false);
  const [frozenElapsed, setFrozenElapsed] = useState<number | null>(null);
  const [adHocExercises, setAdHocExercises] = useState<TemplateExerciseRow[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set<string>());
  const [showPicker, setShowPicker] = useState(false);
  const [targetOverrides, setTargetOverrides] = useState<Record<string, number>>({});
  const [currentSetType, setCurrentSetType] = useState<"warmup" | "working" | "dropset" | "failure">("working");
  const [supersetLinks, setSupersetLinks] = useState<Set<number>>(new Set<number>());
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseSessionHistory[]>([]);
  const [summary, setSummary] = useState<{ prs: PRResult[]; sets_count: number; started_at: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [restManuallySet, setRestManuallySet] = useState(false);
  const [focusSignal, setFocusSignal] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  // Timestamp-based timer: always accurate regardless of interval pauses
  const startTimeRef = useRef<number>(0);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function handleDiscard() {
    if (!sessionId || discarding) return;
    setDiscarding(true);
    clearActiveSession();
    await cancelWorkoutNotification();
    await discardSession(sessionId);
    router.replace("/workouts");
  }

  // ── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) { router.replace("/workouts"); return; }
    const supabase = createClient();

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const { data: sessionRaw } = await supabase
        .from("workout_sessions").select("*").eq("id", sessionId).eq("user_id", user.id).single();
      if (!sessionRaw) { router.replace("/workouts"); return; }

      const session = sessionRaw as Database["public"]["Tables"]["workout_sessions"]["Row"];

      const templateData = session.template_id
        ? (await supabase.from("workout_templates").select("*").eq("id", session.template_id).single()).data
        : null;

      const { data: texRaw } = session.template_id
        ? await supabase.from("template_exercises").select("id, template_id, exercise_id, sets_target, reps_target, order_index").eq("template_id", session.template_id).order("order_index")
        : { data: [] };

      const texRows = (texRaw ?? []) as Array<Database["public"]["Tables"]["template_exercises"]["Row"]>;
      const exerciseIds = texRows.map(te => te.exercise_id);

      const { data: exRaw } = exerciseIds.length > 0
        ? await supabase.from("exercises").select("id, name, category, muscle_primary, equipment, logging_type").in("id", exerciseIds)
        : { data: [] };

      // Fetch per-user logging type overrides
      const { data: prefsRaw } = exerciseIds.length > 0
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? await (supabase as any).from("user_exercise_preferences").select("exercise_id, logging_type").eq("user_id", user.id).in("exercise_id", exerciseIds)
        : { data: [] };
      const prefsMap = new Map<string, string>(
        (prefsRaw ?? []).map((p: { exercise_id: string; logging_type: string }) => [p.exercise_id, p.logging_type])
      );

      const exMap = new Map((exRaw ?? []).map(e => {
        const ex = e as Database["public"]["Tables"]["exercises"]["Row"];
        // Apply user preference override if present
        const overriddenLoggingType = (prefsMap.get(ex.id) ?? ex.logging_type) as typeof ex.logging_type;
        return [ex.id, { ...ex, logging_type: overriddenLoggingType }];
      }));

      const exercises: TemplateExerciseRow[] = texRows.map(te => ({
        id: te.id, template_id: te.template_id, exercise_id: te.exercise_id,
        sets_target: te.sets_target, reps_target: te.reps_target, order_index: te.order_index,
        exercise: exMap.get(te.exercise_id) ?? { id: te.exercise_id, name: "Unknown", category: null, muscle_primary: null, equipment: null, logging_type: "weight_reps" },
      }));

      const { data: setsRaw } = await supabase.from("session_sets").select("*").eq("session_id", sessionId).order("completed_at");
      const sets = (setsRaw ?? []).map(s => {
        const sr = s as Database["public"]["Tables"]["session_sets"]["Row"];
        return {
          id: sr.id, session_id: sr.session_id, exercise_id: sr.exercise_id,
          set_number: sr.set_number, weight_kg: sr.weight_kg, reps: sr.reps, rpe: sr.rpe,
          completed_at: sr.completed_at,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          set_type: ((sr as any).set_type ?? "working") as SessionSetRow["set_type"],
          duration_seconds: sr.duration_seconds, distance_km: sr.distance_km,
        } satisfies SessionSetRow;
      });

      const sessionRow: SessionRow = {
        id: session.id, user_id: session.user_id, template_id: session.template_id,
        started_at: session.started_at, ended_at: session.ended_at,
        notes: session.notes, xp_earned: session.xp_earned,
      };

      // Set up timestamp-based timer
      const dbStartTime = new Date(session.started_at).getTime();
      const storedStart = parseInt(localStorage.getItem(SESSION_START_KEY) ?? "0");
      startTimeRef.current = storedStart > 0 && storedStart <= dbStartTime + 60000
        ? storedStart
        : dbStartTime;
      localStorage.setItem(SESSION_START_KEY, String(startTimeRef.current));

      setData({ session: sessionRow, template: templateData as WorkoutTemplate | null, exercises, sets });
      setLoggedSets(sets);
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));

      // Restore from localStorage
      const cached = loadActiveSession();
      if (cached && cached.session_id === sessionId) {
        const age = Date.now() - new Date(cached.saved_at).getTime();
        if (age < SESSION_MAX_AGE_MS) {
          setLoggedSets(cached.loggedSets);
          setCurrentExIdx(cached.currentExIdx);
          setCurrentSetIdx(cached.currentSetIdx);
          setCurrentSetType(cached.currentSetType);
          setWeight(cached.weight);
          setReps(cached.reps);
          setTargetOverrides(cached.targetOverrides);
          setSupersetLinks(new Set(cached.supersetLinks));
          setAdHocExercises(cached.adHocExercises);
          setRemovedIds(new Set(cached.removedIds));
          showToast("Session restored");
        } else {
          clearActiveSession();
        }
      }

      setLoading(false);

      // Start notification
      scheduleWorkoutNotification(sets.length, sets.reduce((a, s) => a + (s.weight_kg ?? 0), 0), Math.floor((Date.now() - startTimeRef.current) / 1000));
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, router]);

  // ── Timestamp-based elapsed timer ────────────────────────────────────────
  useEffect(() => {
    if (ending) return;
    const tick = () => {
      if (startTimeRef.current > 0) setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [ending]);

  // Recalculate on visibility change (handles app switching / backgrounding)
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible" && startTimeRef.current > 0) {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  // ── Notification update every 60 seconds ─────────────────────────────────
  useEffect(() => {
    if (ending || !data) return;
    const t = setInterval(() => {
      const totalKg = loggedSets.reduce((a, s) => a + (s.weight_kg ?? 0) * (s.reps ?? 1), 0);
      updateWorkoutNotification(loggedSets.length, totalKg, elapsedSeconds);
    }, 60000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ending, data, loggedSets.length, elapsedSeconds]);

  // ── Rest countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    if (restRemaining <= 0) return;
    const t = setInterval(() => setRestRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [restRemaining]);

  const allExercises = [...(data?.exercises ?? []), ...adHocExercises].filter(ex => !removedIds.has(ex.id));
  const currentEx = allExercises[currentExIdx];

  // Exercise history + pre-fill weight
  useEffect(() => {
    if (!currentEx?.exercise_id) return;
    setExerciseHistory([]);
    getExerciseHistory(currentEx.exercise_id).then(h => {
      setExerciseHistory(h);
      if (h.length > 0 && h[0].sets.length > 0) {
        const lw = h[0].sets[0].weight_kg;
        setWeight(isDeload ? Math.round(lw * 0.6 * 4) / 4 : lw);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEx?.exercise_id]);

  useEffect(() => {
    if (!currentEx?.exercise || restManuallySet) return;
    setRestTotal(getDefaultRestSeconds(currentEx.exercise));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEx?.exercise]);

  function handleAddExercise(ex: ExerciseRow, setsTarget: number, repsTarget: number) {
    const adHoc: TemplateExerciseRow = {
      id: `adhoc-${ex.id}-${Date.now()}`,
      template_id: sessionId ?? "adhoc",
      exercise_id: ex.id,
      sets_target: setsTarget,
      reps_target: repsTarget,
      order_index: allExercises.length,
      exercise: ex,
    };
    setAdHocExercises(prev => [...prev, adHoc]);
    setShowPicker(false);
    setCurrentExIdx(allExercises.length);
    setCurrentSetType("working");
  }

  const setsForCurrentEx = loggedSets.filter(s => s.exercise_id === currentEx?.exercise_id);
  const targetSets = currentEx ? (targetOverrides[currentEx.id] ?? currentEx.sets_target ?? null) : null;

  function persistNow(sets: SessionSetRow[], overrides: Partial<ActiveSessionSnapshot> = {}) {
    if (!sessionId || !data) return;
    saveActiveSession({
      session_id: sessionId, template_id: data.session.template_id,
      started_at: data.session.started_at, saved_at: new Date().toISOString(),
      loggedSets: sets, currentExIdx, currentSetIdx, currentSetType,
      weight, reps, targetOverrides,
      supersetLinks: Array.from(supersetLinks),
      adHocExercises, removedIds: Array.from(removedIds),
      ...overrides,
    });
  }

  // ── Complete set ──────────────────────────────────────────────────────────
  const handleCompleteSet = useCallback(async () => {
    if (!sessionId || !currentEx || !data) return;
    const setNum = setsForCurrentEx.length + 1;
    const loggingType = (currentEx.exercise?.logging_type as LoggingType) ?? "weight_reps";
    const loggedWeight = ["time_distance", "time_reps", "time_floors"].includes(loggingType) ? 0 : weight;
    const loggedReps = loggingType === "weight_reps" ? reps : loggingType === "time_reps" ? reps : loggingType === "time_floors" ? floors : 0;

    const result = await logSet({
      sessionId, exerciseId: currentEx.exercise_id, setNumber: setNum,
      weightKg: loggedWeight, reps: loggedReps, setType: currentSetType,
      durationSeconds: loggingType !== "weight_reps" ? durationSeconds : undefined,
      distanceKm: loggingType === "time_distance" ? distanceKm : undefined,
    });

    if ("id" in result) {
      const newSet: SessionSetRow = {
        id: result.id, session_id: sessionId, exercise_id: currentEx.exercise_id,
        set_number: setNum, weight_kg: loggedWeight, reps: loggedReps, rpe: null,
        set_type: currentSetType, completed_at: new Date().toISOString(),
        duration_seconds: loggingType !== "weight_reps" ? durationSeconds : null,
        distance_km: loggingType === "time_distance" ? distanceKm : null,
      };
      const newSets = [...loggedSets, newSet];
      setLoggedSets(newSets);
      setRestRemaining(restTotal);
      setCurrentSetIdx(setNum);
      setCurrentSetType("working");

      const newCount = setsForCurrentEx.length + 1;
      const isFirstOfSuperset = supersetLinks.has(currentExIdx);
      const isSecondOfSuperset = currentExIdx > 0 && supersetLinks.has(currentExIdx - 1);

      let nextExIdx = currentExIdx;
      let nextSetIdx = setNum;

      if (isFirstOfSuperset) {
        nextExIdx = currentExIdx + 1;
        nextSetIdx = 0;
      } else if (isSecondOfSuperset) {
        const firstEx = allExercises[currentExIdx - 1];
        const firstExDone = newSets.filter(s => s.exercise_id === firstEx?.exercise_id).length;
        const firstExTarget = firstEx ? (targetOverrides[firstEx.id] ?? firstEx.sets_target ?? null) : null;
        if ((firstExTarget === null || firstExDone >= firstExTarget) && (targetSets === null || newCount >= targetSets)) {
          nextExIdx = currentExIdx + 1;
          nextSetIdx = 0;
        } else {
          nextExIdx = currentExIdx - 1;
          nextSetIdx = 0;
        }
      } else if (targetSets !== null && newCount >= targetSets && currentExIdx < allExercises.length - 1) {
        nextExIdx = currentExIdx + 1;
        nextSetIdx = 0;
      }

      if (nextExIdx !== currentExIdx) {
        setCurrentExIdx(nextExIdx);
        setCurrentSetIdx(nextSetIdx);
      }

      let nextWeight = weight;
      let nextReps = reps;
      if (nextExIdx === currentExIdx) {
        nextWeight = loggedWeight;
        if (loggingType === "weight_reps") nextReps = currentEx.reps_target ?? reps;
        setWeight(nextWeight);
        if (loggingType === "weight_reps") setReps(nextReps);
      }

      persistNow(newSets, { currentExIdx: nextExIdx, currentSetIdx: nextSetIdx, currentSetType: "working", weight: nextWeight, reps: nextReps });
      setFocusSignal(f => f + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, currentEx, setsForCurrentEx, weight, reps, durationSeconds, distanceKm, floors, restTotal, targetSets, data, currentExIdx, loggedSets, currentSetType, supersetLinks, allExercises, targetOverrides, elapsedSeconds, adHocExercises, removedIds]);

  async function handleUpdateSet(set: SessionSetRow, updates: { weightKg?: number; reps?: number; durationSeconds?: number; distanceKm?: number }) {
    const result = await updateSessionSet(set.id, updates);
    if ("error" in result) return;
    const newSets = loggedSets.map(s => s.id === set.id ? { ...s, weight_kg: updates.weightKg ?? s.weight_kg, reps: updates.reps ?? s.reps, duration_seconds: updates.durationSeconds ?? s.duration_seconds, distance_km: updates.distanceKm ?? s.distance_km } : s);
    setLoggedSets(newSets);
    persistNow(newSets);
  }

  async function handleDeleteSet(set: SessionSetRow) {
    const result = await deleteSessionSet(set.id);
    if ("error" in result) return;
    const newSets = loggedSets.filter(s => s.id !== set.id);
    setLoggedSets(newSets);
    if (set.exercise_id === currentEx?.exercise_id) {
      setCurrentSetIdx(idx => Math.min(idx, newSets.filter(s => s.exercise_id === currentEx?.exercise_id).length));
    }
    persistNow(newSets);
  }

  const handleEndSession = useCallback(async () => {
    if (!sessionId || !data) return;
    setFrozenElapsed(elapsedSeconds);
    setRestRemaining(0);
    setEnding(true);
    cancelWorkoutNotification();
    const result = await finalizeSession(sessionId);
    setSummary({ ...result, started_at: data.session.started_at });
    clearActiveSession();
    track("workout_logged", { sets: result.sets_count ?? 0 });
  }, [sessionId, data, elapsedSeconds]);



  // ── Derived ───────────────────────────────────────────────────────────────
  const totalSets = loggedSets.length;
  const totalVolume = loggedSets.reduce((a, s) => a + ((s.weight_kg ?? 0) * (s.reps ?? 1)), 0);
  const uniqueCategories = Array.from(new Set(allExercises.map(ex => ex.exercise.category).filter(Boolean))) as string[];
  const filteredExercises = activeFilter ? allExercises.filter(ex => ex.exercise.category?.toLowerCase() === activeFilter) : allExercises;

  if (loading) return <SessionSkeleton />;
  if (!data) return null;

  const isQuickStart = !data.template;

  return (
    <div className="-mx-4 md:-mx-6 flex flex-col" style={{ minHeight: "calc(100vh - var(--topbar-h))" }}>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-pill bg-bg-surface border border-border shadow-2xl text-13 text-text-primary font-medium whitespace-nowrap pointer-events-none">
          {toast}
        </div>
      )}

      {/* Summary modal */}
      {summary && (
        <SessionSummary
          sessionId={sessionId!}
          setsCount={summary.sets_count}
          durationSecs={frozenElapsed ?? Math.floor((Date.now() - new Date(summary.started_at).getTime()) / 1000)}
          prs={summary.prs}
        />
      )}

      {/* Exercise picker */}
      {showPicker && <AdHocExercisePicker onAdd={handleAddExercise} onClose={() => setShowPicker(false)} />}

      {/* Discard confirmation */}
      {showDiscardConfirm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70" onClick={() => setShowDiscardConfirm(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-r5 border-t border-border bg-bg-surface px-4 pt-5" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
            <p className="font-display text-16 font-semibold text-text-primary mb-1">Discard this workout?</p>
            <p className="text-14 text-text-muted mb-5">All logged sets will be lost.</p>
            <div className="flex flex-col gap-2">
              <button onClick={handleDiscard} disabled={discarding} className="w-full h-12 rounded-r3 bg-error hover:bg-error/90 text-white font-semibold text-14 transition-colors disabled:opacity-50">
                {discarding ? "Discarding…" : "Discard workout"}
              </button>
              <button onClick={() => setShowDiscardConfirm(false)} className="w-full h-12 rounded-r3 border border-border text-text-secondary font-medium text-14 transition-colors hover:bg-bg-elevated">
                Keep going
              </button>
            </div>
          </div>
        </>
      )}

      {/* Finish confirmation sheet */}
      {showFinishConfirm && (
        <>
          <div className="fixed inset-0 z-[9998] bg-black/70" onClick={() => setShowFinishConfirm(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-bg-surface px-4 pt-3" style={{ borderRadius: "20px 20px 0 0", paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))", boxShadow: "0 -8px 32px rgba(0,0,0,0.4)" }}>
            <div className="flex justify-center mb-3"><div className="w-10 h-1 rounded-full bg-border" /></div>
            <p className="font-display text-16 font-semibold text-text-primary mb-1">Save this workout?</p>
            <div className="flex gap-4 py-3 mb-4">
              <div className="flex-1 text-center">
                <p className="text-22 font-bold text-text-primary">{fmtTime(elapsedSeconds)}</p>
                <p className="text-11 text-text-muted uppercase tracking-wide mt-0.5">Duration</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-22 font-bold text-text-primary">{totalSets}</p>
                <p className="text-11 text-text-muted uppercase tracking-wide mt-0.5">Sets</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-22 font-bold text-text-primary">{totalVolume.toFixed(0)}</p>
                <p className="text-11 text-text-muted uppercase tracking-wide mt-0.5">kg</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-22 font-bold text-text-primary">{allExercises.length}</p>
                <p className="text-11 text-text-muted uppercase tracking-wide mt-0.5">Exercises</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setShowFinishConfirm(false); handleEndSession(); }} disabled={ending} className="w-full h-12 rounded-r3 bg-accent hover:bg-accent-hover text-white font-semibold text-14 transition-colors disabled:opacity-50">
                {ending ? "Saving…" : "Save workout"}
              </button>
              <button onClick={() => { setShowFinishConfirm(false); setShowDiscardConfirm(true); }} className="w-full h-12 rounded-r3 border border-error/50 text-error font-medium text-14 transition-colors hover:bg-error/10">
                Discard
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        <button
          type="button"
          onClick={() => setShowDiscardConfirm(true)}
          className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1 flex justify-center overflow-hidden">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-13 font-semibold truncate max-w-full" style={{ background: "rgba(100,180,160,0.18)", color: "var(--color-accent)" }}>
            {data.template?.name ?? "Quick start"}
          </div>
        </div>
        <div className="flex items-center gap-1 text-text-muted flex-shrink-0">
          <Timer size={14} />
          <span className="font-mono text-13 tabular-nums">{fmtTime(elapsedSeconds)}</span>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="px-4 py-2 border-b border-border/30">
        <p className="text-11 font-semibold uppercase tracking-widest text-text-muted">
          {allExercises.length} EXS
          <span className="mx-1.5">·</span>
          {totalSets} SETS
          <span className="mx-1.5">·</span>
          {totalVolume.toFixed(0)} KG
          <span className="mx-1.5">·</span>
          {Math.floor(elapsedSeconds / 60)} MIN
        </p>
      </div>

      {/* ── Muscle group filter tabs ── */}
      {uniqueCategories.length > 1 && (
        <div className="px-4 py-2.5 border-b border-border/30 overflow-x-auto">
          <div className="flex gap-1.5">
            <MuscleTab label="All" active={activeFilter === null} onClick={() => setActiveFilter(null)} />
            {uniqueCategories.map(cat => (
              <MuscleTab
                key={cat}
                label={cat}
                color={categoryStyle(cat).accent}
                active={activeFilter === cat}
                onClick={() => setActiveFilter(activeFilter === cat ? null : cat)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Rest timer (floating) ── */}
      {restRemaining > 0 && (
        <div className="px-4 pt-2">
          <RestTimer
            remaining={restRemaining}
            total={restTotal}
            onAdjust={(delta) => { setRestManuallySet(true); setRestRemaining(r => Math.max(0, r + delta)); }}
            onSkip={() => setRestRemaining(0)}
            onChangeTotal={(v) => { setRestManuallySet(true); setRestTotal(v); }}
          />
        </div>
      )}

      {/* ── Exercise cards ── */}
      <div className="flex-1 px-4 pt-3 flex flex-col gap-2.5 pb-32">
        {isQuickStart && allExercises.length === 0 && !showPicker && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-16 h-16 rounded-r4 bg-bg-elevated flex items-center justify-center">
              <Plus size={28} className="text-text-muted" />
            </div>
            <div>
              <p className="font-display text-18 font-semibold text-text-primary">Quick start</p>
              <p className="text-13 text-text-secondary mt-1">Add an exercise to begin</p>
            </div>
            <button onClick={() => setShowPicker(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors">
              <Plus size={14} /> Add exercise
            </button>
          </div>
        )}

        {filteredExercises.map((ex) => {
          const realIdx = allExercises.indexOf(ex);
          const exSets = loggedSets.filter(s => s.exercise_id === ex.exercise_id);
          const exTarget = targetOverrides[ex.id] ?? ex.sets_target ?? null;
          const isSupersetLinked = supersetLinks.has(realIdx);
          const isSupersetAbove = realIdx > 0 && supersetLinks.has(realIdx - 1);
          const exHistory = realIdx === currentExIdx ? exerciseHistory : [];
          const exSuggested = (() => {
            if (realIdx !== currentExIdx || !exHistory.length || !exHistory[0].sets.length) return 0;
            const lw = exHistory[0].sets[0].weight_kg;
            if (isDeload) return Math.round(lw * 0.6 * 4) / 4;
            return exHistory[0].sets.every(s => s.reps >= (ex.reps_target ?? 5)) ? lw + 2.5 : lw;
          })();

          return (
            <div key={ex.id}>
              {isSupersetAbove && <SupersetConnector />}
              <ExerciseCard
                exercise={ex}
                index={realIdx}
                loggedSets={exSets}
                isActive={realIdx === currentExIdx}
                targetSets={exTarget}
                weight={realIdx === currentExIdx ? weight : 0}
                reps={realIdx === currentExIdx ? reps : (ex.reps_target ?? 10)}
                durationSeconds={realIdx === currentExIdx ? durationSeconds : 60}
                distanceKm={realIdx === currentExIdx ? distanceKm : 1}
                floors={realIdx === currentExIdx ? floors : 10}
                currentSetType={currentSetType}
                isDeload={isDeload}
                suggestedWeight={exSuggested}
                focusSignal={realIdx === currentExIdx ? focusSignal : 0}
                isSupersetLinked={isSupersetLinked}
                isLastExercise={realIdx === allExercises.length - 1}
                onActivate={() => {
                  setCurrentExIdx(realIdx);
                  setCurrentSetIdx(exSets.length);
                }}
                onCompleteSet={handleCompleteSet}
                onWeightChange={setWeight}
                onRepsChange={setReps}
                onDurationChange={setDurationSeconds}
                onDistanceChange={setDistanceKm}
                onFloorsChange={setFloors}
                onSetTypeChange={setCurrentSetType}
                onAddSet={() => setTargetOverrides(prev => ({ ...prev, [ex.id]: (exTarget ?? exSets.length) + 1 }))}
                onRemoveSet={() => { if (exTarget !== null && exTarget > exSets.length + 1) setTargetOverrides(prev => ({ ...prev, [ex.id]: exTarget - 1 })); }}
                onRemoveExercise={() => {
                  setRemovedIds(prev => { const n = new Set(Array.from(prev)); n.add(ex.id); return n; });
                  setCurrentExIdx(i => Math.min(i, allExercises.length - 2));
                }}
                onToggleSuperset={() => {
                  setSupersetLinks(prev => {
                    const n = new Set(Array.from(prev));
                    if (n.has(realIdx)) n.delete(realIdx); else n.add(realIdx);
                    return n;
                  });
                }}
                onUpdateSet={handleUpdateSet}
                onDeleteSet={handleDeleteSet}
              />
            </div>
          );
        })}
      </div>

      {/* ── Finish button + Add exercise FAB ── */}
      {!showFinishConfirm && (
        <>
          <button
            type="button"
            onClick={() => setShowFinishConfirm(true)}
            disabled={ending}
            className="fixed z-[100] h-12 px-5 rounded-pill bg-accent hover:bg-accent-hover text-white text-14 font-semibold flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
            style={{
              bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
              left: "1rem",
              boxShadow: "0 4px 16px rgba(100,180,160,0.35)",
            }}
          >
            Finish
          </button>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="fixed z-[100] w-12 h-12 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center transition-colors"
            style={{
              bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
              right: "1rem",
              boxShadow: "0 4px 20px rgba(100,180,160,0.4)",
            }}
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>
        </>
      )}
    </div>
  );
}
