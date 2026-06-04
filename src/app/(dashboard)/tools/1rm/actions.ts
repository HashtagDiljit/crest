"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveOneRepMax(exerciseId: string, weightKg: number, reps: number): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check if this beats the existing PR
  const { data: existing } = await supabase
    .from("personal_records")
    .select("weight_kg")
    .eq("user_id", user.id)
    .eq("exercise_id", exerciseId)
    .eq("pr_type", "load")
    .order("weight_kg", { ascending: false })
    .limit(1)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingKg = (existing as any)?.weight_kg ?? 0;
  if (weightKg <= existingKg) return {};

  const { error } = await supabase.from("personal_records").insert({
    user_id: user.id,
    exercise_id: exerciseId,
    pr_type: "load",
    weight_kg: weightKg,
    reps,
    achieved_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };
  revalidatePath("/workouts/exercises");
  return {};
}
