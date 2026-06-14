"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import type { MealLogRow, SupplementLogRow, NutritionSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

export async function getNutritionData() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { todayMeals: [] as MealLogRow[], weeklyTotals: [] as Array<{date:string;protein_g:number}>, supplementLogs: [] as SupplementLogRow[], settings: DEFAULT_SETTINGS };

  const today = new Date().toISOString().split("T")[0];
  const since7 = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];
  const since30 = new Date(Date.now() - 29 * 86400000).toISOString().split("T")[0];

  const [mealsRes, weekRes, suppRes, profileRes] = await Promise.all([
    supabase.from("nutrition_logs").select("*").eq("user_id", user.id).eq("logged_date", today).order("logged_at", { ascending: true }),
    supabase.from("nutrition_logs").select("logged_date, protein_g").eq("user_id", user.id).gte("logged_date", since7).lte("logged_date", today),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("supplement_logs") as any).select("supplement_name, logged_date").eq("user_id", user.id).gte("logged_date", since30).order("logged_date"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("profiles").select("nutrition_settings").eq("id", user.id).single()) as any,
  ]);

  const rawSettings = profileRes.data?.nutrition_settings;
  const settings: NutritionSettings = {
    protein_target: rawSettings?.protein_target || DEFAULT_SETTINGS.protein_target,
    meals_per_day: rawSettings?.meals_per_day || DEFAULT_SETTINGS.meals_per_day,
    supplements: rawSettings?.supplements
      ? { ...DEFAULT_SETTINGS.supplements, ...rawSettings.supplements }
      : { ...DEFAULT_SETTINGS.supplements },
  };

  const totalsByDate: Record<string, number> = {};
  for (const row of (weekRes.data ?? [])) {
    const d = row.logged_date as string;
    totalsByDate[d] = (totalsByDate[d] ?? 0) + (row.protein_g ?? 0);
  }
  const weeklyTotals = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000).toISOString().split("T")[0];
    return { date: d, protein_g: Math.round(totalsByDate[d] ?? 0) };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const todayMeals: MealLogRow[] = (mealsRes.data ?? []).map((l: any) => ({
    id: l.id,
    logged_date: l.logged_date,
    logged_at: l.logged_at,
    meal_type: l.meal_type ?? null,
    food_name: l.food_name ?? l.meal_name ?? null,
    protein_g: l.protein_g ?? null,
    portion_multiplier: l.portion_multiplier ?? 1,
  }));

  const supplementLogs: SupplementLogRow[] = suppRes.data ?? [];

  return { todayMeals, weeklyTotals, supplementLogs, settings };
}

export async function logMeal(
  mealType: string,
  foodName: string,
  proteinG: number,
  isPreset: boolean,
  foodPreset: string | null,
  portionMultiplier: number,
  extras?: {
    caloriesKcal?: number;
    carbsG?: number;
    fatG?: number;
    fdcId?: string;
    barcode?: string;
  },
): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const today = new Date().toISOString().split("T")[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("nutrition_logs") as any).insert({
    user_id: user.id,
    logged_date: today,
    meal_name: foodName,
    protein_g: Math.round(proteinG * portionMultiplier * 10) / 10,
    food_preset: foodPreset,
    meal_type: mealType,
    is_preset: isPreset,
    portion_multiplier: portionMultiplier,
    ...(extras?.caloriesKcal !== undefined ? { calories_kcal: Math.round(extras.caloriesKcal * portionMultiplier * 10) / 10 } : {}),
    ...(extras?.carbsG !== undefined ? { carbs_g: Math.round(extras.carbsG * portionMultiplier * 10) / 10 } : {}),
    ...(extras?.fatG !== undefined ? { fat_g: Math.round(extras.fatG * portionMultiplier * 10) / 10 } : {}),
    ...(extras?.fdcId ? { fdc_id: extras.fdcId } : {}),
    ...(extras?.barcode ? { barcode: extras.barcode } : {}),
  });

  if (error) return { error: error.message };
  revalidatePath("/nutrition");
  return {};
}

export async function deleteMeal(id: string): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase.from("nutrition_logs").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/nutrition");
  return {};
}

