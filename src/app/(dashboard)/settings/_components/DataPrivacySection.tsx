"use client";

import { useState, useEffect } from "react";
import { Download, Smartphone, Trash2, Loader2, ShieldCheck, ExternalLink } from "lucide-react";
import { exportUserData, deleteAccount } from "../actions";
import { SamsungImportModal } from "./SamsungImportModal";
import { getConsent, saveConsent, withdrawConsentCategory } from "@/app/(dashboard)/consent/actions";
import type { ConsentChoices } from "@/app/(dashboard)/consent/types";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CONSENT_LABELS: Record<keyof ConsentChoices, { label: string; description: string; required: boolean }> = {
  physical_health:     { label: "Physical health data",       description: "Workouts, body measurements, sleep logs, and water intake.", required: true },
  mental_emotional:    { label: "Mental and emotional data",  description: "Mood logs, journal entries, and goal notes.",               required: true },
  biometric:           { label: "Biometric data",             description: "Heart rate, HRV, and body fat estimates.",                  required: false },
  correlation_analysis:{ label: "Correlation analysis",       description: "Analyse patterns across your data to surface insights.",    required: false },
  product_improvement: { label: "Anonymous product improvement", description: "Aggregate, never identifiable usage analytics.",         required: false },
};

export function DataPrivacySection() {
  const router = useRouter();
  const [showImport, setShowImport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [consent, setConsent] = useState<(ConsentChoices & { consent_version: string }) | null>(null);
  const [loadingConsent, setLoadingConsent] = useState(true);
  const [savingConsent, setSavingConsent] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState<keyof ConsentChoices | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    getConsent().then((c) => { setConsent(c); setLoadingConsent(false); });
  }, []);

  async function handleExport() {
    setExporting(true);
    const res = await exportUserData();
    setExporting(false);
    if (res.data) {
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `crest-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    await deleteAccount();
    router.push("/login");
  }

  async function handleToggleConsent(key: keyof ConsentChoices, currentValue: boolean) {
    if (!consent) return;
    if (currentValue) {
      // withdrawing — need confirmation
      setWithdrawTarget(key);
    } else {
      // enabling
      setSavingConsent(true);
      const updated = { ...consent, [key]: true };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { consent_version: _, ...choices } = updated;
      await saveConsent(choices as ConsentChoices);
      setConsent(updated);
      setSavingConsent(false);
    }
  }

  async function handleWithdraw() {
    if (!withdrawTarget || !consent) return;
    setWithdrawing(true);
    await withdrawConsentCategory(withdrawTarget);
    setConsent((prev) => prev ? { ...prev, [withdrawTarget]: false } : prev);
    setWithdrawing(false);
    setWithdrawTarget(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Consent management */}
      <div className="rounded-r4 border border-border bg-bg-elevated p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-accent" />
          <p className="text-13 font-semibold text-text-primary">Manage your consent</p>
        </div>

        {loadingConsent ? (
          <div className="flex flex-col gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 rounded-r3 bg-bg-surface shimmer" />
            ))}
          </div>
        ) : !consent ? (
          <p className="text-12 text-text-muted">No consent record found.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {(Object.keys(CONSENT_LABELS) as Array<keyof ConsentChoices>).map((key) => {
              const meta = CONSENT_LABELS[key];
              const enabled = consent[key];
              return (
                <div key={key} className="flex items-start gap-3 py-1">
                  <button
                    type="button"
                    onClick={() => handleToggleConsent(key, enabled)}
                    disabled={savingConsent}
                    className={`relative w-9 h-5 rounded-pill flex-shrink-0 mt-0.5 transition-colors disabled:opacity-50 ${enabled ? "bg-accent" : "bg-bg-surface border border-border"}`}
                    aria-label={`Toggle ${meta.label}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-[left] ${enabled ? "left-[18px]" : "left-0.5"}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-13 font-medium ${enabled ? "text-text-primary" : "text-text-secondary"}`}>{meta.label}</span>
                      {meta.required && <span className="text-10 px-1.5 py-0.5 rounded-pill bg-bg-surface border border-border text-text-muted">Required</span>}
                      {!enabled && <span className="text-10 px-1.5 py-0.5 rounded-pill bg-[var(--color-danger-soft)] text-danger">Off</span>}
                    </div>
                    <p className="text-11 text-text-muted mt-0.5">{meta.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-3 text-12 text-text-muted border-t border-border pt-3">
          <Link href="/privacy" className="underline hover:text-text-secondary transition-colors flex items-center gap-1" target="_blank">
            Privacy Policy <ExternalLink size={10} />
          </Link>
          <Link href="/terms" className="underline hover:text-text-secondary transition-colors flex items-center gap-1" target="_blank">
            Terms of Service <ExternalLink size={10} />
          </Link>
        </div>
      </div>

      {/* Export */}
      <div className="rounded-r4 border border-border bg-bg-elevated p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-13 font-semibold text-text-primary">Export your data</p>
          <p className="text-12 text-text-muted mt-0.5">Download all your data as a JSON file</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-r3 border border-border text-13 text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors disabled:opacity-50"
        >
          {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          Export
        </button>
      </div>

      {/* Samsung Health import */}
      <div className="rounded-r4 border border-border bg-bg-elevated p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-13 font-semibold text-text-primary">Samsung Health import</p>
          <p className="text-12 text-text-muted mt-0.5">Import CSV exports from Samsung Health</p>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-r3 border border-border text-13 text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
        >
          <Smartphone size={13} />
          Import
        </button>
      </div>

      {/* Connected apps placeholder */}
      <div className="rounded-r4 border border-border bg-bg-elevated p-4">
        <p className="text-13 font-semibold text-text-primary">Connected apps</p>
        <p className="text-12 text-text-muted mt-0.5">Third-party integrations — coming soon</p>
        <div className="mt-3 flex gap-2 flex-wrap">
          {["Apple Health", "Google Fit", "Garmin", "Whoop"].map((app) => (
            <span key={app} className="px-3 py-1 rounded-pill border border-border text-11 text-text-disabled bg-bg-surface">{app}</span>
          ))}
        </div>
      </div>

      {/* Delete account */}
      <div className="rounded-r4 border border-danger border-opacity-30 bg-danger bg-opacity-5 p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-13 font-semibold text-danger">Delete account</p>
          <p className="text-12 text-text-muted mt-0.5">Permanently remove your account and all data</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-r3 text-13 font-semibold transition-colors disabled:opacity-50 ${
            confirmDelete ? "bg-danger text-white" : "border border-danger text-danger hover:bg-danger hover:text-white"
          }`}
        >
          {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          {confirmDelete ? "Confirm delete" : "Delete"}
        </button>
      </div>

      {showImport && <SamsungImportModal onClose={() => setShowImport(false)} />}

      {/* Withdrawal confirmation dialog */}
      {withdrawTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm rounded-r5 border border-border bg-bg-surface p-6 flex flex-col gap-4 shadow-2xl">
            <h3 className="font-display text-17 font-semibold text-text-primary">Withdraw consent?</h3>
            <p className="text-13 text-text-secondary leading-relaxed">
              Withdrawing consent for <strong className="text-text-primary">{CONSENT_LABELS[withdrawTarget].label}</strong> will permanently delete all associated data. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setWithdrawTarget(null)}
                className="flex-1 py-2.5 rounded-r3 border border-border text-13 text-text-secondary hover:bg-bg-elevated transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="flex-1 py-2.5 rounded-r3 bg-danger text-white text-13 font-semibold transition-colors disabled:opacity-50"
              >
                {withdrawing ? "Deleting…" : "Withdraw & delete data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
