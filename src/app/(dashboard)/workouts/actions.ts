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

export async function startBlankSession(): Promise<{ error: string } | void> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: session, error } = await supabase
    .from("workout_sessions")
    .insert({ user_id: user.id, template_id: null, xp_earned: 0 })
    .select("id")
    .single();

  if (error || !session) return { error: error?.message ?? "Failed to start session" };
  redirect(`/workouts/session?id=${(session as { id: string }).id}`);
}

export async function getExercises(): Promise<ExerciseRow[]> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("exercises")
    .select("id, name, category, muscle_primary, equipment")
    .order("name");

  return (data ?? []) as ExerciseRow[];
}

export async function createCustomExercise(
  formData: FormData
): Promise<{ error: string } | { success: true; exercise: ExerciseRow }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required" };

  const { data, error } = await supabase.from("exercises").insert({
    name,
    category: (formData.get("category") as string) || null,
    muscle_primary: (formData.get("muscle_primary") as string) || null,
    equipment: (formData.get("equipment") as string) || null,
    is_custom: true,
    user_id: user.id,
  }).select("id, name, category, muscle_primary, equipment").single();

  if (error) return { error: error.message };
  revalidatePath("/workouts/exercises");
  return { success: true, exercise: data as ExerciseRow };
}

export interface CalendarSession {
  date: string;
  template_name: string | null;
  sets_count: number;
}

export async function getSessionsForMonth(
  year: number,
  month: number
): Promise<CalendarSession[]> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const start = new Date(year, month - 1, 1).toISOString();
  const end = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, started_at, template_id")
    .eq("user_id", user.id)
    .not("ended_at", "is", null)
    .gte("started_at", start)
    .lte("started_at", end);

  if (!sessions?.length) return [];

  const sessArr = sessions as Array<{ id: string; started_at: string; template_id: string | null }>;
  const templateIds = Array.from(
    new Set(sessArr.map((s) => s.template_id).filter((id): id is string => id !== null))
  );
  const sessionIds = sessArr.map((s) => s.id);

  const [templatesRes, setsRes] = await Promise.all([
    templateIds.length > 0
      ? supabase.from("workout_templates").select("id, name").in("id", templateIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    supabase.from("session_sets").select("id, session_id").in("session_id", sessionIds),
  ]);

  const templateMap = new Map(
    ((templatesRes.data ?? []) as Array<{ id: string; name: string }>).map((t) => [t.id, t.name])
  );
  const setsCountMap = new Map<string, number>();
  for (const s of (setsRes.data ?? []) as Array<{ id: string; session_id: string }>) {
    setsCountMap.set(s.session_id, (setsCountMap.get(s.session_id) ?? 0) + 1);
  }

  return sessArr.map((s) => ({
    date: s.started_at.split("T")[0],
    template_name: s.template_id ? (templateMap.get(s.template_id) ?? null) : null,
    sets_count: setsCountMap.get(s.id) ?? 0,
  }));
}

export interface PRResult {
  exerciseId: string;
  exerciseName: string;
  prType: "load" | "reps";
  weightKg: number | null;
  reps: number | null;
}

export interface ExerciseSessionHistory {
  date: string;
  sets: Array<{ weight_kg: number; reps: number }>;
}

// ---------- Template seeding ----------

const DEFAULT_TEMPLATES: Array<{
  name: string;
  category: string;
  exercises: Array<{ name: string; sets: number; reps: number }>;
}> = [
  {
    name: "Upper A — Push",
    category: "upper",
    exercises: [
      { name: "Barbell Bench Press", sets: 3, reps: 5 },
      { name: "Dumbbell Incline Press", sets: 3, reps: 10 },
      { name: "Dumbbell Chest Fly", sets: 3, reps: 12 },
      { name: "Dumbbell Shoulder Press", sets: 3, reps: 10 },
      { name: "Dumbbell Lateral Raise", sets: 3, reps: 15 },
      { name: "Overhead DB Tricep Extension", sets: 3, reps: 12 },
    ],
  },
  {
    name: "Lower A — Quad",
    category: "lower",
    exercises: [
      { name: "Barbell Back Squat", sets: 3, reps: 5 },
      { name: "Bulgarian Split Squat", sets: 3, reps: 10 },
      { name: "Leg Extension", sets: 3, reps: 12 },
      { name: "Standing Calf Raise", sets: 4, reps: 15 },
      { name: "Adductor Machine", sets: 3, reps: 12 },
      { name: "Ab Wheel Rollout", sets: 3, reps: 10 },
    ],
  },
  {
    name: "Upper B — Pull",
    category: "upper",
    exercises: [
      { name: "Pull-Up", sets: 3, reps: 8 },
      { name: "Barbell Bent-Over Row", sets: 3, reps: 8 },
      { name: "Cable Row", sets: 3, reps: 10 },
      { name: "Cable Face Pull", sets: 3, reps: 15 },
      { name: "Dumbbell Hammer Curl", sets: 3, reps: 10 },
      { name: "Incline Dumbbell Curl", sets: 3, reps: 12 },
    ],
  },
  {
    name: "Lower B — Posterior",
    category: "lower",
    exercises: [
      { name: "Barbell Romanian Deadlift", sets: 3, reps: 8 },
      { name: "Barbell Good Morning", sets: 3, reps: 10 },
      { name: "Leg Curl", sets: 3, reps: 10 },
      { name: "Seated Calf Raise", sets: 4, reps: 15 },
      { name: "Abductor Machine", sets: 3, reps: 12 },
      { name: "Hanging Leg Raise", sets: 3, reps: 12 },
    ],
  },
];

