import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OnboardingData, User, UserProfile, UserHealth, UserExercisePrefs, UserGoal } from '@/types/user';
import type { DailyDietPlan, DietRecord } from '@/types/diet';
import type { DailyExercisePlan, ExerciseRecord } from '@/types/exercise';
import type { WeightRecord } from '@/types/record';

interface AppState {
  // User
  user: User | null;
  setUser: (user: User) => void;

  // Onboarding
  onboarding: OnboardingData;
  setOnboardingStep: (step: number) => void;
  updateOnboardingProfile: (data: Partial<UserProfile>) => void;
  updateOnboardingHealth: (data: Partial<UserHealth>) => void;
  updateOnboardingExercise: (data: Partial<UserExercisePrefs>) => void;
  updateOnboardingGoal: (data: Partial<UserGoal>) => void;
  completeOnboarding: () => void;

  // Diet
  todayDietPlan: DailyDietPlan | null;
  setTodayDietPlan: (plan: DailyDietPlan) => void;
  dietRecords: DietRecord[];
  addDietRecord: (record: DietRecord) => void;

  // Exercise
  todayExercisePlan: DailyExercisePlan | null;
  setTodayExercisePlan: (plan: DailyExercisePlan) => void;
  exerciseRecords: ExerciseRecord[];
  addExerciseRecord: (record: ExerciseRecord) => void;
  toggleExerciseComplete: (recordId: string) => void;

  // Weight
  weightRecords: WeightRecord[];
  addWeightRecord: (record: WeightRecord) => void;

  // UI
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const initialOnboarding: OnboardingData = {
  profile: {},
  health: {
    conditions: [],
    medications: [],
    allergies: [],
    dietaryPreference: 'none',
    mealsPerDay: 3,
    dislikedFoods: [],
    preferredFoods: [],
  },
  exercisePrefs: {
    currentlyExercising: false,
    preferredTypes: [],
    weeklyFrequency: 3,
    availableMinutes: 60,
    equipment: 'none',
  },
  goal: {},
  currentStep: 1,
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),

      // Onboarding
      onboarding: initialOnboarding,
      setOnboardingStep: (step) =>
        set((state) => ({ onboarding: { ...state.onboarding, currentStep: step } })),
      updateOnboardingProfile: (data) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            profile: { ...state.onboarding.profile, ...data },
          },
        })),
      updateOnboardingHealth: (data) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            health: { ...state.onboarding.health, ...data },
          },
        })),
      updateOnboardingExercise: (data) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            exercisePrefs: { ...state.onboarding.exercisePrefs, ...data },
          },
        })),
      updateOnboardingGoal: (data) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            goal: { ...state.onboarding.goal, ...data },
          },
        })),
      completeOnboarding: () =>
        set((state) => {
          const { profile, health, exercisePrefs, goal } = state.onboarding;
          const user: User = {
            id: 'user-1',
            email: 'user@example.com',
            name: '사용자',
            profile: profile as UserProfile,
            health: health as UserHealth,
            exercisePrefs: exercisePrefs as UserExercisePrefs,
            goal: goal as UserGoal,
            createdAt: new Date().toISOString(),
            onboardingCompleted: true,
          };
          return { user, onboarding: { ...state.onboarding, currentStep: 6 } };
        }),

      // Diet
      todayDietPlan: null,
      setTodayDietPlan: (plan) => set({ todayDietPlan: plan }),
      dietRecords: [],
      addDietRecord: (record) =>
        set((state) => ({ dietRecords: [...state.dietRecords, record] })),

      // Exercise
      todayExercisePlan: null,
      setTodayExercisePlan: (plan) => set({ todayExercisePlan: plan }),
      exerciseRecords: [],
      addExerciseRecord: (record) =>
        set((state) => ({ exerciseRecords: [...state.exerciseRecords, record] })),
      toggleExerciseComplete: (recordId) =>
        set((state) => ({
          exerciseRecords: state.exerciseRecords.map((r) =>
            r.id === recordId ? { ...r, completed: !r.completed } : r
          ),
        })),

      // Weight
      weightRecords: [],
      addWeightRecord: (record) =>
        set((state) => ({ weightRecords: [...state.weightRecords, record] })),

      // UI
      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    }),
    { name: 'health-app-storage' }
  )
);
