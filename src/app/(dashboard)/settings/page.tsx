import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getProfilePrefs } from "./actions";
import { getNutritionSettings } from "@/app/(dashboard)/nutrition/actions";
import { AccountSection } from "./_components/AccountSection";
import { AppearanceSection } from "./_components/AppearanceSection";
import { UnitsSection } from "./_components/UnitsSection";
import { NotificationsSection } from "./_components/NotificationsSection";
import { DataPrivacySection } from "./_components/DataPrivacySection";
import { NutritionSection } from "./_components/NutritionSection";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [prefs, nutritionSettings] = await Promise.all([
    getProfilePrefs(),
    getNutritionSettings(),
  ]);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="font-display text-24 md:text-32 font-semibold text-text-primary tracking-tight">Settings</h1>
        <p className="text-13 text-text-secondary mt-0.5">Manage your account and preferences</p>
      </div>

      <Section id="account" title="Account">
        <AccountSection prefs={prefs ?? { username: null, theme: null, accent_colour: null, weight_unit: null, distance_unit: null, time_format: null, week_starts: null, avatar_url: null, notification_preferences: null }} email={user.email ?? ""} />
      </Section>

      <Section id="appearance" title="Appearance">
        <AppearanceSection theme={prefs?.theme ?? null} accentColour={prefs?.accent_colour ?? null} />
      </Section>

      <Section id="units" title="Units & Preferences">
        <UnitsSection prefs={{ weight_unit: prefs?.weight_unit ?? null, distance_unit: prefs?.distance_unit ?? null, time_format: prefs?.time_format ?? null, week_starts: prefs?.week_starts ?? null }} />
      </Section>

      <Section id="notifications" title="Notifications">
        <NotificationsSection prefs={prefs?.notification_preferences as Record<string, boolean> | null} />
      </Section>

      <Section id="nutrition" title="Nutrition">
        <NutritionSection settings={nutritionSettings} />
      </Section>

      <Section id="data" title="Data & Privacy">
        <DataPrivacySection />
      </Section>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="rounded-r5 border border-border bg-bg-surface p-6 flex flex-col gap-5">
      <p className="text-16 font-semibold text-text-primary border-b border-border pb-4">{title}</p>
      {children}
    </div>
  );
}