// Exercises that may not exist in the seed data
const EXTRA_EXERCISES = [
  { name: "Overhead DB Tricep Extension", category: "dumbbell", muscle_primary: "triceps", equipment: "dumbbell" },
  { name: "Bulgarian Split Squat", category: "bodyweight", muscle_primary: "quadriceps", equipment: "dumbbell" },
  { name: "Standing Calf Raise", category: "machine", muscle_primary: "calves", equipment: "machine" },
  { name: "Adductor Machine", category: "machine", muscle_primary: "quadriceps", equipment: "machine" },
  { name: "Ab Wheel Rollout", category: "bodyweight", muscle_primary: "core", equipment: "none" },
  { name: "Incline Dumbbell Curl", category: "dumbbell", muscle_primary: "biceps", equipment: "dumbbell" },
  { name: "Seated Calf Raise", category: "machine", muscle_primary: "calves", equipment: "machine" },
  { name: "Abductor Machine", category: "machine", muscle_primary: "glutes", equipment: "machine" },
];

export async function seedDefaultTemplates(): Promise<void> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Only seed if user has no templates
  const { count } = await supabase
    .from("workout_templates")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((count ?? 0) > 0) return;

  // Ensure extra exercises exist (upsert by name)
  for (const ex of EXTRA_EXERCISES) {
    const { data: existing } = await supabase
      .from("exercises")
      .select("id")
      .eq("name", ex.name)
      .eq("is_custom", false)
      .maybeSingle();
    if (!existing) {
      await supabase.from("exercises").insert({
        name: ex.name,
        category: ex.category,
        muscle_primary: ex.muscle_primary,
        equipment: ex.equipment,
        is_custom: false,
        user_id: null,
      });
    }
  }

  // Get all exercise IDs needed
  const allNames = DEFAULT_TEMPLATES.flatMap((t) => t.exercises.map((e) => e.name));
  const { data: exRows } = await supabase
    .from("exercises")
    .select("id, name")
    .in("name", allNames);

  const nameToId = new Map((exRows ?? []).map((e) => [e.name as string, e.id as string]));

  for (const tmpl of DEFAULT_TEMPLATES) {
    const { data: template } = await supabase
      .from("workout_templates")
      .insert({ user_id: user.id, name: tmpl.name, category: tmpl.category })
      .select("id")
      .single();
    if (!template) continue;

    const tmplId = (template as { id: string }).id;
    const rows = tmpl.exercises
      .map((ex, i) => {
        const exerciseId = nameToId.get(ex.name);
        if (!exerciseId) return null;
        return { template_id: tmplId, exercise_id: exerciseId, sets_target: ex.sets, reps_target: ex.reps, order_index: i };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length > 0) {
      await supabase.from("template_exercises").insert(rows);
    }
  }
}

// ---------- Progressive overload ----------

export async function getExerciseHistory(exerciseId: string): Promise<ExerciseSessionHistory[]> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get the last 3 completed sessions that logged this exercise
  const { data: sets } = await supabase
    .from("session_sets")
    .select("session_id, weight_kg, reps, completed_at")
    .eq("exercise_id", exerciseId)
    .order("completed_at", { ascending: false });

  if (!sets?.length) return [];

  // Group by session, take last 3 sessions
  const sessionGroups = new Map<string, Array<{ weight_kg: number; reps: number; completed_at: string }>>();
  for (const s of sets) {
    if (!sessionGroups.has(s.session_id)) sessionGroups.set(s.session_id, []);
    sessionGroups.get(s.session_id)!.push({ weight_kg: s.weight_kg ?? 0, reps: s.reps ?? 0, completed_at: s.completed_at });
  }

  const sessionIds = Array.from(sessionGroups.keys()).slice(0, 3);

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, started_at")
    .in("id", sessionIds)
    .not("ended_at", "is", null);

  const sessionDates = new Map((sessions ?? []).map((s) => [s.id as string, s.started_at as string]));

  return sessionIds
    .filter((id) => sessionDates.has(id))
    .map((id) => ({
      date: sessionDates.get(id)!.split("T")[0],
      sets: (sessionGroups.get(id) ?? []).map((s) => ({ weight_kg: s.weight_kg, reps: s.reps })),
    }));
}

