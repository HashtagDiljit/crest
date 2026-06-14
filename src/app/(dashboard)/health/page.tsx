import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getHealthData } from "./actions";
import { HealthContent, type LayoutItem } from "./_components/HealthContent";

export default async function HealthPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [data, profileRes] = await Promise.all([
    getHealthData(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.from("profiles").select("height_cm, date_of_birth, gender, health_layout").eq("id", user.id).single() as any,
  ]);

  const profile = profileRes.data as {
    height_cm: number | null;
    date_of_birth: string | null;
    gender: string | null;
    health_layout: unknown;
  } | null;

  const profileStats = profile
    ? { height_cm: profile.height_cm, date_of_birth: profile.date_of_birth, gender: profile.gender }
    : null;

  const today = new Date().toISOString().split("T")[0];

  const todaySleep = data.sleepLogs.find((l) => l.logged_date === today) ?? null;
  const todayReadiness = data.readinessLogs.find((l) => l.logged_date === today) ?? null;
  const todayMeasurement = data.measurements.find((m) => m.logged_date === today) ?? null;
  const latestHr = data.hrMetrics[0] ?? null;

  const rawLayout = profile?.health_layout;
  const healthLayout =
    rawLayout && typeof rawLayout === "object" && Array.isArray((rawLayout as { lg?: unknown }).lg)
      ? (rawLayout as { lg: LayoutItem[]; hidden: string[] })
      : null;

  return (
    <HealthContent
      healthLayout={healthLayout}
      todaySleep={todaySleep}
      todayReadiness={todayReadiness}
      todayMeasurement={todayMeasurement}
      latestHr={latestHr}
      sleepLogs={data.sleepLogs}
      readinessLogs={data.readinessLogs}
      hrvMetrics={data.hrvMetrics}
      hrMetrics={data.hrMetrics}
      todaySoreness={data.todaySoreness}
      measurements={data.measurements}
      profileStats={profileStats}
      bpMetrics={data.bpMetrics}
      gripMetrics={data.gripMetrics}
      tempMetrics={data.tempMetrics}
      respMetrics={data.respMetrics}
      gutMetrics={data.gutMetrics}
    />
  );
}
