import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getMoodLogs, getMoodCorrelation } from "./actions";
import { MoodCard } from "./_components/MoodCard";
import { MoodCalendar } from "./_components/MoodCalendar";
import { FactorBars } from "./_components/FactorBars";

export default async function MoodPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [logs, correlation] = await Promise.all([getMoodLogs(35), getMoodCorrelation()]);

  const today = new Date().toISOString().split("T")[0];
  const todayLog = logs.find((l) => l.logged_date === today) ?? null;

  const thirtyDayLogs = logs.filter((l) => l.score !== null).slice(0, 30);
  const thirtyDayAvg =
    thirtyDayLogs.length > 0
      ? thirtyDayLogs.reduce((sum, l) => sum + (l.score ?? 0), 0) / thirtyDayLogs.length
      : null;

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="font-display text-32 font-semibold text-text-primary tracking-tight">Mood</h1>
        <p className="text-13 text-text-secondary mt-0.5">Track how you feel and discover what helps.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="flex flex-col gap-6">
          <MoodCard todayLog={todayLog} thirtyDayAvg={thirtyDayAvg} />
          <MoodCalendar logs={logs} />
        </div>
        <div className="flex flex-col gap-6">
          <FactorBars correlation={correlation} />
        </div>
      </div>
    </div>
  );
}
