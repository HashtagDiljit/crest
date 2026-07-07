import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getNutritionData } from "./actions";
import { getUserSupplements } from "./supplement-actions";
import { NutritionContent } from "./_components/NutritionContent";

export const dynamic = "force-dynamic";

export default async function NutritionPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [data, userSupplements] = await Promise.all([
    getNutritionData(),
    getUserSupplements(),
  ]);
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <NutritionContent
        todayMeals={data.todayMeals}
        weeklyTotals={data.weeklyTotals}
        supplementLogs={data.supplementLogs}
        settings={data.settings}
        today={today}
        userSupplements={userSupplements}
      />
    </div>
  );
}
