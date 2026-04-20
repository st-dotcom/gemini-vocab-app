import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// APIキーの読み込み
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { topic, cefrLevel } = await req.json();
    
    // 構造化出力のスキーマ定義
    const responseSchema = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          word: {
            type: SchemaType.STRING,
            description: "English word",
          },
          meaning: {
            type: SchemaType.STRING,
            description: "Japanese translation",
          },
        },
        required: ["word", "meaning"],
      },
    };

    // モデルの指定: 最新の gemini-2.0-flash を使用
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3-flash-preview', 
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const prompt = `あなたはプロの英語教師です。ユーザーが指定したテーマ「${topic}」に関連する英単語を15個生成してください。
    難易度はCEFRの「${cefrLevel}」レベルに厳密に合わせてください。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // JSONとして解析
    const words = JSON.parse(text);

    return NextResponse.json({ words });
  } catch (error: any) {
    console.error("API実行エラー:", error);
    
    // 404エラーなどの詳細な理由をフロントエンドに渡す
    let errorMessage = '単語の生成に失敗しました';
    if (error.message?.includes('404')) {
      errorMessage = '指定したモデルが見つかりません。APIキーの設定やモデル名を確認してください。';
    }

    return NextResponse.json(
      { error: errorMessage, details: error.message }, 
      { status: 500 }
    );
  }
}
