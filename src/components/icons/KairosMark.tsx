export function KairosMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" className={className}>
      <rect width="44" height="44" rx="12" fill="#1a1a24" />
      <line x1="16" y1="12" x2="16" y2="32" stroke="#64b4a0" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="22" x2="28" y2="12" stroke="#64b4a0" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="22" x2="28" y2="32" stroke="#64b4a0" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="23" y1="17" x2="32" y2="12" stroke="#64b4a0" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="23" y1="27" x2="32" y2="32" stroke="#64b4a0" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
