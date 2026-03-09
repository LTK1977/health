import { NextRequest, NextResponse } from "next/server";
import { openRouterAIService } from "@/lib/ai-openrouter";
import { mockAIService } from "@/lib/ai-mock";
import type { AIUserContext } from "@/lib/ai-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { context, date } = body as { context: AIUserContext; date: string };

    if (!context || !date) {
      return NextResponse.json({ error: "context와 date는 필수입니다." }, { status: 400 });
    }

    const useRealAI = !!process.env.OPENROUTER_API_KEY;
    const service = useRealAI ? openRouterAIService : mockAIService;

    const plan = await service.generateDailyDietPlan(context, date);
    return NextResponse.json(plan);
  } catch (error) {
    console.error("Diet AI error:", error);
    // 실패 시 Mock 폴백
    try {
      const body = await request.clone().json();
      const plan = await mockAIService.generateDailyDietPlan(body.context, body.date);
      return NextResponse.json({ ...plan, _fallback: true });
    } catch {
      return NextResponse.json({ error: "식단 생성에 실패했습니다." }, { status: 500 });
    }
  }
}
