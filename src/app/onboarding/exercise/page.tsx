'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '@/hooks/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Equipment } from '@/types/user';

const EXERCISE_TYPES = [
  '걷기',
  '조깅',
  '수영',
  '자전거',
  '근력운동',
  '요가',
  '댄스',
] as const;

const TIME_OPTIONS = [
  { value: '30', label: '30분' },
  { value: '45', label: '45분' },
  { value: '60', label: '60분' },
  { value: '90', label: '90분' },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: 'none', label: '없음' },
  { value: 'home_basic', label: '기본 홈트' },
  { value: 'home_full', label: '홈짐' },
  { value: 'gym', label: '헬스장' },
];

export default function ExercisePage() {
  const router = useRouter();
  const { onboarding, updateOnboardingExercise, setOnboardingStep } =
    useStore();
  const prefs = onboarding.exercisePrefs;

  const currentlyExercising = prefs.currentlyExercising ?? false;
  const preferredTypes = prefs.preferredTypes ?? [];
  const weeklyFrequency = prefs.weeklyFrequency ?? 3;
  const availableMinutes = prefs.availableMinutes ?? 60;
  const equipment = (prefs.equipment ?? '') as string;

  const handleTypeToggle = (type: string, checked: boolean) => {
    const updated = checked
      ? [...preferredTypes, type]
      : preferredTypes.filter((t) => t !== type);
    updateOnboardingExercise({ preferredTypes: updated });
  };

  const isValid = equipment !== '';

  const handleNext = () => {
    if (!isValid) return;
    setOnboardingStep(5);
    router.push('/onboarding/goal');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">운동 정보</h1>
        <p className="text-sm text-muted-foreground mt-1">
          운동 습관과 선호도를 알려주세요.
        </p>
      </div>

      {/* Currently exercising */}
      <Card>
        <CardHeader>
          <CardTitle>현재 운동 여부</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">현재 정기적으로 운동하고 있나요?</span>
            <Switch
              checked={currentlyExercising}
              onCheckedChange={(checked: boolean) =>
                updateOnboardingExercise({ currentlyExercising: checked })
              }
            />
          </label>
        </CardContent>
      </Card>

      {/* Preferred exercise types */}
      <Card>
        <CardHeader>
          <CardTitle>선호 운동 종류</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {EXERCISE_TYPES.map((type) => (
            <label
              key={type}
              className="flex items-center gap-3 cursor-pointer"
            >
              <Checkbox
                checked={preferredTypes.includes(type)}
                onCheckedChange={(checked: boolean) =>
                  handleTypeToggle(type, checked)
                }
              />
              <span className="text-sm">{type}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Weekly frequency */}
      <Card>
        <CardHeader>
          <CardTitle>주간 운동 횟수</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">1회</span>
            <span className="text-lg font-semibold">
              주 {weeklyFrequency}회
            </span>
            <span className="text-sm text-muted-foreground">7회</span>
          </div>
          <Slider
            value={[weeklyFrequency]}
            min={1}
            max={7}
            step={1}
            onValueChange={(value) => {
              const v = Array.isArray(value) ? value[0] : value;
              updateOnboardingExercise({ weeklyFrequency: v });
            }}
          />
        </CardContent>
      </Card>

      {/* Available time per session */}
      <Card>
        <CardHeader>
          <CardTitle>1회 운동 가능 시간</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={String(availableMinutes)}
            onValueChange={(value) => {
              if (value) {
                updateOnboardingExercise({ availableMinutes: Number(value) });
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Equipment */}
      <Card>
        <CardHeader>
          <CardTitle>운동 장비</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={equipment || undefined}
            onValueChange={(value) => {
              if (value) {
                updateOnboardingExercise({ equipment: value as Equipment });
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="운동 장비를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {EQUIPMENT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
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
