import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { ThemeProvider } from "@/components/ThemeProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("username, level, xp, streak_current, theme, accent_colour, avatar_url")
    .eq("id", user!.id)
    .single();

  const profile = profileData as {
    username: string | null;
    level: number;
    xp: number;
    streak_current: number;
    theme: string | null;
    accent_colour: string | null;
    avatar_url: string | null;
  } | null;

  const username = profile?.username ?? user!.email?.split("@")[0] ?? "You";
  const parts = username.trim().split(/\s+/);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : username.slice(0, 2).toUpperCase();
  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const streak = profile?.streak_current ?? 0;
  const xpNeeded = level * 500;

  return (
    <>
      <ThemeProvider theme={profile?.theme ?? null} accent={profile?.accent_colour ?? null} />
      <div className="flex h-screen overflow-hidden bg-bg-base">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 lg:ml-sidebar overflow-hidden">
          <TopBar
            level={level}
            xp={xp}
            xpNeeded={xpNeeded}
            streak={streak}
            username={username}
            initials={initials}
            avatarUrl={profile?.avatar_url ?? null}
          />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-[1200px] w-full mx-auto px-4 md:px-6 py-4 md:py-7 pb-[80px] lg:pb-14">
              {children}
            </div>
          </main>
        </div>
      </div>
      <BottomTabBar />
    </>
  );
}
