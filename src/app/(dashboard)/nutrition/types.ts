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
    "Vitamin D": true,
    "Omega-3": true,
    "Whey protein": true,
    "Magnesium glycinate": true,
  },
};
