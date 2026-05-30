// Accent colour variants: base, hover (15% lighter), pressed (10% darker)
const ACCENT_VARIANTS: Record<string, { hover: string; pressed: string }> = {
  "#6C63FF": { hover: "#8B83FF", pressed: "#4A41E0" },
  "#6366F1": { hover: "#818CF8", pressed: "#4338CA" },
  "#38BDF8": { hover: "#7DD3FC", pressed: "#0284C7" },
  "#22C55E": { hover: "#4ADE80", pressed: "#15803D" },
  "#F59E0B": { hover: "#FCD34D", pressed: "#B45309" },
  "#F472B6": { hover: "#F9A8D4", pressed: "#DB2777" },
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
  root.style.setProperty("--color-accent-soft", `rgba(${r},${g},${b},0.14)`);
  root.style.setProperty("--color-accent-ring", `rgba(${r},${g},${b},0.45)`);
  root.style.setProperty("--color-border-focus", hex);

  try { localStorage.setItem("crest-accent", hex); } catch { /* noop */ }
}

export function applyTheme(theme: string) {
  const resolved = theme === "system"
    ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
    : theme;

  if (resolved === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

  try { localStorage.setItem("crest-theme", theme); } catch { /* noop */ }
}

// Inline script string for root layout — prevents flash on load
export const THEME_INIT_SCRIPT = `(function(){
  try {
    var t=localStorage.getItem('crest-theme')||'dark';
    if(t==='system')t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';
    if(t==='light')document.documentElement.setAttribute('data-theme','light');
    var a=localStorage.getItem('crest-accent');
    if(a){
      var el=document.documentElement;
      el.style.setProperty('--color-accent',a);
      var n=parseInt(a.replace('#',''),16);
      var r=(n>>16)&255,g=(n>>8)&255,b=n&255;
      el.style.setProperty('--color-accent-soft','rgba('+r+','+g+','+b+',0.14)');
      el.style.setProperty('--color-accent-ring','rgba('+r+','+g+','+b+',0.45)');
    }
  }catch(e){}
})();`;
