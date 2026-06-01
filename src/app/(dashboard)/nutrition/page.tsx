import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getNutritionData } from "./actions";
import { NutritionContent } from "./_components/NutritionContent";

export const dynamic = "force-dynamic";

export default async function NutritionPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getNutritionData();
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="font-display text-24 md:text-32 font-semibold text-text-primary tracking-tight">Nutrition</h1>
        <p className="text-13 text-text-secondary mt-0.5">Protein tracking and supplement logging, under 60 seconds a day.</p>
      </div>

      <NutritionContent
        todayMeals={data.todayMeals}
        weeklyTotals={data.weeklyTotals}
        supplementLogs={data.supplementLogs}
        settings={data.settings}
        today={today}
      />
    </div>
  );
}
