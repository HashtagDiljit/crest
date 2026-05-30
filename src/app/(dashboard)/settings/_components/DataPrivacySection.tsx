"use client";

import { useState } from "react";
import { Download, Smartphone, Trash2, Loader2 } from "lucide-react";
import { exportUserData, deleteAccount } from "../actions";
import { SamsungImportModal } from "./SamsungImportModal";
import { useRouter } from "next/navigation";

export function DataPrivacySection() {
  const router = useRouter();
  const [showImport, setShowImport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  return (
    <div className="flex flex-col gap-5">
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
    </div>
  );
}
