'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/hooks/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { GoalPace } from '@/types/user';

const PERIOD_OPTIONS = [
  { value: '3', label: '3개월' },
  { value: '6', label: '6개월' },
  { value: '9', label: '9개월' },
  { value: '12', label: '12개월' },
];

const PACE_OPTIONS: { value: GoalPace; label: string; desc: string }[] = [
  { value: 'slow', label: '천천히', desc: '주 0.25~0.5kg 감량' },
  { value: 'moderate', label: '보통', desc: '주 0.5~0.75kg 감량' },
  { value: 'fast', label: '빠르게', desc: '주 0.75~1kg 감량' },
];

const ACTIVITY_MULTIPLIER: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

function getAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function calculateBMR(
  gender: string,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

export default function GoalPage() {
  const router = useRouter();
  const {
    onboarding,
    updateOnboardingGoal,
    setOnboardingStep,
    completeOnboarding,
  } = useStore();
  const goal = onboarding.goal;
  const profile = onboarding.profile;

  const targetWeight = goal.targetWeight ?? '';
  const targetPeriodMonths = goal.targetPeriodMonths ?? '';
  const pace = (goal.pace ?? '') as string;

  const currentWeight = profile.weight ?? 0;

  const summary = useMemo(() => {
    if (
      !targetWeight ||
      !targetPeriodMonths ||
      !pace ||
      !currentWeight
    ) {
      return null;
    }

    const tw = Number(targetWeight);
    const weeks = Number(targetPeriodMonths) * 4.33;
    const totalDiff = currentWeight - tw;
    const weeklyLoss = totalDiff / weeks;

    // Calculate TDEE-based calorie target
    let tdee: number | null = null;
    if (profile.gender && profile.height && profile.birthDate && profile.activityLevel) {
      const age = getAge(profile.birthDate);
      const bmr = calculateBMR(profile.gender, currentWeight, profile.height, age);
      const multiplier = ACTIVITY_MULTIPLIER[profile.activityLevel] ?? 1.55;
      tdee = bmr * multiplier;
    }

    // Calorie deficit per day for the weekly weight loss
    // 1kg of fat ~ 7700 kcal
    const dailyDeficit = (weeklyLoss * 7700) / 7;
    const recommendedCalories = tdee ? Math.round(tdee - dailyDeficit) : null;

    return {
      weeklyLoss: Math.abs(weeklyLoss),
      isGaining: totalDiff < 0,
      recommendedCalories,
      totalDiff: Math.abs(totalDiff),
    };
  }, [targetWeight, targetPeriodMonths, pace, currentWeight, profile]);

  const isValid =
    targetWeight !== '' &&
    Number(targetWeight) > 0 &&
    targetPeriodMonths !== '' &&
    pace !== '';

  const handleComplete = () => {
    if (!isValid) return;
    completeOnboarding();
    router.push('/dashboard');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">목표 설정</h1>
        <p className="text-sm text-muted-foreground mt-1">
          달성하고 싶은 목표를 설정해주세요.
        </p>
      </div>

      {/* Target weight */}
      <Card>
        <CardHeader>
          <CardTitle>목표 체중 (kg)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {currentWeight > 0 && (
            <p className="text-sm text-muted-foreground">
              현재 체중: {currentWeight}kg
            </p>
          )}
          <Input
            type="number"
            placeholder="65"
            min={30}
            max={300}
            step={0.1}
            value={targetWeight}
            onChange={(e) =>
              updateOnboardingGoal({
                targetWeight: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
          />
        </CardContent>
      </Card>

      {/* Target period */}
      <Card>
        <CardHeader>
          <CardTitle>목표 기간</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={targetPeriodMonths ? String(targetPeriodMonths) : undefined}
            onValueChange={(value) => {
              if (value) {
                updateOnboardingGoal({ targetPeriodMonths: Number(value) });
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="기간을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Pace */}
      <Card>
        <CardHeader>
          <CardTitle>변화 속도</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={pace}
            onValueChange={(value: string) =>
              updateOnboardingGoal({ pace: value as GoalPace })
            }
            className="space-y-3"
          >
            {PACE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors has-[span[data-checked]]:border-primary has-[span[data-checked]]:bg-primary/5"
              >
                <RadioGroupItem value={option.value} className="mt-0.5" />
                <div>
                  <span className="text-sm font-medium">{option.label}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {option.desc}
                  </p>
                </div>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>예상 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">
                  총 {summary.isGaining ? '증량' : '감량'} 목표
                </span>
                <span className="text-sm font-medium">
                  {summary.totalDiff.toFixed(1)}kg
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">
                  주간 예상 {summary.isGaining ? '증량' : '감량'}
                </span>
                <span className="text-sm font-medium">
                  {summary.weeklyLoss.toFixed(2)}kg/주
                </span>
              </div>
              {summary.recommendedCalories && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">
                    일일 권장 칼로리
                  </span>
                  <span className="text-sm font-medium">
                    {summary.recommendedCalories}kcal
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={!isValid}
        onClick={handleComplete}
      >
        완료
      </Button>
    </div>
  );
}
