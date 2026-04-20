import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// APIキーのチェック
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req: Request) {
  try {
    const { topic, cefrLevel } = await req.json();

    // 1. 構造化出力（JSON）のスキーマ定義
    const responseSchema = {
      type: SchemaType.ARRAY,
      description: "A list of English words with meanings and examples.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          word: { type: SchemaType.STRING, description: "The English word." },
          meaning: { type: SchemaType.STRING, description: "The Japanese meaning." },
          example: { type: SchemaType.STRING, description: "An English example sentence using the word." },
        },
        required: ["word", "meaning", "example"],
      },
    };

    // 2. モデルの初期化
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7, // 少し多様性を持たせる
      },
    });

    // 3. プロンプトの構築
    const prompt = `
      You are an expert English teacher. 
      Generate exactly 15 English vocabulary words related to the topic: "${topic}".
      The difficulty must strictly match CEFR level: "${cefrLevel}".
      For each word, provide:
      1. The word itself.
      2. Its Japanese meaning.
      3. A clear, natural English example sentence suitable for the ${cefrLevel} level.
    `;

    // 4. API呼び出し
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 5. JSONのパース
    const words = JSON.parse(text);

    return NextResponse.json({ words });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // エラーの種類に応じたメッセージを返す
    let status = 500;
    let message = "単語の生成に失敗しました。";
    
    if (error.message?.includes("503")) {
      message = "AIサーバーが混雑しています。少し時間を置いて再試行してください。";
      status = 503;
    } else if (error.message?.includes("404")) {
      message = "指定されたモデルが見つかりません。";
      status = 404;
    }

    return NextResponse.json({ error: message, details: error.message }, { status });
  }
}
