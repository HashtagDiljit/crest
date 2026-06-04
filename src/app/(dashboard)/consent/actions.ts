"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ConsentChoices } from "./types";
import { CONSENT_VERSION } from "./types";

export async function getConsent(): Promise<(ConsentChoices & { consent_version: string }) | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("user_consent") as any)
    .select("consent_version, physical_health, mental_emotional, biometric, correlation_analysis, product_improvement")
    .eq("user_id", user.id)
    .maybeSingle();

  return data ?? null;
}

export async function saveConsent(choices: ConsentChoices): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("user_consent") as any).upsert(
    {
      user_id: user.id,
      consent_version: CONSENT_VERSION,
      ...choices,
      consented_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return {};
}

export async function withdrawConsentCategory(
  category: keyof ConsentChoices
): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("user_consent") as any)
    .update({ [category]: false })
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  // Delete associated data
  await deleteConsentCategoryData(supabase, user.id, category);

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return {};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function deleteConsentCategoryData(supabase: any, userId: string, category: keyof ConsentChoices) {
  switch (category) {
    case "mental_emotional":
      await supabase.from("mood_logs").delete().eq("user_id", userId);
      await supabase.from("journal_entries").delete().eq("user_id", userId);
      break;
    case "biometric":
      await supabase.from("health_metrics")
        .delete()
        .eq("user_id", userId)
        .in("metric_type", ["hrv", "resting_hr", "vo2max"]);
      break;
    case "physical_health":
      await supabase.from("workout_sessions").delete().eq("user_id", userId);
      await supabase.from("body_measurements").delete().eq("user_id", userId);
      await supabase.from("sleep_logs").delete().eq("user_id", userId);
      break;
    case "correlation_analysis":
      // No data deletion needed — just disables the correlations feature
      break;
    case "product_improvement":
      // No personal data stored for this
      break;
  }
}