export async function toggleSupplement(supplementName: string): Promise<{ taken: boolean; error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { taken: false, error: "Not authenticated" };

  const today = new Date().toISOString().split("T")[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from("supplement_logs") as any)
    .select("id")
    .eq("user_id", user.id)
    .eq("supplement_name", supplementName)
    .eq("logged_date", today)
    .maybeSingle();

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("supplement_logs") as any).delete().eq("id", existing.id);
    revalidatePath("/nutrition");
    return { taken: false };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("supplement_logs") as any).insert({
    user_id: user.id,
    supplement_name: supplementName,
    logged_date: today,
  });
  revalidatePath("/nutrition");
  return { taken: true };
}

export async function saveNutritionSettings(settings: NutritionSettings): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("profiles") as any).update({ nutrition_settings: settings }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/nutrition");
  return {};
}

export async function getRecentMeals(): Promise<Array<{ meal_name: string; protein_g: number; food_preset: string | null }>> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("nutrition_logs")
    .select("meal_name, protein_g, food_preset")
    .eq("user_id", user.id)
    .not("meal_name", "is", null)
    .order("logged_at", { ascending: false })
    .limit(20);
  // Deduplicate by meal_name, keep most recent 3
  const seen = new Set<string>();
  const result: Array<{ meal_name: string; protein_g: number; food_preset: string | null }> = [];
  for (const row of data ?? []) {
    if (!row.meal_name || seen.has(row.meal_name)) continue;
    seen.add(row.meal_name);
    result.push({ meal_name: row.meal_name, protein_g: row.protein_g ?? 0, food_preset: row.food_preset });
    if (result.length >= 3) break;
  }
  return result;
}

export interface FoodPreset {
  id: string;
  name: string;
  category: string;
  meal_type: string;
  protein_g: number;
  calories_kcal: number;
  carbs_g: number;
  fat_g: number;
  serving_g: number;
  is_global: boolean;
}

export async function getGlobalFoodPresets(): Promise<FoodPreset[]> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get user's hidden presets list
  let hiddenIds: string[] = [];
  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: prof } = await (supabase.from("profiles").select("nutrition_settings").eq("id", user.id).single()) as any;
    hiddenIds = prof?.nutrition_settings?.hidden_presets ?? [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("food_presets") as any)
    .select("id, name, category, meal_type, protein_g, calories_kcal, carbs_g, fat_g, serving_g, user_id")
    .order("category")
    .order("name");

  if (user) {
    query = query.or(`user_id.is.null,user_id.eq.${user.id}`);
  } else {
    query = query.is("user_id", null);
  }

  const { data } = await query;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[])
    .filter((f) => !hiddenIds.includes(f.id))
    .map((f) => ({
      id: f.id,
      name: f.name,
      category: f.category,
      meal_type: f.meal_type,
      protein_g: f.protein_g ?? 0,
      calories_kcal: f.calories_kcal ?? 0,
      carbs_g: f.carbs_g ?? 0,
      fat_g: f.fat_g ?? 0,
      serving_g: f.serving_g ?? 100,
      is_global: f.user_id === null,
    }));
}

export async function hidePreset(presetId: string): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: prof } = await (supabase.from("profiles").select("nutrition_settings").eq("id", user.id).single()) as any;
  const settings = prof?.nutrition_settings ?? {};
  const hidden: string[] = settings.hidden_presets ?? [];
  if (!hidden.includes(presetId)) hidden.push(presetId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("profiles") as any).update({
    nutrition_settings: { ...settings, hidden_presets: hidden },
  }).eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/nutrition");
  return {};
}

export async function deleteCustomPreset(presetId: string): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("food_presets") as any)
    .delete()
    .eq("id", presetId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/nutrition");
  return {};
}

export async function getNutritionSettings(): Promise<NutritionSettings> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return DEFAULT_SETTINGS;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("profiles").select("nutrition_settings").eq("id", user.id).single()) as any;
  const raw = data?.nutrition_settings;
  if (!raw) return DEFAULT_SETTINGS;
  return {
    protein_target: raw.protein_target || DEFAULT_SETTINGS.protein_target,
    meals_per_day: raw.meals_per_day || DEFAULT_SETTINGS.meals_per_day,
    supplements: { ...DEFAULT_SETTINGS.supplements, ...(raw.supplements ?? {}) },
  };
}
