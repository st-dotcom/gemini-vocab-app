# 🎓 AI 英単語学習アプリ (AI English Vocab)

ユーザーの「好きなテーマ」に合わせて、AIが最適な難易度の英単語を出題する適応型（Adaptive）の英単語学習WEBアプリです。
Next.js と Google の Gemini API を活用して開発されています。

## ✨ 主な機能

- **テーマ特化型クイズ**: 「宇宙」「料理」「IT」など、ユーザーが入力した好きなテーマに関連する英単語をAIが15個生成します。
- **CEFRレベルの自動調整**: クイズの正答率（⭕️/❌）に応じて、出題される英単語の難易度（CEFR: A1〜C2）が自動的にレベルアップ・ダウンします。
  - 正答率80%以上：次のレベルへアップ ⬆️
  - 正答率30%未満：前のレベルへダウン ⬇️
- **学習データの引き継ぎ**: 現在のCEFRレベルはブラウザ（ローカルストレージ）に自動保存され、次回アクセス時にも引き継がれます。
- **モダンなレスポンシブUI**: Tailwind CSSを使用した、PCでもスマートフォンでも使いやすいグラスモーフィズムデザインを採用しています。

## 🛠 技術スタック

- **フレームワーク**: [Next.js](https://nextjs.org/) (App Router / React)
- **スタイリング**: [Tailwind CSS](https://tailwindcss.com/)
- **AI API**: [Google Gemini API](https://ai.google.dev/) (`gemini-1.5-flash`)
- **ホスティング**: [Vercel](https://vercel.com/)

## 🚀 ローカルでの起動方法

ご自身のPC（ローカル環境）で動かす場合の手順です。

### 1. リポジトリのクローン
\`\`\`bash
git clone https://github.com/あなたのユーザー名/あなたのリポジトリ名.git
cd あなたのリポジトリ名
\`\`\`

### 2. パッケージのインストール
\`\`\`bash
npm install
\`\`\`

### 3. 環境変数の設定
プロジェクトのルートディレクトリに `.env.local` ファイルを作成し、Gemini APIキーを設定します。
（[Google AI Studio](https://aistudio.google.com/) から無料で取得できます）

\`\`\`env
GEMINI_API_KEY=あなたの_API_KEY_をここに入力
\`\`\`

### 4. 開発サーバーの起動
\`\`\`bash
npm run dev
\`\`\`
ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスするとアプリが表示されます。

## 🌐 Vercelへのデプロイ

このアプリは Vercel に最適化されています。

1. [Vercel](https://vercel.com/) にログインし、「Add New Project」をクリック。
2. このGitHubリポジトリをインポート。
3. **Environment Variables** に以下を追加。
   - Key: `GEMINI_API_KEY`
   - Value: `取得したAPIキー`
4. 「Deploy」をクリックして完了！

## 📁 ディレクトリ構造

\`\`\`text
├── app/
│   ├── api/
│   │   └── generate-words/
│   │       └── route.ts     # Gemini APIの呼び出し・プロンプト処理
│   ├── globals.css          # Tailwind CSSの設定・グローバルスタイル
│   ├── layout.tsx           # アプリ全体のレイアウト
│   └── page.tsx             # メイン画面のUIと学習ロジック
├── package.json
└── next.config.js
\`\`\`

---
*Created with Next.js & Gemini API*
