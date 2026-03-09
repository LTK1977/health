"use client";

import { useEffect, useRef, useState } from "react";
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
import { fetchDietPlan } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Utensils,
  Plus,
  Coffee,
  Sun,
  Moon,
  Cookie,
  ChevronRight,
} from "lucide-react";
import type { MealType } from "@/types/diet";
import type { AIUserContext } from "@/lib/ai-service";

const MEAL_CONFIG: Record<
  MealType,
  { label: string; icon: typeof Coffee; color: string; badgeVariant: string }
> = {
  breakfast: {
    label: "아침",
    icon: Coffee,
    color: "text-amber-500",
    badgeVariant: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  lunch: {
    label: "점심",
    icon: Sun,
    color: "text-orange-500",
    badgeVariant: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  dinner: {
    label: "저녁",
    icon: Moon,
    color: "text-indigo-500",
    badgeVariant: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  snack: {
    label: "간식",
    icon: Cookie,
    color: "text-pink-500",
    badgeVariant: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  },
};

export default function DietPage() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const todayDietPlan = useStore((s) => s.todayDietPlan);
  const setTodayDietPlan = useStore((s) => s.setTodayDietPlan);
  const dietRecords = useStore((s) => s.dietRecords);
  const addDietRecord = useStore((s) => s.addDietRecord);

  const [isGenerating, setIsGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);

  // Form state for adding a diet record
  const [formMealType, setFormMealType] = useState<MealType>("breakfast");
  const [formFoodName, setFormFoodName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCalories, setFormCalories] = useState("");
  const [formProtein, setFormProtein] = useState("");
  const [formCarbs, setFormCarbs] = useState("");
  const [formFat, setFormFat] = useState("");

  // 100g 기준 영양정보 (AI에서 1회 조회 후 저장)
  const baseNutritionRef = useRef<{
    foodName: string;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
    servingGrams: number;
  } | null>(null);
  const estimateAbortRef = useRef<AbortController | null>(null);

  // 양 문자열에서 그램수를 파싱 (예: "200g" → 200, "2인분" → 2 * servingGrams, "1근" → 600)
  const parseAmountToGrams = (amount: string, servingGrams: number): number => {
    const trimmed = amount.trim().toLowerCase();
    if (!trimmed) return servingGrams; // 양 미입력 시 1인분

    // "300g", "300그램"
    const gMatch = trimmed.match(/^(\d+\.?\d*)\s*(g|그램)$/);
    if (gMatch) return parseFloat(gMatch[1]);

    // "0.5kg", "1kg", "1킬로"
    const kgMatch = trimmed.match(/^(\d+\.?\d*)\s*(kg|킬로|킬로그램)$/);
    if (kgMatch) return parseFloat(kgMatch[1]) * 1000;

    // "2인분", "3인분"
    const servingMatch = trimmed.match(/^(\d+\.?\d*)\s*인분$/);
    if (servingMatch) return parseFloat(servingMatch[1]) * servingGrams;

    // "1근" (600g)
    const geunMatch = trimmed.match(/^(\d+\.?\d*)\s*근$/);
    if (geunMatch) return parseFloat(geunMatch[1]) * 600;

    // "2개", "3개"
    const countMatch = trimmed.match(/^(\d+\.?\d*)\s*(개|조각|쪽|장|줄|봉지|컵|잔|공기|그릇|대접)$/);
    if (countMatch) return parseFloat(countMatch[1]) * servingGrams;

    // 숫자만 입력한 경우 (인분 단위로 간주)
    const numOnly = trimmed.match(/^(\d+\.?\d*)$/);
    if (numOnly) return parseFloat(numOnly[1]) * servingGrams;

    return servingGrams; // 파싱 실패 시 1인분
  };

  // 100g 기준 영양정보로부터 실제 칼로리 계산
  const calculateFromBase = (amountStr: string) => {
    const base = baseNutritionRef.current;
    if (!base) return;
    const grams = parseAmountToGrams(amountStr, base.servingGrams);
    const ratio = grams / 100;
    setFormCalories(String(Math.round(base.caloriesPer100g * ratio)));
    setFormProtein(String(Math.round(base.proteinPer100g * ratio)));
    setFormCarbs(String(Math.round(base.carbsPer100g * ratio)));
    setFormFat(String(Math.round(base.fatPer100g * ratio)));
  };

  // 음식명 변경 시 → AI 1회 호출하여 100g 기준 영양정보 가져오기
  useEffect(() => {
    const foodName = formFoodName.trim();
    if (!foodName) return;

    // 이미 같은 음식의 기준 정보가 있으면 재호출하지 않음
    if (baseNutritionRef.current?.foodName === foodName) return;

    const timer = setTimeout(async () => {
      if (estimateAbortRef.current) {
        estimateAbortRef.current.abort();
      }
      const abortController = new AbortController();
      estimateAbortRef.current = abortController;

      setIsEstimating(true);
      try {
        const res = await fetch("/api/ai/food-estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foodName }),
          signal: abortController.signal,
        });
        if (res.ok) {
          const data = await res.json();
          baseNutritionRef.current = {
            foodName,
            caloriesPer100g: data.caloriesPer100g || 150,
            proteinPer100g: data.proteinPer100g || 5,
            carbsPer100g: data.carbsPer100g || 20,
            fatPer100g: data.fatPer100g || 5,
            servingGrams: data.servingGrams || 200,
          };
          // 현재 입력된 양으로 즉시 계산
          calculateFromBase(formAmount);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Nutrition estimation failed:", err);
      } finally {
        setIsEstimating(false);
      }
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formFoodName]);

  // 양 변경 시 → AI 호출 없이 즉시 곱셈 계산
  useEffect(() => {
    if (!baseNutritionRef.current) return;
    calculateFromBase(formAmount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formAmount]);

  // Redirect if no user
  useEffect(() => {
    if (!user) {
      router.replace("/onboarding");
    }
  }, [user, router]);

  // Computed values
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

  // Filter today's diet records
  const todayRecords = dietRecords.filter((r) => r.date === todayStr);
  const consumedCalories = todayRecords.reduce((sum, r) => sum + r.macros.calories, 0);
  const consumedProtein = todayRecords.reduce((sum, r) => sum + r.macros.protein, 0);
  const consumedCarbs = todayRecords.reduce((sum, r) => sum + r.macros.carbs, 0);
  const consumedFat = todayRecords.reduce((sum, r) => sum + r.macros.fat, 0);

  // Calorie progress
  const calorieProgress = targetCalories > 0 ? Math.min(consumedCalories / targetCalories, 1) : 0;
  const caloriePercent = Math.round(calorieProgress * 100);

  // Generate diet plan on mount
  useEffect(() => {
    if (!user || !aiContext) return;
    if (todayDietPlan && todayDietPlan.date === todayStr) return;

    const generatePlan = async () => {
      setIsGenerating(true);
      try {
        const plan = await fetchDietPlan(user, todayStr);
        setTodayDietPlan(plan);
      } catch (error) {
        console.error("Diet plan generation failed:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    generatePlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Regenerate diet plan (기존 메뉴 제외하고 새로운 조합 추천)
  const handleRegenerate = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      // 현재 식단의 모든 메뉴명을 추출하여 제외 목록으로 전달
      const currentMenuNames: string[] = [];
      if (todayDietPlan?.meals) {
        for (const meal of todayDietPlan.meals) {
          for (const item of meal.items) {
            if (item.name) {
              currentMenuNames.push(item.name);
            }
          }
        }
      }
      const plan = await fetchDietPlan(user, todayStr, currentMenuNames.length > 0 ? currentMenuNames : undefined);
      setTodayDietPlan(plan);
    } catch (error) {
      console.error("Diet plan regeneration failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormMealType("breakfast");
    setFormFoodName("");
    setFormAmount("");
    setFormCalories("");
    setFormProtein("");
    setFormCarbs("");
    setFormFat("");
    baseNutritionRef.current = null;
  };

  // Submit diet record
  const handleSubmitRecord = () => {
    if (!user || !formFoodName.trim() || !formAmount.trim()) return;

    const record = {
      id: `diet-record-${Date.now()}`,
      userId: user.id,
      date: todayStr,
      mealType: formMealType,
      foodName: formFoodName.trim(),
      amount: formAmount.trim(),
      macros: {
        calories: parseInt(formCalories) || 0,
        protein: parseInt(formProtein) || 0,
        carbs: parseInt(formCarbs) || 0,
        fat: parseInt(formFat) || 0,
      },
      createdAt: new Date().toISOString(),
    };

    addDietRecord(record);
    resetForm();
    setDialogOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-4 pb-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Utensils className="size-5" />
            식단 관리
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{formattedDate}</p>
        </div>

        {/* Daily Summary Bar */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">오늘 섭취 칼로리</span>
              <span className="text-sm text-muted-foreground">
                {consumedCalories.toLocaleString()} / {targetCalories.toLocaleString()} kcal
              </span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  calorieProgress >= 1
                    ? "bg-red-500"
                    : calorieProgress >= 0.7
                      ? "bg-orange-500"
                      : "bg-emerald-500"
                }`}
                style={{ width: `${caloriePercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-right">{caloriePercent}% 달성</p>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="recommend">
          <TabsList className="w-full">
            <TabsTrigger value="recommend" className="flex-1">
              추천 식단
            </TabsTrigger>
            <TabsTrigger value="record" className="flex-1">
              식사 기록
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Recommended Diet */}
          <TabsContent value="recommend">
            <div className="space-y-3 mt-3">
              {isGenerating ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      AI가 맞춤 식단을 생성하고 있습니다...
                    </p>
                  </CardContent>
                </Card>
              ) : todayDietPlan ? (
                <>
                  {todayDietPlan.meals.map((meal) => {
                    const config = MEAL_CONFIG[meal.type];
                    const MealIcon = config.icon;

                    return (
                      <Card key={meal.type}>
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MealIcon className={`size-4 ${config.color}`} />
                              <span className="text-sm font-semibold">{config.label}</span>
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">
                              {meal.totalMacros.calories} kcal
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {meal.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <ChevronRight className="size-3 text-muted-foreground" />
                                <span className="text-foreground">{item.name}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {item.amount}
                              </span>
                            </div>
                          ))}
                          <div className="flex gap-3 pt-2 border-t border-border">
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              단 {meal.totalMacros.protein}g
                            </span>
                            <span className="text-xs text-green-600 dark:text-green-400">
                              탄 {meal.totalMacros.carbs}g
                            </span>
                            <span className="text-xs text-yellow-600 dark:text-yellow-400">
                              지 {meal.totalMacros.fat}g
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Diet plan note */}
                  {todayDietPlan.note && (
                    <p className="text-xs text-muted-foreground text-center px-4">
                      {todayDietPlan.note}
                    </p>
                  )}

                  {/* Regenerate button */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                  >
                    새로운 식단 추천
                  </Button>
                </>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      식단 계획을 불러올 수 없습니다.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-3"
                      onClick={handleRegenerate}
                    >
                      식단 생성하기
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab 2: Diet Records */}
          <TabsContent value="record">
            <div className="space-y-3 mt-3">
              {/* Add record button */}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger
                  render={
                    <Button className="w-full">
                      <Plus className="size-4 mr-1" />
                      식사 기록 추가
                    </Button>
                  }
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>식사 기록 추가</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    {/* Meal type */}
                    <div className="space-y-2">
                      <Label>식사 종류</Label>
                      <Select
                        value={formMealType}
                        onValueChange={(val) => setFormMealType(val as MealType)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="breakfast">아침</SelectItem>
                          <SelectItem value="lunch">점심</SelectItem>
                          <SelectItem value="dinner">저녁</SelectItem>
                          <SelectItem value="snack">간식</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Food name */}
                    <div className="space-y-2">
                      <Label>음식 이름</Label>
                      <Input
                        placeholder="예: 현미밥, 김치찌개, 삼겹살..."
                        value={formFoodName}
                        onChange={(e) => setFormFoodName(e.target.value)}
                      />
                      <p className="text-xs text-gray-400">음식명 입력 시 AI가 기본 영양정보를 조회합니다</p>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                      <Label>양</Label>
                      <Input
                        placeholder="예: 1인분, 200g, 2개, 1근"
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                      />
                      <p className="text-xs text-gray-400">양에 따라 칼로리가 자동 계산됩니다</p>
                    </div>

                    {/* AI 추정 중 표시 */}
                    {isEstimating && (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950 rounded-lg p-2">
                        <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                        AI가 영양 정보를 추정하고 있습니다...
                      </div>
                    )}

                    {/* Calories */}
                    <div className="space-y-2">
                      <Label>칼로리 (kcal) {formCalories && <Badge variant="secondary" className="ml-1 text-xs">AI 추정</Badge>}</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={formCalories}
                        onChange={(e) => setFormCalories(e.target.value)}
                        min="0"
                      />
                    </div>

                    {/* Macros row */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label className="text-xs">단백질 (g)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={formProtein}
                          onChange={(e) => setFormProtein(e.target.value)}
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">탄수화물 (g)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={formCarbs}
                          onChange={(e) => setFormCarbs(e.target.value)}
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">지방 (g)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={formFat}
                          onChange={(e) => setFormFat(e.target.value)}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleSubmitRecord}
                      disabled={!formFoodName.trim() || !formAmount.trim()}
                    >
                      저장
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Records list */}
              {todayRecords.length > 0 ? (
                todayRecords.map((record) => {
                  const config = MEAL_CONFIG[record.mealType];
                  return (
                    <Card key={record.id}>
                      <CardContent className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <Badge
                            className={`${config.badgeVariant} border-0 text-xs`}
                          >
                            {config.label}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {record.foodName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {record.amount}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {record.macros.calories} kcal
                        </span>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Utensils className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      아직 기록된 식사가 없습니다.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      위 버튼을 눌러 오늘의 식사를 기록해 보세요.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Macro Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-xs text-muted-foreground">단백질</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {consumedProtein}g
              </p>
              <p className="text-xs text-muted-foreground">/ {macros.protein}g</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-xs text-muted-foreground">탄수화물</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {consumedCarbs}g
              </p>
              <p className="text-xs text-muted-foreground">/ {macros.carbs}g</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 text-center">
              <p className="text-xs text-muted-foreground">지방</p>
              <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {consumedFat}g
              </p>
              <p className="text-xs text-muted-foreground">/ {macros.fat}g</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
