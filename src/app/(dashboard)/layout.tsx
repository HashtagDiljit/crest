import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ConsentGate } from "@/components/ConsentGate";
import { getConsent } from "@/app/(dashboard)/consent/actions";
import { CONSENT_VERSION } from "@/app/(dashboard)/consent/types";

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
    .select("username, level, xp, streak_current, theme, accent_colour, avatar_url, onboarding_completed")
    .eq("id", user!.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileData as any as {
    username: string | null;
    level: number;
    xp: number;
    streak_current: number;
    theme: string | null;
    accent_colour: string | null;
    avatar_url: string | null;
    onboarding_completed: boolean | null;
  } | null;

  if (profile && profile.onboarding_completed === false) {
    redirect("/onboarding");
  }

  const consent = await getConsent();
  const needsConsent = !consent || consent.consent_version !== CONSENT_VERSION;

  // Nav items hidden based on consent choices
  const hiddenNavIds: string[] = [];
  if (!consent?.mental_emotional) {
    hiddenNavIds.push("mood", "journal");
  }

  const rawName = profile?.username ?? user!.email?.split("@")[0] ?? "You";
  const username = rawName.charAt(0).toUpperCase() + rawName.slice(1);
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
      <ConsentGate needsConsent={needsConsent}>
        <div className="flex min-h-screen bg-bg-base">
          <Sidebar hiddenNavIds={hiddenNavIds} />
          {/* dashboard-main class in globals.css applies margin-left: var(--sidebar-w) at lg+ */}
          <div className="dashboard-main">
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
      </ConsentGate>
    </>
  );
}
