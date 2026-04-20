import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { topic, cefrLevel } = await req.json();
    
    // スキーマに "example" (例文) を追加
    const responseSchema = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          word: { type: SchemaType.STRING, description: "英単語" },
          meaning: { type: SchemaType.STRING, description: "日本語の意味" },
          example: { type: SchemaType.STRING, description: "その単語を使った英語の例文" },
        },
        required: ["word", "meaning", "example"],
      },
    };

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3-flash-preview', // 安定性を重視。2.0-flashも可
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const prompt = `あなたはプロの英語教師です。ユーザーが指定したテーマ「${topic}」に関連する英単語を15個生成してください。
    難易度はCEFRの「${cefrLevel}」レベルに厳密に合わせてください。各単語には、そのレベルにふさわしい英語の例文を1つ添えてください。`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const words = JSON.parse(text);

    return NextResponse.json({ words });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: '生成エラー', details: error.message }, { status: 500 });
  }
}
