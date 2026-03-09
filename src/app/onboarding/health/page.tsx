'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/hooks/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DietaryPreference } from '@/types/user';

const MEDICAL_CONDITIONS = [
  { value: '당뇨', label: '당뇨' },
  { value: '고혈압', label: '고혈압' },
  { value: '고지혈증', label: '고지혈증' },
  { value: '관절질환', label: '관절질환' },
  { value: '없음', label: '없음' },
] as const;

const DIETARY_OPTIONS: { value: DietaryPreference; label: string }[] = [
  { value: 'none', label: '없음' },
  { value: 'vegetarian', label: '채식' },
  { value: 'vegan', label: '비건' },
  { value: 'pescatarian', label: '페스코' },
  { value: 'keto', label: '키토' },
  { value: 'low_carb', label: '저탄수' },
];

const MEALS_OPTIONS = [2, 3, 4, 5];

export default function HealthPage() {
  const router = useRouter();
  const { onboarding, updateOnboardingHealth, setOnboardingStep } = useStore();
  const health = onboarding.health;

  const conditions = health.conditions ?? [];
  const allergiesText =
    health.allergies && health.allergies.length > 0
      ? health.allergies.join(', ')
      : '';
  const dietaryPreference = (health.dietaryPreference ?? '') as string;
  const mealsPerDay = health.mealsPerDay ?? 3;

  const [localAllergies, setLocalAllergies] = useState(allergiesText);

  const handleConditionToggle = (condition: string, checked: boolean) => {
    let newConditions: string[];

    if (condition === '없음') {
      newConditions = checked ? ['없음'] : [];
    } else {
      const filtered = conditions.filter((c) => c !== '없음');
      if (checked) {
        newConditions = [...filtered, condition];
      } else {
        newConditions = filtered.filter((c) => c !== condition);
      }
    }

    updateOnboardingHealth({ conditions: newConditions });
  };

  const handleAllergiesChange = (value: string) => {
    setLocalAllergies(value);
    const allergies = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    updateOnboardingHealth({ allergies });
  };

  const isValid = conditions.length > 0 && dietaryPreference !== '';

  const handleNext = () => {
    if (!isValid) return;
    setOnboardingStep(4);
    router.push('/onboarding/exercise');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">건강 & 식단</h1>
        <p className="text-sm text-muted-foreground mt-1">
          건강 상태와 식습관을 알려주세요.
        </p>
      </div>

      {/* Medical conditions */}
      <Card>
        <CardHeader>
          <CardTitle>기저질환</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {MEDICAL_CONDITIONS.map((condition) => (
            <label
              key={condition.value}
              className="flex items-center gap-3 cursor-pointer"
            >
              <Checkbox
                checked={conditions.includes(condition.value)}
                onCheckedChange={(checked: boolean) =>
                  handleConditionToggle(condition.value, checked)
                }
              />
              <span className="text-sm">{condition.label}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Allergies */}
      <Card>
        <CardHeader>
          <CardTitle>
            알레르기
            <span className="text-xs font-normal text-muted-foreground ml-2">
              선택사항
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="예: 땅콩, 갑각류, 유제품 (쉼표로 구분)"
            value={localAllergies}
            onChange={(e) => handleAllergiesChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-2">
            여러 항목은 쉼표(,)로 구분해주세요.
          </p>
        </CardContent>
      </Card>

      {/* Dietary preference */}
      <Card>
        <CardHeader>
          <CardTitle>식단 선호</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={dietaryPreference || undefined}
            onValueChange={(value) => {
              if (value) {
                updateOnboardingHealth({
                  dietaryPreference: value as DietaryPreference,
                });
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="식단 유형을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {DIETARY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Meals per day */}
      <Card>
        <CardHeader>
          <CardTitle>하루 식사 횟수</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={String(mealsPerDay)}
            onValueChange={(value) => {
              if (value) {
                updateOnboardingHealth({ mealsPerDay: Number(value) });
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEALS_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}끼
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
