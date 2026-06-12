"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { Plus, Minus } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/database";
import { logSet, finalizeSession, getExerciseHistory } from "../actions";
import { track } from "@vercel/analytics";
import type { TemplateExerciseRow, SessionSetRow, SessionRow, ExerciseSessionHistory, PRResult } from "../actions";
import { SessionHeader } from "./_components/SessionHeader";
import { SetTable } from "./_components/SetTable";
import { Steppers } from "./_components/Steppers";
import { RestTimer } from "./_components/RestTimer";
import { ExerciseQueue } from "./_components/ExerciseQueue";
import { AdHocExercisePicker } from "./_components/AdHocExercisePicker";
import { OverloadHistory } from "./_components/OverloadHistory";
import { SessionSummary } from "./_components/SessionSummary";
import type { ExerciseRow } from "../actions";

type WorkoutTemplate = Database["public"]["Tables"]["workout_templates"]["Row"];

export interface SessionData {
  session: SessionRow;
  template: WorkoutTemplate | null;
  exercises: TemplateExerciseRow[];
  sets: SessionSetRow[];
}

export default function SessionPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-text-muted text-13">Loading…</div>}>
      <SessionPage />
    </Suspense>
  );
}

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

  useEffect(() => {
    if (!sessionId) { router.replace("/workouts"); return; }
    const supabase = createClient();

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const { data: sessionRaw } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single();

      if (!sessionRaw) { router.replace("/workouts"); return; }

      const session = sessionRaw as Database["public"]["Tables"]["workout_sessions"]["Row"];

      const templateData = session.template_id
        ? (await supabase.from("workout_templates").select("*").eq("id", session.template_id).single()).data
        : null;

      const { data: texRaw } = session.template_id
        ? await supabase
            .from("template_exercises")
            .select("id, template_id, exercise_id, sets_target, reps_target, order_index")
            .eq("template_id", session.template_id)
            .order("order_index")
        : { data: [] };

      const texRows = (texRaw ?? []) as Array<Database["public"]["Tables"]["template_exercises"]["Row"]>;
      const exerciseIds = texRows.map((te) => te.exercise_id);

      const { data: exRaw } = exerciseIds.length > 0
        ? await supabase.from("exercises").select("id, name, category, muscle_primary, equipment, logging_type").in("id", exerciseIds)
        : { data: [] };

      const exMap = new Map((exRaw ?? []).map((e) => {
        const ex = e as Database["public"]["Tables"]["exercises"]["Row"];
        return [ex.id, ex];
      }));

      const exercises: TemplateExerciseRow[] = texRows.map((te) => ({
        id: te.id,
        template_id: te.template_id,
        exercise_id: te.exercise_id,
        sets_target: te.sets_target,
        reps_target: te.reps_target,
        order_index: te.order_index,
        exercise: exMap.get(te.exercise_id) ?? { id: te.exercise_id, name: "Unknown", category: null, muscle_primary: null, equipment: null, logging_type: "weight_reps" },
      }));

      const { data: setsRaw } = await supabase
        .from("session_sets")
        .select("*")
        .eq("session_id", sessionId)
        .order("completed_at");

      const sets = (setsRaw ?? []).map((s) => {
        const sr = s as Database["public"]["Tables"]["session_sets"]["Row"];
        return {
          id: sr.id,
          session_id: sr.session_id,
          exercise_id: sr.exercise_id,
          set_number: sr.set_number,
          weight_kg: sr.weight_kg,
          reps: sr.reps,
          rpe: sr.rpe,
          completed_at: sr.completed_at,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          set_type: ((sr as any).set_type ?? "working") as SessionSetRow["set_type"],
          duration_seconds: sr.duration_seconds,
          distance_km: sr.distance_km,
        } satisfies SessionSetRow;
      });

      const sessionRow: SessionRow = {
        id: session.id,
        user_id: session.user_id,
        template_id: session.template_id,
        started_at: session.started_at,
        ended_at: session.ended_at,
        notes: session.notes,
        xp_earned: session.xp_earned,
      };

      setData({ session: sessionRow, template: templateData as WorkoutTemplate | null, exercises, sets });
      setLoggedSets(sets);
      setElapsedSeconds(Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000));
      setLoading(false);
    })();
  }, [sessionId, router]);

  // Elapsed timer — stops when session ends
  useEffect(() => {
    if (ending) return;
    const t = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [ending]);

  // Rest countdown
  useEffect(() => {
    if (restRemaining <= 0) return;
    const t = setInterval(() => setRestRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [restRemaining]);

  const allExercises = [...(data?.exercises ?? []), ...adHocExercises].filter((ex) => !removedIds.has(ex.id));
  const currentEx = allExercises[currentExIdx];

  // Fetch exercise history when exercise changes, pre-fill weight
  useEffect(() => {
    if (!currentEx?.exercise_id) return;
    setExerciseHistory([]);
    getExerciseHistory(currentEx.exercise_id).then((h) => {
      setExerciseHistory(h);
      if (h.length > 0 && h[0].sets.length > 0) {
        const lastWeight = h[0].sets[0].weight_kg;
        setWeight(isDeload ? Math.round(lastWeight * 0.6 * 4) / 4 : lastWeight);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEx?.exercise_id]);

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
    setAdHocExercises((prev) => [...prev, adHoc]);
    setShowPicker(false);
    setCurrentExIdx(allExercises.length);
  }
  const setsForCurrentEx = loggedSets.filter((s) => s.exercise_id === currentEx?.exercise_id);
  const isQuickStart = !data?.template;
  const targetSets = currentEx ? (targetOverrides[currentEx.id] ?? currentEx.sets_target ?? 3) : 3;

  function handleAddSet() {
    if (!currentEx) return;
    setTargetOverrides((prev) => ({ ...prev, [currentEx.id]: targetSets + 1 }));
  }

  function handleRemoveSet() {
    if (!currentEx || targetSets <= setsForCurrentEx.length + 1) return;
    setTargetOverrides((prev) => ({ ...prev, [currentEx.id]: targetSets - 1 }));
  }

  // Suggested weight for overload hint
  const suggestedWeight = (() => {
    if (!exerciseHistory.length || !exerciseHistory[0].sets.length) return 0;
    const last = exerciseHistory[0];
    const lastWeight = last.sets[0].weight_kg;
    if (isDeload) return Math.round(lastWeight * 0.6 * 4) / 4;
    const allHit = last.sets.every((s) => s.reps >= (currentEx?.reps_target ?? 5));
    return allHit ? lastWeight + 2.5 : lastWeight;
  })();

  const handleCompleteSet = useCallback(async () => {
    if (!sessionId || !currentEx) return;
    const setNum = setsForCurrentEx.length + 1;
    const loggingType = currentEx.exercise?.logging_type ?? "weight_reps";
    const result = await logSet({
      sessionId,
      exerciseId: currentEx.exercise_id,
      setNumber: setNum,
      weightKg: loggingType === "time_distance" || loggingType === "time_reps" ? 0 : weight,
      reps: loggingType === "weight_reps" ? reps : 0,
      setType: currentSetType,
      durationSeconds: loggingType !== "weight_reps" ? durationSeconds : undefined,
      distanceKm: loggingType === "time_distance" ? distanceKm : undefined,
    });
    if ("id" in result) {
      const newSet: SessionSetRow = {
        id: result.id, session_id: sessionId, exercise_id: currentEx.exercise_id,
        set_number: setNum,
        weight_kg: loggingType === "time_distance" || loggingType === "time_reps" ? 0 : weight,
        reps: loggingType === "weight_reps" ? reps : 0,
        rpe: null,
        set_type: currentSetType,
        completed_at: new Date().toISOString(),
        duration_seconds: loggingType !== "weight_reps" ? durationSeconds : null,
        distance_km: loggingType === "time_distance" ? distanceKm : null,
      };
      const newSets = [...loggedSets, newSet];
      setLoggedSets(newSets);
      setRestRemaining(restTotal);
      setCurrentSetIdx(setNum);

      const newCount = setsForCurrentEx.length + 1;
      const isFirstOfSuperset = supersetLinks.has(currentExIdx);
      const isSecondOfSuperset = currentExIdx > 0 && supersetLinks.has(currentExIdx - 1);

      if (isFirstOfSuperset) {
        // Alternate to partner
        setCurrentExIdx(currentExIdx + 1);
        setCurrentSetIdx(0);
      } else if (isSecondOfSuperset) {
        const firstEx = allExercises[currentExIdx - 1];
        const firstExDone = newSets.filter((s) => s.exercise_id === firstEx?.exercise_id).length;
        const firstExTarget = firstEx ? (targetOverrides[firstEx.id] ?? firstEx.sets_target ?? 3) : 3;
        if (firstExDone >= firstExTarget && newCount >= targetSets) {
          // Both done — advance past superset
          setCurrentExIdx(currentExIdx + 1);
          setCurrentSetIdx(0);
        } else {
          // Back to first exercise in pair
          setCurrentExIdx(currentExIdx - 1);
          setCurrentSetIdx(0);
        }
      } else if (newCount >= targetSets && currentExIdx < allExercises.length - 1) {
        setCurrentExIdx((i) => i + 1);
        setCurrentSetIdx(0);
      }
    }
  }, [sessionId, currentEx, setsForCurrentEx, weight, reps, durationSeconds, distanceKm, restTotal, targetSets, data, currentExIdx, loggedSets, currentSetType, supersetLinks, allExercises, targetOverrides]);

  const handleEndSession = useCallback(async () => {
    if (!sessionId || !data) return;
    setFrozenElapsed(elapsedSeconds);
    setRestRemaining(0);
    setEnding(true);
    const result = await finalizeSession(sessionId);
    setSummary({ ...result, started_at: data.session.started_at });
    track("workout_logged", { sets: result.sets_count ?? 0 });
  }, [sessionId, data, elapsedSeconds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted text-13">
        Loading session…
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="flex flex-col gap-4">
      {summary && (
        <SessionSummary
          sessionId={sessionId!}
          setsCount={summary.sets_count}
          durationSecs={frozenElapsed ?? Math.floor((Date.now() - new Date(summary.started_at).getTime()) / 1000)}
          prs={summary.prs}
        />
      )}
      <SessionHeader
        templateName={data.template?.name ?? "Workout"}
        exerciseName={currentEx?.exercise?.name ?? ""}
        elapsed={elapsedSeconds}
        onEnd={handleEndSession}
        ending={ending}
      />

      <ProgressStrip exercises={allExercises} loggedSets={loggedSets} currentExIdx={currentExIdx} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="flex flex-col gap-4">
          {isQuickStart && allExercises.length === 0 && !showPicker && (
            <div className="rounded-r5 border border-border bg-bg-surface p-8 flex flex-col items-center gap-4 text-center">
              <p className="font-display text-18 font-semibold text-text-primary">Quick start session</p>
              <p className="text-13 text-text-secondary">Add exercises to begin tracking sets.</p>
              <button
                onClick={() => setShowPicker(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors"
              >
                <Plus size={14} /> Add exercise
              </button>
            </div>
          )}
          {showPicker && (
            <AdHocExercisePicker onAdd={handleAddExercise} onClose={() => setShowPicker(false)} />
          )}
          {currentEx && (
            <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-4">
              <div>
                <h2 className="font-display text-[26px] font-bold text-text-primary leading-tight">
                  {currentEx.exercise?.name}
                </h2>
                <p className="text-12 text-text-muted mt-1">
                  {currentEx.exercise?.equipment ?? "—"} · target {targetSets}×{currentEx.reps_target ?? 5}
                  {isDeload && <span className="ml-2 text-warning font-semibold">· Deload week</span>}
                </p>
              </div>
              {exerciseHistory.length > 0 && (
                <OverloadHistory
                  history={exerciseHistory}
                  repsTarget={currentEx.reps_target ?? 5}
                  isDeload={isDeload}
                  suggestedWeight={suggestedWeight}
                />
              )}
              <SetTable
                sets={setsForCurrentEx}
                targetSets={targetSets}
                currentSetIdx={currentSetIdx}
                loggingType={currentEx.exercise?.logging_type ?? "weight_reps"}
              />
              <Steppers
                loggingType={currentEx.exercise?.logging_type ?? "weight_reps"}
                weight={weight}
                reps={reps}
                durationSeconds={durationSeconds}
                distanceKm={distanceKm}
                onWeightChange={setWeight}
                onRepsChange={setReps}
                onDurationChange={setDurationSeconds}
                onDistanceChange={setDistanceKm}
                setNum={setsForCurrentEx.length + 1}
                totalSets={targetSets}
              />
              {/* Set type selector */}
              <div className="flex items-center gap-2">
                <span className="text-11 font-semibold uppercase tracking-widest text-text-muted">Type</span>
                <div className="flex gap-1.5">
                  {([ ["warmup","W","text-warning"], ["working","S","text-accent"], ["dropset","D","text-success"], ["failure","F","text-danger"] ] as const).map(([t, label, col]) => (
                    <button
                      key={t}
                      onClick={() => setCurrentSetType(t)}
                      className={`w-8 h-7 rounded-r2 text-11 font-bold border transition-colors ${
                        currentSetType === t
                          ? `border-current bg-bg-elevated ${col}`
                          : "border-border text-text-disabled hover:text-text-muted"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleCompleteSet}
                className="w-full h-14 rounded-r4 bg-accent hover:bg-accent-hover text-white font-semibold text-15 transition-colors"
              >
                Complete set {setsForCurrentEx.length + 1}
              </button>
              <div className="flex items-center justify-between">
                <button
                  onClick={handleRemoveSet}
                  disabled={targetSets <= setsForCurrentEx.length + 1}
                  className="flex items-center gap-1 text-12 text-text-muted hover:text-text-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus size={12} /> Remove set
                </button>
                <span className="font-mono text-11 text-text-disabled">{targetSets} sets</span>
                <button
                  onClick={handleAddSet}
                  className="flex items-center gap-1 text-12 text-text-muted hover:text-text-secondary transition-colors"
                >
                  <Plus size={12} /> Add set
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <RestTimer
            remaining={restRemaining}
            total={restTotal}
            onAdjust={(delta) => setRestRemaining((r) => Math.max(0, r + delta))}
            onSkip={() => setRestRemaining(0)}
            onChangeTotal={setRestTotal}
          />
          <ExerciseQueue
            exercises={allExercises}
            loggedSets={loggedSets}
            currentExIdx={currentExIdx}
            onJump={setCurrentExIdx}
            onAddExercise={() => setShowPicker(true)}
            onRemoveExercise={(id) => {
              setRemovedIds((prev) => new Set(Array.from(prev).concat(id)));
              setCurrentExIdx((i) => Math.min(i, allExercises.length - 2));
            }}
            supersetLinks={supersetLinks}
            onToggleSuperset={(idx) =>
              setSupersetLinks((prev) => {
                const next = new Set(Array.from(prev));
                if (next.has(idx)) next.delete(idx); else next.add(idx);
                return next;
              })
            }
          />
        </div>
      </div>
    </div>
  );
}

function ProgressStrip({
  exercises,
  loggedSets,
  currentExIdx,
}: {
  exercises: TemplateExerciseRow[];
  loggedSets: SessionSetRow[];
  currentExIdx: number;
}) {
  return (
    <div className="flex gap-1 h-1.5">
      {exercises.map((ex, i) => {
        const done = loggedSets.filter((s) => s.exercise_id === ex.exercise_id).length;
        const target = ex.sets_target ?? 3;
        const isActive = i === currentExIdx;
        return (
          <div key={ex.id} className="flex gap-0.5 flex-1">
            {Array.from({ length: target }).map((_, si) => (
              <div
                key={si}
                className={`h-full flex-1 rounded-pill transition-colors ${
                  si < done
                    ? "bg-success"
                    : isActive && si === done
                    ? "bg-accent"
                    : "bg-bg-elevated"
                }`}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
