'use client';

import { useState, useEffect } from 'react';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

interface Word {
  word: string;
  meaning: string;
  example: string;
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
      
      if (res.ok && data.words) {
        setWords(data.words);
        setCurrentIndex(0);
        setCorrectCount(0);
        setShowMeaning(false);
        setQuizState('playing');
      } else {
        alert(data.error || 'エラーが発生しました。');
      }
    } catch (error) {
      alert('ネットワークエラーが発生しました。');
    } finally {
      setLoading(false);
    }
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
    if (scoreRate >= 0.8) levelIndex = Math.min(CEFR_LEVELS.length - 1, levelIndex + 1);
    else if (scoreRate < 0.3) levelIndex = Math.max(0, levelIndex - 1);

    const newLevel = CEFR_LEVELS[levelIndex];
    setCurrentLevel(newLevel);
    localStorage.setItem('cefrLevel', newLevel);
    setQuizState('result');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-indigo-700 to-rose-500 flex items-center justify-center p-4 font-sans text-slate-900 animate-reveal">
      <div className="glass-card p-8 sm:p-10 rounded-[2.5rem] max-w-md w-full transition-all">
        
        {quizState === 'input' && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-rose-500">
                AI英単語学習
              </h1>
              <div className="inline-block px-4 py-1 bg-violet-50 rounded-full border border-violet-100">
                <p className="text-xs font-bold text-violet-600 uppercase tracking-widest">Level: {currentLevel}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Learning Theme</label>
                <input
                  type="text"
                  placeholder="例: ビジネス, 宇宙, 料理"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-violet-400 focus:bg-white transition-all text-lg font-medium"
                />
              </div>
              <button
                onClick={startQuiz}
                disabled={loading || !topic}
                className="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold shadow-xl hover:bg-violet-600 active:scale-95 transition-all duration-200 disabled:bg-slate-200"
              >
                {loading ? 'AIが生成中...' : '学習をスタート'}
              </button>
            </div>
          </div>
        )}

        {quizState === 'playing' && words.length > 0 && (
          <div className="space-y-8 animate-reveal">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-300 tracking-widest uppercase">
              <span>Progress: {currentIndex + 1} / {words.length}</span>
              <span className="text-violet-500">{currentLevel}</span>
            </div>
            
            <div className="text-center py-4">
              <h2 className="text-5xl font-black text-slate-800 tracking-tighter break-words">
                {words[currentIndex].word}
              </h2>
            </div>
            
            {!showMeaning ? (
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleAnswer(false)} className="flex flex-col items-center gap-2 p-6 bg-slate-50 rounded-3xl hover:bg-rose-50 border-2 border-transparent hover:border-rose-100 transition-all group">
                  <span className="text-3xl group-hover:scale-110 transition-transform">❌</span>
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-rose-500">知らない</span>
                </button>
                <button onClick={() => handleAnswer(true)} className="flex flex-col items-center gap-2 p-6 bg-slate-50 rounded-3xl hover:bg-emerald-50 border-2 border-transparent hover:border-emerald-100 transition-all group">
                  <span className="text-3xl group-hover:scale-110 transition-transform">⭕️</span>
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-500">知っている</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-reveal">
                <div className="p-6 bg-violet-50/50 rounded-3xl border border-violet-100 space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Meaning</span>
                    <p className="text-2xl font-black text-violet-900">{words[currentIndex].meaning}</p>
                  </div>
                  <div className="pt-4 border-t border-violet-200/50">
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Example</span>
                    <p className="text-md italic text-slate-600 leading-relaxed font-serif mt-1">"{words[currentIndex].example}"</p>
                  </div>
                </div>
                <button onClick={nextWord} className="w-full bg-violet-600 text-white p-4 rounded-2xl font-bold shadow-lg hover:bg-violet-700 active:scale-95 transition-all">
                  Next Word →
                </button>
              </div>
            )}
          </div>
        )}

        {quizState === 'result' && (
          <div className="text-center space-y-8 animate-reveal">
            <h2 className="text-2xl font-black text-slate-800">Learning Complete!</h2>
            <div className="relative inline-flex items-center justify-center p-12 bg-slate-50 rounded-full border-8 border-violet-100">
                <span className="text-5xl font-black text-violet-600">{Math.round((correctCount/words.length)*100)}%</span>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Next CEFR Level</p>
              <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-rose-500">{currentLevel}</p>
            </div>
            <button onClick={() => {setTopic(''); setQuizState('input');}} className="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold hover:bg-slate-800 transition-all">
              もう一度挑戦する
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
