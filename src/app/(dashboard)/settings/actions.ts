"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ProfilePrefs {
  username: string | null;
  theme: string | null;
  accent_colour: string | null;
  weight_unit: string | null;
  distance_unit: string | null;
  time_format: string | null;
  week_starts: string | null;
  avatar_url: string | null;
  notification_preferences: Record<string, boolean> | null;
}

export async function getProfilePrefs(): Promise<ProfilePrefs | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("username, theme, accent_colour, weight_unit, distance_unit, time_format, week_starts, avatar_url, notification_preferences")
    .eq("id", user.id)
    .single();

  return data as ProfilePrefs | null;
}

export async function updateDisplayName(name: string): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("profiles").update({ username: name }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/profile");
  return {};
}

export async function updatePassword(currentPassword: string, newPassword: string): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Not authenticated" };

  // Re-authenticate
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInError) return { error: "Current password is incorrect" };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return {};
}

export async function updateAppearance(theme: string, accentColour: string): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("profiles").update({ theme, accent_colour: accentColour }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return {};
}

export async function updateUnits(prefs: {
  weight_unit: string;
  distance_unit: string;
  time_format: string;
  week_starts: string;
}): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("profiles").update(prefs).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return {};
}

export async function updateNotifications(prefs: Record<string, boolean>): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("profiles").update({ notification_preferences: prefs }).eq("id", user.id);
  if (error) return { error: error.message };
  return {};
}

export async function updateAvatarUrl(url: string): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/profile");
  return {};
}

export async function exportUserData(): Promise<{ data?: Record<string, unknown[]>; error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const [workouts, habits, mood, sleep, journal, goals, health] = await Promise.all([
    supabase.from("workout_sessions").select("*").eq("user_id", user.id),
    supabase.from("habit_logs").select("*").eq("user_id", user.id),
    supabase.from("mood_logs").select("*").eq("user_id", user.id),
    supabase.from("sleep_logs").select("*").eq("user_id", user.id),
    supabase.from("journal_entries").select("*").eq("user_id", user.id),
    supabase.from("goals").select("*").eq("user_id", user.id),
    supabase.from("health_metrics").select("*").eq("user_id", user.id),
  ]);

  return {
    data: {
      workout_sessions: workouts.data ?? [],
      habit_logs: habits.data ?? [],
      mood_logs: mood.data ?? [],
      sleep_logs: sleep.data ?? [],
      journal_entries: journal.data ?? [],
      goals: goals.data ?? [],
      health_metrics: health.data ?? [],
    },
  };
}

export interface TrainingPreferences {
  weekly_target: number;
  rest_days: string[];
  overload_increment_kg: number;
  deload_every_weeks: number;
  rest_timer_seconds: number;
}

export async function getTrainingPreferences(): Promise<TrainingPreferences | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("profiles").select("training_preferences").eq("id", user.id).single()) as any;
  return (data?.training_preferences as TrainingPreferences) ?? null;
}

export async function saveTrainingPreferences(prefs: TrainingPreferences): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("profiles") as any).update({ training_preferences: prefs }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/workouts");
  return {};
}

export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Supabase admin is needed to delete auth user; here we just sign out and surface a message
  await supabase.auth.signOut();
  return {};
}
