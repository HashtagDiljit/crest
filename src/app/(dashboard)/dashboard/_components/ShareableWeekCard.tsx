"use client";

import { useRef, useState, useCallback } from "react";
import { Share2, Download, X } from "lucide-react";

interface Props {
  username: string;
  weekLabel: string;
  workouts: number;
  sleepAvg: number | null;
  habitPct: number | null;
  moodAvg: number | null;
  readinessScore?: number | null;
  accentColor?: string;
}

export function ShareableWeekCard({
  username,
  weekLabel,
  workouts,
  sleepAvg,
  habitPct,
  moodAvg,
  readinessScore,
  accentColor = "#6C63FF",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1080;
    const H = 1080;
    canvas.width = W;
    canvas.height = H;

    // Background
    ctx.fillStyle = "#0D0D12";
    ctx.fillRect(0, 0, W, H);

    // Subtle grid pattern
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += 80) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Accent top bar
    ctx.fillStyle = accentColor;
    ctx.fillRect(0, 0, W, 10);

    // App name
    ctx.font = "600 52px -apple-system, system-ui, sans-serif";
    ctx.fillStyle = accentColor;
    ctx.textAlign = "left";
    ctx.fillText("Arc", 80, 130);

    // Divider
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(80, 148, W - 160, 1);

    // Username
    ctx.font = "700 96px -apple-system, system-ui, sans-serif";
    ctx.fillStyle = "#E8E6E0";
    ctx.textAlign = "center";
    ctx.fillText(username, W / 2, 300);

    // Week label
    ctx.font = "400 44px -apple-system, system-ui, sans-serif";
    ctx.fillStyle = "#7E7C78";
    ctx.fillText(weekLabel, W / 2, 370);

    // Accent divider
    ctx.fillStyle = accentColor;
    ctx.fillRect(W / 2 - 40, 400, 80, 4);
    ctx.globalAlpha = 0.3;
    ctx.fillRect(W / 2 - 100, 400, 55, 4);
    ctx.fillRect(W / 2 + 45, 400, 55, 4);
    ctx.globalAlpha = 1;

    // Stats grid (2x2)
    const stats = [
      { label: "Workouts", value: String(workouts) },
      { label: "Avg Sleep", value: sleepAvg !== null ? `${sleepAvg}h` : "—" },
      { label: "Habit Rate", value: habitPct !== null ? `${habitPct}%` : "—" },
      { label: "Avg Mood", value: moodAvg !== null ? `${moodAvg}/5` : "—" },
    ];

    const cardW = 440;
    const cardH = 210;
    const gapX = 40;
    const gapY = 32;
    const gridW = 2 * cardW + gapX;
    const startX = (W - gridW) / 2;
    const startY = 460;

    stats.forEach((s, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      // Card bg
      ctx.fillStyle = "#16161E";
      ctx.beginPath();
      const r = 20;
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + cardW - r, y);
      ctx.quadraticCurveTo(x + cardW, y, x + cardW, y + r);
      ctx.lineTo(x + cardW, y + cardH - r);
      ctx.quadraticCurveTo(x + cardW, y + cardH, x + cardW - r, y + cardH);
      ctx.lineTo(x + r, y + cardH);
      ctx.quadraticCurveTo(x, y + cardH, x, y + cardH - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();

      // Card border
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Value
      ctx.font = "700 80px -apple-system, system-ui, sans-serif";
      ctx.fillStyle = "#E8E6E0";
      ctx.textAlign = "center";
      ctx.fillText(s.value, x + cardW / 2, y + 120);

      // Label
      ctx.font = "400 36px -apple-system, system-ui, sans-serif";
      ctx.fillStyle = "#7E7C78";
      ctx.fillText(s.label, x + cardW / 2, y + 175);
    });

    // Readiness badge if available
    if (readinessScore != null) {
      const bx = W / 2;
      const by = startY + 2 * (cardH + gapY) + 50;
      ctx.font = "600 36px -apple-system, system-ui, sans-serif";
      ctx.fillStyle = accentColor;
      ctx.textAlign = "center";
      ctx.fillText(`Readiness: ${readinessScore}/100`, bx, by);
    }

    // Footer
    ctx.font = "400 34px -apple-system, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.textAlign = "center";
    ctx.fillText("Tracked with Arc", W / 2, H - 70);
  }, [username, weekLabel, workouts, sleepAvg, habitPct, moodAvg, readinessScore, accentColor]);

  function handleOpen() {
    setOpen(true);
    requestAnimationFrame(renderCanvas);
  }

  async function handleShare() {
    setSharing(true);
    const canvas = canvasRef.current;
    if (!canvas) { setSharing(false); return; }

    try {
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png")
      );
      const file = new File([blob], "arc-week.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "My weekly summary on Arc", files: [file] });
      } else {
        downloadBlob(blob);
      }
    } catch {
      // dismissed or failed
    } finally {
      setSharing(false);
    }
  }

  async function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png")
    );
    downloadBlob(blob);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-r3 border border-border bg-bg-elevated hover:bg-bg-overlay text-12 text-text-secondary hover:text-text-primary transition-colors"
      >
        <Share2 size={12} />
        Share week
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-bg-surface rounded-r5 border border-border p-5 flex flex-col gap-4 w-full max-w-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-15 font-semibold text-text-primary">Share your week</h3>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-pill hover:bg-bg-elevated text-text-muted"
              >
                <X size={14} />
              </button>
            </div>
            <canvas ref={canvasRef} className="w-full rounded-r3 aspect-square" />
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                disabled={sharing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-50"
              >
                <Share2 size={14} />
                {sharing ? "Sharing…" : "Share"}
              </button>
              <button
                onClick={handleDownload}
                className="w-11 flex items-center justify-center rounded-r3 border border-border bg-bg-elevated hover:bg-bg-overlay text-text-secondary transition-colors"
              >
                <Download size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function downloadBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "arc-week.png";
  a.click();
  URL.revokeObjectURL(url);
}
