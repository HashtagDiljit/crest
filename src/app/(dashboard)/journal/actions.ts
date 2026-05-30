"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export interface JournalEntry {
  id: string;
  logged_date: string;
  body: string;
  tags: string[] | null;
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("journal_entries")
    .select("id, logged_date, body, tags")
    .eq("user_id", user.id)
    .order("logged_date", { ascending: false })
    .limit(100);
  return (data ?? []).map((e) => ({ id: e.id, logged_date: e.logged_date, body: e.body, tags: e.tags }));
}

export async function upsertJournalEntry(date: string, body: string, tags?: string[]): Promise<{ error?: string; id?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("user_id", user.id)
    .eq("logged_date", date)
    .order("logged_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("journal_entries")
      .update({ body, tags: tags ?? null })
      .eq("id", (existing as { id: string }).id);
    if (error) return { error: error.message };
    revalidatePath("/journal");
    return { id: (existing as { id: string }).id };
  } else {
    const { data, error } = await supabase
      .from("journal_entries")
      .insert({ user_id: user.id, logged_date: date, body, tags: tags ?? null })
      .select("id")
      .single();
    if (error) return { error: error.message };
    revalidatePath("/journal");
    return { id: (data as { id: string }).id };
  }
}
