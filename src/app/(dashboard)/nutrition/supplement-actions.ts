"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UserSupplement {
  id: string;
  name: string;
  enabled: boolean;
  order_index: number;
}

export async function getUserSupplements(): Promise<UserSupplement[]> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data } = await db
    .from("user_supplements")
    .select("id, name, enabled, order_index")
    .eq("user_id", user.id)
    .order("order_index");

  if (!data || data.length === 0) {
    await db.rpc("seed_default_supplements", { p_user_id: user.id });
    const { data: seeded } = await db
      .from("user_supplements")
      .select("id, name, enabled, order_index")
      .eq("user_id", user.id)
      .order("order_index");
    return (seeded ?? []) as UserSupplement[];
  }

  return data as UserSupplement[];
}

export async function toggleSupplement(id: string, enabled: boolean): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("user_supplements")
    .update({ enabled })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/nutrition");
  return {};
}

export async function addSupplement(name: string): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: existing } = await db
    .from("user_supplements")
    .select("order_index")
    .eq("user_id", user.id)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextIdx = ((existing?.[0] as { order_index: number } | undefined)?.order_index ?? -1) + 1;

  const { error } = await db
    .from("user_supplements")
    .insert({ user_id: user.id, name: name.trim(), enabled: true, order_index: nextIdx });

  if (error) return { error: error.message };
  revalidatePath("/nutrition");
  return {};
}

export async function deleteSupplement(id: string): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("user_supplements")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/nutrition");
  return {};
}

export async function reorderSupplements(ids: string[]): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  await Promise.all(
    ids.map((id, idx) =>
      db
        .from("user_supplements")
        .update({ order_index: idx })
        .eq("id", id)
        .eq("user_id", user.id)
    )
  );

  revalidatePath("/nutrition");
  return {};
}
