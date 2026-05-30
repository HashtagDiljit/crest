"use client";

import { useState, useRef } from "react";
import { X, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";

interface ImportResult {
  type: string;
  inserted: number;
  skipped: number;
  errors: number;
}

type FileType = "sleep" | "heart_rate" | "step_daily_trend" | "body_weight" | "unknown";

function detectFileType(headers: string[]): FileType {
  const h = headers.map((s) => s.toLowerCase().replace(/\s+/g, "_"));
  if (h.some((x) => x.includes("sleep"))) return "sleep";
  if (h.some((x) => x.includes("heart_rate") || x.includes("bpm"))) return "heart_rate";
  if (h.some((x) => x.includes("step") || x.includes("steps"))) return "step_daily_trend";
  if (h.some((x) => x.includes("weight") || x.includes("body_weight"))) return "body_weight";
  return "unknown";
}

interface Props {
  onClose: () => void;
}

export function SamsungImportModal({ onClose }: Props) {
  const [results, setResults] = useState<ImportResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setImporting(true);
    setResults([]);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setImporting(false); return; }

    const allResults: ImportResult[] = [];

    for (const file of Array.from(files)) {
      await new Promise<void>((resolve) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (parsed) => {
            const rows = parsed.data as Record<string, string>[];
            if (!rows.length) { resolve(); return; }
            const headers = Object.keys(rows[0]);
            const fileType = detectFileType(headers);
            const result: ImportResult = { type: file.name, inserted: 0, skipped: 0, errors: 0 };

            if (fileType === "sleep") {
              for (const row of rows) {
                const dateStr = row["Start time"] || row["start_time"] || row["date"] || "";
                const duration = parseFloat(row["Duration"] || row["duration_hrs"] || "0");
                const date = dateStr.split(" ")[0] || dateStr.split("T")[0];
                if (!date) { result.errors++; continue; }
                const { data: existing } = await supabase.from("sleep_logs").select("id").eq("user_id", user.id).eq("logged_date", date).maybeSingle();
                if (existing) { result.skipped++; continue; }
                const { error } = await supabase.from("sleep_logs").insert({
                  user_id: user.id,
                  logged_date: date,
                  duration_hrs: Math.round(duration * 10) / 10 || undefined,
                });
                if (error) result.errors++; else result.inserted++;
              }
            } else if (fileType === "heart_rate") {
              const toInsert = rows.map((row) => {
                const ts = row["Start time"] || row["start_time"] || row["timestamp"] || "";
                const bpm = parseInt(row["Heart rate (bpm)"] || row["bpm"] || row["value"] || "0", 10);
                return { user_id: user.id, metric_type: "heart_rate_bpm", value: bpm, logged_date: (ts.split(" ")[0] || ts.split("T")[0]), recorded_at: ts };
              }).filter((r) => r.logged_date && r.value > 0);

              if (toInsert.length) {
                const { data: existing } = await supabase.from("health_metrics").select("logged_date").eq("user_id", user.id).eq("metric_type", "heart_rate_bpm").gte("logged_date", toInsert[0].logged_date);
                const existingDates = new Set((existing ?? []).map((e) => e.logged_date));
                const fresh = toInsert.filter((r) => !existingDates.has(r.logged_date));
                result.skipped += toInsert.length - fresh.length;
                if (fresh.length) {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { error } = await supabase.from("health_metrics").insert(fresh.map(({ recorded_at: _ra, ...r }) => r));
                  if (error) result.errors += fresh.length; else result.inserted += fresh.length;
                }
              }
            } else if (fileType === "step_daily_trend") {
              for (const row of rows) {
                const date = row["Date"] || row["date"] || row["start_time"]?.split(" ")[0] || "";
                const steps = parseInt(row["Step count"] || row["steps"] || row["value"] || "0", 10);
                if (!date || !steps) { result.errors++; continue; }
                const { data: existing } = await supabase.from("health_metrics").select("id").eq("user_id", user.id).eq("metric_type", "steps").eq("logged_date", date).maybeSingle();
                if (existing) { result.skipped++; continue; }
                const { error } = await supabase.from("health_metrics").insert({ user_id: user.id, metric_type: "steps", value: steps, logged_date: date });
                if (error) result.errors++; else result.inserted++;
              }
            } else if (fileType === "body_weight") {
              for (const row of rows) {
                const dateStr = row["Start time"] || row["date"] || row["timestamp"] || "";
                const date = dateStr.split(" ")[0] || dateStr.split("T")[0];
                const weight = parseFloat(row["Weight (kg)"] || row["weight_kg"] || row["value"] || "0");
                if (!date || !weight) { result.errors++; continue; }
                const { data: existing } = await supabase.from("health_metrics").select("id").eq("user_id", user.id).eq("metric_type", "weight_kg").eq("logged_date", date).maybeSingle();
                if (existing) { result.skipped++; continue; }
                const { error } = await supabase.from("health_metrics").insert({ user_id: user.id, metric_type: "weight_kg", value: weight, logged_date: date });
                if (error) result.errors++; else result.inserted++;
              }
            } else {
              result.errors = rows.length;
            }

            allResults.push(result);
            resolve();
          },
          error: () => {
            allResults.push({ type: file.name, inserted: 0, skipped: 0, errors: 1 });
            resolve();
          },
        });
      });
    }

    setResults(allResults);
    setImporting(false);
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-r5 border border-border bg-bg-surface p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-16 font-semibold text-text-primary">Import Samsung Health data</p>
            <p className="text-12 text-text-muted mt-0.5">CSV export from Samsung Health app</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-pill hover:bg-bg-elevated flex items-center justify-center text-text-muted">
            <X size={16} />
          </button>
        </div>

        <div className="rounded-r3 border border-dashed border-border bg-bg-elevated p-6 flex flex-col items-center gap-3 text-center">
          <Upload size={24} className="text-text-disabled" />
          <div>
            <p className="text-13 font-medium text-text-secondary">Select one or more CSV files</p>
            <p className="text-11 text-text-muted mt-0.5">sleep, heart_rate, step_daily_trend, body_weight</p>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="px-4 py-2 rounded-r3 bg-accent hover:bg-accent-hover text-white text-12 font-semibold transition-colors disabled:opacity-50"
          >
            Choose files
          </button>
          <input ref={fileRef} type="file" accept=".csv" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </div>

        {importing && (
          <div className="flex items-center gap-2 text-13 text-text-secondary">
            <Loader2 size={14} className="animate-spin text-accent" /> Parsing and importing…
          </div>
        )}

        {done && results.length > 0 && (
          <div className="flex flex-col gap-2">
            {results.map((r, i) => (
              <div key={i} className="rounded-r3 bg-bg-elevated border border-border p-3">
                <p className="text-12 font-medium text-text-primary truncate">{r.type}</p>
                <div className="flex gap-3 mt-1.5 font-mono text-11">
                  <span className="text-success flex items-center gap-1"><CheckCircle2 size={11} /> {r.inserted} imported</span>
                  <span className="text-text-muted">{r.skipped} skipped</span>
                  {r.errors > 0 && <span className="text-danger flex items-center gap-1"><AlertCircle size={11} /> {r.errors} errors</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-4 py-2 rounded-r3 border border-border text-13 text-text-secondary hover:text-text-primary transition-colors">
            {done ? "Close" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
