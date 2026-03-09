import { NextRequest, NextResponse } from "next/server";
import { OpenRouter } from "@openrouter/sdk";

const MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-v3.2";

export async function POST(request: NextRequest) {
  try {
    const { foodName } = await request.json();

    if (!foodName) {
      return NextResponse.json({ error: "음식명은 필수입니다." }, { status: 400 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(estimateFallback(foodName));
    }

    const client = new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

    const response = await client.chat.send({
      chatGenerationParams: {
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `당신은 영양 정보 전문가입니다. 사용자가 입력한 음식의 100g당 영양 정보와 일반적인 1인분 기준 그램수를 추정합니다.
반드시 아래 JSON 형식으로만 응답하세요. 다른 설명은 불필요합니다:
{
  "caloriesPer100g": 숫자,
  "proteinPer100g": 숫자(g),
  "carbsPer100g": 숫자(g),
  "fatPer100g": 숫자(g),
  "servingGrams": 숫자 (일반적인 1인분의 그램수)
}
현실적이고 정확한 값을 제공하세요. 한식 기준으로 추정하세요.`,
          },
          {
            role: "user",
            content: `음식: ${foodName}\n이 음식의 100g당 칼로리와 영양소, 그리고 일반적인 1인분의 그램수를 JSON으로 알려주세요.`,
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
      if (parsed && parsed.caloriesPer100g) {
        return NextResponse.json({
          caloriesPer100g: Math.round(parsed.caloriesPer100g || 0),
          proteinPer100g: Math.round(parsed.proteinPer100g || 0),
          carbsPer100g: Math.round(parsed.carbsPer100g || 0),
          fatPer100g: Math.round(parsed.fatPer100g || 0),
          servingGrams: Math.round(parsed.servingGrams || 200),
        });
      }
    }

    return NextResponse.json(estimateFallback(foodName));
  } catch (error) {
    console.error("Food estimate error:", error);
    return NextResponse.json(estimateFallback("기본"));
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

// 100g 기준 영양정보 폴백
function estimateFallback(foodName: string) {
  const lower = (foodName || "").toLowerCase();

  // { caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g, servingGrams }
  if (lower.includes("밥") || lower.includes("공기"))
    return { caloriesPer100g: 150, proteinPer100g: 3, carbsPer100g: 33, fatPer100g: 0, servingGrams: 200 };
  if (lower.includes("라면"))
    return { caloriesPer100g: 440, proteinPer100g: 9, carbsPer100g: 62, fatPer100g: 16, servingGrams: 120 };
  if (lower.includes("치킨") || lower.includes("닭"))
    return { caloriesPer100g: 230, proteinPer100g: 20, carbsPer100g: 8, fatPer100g: 13, servingGrams: 150 };
  if (lower.includes("삼겹살"))
    return { caloriesPer100g: 330, proteinPer100g: 15, carbsPer100g: 0, fatPer100g: 30, servingGrams: 200 };
  if (lower.includes("비빔밥"))
    return { caloriesPer100g: 130, proteinPer100g: 5, carbsPer100g: 20, fatPer100g: 3, servingGrams: 400 };
  if (lower.includes("김치찌개"))
    return { caloriesPer100g: 55, proteinPer100g: 4, carbsPer100g: 3, fatPer100g: 3, servingGrams: 400 };
  if (lower.includes("샐러드"))
    return { caloriesPer100g: 50, proteinPer100g: 2, carbsPer100g: 5, fatPer100g: 2, servingGrams: 300 };
  if (lower.includes("빵") || lower.includes("토스트"))
    return { caloriesPer100g: 280, proteinPer100g: 8, carbsPer100g: 48, fatPer100g: 6, servingGrams: 100 };
  if (lower.includes("커피") || lower.includes("아메리카노"))
    return { caloriesPer100g: 2, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 0, servingGrams: 300 };
  if (lower.includes("우유") || lower.includes("라떼"))
    return { caloriesPer100g: 63, proteinPer100g: 3, carbsPer100g: 5, fatPer100g: 3, servingGrams: 250 };
  if (lower.includes("계란") || lower.includes("달걀"))
    return { caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1, fatPer100g: 11, servingGrams: 60 };
  if (lower.includes("떡볶이"))
    return { caloriesPer100g: 170, proteinPer100g: 4, carbsPer100g: 33, fatPer100g: 3, servingGrams: 300 };
  if (lower.includes("피자"))
    return { caloriesPer100g: 270, proteinPer100g: 11, carbsPer100g: 33, fatPer100g: 10, servingGrams: 200 };
  if (lower.includes("햄버거") || lower.includes("버거"))
    return { caloriesPer100g: 250, proteinPer100g: 13, carbsPer100g: 25, fatPer100g: 11, servingGrams: 220 };

  return { caloriesPer100g: 150, proteinPer100g: 5, carbsPer100g: 20, fatPer100g: 5, servingGrams: 200 };
}
