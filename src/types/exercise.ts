export type ExerciseCategory = 'cardio' | 'strength' | 'flexibility' | 'hiit' | 'rest';
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'arms' | 'core' | 'legs' | 'full_body';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ExerciseItem {
  name: string;
  category: ExerciseCategory;
  muscleGroups: MuscleGroup[];
  sets?: number;
  reps?: number;
  durationMinutes?: number;
  restSeconds?: number;
  weight?: string; // "체중", "5kg" 등
  description: string;
  videoUrl?: string;
}

export interface DailyExercisePlan {
  id: string;
  userId: string;
  date: string;
  dayOfWeek: number; // 0=일, 1=월, ...
  category: ExerciseCategory;
  title: string; // "상체 근력 운동", "유산소 운동" 등
  exercises: ExerciseItem[];
  totalDurationMinutes: number;
  estimatedCaloriesBurned: number;
  difficulty: Difficulty;
  isRestDay: boolean;
}

export interface ExerciseRecord {
  id: string;
  userId: string;
  date: string;
  exerciseName: string;
  category: ExerciseCategory;
  sets?: number;
  reps?: number;
  weight?: number;
  durationMinutes?: number;
  heartRate?: number;
  completed: boolean;
  createdAt: string;
}

export interface WeeklyExercisePlan {
  userId: string;
  weekStartDate: string;
  days: DailyExercisePlan[];
}
