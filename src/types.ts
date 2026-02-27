export type ExpiryRisk = 'fresh' | 'soon' | 'expired';

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  addedDate: string;
  expiryRisk: ExpiryRisk;
  estimatedDaysLeft: number;
  quantity: number;
  originalQuantity: number;
  usageHistory?: {
    usedAmount: number;
    usedDate: string;
  }[];
  unit: string; // e.g., "Half full", "pieces"
  used?: number;
  nutritionalInfo?: 'Veggies' | 'Protein' | 'Carbs';
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  healthIndicators: {
    protein: number;
    veggies: number;
    carbs: number;
  };
  tags: string[];
}

export interface UserPreferences {
  dietaryRestrictions: string[];
  fitnessGoal: 'none' | 'high-protein' | 'low-carb' | 'balanced' | 'weight-loss';
  tastes: string[];
}

export interface WasteStats {
  used: number;
  wasted: number;
  savedValue: number;
}

export interface ShoppingListItem extends Ingredient {
  purchased: boolean;
}