import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface InsightRaw {
  category: string;
  title: string;
  body: string;
  action_cta: string;
  action_type: string;
}

export async function POST() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db: AnySupabase = supabase;

  // Check if already generated today
  const today = new Date().toISOString().split("T")[0];
  const { data: recent } = await db.from("ai_insights")
    .select("id, generated_at")
    .eq("user_id", user.id)
    .gte("generated_at", `${today}T00:00:00.000Z`)
    .order("generated_at", { ascending: false })
    .limit(1);

  if (recent?.length) {
    return NextResponse.json({ cached: true, message: "Already generated today" }, { status: 429 });
  }

  // Gather last 30 days of data
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().split("T")[0];

  const [workoutsRes, sleepRes, moodRes, habitRes, metricsRes, measureRes] = await Promise.all([
    supabase.from("workout_sessions").select("started_at, ended_at, xp_earned").eq("user_id", user.id).gte("started_at", sinceStr).not("ended_at", "is", null),
    supabase.from("sleep_logs").select("logged_date, duration_hrs, quality_score").eq("user_id", user.id).gte("logged_date", sinceStr).order("logged_date"),
    supabase.from("mood_logs").select("logged_date, score, note").eq("user_id", user.id).gte("logged_date", sinceStr).order("logged_date"),
    supabase.from("habit_logs").select("logged_date, completed").eq("user_id", user.id).gte("logged_date", sinceStr),
    supabase.from("health_metrics").select("logged_date, metric_type, value").eq("user_id", user.id).gte("logged_date", sinceStr),
    supabase.from("body_measurements").select("logged_date, weight_kg, steps").eq("user_id", user.id).gte("logged_date", sinceStr),
  ]);

  const workouts = workoutsRes.data ?? [];
  const sleep = sleepRes.data ?? [];
  const mood = moodRes.data ?? [];
  const habits = habitRes.data ?? [];
  const metrics = metricsRes.data ?? [];
  const measurements = measureRes.data ?? [];

  // Summarise sleep
  const avgSleep = sleep.length
    ? (sleep.reduce((s, r) => s + (Number(r.duration_hrs) || 0), 0) / sleep.length).toFixed(1)
    : null;
  const avgQuality = sleep.filter((s) => s.quality_score).length
    ? (sleep.reduce((s, r) => s + (r.quality_score ?? 0), 0) / sleep.filter((s) => s.quality_score).length).toFixed(1)
    : null;

  // Summarise mood
  const avgMood = mood.length
    ? (mood.reduce((s, r) => s + (r.score ?? 0), 0) / mood.length).toFixed(1)
    : null;

  // Summarise habits
  const completedHabits = (habits as Array<{ completed: boolean }>).filter((h) => h.completed).length;
  const totalHabits = (habits as Array<{ completed: boolean }>).length;
  const habitRate = totalHabits > 0 ? ((completedHabits / totalHabits) * 100).toFixed(0) : null;

  // Steps
  const stepData = metrics.filter((m) => m.metric_type === "steps");
  const avgSteps = stepData.length
    ? Math.round(stepData.reduce((s, r) => s + (r.value ?? 0), 0) / stepData.length)
    : null;

  // Weight trend
  const weightData = measurements.filter((m) => m.weight_kg).sort((a, b) => a.logged_date.localeCompare(b.logged_date));
  const weightTrend = weightData.length >= 2
    ? (Number(weightData[weightData.length - 1].weight_kg) - Number(weightData[0].weight_kg)).toFixed(1)
    : null;

  if (workouts.length === 0 && sleep.length === 0 && mood.length === 0) {
    return NextResponse.json({ error: "Not enough data" }, { status: 422 });
  }

  const dataSummary = [
    `Period: last 30 days`,
    `Workouts completed: ${workouts.length}`,
    avgSleep ? `Average sleep duration: ${avgSleep} hours/night across ${sleep.length} logged nights` : "No sleep data",
    avgQuality ? `Average sleep quality score: ${avgQuality}/5` : null,
    avgMood ? `Average mood score: ${avgMood}/10 across ${mood.length} days logged` : "No mood data",
    habitRate ? `Habit completion rate: ${habitRate}% (${completedHabits}/${totalHabits} logged entries)` : "No habit data",
    avgSteps ? `Average daily step count: ${avgSteps.toLocaleString()} steps` : null,
    weightTrend !== null ? `Body weight change over period: ${Number(weightTrend) > 0 ? "+" : ""}${weightTrend}kg` : null,
  ].filter(Boolean).join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: `You are a personal health and performance coach analysing a user's logged data. Generate 3-5 specific, evidence-based insights. Each insight must reference actual numbers from the data. Be direct and actionable. Format as a JSON array (no markdown, raw JSON only) with fields: category (sleep/workout/habit/nutrition/recovery), title (max 8 words), body (2-3 sentences with specific data references), action_cta (short action label max 4 words), action_type (navigate_to/add_habit/dismiss).`,
    messages: [{ role: "user", content: `Here is my health data summary:\n\n${dataSummary}\n\nGenerate personalised insights.` }],
  });

  const rawText = message.content[0].type === "text" ? message.content[0].text : "";

  let insights: InsightRaw[] = [];
  try {
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    insights = JSON.parse(jsonMatch?.[0] ?? "[]");
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  // Save to DB
  const toInsert = insights.map((ins) => ({
    user_id: user.id,
    category: ins.category ?? "general",
    title: ins.title ?? "Insight",
    body: ins.body ?? "",
    action_cta: ins.action_cta ?? null,
    action_type: ins.action_type ?? "dismiss",
    data_source: "last_30_days",
    generated_at: new Date().toISOString(),
  }));

  const { data: saved, error: dbError } = await db.from("ai_insights").insert(toInsert).select();
  if (dbError) return NextResponse.json({ error: "DB insert failed" }, { status: 500 });

  return NextResponse.json({ insights: saved });
}

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db2: AnySupabase = supabase;

  const { data } = await db2.from("ai_insights").select("*").eq("user_id", user.id).is("dismissed_at", null).order("generated_at", { ascending: false });
  const { data: dismissed } = await db2.from("ai_insights").select("*").eq("user_id", user.id).not("dismissed_at", "is", null).order("dismissed_at", { ascending: false }).limit(10);

  const today = new Date().toISOString().split("T")[0];
  const { data: todayInsights } = await db2.from("ai_insights").select("generated_at").eq("user_id", user.id).gte("generated_at", `${today}T00:00:00.000Z`).limit(1);

  const lastGenerated = (todayInsights as Array<{ generated_at: string }> | null)?.[0]?.generated_at ?? null;

  return NextResponse.json({ insights: data ?? [], dismissed: dismissed ?? [], lastGenerated });
}

export async function PATCH(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json() as { id: string };
  const db3: AnySupabase = supabase;
  await db3.from("ai_insights").update({ dismissed_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
