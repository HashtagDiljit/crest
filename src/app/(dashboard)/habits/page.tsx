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

  const [habits, allLogs] = await Promise.all([getHabits(), getAllHabitLogs()]);

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="font-display text-32 font-semibold text-text-primary tracking-tight">Habits</h1>
        <p className="text-13 text-text-secondary mt-0.5">Build consistency, one day at a time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <HabitList habits={habits} />
        <StreaksPanel habits={habits} allLogs={allLogs} />
      </div>

      <StreakGrid habits={habits} allLogs={allLogs} />
    </div>
  );
}
