"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import type { JournalEntry } from "../actions";

interface Props {
  entries: JournalEntry[];
  todayDate: string;
}

export function PastEntries({ entries, todayDate }: Props) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const past = entries.filter((e) => e.logged_date !== todayDate);

  const allTags = useMemo(() => {
    const t = new Set<string>();
    for (const e of past) for (const tag of e.tags ?? []) t.add(tag);
    return Array.from(t);
  }, [past]);

  const filtered = useMemo(() => {
    return past.filter((e) => {
      if (activeTag && !(e.tags ?? []).includes(activeTag)) return false;
      if (query && !e.body.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [past, query, activeTag]);

  if (past.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entries…"
            className="w-full pl-9 pr-4 py-2 rounded-r3 border border-border bg-bg-surface text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTag(null)}
            className={`text-11 px-2.5 py-0.5 rounded-pill border transition-colors ${!activeTag ? "bg-accent text-white border-accent" : "border-border text-text-muted hover:text-text-secondary"}`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`text-11 px-2.5 py-0.5 rounded-pill border transition-colors ${activeTag === tag ? "bg-[var(--color-accent-soft)] border-[var(--color-accent-ring)] text-accent" : "border-border text-text-muted hover:text-text-secondary"}`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <p className="text-13 text-text-muted py-4 text-center">No entries match.</p>
        ) : (
          filtered.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}

function EntryRow({ entry }: { entry: JournalEntry }) {
  const [expanded, setExpanded] = useState(false);
  const preview = entry.body.slice(0, 100);
  const hasMore = entry.body.length > 100;

  return (
    <div className="rounded-r4 border border-border bg-bg-surface p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-11 text-text-muted">{entry.logged_date}</span>
        {(entry.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(entry.tags ?? []).map((t) => (
              <span key={t} className="text-10 px-2 py-0.5 rounded-pill bg-[var(--color-accent-soft)] text-accent border border-[var(--color-accent-ring)]">#{t}</span>
            ))}
          </div>
        )}
      </div>
      <p className="text-13 text-text-secondary leading-relaxed whitespace-pre-wrap">
        {expanded ? entry.body : preview}
        {!expanded && hasMore && "…"}
      </p>
      {hasMore && (
        <button onClick={() => setExpanded((v) => !v)} className="text-11 text-accent hover:text-accent-hover transition-colors text-left">
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
