'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '@/hooks/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Gender } from '@/types/user';

export default function ProfilePage() {
  const router = useRouter();
  const { onboarding, updateOnboardingProfile, setOnboardingStep } = useStore();
  const profile = onboarding.profile;

  const gender = (profile.gender ?? '') as string;
  const birthDate = profile.birthDate ?? '';
  const height = profile.height ?? '';
  const weight = profile.weight ?? '';

  const isValid =
    gender !== '' &&
    birthDate !== '' &&
    height !== '' &&
    Number(height) > 0 &&
    weight !== '' &&
    Number(weight) > 0;

  const handleNext = () => {
    if (!isValid) return;
    setOnboardingStep(2);
    router.push('/onboarding/body');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">기본 정보</h1>
        <p className="text-sm text-muted-foreground mt-1">
          맞춤 건강 프로그램을 위해 기본 정보를 입력해주세요.
        </p>
      </div>

      {/* Gender */}
      <Card>
        <CardHeader>
          <CardTitle>성별</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={gender}
            onValueChange={(value: string) =>
              updateOnboardingProfile({ gender: value as Gender })
            }
            className="flex gap-4"
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <RadioGroupItem value="male" />
              <span className="text-sm">남성</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <RadioGroupItem value="female" />
              <span className="text-sm">여성</span>
            </label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Birth date */}
      <Card>
        <CardHeader>
          <CardTitle>생년월일</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="date"
            value={birthDate}
            onChange={(e) =>
              updateOnboardingProfile({ birthDate: e.target.value })
            }
            max={new Date().toISOString().split('T')[0]}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Height & Weight */}
      <Card>
        <CardHeader>
          <CardTitle>신체 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="height">키 (cm)</Label>
            <Input
              id="height"
              type="number"
              placeholder="170"
              min={100}
              max={250}
              value={height}
              onChange={(e) =>
                updateOnboardingProfile({
                  height: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight">체중 (kg)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="70"
              min={30}
              max={300}
              step={0.1}
              value={weight}
              onChange={(e) =>
                updateOnboardingProfile({
                  weight: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
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
