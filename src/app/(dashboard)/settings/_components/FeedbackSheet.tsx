"use client";

import { useState } from "react";
import { X, MessageSquare } from "lucide-react";
import { submitFeedback } from "../actions";

type Category = "Bug report" | "Feature idea" | "General feedback";
const CATEGORIES: Category[] = ["Bug report", "Feature idea", "General feedback"];

export function FeedbackSheet() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  function handleOpen() { setOpen(true); setSent(false); setCategory(null); setMessage(""); }
  function handleClose() { setOpen(false); }

  async function handleSubmit() {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await submitFeedback({ category: category ?? "General feedback", message: message.trim() });
      setSent(true);
      setTimeout(() => setOpen(false), 1800);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button type="button" onClick={handleOpen}
        className="flex items-center gap-1.5 text-13 text-text-muted hover:text-text-secondary transition-colors">
        <MessageSquare size={13} />
        Send feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-[500] flex flex-col justify-end" onClick={handleClose}>
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/50" />
          {/* sheet */}
          <div className="relative rounded-t-r5 bg-bg-surface border-t border-border p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            {/* header */}
            <div className="flex items-center justify-between">
              <p className="text-16 font-semibold text-text-primary">What&apos;s on your mind?</p>
              <button type="button" onClick={handleClose} className="w-7 h-7 flex items-center justify-center rounded-pill hover:bg-bg-elevated text-text-muted transition-colors">
                <X size={14} />
              </button>
            </div>

            {sent ? (
              <div className="text-center py-6">
                <p className="text-15 font-semibold text-success">Thanks for your feedback!</p>
              </div>
            ) : (
              <>
                {/* category chips */}
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c} type="button" onClick={() => setCategory(c === category ? null : c)}
                      className="px-3 py-1.5 rounded-pill text-13 font-medium transition-colors border"
                      style={{
                        background: category === c ? "var(--color-accent-soft)" : "var(--color-bg-elevated)",
                        borderColor: category === c ? "var(--color-accent-ring)" : "var(--color-border)",
                        color: category === c ? "var(--color-accent)" : "var(--color-text-secondary)",
                      }}>
                      {c}
                    </button>
                  ))}
                </div>

                {/* textarea */}
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value.slice(0, 500))}
                  placeholder="Tell us what's on your mind…"
                  rows={5}
                  className="w-full rounded-r3 border border-border bg-bg-elevated px-3 py-2.5 text-14 text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent transition-colors"
                />
                <p className="text-11 text-text-muted text-right -mt-2">{message.length}/500</p>

                <button type="button" onClick={handleSubmit} disabled={!message.trim() || submitting}
                  className="w-full py-3 rounded-r3 bg-accent text-white font-semibold text-14 transition-colors disabled:opacity-50 hover:bg-accent-hover">
                  {submitting ? "Sending…" : "Send"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
