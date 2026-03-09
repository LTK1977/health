export interface WeightRecord {
  id: string;
  userId: string;
  date: string;
  weight: number;
  bodyFat?: number;
  note?: string;
  createdAt: string;
}

export interface DailyProgress {
  date: string;
  caloriesConsumed: number;
  caloriesTarget: number;
  exerciseCompleted: boolean;
  exerciseDurationMinutes: number;
  weight?: number;
}

export interface WeeklyReport {
  weekStartDate: string;
  weekEndDate: string;
  avgCaloriesConsumed: number;
  avgCaloriesTarget: number;
  dietComplianceRate: number; // 0~100%
  exerciseComplianceRate: number; // 0~100%
  weightStart: number;
  weightEnd: number;
  weightChange: number;
  aiSummary: string;
  aiRecommendation: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
  condition: string;
}

export interface UserStats {
  currentStreak: number; // 연속 기록 일수
  longestStreak: number;
  totalWorkouts: number;
  totalDietRecords: number;
  weightLost: number;
  badges: Badge[];
}
