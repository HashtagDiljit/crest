import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getAchievementsData } from "./actions";
import { AchievementGrid } from "./_components/AchievementGrid";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Auth error in trophy room:", authError);
    redirect("/login");
  }

  console.log("User ID for achievements:", user.id);
  const achievements = await getAchievementsData();
  console.log("Achievements count:", achievements.length);
  const earned = achievements.filter((a) => a.unlocked_at).length;

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="font-display text-24 md:text-32 font-semibold text-text-primary tracking-tight">Trophy room</h1>
        <p className="text-13 text-text-secondary mt-0.5">
          {earned} of {achievements.length} achievements unlocked
        </p>
      </div>
      <AchievementGrid achievements={achievements} />
    </div>
  );
}
