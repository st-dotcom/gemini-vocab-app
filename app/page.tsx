'use client';

import { useState, useEffect } from 'react';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LEVEL_DESCRIPTIONS: Record<string, string> = {
  'A1': 'Beginner (初級)',
  'A2': 'Elementary (初中級)',
  'B1': 'Intermediate (中級)',
  'B2': 'Upper-Intermediate (中上級)',
  'C1': 'Advanced (上級)',
  'C2': 'Proficient (最上級)'
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
      setCurrentLevel('A1'); // デフォルトはA1
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
    <main className="min-h-screen py-8 px-4 sm:px-6 md:py-16">
      <div className="max-w-xl mx-auto">
        
        {quizState === 'input' && (
          <div className="pastel-card p-6 sm:p-10 rounded-[2rem] space-y-8 animate-reveal">
            <div className="text-center space-y-3">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gradient-pastel">
                Gemini Vocab
              </h1>
              <p className="text-slate-500 text-sm font-medium">
                テーマを決めて英単語トレーニングを開始しましょう
              </p>
            </div>

            <div className="space-y-6">
              {/* レベル情報 */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm text-xl font-black text-indigo-600">
                  {currentLevel}
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Current Level</label>
                  <p className="text-sm font-bold text-slate-700">{LEVEL_DESCRIPTIONS[currentLevel]}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Learning Theme</label>
                <input
                  type="text"
                  placeholder="例: ビジネス, 旅行, IT..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-lg font-medium"
                />
              </div>

              <button
                onClick={startQuiz}
                disabled={loading || !topic}
                className="btn-action-primary w-full text-lg shadow-indigo-100"
              >
                {loading ? '英単語を生成中...' : '学習をスタート'}
              </button>
            </div>
          </div>
        )}

        {quizState === 'playing' && words.length > 0 && (
          <div className="space-y-6 animate-reveal">
            <div className="pastel-card p-4 sm:p-6 rounded-2xl flex justify-between items-center bg-white/50">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Progress</span>
                <span className="text-lg font-black text-slate-800">{currentIndex + 1} / {words.length}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Level</span>
                <div className="text-lg font-black text-indigo-600">{currentLevel}</div>
              </div>
            </div>

            <div className="pastel-card p-10 sm:p-16 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
              <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight mb-6 break-words">
                {words[currentIndex].word}
              </h2>
              <div className="flex gap-2">
                 <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full">{currentLevel}</div>
              </div>
            </div>

            {!showMeaning ? (
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleAnswer(false)} 
                  className="btn-pastel p-6 flex flex-col items-center gap-2 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                >
                  <span className="text-2xl">✕</span>
                  <span className="text-xs font-bold text-slate-500">知らない</span>
                </button>
                <button 
                  onClick={() => handleAnswer(true)} 
                  className="btn-pastel p-6 flex flex-col items-center gap-2 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                >
                  <span className="text-2xl">✓</span>
                  <span className="text-xs font-bold text-slate-500">知っている</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-reveal">
                <div className="pastel-card p-6 sm:p-8 rounded-[2rem] space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Meaning</label>
                    <p className="text-2xl font-black text-slate-900">{words[currentIndex].meaning}</p>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Example</label>
                    <p className="text-md sm:text-lg text-slate-700 leading-relaxed italic">
                      "{highlightWord(words[currentIndex].example, words[currentIndex].word)}"
                    </p>
                  </div>
                </div>
                <button onClick={nextWord} className="btn-action-primary w-full text-lg">
                  {currentIndex + 1 === words.length ? '結果を確認する' : '次の単語へ'}
                </button>
              </div>
            )}
          </div>
        )}

        {quizState === 'result' && (
          <div className="pastel-card p-8 sm:p-12 rounded-[2.5rem] text-center space-y-10 animate-reveal">
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">学習お疲れ様でした！</h2>
              <p className="text-sm text-slate-500 font-medium">今回の正答率をチェックしましょう</p>
            </div>

            <div className="flex flex-col items-center justify-center gap-2">
              <div className="text-6xl font-black text-indigo-600">
                {Math.round((correctCount/words.length)*100)}<span className="text-2xl text-slate-400">%</span>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{correctCount} / {words.length} Correct</p>
            </div>

            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Level Status</div>
              {levelChange === 'up' && (
                <div className="space-y-2">
                  <div className="text-emerald-500 text-xl font-bold flex items-center justify-center gap-2">
                    <span>Level Up!</span>
                    <span className="animate-bounce">🚀</span>
                  </div>
                  <p className="text-2xl font-black text-slate-800">Next: {currentLevel}</p>
                </div>
              )}
              {levelChange === 'stay' && (
                <div className="space-y-2">
                  <div className="text-indigo-500 text-xl font-bold">Level Stayed</div>
                  <p className="text-2xl font-black text-slate-800">Keep it up at {currentLevel}</p>
                </div>
              )}
              {levelChange === 'down' && (
                <div className="space-y-2">
                  <div className="text-rose-500 text-xl font-bold">Step Back</div>
                  <p className="text-2xl font-black text-slate-800">Reviewing {currentLevel}</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => {setTopic(''); setQuizState('input');}} 
              className="btn-action-primary w-full"
            >
              もう一度挑戦する
            </button>
          </div>
        )}

      </div>
    </main>
  );
}

