"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  userId: string;
  referralCount: number;
}

export function ReferralSection({ userId, referralCount }: Props) {
  const [copied, setCopied] = useState(false);
  const link = `https://withkairos.app?ref=${userId}`;

  function handleCopy() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-14 font-semibold text-text-primary">Invite friends to Kairos</p>
        <p className="text-12 text-text-muted mt-0.5">
          {referralCount > 0
            ? `${referralCount} friend${referralCount !== 1 ? "s" : ""} joined via your link`
            : "Share your personal link to invite friends"}
        </p>
      </div>
      <div className="flex items-center gap-2 p-3 rounded-r3 border border-border bg-bg-elevated">
        <span className="flex-1 text-13 text-text-secondary truncate font-mono">{link}</span>
        <button type="button" onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-r3 border border-border bg-bg-overlay hover:bg-bg-surface text-13 text-text-secondary hover:text-text-primary transition-colors flex-shrink-0">
          {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
