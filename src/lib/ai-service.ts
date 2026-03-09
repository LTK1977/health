import type { UserProfile, UserHealth, UserExercisePrefs, UserGoal } from '@/types/user';
import type { DailyDietPlan } from '@/types/diet';
import type { DailyExercisePlan } from '@/types/exercise';
import type { WeeklyReport } from '@/types/record';

export interface AIUserContext {
  profile: UserProfile;
  health: UserHealth;
  exercisePrefs: UserExercisePrefs;
  goal: UserGoal;
  targetCalories: number;
  macros: { protein: number; carbs: number; fat: number };
}

export interface AIService {
  generateDailyDietPlan(context: AIUserContext, date: string): Promise<DailyDietPlan>;
  generateDailyExercisePlan(context: AIUserContext, date: string, dayOfWeek: number): Promise<DailyExercisePlan>;
  generateWeeklyReport(context: AIUserContext, weekData: unknown): Promise<WeeklyReport>;
  getMotivationalMessage(context: AIUserContext): Promise<string>;
}
