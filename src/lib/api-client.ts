import type { AIUserContext } from "./ai-service";
import type { DailyDietPlan } from "@/types/diet";
import type { DailyExercisePlan } from "@/types/exercise";
import type { WeeklyReport } from "@/types/record";
import type { User } from "@/types/user";
import {
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacros,
  calculateAge,
} from "./calculations";

export function buildAIContext(user: User): AIUserContext {
  const age = calculateAge(user.profile.birthDate);
  const bmr = calculateBMR(user.profile.weight, user.profile.height, age, user.profile.gender);
  const tdee = calculateTDEE(bmr, user.profile.activityLevel);
  const targetCalories = calculateTargetCalories(
    tdee,
    user.goal.pace,
    user.profile.weight,
    user.goal.targetWeight
  );
  const macros = calculateMacros(targetCalories);

  return {
    profile: user.profile,
    health: user.health,
    exercisePrefs: user.exercisePrefs,
    goal: user.goal,
    targetCalories,
    macros,
  };
}

export async function fetchDietPlan(user: User, date: string): Promise<DailyDietPlan> {
  const context = buildAIContext(user);
  const res = await fetch("/api/ai/diet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context, date }),
  });
  if (!res.ok) throw new Error("식단 생성 실패");
  return res.json();
}

export async function fetchExercisePlan(
  user: User,
  date: string,
  dayOfWeek: number
): Promise<DailyExercisePlan> {
  const context = buildAIContext(user);
  const res = await fetch("/api/ai/exercise", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context, date, dayOfWeek }),
  });
  if (!res.ok) throw new Error("운동 프로그램 생성 실패");
  return res.json();
}

export async function fetchWeeklyReport(user: User): Promise<WeeklyReport> {
  const context = buildAIContext(user);
  const res = await fetch("/api/ai/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context }),
  });
  if (!res.ok) throw new Error("리포트 생성 실패");
  return res.json();
}

export async function fetchMotivationalMessage(user: User): Promise<string> {
  const context = buildAIContext(user);
  const res = await fetch("/api/ai/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context }),
  });
  if (!res.ok) throw new Error("메시지 생성 실패");
  const data = await res.json();
  return data.message;
}
