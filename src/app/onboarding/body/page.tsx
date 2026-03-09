'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/hooks/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ActivityLevel } from '@/types/user';

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: '좌식생활' },
  { value: 'light', label: '가벼운 활동' },
  { value: 'moderate', label: '보통 활동' },
  { value: 'active', label: '활동적' },
  { value: 'very_active', label: '매우 활동적' },
];

function calculateBMI(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return '저체중';
  if (bmi < 23) return '정상';
  if (bmi < 25) return '과체중';
  if (bmi < 30) return '비만';
  return '고도비만';
}

function calculateBMR(
  gender: string,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  // Mifflin-St Jeor equation
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

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

export default function BodyPage() {
  const router = useRouter();
  const { onboarding, updateOnboardingProfile, setOnboardingStep } = useStore();
  const profile = onboarding.profile;

  const bodyFat = profile.bodyFat;
  const muscleMass = profile.muscleMass ?? '';
  const activityLevel = (profile.activityLevel ?? '') as string;
  const jobType = profile.jobType ?? '';

  const bmi = useMemo(() => {
    if (profile.height && profile.weight) {
      return calculateBMI(profile.height, profile.weight);
    }
    return null;
  }, [profile.height, profile.weight]);

  const bmr = useMemo(() => {
    if (profile.gender && profile.weight && profile.height && profile.birthDate) {
      const age = getAge(profile.birthDate);
      return calculateBMR(profile.gender, profile.weight, profile.height, age);
    }
    return null;
  }, [profile.gender, profile.weight, profile.height, profile.birthDate]);

  const isValid = activityLevel !== '';

  const handleNext = () => {
    if (!isValid) return;
    setOnboardingStep(3);
    router.push('/onboarding/health');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">신체 구성</h1>
        <p className="text-sm text-muted-foreground mt-1">
          보다 정확한 분석을 위한 추가 정보를 입력해주세요.
        </p>
      </div>

      {/* BMI / BMR Summary */}
      {(bmi !== null || bmr !== null) && (
        <Card>
          <CardHeader>
            <CardTitle>신체 분석 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {bmi !== null && (
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">BMI</p>
                  <p className="text-xl font-bold">{bmi.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getBMICategory(bmi)}
                  </p>
                </div>
              )}
              {bmr !== null && (
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">기초대사량</p>
                  <p className="text-xl font-bold">{Math.round(bmr)}</p>
                  <p className="text-xs text-muted-foreground mt-1">kcal/일</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Body fat % */}
      <Card>
        <CardHeader>
          <CardTitle>
            체지방률 (%)
            <span className="text-xs font-normal text-muted-foreground ml-2">
              선택사항
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">5%</span>
            <span className="text-lg font-semibold">
              {bodyFat !== undefined ? `${bodyFat}%` : '-'}
            </span>
            <span className="text-sm text-muted-foreground">60%</span>
          </div>
          <Slider
            value={bodyFat !== undefined ? [bodyFat] : [20]}
            min={5}
            max={60}
            step={1}
            onValueChange={(value) => {
              const v = Array.isArray(value) ? value[0] : value;
              updateOnboardingProfile({ bodyFat: v });
            }}
          />
        </CardContent>
      </Card>

      {/* Muscle mass */}
      <Card>
        <CardHeader>
          <CardTitle>
            골격근량 (kg)
            <span className="text-xs font-normal text-muted-foreground ml-2">
              선택사항
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="number"
            placeholder="30"
            min={10}
            max={100}
            step={0.1}
            value={muscleMass}
            onChange={(e) =>
              updateOnboardingProfile({
                muscleMass: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
          />
        </CardContent>
      </Card>

      {/* Activity level */}
      <Card>
        <CardHeader>
          <CardTitle>활동 수준</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={activityLevel || undefined}
            onValueChange={(value) => {
              if (value) {
                updateOnboardingProfile({
                  activityLevel: value as ActivityLevel,
                });
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="활동 수준을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Job type */}
      <Card>
        <CardHeader>
          <CardTitle>
            직업 유형
            <span className="text-xs font-normal text-muted-foreground ml-2">
              선택사항
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="예: 사무직, 서비스직, 학생"
            value={jobType}
            onChange={(e) =>
              updateOnboardingProfile({ jobType: e.target.value })
            }
          />
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full"
        disabled={!isValid}
        onClick={handleNext}
      >
        다음
      </Button>
    </div>
  );
}
