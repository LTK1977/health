import { OpenRouter } from "@openrouter/sdk";
import type { AIService, AIUserContext } from "./ai-service";
import type { DailyDietPlan, Meal, Macros } from "@/types/diet";
import type { DailyExercisePlan, ExerciseItem } from "@/types/exercise";
import type { WeeklyReport } from "@/types/record";

function getClient() {
  return new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY || "",
  });
}

const MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-v3.2";

async function chatCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
  const client = getClient();

  // 비스트리밍 방식으로 응답 수집
  const response = await client.chat.send({
    chatGenerationParams: {
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: 4000,
      stream: false,
    },
  });

  // 비스트리밍 응답에서 content 추출
  if ("choices" in response && response.choices?.[0]?.message?.content) {
    return response.choices[0].message.content;
  }
  return "";
}

function buildUserContextPrompt(context: AIUserContext): string {
  const gender = context.profile.gender === "male" ? "남성" : "여성";
  const conditions = context.health.conditions?.length
    ? context.health.conditions.join(", ")
    : "없음";
  const allergies = context.health.allergies?.length
    ? context.health.allergies.join(", ")
    : "없음";
  const dietPref =
    {
      none: "없음",
      vegetarian: "채식",
      vegan: "비건",
      pescatarian: "페스코",
      keto: "키토",
      low_carb: "저탄수",
    }[context.health.dietaryPreference] || "없음";
  const equipment =
    {
      none: "없음",
      home_basic: "기본 홈트레이닝 장비",
      home_full: "홈짐 풀세트",
      gym: "헬스장",
    }[context.exercisePrefs.equipment] || "없음";

  return `
[사용자 정보]
- 성별: ${gender}
- 키: ${context.profile.height}cm
- 체중: ${context.profile.weight}kg
- 체지방률: ${context.profile.bodyFat ? context.profile.bodyFat + "%" : "미입력"}
- 활동수준: ${context.profile.activityLevel}
- 기저질환: ${conditions}
- 알레르기: ${allergies}
- 식이 선호: ${dietPref}
- 하루 식사 횟수: ${context.health.mealsPerDay}끼
- 운동 장비: ${equipment}
- 주당 운동 가능 횟수: ${context.exercisePrefs.weeklyFrequency}회
- 1회 운동 가능 시간: ${context.exercisePrefs.availableMinutes}분
- 목표 체중: ${context.goal.targetWeight}kg
- 일일 목표 칼로리: ${context.targetCalories}kcal
- 목표 매크로: 단백질 ${context.macros.protein}g, 탄수화물 ${context.macros.carbs}g, 지방 ${context.macros.fat}g
`.trim();
}

function parseJSON<T>(text: string): T | null {
  try {
    // 코드 블록으로 감싸진 JSON 처리
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    // 일반 JSON 파싱 시도
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      return JSON.parse(text.substring(start, end + 1));
    }
    // 배열일 수도 있음
    const arrStart = text.indexOf("[");
    const arrEnd = text.lastIndexOf("]");
    if (arrStart !== -1 && arrEnd !== -1) {
      return JSON.parse(text.substring(arrStart, arrEnd + 1));
    }
    return null;
  } catch {
    console.error("JSON parse error:", text.substring(0, 200));
    return null;
  }
}

