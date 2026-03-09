"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/hooks/useStore";
import {
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacros,
  calculateAge,
} from "@/lib/calculations";
import { fetchWeeklyReport } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingDown,
  Trophy,
  Target,
  Award,
  Flame,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import type { WeeklyReport } from "@/types/record";
import type { AIUserContext } from "@/lib/ai-service";

// ------- Badge definitions -------
interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: typeof Trophy;
}

const BADGE_DEFS: BadgeDef[] = [
  {
    id: "first-record",
    name: "첫 기록",
    description: "첫 식단/운동 기록 달성",
    icon: Award,
  },
  {
    id: "streak-3",
    name: "3일 연속",
    description: "3일 연속 기록 달성",
    icon: Flame,
  },
  {
    id: "streak-7",
    name: "7일 연속",
    description: "7일 연속 기록 달성",
    icon: Flame,
  },
  {
    id: "lost-1kg",
    name: "첫 1kg 감량",
    description: "처음으로 1kg 감량 성공",
    icon: TrendingDown,
  },
  {
    id: "lost-5kg",
    name: "5kg 감량",
    description: "총 5kg 감량 달성",
    icon: TrendingDown,
  },
  {
    id: "exercise-king",
    name: "운동왕",
    description: "20회 운동 완료",
    icon: Trophy,
  },
  {
    id: "diet-master",
    name: "식단 마스터",
    description: "7일 연속 식단 기록",
    icon: Target,
  },
  {
    id: "consistency-king",
    name: "꾸준함의 왕",
    description: "30일 연속 기록 달성",
    icon: Calendar,
  },
];

