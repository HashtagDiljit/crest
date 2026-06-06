// Accent colour variants: hover (10% darker), pressed (20% darker)
const ACCENT_VARIANTS: Record<string, { hover: string; pressed: string }> = {
  "#2DD4BF": { hover: "#28BFAC", pressed: "#1E9A8B" },
  "#6366F1": { hover: "#595CD9", pressed: "#4338CA" },
  "#A855F7": { hover: "#974DDE", pressed: "#7E22CE" },
  "#F43F5E": { hover: "#DC3955", pressed: "#BE123C" },
  "#F97316": { hover: "#E06814", pressed: "#C2560F" },
  "#F59E0B": { hover: "#DD8E0A", pressed: "#B45309" },
  "#EAB308": { hover: "#D3A107", pressed: "#A16207" },
  "#84CC16": { hover: "#77B814", pressed: "#4D7C0F" },
  "#10B981": { hover: "#0EA774", pressed: "#047857" },
  "#0EA5E9": { hover: "#0D95D2", pressed: "#0369A1" },
  "#94A3B8": { hover: "#8593A6", pressed: "#64748B" },
  "#EC4899": { hover: "#D4418A", pressed: "#9D174D" },
};

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function applyAccent(hex: string) {
  const root = document.documentElement;
  const [r, g, b] = hexToRgb(hex);
  const variants = ACCENT_VARIANTS[hex] ?? { hover: hex, pressed: hex };

  root.style.setProperty("--color-accent", hex);
  root.style.setProperty("--color-accent-hover", variants.hover);
  root.style.setProperty("--color-accent-pressed", variants.pressed);
  root.style.setProperty("--color-accent-soft", `rgba(${r},${g},${b},0.15)`);
  root.style.setProperty("--color-accent-ring", `rgba(${r},${g},${b},0.45)`);
  root.style.setProperty("--color-border-focus", hex);

  try { localStorage.setItem("arc-accent", hex); } catch { /* noop */ }
}

export function applyTheme(theme: string) {
  const resolved = theme === "system"
    ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
    : theme;

  const isLight = resolved === "light";
  const isAmoled = resolved === "amoled";

  // Set data-theme on both html and body (Samsung Internet misses html-only).
  const attr = isLight ? "light" : isAmoled ? "amoled" : null;
  if (attr) {
    document.documentElement.setAttribute("data-theme", attr);
    document.body.setAttribute("data-theme", attr);
  } else {
    document.documentElement.removeAttribute("data-theme");
    document.body.removeAttribute("data-theme");
  }

  // Inline style fallbacks — highest specificity, Samsung Internet honours these
  // even when CSS custom property cascade fails.
  const bg = isLight ? "#FFFFFF" : isAmoled ? "#000000" : "#0D0D12";
  const fg = isLight ? "#0D0D12" : "#E8E6E0";
  document.documentElement.style.setProperty("background-color", bg, "important");
  document.body.style.setProperty("background-color", bg, "important");
  document.body.style.color = fg;

  // Keep theme-color meta in sync with the active theme so iOS status bar
  // and Android browser chrome match the page background.
  const metaThemeColor = document.querySelector('meta[name="theme-color"]:not([media])') as HTMLMetaElement | null;
  if (metaThemeColor) {
    metaThemeColor.content = bg;
  } else {
    // Next.js emits media-scoped tags; inject a plain one for runtime overrides.
    const tag = document.createElement("meta");
    tag.name = "theme-color";
    tag.content = bg;
    document.head.appendChild(tag);
  }

  try { localStorage.setItem("arc-theme", theme); } catch { /* noop */ }
}

// Inline script string for root layout — prevents flash on load
export const THEME_INIT_SCRIPT = `(function(){
  try {
    var t=localStorage.getItem('arc-theme')||'dark';
    if(t==='system')t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';
    var light=t==='light';
    var amoled=t==='amoled';
    var bg=light?'#FFFFFF':amoled?'#000000':'#0D0D12';
    if(light||amoled){
      var attr=light?'light':'amoled';
      document.documentElement.setAttribute('data-theme',attr);
      if(document.body){document.body.setAttribute('data-theme',attr);}
    }
    document.documentElement.style.setProperty('background-color',bg,'important');
    if(light){document.documentElement.style.color='#0D0D12';}
    var a=localStorage.getItem('arc-accent');
    if(a){
      var el=document.documentElement;
      el.style.setProperty('--color-accent',a);
      var n=parseInt(a.replace('#',''),16);
      var r=(n>>16)&255,g=(n>>8)&255,b=n&255;
      el.style.setProperty('--color-accent-soft','rgba('+r+','+g+','+b+',0.15)');
      el.style.setProperty('--color-accent-ring','rgba('+r+','+g+','+b+',0.45)');
    }
    if(localStorage.getItem('arc-sidebar-collapsed')==='true'){
      document.documentElement.style.setProperty('--sidebar-w','64px');
    }
  }catch(e){}
})();`;
