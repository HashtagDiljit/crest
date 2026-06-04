"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export interface FocusData {
  current_focus: string | null;
  focus_start_date: string | null;
  focus_end_date: string | null;
  focus_checkins: Array<{ date: string; note: string; completed: boolean }>;
}

export async function getFocus(): Promise<FocusData> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { current_focus: null, focus_start_date: null, focus_end_date: null, focus_checkins: [] };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("profiles") as any)
    .select("current_focus, focus_start_date, focus_end_date, focus_checkins")
    .eq("id", user.id)
    .single();

  return {
    current_focus: data?.current_focus ?? null,
    focus_start_date: data?.focus_start_date ?? null,
    focus_end_date: data?.focus_end_date ?? null,
    focus_checkins: data?.focus_checkins ?? [],
  };
}

export async function setFocus(focus: string): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const today = new Date().toISOString().split("T")[0];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 90);
  const end = endDate.toISOString().split("T")[0];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("profiles") as any).update({
    current_focus: focus.trim(),
    focus_start_date: today,
    focus_end_date: end,
    focus_checkins: [],
  }).eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return {};
}

export async function clearFocus(): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("profiles") as any).update({
    current_focus: null,
    focus_start_date: null,
    focus_end_date: null,
    focus_checkins: [],
  }).eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return {};
}

export async function logFocusCheckin(note: string, completed: boolean): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("profiles") as any)
    .select("focus_checkins")
    .eq("id", user.id)
    .single();

  const checkins = (data?.focus_checkins ?? []) as Array<{ date: string; note: string; completed: boolean }>;
  const today = new Date().toISOString().split("T")[0];
  const existing = checkins.findIndex((c) => c.date === today);
  const entry = { date: today, note: note.trim(), completed };

  if (existing >= 0) {
    checkins[existing] = entry;
  } else {
    checkins.push(entry);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("profiles") as any)
    .update({ focus_checkins: checkins })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/goals");
  return {};
}
