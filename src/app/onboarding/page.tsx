'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Activity, Utensils, Target, Dumbbell } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-background">
      <div className="max-w-sm w-full flex flex-col items-center text-center gap-8">
        {/* Icon grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-center size-16 rounded-2xl bg-primary/10 text-primary">
            <Activity className="size-8" />
          </div>
          <div className="flex items-center justify-center size-16 rounded-2xl bg-green-500/10 text-green-500">
            <Utensils className="size-8" />
          </div>
          <div className="flex items-center justify-center size-16 rounded-2xl bg-orange-500/10 text-orange-500">
            <Dumbbell className="size-8" />
          </div>
          <div className="flex items-center justify-center size-16 rounded-2xl bg-blue-500/10 text-blue-500">
            <Target className="size-8" />
          </div>
        </div>

        {/* Title and description */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight">
            맞춤 건강 관리를 시작하세요
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            간단한 정보 입력으로 나에게 딱 맞는
            <br />
            식단과 운동 프로그램을 추천받으세요.
          </p>
        </div>

        {/* Steps overview */}
        <div className="w-full space-y-3 text-left">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center justify-center size-6 rounded-full bg-muted text-xs font-medium">
              1
            </span>
            기본 정보 입력
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center justify-center size-6 rounded-full bg-muted text-xs font-medium">
              2
            </span>
            신체 구성 분석
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center justify-center size-6 rounded-full bg-muted text-xs font-medium">
              3
            </span>
            건강 및 식습관 확인
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center justify-center size-6 rounded-full bg-muted text-xs font-medium">
              4
            </span>
            운동 선호도 설정
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center justify-center size-6 rounded-full bg-muted text-xs font-medium">
              5
            </span>
            목표 설정
          </div>
        </div>

        {/* CTA */}
        <Button
          size="lg"
          className="w-full text-base"
          onClick={() => router.push('/onboarding/profile')}
        >
          시작하기
        </Button>

        <p className="text-xs text-muted-foreground">
          약 3분 정도 소요됩니다
        </p>
      </div>
    </div>
  );
}
