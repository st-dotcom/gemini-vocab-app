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
      
      if (res.ok && data.words && data.words.length > 0) {
        // 成功した場合
        setWords(data.words);
        setCurrentIndex(0);
        setCorrectCount(0);
        setShowMeaning(false);
        setQuizState('playing');
      } else {
        // APIからエラーが返ってきた場合
        console.error("API Error Details:", data);
        alert(`エラーが発生しました: ${data.details || data.error || '単語データを取得できませんでした'}`);
      }
    } catch (error) {
      // ネットワークエラーなど
      console.error("Fetch Error:", error);
      alert('サーバーとの通信に失敗しました。時間をおいて再試行してください。');
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
    const scoreRate = correctCount / words.length;
    let levelIndex = CEFR_LEVELS.indexOf(currentLevel);

    if (scoreRate >= 0.8) {
      levelIndex = Math.min(CEFR_LEVELS.length - 1, levelIndex + 1);
    } else if (scoreRate < 0.3) {
      levelIndex = Math.max(0, levelIndex - 1);
    }

    const newLevel = CEFR_LEVELS[levelIndex];
    setCurrentLevel(newLevel);
    localStorage.setItem('cefrLevel', newLevel); 
    setQuizState('result');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 flex items-center justify-center p-4 sm:p-8 font-sans text-slate-800">
      <div className="bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white max-w-md w-full transition-all">
        
        {quizState === 'input' && (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                AI English Vocab
              </h1>
              <div className="inline-block px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
                <p className="text-sm text-slate-600 font-medium">
                  現在のレベル: <span className="font-bold text-blue-600 ml-1">{currentLevel}</span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="好きなテーマ (例: 宇宙, カフェ)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-700 placeholder-slate-400 shadow-inner"
              />
              <button
                onClick={startQuiz}
                disabled={loading || !topic}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="animate-pulse">単語を生成中...</span>
                ) : (
                  '学習をスタート ✨'
                )}
              </button>
            </div>
          </div>
        )}

        {quizState === 'playing' && words.length > 0 && (
          <div className="space-y-8 text-center">
            <div className="flex justify-between items-center text-sm font-medium text-slate-400 px-2">
              <span>Q. {currentIndex + 1}</span>
              <span>残り {words.length - (currentIndex + 1)} 問</span>
            </div>
            
            <div className="min-h-[120px] flex items-center justify-center">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight break-all">
                {words[currentIndex].word}
              </h2>
            </div>
            
            {!showMeaning ? (
              <div className="flex justify-center gap-6 pt-4">
                <button 
                  onClick={() => handleAnswer(false)} 
                  className="w-20 h-20 flex items-center justify-center text-3xl bg-white border-2 border-rose-100 text-rose-500 rounded-2xl shadow-sm hover:bg-rose-50 hover:border-rose-200 hover:scale-105 active:scale-95 transition-all"
                >
                  ❌
                </button>
                <button 
                  onClick={() => handleAnswer(true)} 
                  className="w-20 h-20 flex items-center justify-center text-3xl bg-white border-2 border-emerald-100 text-emerald-500 rounded-2xl shadow-sm hover:bg-emerald-50 hover:border-emerald-200 hover:scale-105 active:scale-95 transition-all"
                >
                  ⭕️
                </button>
              </div>
            ) : (
              <div className="space-y-6 pt-2">
                <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                  <p className="text-2xl font-bold text-indigo-700">{words[currentIndex].meaning}</p>
                </div>
                <button 
                  onClick={nextWord} 
                  className="w-full bg-slate-800 text-white p-4 rounded-xl font-bold shadow-md hover:bg-slate-700 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  次の単語へ
                </button>
              </div>
            )}
          </div>
        )}

        {quizState === 'result' && (
          <div className="space-y-8 text-center py-4">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-slate-800">学習完了！ 🎉</h2>
              <p className="text-lg text-slate-600 font-medium">正解数: <span className="text-indigo-600 font-bold">{correctCount}</span> / {words.length}</p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100/50 shadow-inner">
              <p className="text-sm text-slate-500 font-medium mb-1">次のレベル</p>
              <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 drop-shadow-sm">
                {currentLevel}
              </p>
            </div>
            
            <button
              onClick={() => {
                setTopic('');
                setQuizState('input');
              }}
              className="w-full bg-white border-2 border-slate-200 text-slate-700 p-4 rounded-xl font-bold shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
            >
              ホームに戻る
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
