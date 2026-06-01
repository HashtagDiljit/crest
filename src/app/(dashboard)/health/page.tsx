import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getHealthData } from "./actions";
import { DailyOverviewCard } from "./_components/DailyOverviewCard";
import { RecoveryPanel } from "./_components/RecoveryPanel";
import { SleepPanel } from "./_components/SleepPanel";
import { BodyMetricsPanel } from "./_components/BodyMetricsPanel";

export default async function HealthPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [data, profileRes] = await Promise.all([
    getHealthData(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.from("profiles").select("height_cm, date_of_birth, gender").eq("id", user.id).single() as any,
  ]);

  const profileStats = profileRes.data as {
    height_cm: number | null;
    date_of_birth: string | null;
    gender: string | null;
  } | null;

  const today = new Date().toISOString().split("T")[0];

  const todaySleep = data.sleepLogs.find((l) => l.logged_date === today) ?? null;
  const todayReadiness = data.readinessLogs.find((l) => l.logged_date === today) ?? null;
  const todayMeasurement = data.measurements.find((m) => m.logged_date === today) ?? null;

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="font-display text-24 md:text-32 font-semibold text-text-primary tracking-tight">Health</h1>
        <p className="text-13 text-text-secondary mt-0.5">Sleep, recovery, and body composition all in one place.</p>
      </div>

      <DailyOverviewCard
        todaySleep={todaySleep}
        todayReadiness={todayReadiness}
        todayMeasurement={todayMeasurement}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecoveryPanel
          readinessLogs={data.readinessLogs}
          hrvMetrics={data.hrvMetrics}
          hrMetrics={data.hrMetrics}
          todaySoreness={data.todaySoreness}
        />
        <SleepPanel sleepLogs={data.sleepLogs} />
      </div>

      <BodyMetricsPanel measurements={data.measurements} profile={profileStats} />
    </div>
  );
}
