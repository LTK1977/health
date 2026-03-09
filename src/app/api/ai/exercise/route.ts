import { NextRequest, NextResponse } from "next/server";
import { openRouterAIService } from "@/lib/ai-openrouter";
import { mockAIService } from "@/lib/ai-mock";
import type { AIUserContext } from "@/lib/ai-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { context, date, dayOfWeek } = body as {
      context: AIUserContext;
      date: string;
      dayOfWeek: number;
    };

    if (!context || !date || dayOfWeek === undefined) {
      return NextResponse.json(
        { error: "context, date, dayOfWeek는 필수입니다." },
        { status: 400 }
      );
    }

    const useRealAI = !!process.env.OPENROUTER_API_KEY;
    const service = useRealAI ? openRouterAIService : mockAIService;

    const plan = await service.generateDailyExercisePlan(context, date, dayOfWeek);
    return NextResponse.json(plan);
  } catch (error) {
    console.error("Exercise AI error:", error);
    try {
      const body = await request.clone().json();
      const plan = await mockAIService.generateDailyExercisePlan(
        body.context,
        body.date,
        body.dayOfWeek
      );
      return NextResponse.json({ ...plan, _fallback: true });
    } catch {
      return NextResponse.json({ error: "운동 프로그램 생성에 실패했습니다." }, { status: 500 });
    }
  }
}
