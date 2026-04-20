import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// APIキーの読み込み
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { topic, cefrLevel } = await req.json();
    
    // スキーマ（構造化出力）の定義
    // ここで配列の中にオブジェクト（word, meaning）が入る形を厳密に指定します
    const responseSchema = {
      type: SchemaType.ARRAY,
      description: "指定されたテーマとCEFRレベルに関連する15個の英単語リスト",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          word: {
            type: SchemaType.STRING,
            description: "英単語",
          },
          meaning: {
            type: SchemaType.STRING,
            description: "その英単語の日本語の意味",
          },
        },
        required: ["word", "meaning"],
      },
    };

    // モデルの初期化時に設定を渡す
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema, // 定義したスキーマを適用
      }
    });

    const prompt = `あなたはプロの英語教師です。ユーザーが指定したテーマ「${topic}」に関連する英単語を15個生成してください。
    難易度はCEFRの「${cefrLevel}」レベルに厳密に合わせてください。`;

    // APIへリクエスト送信
    const result = await model.generateContent(prompt);
    
    // 結果を受け取り、JSONとしてパース
    const text = result.response.text();
    const words = JSON.parse(text);

    return NextResponse.json({ words });
  } catch (error) {
    console.error("API実行エラー:", error);
    // エラーの詳細をフロントエンドに返す
    return NextResponse.json(
      { error: '単語の生成に失敗しました', details: String(error) }, 
      { status: 500 }
    );
  }
}
