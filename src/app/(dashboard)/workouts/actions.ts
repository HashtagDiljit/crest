"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type WorkoutTemplate = Database["public"]["Tables"]["workout_templates"]["Row"];
type WorkoutSession = Database["public"]["Tables"]["workout_sessions"]["Row"];
type SessionSetDB = Database["public"]["Tables"]["session_sets"]["Row"];
type ExerciseDB = Database["public"]["Tables"]["exercises"]["Row"];
type TemplateExerciseDB = Database["public"]["Tables"]["template_exercises"]["Row"];
type ProfileDB = Database["public"]["Tables"]["profiles"]["Row"];

export interface ExerciseRow {
  id: string;
  name: string;
  category: string | null;
  muscle_primary: string | null;
  equipment: string | null;
}

export interface TemplateExerciseRow {
  id: string;
  template_id: string;
  exercise_id: string;
  sets_target: number | null;
  reps_target: number | null;
  order_index: number;
  exercise: ExerciseRow;
}

export interface TemplateRow {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  icon_colour: string | null;
  exercises: TemplateExerciseRow[];
}

export interface SessionSetRow {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  completed_at: string;
}

export interface SessionRow {
  id: string;
  user_id: string;
  template_id: string | null;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  xp_earned: number;
}

export interface SessionWithDetails extends SessionRow {
  template_name: string | null;
  exercises: TemplateExerciseRow[];
  sets: SessionSetRow[];
}

export interface HistorySession extends SessionRow {
  template_name: string | null;
  sets_count: number;
}

export async function getTemplates(): Promise<TemplateRow[]> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("workout_templates")
    .select("id, user_id, name, category, icon_colour")
    .eq("user_id", user.id)
    .order("name");

  if (error || !data) return [];

  const templates = data as WorkoutTemplate[];

  const withExercises = await Promise.all(
    templates.map(async (t) => {
      const { data: teData } = await supabase
        .from("template_exercises")
        .select("id, template_id, exercise_id, sets_target, reps_target, order_index")
        .eq("template_id", t.id)
        .order("order_index");

      const exerciseRows = (teData ?? []) as TemplateExerciseDB[];
      const exerciseIds = exerciseRows.map((te) => te.exercise_id);

      const { data: exData } =
        exerciseIds.length > 0
          ? await supabase
              .from("exercises")
              .select("id, name, category, muscle_primary, equipment")
              .in("id", exerciseIds)
          : { data: [] };

      const exMap = new Map(
        ((exData ?? []) as ExerciseDB[]).map((e) => [e.id, e])
      );

      const exercises: TemplateExerciseRow[] = exerciseRows.map((te) => ({
        id: te.id,
        template_id: te.template_id,
        exercise_id: te.exercise_id,
        sets_target: te.sets_target,
        reps_target: te.reps_target,
        order_index: te.order_index,
        exercise: exMap.get(te.exercise_id) ?? {
          id: te.exercise_id,
          name: "Unknown",
          category: null,
          muscle_primary: null,
          equipment: null,
        },
      }));

      return { ...t, exercises };
    })
  );

  return withExercises;
}

export async function createTemplate(
  formData: FormData
): Promise<{ error: string } | void> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const exercisesJson = formData.get("exercises") as string;

  if (!name?.trim()) return { error: "Template name is required" };

  let parsedExercises: Array<{
    exerciseId: string;
    setsTarget: number;
    repsTarget: number;
  }> = [];
  try {
    parsedExercises = JSON.parse(exercisesJson || "[]");
  } catch {
    return { error: "Invalid exercise data" };
  }

  const { data: template, error: templateError } = await supabase
    .from("workout_templates")
    .insert({
      user_id: user.id,
      name: name.trim(),
      category: category || null,
      icon_colour: null,
    })
    .select("id")
    .single();

  if (templateError || !template) {
    return { error: templateError?.message ?? "Failed to create template" };
  }

  const tmpl = template as { id: string };

  if (parsedExercises.length > 0) {
    const rows = parsedExercises.map((e, i) => ({
      template_id: tmpl.id,
      exercise_id: e.exerciseId,
      sets_target: e.setsTarget,
      reps_target: e.repsTarget,
      order_index: i,
    }));
    const { error: exError } = await supabase
      .from("template_exercises")
      .insert(rows);
    if (exError) return { error: exError.message };
  }

  revalidatePath("/workouts");
  redirect("/workouts");
}

export async function startSession(
  templateId: string
): Promise<{ error: string } | void> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("template_id", templateId)
    .is("ended_at", null)
    .maybeSingle();

  if (existing) {
    const row = existing as { id: string };
    redirect(`/workouts/session?id=${row.id}`);
  }

  const { data: session, error } = await supabase
    .from("workout_sessions")
    .insert({ user_id: user.id, template_id: templateId, xp_earned: 0 })
    .select("id")
    .single();

  if (error || !session) {
    return { error: error?.message ?? "Failed to start session" };
  }

  const sess = session as { id: string };
  redirect(`/workouts/session?id=${sess.id}`);
}

