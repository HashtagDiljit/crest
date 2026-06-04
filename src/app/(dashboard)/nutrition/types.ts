export interface MealLogRow {
  id: string;
  logged_date: string;
  logged_at: string;
  meal_type: string | null;
  food_name: string | null;
  protein_g: number | null;
  portion_multiplier: number | null;
}

export interface SupplementLogRow {
  supplement_name: string;
  logged_date: string;
}

export interface NutritionSettings {
  protein_target: number;
  meals_per_day: number;
  supplements: Record<string, boolean>;
}

export const DEFAULT_SETTINGS: NutritionSettings = {
  protein_target: 150,
  meals_per_day: 4,
  supplements: {
    "Creatine monohydrate": true,
    "Vitamin D": true,
    "Omega-3": true,
    "Whey protein": true,
    "Magnesium glycinate": true,
    "Zinc": false,
    "Vitamin K2": false,
    "NAD+/NMN": false,
  },
};

export const SUPPLEMENT_EVIDENCE: Record<string, { tier: string; evidence: string; dose: string; timing: string }> = {
  "Creatine monohydrate": {
    tier: "Tier 1 — Strong evidence",
    evidence: "Most studied ergogenic aid. Consistently increases muscle phosphocreatine stores, improving power output, strength, and lean mass gains. Also supports cognitive function and neurological health.",
    dose: "3–5g daily",
    timing: "Any time — daily consistency matters more than timing",
  },
  "Vitamin D": {
    tier: "Tier 1 — Strong evidence",
    evidence: "Critical for bone mineralisation, immune function, testosterone synthesis, and mood regulation. 40–60% of adults are deficient, especially in northern latitudes. Deficiency linked to reduced muscle function and increased injury risk.",
    dose: "2000–5000 IU daily",
    timing: "With a fatty meal for best absorption",
  },
  "Omega-3": {
    tier: "Tier 1 — Strong evidence",
    evidence: "EPA and DHA reduce systemic inflammation, support cardiovascular health, improve HRV, and may enhance muscle protein synthesis. High-dose omega-3 (2–3g EPA+DHA) shows consistent benefits across populations.",
    dose: "2–3g EPA+DHA daily",
    timing: "With meals to reduce fish-breath side effects",
  },
  "Whey protein": {
    tier: "Tier 1 — Proven utility",
    evidence: "Not a 'supplement' per se — a convenient complete protein source. Fast-digesting, high leucine content makes it ideal post-workout. No magic beyond hitting total daily protein targets.",
    dose: "20–40g per serve as needed to hit target",
    timing: "Post-workout or whenever convenient to hit daily protein goals",
  },
  "Magnesium glycinate": {
    tier: "Tier 1 — Strong evidence for deficiency",
    evidence: "Most people are sub-optimal in magnesium. Glycinate chelate is the best-tolerated form. Supports sleep quality, muscle relaxation, HRV, and insulin sensitivity. Low magnesium elevates cortisol response to stress.",
    dose: "200–400mg elemental magnesium",
    timing: "Evening — promotes sleep quality and muscle recovery overnight",
  },
  "Zinc": {
    tier: "Tier 2 — Useful if deficient",
    evidence: "Essential co-factor in 300+ enzymatic reactions. Depleted by intense training and sweating. Supports testosterone synthesis, immune function, and wound healing. Excess supplementation can impair copper absorption.",
    dose: "15–25mg zinc (as gluconate or picolinate)",
    timing: "With food to reduce nausea; separate from iron supplements",
  },
  "Vitamin K2": {
    tier: "Tier 2 — Emerging evidence",
    evidence: "Works synergistically with Vitamin D to direct calcium into bones rather than arteries. MK-7 form (menaquinone-7) has the longest half-life. Particularly important if supplementing high-dose Vitamin D.",
    dose: "100–200mcg MK-7 daily",
    timing: "With Vitamin D and a fatty meal",
  },
  "NAD+/NMN": {
    tier: "Tier 3 — Early research",
    evidence: "NAD+ precursors (NMN, NR) are being studied for cellular energy metabolism, DNA repair, and longevity pathways. Human evidence is early but promising, especially for older adults. Expensive with uncertain bioavailability.",
    dose: "250–500mg NMN or NR daily",
    timing: "Morning — NAD+ is involved in circadian signalling",
  },
};
