"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/hooks/useStore";
import {
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacros,
  calculateAge,
  calculateBMI,
  getBMICategory,
} from "@/lib/calculations";
import { fetchDietPlan, fetchExercisePlan, fetchMotivationalMessage } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Flame,
  Dumbbell,
  TrendingDown,
  Sparkles,
  Scale,
  Plus,
  CheckCircle2,
  Clock,
  Utensils,
} from "lucide-react";
import type { AIUserContext } from "@/lib/ai-service";

export default function DashboardPage() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const todayDietPlan = useStore((s) => s.todayDietPlan);
  const setTodayDietPlan = useStore((s) => s.setTodayDietPlan);
  const todayExercisePlan = useStore((s) => s.todayExercisePlan);
  const setTodayExercisePlan = useStore((s) => s.setTodayExercisePlan);
  const dietRecords = useStore((s) => s.dietRecords);
  const weightRecords = useStore((s) => s.weightRecords);
  const addWeightRecord = useStore((s) => s.addWeightRecord);

  const [motivationalMessage, setMotivationalMessage] = useState("");
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Redirect if no user
  useEffect(() => {
    if (!user) {
      router.replace("/onboarding");
    }
  }, [user, router]);

  // Compute derived values
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const formattedDate = today.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const age = user ? calculateAge(user.profile.birthDate) : 0;
  const bmr = user
    ? calculateBMR(user.profile.weight, user.profile.height, age, user.profile.gender)
    : 0;
  const tdee = user ? calculateTDEE(bmr, user.profile.activityLevel) : 0;
  const targetCalories = user
    ? calculateTargetCalories(tdee, user.goal.pace, user.profile.weight, user.goal.targetWeight)
    : 0;
  const macros = calculateMacros(targetCalories);

  const currentWeight =
    weightRecords.length > 0
      ? weightRecords[weightRecords.length - 1].weight
      : user?.profile.weight ?? 0;
  const startWeight = user?.profile.weight ?? 0;
  const bmi = user ? calculateBMI(currentWeight, user.profile.height) : 0;
  const bmiCategory = getBMICategory(bmi);

  // Sum today's consumed calories from diet records
  const todayRecords = dietRecords.filter((r) => r.date === todayStr);
  const consumedCalories = todayRecords.reduce((sum, r) => sum + r.macros.calories, 0);
  const consumedProtein = todayRecords.reduce((sum, r) => sum + r.macros.protein, 0);
  const consumedCarbs = todayRecords.reduce((sum, r) => sum + r.macros.carbs, 0);
  const consumedFat = todayRecords.reduce((sum, r) => sum + r.macros.fat, 0);

  // Build AI context
  const aiContext: AIUserContext | null = user
    ? {
        profile: user.profile,
        health: user.health,
        exercisePrefs: user.exercisePrefs,
        goal: user.goal,
        targetCalories,
        macros,
      }
    : null;

  // Generate plans and motivational message on mount
  useEffect(() => {
    if (!user || !aiContext) return;

    const generatePlans = async () => {
      setIsGenerating(true);
      try {
        // Motivational message (via API)
        const message = await fetchMotivationalMessage(user);
        setMotivationalMessage(message);

        // Diet plan (via API)
        if (!todayDietPlan || todayDietPlan.date !== todayStr) {
          const dietPlan = await fetchDietPlan(user, todayStr);
          setTodayDietPlan(dietPlan);
        }

        // Exercise plan (via API)
        if (!todayExercisePlan || todayExercisePlan.date !== todayStr) {
          const exercisePlan = await fetchExercisePlan(user, todayStr, today.getDay());
          setTodayExercisePlan(exercisePlan);
        }
      } catch (error) {
        console.error("Plan generation failed:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    generatePlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Weight record submission
  const handleWeightSubmit = () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0 || !user) return;

    addWeightRecord({
      id: `weight-${Date.now()}`,
      userId: user.id,
      date: todayStr,
      weight,
      createdAt: new Date().toISOString(),
    });
    setNewWeight("");
    setWeightDialogOpen(false);
  };

  // SVG circle progress helpers
  const circleRadius = 58;
  const circumference = 2 * Math.PI * circleRadius;
  const calorieProgress = targetCalories > 0 ? Math.min(consumedCalories / targetCalories, 1) : 0;
  const strokeDashoffset = circumference * (1 - calorieProgress);

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-4 pb-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground">
            안녕하세요, {user.name}님!
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{formattedDate}</p>
        </div>

        {/* AI Motivational Message */}
        {motivationalMessage && (
          <Card className="border-none bg-gradient-to-r from-violet-500/10 to-indigo-500/10 ring-violet-500/20">
            <CardContent className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 rounded-full bg-violet-500/20 p-2">
                <Sparkles className="size-4 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="text-sm leading-relaxed text-foreground">
                {motivationalMessage}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Calorie Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="size-4 text-orange-500" />
              오늘의 칼로리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-6">
              {/* SVG Circular Progress */}
              <div className="relative flex items-center justify-center">
                <svg width="140" height="140" className="-rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="70"
                    cy="70"
                    r={circleRadius}
                    stroke="currentColor"
                    className="text-muted/30"
                    strokeWidth="10"
                    fill="none"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="70"
                    cy="70"
                    r={circleRadius}
                    stroke="currentColor"
                    className={
                      calorieProgress >= 1
                        ? "text-red-500"
                        : calorieProgress >= 0.7
                          ? "text-orange-500"
                          : "text-emerald-500"
                    }
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">
                    {consumedCalories.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {targetCalories.toLocaleString()} kcal
                  </span>
                </div>
              </div>

              {/* Macro breakdown */}
              <div className="flex flex-col gap-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">단백질</p>
                  <p className="text-sm font-semibold text-foreground">
                    {consumedProtein}g
                  </p>
                  <p className="text-xs text-muted-foreground">
                    / {macros.protein}g
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">탄수화물</p>
                  <p className="text-sm font-semibold text-foreground">
                    {consumedCarbs}g
                  </p>
                  <p className="text-xs text-muted-foreground">
                    / {macros.carbs}g
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">지방</p>
                  <p className="text-sm font-semibold text-foreground">
                    {consumedFat}g
                  </p>
                  <p className="text-xs text-muted-foreground">
                    / {macros.fat}g
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Exercise Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="size-4 text-blue-500" />
              오늘의 운동
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isGenerating ? (
              <p className="text-sm text-muted-foreground">운동 계획을 생성 중...</p>
            ) : todayExercisePlan?.isRestDay ? (
              <div className="text-center py-3">
                <p className="text-sm font-medium text-foreground">오늘은 휴식일이에요</p>
                <p className="text-xs text-muted-foreground mt-1">
                  충분히 쉬고 내일 다시 힘내봐요!
                </p>
              </div>
            ) : todayExercisePlan ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    {todayExercisePlan.title}
                  </h3>
                  <Badge variant="secondary">
                    {todayExercisePlan.difficulty === "beginner"
                      ? "초급"
                      : todayExercisePlan.difficulty === "intermediate"
                        ? "중급"
                        : "고급"}
                  </Badge>
                </div>

                <ul className="space-y-2">
                  {todayExercisePlan.exercises.slice(0, 3).map((exercise, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{exercise.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {exercise.sets
                          ? `${exercise.sets}세트 x ${exercise.reps}회`
                          : `${exercise.durationMinutes}분`}
                      </span>
                    </li>
                  ))}
                  {todayExercisePlan.exercises.length > 3 && (
                    <li className="text-xs text-muted-foreground pl-6">
                      외 {todayExercisePlan.exercises.length - 3}개 운동
                    </li>
                  )}
                </ul>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {todayExercisePlan.totalDurationMinutes}분
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="size-3" />
                    약 {todayExercisePlan.estimatedCaloriesBurned}kcal 소모
                  </span>
                </div>

                <Link href="/exercise" className="block">
                  <Button className="w-full" size="lg">
                    <Dumbbell className="size-4 mr-1" />
                    운동 시작
                  </Button>
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">운동 계획이 없습니다.</p>
            )}
          </CardContent>
        </Card>

        {/* Weight Trend Mini Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="size-4 text-teal-500" />
              체중 변화
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {currentWeight.toFixed(1)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">kg</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    BMI {bmi}
                  </span>
                  <Badge variant="outline" className={bmiCategory.color}>
                    {bmiCategory.label}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <TrendingDown className="size-4 text-emerald-500" />
                  <span>
                    시작 {startWeight.toFixed(1)}kg → 현재 {currentWeight.toFixed(1)}kg
                  </span>
                </div>
                {currentWeight < startWeight && (
                  <p className="text-xs text-emerald-500 mt-0.5">
                    {(startWeight - currentWeight).toFixed(1)}kg 감량
                  </p>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setWeightDialogOpen(true)}
            >
              <Plus className="size-4 mr-1" />
              기록하기
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/diet">
            <Button variant="outline" className="w-full h-12 flex-col gap-0.5" size="lg">
              <Utensils className="size-4" />
              <span className="text-xs">식사 기록</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            className="w-full h-12 flex-col gap-0.5"
            size="lg"
            onClick={() => setWeightDialogOpen(true)}
          >
            <Scale className="size-4" />
            <span className="text-xs">체중 기록</span>
          </Button>
        </div>
      </div>

      {/* Weight Input Dialog */}
      <Dialog open={weightDialogOpen} onOpenChange={setWeightDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>체중 기록</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-sm text-muted-foreground">
              오늘의 체중을 입력해 주세요 (kg)
            </label>
            <Input
              type="number"
              placeholder={`예: ${currentWeight.toFixed(1)}`}
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              step="0.1"
              min="30"
              max="300"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button onClick={handleWeightSubmit} disabled={!newWeight}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