export async function logSet(data: {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe?: number;
}): Promise<{ error: string } | { id: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: inserted, error } = await supabase
    .from("session_sets")
    .insert({
      session_id: data.sessionId,
      exercise_id: data.exerciseId,
      set_number: data.setNumber,
      weight_kg: data.weightKg,
      reps: data.reps,
      rpe: data.rpe ?? null,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: error?.message ?? "Failed to log set" };
  }

  return { id: (inserted as { id: string }).id };
}

export async function endSession(
  sessionId: string
): Promise<{ error: string } | void> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: sets } = await supabase
    .from("session_sets")
    .select("id")
    .eq("session_id", sessionId);

  const setsArr = sets as Array<{ id: string }> | null;
  const xp = Math.max(10, (setsArr?.length ?? 0) * 5);

  const { error } = await supabase
    .from("workout_sessions")
    .update({ ended_at: new Date().toISOString(), xp_earned: xp })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp")
    .eq("id", user.id)
    .single();

  const profileRow = profile as ProfileDB | null;
  if (profileRow) {
    await supabase
      .from("profiles")
      .update({ xp: (profileRow.xp ?? 0) + xp })
      .eq("id", user.id);
  }

  revalidatePath("/workouts");
  redirect("/workouts");
}

export async function getSession(
  sessionId: string
): Promise<SessionWithDetails | { error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: session, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (error || !session) return { error: "Session not found" };

  const sess = session as WorkoutSession;

  const [templateResult, texResult, setsResult] = await Promise.all([
    sess.template_id
      ? supabase
          .from("workout_templates")
          .select("*")
          .eq("id", sess.template_id)
          .single()
      : Promise.resolve({ data: null }),
    sess.template_id
      ? supabase
          .from("template_exercises")
          .select("id, template_id, exercise_id, sets_target, reps_target, order_index")
          .eq("template_id", sess.template_id)
          .order("order_index")
      : Promise.resolve({ data: [] }),
    supabase
      .from("session_sets")
      .select("*")
      .eq("session_id", sessionId)
      .order("completed_at"),
  ]);

  const templateData = templateResult.data as WorkoutTemplate | null;
  const texRows = (texResult.data ?? []) as TemplateExerciseDB[];
  const setsRows = (setsResult.data ?? []) as SessionSetDB[];

  const exerciseIds = texRows.map((te) => te.exercise_id);
  const { data: exData } =
    exerciseIds.length > 0
      ? await supabase
          .from("exercises")
          .select("id, name, category, muscle_primary, equipment")
          .in("id", exerciseIds)
      : { data: [] };

  const exMap = new Map(
    ((exData ?? []) as ExerciseDB[]).map((e) => [e.id, e])
  );

  const exercises: TemplateExerciseRow[] = texRows.map((te) => ({
    id: te.id,
    template_id: te.template_id,
    exercise_id: te.exercise_id,
    sets_target: te.sets_target,
    reps_target: te.reps_target,
    order_index: te.order_index,
    exercise: exMap.get(te.exercise_id) ?? {
      id: te.exercise_id,
      name: "Unknown",
      category: null,
      muscle_primary: null,
      equipment: null,
    },
  }));

  const sets: SessionSetRow[] = setsRows.map((s) => ({
    id: s.id,
    session_id: s.session_id,
    exercise_id: s.exercise_id,
    set_number: s.set_number,
    weight_kg: s.weight_kg,
    reps: s.reps,
    rpe: s.rpe,
    completed_at: s.completed_at,
  }));

  return {
    id: sess.id,
    user_id: sess.user_id,
    template_id: sess.template_id,
    started_at: sess.started_at,
    ended_at: sess.ended_at,
    notes: sess.notes,
    xp_earned: sess.xp_earned,
    template_name: templateData?.name ?? null,
    exercises,
    sets,
  };
}

export async function getWorkoutHistory(): Promise<HistorySession[]> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", user.id)
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(20);

  if (!sessions?.length) return [];

  const sessArr = sessions as WorkoutSession[];

  const templateIds = Array.from(
    new Set(sessArr.map((s) => s.template_id).filter((id): id is string => id !== null))
  );
  const sessionIds = sessArr.map((s) => s.id);

  const [templatesResult, allSetsResult] = await Promise.all([
    templateIds.length > 0
      ? supabase
          .from("workout_templates")
          .select("id, name")
          .in("id", templateIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from("session_sets")
      .select("id, session_id")
      .in("session_id", sessionIds),
  ]);

  const templateMap = new Map(
    ((templatesResult.data ?? []) as Array<{ id: string; name: string }>).map(
      (t) => [t.id, t.name]
    )
  );
  const setsCountMap = new Map<string, number>();
  for (const s of (allSetsResult.data ?? []) as Array<{
    id: string;
    session_id: string;
  }>) {
    setsCountMap.set(s.session_id, (setsCountMap.get(s.session_id) ?? 0) + 1);
  }

  return sessArr.map((s) => ({
    id: s.id,
    user_id: s.user_id,
    template_id: s.template_id,
    started_at: s.started_at,
    ended_at: s.ended_at,
    notes: s.notes,
    xp_earned: s.xp_earned,
    template_name: s.template_id ? (templateMap.get(s.template_id) ?? null) : null,
    sets_count: setsCountMap.get(s.id) ?? 0,
  }));
}
