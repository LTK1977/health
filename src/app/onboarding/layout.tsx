'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/hooks/useStore';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

const STEPS = [
  { path: '/onboarding/profile', label: '기본 정보', step: 1 },
  { path: '/onboarding/body', label: '신체 구성', step: 2 },
  { path: '/onboarding/health', label: '건강 & 식단', step: 3 },
  { path: '/onboarding/exercise', label: '운동', step: 4 },
  { path: '/onboarding/goal', label: '목표 설정', step: 5 },
];

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { onboarding } = useStore();

  const isIntroPage = pathname === '/onboarding';
  const currentStepInfo = STEPS.find((s) => s.path === pathname);
  const currentStep = currentStepInfo?.step ?? onboarding.currentStep;
  const progressValue = (currentStep / STEPS.length) * 100;

  const handleBack = () => {
    if (currentStep === 1) {
      router.push('/onboarding');
    } else {
      const prevStep = STEPS.find((s) => s.step === currentStep - 1);
      if (prevStep) {
        router.push(prevStep.path);
      }
    }
  };

  if (isIntroPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleBack}
              aria-label="뒤로 가기"
            >
              <ChevronLeft className="size-5" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              {currentStep} / {STEPS.length}
            </span>
            <div className="w-7" />
          </div>
          <Progress value={progressValue} />
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
