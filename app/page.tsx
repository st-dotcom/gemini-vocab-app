'use client';

import { useState, useEffect } from 'react';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LEVEL_DESCRIPTIONS: Record<string, { label: string, detail: string, icon: string }> = {
  'A1': { label: 'Beginner (初級)', detail: '自己紹介や基本的な挨拶、ごく簡単なやり取りができるレベル。', icon: '🌱' },
  'A2': { label: 'Elementary (初中級)', detail: '日常生活や身近な話題について、直接的な情報交換ができるレベル。', icon: '📝' },
  'B1': { label: 'Intermediate (中級)', detail: '仕事や旅行での一般的な事態に対処し、自分の意見を述べられるレベル。', icon: '💬' },
  'B2': { label: 'Upper-Intermediate (中上級)', detail: '抽象的なトピックでも要点を理解し、自然なやり取りができるレベル。', icon: '🎓' },
  'C1': { label: 'Advanced (上級)', detail: '複雑な話題を理解し、専門的な議論や流暢な表現ができるレベル。', icon: '⚖️' },
  'C2': { label: 'Proficient (最上級)', detail: '読み書き・会話ともにネイティブ並みに自在に使いこなせる最高レベル。', icon: '👑' }
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
  const [levelChange, setLevelChange] = useState<'up' | 'stay' | 'down' | null>(null);

  useEffect(() => {
    const savedLevel = localStorage.getItem('cefrLevel');
    if (savedLevel && CEFR_LEVELS.includes(savedLevel)) {
      setCurrentLevel(savedLevel);
    } else {
      setCurrentLevel('A1');
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
        setLevelChange(null);
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
    let nextLevel = currentLevel;

    if (scoreRate >= 0.8) {
      if (levelIndex < CEFR_LEVELS.length - 1) {
        levelIndex++;
        setLevelChange('up');
      } else {
        setLevelChange('stay');
      }
    } else if (scoreRate < 0.3) {
      if (levelIndex > 0) {
        levelIndex--;
        setLevelChange('down');
      } else {
        setLevelChange('stay');
      }
    } else {
      setLevelChange('stay');
    }

    nextLevel = CEFR_LEVELS[levelIndex];
    setCurrentLevel(nextLevel);
    localStorage.setItem('cefrLevel', nextLevel);
    setQuizState('result');
  };

  const highlightWord = (example: string, word: string) => {
    const parts = example.split(new RegExp(`(${word})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === word.toLowerCase()
            ? <b key={i} className="text-indigo-600 border-b-2 border-indigo-200">{part}</b>
            : part
        )}
      </span>
    );
  };

  return (
    <main className="min-h-screen py-6 px-4 sm:px-6 md:py-12">
      <div className="max-w-2xl mx-auto space-y-8">

        {quizState === 'input' && (
          <div className="space-y-8 animate-reveal">
            {/* 1. Header & Welcome */}
            <div className="text-center space-y-4">
              <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-2">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">AI Language Tutor</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-gradient-pastel">
                Gemini Vocab
              </h1>
              <p className="text-slate-600 font-medium max-w-lg mx-auto leading-relaxed">
                あなたの興味に合わせてAIが英単語をセレクト。<br className="hidden sm:block" />
                世界基準（CEFR）に基づいた効率的なステップアップを実現します。
              </p>
            </div>

            {/* 2. How it Works */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { step: '01', title: 'テーマ入力', desc: '好きな話題を入力してAIに注文', icon: '🎯' },
                { step: '02', title: '15問クイズ', desc: '文脈と一緒に意味を確認', icon: '📝' },
                { step: '03', title: 'レベル同期', desc: '実力に合わせて難易度が自動変化', icon: '📈' },
              ].map((item, i) => (
                <div key={i} className="pastel-card p-5 rounded-2xl flex flex-col items-center text-center space-y-2 border-none bg-white/60">
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{item.step}</div>
                  <h3 className="font-bold text-slate-800">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-tight">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* 3. Main Input Section */}
            <div className="pastel-card p-6 sm:p-10 rounded-[2.5rem] space-y-8 relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white/80 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-indigo-200">
                    <div className="w-14 h-14 flex flex-col items-center justify-center bg-indigo-600 rounded-xl text-white">
                      <span className="text-[10px] font-bold opacity-80 leading-none">LEVEL：</span>
                      <span className="text-2xl font-black leading-none mt-0.5">{currentLevel}</span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-0.5">Your Mastery</p>
                      <p className="text-sm font-bold text-slate-800">{LEVEL_DESCRIPTIONS[currentLevel].label}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Learning Theme</label>
                    <input
                      type="text"
                      placeholder="例: ビジネス、宇宙、カフェでの会話..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full p-5 bg-white border border-slate-200 rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-lg font-medium shadow-sm pr-12"
                    />
                  </div>
                </div>

                <button
                  onClick={startQuiz}
                  disabled={loading || !topic}
                  className="btn-action-primary w-full text-lg py-5 shadow-2xl"
                >
                  {loading ? 'AIが教材を準備中...' : '学習をスタート →'}
                </button>
              </div>
            </div>

            {/* 4. CEFR Guide */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-px bg-slate-200 flex-grow"></div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">CEFR Level Guide</h3>
                <div className="h-px bg-slate-200 flex-grow"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-8">
                {CEFR_LEVELS.map((level) => (
                  <div key={level} className={`p-4 rounded-2xl border transition-all ${currentLevel === level ? 'bg-indigo-50/50 border-indigo-200 shadow-sm ring-1 ring-indigo-200' : 'bg-white border-slate-100 hover:border-slate-300 opacity-70'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">{LEVEL_DESCRIPTIONS[level].icon}</span>
                      <span className="text-lg font-black text-slate-800">{level}</span>
                      <span className="text-[10px] font-bold text-slate-400 border px-1.5 py-0.5 rounded uppercase">{level === currentLevel ? 'Current' : 'Target'}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {LEVEL_DESCRIPTIONS[level].detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {quizState === 'playing' && words.length > 0 && (
          <div className="space-y-6 animate-reveal">
            <div className="pastel-card p-4 sm:p-6 rounded-2xl flex justify-between items-center bg-white/80">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</span>
                <span className="text-lg font-black text-slate-800">{currentIndex + 1} / {words.length}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mastery</span>
                <div className="text-lg font-black text-indigo-600">{currentLevel}</div>
              </div>
            </div>

            {/* Word Card */}
            <div className="pastel-card p-12 sm:p-20 rounded-[3rem] flex flex-col items-center justify-center text-center bg-white">
              <div className="px-4 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest mb-6">{currentLevel} VOCABULARY</div>
              <h2 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tighter mb-8 break-words leading-none">
                {words[currentIndex].word}
              </h2>
              <div className="flex gap-4">
                <button className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-all border border-slate-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                </button>
              </div>
            </div>

            {!showMeaning ? (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAnswer(false)}
                  className="btn-pastel p-8 flex flex-col items-center gap-3 hover:bg-rose-50 hover:border-rose-200 transition-all rounded-[2.5rem]"
                >
                  <div className="w-12 h-12 flex items-center justify-center bg-rose-100 text-rose-500 rounded-2xl text-xl">✕</div>
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Don't Know</span>
                </button>
                <button
                  onClick={() => handleAnswer(true)}
                  className="btn-pastel p-8 flex flex-col items-center gap-3 hover:bg-emerald-50 hover:border-emerald-200 transition-all rounded-[2.5rem]"
                >
                  <div className="w-12 h-12 flex items-center justify-center bg-emerald-100 text-emerald-500 rounded-2xl text-xl">✓</div>
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">I Know This</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-reveal">
                <div className="pastel-card p-8 sm:p-10 rounded-[2.5rem] space-y-8 bg-white/90">
                  <div>
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] block mb-2">Meaning</label>
                    <p className="text-3xl font-black text-slate-900 leading-tight">{words[currentIndex].meaning}</p>
                  </div>
                  <div className="pt-6 border-t border-slate-100">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] block mb-3">Context & Example</label>
                    <p className="text-lg sm:text-xl text-slate-700 leading-relaxed italic font-serif">
                      "{highlightWord(words[currentIndex].example, words[currentIndex].word)}"
                    </p>
                  </div>
                </div>
                <button onClick={nextWord} className="btn-action-primary w-full text-lg py-5">
                  {currentIndex + 1 === words.length ? '結果を確認する →' : '次の単語へ進む →'}
                </button>
              </div>
            )}
          </div>
        )}

        {quizState === 'result' && (
          <div className="pastel-card p-10 sm:p-16 rounded-[3rem] text-center space-y-12 animate-reveal bg-white">
            <div className="space-y-3">
              <div className="text-4xl">🎉</div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Mission Accomplished</h2>
              <p className="text-slate-500 font-medium tracking-wide">本日の学習テーマ: {topic}</p>
            </div>

            <div className="flex flex-col items-center justify-center gap-3">
              <div className="text-7xl font-black text-indigo-600 tracking-tighter">
                {Math.round((correctCount / words.length) * 100)}<span className="text-2xl text-slate-300 ml-1">%</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-1 bg-slate-50 rounded-full border border-slate-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{correctCount} / {words.length} Accurate</span>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 space-y-6">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Mastery Transition</div>

              <div className="flex items-center justify-center gap-6">
                {levelChange === 'up' && (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl animate-bounce">🆙</span>
                    <p className="text-xl font-black text-emerald-600">Level Up!</p>
                  </div>
                )}
                {levelChange === 'stay' && (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">✨</span>
                    <p className="text-xl font-black text-indigo-600">Level Maintained</p>
                  </div>
                )}
                {levelChange === 'down' && (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">📚</span>
                    <p className="text-xl font-black text-rose-500">Revisiting Basics</p>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-center gap-8 border-t border-white">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Was</p>
                  <p className="text-3xl font-black text-slate-300">
                    {CEFR_LEVELS[Math.max(0, CEFR_LEVELS.indexOf(currentLevel) - (levelChange === 'up' ? 1 : 0) + (levelChange === 'down' ? 1 : 0))]}
                  </p>
                </div>
                <div className="text-slate-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Now</p>
                  <p className="text-3xl font-black text-indigo-600">{currentLevel}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => { setTopic(''); setQuizState('input'); }}
              className="btn-action-primary w-full text-lg py-5"
            >
              新しいテーマで再開する
            </button>
          </div>
        )}

      </div>
    </main>
  );
}

