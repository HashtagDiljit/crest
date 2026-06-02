import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getHabits, getAllHabitLogs } from "./actions";
import { HabitList } from "./_components/HabitList";
import { StreaksPanel } from "./_components/StreaksPanel";
import { StreakGrid } from "./_components/StreakGrid";

export default async function HabitsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [habits, allLogs, profileRes] = await Promise.all([
    getHabits(),
    getAllHabitLogs(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.from("profiles").select("username").eq("id", user.id).single() as any,
  ]);

  const rawName: string = profileRes.data?.username ?? user.email?.split("@")[0] ?? "you";
  const username = rawName.trim().split(/\s+/)[0];

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="font-display text-24 md:text-32 font-semibold text-text-primary tracking-tight">Habits</h1>
        <p className="text-13 text-text-secondary mt-0.5">These aren&apos;t tasks — they&apos;re practices that define who you&apos;re becoming.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <HabitList habits={habits} username={username} />
        <StreaksPanel habits={habits} allLogs={allLogs} />
      </div>

      <StreakGrid habits={habits} allLogs={allLogs} />
    </div>
  );
}
