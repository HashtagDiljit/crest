"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ExerciseRow } from "../../actions";

interface Props {
  onAdd: (exercise: ExerciseRow, setsTarget: number, repsTarget: number) => void;
  onClose?: () => void;
  compact?: boolean;
}

export function AdHocExercisePicker({ onAdd, onClose, compact = false }: Props) {
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("exercises").select("id, name, category, muscle_primary, equipment").order("name").then(({ data }) => {
      setExercises((data ?? []) as ExerciseRow[]);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return exercises.slice(0, 20);
    const q = query.toLowerCase();
    return exercises.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 20);
  }, [exercises, query]);

  return (
    <div className={`rounded-r4 border border-border bg-bg-surface flex flex-col gap-0 overflow-hidden ${compact ? "" : "max-h-80"}`}>
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <Search size={13} className="text-text-muted flex-shrink-0" />
        <input
          type="text"
          placeholder="Search exercises…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="flex-1 bg-transparent text-13 text-text-primary placeholder:text-text-disabled outline-none"
        />
        {onClose && (
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={14} />
          </button>
        )}
      </div>
      <div className="overflow-y-auto flex-1">
        {loading && <p className="text-12 text-text-muted p-3">Loading…</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-12 text-text-muted p-3">No exercises found.</p>
        )}
        {filtered.map((ex) => (
          <button
            key={ex.id}
            onClick={() => onAdd(ex, 3, 10)}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg-elevated transition-colors text-left border-b border-border last:border-0"
          >
            <Plus size={13} className="text-text-muted flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-13 font-medium text-text-primary truncate">{ex.name}</p>
              <p className="font-mono text-10 text-text-muted capitalize">
                {ex.muscle_primary?.replace(/_/g, " ") ?? "—"} · {ex.equipment ?? "—"}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
