"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, X, Search } from "lucide-react";
import { TemplateCard } from "./TemplateCard";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import type { TemplateRow } from "../actions";

interface Props {
  templates: TemplateRow[];
}

// Names of templates that are auto-seeded for new users (see
// DEFAULT_TEMPLATES in ../actions.ts). Used purely for display grouping —
// once a user edits/renames one it'll naturally fall under "My templates".
const DEFAULT_TEMPLATE_NAMES = new Set([
  "Upper A — Push",
  "Lower A — Quad",
  "Upper B — Pull",
  "Lower B — Posterior",
]);

function NewTemplateCard() {
  return (
    <Link
      href="/workouts/templates/new"
      className="flex flex-col items-center justify-center gap-2 rounded-r5 border-2 border-dashed border-border hover:border-border-strong bg-bg-inset hover:bg-bg-surface transition-colors min-h-[140px] group"
    >
      <div className="w-9 h-9 rounded-r4 bg-bg-elevated group-hover:bg-bg-overlay flex items-center justify-center transition-colors">
        <Plus size={16} className="text-text-muted" />
      </div>
      <span className="text-12 font-medium text-text-muted group-hover:text-text-secondary transition-colors">
        New template
      </span>
    </Link>
  );
}

export function TemplatesSection({ templates }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.exercises.some((te) => te.exercise.name.toLowerCase().includes(q))
    );
  }, [templates, query]);

  const myTemplates = useMemo(
    () => filtered.filter((t) => !DEFAULT_TEMPLATE_NAMES.has(t.name)),
    [filtered]
  );
  const defaultTemplates = useMemo(
    () => filtered.filter((t) => DEFAULT_TEMPLATE_NAMES.has(t.name)),
    [filtered]
  );

  return (
    <div className="rounded-r5 border border-border bg-bg-surface">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="font-display text-15 font-semibold text-text-primary">Templates</span>
          <span className="font-mono text-11 text-text-muted bg-bg-elevated px-2 py-0.5 rounded-pill">
            {templates.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none" />
            <input
              type="text"
              placeholder="Search templates…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 pr-7 py-1.5 rounded-r3 bg-bg-elevated border border-border text-12 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors w-48"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-muted transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <Link
            href="/workouts/templates/new"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill border text-12 font-medium transition-colors flex-shrink-0"
            style={{ background: "var(--color-accent-soft)", borderColor: "var(--color-accent-ring)", color: "var(--color-accent)" }}
          >
            <Plus size={12} />
            New template
          </Link>
        </div>
      </div>

      <div className="p-5">
        {templates.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="font-display text-15 font-semibold text-text-primary">No templates yet</p>
            <p className="text-13 text-text-secondary">Create a template to quickly start a workout session.</p>
            <Link
              href="/workouts/templates/new"
              className="flex items-center gap-2 px-4 py-2 rounded-pill bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors"
            >
              <Plus size={14} />
              Create your first template
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Search size={20} className="text-text-disabled" />
            <p className="text-13 text-text-muted">No templates match your search.</p>
            <button onClick={() => setQuery("")} className="text-13 text-accent hover:text-accent-hover transition-colors">
              Clear search
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {(myTemplates.length > 0 || defaultTemplates.length === 0) && (
              <CollapsibleSection
                title={
                  <span className="font-display text-13 font-semibold text-text-primary">
                    My Templates
                  </span>
                }
                headerExtra={
                  <span className="font-mono text-11 text-text-muted bg-bg-elevated px-2 py-0.5 rounded-pill">
                    {myTemplates.length}
                  </span>
                }
                storageKey="arc-collapse-templates-my"
                headerClassName="py-1.5"
              >
                <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))] pt-3">
                  {myTemplates.map((t) => (
                    <TemplateCard key={t.id} template={t} />
                  ))}
                  {!query && <NewTemplateCard />}
                </div>
              </CollapsibleSection>
            )}

            {defaultTemplates.length > 0 && (
              <CollapsibleSection
                title={
                  <span className="font-display text-13 font-semibold text-text-primary">
                    Default Templates
                  </span>
                }
                headerExtra={
                  <span className="font-mono text-11 text-text-muted bg-bg-elevated px-2 py-0.5 rounded-pill">
                    {defaultTemplates.length}
                  </span>
                }
                storageKey="arc-collapse-templates-default"
                headerClassName="py-1.5"
              >
                <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))] pt-3">
                  {defaultTemplates.map((t) => (
                    <TemplateCard key={t.id} template={t} />
                  ))}
                  {!query && myTemplates.length > 0 && <NewTemplateCard />}
                </div>
              </CollapsibleSection>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
