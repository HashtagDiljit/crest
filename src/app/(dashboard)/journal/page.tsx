import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getJournalEntries } from "./actions";
import { JournalEditor } from "./_components/JournalEditor";
import { PastEntries } from "./_components/PastEntries";

export default async function JournalPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const entries = await getJournalEntries();
  const today = new Date().toISOString().split("T")[0];
  const isSunday = new Date().getDay() === 0;
  const todayEntry = entries.find((e) => e.logged_date === today) ?? null;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="font-display text-32 font-semibold text-text-primary tracking-tight">Journal</h1>
        <p className="text-13 text-text-secondary mt-0.5">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <JournalEditor date={today} existing={todayEntry} isSunday={isSunday} />

      {entries.filter((e) => e.logged_date !== today).length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-18 font-semibold text-text-primary">Past entries</h2>
          <PastEntries entries={entries} todayDate={today} />
        </div>
      )}
    </div>
  );
}