export const openRouterAIService: AIService = {
  async generateDailyDietPlan(context: AIUserContext, date: string): Promise<DailyDietPlan> {
    const systemPrompt = `당신은 전문 영양사 AI입니다. 사용자의 신체 조건과 목표에 맞는 한식 중심의 건강한 일일 식단을 설계합니다.

규칙:
- 한식 위주로 추천하되, 간편식이나 외식 메뉴도 포함 가능
- 일일 목표 칼로리를 준수하여 식단 설계
- 영양소 균형(단백질/탄수화물/지방)을 맞춤
- 기저질환, 알레르기, 식이 선호를 반드시 고려
- 극단적 저칼로리(1200kcal 미만) 식단 금지
- 각 음식의 칼로리와 매크로를 현실적으로 산출

반드시 아래 JSON 형식으로만 응답하세요. 다른 설명은 불필요합니다:
{
  "meals": [
    {
      "type": "breakfast",
      "items": [
        { "name": "음식명", "amount": "1인분(200g)", "macros": { "calories": 300, "protein": 15, "carbs": 40, "fat": 8 } }
      ],
      "totalMacros": { "calories": 500, "protein": 30, "carbs": 60, "fat": 15 }
    },
    { "type": "lunch", "items": [...], "totalMacros": {...} },
    { "type": "dinner", "items": [...], "totalMacros": {...} },
    { "type": "snack", "items": [...], "totalMacros": {...} }
  ],
  "totalMacros": { "calories": 1800, "protein": 135, "carbs": 180, "fat": 60 },
  "note": "오늘 식단에 대한 간단한 설명"
}`;

    const userPrompt = `${buildUserContextPrompt(context)}

오늘 날짜: ${date}
위 사용자 정보를 기반으로 일일 ${context.targetCalories}kcal 목표의 식단을 JSON으로 생성해 주세요.
아침, 점심, 저녁, 간식 4끼를 포함해 주세요.`;

    const response = await chatCompletion(systemPrompt, userPrompt);
    const parsed = parseJSON<{
      meals: Meal[];
      totalMacros: Macros;
      note?: string;
    }>(response);

    if (!parsed || !parsed.meals) {
      throw new Error("AI 식단 생성 실패: 응답 파싱 오류");
    }

    return {
      id: `diet-${date}-${Date.now()}`,
      userId: context.profile.id,
      date,
      meals: parsed.meals,
      totalMacros: parsed.totalMacros,
      targetCalories: context.targetCalories,
      note: parsed.note,
    };
  },

  async generateDailyExercisePlan(
    context: AIUserContext,
    date: string,
    dayOfWeek: number
  ): Promise<DailyExercisePlan> {
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

    const systemPrompt = `당신은 전문 퍼스널 트레이너 AI입니다. 사용자의 체력 수준, 장비, 시간에 맞는 운동 프로그램을 설계합니다.

규칙:
- 주당 운동 가능 횟수에 맞춰 휴식일을 적절히 배치
- 근력 운동과 유산소 운동을 균형있게 조합
- 기저질환(관절질환 등)이 있으면 해당 부위 운동 제외
- 초보자는 낮은 강도부터 시작
- 점진적 과부하 원칙 적용
- 보유 장비에 맞는 운동만 추천

반드시 아래 JSON 형식으로만 응답하세요:
{
  "isRestDay": false,
  "title": "운동 제목 (예: 상체 근력 + 유산소)",
  "category": "strength",
  "difficulty": "beginner",
  "exercises": [
    {
      "name": "운동명",
      "category": "strength",
      "muscleGroups": ["chest", "arms"],
      "sets": 3,
      "reps": 12,
      "restSeconds": 60,
      "weight": "체중 또는 Nkg",
      "description": "운동 설명 및 자세 팁",
      "durationMinutes": null
    }
  ],
  "totalDurationMinutes": 60,
  "estimatedCaloriesBurned": 350
}

muscleGroups 가능한 값: chest, back, shoulders, arms, core, legs, full_body
category 가능한 값: strength, cardio, flexibility, hiit, rest
difficulty 가능한 값: beginner, intermediate, advanced
휴식일인 경우 isRestDay: true로 설정하고 exercises는 빈 배열로.`;

    const userPrompt = `${buildUserContextPrompt(context)}

오늘 날짜: ${date} (${dayNames[dayOfWeek]}요일)
요일 번호: ${dayOfWeek} (0=일, 1=월, ..., 6=토)

위 사용자 정보를 기반으로 오늘의 운동 프로그램을 JSON으로 생성해 주세요.
사용자가 주 ${context.exercisePrefs.weeklyFrequency}회 운동을 원하며, 1회 ${context.exercisePrefs.availableMinutes}분 가능합니다.
일요일은 휴식일로 설정해 주세요.`;

    const response = await chatCompletion(systemPrompt, userPrompt);
    const parsed = parseJSON<{
      isRestDay: boolean;
      title: string;
      category: string;
      difficulty: string;
      exercises: ExerciseItem[];
      totalDurationMinutes: number;
      estimatedCaloriesBurned: number;
    }>(response);

    if (!parsed) {
      throw new Error("AI 운동 생성 실패: 응답 파싱 오류");
    }

    return {
      id: `exercise-${date}-${Date.now()}`,
      userId: context.profile.id,
      date,
      dayOfWeek,
      category: (parsed.category as DailyExercisePlan["category"]) || "strength",
      title: parsed.title || "오늘의 운동",
      exercises: parsed.exercises || [],
      totalDurationMinutes: parsed.totalDurationMinutes || context.exercisePrefs.availableMinutes,
      estimatedCaloriesBurned: parsed.estimatedCaloriesBurned || 300,
      difficulty: (parsed.difficulty as DailyExercisePlan["difficulty"]) || "beginner",
      isRestDay: parsed.isRestDay || false,
    };
  },

  async generateWeeklyReport(context: AIUserContext): Promise<WeeklyReport> {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);

    const systemPrompt = `당신은 건강 관리 AI 코치입니다. 사용자의 주간 건강 데이터를 분석하고 격려와 함께 실질적인 개선 방안을 제시합니다.

규칙:
- 긍정적이고 격려하는 톤 유지
- 구체적이고 실행 가능한 조언 제공
- 의학적 진단이나 처방은 하지 않음
- 한국어로 자연스럽게 작성

반드시 아래 JSON 형식으로만 응답하세요:
{
  "dietComplianceRate": 75,
  "exerciseComplianceRate": 80,
  "weightChange": -0.5,
  "aiSummary": "이번 주 분석 요약 (2-3문장)",
  "aiRecommendation": "다음 주를 위한 구체적 조언 (2-3문장)"
}`;

    const userPrompt = `${buildUserContextPrompt(context)}

기간: ${weekStart.toISOString().split("T")[0]} ~ ${today.toISOString().split("T")[0]}

이 사용자의 주간 건강 분석 리포트를 JSON으로 생성해 주세요.
현재 체중에서 목표 체중까지 감량 중인 사용자입니다.`;

    const response = await chatCompletion(systemPrompt, userPrompt);
    const parsed = parseJSON<{
      dietComplianceRate: number;
      exerciseComplianceRate: number;
      weightChange: number;
      aiSummary: string;
      aiRecommendation: string;
    }>(response);

    return {
      weekStartDate: weekStart.toISOString().split("T")[0],
      weekEndDate: today.toISOString().split("T")[0],
      avgCaloriesConsumed: context.targetCalories + Math.floor(Math.random() * 200 - 100),
      avgCaloriesTarget: context.targetCalories,
      dietComplianceRate: parsed?.dietComplianceRate ?? 75,
      exerciseComplianceRate: parsed?.exerciseComplianceRate ?? 70,
      weightStart: context.profile.weight,
      weightEnd: context.profile.weight + (parsed?.weightChange ?? -0.3),
      weightChange: parsed?.weightChange ?? -0.3,
      aiSummary: parsed?.aiSummary ?? "이번 주 건강 관리를 잘 수행하셨습니다.",
      aiRecommendation: parsed?.aiRecommendation ?? "다음 주에도 꾸준히 식단과 운동을 유지해 주세요.",
    };
  },

  async getMotivationalMessage(context: AIUserContext): Promise<string> {
    const systemPrompt = `당신은 따뜻하고 격려하는 건강 관리 코치입니다.
사용자에게 오늘 하루를 위한 짧고 힘이 되는 동기부여 메시지를 작성합니다.
1-2문장으로 간결하게, 이모지 1개 포함. 한국어로 작성.
JSON이 아닌 일반 텍스트로 응답하세요.`;

    const gender = context.profile.gender === "male" ? "남성" : "여성";
    const userPrompt = `${gender}, ${context.profile.weight}kg, 목표 ${context.goal.targetWeight}kg인 사용자에게 오늘의 동기부여 메시지를 작성해 주세요.`;

    const response = await chatCompletion(systemPrompt, userPrompt);
    return response.trim() || "오늘도 건강한 하루를 시작해 볼까요? 💪";
  },
};
