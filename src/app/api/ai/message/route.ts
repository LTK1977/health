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

    const message = await service.getMotivationalMessage(context);
    return NextResponse.json({ message });
  } catch (error) {
    console.error("Message AI error:", error);
    try {
      const body = await request.clone().json();
      const message = await mockAIService.getMotivationalMessage(body.context);
      return NextResponse.json({ message, _fallback: true });
    } catch {
      return NextResponse.json({
        message: "오늘도 건강한 하루를 시작해 볼까요? 💪",
        _fallback: true,
      });
    }
  }
}
