import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { topic, cefrLevel } = await req.json();
    
    // Gemini 1.5 Flashモデルを使用（高速で安価・無料枠あり）
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `あなたはプロの英語教師です。ユーザーが指定したテーマ「${topic}」に関連する英単語を15個生成してください。
    難易度はCEFRの「${cefrLevel}」レベルに厳密に合わせてください。
    以下のJSON形式の配列のみを出力してください。マークダウン（\`\`\`json など）やその他の説明文は一切含めないでください。
    [
      { "word": "英単語", "meaning": "日本語の意味" }
    ]`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json", // JSON形式を強制
      }
    });
    
    const text = result.response.text();
    const words = JSON.parse(text);

    return NextResponse.json({ words });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '単語の生成に失敗しました' }, { status: 500 });
  }
}
