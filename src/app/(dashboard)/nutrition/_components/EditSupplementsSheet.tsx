"use client";

import { useState, useTransition } from "react";
import { X, Plus, Trash2, GripVertical } from "lucide-react";
import type { UserSupplement } from "../supplement-actions";
import { toggleSupplement, addSupplement, deleteSupplement, reorderSupplements } from "../supplement-actions";

interface Props {
  supplements: UserSupplement[];
  onClose: () => void;
}

export function EditSupplementsSheet({ supplements: initial, onClose }: Props) {
  const [items, setItems] = useState<UserSupplement[]>(initial);
  const [newName, setNewName] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle(id: string, enabled: boolean) {
    setItems(prev => prev.map(s => s.id === id ? { ...s, enabled } : s));
    startTransition(async () => { await toggleSupplement(id, enabled); });
  }

  function handleDelete(id: string) {
    setItems(prev => prev.filter(s => s.id !== id));
    startTransition(async () => { await deleteSupplement(id); });
  }

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    const { error } = await addSupplement(name);
    if (!error) {
      setItems(prev => [...prev, { id: `temp-${Date.now()}`, name, enabled: true, order_index: prev.length }]);
      setNewName("");
    }
  }

  function handleDragStart(idx: number) { setDragIdx(idx); }
  function handleDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setOverIdx(idx); }
  function handleDrop(idx: number) {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setOverIdx(null); return; }
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    setItems(next);
    setDragIdx(null);
    setOverIdx(null);
    startTransition(async () => { await reorderSupplements(next.map(s => s.id)); });
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-r5 border-t border-border bg-bg-surface flex flex-col"
        style={{ maxHeight: "80dvh", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-border" /></div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <p className="text-16 font-semibold text-text-primary">Edit supplements</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Add new */}
        <div className="px-5 py-3 border-b border-border flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            placeholder="Add supplement…"
            className="flex-1 h-9 rounded-r3 border border-border bg-bg-base px-3 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="h-9 px-3 rounded-r3 bg-accent text-white text-13 font-semibold disabled:opacity-40 flex items-center gap-1 transition-opacity"
          >
            <Plus size={14} /> Add
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-1.5">
          {items.map((s, idx) => (
            <div
              key={s.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={e => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-r3 border transition-colors ${
                overIdx === idx ? "border-accent bg-accent/10" : "border-border bg-bg-elevated"
              }`}
            >
              <GripVertical size={14} className="text-text-disabled cursor-grab flex-shrink-0" />
              <span className="flex-1 text-13 text-text-primary truncate">{s.name}</span>
              {/* Toggle */}
              <button
                onClick={() => handleToggle(s.id, !s.enabled)}
                className={`relative w-10 h-5.5 rounded-pill transition-colors flex-shrink-0 ${s.enabled ? "bg-accent" : "bg-bg-overlay border border-border"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${s.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
              <button
                onClick={() => handleDelete(s.id)}
                className="w-7 h-7 flex items-center justify-center text-text-disabled hover:text-error transition-colors flex-shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="px-5 pt-2">
          <button
            onClick={onClose}
            disabled={isPending}
            className="w-full h-11 rounded-r3 bg-accent hover:bg-accent-hover text-white font-semibold text-14 transition-colors disabled:opacity-60"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
