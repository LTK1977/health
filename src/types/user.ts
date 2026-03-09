export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type DietaryPreference = 'none' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'low_carb';
export type GoalPace = 'slow' | 'moderate' | 'fast';
export type Equipment = 'none' | 'home_basic' | 'home_full' | 'gym';

export interface UserProfile {
  id: string;
  gender: Gender;
  birthDate: string;
  height: number; // cm
  weight: number; // kg
  bodyFat?: number; // %
  muscleMass?: number; // kg
  activityLevel: ActivityLevel;
  jobType: string;
}

export interface UserHealth {
  conditions: string[]; // 기저질환
  medications: string[];
  allergies: string[];
  dietaryPreference: DietaryPreference;
  mealsPerDay: number;
  dislikedFoods: string[];
  preferredFoods: string[];
}

export interface UserExercisePrefs {
  currentlyExercising: boolean;
  preferredTypes: string[];
  weeklyFrequency: number; // 주당 횟수
  availableMinutes: number; // 1회 가능 시간(분)
  equipment: Equipment;
}

export interface UserGoal {
  targetWeight: number; // kg
  targetBodyFat?: number; // %
  targetPeriodMonths: number;
  pace: GoalPace;
}

export interface User {
  id: string;
  email: string;
  name: string;
  profile: UserProfile;
  health: UserHealth;
  exercisePrefs: UserExercisePrefs;
  goal: UserGoal;
  createdAt: string;
  onboardingCompleted: boolean;
}

export interface OnboardingData {
  profile: Partial<UserProfile>;
  health: Partial<UserHealth>;
  exercisePrefs: Partial<UserExercisePrefs>;
  goal: Partial<UserGoal>;
  currentStep: number;
}
