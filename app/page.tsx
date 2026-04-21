'use client';

import { useState, useEffect } from 'react';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LEVEL_DESCRIPTIONS: Record<string, string> = {
  'A1': '初学者・基本単語',
  'A2': '日常生活・身近な話題',
  'B1': '仕事や旅行での自立した会話',
  'B2': '複雑な議論や抽象的なトピック',
  'C1': '高度で専門的な表現',
  'C2': 'ネイティブに近い最上級'
};

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
  const [sessionResults, setSessionResults] = useState<{word: string, isCorrect: boolean}[]>([]);

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
        setSessionResults([]);
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
    setSessionResults(prev => [...prev, { word: words[currentIndex].word, isCorrect: isKnown }]);
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
    let nextLevel = currentLevel;

    if (scoreRate >= 0.8) {
      levelIndex = Math.min(CEFR_LEVELS.length - 1, levelIndex + 1);
    } else if (scoreRate < 0.3) {
      levelIndex = Math.max(0, levelIndex - 1);
    }
    
    nextLevel = CEFR_LEVELS[levelIndex];
    setCurrentLevel(nextLevel);
    localStorage.setItem('cefrLevel', nextLevel);
    setQuizState('result');
  };

  // 例文の中の単語を強調する
  const highlightWord = (example: string, word: string) => {
    const parts = example.split(new RegExp(`(${word})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === word.toLowerCase() 
            ? <b key={i} className="text-violet-400 underline decoration-violet-500/50 underline-offset-4">{part}</b> 
            : part
        )}
      </span>
    );
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/20 blur-[120px] rounded-full animate-float"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-600/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: '-2s' }}></div>

      <div className="premium-card p-8 sm:p-12 rounded-[2.5rem] max-w-xl w-full z-10">
        
        {quizState === 'input' && (
          <div className="space-y-10 animate-reveal">
            <div className="text-center space-y-4">
              <div className="inline-block px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-2">
                <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em]">AI Powered Experience</span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-gradient leading-tight">
                Gemini Vocab
              </h1>
              <p className="text-sm text-slate-400 font-medium max-w-[280px] mx-auto">
                あなたのレベルに合わせてAIが最適な英単語を生成します。
              </p>
            </div>

            <div className="space-y-8">
              {/* 現在のレベル表示 */}
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between group transition-all hover:bg-white/10">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Current Mastery</label>
                  <p className="text-sm font-bold text-slate-200">{LEVEL_DESCRIPTIONS[currentLevel]}</p>
                </div>
                <div className="text-4xl font-black text-violet-400 drop-shadow-sm group-hover:scale-110 transition-transform">
                  {currentLevel}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Learning Theme</label>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="例: 宇宙, 料理, ビジネス英語..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full p-5 bg-white/5 border-2 border-transparent rounded-[2rem] focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all text-lg font-medium placeholder:text-slate-600 pr-12"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity">
                    ✨
                  </div>
                </div>
              </div>

              <button
                onClick={startQuiz}
                disabled={loading || !topic}
                className="btn-primary w-full text-lg tracking-wide"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <span className="animate-pulse">Generating</span>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                ) : '学習を開始する'}
              </button>
            </div>
          </div>
        )}

        {quizState === 'playing' && words.length > 0 && (
          <div className="space-y-10 animate-reveal">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Words Progress</span>
                  <span className="text-xl font-black text-slate-100">{currentIndex + 1} <span className="text-slate-600 text-sm font-medium">/ {words.length}</span></span>
                </div>
                <div className="px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-lg">
                  <span className="text-xs font-black text-violet-400">{currentLevel}</span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700 ease-out"
                  style={{ width: `${((currentIndex + (showMeaning ? 1 : 0)) / words.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="min-h-[220px] flex flex-col items-center justify-center text-center px-4">
              <h2 className="text-6xl font-black text-white tracking-tighter mb-4 break-words leading-[1.1]">
                {words[currentIndex].word}
              </h2>
              {/* 発音ボタン(ダミー) */}
              <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
              </button>
            </div>

            {!showMeaning ? (
              <div className="grid grid-cols-2 gap-5">
                <button 
                  onClick={() => handleAnswer(false)} 
                  className="group flex flex-col items-center gap-3 p-8 bg-white/5 rounded-[2rem] border border-white/5 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all"
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 text-2xl group-hover:scale-110 transition-transform">✕</div>
                  <span className="text-xs font-bold text-slate-500 group-hover:text-rose-400 tracking-wide uppercase">知らない</span>
                </button>
                <button 
                  onClick={() => handleAnswer(true)} 
                  className="group flex flex-col items-center gap-3 p-8 bg-white/5 rounded-[2rem] border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all"
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 text-2xl group-hover:scale-110 transition-transform">✓</div>
                  <span className="text-xs font-bold text-slate-500 group-hover:text-emerald-400 tracking-wide uppercase">知っている</span>
                </button>
              </div>
            ) : (
              <div className="space-y-8 animate-reveal">
                <div className="p-8 bg-violet-500/10 rounded-[2.5rem] border border-violet-500/20 space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path><path d="M8 7h6"></path><path d="M4 19.5a2.5 2.5 0 0 1 2.5-2.5H20"></path></svg>
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] block mb-2">Meaning</span>
                    <p className="text-3xl font-black text-white">{words[currentIndex].meaning}</p>
                  </div>
                  
                  <div className="pt-6 border-t border-white/5">
                    <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] block mb-3">Example Context</span>
                    <p className="text-lg italic text-slate-300 leading-relaxed font-light">
                      "{highlightWord(words[currentIndex].example, words[currentIndex].word)}"
                    </p>
                  </div>
                </div>

                <button 
                  onClick={nextWord} 
                  className="btn-primary w-full text-lg"
                >
                  {currentIndex + 1 === words.length ? '結果を見る' : '次の単語へ →'}
                </button>
              </div>
            )}
          </div>
        )}

        {quizState === 'result' && (
          <div className="text-center space-y-10 animate-reveal">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white tracking-tight">Mission Accomplished!</h2>
              <p className="text-slate-400 text-sm">本日の学習テーマ: {topic}</p>
            </div>

            <div className="relative inline-flex items-center justify-center">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-white/5"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={502.4}
                  strokeDashoffset={502.4 * (1 - correctCount / words.length)}
                  className="text-violet-500 transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-5xl font-black text-white">{Math.round((correctCount/words.length)*100)}%</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Accuracy</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Old Level</span>
                <span className="text-2xl font-black text-slate-400">{sessionResults.length > 0 ? (CEFR_LEVELS[Math.max(0, CEFR_LEVELS.indexOf(currentLevel) - (correctCount/words.length >= 0.8 ? 1 : 0) + (correctCount/words.length < 0.3 ? 1 : 0))] || 'A1') : currentLevel}</span>
              </div>
              <div className="p-5 bg-violet-600/20 rounded-2xl border border-violet-500/30">
                <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest block mb-1">New Level</span>
                <span className="text-2xl font-black text-white">{currentLevel}</span>
              </div>
            </div>

            <button 
              onClick={() => {setTopic(''); setQuizState('input');}} 
              className="btn-primary w-full"
            >
              新しいテーマで開始する
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

