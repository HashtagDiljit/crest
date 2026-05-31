"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/database";
import { logSet, finalizeSession, getExerciseHistory } from "../actions";
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
  const [restRemaining, setRestRemaining] = useState(0);
  const [restTotal, setRestTotal] = useState(120);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loggedSets, setLoggedSets] = useState<SessionSetRow[]>([]);
  const [ending, setEnding] = useState(false);
  const [frozenElapsed, setFrozenElapsed] = useState<number | null>(null);
  const [adHocExercises, setAdHocExercises] = useState<TemplateExerciseRow[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set<string>());
  const [showPicker, setShowPicker] = useState(false);
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
        ? await supabase.from("exercises").select("id, name, category, muscle_primary, equipment").in("id", exerciseIds)
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
        exercise: exMap.get(te.exercise_id) ?? { id: te.exercise_id, name: "Unknown", category: null, muscle_primary: null, equipment: null },
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
  const targetSets = currentEx?.sets_target ?? 3;

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
    const result = await logSet({ sessionId, exerciseId: currentEx.exercise_id, setNumber: setNum, weightKg: weight, reps });
    if ("id" in result) {
      const newSet: SessionSetRow = {
        id: result.id, session_id: sessionId, exercise_id: currentEx.exercise_id,
        set_number: setNum, weight_kg: weight, reps, rpe: null,
        completed_at: new Date().toISOString(),
      };
      const newSets = [...loggedSets, newSet];
      setLoggedSets(newSets);
      setRestRemaining(restTotal);
      setCurrentSetIdx(setNum);

      const newCount = setsForCurrentEx.length + 1;
      if (newCount >= targetSets && data && currentExIdx < data.exercises.length - 1) {
        setCurrentExIdx((i) => i + 1);
        setCurrentSetIdx(0);
      }
    }
  }, [sessionId, currentEx, setsForCurrentEx, weight, reps, restTotal, targetSets, data, currentExIdx, loggedSets]);

  const handleEndSession = useCallback(async () => {
    if (!sessionId || !data) return;
    setFrozenElapsed(elapsedSeconds);
    setEnding(true);
    const result = await finalizeSession(sessionId);
    setSummary({ ...result, started_at: data.session.started_at });
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
              <SetTable sets={setsForCurrentEx} targetSets={targetSets} currentSetIdx={currentSetIdx} />
              <Steppers
                weight={weight}
                reps={reps}
                onWeightChange={setWeight}
                onRepsChange={setReps}
                setNum={setsForCurrentEx.length + 1}
                totalSets={targetSets}
              />
              <button
                onClick={handleCompleteSet}
                className="w-full h-14 rounded-r4 bg-accent hover:bg-accent-hover text-white font-semibold text-15 transition-colors"
              >
                Complete set {setsForCurrentEx.length + 1}
              </button>
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
