export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Macros {
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  fiber?: number; // g
}

export interface MenuItem {
  name: string;
  amount: string; // "1인분", "200g" 등
  macros: Macros;
  description?: string;
}

export interface Meal {
  type: MealType;
  items: MenuItem[];
  totalMacros: Macros;
}

export interface DailyDietPlan {
  id: string;
  userId: string;
  date: string;
  meals: Meal[];
  totalMacros: Macros;
  targetCalories: number;
  note?: string;
}

export interface DietRecord {
  id: string;
  userId: string;
  date: string;
  mealType: MealType;
  foodName: string;
  amount: string;
  macros: Macros;
  photoUrl?: string;
  createdAt: string;
}

export interface WeeklyDietPlan {
  userId: string;
  weekStartDate: string;
  days: DailyDietPlan[];
  shoppingList: ShoppingItem[];
}

export interface ShoppingItem {
  name: string;
  amount: string;
  category: string;
}
