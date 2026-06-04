// Weekly digest Edge Function — scaffold only.
//
// This function is called on a schedule (e.g. every Monday at 08:00 UTC via
// Supabase Cron). It currently logs the trigger event so the plumbing can be
// verified before an email provider is wired up.
//
// To add email sending:
// 1. Choose a provider (Resend, Postmark, SendGrid, etc.)
// 2. Add the API key to Supabase Edge Function secrets:
//    supabase secrets set RESEND_API_KEY=re_...
// 3. Replace the console.log below with a fetch() to the provider's send API.
//
// Deploy: supabase functions deploy weekly-digest
// Schedule: add a pg_cron job in Supabase SQL editor:
//   SELECT cron.schedule('weekly-digest', '0 8 * * 1',
//     $$SELECT net.http_post(
//       url  := 'https://<project-ref>.supabase.co/functions/v1/weekly-digest',
//       headers := '{"Authorization":"Bearer <anon-key>"}'::jsonb
//     )$$);

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch all users who have completed onboarding
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("onboarding_completed", true);

    if (error) throw error;

    for (const profile of profiles ?? []) {
      // Placeholder — replace with actual email dispatch once provider chosen
      console.log(`weekly digest triggered for user ${profile.id} (${profile.username ?? "unknown"})`);
    }

    return new Response(
      JSON.stringify({ ok: true, triggered: profiles?.length ?? 0 }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("weekly-digest error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
