"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
import { fetchExercisePlan } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
  Dumbbell,
  Timer,
  Flame,
  CheckCircle2,
  Circle,
  Play,
  RotateCcw,
  Clock,
} from "lucide-react";
import type { ExerciseItem, Difficulty, ExerciseCategory } from "@/types/exercise";
import type { AIUserContext } from "@/lib/ai-service";

const DIFFICULTY_LABELS: Record<Difficulty, { label: string; color: string }> = {
  beginner: {
    label: "초급",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  intermediate: {
    label: "중급",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  advanced: {
    label: "고급",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

const TIMER_PRESETS = [30, 45, 60, 90];

export default function ExercisePage() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const todayExercisePlan = useStore((s) => s.todayExercisePlan);
  const setTodayExercisePlan = useStore((s) => s.setTodayExercisePlan);
  const exerciseRecords = useStore((s) => s.exerciseRecords);
  const addExerciseRecord = useStore((s) => s.addExerciseRecord);
  const toggleExerciseComplete = useStore((s) => s.toggleExerciseComplete);

  const [isGenerating, setIsGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Timer state
  const [showTimer, setShowTimer] = useState(false);
  const [timerDuration, setTimerDuration] = useState(60);
  const [timerRemaining, setTimerRemaining] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Exercise record form state
  const [formExerciseName, setFormExerciseName] = useState("");
  const [formSets, setFormSets] = useState("");
  const [formReps, setFormReps] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formWeight, setFormWeight] = useState("");

  // Redirect if no user
  useEffect(() => {
    if (!user) {
      router.replace("/onboarding");
    }
  }, [user, router]);

  // Computed values
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const dayOfWeek = today.getDay();
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

  // Filter today's exercise records
  const todayRecords = exerciseRecords.filter((r) => r.date === todayStr);
  const completedCount = todayRecords.filter((r) => r.completed).length;
  const totalExercises = todayExercisePlan?.exercises.length ?? 0;
  const completionPercent =
    totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

  // Generate exercise plan on mount
  useEffect(() => {
    if (!user || !aiContext) return;
    if (todayExercisePlan && todayExercisePlan.date === todayStr) return;

    const generatePlan = async () => {
      setIsGenerating(true);
      try {
        const plan = await fetchExercisePlan(user, todayStr, dayOfWeek);
        setTodayExercisePlan(plan);
      } catch (error) {
        console.error("Exercise plan generation failed:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    generatePlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Timer effect
  useEffect(() => {
    if (timerRunning && timerRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerRunning, timerRemaining]);

  // Regenerate exercise plan
  const handleRegenerate = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      const plan = await fetchExercisePlan(user, todayStr, dayOfWeek);
      setTodayExercisePlan(plan);
    } catch (error) {
      console.error("Exercise plan regeneration failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle exercise checkbox toggle
  const handleToggleExercise = useCallback(
    (exercise: ExerciseItem) => {
      if (!user) return;

      const existingRecord = todayRecords.find(
        (r) => r.exerciseName === exercise.name
      );

      if (existingRecord) {
        toggleExerciseComplete(existingRecord.id);
      } else {
        addExerciseRecord({
          id: `exercise-record-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          userId: user.id,
          date: todayStr,
          exerciseName: exercise.name,
          category: exercise.category,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight ? parseFloat(exercise.weight) : undefined,
          durationMinutes: exercise.durationMinutes,
          completed: true,
          createdAt: new Date().toISOString(),
        });
      }
    },
    [user, todayRecords, todayStr, addExerciseRecord, toggleExerciseComplete]
  );

  // Check if exercise is completed
  const isExerciseCompleted = useCallback(
    (exerciseName: string) => {
      return todayRecords.some(
        (r) => r.exerciseName === exerciseName && r.completed
      );
    },
    [todayRecords]
  );

  // Timer controls
  const handleTimerPreset = (seconds: number) => {
    setTimerDuration(seconds);
    setTimerRemaining(seconds);
    setTimerRunning(false);
  };

  const handleTimerStart = () => {
    if (timerRemaining === 0) {
      setTimerRemaining(timerDuration);
    }
    setTimerRunning(true);
  };

  const handleTimerReset = () => {
    setTimerRunning(false);
    setTimerRemaining(timerDuration);
  };

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Reset form
  const resetForm = () => {
    setFormExerciseName("");
    setFormSets("");
    setFormReps("");
    setFormDuration("");
    setFormWeight("");
  };

  // Submit exercise record
  const handleSubmitRecord = () => {
    if (!user || !formExerciseName.trim()) return;

    const record = {
      id: `exercise-record-${Date.now()}`,
      userId: user.id,
      date: todayStr,
      exerciseName: formExerciseName.trim(),
      category: "strength" as ExerciseCategory,
      sets: formSets ? parseInt(formSets) : undefined,
      reps: formReps ? parseInt(formReps) : undefined,
      weight: formWeight ? parseFloat(formWeight) : undefined,
      durationMinutes: formDuration ? parseInt(formDuration) : undefined,
      completed: true,
      createdAt: new Date().toISOString(),
    };

    addExerciseRecord(record);
    resetForm();
    setDialogOpen(false);
  };

  // Format exercise details
  const getExerciseDetails = (exercise: ExerciseItem) => {
    if (exercise.sets && exercise.reps) {
      return `${exercise.sets}세트 × ${exercise.reps}회`;
    }
    if (exercise.durationMinutes) {
      return `${exercise.durationMinutes}분`;
    }
    if (exercise.sets) {
      return `${exercise.sets}세트`;
    }
    return "";
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
            <Dumbbell className="size-5" />
            운동
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{formattedDate}</p>
        </div>

        {isGenerating ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                AI가 맞춤 운동 계획을 생성하고 있습니다...
              </p>
            </CardContent>
          </Card>
        ) : todayExercisePlan ? (
          <>
            {todayExercisePlan.isRestDay ? (
              /* Rest Day View */
              <Card>
                <CardContent className="py-10 text-center">
                  <div className="text-4xl mb-3">
                    <Clock className="size-12 text-muted-foreground/40 mx-auto" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    휴식일
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    오늘은 휴식일입니다. 충분한 휴식도 운동의 일부예요!
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    가벼운 스트레칭이나 산책을 추천합니다.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Today's Plan Summary Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-base font-semibold">
                        {todayExercisePlan.title}
                      </span>
                      <Badge
                        className={`${
                          DIFFICULTY_LABELS[todayExercisePlan.difficulty].color
                        } border-0 text-xs`}
                      >
                        {DIFFICULTY_LABELS[todayExercisePlan.difficulty].label}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Timer className="size-4" />
                        {todayExercisePlan.totalDurationMinutes}분
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="size-4" />
                        {todayExercisePlan.estimatedCaloriesBurned}kcal
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">
                          진행률
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {completedCount}/{totalExercises} 완료
                        </span>
                      </div>
                      <Progress value={completionPercent} />
                    </div>
                  </CardContent>
                </Card>

                {/* Exercise List */}
                <div className="space-y-3">
                  {todayExercisePlan.exercises.map((exercise, idx) => {
                    const completed = isExerciseCompleted(exercise.name);
                    return (
                      <Card
                        key={`${exercise.name}-${idx}`}
                        className={completed ? "opacity-70" : ""}
                      >
                        <CardContent className="py-3">
                          <div className="flex items-start gap-3">
                            <div className="pt-0.5">
                              <Checkbox
                                checked={completed}
                                onCheckedChange={() =>
                                  handleToggleExercise(exercise)
                                }
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-semibold ${
                                  completed
                                    ? "line-through text-muted-foreground"
                                    : "text-foreground"
                                }`}
                              >
                                {exercise.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {getExerciseDetails(exercise)}
                                </span>
                                {exercise.weight && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs h-4 px-1.5"
                                  >
                                    {exercise.weight}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {exercise.description}
                              </p>
                              {exercise.restSeconds && (
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                                  <Clock className="size-3" />
                                  세트 간 휴식: {exercise.restSeconds}초
                                </p>
                              )}
                            </div>
                            <div className="pt-0.5">
                              {completed ? (
                                <CheckCircle2 className="size-5 text-emerald-500" />
                              ) : (
                                <Circle className="size-5 text-muted-foreground/30" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Rest Timer */}
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowTimer(!showTimer)}
                  >
                    <Timer className="size-4 mr-1" />
                    휴식 타이머
                  </Button>

                  {showTimer && (
                    <Card>
                      <CardContent className="py-4">
                        <div className="text-center space-y-4">
                          {/* Timer display */}
                          <div
                            className={`text-5xl font-mono font-bold tabular-nums ${
                              timerRemaining === 0
                                ? "text-emerald-500"
                                : timerRunning
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {formatTime(timerRemaining)}
                          </div>

                          {timerRemaining === 0 && !timerRunning && (
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                              휴식 완료!
                            </p>
                          )}

                          {/* Preset buttons */}
                          <div className="flex items-center justify-center gap-2">
                            {TIMER_PRESETS.map((seconds) => (
                              <Button
                                key={seconds}
                                variant={
                                  timerDuration === seconds
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => handleTimerPreset(seconds)}
                                disabled={timerRunning}
                              >
                                {seconds}초
                              </Button>
                            ))}
                          </div>

                          {/* Controls */}
                          <div className="flex items-center justify-center gap-3">
                            <Button
                              onClick={handleTimerStart}
                              disabled={timerRunning}
                              size="sm"
                            >
                              <Play className="size-4 mr-1" />
                              시작
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleTimerReset}
                              size="sm"
                            >
                              <RotateCcw className="size-4 mr-1" />
                              초기화
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}

            {/* Exercise Record Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                render={
                  <Button variant="outline" className="w-full">
                    <Dumbbell className="size-4 mr-1" />
                    운동 기록 추가
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>운동 기록 추가</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  {/* Exercise name */}
                  <div className="space-y-2">
                    <Label>운동 이름</Label>
                    <Input
                      placeholder="예: 스쿼트"
                      value={formExerciseName}
                      onChange={(e) => setFormExerciseName(e.target.value)}
                    />
                  </div>

                  {/* Sets and Reps */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>세트 수</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={formSets}
                        onChange={(e) => setFormSets(e.target.value)}
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>반복 횟수</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={formReps}
                        onChange={(e) => setFormReps(e.target.value)}
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label>운동 시간 (분)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                      min="0"
                    />
                  </div>

                  {/* Weight */}
                  <div className="space-y-2">
                    <Label>무게 (kg)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formWeight}
                      onChange={(e) => setFormWeight(e.target.value)}
                      min="0"
                      step="0.5"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleSubmitRecord}
                    disabled={!formExerciseName.trim()}
                  >
                    저장
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Regenerate button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleRegenerate}
              disabled={isGenerating}
            >
              새로운 운동 추천
            </Button>
          </>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                운동 계획을 불러올 수 없습니다.
              </p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={handleRegenerate}
              >
                운동 계획 생성하기
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
