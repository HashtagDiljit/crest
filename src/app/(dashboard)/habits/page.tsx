import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getHabits, getAllHabitLogs } from "./actions";
import { HabitsContent } from "./_components/HabitsContent";
import type { LayoutItem } from "./_components/HabitsContent";

export default async function HabitsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [habits, allLogs, profileRes] = await Promise.all([
    getHabits(),
    getAllHabitLogs(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.from("profiles").select("username, habits_layout").eq("id", user.id).single() as any,
  ]);

  const rawName: string = profileRes.data?.username ?? user.email?.split("@")[0] ?? "you";
  const username = rawName.trim().split(/\s+/)[0];

  const rawLayout = profileRes.data?.habits_layout;
  const habitsLayout =
    rawLayout && typeof rawLayout === "object" && Array.isArray((rawLayout as { lg?: unknown }).lg)
      ? (rawLayout as { lg: LayoutItem[] })
      : null;

  return (
    <HabitsContent
      habits={habits}
      allLogs={allLogs}
      username={username}
      habitsLayout={habitsLayout}
    />
  );
}
