import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { resolveDisplayName } from "@/lib/displayName";
import { OnboardingFlow } from "./_components/OnboardingFlow";

export default async function OnboardingPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileQuery = supabase
    .from("profiles")
    .select("username, onboarding_completed")
    .eq("id", user.id)
    .single() as unknown as Promise<{ data: { username: string | null; onboarding_completed: boolean | null } | null }>;
  const { data: profile } = await profileQuery;

  if (profile?.onboarding_completed) redirect("/dashboard");

  const metadataName = (user.user_metadata?.name ?? user.user_metadata?.full_name) as string | undefined;
  const displayName = resolveDisplayName(profile?.username, user.email, metadataName);
  const firstName = displayName.split(/\s+/)[0];

  return <OnboardingFlow firstName={firstName} />;
}
