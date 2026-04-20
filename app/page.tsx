'use client';

import { useState, useEffect } from 'react';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

interface Word {
  word: string;
  meaning: string;
}

export default function Home() {
  const [topic, setTopic] = useState('');
  const [currentLevel, setCurrentLevel] = useState('A1');
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quizState, setQuizState] = useState<'input' | 'playing' | 'result'>('input');

  // 初回読み込み時にlocalStorageからCEFRレベルを取得
  useEffect(() => {
    const savedLevel = localStorage.getItem('cefrLevel');
    if (savedLevel && CEFR_LEVELS.includes(savedLevel)) {
      setCurrentLevel(savedLevel);
    }
  }, []);

  const startQuiz = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const res = await fetch('/api/generate-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, cefrLevel: currentLevel }),
      });
      const data = await res.json();
      if (data.words) {
        setWords(data.words);
        setCurrentIndex(0);
        setCorrectCount(0);
        setShowMeaning(false);
        setQuizState('playing');
      }
    } catch (error) {
      alert('エラーが発生しました。');
    }
    setLoading(false);
  };

  const handleAnswer = (isKnown: boolean) => {
    if (isKnown) setCorrectCount(prev => prev + 1);
    setShowMeaning(true);
  };

  const nextWord = () => {
    if (currentIndex + 1 < words.length) {
      setCurrentIndex(prev => prev + 1);
      setShowMeaning(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const scoreRate = correctCount / words.length; // 通常は / 15
    let levelIndex = CEFR_LEVELS.indexOf(currentLevel);

    // 8割以上でレベルアップ、3割未満でレベルダウン
    if (scoreRate >= 0.8) {
      levelIndex = Math.min(CEFR_LEVELS.length - 1, levelIndex + 1);
    } else if (scoreRate < 0.3) {
      levelIndex = Math.max(0, levelIndex - 1);
    }

    const newLevel = CEFR_LEVELS[levelIndex];
    setCurrentLevel(newLevel);
    localStorage.setItem('cefrLevel', newLevel); // 学習記録を保存
    setQuizState('result');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        
        {quizState === 'input' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-center">AI英単語学習</h1>
            <p className="text-center text-gray-600">現在のレベル: <span className="font-bold text-blue-600">{currentLevel}</span></p>
            <input
              type="text"
              placeholder="好きな単語やテーマを入力 (例: 宇宙, 料理)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={startQuiz}
              disabled={loading || !topic}
              className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '単語を生成中...' : '学習をスタート'}
            </button>
          </div>
        )}

        {quizState === 'playing' && words.length > 0 && (
          <div className="space-y-6 text-center">
            <p className="text-sm text-gray-500">{currentIndex + 1} / {words.length}</p>
            <h2 className="text-4xl font-bold">{words[currentIndex].word}</h2>
            
            {!showMeaning ? (
              <div className="flex justify-center gap-4 pt-4">
                <button onClick={() => handleAnswer(false)} className="w-20 h-20 text-4xl bg-red-100 text-red-600 rounded-full hover:bg-red-200">❌</button>
                <button onClick={() => handleAnswer(true)} className="w-20 h-20 text-4xl bg-green-100 text-green-600 rounded-full hover:bg-green-200">⭕️</button>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <p className="text-2xl font-semibold text-blue-600">{words[currentIndex].meaning}</p>
                <button onClick={nextWord} className="w-full bg-gray-800 text-white p-3 rounded font-bold hover:bg-gray-900">
                  次の単語へ
                </button>
              </div>
            )}
          </div>
        )}

        {quizState === 'result' && (
          <div className="space-y-6 text-center">
            <h2 className="text-2xl font-bold">学習完了！</h2>
            <p className="text-xl">正解数: {correctCount} / {words.length}</p>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-600">次のレベル:</p>
              <p className="text-3xl font-bold text-blue-600">{currentLevel}</p>
            </div>
            <button
              onClick={() => {
                setTopic('');
                setQuizState('input');
              }}
              className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700"
            >
              ホームに戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
