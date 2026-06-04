"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { seedDefaultTemplates } from "@/app/(dashboard)/workouts/actions";

export async function saveOnboardingStats(formData: FormData) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const n = (k: string) => {
    const v = parseFloat(formData.get(k) as string);
    return isNaN(v) ? null : v;
  };

  const height = n("height_cm");
  const weight = n("weight_kg");
  const dob = (formData.get("date_of_birth") as string) || null;
  const gender = (formData.get("gender") as string) || null;
  const experience = (formData.get("training_experience") as string) || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileUpdate: any = {
    height_cm: height,
    date_of_birth: dob,
    gender,
    training_experience: experience,
  };
  await supabase.from("profiles").update(profileUpdate).eq("id", user.id);

  if (weight !== null) {
    const today = new Date().toISOString().split("T")[0];
    await supabase
      .from("body_measurements")
      .insert({ user_id: user.id, logged_date: today, weight_kg: weight });
  }
}

export async function saveOnboardingGoals(
  goals: Array<{ title: string; category: string; target_date: string | null }>
) {
  if (!goals.length) return;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const rows = goals
    .filter((g) => g.title.trim())
    .map((g) => ({
      user_id: user.id,
      title: g.title.trim(),
      category: g.category || "general",
      target_date: g.target_date || null,
      progress: 0,
    }));

  if (rows.length) {
    await supabase.from("goals").insert(rows);
  }
}

export async function saveOnboardingHabits(habitNames: string[]) {
  if (!habitNames.length) return;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const rows = habitNames.filter(Boolean).map((name) => ({
    user_id: user.id,
    name,
    frequency: "daily",
  }));

  if (rows.length) {
    await supabase.from("habits").insert(rows);
  }
}

export async function saveOnboardingWorkoutSplit(
  daysPerWeek: number,
  split: string
) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileUpdate: any = { weekly_workout_target: daysPerWeek };
  await supabase.from("profiles").update(profileUpdate).eq("id", user.id);

  if (daysPerWeek === 4 && split === "upper_lower") {
    await seedDefaultTemplates();
  }
}

export async function trackOnboardingStep(step: number) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("profiles") as any)
    .update({ onboarding_step_reached: step })
    .eq("id", user.id)
    .lt("onboarding_step_reached", step); // only update if we're advancing
}

export async function completeOnboarding() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: any = { onboarding_completed: true };
  await supabase.from("profiles").update(update).eq("id", user.id);
  redirect("/dashboard");
}
