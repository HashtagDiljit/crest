"use server";

import { createServerClient } from "@/lib/supabase/server";

export async function saveDashboardLayout(layout: {
  lg: Array<{ i: string; x: number; y: number; w: number; h: number }>;
  hidden: string[];
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = { dashboard_layout: layout } as any;
  await supabase.from("profiles").update(payload).eq("id", user.id);
}
