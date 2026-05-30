"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export interface MilestoneRow {
  id: string;
  goal_id: string;
  title: string;
  completed_at: string | null;
}

export interface GoalRow {
  id: string;
  title: string;
  category: string | null;
  target_date: string | null;
  progress: number;
  completed_at: string | null;
  milestones: MilestoneRow[];
}

export async function getGoals(): Promise<GoalRow[]> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("target_date", { ascending: true, nullsFirst: false });

  if (!goals?.length) return [];

  const goalIds = goals.map((g) => g.id as string);
  const { data: milestones } = await supabase
    .from("goal_milestones")
    .select("*")
    .in("goal_id", goalIds)
    .order("id");

  const msMap = new Map<string, MilestoneRow[]>();
  for (const m of milestones ?? []) {
    const ms = msMap.get(m.goal_id) ?? [];
    ms.push({ id: m.id, goal_id: m.goal_id, title: m.title, completed_at: m.completed_at });
    msMap.set(m.goal_id, ms);
  }

  return goals.map((g) => {
    const ms = msMap.get(g.id) ?? [];
    const prog = ms.length > 0
      ? Math.round((ms.filter((m) => m.completed_at).length / ms.length) * 100)
      : g.progress ?? 0;
    return {
      id: g.id,
      title: g.title,
      category: g.category,
      target_date: g.target_date,
      progress: prog,
      completed_at: g.completed_at,
      milestones: ms,
    };
  });
}

export async function createGoal(
  title: string,
  category: string,
  targetDate: string,
  milestones: string[],
): Promise<{ error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: goal, error } = await supabase
    .from("goals")
    .insert({ user_id: user.id, title, category: category || null, target_date: targetDate || null, progress: 0 })
    .select("id")
    .single();

  if (error || !goal) return { error: error?.message ?? "Failed to create goal" };

  const goalId = (goal as { id: string }).id;
  if (milestones.length > 0) {
    await supabase.from("goal_milestones").insert(milestones.map((t) => ({ goal_id: goalId, title: t })));
  }

  revalidatePath("/goals");
  return {};
}

export async function toggleMilestone(milestoneId: string, completed: boolean): Promise<void> {
  const supabase = await createServerClient();
  await supabase
    .from("goal_milestones")
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq("id", milestoneId);
  revalidatePath("/goals");
}

export async function completeGoal(goalId: string): Promise<void> {
  const supabase = await createServerClient();
  await supabase
    .from("goals")
    .update({ completed_at: new Date().toISOString(), progress: 100 })
    .eq("id", goalId);
  revalidatePath("/goals");
}

export async function deleteGoal(goalId: string): Promise<void> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("goals").delete().eq("id", goalId).eq("user_id", user.id);
  revalidatePath("/goals");
}
