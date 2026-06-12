"use client";

import { useEffect, useRef, useState } from "react";
import { Dumbbell, Play, Pencil, MoreHorizontal, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { startSession, deleteTemplate } from "../actions";
import type { TemplateRow } from "../actions";

function estimateDuration(template: TemplateRow): number {
  if (!template.exercises.length) return 0;
  return template.exercises.reduce((total, te) => {
    const sets = te.sets_target ?? 3;
    return total + Math.round((sets * (120 + 45)) / 60);
  }, 0);
}

interface Props {
  template: TemplateRow;
}

export function TemplateCard({ template }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const exerciseNames = template.exercises.map((te) => te.exercise.name).filter(Boolean);
  const shown = exerciseNames.slice(0, 3);
  const remaining = exerciseNames.length - shown.length;
  const duration = estimateDuration(template);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  async function handleStart() {
    await startSession(template.id);
  }

  async function handleDelete() {
    setDeleting(true);
    await deleteTemplate(template.id);
    setDeleting(false);
    setConfirmDelete(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 rounded-r4 border border-border bg-bg-inset p-4 hover:border-border-strong transition-colors cursor-default group">
      <div className="flex items-start justify-between">
        <div
          className="w-9 h-9 rounded-r3 flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-strong)" }}
        >
          <Dumbbell size={17} className="text-accent" strokeWidth={1.75} />
        </div>
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-r2 text-text-disabled hover:text-text-secondary hover:bg-bg-elevated transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Template options"
          >
            <MoreHorizontal size={15} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 w-40 rounded-r4 border border-border bg-bg-elevated shadow-2xl z-30">
              <button
                onClick={() => { setMenuOpen(false); router.push(`/workouts/templates/${template.id}/edit`); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-13 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded-t-r4 transition-colors"
              >
                <Pencil size={13} />
                Edit template
              </button>
              <button
                onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-13 text-danger hover:bg-bg-overlay rounded-b-r4 transition-colors"
              >
                <Trash2 size={13} />
                Delete template
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="font-display text-[14px] font-semibold text-text-primary leading-tight">
          {template.name}
        </p>
        <p className="font-mono text-11 text-text-muted mt-1">
          {template.exercises.length} exercises · ~{duration} min
        </p>
      </div>

      {shown.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {shown.map((name) => (
            <span key={name} className="text-11 px-2 py-0.5 rounded-pill bg-bg-surface border border-border text-text-secondary">
              {name}
            </span>
          ))}
          {remaining > 0 && (
            <span className="text-11 px-2 py-0.5 rounded-pill bg-bg-surface border border-border text-text-muted">
              +{remaining}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="font-mono text-11 text-text-muted">last · never</span>
        <button
          type="button"
          onClick={handleStart}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-accent hover:bg-accent-hover text-white text-11 font-semibold transition-colors"
          style={{ boxShadow: "0 0 0 1px var(--color-accent-ring), 0 4px 14px rgba(108,99,255,0.2)" }}
        >
          <Play size={10} fill="white" />
          Start
        </button>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-r5 border border-border bg-bg-surface p-6 flex flex-col gap-5">
            <div>
              <p className="font-display text-16 font-semibold text-text-primary">Delete {template.name}?</p>
              <p className="text-13 text-text-secondary mt-2 leading-relaxed">This cannot be undone.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 py-2 rounded-r3 border border-border text-13 text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 rounded-r3 bg-danger text-white text-13 font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
