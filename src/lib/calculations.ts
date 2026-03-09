import type { Gender, ActivityLevel, GoalPace } from '@/types/user';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const PACE_DEFICIT: Record<GoalPace, number> = {
  slow: 300,    // kcal/day deficit
  moderate: 500,
  fast: 750,
};

/**
 * Mifflin-St Jeor 공식 기반 BMR 계산
 * 남성: 10 × 체중(kg) + 6.25 × 키(cm) - 5 × 나이 + 5
 * 여성: 10 × 체중(kg) + 6.25 × 키(cm) - 5 × 나이 - 161
 */
export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: Gender
): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}

/**
 * TDEE (Total Daily Energy Expenditure) 계산
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

/**
 * 목표 기반 일일 칼로리 계산
 */
export function calculateTargetCalories(
  tdee: number,
  pace: GoalPace,
  currentWeight: number,
  targetWeight: number
): number {
  if (targetWeight >= currentWeight) return tdee; // 감량 목표가 아닌 경우
  const deficit = PACE_DEFICIT[pace];
  const target = tdee - deficit;
  // 최소 1200kcal 보장 (안전 기준)
  return Math.max(1200, Math.round(target));
}

/**
 * 매크로(탄단지) 비율 계산
 * 비만 감량 추천 비율: 단백질 30%, 탄수화물 40%, 지방 30%
 */
export function calculateMacros(targetCalories: number) {
  const proteinRatio = 0.30;
  const carbsRatio = 0.40;
  const fatRatio = 0.30;

  return {
    calories: targetCalories,
    protein: Math.round((targetCalories * proteinRatio) / 4),  // 1g 단백질 = 4kcal
    carbs: Math.round((targetCalories * carbsRatio) / 4),      // 1g 탄수화물 = 4kcal
    fat: Math.round((targetCalories * fatRatio) / 9),           // 1g 지방 = 9kcal
  };
}

/**
 * 나이 계산
 */
export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * BMI 계산
 */
export function calculateBMI(weight: number, height: number): number {
  const heightM = height / 100;
  return Math.round((weight / (heightM * heightM)) * 10) / 10;
}

/**
 * BMI 등급 반환
 */
export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: '저체중', color: 'text-blue-500' };
  if (bmi < 23) return { label: '정상', color: 'text-green-500' };
  if (bmi < 25) return { label: '과체중', color: 'text-yellow-500' };
  if (bmi < 30) return { label: '비만', color: 'text-orange-500' };
  return { label: '고도비만', color: 'text-red-500' };
}

/**
 * 목표 달성 예상 기간 (주 단위)
 */
export function estimateWeeksToGoal(
  currentWeight: number,
  targetWeight: number,
  pace: GoalPace
): number {
  const weightToLose = currentWeight - targetWeight;
  if (weightToLose <= 0) return 0;
  // 7700 kcal ≈ 1kg 체지방
  const weeklyDeficit = PACE_DEFICIT[pace] * 7;
  const weeklyWeightLoss = weeklyDeficit / 7700;
  return Math.ceil(weightToLose / weeklyWeightLoss);
}
