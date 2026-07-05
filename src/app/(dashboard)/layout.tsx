import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { resolveDisplayName } from "@/lib/displayName";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ConsentGate } from "@/components/ConsentGate";
import { getConsent } from "@/app/(dashboard)/consent/actions";
import { CONSENT_VERSION } from "@/app/(dashboard)/consent/types";
import { OfflineSync } from "@/components/OfflineSync";
import { InstallPrompt } from "@/components/InstallPrompt";
import { MotionProvider } from "@/components/MotionProvider";
import { PageTransition } from "@/components/PageTransition";

export const dynamic = "force-dynamic";

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
    .select("username, level, xp, streak_current, theme, accent_colour, avatar_url, onboarding_completed, hidden_nav_items, reduce_motion, bottom_nav_items")
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
    hidden_nav_items: string[] | null;
    reduce_motion: boolean | null;
    bottom_nav_items: string[] | null;
  } | null;

  if (profile && profile.onboarding_completed === false) {
    redirect("/onboarding");
  }

  const consent = await getConsent();
  const needsConsent = !consent || consent.consent_version !== CONSENT_VERSION;

  // Nav items hidden based on consent choices and user preference
  const hiddenNavIds: string[] = [...(profile?.hidden_nav_items ?? [])];
  if (!consent?.mental_emotional) {
    hiddenNavIds.push("mood", "journal");
  }

  const metadataName = (user!.user_metadata?.name ?? user!.user_metadata?.full_name) as string | undefined;
  const username = resolveDisplayName(profile?.username, user!.email, metadataName);
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
      <OfflineSync />
      <MotionProvider forceReduced={profile?.reduce_motion ?? false}>
        <ConsentGate needsConsent={needsConsent}>
          <div className="flex min-h-screen bg-bg-base">
            <Sidebar hiddenNavIds={hiddenNavIds} />
            {/* dashboard-main class in globals.css applies margin-left: var(--sidebar-w) at md+ */}
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
              <main>
                <div className="max-w-[1200px] w-full mx-auto px-4 md:px-6 pb-[80px] lg:pb-14" style={{ paddingTop: "var(--topbar-h, 60px)" }}>
                  <PageTransition>{children}</PageTransition>
                </div>
              </main>
            </div>
          </div>
          <BottomTabBar
            hiddenNavIds={hiddenNavIds}
            bottomNavItems={profile?.bottom_nav_items ?? ["workouts", "health", "habits", "more"]}
          />
          <InstallPrompt />
        </ConsentGate>
      </MotionProvider>
    </>
  );
}
