"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { upsertJournalEntry } from "../actions";
import type { JournalEntry } from "../actions";

const WEEKLY_TEMPLATE = `Training this week:

Nutrition consistency:

Recovery quality:

One thing to improve:
`;

interface Props {
  date: string;
  existing: JournalEntry | null;
  isSunday: boolean;
}

export function JournalEditor({ date, existing, isSunday }: Props) {
  const [body, setBody] = useState(existing?.body ?? "");
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(existing ? new Date() : null);
  const [showWeekly, setShowWeekly] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async (text: string, t: string[]) => {
    setSaveState("saving");
    await upsertJournalEntry(date, text, t);
    setSaveState("saved");
    setLastSaved(new Date());
    setTimeout(() => setSaveState("idle"), 2000);
  }, [date]);

  useEffect(() => {
    if (!body) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaveState("idle");
    timerRef.current = setTimeout(() => save(body, tags), 2000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, tags]);

  function applyWeeklyTemplate() {
    setBody(WEEKLY_TEMPLATE);
    setShowWeekly(false);
  }

  function addTag() {
    const t = tagInput.trim().replace(/^#/, "");
    if (!t || tags.includes(t)) return;
    const next = [...tags, t];
    setTags(next);
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  return (
    <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-15 font-semibold text-text-primary">Today&apos;s entry</h2>
          <p className="text-12 text-text-muted">{date}</p>
        </div>
        <div className="flex items-center gap-2">
          {isSunday && !showWeekly && (
            <button onClick={() => setShowWeekly(true)} className="text-11 px-2.5 py-1 rounded-r3 border border-[var(--color-accent-ring)] bg-[var(--color-accent-soft)] text-accent hover:text-accent-hover transition-colors">
              Weekly review
            </button>
          )}
          <span className={`text-11 font-mono transition-colors ${saveState === "saving" ? "text-text-muted" : saveState === "saved" ? "text-success" : "text-text-disabled"}`}>
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : lastSaved ? `Last saved ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Auto-saves"}
          </span>
        </div>
      </div>

      {showWeekly && (
        <div className="rounded-r4 border border-border bg-bg-elevated p-3 flex items-start justify-between gap-3">
          <p className="text-12 text-text-secondary">Use the weekly review template?</p>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={applyWeeklyTemplate} className="text-11 text-accent hover:text-accent-hover transition-colors">Apply</button>
            <button onClick={() => setShowWeekly(false)} className="text-11 text-text-muted hover:text-text-secondary transition-colors">Dismiss</button>
          </div>
        </div>
      )}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write about your day…"
        rows={10}
        className="w-full rounded-r4 border border-border bg-bg-base px-4 py-3 text-14 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors resize-none leading-relaxed"
      />

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 text-12 px-2.5 py-0.5 rounded-pill bg-[var(--color-accent-soft)] border border-[var(--color-accent-ring)] text-accent">
            #{t}
            <button onClick={() => removeTag(t)} className="text-accent hover:text-danger transition-colors leading-none">×</button>
          </span>
        ))}
        <div className="flex items-center gap-1">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
            placeholder="Add tag…"
            className="w-20 text-12 px-2 py-0.5 rounded-r3 border border-border bg-bg-elevated text-text-secondary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
          />
          <button onClick={addTag} className="text-11 text-text-muted hover:text-accent transition-colors">+</button>
        </div>
      </div>
    </div>
  );
}
