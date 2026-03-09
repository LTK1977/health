import { NextRequest, NextResponse } from "next/server";
import { openRouterAIService } from "@/lib/ai-openrouter";
import { mockAIService } from "@/lib/ai-mock";
import type { AIUserContext } from "@/lib/ai-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { context } = body as { context: AIUserContext };

    if (!context) {
      return NextResponse.json({ error: "context는 필수입니다." }, { status: 400 });
    }

    const useRealAI = !!process.env.OPENROUTER_API_KEY;
    const service = useRealAI ? openRouterAIService : mockAIService;

    const report = await service.generateWeeklyReport(context, null);
    return NextResponse.json(report);
  } catch (error) {
    console.error("Report AI error:", error);
    try {
      const body = await request.clone().json();
      const report = await mockAIService.generateWeeklyReport(body.context, null);
      return NextResponse.json({ ...report, _fallback: true });
    } catch {
      return NextResponse.json({ error: "리포트 생성에 실패했습니다." }, { status: 500 });
    }
  }
}
