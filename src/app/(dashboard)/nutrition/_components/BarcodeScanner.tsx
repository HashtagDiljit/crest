"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, Keyboard } from "lucide-react";

interface BarcodeResult {
  barcode: string;
}

interface Props {
  onResult: (result: BarcodeResult) => void;
  onCancel: () => void;
}

export function BarcodeScanner({ onResult, onCancel }: Props) {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const [hasCamera, setHasCamera]     = useState<boolean | null>(null);
  const [manualCode, setManualCode]   = useState("");
  const [scanning, setScanning]       = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [useManual, setUseManual]     = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    async function startZxing(stream: MediaStream) {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        setScanning(true);
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        reader.decodeFromVideoElement(videoRef.current, (result, err) => {
          if (result) {
            stopStream();
            onResult({ barcode: result.getText() });
          }
          if (err && !(err.message?.includes("NotFoundException"))) {
            // Ignore "not found" errors (no barcode in frame yet)
          }
        });
      } catch {
        setError("Camera scanning unavailable. Use manual entry below.");
        setUseManual(true);
      }
    }

    const checkCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setHasCamera(false);
        setUseManual(true);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        setHasCamera(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        startZxing(stream);
      } catch {
        setHasCamera(false);
        setUseManual(true);
      }
    };
    checkCamera();
    return () => stopStream();
  }, [stopStream, onResult]);

  function handleManualSubmit() {
    const code = manualCode.trim();
    if (code.length < 4) return;
    onResult({ barcode: code });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-13 font-semibold text-text-primary">Scan barcode</span>
        <button onClick={onCancel} className="text-12 text-text-muted hover:text-text-secondary transition-colors">
          Cancel
        </button>
      </div>

      {error && (
        <p className="text-12 text-warning bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.3)] rounded-r3 px-3 py-2">{error}</p>
      )}

      {/* Camera view */}
      {hasCamera && !useManual && (
        <div className="flex flex-col gap-2">
          <div className="relative rounded-r4 overflow-hidden bg-black aspect-[4/3]">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {/* Scanning guide lines */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3/4 h-1/3 border-2 border-accent rounded-r3 opacity-70" />
            </div>
            {scanning && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                <span className="text-11 text-white bg-black/60 px-2 py-1 rounded-pill">Hold barcode in view…</span>
              </div>
            )}
          </div>
          <button
            onClick={() => { stopStream(); setUseManual(true); }}
            className="flex items-center justify-center gap-1.5 text-12 text-text-muted hover:text-text-secondary transition-colors py-1"
          >
            <Keyboard size={12} /> Type barcode manually instead
          </button>
        </div>
      )}

      {/* Manual barcode entry */}
      {(useManual || hasCamera === false) && (
        <div className="flex flex-col gap-2">
          {hasCamera === true && (
            <button
              onClick={() => setUseManual(false)}
              className="flex items-center gap-1.5 text-12 text-accent hover:text-accent-hover transition-colors self-start"
            >
              <Camera size={12} /> Use camera instead
            </button>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleManualSubmit(); }}
              placeholder="Enter barcode number…"
              className="flex-1 rounded-r3 border border-border bg-bg-base px-3 py-2.5 text-13 text-text-primary placeholder:text-text-disabled outline-none focus:border-accent transition-colors"
              autoFocus
            />
            <button
              onClick={handleManualSubmit}
              disabled={manualCode.trim().length < 4}
              className="px-4 py-2.5 rounded-r3 bg-accent text-white text-13 font-semibold transition-colors disabled:opacity-40"
            >
              Look up
            </button>
          </div>
          <p className="text-11 text-text-muted">Enter the barcode number from the packaging (8–14 digits).</p>
        </div>
      )}

      {hasCamera === null && !useManual && (
        <div className="flex items-center justify-center py-8 text-text-muted text-13">
          Requesting camera access…
        </div>
      )}
    </div>
  );
}
