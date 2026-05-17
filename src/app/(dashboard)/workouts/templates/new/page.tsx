"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createTemplate } from "../../actions";
import { ExerciseSearch } from "./_components/ExerciseSearch";
import { ExerciseList } from "./_components/ExerciseList";
import type { ExerciseRow } from "../../actions";

export interface TemplateExerciseEntry {
  exerciseId: string;
  name: string;
  muscle: string | null;
  setsTarget: number;
  repsTarget: number;
}

const CATEGORIES = ["Strength", "Cardio", "Mobility", "Mixed"] as const;

export default function NewTemplatePage() {
  const [allExercises, setAllExercises] = useState<ExerciseRow[]>([]);
  const [added, setAdded] = useState<TemplateExerciseEntry[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Strength");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("exercises")
      .select("id, name, category, muscle_primary, equipment")
      .order("name")
      .then(({ data }) => setAllExercises((data ?? []) as ExerciseRow[]));
  }, []);

  function handleAdd(ex: ExerciseRow) {
    if (added.some((a) => a.exerciseId === ex.id)) return;
    setAdded((prev) => [...prev, {
      exerciseId: ex.id,
      name: ex.name,
      muscle: ex.muscle_primary,
      setsTarget: 3,
      repsTarget: 5,
    }]);
  }

  function handleRemove(idx: number) {
    setAdded((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleMove(idx: number, dir: -1 | 1) {
    setAdded((prev) => {
      const next = [...prev];
      const to = idx + dir;
      if (to < 0 || to >= next.length) return prev;
      [next[idx], next[to]] = [next[to], next[idx]];
      return next;
    });
  }

  function handleChange(idx: number, field: "setsTarget" | "repsTarget", val: number) {
    setAdded((prev) => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e));
  }

  async function handleSubmit() {
    if (!name.trim()) { setError("Template name is required"); return; }
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("category", category);
    fd.set("exercises", JSON.stringify(added.map((e) => ({
      exerciseId: e.exerciseId,
      setsTarget: e.setsTarget,
      repsTarget: e.repsTarget,
    }))));
    const result = await createTemplate(fd);
    if (result && "error" in result) { setError(result.error); setSaving(false); }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/workouts" className="flex items-center gap-1.5 text-text-muted hover:text-text-secondary text-13 transition-colors">
          <ArrowLeft size={15} />
          Workouts
        </Link>
      </div>

      <h1 className="font-display text-32 font-semibold text-text-primary tracking-tight">New template</h1>

      <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-5">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-10 text-text-muted tracking-widest uppercase">Template name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Upper Body Push"
            className="w-full bg-bg-inset border border-border rounded-r4 px-4 py-3 font-display text-20 font-semibold text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-10 text-text-muted tracking-widest uppercase">Category</label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-4 py-1.5 rounded-pill text-13 font-medium transition-colors ${
                  category === c ? "bg-accent text-white" : "bg-bg-elevated text-text-secondary hover:bg-bg-overlay"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise search */}
        <ExerciseSearch exercises={allExercises} addedIds={added.map((a) => a.exerciseId)} onAdd={handleAdd} />

        {/* Added exercises */}
        {added.length > 0 && (
          <ExerciseList
            exercises={added}
            onRemove={handleRemove}
            onMove={handleMove}
            onChange={handleChange}
          />
        )}

        {error && <p className="text-13 text-danger">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-3.5 rounded-r4 bg-accent hover:bg-accent-hover text-white font-semibold text-15 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save template"}
        </button>
      </div>
    </div>
  );
}
