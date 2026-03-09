"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/useStore";
import { Activity, Utensils, TrendingDown, Brain } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const user = useStore((s) => s.user);

  const handleStart = () => {
    if (user?.onboardingCompleted) {
      router.push("/dashboard");
    } else {
      router.push("/onboarding");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-950 px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-green-500 text-white text-3xl font-bold shadow-lg">
            Fit
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            FitAI
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            AI가 만드는 나만의 건강 관리 플랜
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-left">
          <FeatureCard
            icon={<Brain className="w-6 h-6 text-green-500" />}
            title="AI 맞춤 분석"
            desc="개인 체질에 맞는 계획"
          />
          <FeatureCard
            icon={<Utensils className="w-6 h-6 text-orange-500" />}
            title="식단 추천"
            desc="한식 중심 건강 식단"
          />
          <FeatureCard
            icon={<Activity className="w-6 h-6 text-blue-500" />}
            title="운동 프로그램"
            desc="단계별 맞춤 루틴"
          />
          <FeatureCard
            icon={<TrendingDown className="w-6 h-6 text-purple-500" />}
            title="체중 관리"
            desc="실시간 변화 추적"
          />
        </div>

        <div className="space-y-3 pt-4">
          <Button
            onClick={handleStart}
            className="w-full h-14 text-lg bg-green-500 hover:bg-green-600 text-white rounded-2xl"
          >
            {user?.onboardingCompleted ? "대시보드로 이동" : "무료로 시작하기"}
          </Button>
          <p className="text-xs text-gray-400">
            개인정보는 안전하게 암호화되어 보관됩니다
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm border">
      {icon}
      <span className="font-semibold text-sm">{title}</span>
      <span className="text-xs text-gray-500">{desc}</span>
    </div>
  );
}
