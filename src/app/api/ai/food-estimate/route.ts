import { NextRequest, NextResponse } from "next/server";
import { OpenRouter } from "@openrouter/sdk";

const MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-v3.2";

export async function POST(request: NextRequest) {
  try {
    const { foodName, amount } = await request.json();

    if (!foodName) {
      return NextResponse.json({ error: "음식명은 필수입니다." }, { status: 400 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      // API 키 없을 때 기본 추정 폴백
      return NextResponse.json(estimateFallback(foodName, amount));
    }

    const client = new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

    const response = await client.chat.send({
      chatGenerationParams: {
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `당신은 영양 정보 전문가입니다. 사용자가 입력한 음식의 영양 정보를 추정합니다.
반드시 아래 JSON 형식으로만 응답하세요. 다른 설명은 불필요합니다:
{
  "calories": 숫자,
  "protein": 숫자(g),
  "carbs": 숫자(g),
  "fat": 숫자(g)
}
현실적이고 정확한 값을 제공하세요. 한식 기준으로 추정하되, 양이 명시되지 않으면 일반적인 1인분 기준으로 계산하세요.`,
          },
          {
            role: "user",
            content: `음식: ${foodName}${amount ? `, 양: ${amount}` : " (1인분)"}
이 음식의 칼로리와 영양소(단백질, 탄수화물, 지방)를 JSON으로 알려주세요.`,
          },
        ],
        temperature: 0.3,
        maxTokens: 200,
        stream: false,
      },
    });

    if ("choices" in response && response.choices?.[0]?.message?.content) {
      const text = response.choices[0].message.content;
      const parsed = parseJSON(text);
      if (parsed) {
        return NextResponse.json({
          calories: Math.round(parsed.calories || 0),
          protein: Math.round(parsed.protein || 0),
          carbs: Math.round(parsed.carbs || 0),
          fat: Math.round(parsed.fat || 0),
        });
      }
    }

    return NextResponse.json(estimateFallback(foodName, amount));
  } catch (error) {
    console.error("Food estimate error:", error);
    return NextResponse.json(estimateFallback("기본", "1인분"));
  }
}

function parseJSON(text: string): Record<string, number> | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return null;
  } catch {
    return null;
  }
}

function estimateFallback(foodName: string, amount?: string) {
  // 간단한 키워드 기반 폴백 추정
  const lower = (foodName || "").toLowerCase();
  const portion = amount ? 1 : 1;

  if (lower.includes("밥")) return { calories: 300 * portion, protein: 6, carbs: 65, fat: 1 };
  if (lower.includes("라면")) return { calories: 500 * portion, protein: 10, carbs: 70, fat: 16 };
  if (lower.includes("치킨") || lower.includes("닭")) return { calories: 350 * portion, protein: 30, carbs: 10, fat: 20 };
  if (lower.includes("삼겹살")) return { calories: 450 * portion, protein: 20, carbs: 0, fat: 38 };
  if (lower.includes("비빔밥")) return { calories: 480 * portion, protein: 18, carbs: 72, fat: 12 };
  if (lower.includes("김치찌개")) return { calories: 200 * portion, protein: 12, carbs: 10, fat: 12 };
  if (lower.includes("샐러드")) return { calories: 150 * portion, protein: 5, carbs: 15, fat: 7 };
  if (lower.includes("빵") || lower.includes("토스트")) return { calories: 280 * portion, protein: 8, carbs: 45, fat: 8 };
  if (lower.includes("커피") || lower.includes("아메리카노")) return { calories: 5, protein: 0, carbs: 1, fat: 0 };
  if (lower.includes("우유") || lower.includes("라떼")) return { calories: 150, protein: 7, carbs: 12, fat: 8 };

  return { calories: 300, protein: 10, carbs: 40, fat: 10 };
}
