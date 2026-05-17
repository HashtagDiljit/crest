"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import type { ExerciseRow } from "../../../actions";

interface Props {
  exercises: ExerciseRow[];
  addedIds: string[];
  onAdd: (ex: ExerciseRow) => void;
}

export function ExerciseSearch({ exercises, addedIds, onAdd }: Props) {
  const [query, setQuery] = useState("");

  const filtered = query.trim().length < 1
    ? []
    : exercises.filter(
        (e) =>
          !addedIds.includes(e.id) &&
          e.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);

  return (
    <div className="flex flex-col gap-2">
      <label className="font-mono text-10 text-text-muted tracking-widest uppercase">Add exercises</label>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises…"
          className="w-full bg-bg-inset border border-border rounded-r4 pl-9 pr-4 py-2.5 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
        />
      </div>

      {filtered.length > 0 && (
        <div className="rounded-r4 border border-border bg-bg-inset divide-y divide-border overflow-hidden">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => { onAdd(ex); setQuery(""); }}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-bg-elevated transition-colors text-left"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-13 font-medium text-text-primary truncate">{ex.name}</span>
                <span className="text-11 text-text-muted">
                  {ex.muscle_primary ?? "—"} · {ex.equipment ?? "—"}
                </span>
              </div>
              <Plus size={14} className="text-accent flex-shrink-0 ml-2" />
            </button>
          ))}
        </div>
      )}

      {query.trim().length >= 1 && filtered.length === 0 && (
        <p className="text-12 text-text-muted px-1">No exercises found matching &quot;{query}&quot;</p>
      )}
    </div>
  );
}