// ------- Helpers -------

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}`;
}

/** Count the longest consecutive-day streak in a sorted array of date strings. */
function getConsecutiveStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const unique = [...new Set(dates)].sort();
  let maxStreak = 1;
  let current = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      current++;
      maxStreak = Math.max(maxStreak, current);
    } else {
      current = 1;
    }
  }
  return maxStreak;
}

/** Generate mock weight data for the last N days trending downward. */
function generateMockWeightData(startWeight: number, days: number) {
  const data: { date: string; weight: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const noise = (Math.random() - 0.4) * 0.3;
    const trend = startWeight - ((days - 1 - i) / (days - 1)) * 2;
    data.push({
      date: dateStr,
      weight: Math.round((trend + noise) * 10) / 10,
    });
  }
  return data;
}

/** Generate mock calorie data for last 7 days. */
function generateMockCalorieData(targetCalories: number) {
  const data: { date: string; calories: number; target: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    data.push({
      date: dateStr,
      calories: Math.round(1500 + Math.random() * 700),
      target: targetCalories,
    });
  }
  return data;
}

// ------- Main Component -------

export default function ReportPage() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const weightRecords = useStore((s) => s.weightRecords);
  const dietRecords = useStore((s) => s.dietRecords);
  const exerciseRecords = useStore((s) => s.exerciseRecords);

  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Redirect if not onboarded
  useEffect(() => {
    if (!user) {
      router.replace("/onboarding");
    }
  }, [user, router]);

  // Derived values
  const age = user ? calculateAge(user.profile.birthDate) : 0;
  const bmr = user
    ? calculateBMR(user.profile.weight, user.profile.height, age, user.profile.gender)
    : 0;
  const tdee = user ? calculateTDEE(bmr, user.profile.activityLevel) : 0;
  const targetCalories = user
    ? calculateTargetCalories(tdee, user.goal.pace, user.profile.weight, user.goal.targetWeight)
    : 0;
  const macros = calculateMacros(targetCalories);

  const startWeight = user?.profile.weight ?? 85;
  const targetWeight = user?.goal.targetWeight ?? 75;
  const currentWeight =
    weightRecords.length > 0
      ? weightRecords[weightRecords.length - 1].weight
      : startWeight;

  const totalToLose = startWeight - targetWeight;
  const lostSoFar = startWeight - currentWeight;
  const progressPercent =
    totalToLose > 0 ? Math.min(Math.max((lostSoFar / totalToLose) * 100, 0), 100) : 0;

  // Days remaining estimation
  const remainingKg = Math.max(currentWeight - targetWeight, 0);
  const weeklyLossRate =
    user?.goal.pace === "fast" ? 0.75 : user?.goal.pace === "slow" ? 0.3 : 0.5;
  const daysRemaining =
    remainingKg > 0 ? Math.ceil((remainingKg / weeklyLossRate) * 7) : 0;

  // AI context
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

  // Load weekly report on mount
  useEffect(() => {
    if (!user) return;
    setReportLoading(true);
    fetchWeeklyReport(user)
      .then((report) => setWeeklyReport(report))
      .catch(console.error)
      .finally(() => setReportLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ------- Weight tab data -------
  const weightChartData = useMemo(() => {
    if (weightRecords.length > 0) {
      return weightRecords.map((r) => ({
        date: r.date,
        weight: r.weight,
      }));
    }
    return generateMockWeightData(startWeight, 30);
  }, [weightRecords, startWeight]);

  const minWeight = useMemo(
    () =>
      weightChartData.length > 0
        ? Math.min(...weightChartData.map((d) => d.weight))
        : 0,
    [weightChartData]
  );
  const avgWeight = useMemo(
    () =>
      weightChartData.length > 0
        ? weightChartData.reduce((s, d) => s + d.weight, 0) / weightChartData.length
        : 0,
    [weightChartData]
  );
  const totalLost = useMemo(
    () =>
      weightChartData.length >= 2
        ? weightChartData[0].weight - weightChartData[weightChartData.length - 1].weight
        : 0,
    [weightChartData]
  );

  // ------- Diet tab data -------
  const calorieChartData = useMemo(() => {
    if (dietRecords.length > 0) {
      const now = new Date();
      const days: { date: string; calories: number; target: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const dayRecords = dietRecords.filter((r) => r.date === dateStr);
        const cal = dayRecords.reduce((s, r) => s + r.macros.calories, 0);
        days.push({ date: dateStr, calories: cal, target: targetCalories });
      }
      return days;
    }
    return generateMockCalorieData(targetCalories);
  }, [dietRecords, targetCalories]);

  const avgDailyCalories = useMemo(() => {
    const withCalories = calorieChartData.filter((d) => d.calories > 0);
    return withCalories.length > 0
      ? Math.round(withCalories.reduce((s, d) => s + d.calories, 0) / withCalories.length)
      : 0;
  }, [calorieChartData]);

  const dietComplianceRate = useMemo(() => {
    const withCalories = calorieChartData.filter((d) => d.calories > 0);
    if (withCalories.length === 0) return 0;
    const withinTarget = withCalories.filter(
      (d) => Math.abs(d.calories - targetCalories) <= targetCalories * 0.1
    );
    return Math.round((withinTarget.length / withCalories.length) * 100);
  }, [calorieChartData, targetCalories]);

  // ------- Exercise tab data -------
  const exerciseStats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (exerciseRecords.length > 0) {
      const completedRecords = exerciseRecords.filter((r) => r.completed);

      // This week unique exercise days
      const weekDays = new Set(
        completedRecords
          .filter((r) => new Date(r.date) >= startOfWeek)
          .map((r) => r.date)
      );

      // This month
      const monthRecords = completedRecords.filter(
        (r) => new Date(r.date) >= startOfMonth
      );
      const monthDays = new Set(monthRecords.map((r) => r.date));
      const totalMinutes = monthRecords.reduce(
        (s, r) => s + (r.durationMinutes ?? 30),
        0
      );
      const estimatedCalories = monthRecords.length * 300;

      return {
        weekDays: weekDays.size,
        weekTarget: user?.exercisePrefs.weeklyFrequency ?? 5,
        monthWorkouts: monthDays.size,
        monthMinutes: totalMinutes,
        monthCalories: estimatedCalories,
      };
    }

    // Mock data for demo
    return {
      weekDays: 3,
      weekTarget: user?.exercisePrefs.weeklyFrequency ?? 5,
      monthWorkouts: 12,
      monthMinutes: 480,
      monthCalories: 3600,
    };
  }, [exerciseRecords, user]);

  // ------- Badges -------
  const earnedBadgeIds = useMemo(() => {
    const earned = new Set<string>();

    const allDietDates = dietRecords.map((r) => r.date);
    const allExerciseDates = exerciseRecords
      .filter((r) => r.completed)
      .map((r) => r.date);
    const allRecordDates = [...allDietDates, ...allExerciseDates];

    // First record
    if (dietRecords.length > 0 || exerciseRecords.length > 0) {
      earned.add("first-record");
    }

    // Streaks (combined)
    const combinedStreak = getConsecutiveStreak(allRecordDates);
    if (combinedStreak >= 3) earned.add("streak-3");
    if (combinedStreak >= 7) earned.add("streak-7");
    if (combinedStreak >= 30) earned.add("consistency-king");

    // Weight loss
    if (lostSoFar >= 1) earned.add("lost-1kg");
    if (lostSoFar >= 5) earned.add("lost-5kg");

    // Exercise king (20 completed)
    if (exerciseRecords.filter((r) => r.completed).length >= 20) {
      earned.add("exercise-king");
    }

    // Diet master (7 consecutive days of diet records)
    const dietStreak = getConsecutiveStreak(allDietDates);
    if (dietStreak >= 7) earned.add("diet-master");

    return earned;
  }, [dietRecords, exerciseRecords, lostSoFar]);

  // ------- Render -------

  if (!user) {
    return null;
  }

  const exerciseWeekPercent =
    exerciseStats.weekTarget > 0
      ? Math.min((exerciseStats.weekDays / exerciseStats.weekTarget) * 100, 100)
      : 0;
  const exerciseCircleRadius = 40;
  const exerciseCircumference = 2 * Math.PI * exerciseCircleRadius;
  const exerciseStrokeDashoffset =
    exerciseCircumference * (1 - exerciseWeekPercent / 100);

  return (
    <AppLayout>
      <div className="space-y-4 pb-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-emerald-500" />
          <h1 className="text-xl font-bold text-foreground">리포트</h1>
        </div>

        {/* Goal Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-4 text-blue-500" />
              목표 달성률
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {currentWeight.toFixed(1)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    kg
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">현재</p>
              </div>
              <div className="flex-1 mx-4">
                <TrendingDown className="size-5 text-emerald-500 mx-auto" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {targetWeight.toFixed(1)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    kg
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">목표</p>
              </div>
            </div>

            <Progress value={progressPercent} />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                시작 {startWeight.toFixed(1)}kg &rarr; 목표{" "}
                {targetWeight.toFixed(1)}kg, 현재 {currentWeight.toFixed(1)}kg
              </span>
              <Badge variant="secondary">
                {Math.round(progressPercent)}% 달성
              </Badge>
            </div>

            {daysRemaining > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                예상 남은 기간:{" "}
                <span className="font-medium text-foreground">
                  약 {daysRemaining}일
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="weight">
          <TabsList className="w-full">
            <TabsTrigger value="weight" className="flex-1">
              체중
            </TabsTrigger>
            <TabsTrigger value="diet" className="flex-1">
              식단
            </TabsTrigger>
            <TabsTrigger value="exercise" className="flex-1">
              운동
            </TabsTrigger>
            <TabsTrigger value="badges" className="flex-1">
              배지
            </TabsTrigger>
          </TabsList>

          {/* ===== Tab 1: Weight ===== */}
          <TabsContent value="weight">
            <div className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">체중 변화 추이</CardTitle>
                </CardHeader>
                <CardContent>
                  {weightRecords.length === 0 && (
                    <p className="text-xs text-muted-foreground mb-2">
                      * 데모 데이터가 표시되고 있습니다
                    </p>
                  )}
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={weightChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        domain={["dataMin - 1", "dataMax + 1"]}
                        tick={{ fontSize: 11 }}
                        unit="kg"
                      />
                      <Tooltip
                        formatter={(value: unknown) => [
                          `${Number(value).toFixed(1)}kg`,
                          "체중",
                        ]}
                        labelFormatter={(label: unknown) => formatDate(String(label))}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Weight stats cards */}
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="text-center py-3">
                    <p className="text-xs text-muted-foreground">최저 체중</p>
                    <p className="text-lg font-bold text-foreground">
                      {minWeight.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">kg</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="text-center py-3">
                    <p className="text-xs text-muted-foreground">평균 체중</p>
                    <p className="text-lg font-bold text-foreground">
                      {avgWeight.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">kg</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="text-center py-3">
                    <p className="text-xs text-muted-foreground">총 감량</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {totalLost > 0 ? `-${totalLost.toFixed(1)}` : "0"}
                    </p>
                    <p className="text-xs text-muted-foreground">kg</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ===== Tab 2: Diet ===== */}
          <TabsContent value="diet">
            <div className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    최근 7일 칼로리 섭취
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dietRecords.length === 0 && (
                    <p className="text-xs text-muted-foreground mb-2">
                      * 데모 데이터가 표시되고 있습니다
                    </p>
                  )}
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={calorieChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis tick={{ fontSize: 11 }} unit="kcal" />
                      <Tooltip
                        formatter={(value: unknown, name: unknown) => [
                          `${Number(value).toLocaleString()}kcal`,
                          String(name) === "calories" ? "섭취" : "목표",
                        ]}
                        labelFormatter={(label: unknown) => formatDate(String(label))}
                      />
                      <Legend
                        formatter={(value: string) =>
                          value === "calories" ? "섭취 칼로리" : "목표 칼로리"
                        }
                      />
                      <Bar
                        dataKey="calories"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#ef4444"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Diet stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="text-center py-4">
                    <p className="text-xs text-muted-foreground">
                      일평균 칼로리
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {avgDailyCalories.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      / {targetCalories.toLocaleString()} kcal
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="text-center py-4">
                    <p className="text-xs text-muted-foreground">
                      식단 준수율
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {dietComplianceRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      목표 +-10% 이내
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ===== Tab 3: Exercise ===== */}
          <TabsContent value="exercise">
            <div className="space-y-4 mt-4">
              {/* Weekly progress ring */}
              <Card>
                <CardContent className="flex flex-col items-center py-6">
                  <p className="text-sm font-medium text-foreground mb-4">
                    이번 주 운동 현황
                  </p>
                  <div className="relative flex items-center justify-center">
                    <svg width="100" height="100" className="-rotate-90">
                      <circle
                        cx="50"
                        cy="50"
                        r={exerciseCircleRadius}
                        stroke="currentColor"
                        className="text-muted/30"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r={exerciseCircleRadius}
                        stroke="currentColor"
                        className="text-blue-500"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={exerciseCircumference}
                        strokeDashoffset={exerciseStrokeDashoffset}
                        style={{ transition: "stroke-dashoffset 0.6s ease" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-foreground">
                        {exerciseStats.weekDays}/{exerciseStats.weekTarget}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        일
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    이번 주{" "}
                    <span className="font-semibold text-foreground">
                      {exerciseStats.weekDays}/{exerciseStats.weekTarget}일
                    </span>{" "}
                    운동 완료
                  </p>
                </CardContent>
              </Card>

              {/* Monthly stats */}
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="text-center py-3">
                    <p className="text-xs text-muted-foreground">
                      이번 달 운동
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {exerciseStats.monthWorkouts}
                    </p>
                    <p className="text-xs text-muted-foreground">회</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="text-center py-3">
                    <p className="text-xs text-muted-foreground">
                      총 운동 시간
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {exerciseStats.monthMinutes.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">분</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="text-center py-3">
                    <p className="text-xs text-muted-foreground">
                      예상 소모
                    </p>
                    <p className="text-lg font-bold text-orange-500">
                      {exerciseStats.monthCalories.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">kcal</p>
                  </CardContent>
                </Card>
              </div>

              {exerciseRecords.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  * 데모 데이터가 표시되고 있습니다
                </p>
              )}
            </div>
          </TabsContent>

          {/* ===== Tab 4: Badges ===== */}
          <TabsContent value="badges">
            <div className="mt-4">
              <div className="grid grid-cols-3 gap-3">
                {BADGE_DEFS.map((badge) => {
                  const isEarned = earnedBadgeIds.has(badge.id);
                  const IconComponent = badge.icon;
                  return (
                    <Card
                      key={badge.id}
                      className={
                        isEarned
                          ? "border-emerald-200 dark:border-emerald-800"
                          : "opacity-50"
                      }
                    >
                      <CardContent className="flex flex-col items-center text-center py-4 gap-2">
                        <div
                          className={`rounded-full p-2 ${
                            isEarned
                              ? "bg-emerald-100 dark:bg-emerald-900"
                              : "bg-gray-100 dark:bg-gray-800"
                          }`}
                        >
                          <IconComponent
                            className={`size-5 ${
                              isEarned
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-gray-400 dark:text-gray-600"
                            }`}
                          />
                        </div>
                        <p
                          className={`text-xs font-semibold ${
                            isEarned
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {badge.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          {badge.description}
                        </p>
                        {isEarned && (
                          <Badge variant="default" className="text-[10px]">
                            획득
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* AI Weekly Report Card */}
        <Card className="border-none bg-gradient-to-r from-violet-500/10 to-indigo-500/10 ring-violet-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4 text-violet-600 dark:text-violet-400" />
              AI 주간 분석
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reportLoading ? (
              <p className="text-sm text-muted-foreground">
                분석 보고서를 생성 중...
              </p>
            ) : weeklyReport ? (
              <>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    요약
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {weeklyReport.aiSummary}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    추천
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {weeklyReport.aiRecommendation}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/50 dark:bg-white/5 p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      식단 준수율
                    </p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {weeklyReport.dietComplianceRate}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/50 dark:bg-white/5 p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      운동 준수율
                    </p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {weeklyReport.exerciseComplianceRate}%
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                보고서를 불러올 수 없습니다.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
