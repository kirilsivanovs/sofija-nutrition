/**
 * Meal item representing a single food item with nutritional information
 */
export interface MealItem {
  name: string;
  nameEn: string;
  weight: number; // grams
  calories: number;
  protein: number; // grams
  fat: number; // grams
  carbs: number; // grams
  confidence: number; // 0-1
  userAdjusted: boolean;
}

/**
 * Meal type classification
 */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/**
 * Complete meal entry
 */
export interface Meal {
  PartitionKey: string; // `${userId}_${YYYY-MM-DD}`
  RowKey: string; // meal ID or timestamp
  userId: string;
  mealType: MealType;
  photoUrl?: string;
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  confirmed: boolean;
  createdAt: string; // ISO date
  confirmedAt?: string; // ISO date
}

/**
 * Result from AI food analysis
 */
export interface FoodAnalysisResult {
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  mealType: MealType;
}

/**
 * Daily nutrition statistics
 */
export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  mealsCount: number;
  targetCalories?: number;
  targetProtein?: number;
  targetFat?: number;
  targetCarbs?: number;
}