// ---------- PR detection + session finalization ----------

export async function finalizeSession(sessionId: string): Promise<{ prs: PRResult[]; sets_count: number }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { prs: [], sets_count: 0 };

  // End the session
  const { data: sets } = await supabase
    .from("session_sets")
    .select("id, exercise_id, weight_kg, reps")
    .eq("session_id", sessionId);

  const setsArr = (sets ?? []) as Array<{ id: string; exercise_id: string; weight_kg: number | null; reps: number | null }>;
  const xp = Math.max(10, setsArr.length * 5);

  await supabase
    .from("workout_sessions")
    .update({ ended_at: new Date().toISOString(), xp_earned: xp })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  const { data: profile } = await supabase.from("profiles").select("xp").eq("id", user.id).single();
  if (profile) {
    await supabase.from("profiles").update({ xp: ((profile as { xp: number }).xp ?? 0) + xp }).eq("id", user.id);
  }

  // Detect PRs per exercise
  const exerciseIds = Array.from(new Set(setsArr.map((s) => s.exercise_id)));
  const prs: PRResult[] = [];

  for (const exerciseId of exerciseIds) {
    const sessionSets = setsArr.filter((s) => s.exercise_id === exerciseId);
    const maxWeight = Math.max(...sessionSets.map((s) => s.weight_kg ?? 0));

    // Get historical max weight for this exercise (before this session)
    const { data: histSets } = await supabase
      .from("session_sets")
      .select("weight_kg, reps, session_id")
      .eq("exercise_id", exerciseId)
      .neq("session_id", sessionId);

    const histArr = (histSets ?? []) as Array<{ weight_kg: number | null; reps: number | null; session_id: string }>;

    const histMaxWeight = histArr.reduce((m, s) => Math.max(m, s.weight_kg ?? 0), 0);
    const histMaxRepsAtSameWeight = histArr
      .filter((s) => (s.weight_kg ?? 0) === maxWeight)
      .reduce((m, s) => Math.max(m, s.reps ?? 0), 0);
    const sessionMaxRepsAtMaxWeight = sessionSets
      .filter((s) => (s.weight_kg ?? 0) === maxWeight)
      .reduce((m, s) => Math.max(m, s.reps ?? 0), 0);

    const { data: exRow } = await supabase.from("exercises").select("name").eq("id", exerciseId).single();
    const exerciseName = (exRow as { name: string } | null)?.name ?? "Unknown";

    // Load PR: new highest weight ever
    if (maxWeight > 0 && maxWeight > histMaxWeight) {
      await supabase.from("personal_records").insert({
        user_id: user.id, exercise_id: exerciseId, pr_type: "load",
        weight_kg: maxWeight, reps: sessionMaxRepsAtMaxWeight, session_id: sessionId,
      });
      prs.push({ exerciseId, exerciseName, prType: "load", weightKg: maxWeight, reps: sessionMaxRepsAtMaxWeight });
    }
    // Rep PR: more reps at same weight than ever before
    else if (sessionMaxRepsAtMaxWeight > 0 && sessionMaxRepsAtMaxWeight > histMaxRepsAtSameWeight && maxWeight > 0) {
      await supabase.from("personal_records").insert({
        user_id: user.id, exercise_id: exerciseId, pr_type: "reps",
        weight_kg: maxWeight, reps: sessionMaxRepsAtMaxWeight, session_id: sessionId,
      });
      prs.push({ exerciseId, exerciseName, prType: "reps", weightKg: maxWeight, reps: sessionMaxRepsAtMaxWeight });
    }
  }

  revalidatePath("/workouts");
  return { prs, sets_count: setsArr.length };
}

// ---------- Deload detection ----------

export async function getTrainingWeekCount(): Promise<number> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("started_at")
    .eq("user_id", user.id)
    .not("ended_at", "is", null);

  if (!sessions?.length) return 0;

  const weeks = new Set<string>();
  for (const s of sessions) {
    const d = new Date(s.started_at as string);
    const year = d.getFullYear();
    const week = Math.ceil(((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7);
    weeks.add(`${year}-W${week}`);
  }
  return weeks.size;
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

export async function deleteWorkoutSession(sessionId: string): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Delete PRs linked to this session
  await db.from("personal_records")
    .delete()
    .eq("session_id", sessionId)
    .eq("user_id", user.id);

  // Delete the session — session_sets cascade via FK
  const { error } = await supabase
    .from("workout_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/workouts");
  return {};
}
