"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateTemplate } from "../../../actions";
import { ExerciseSearch } from "../../new/_components/ExerciseSearch";
import { ExerciseList } from "../../new/_components/ExerciseList";
import type { ExerciseRow } from "../../../actions";
import type { TemplateExerciseEntry } from "../../new/page";

const CATEGORIES = ["Strength", "Cardio", "Mobility", "Mixed"] as const;

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [allExercises, setAllExercises] = useState<ExerciseRow[]>([]);
  const [added, setAdded] = useState<TemplateExerciseEntry[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Strength");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase.from("exercises").select("id, name, category, muscle_primary, equipment").order("name"),
      supabase
        .from("workout_templates")
        .select("id, name, category")
        .eq("id", templateId)
        .single(),
      supabase
        .from("template_exercises")
        .select("exercise_id, sets_target, reps_target, order_index, exercises(id, name, muscle_primary)")
        .eq("template_id", templateId)
        .order("order_index"),
    ]).then(([{ data: exData }, { data: tmplData }, { data: teData }]) => {
      setAllExercises((exData ?? []) as ExerciseRow[]);
      if (tmplData) {
        const t = tmplData as { name: string; category: string | null };
        setName(t.name);
        setCategory(t.category ?? "Strength");
      }
      if (teData) {
        setAdded(
          (teData as Array<{
            exercise_id: string;
            sets_target: number | null;
            reps_target: number | null;
            order_index: number;
            exercises: { id: string; name: string; muscle_primary: string | null } | null;
          }>).map((te) => ({
            exerciseId: te.exercise_id,
            name: te.exercises?.name ?? "Unknown",
            muscle: te.exercises?.muscle_primary ?? null,
            setsTarget: te.sets_target ?? 3,
            repsTarget: te.reps_target ?? 5,
          }))
        );
      }
      setLoading(false);
    });
  }, [templateId]);

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
    const result = await updateTemplate(templateId, fd);
    if (result && "error" in result) {
      setError(result.error);
      setSaving(false);
    } else {
      router.push("/workouts");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted text-13">Loading…</div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/workouts" className="flex items-center gap-1.5 text-text-muted hover:text-text-secondary text-13 transition-colors">
          <ArrowLeft size={15} />
          Workouts
        </Link>
      </div>

      <h1 className="font-display text-24 md:text-32 font-semibold text-text-primary tracking-tight">Edit template</h1>

      <div className="rounded-r5 border border-border bg-bg-surface p-5 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-10 text-text-muted tracking-widest uppercase">Template name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Upper Body Push"
            className="w-full bg-bg-inset border border-border rounded-r4 px-4 py-3 font-display text-20 font-semibold text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
          />
        </div>

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

        <ExerciseSearch exercises={allExercises} addedIds={added.map((a) => a.exerciseId)} onAdd={handleAdd} />

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
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
