import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const SPRITES = {
  fox: {
    name: '小狐狸',
    src: 'https://raw.githubusercontent.com/s0914712/RUNKU/main/sprite/FOX_CHAR/stand.png',
  },
  deer: {
    name: '小鹿',
    src: 'https://raw.githubusercontent.com/s0914712/RUNKU/main/sprite/DEER_CHAR/stand.png',
  },
  dragon: {
    name: '小龍王',
    src: 'https://raw.githubusercontent.com/s0914712/RUNKU/main/sprite/DRAGON_CHAR/boss.png',
  },
};

const NOTE_LABEL = {
  don: '咚',
  ka: '咔',
};

const KEY_MAP = {
  f: 'don',
  j: 'don',
  d: 'ka',
  k: 'ka',
  ArrowLeft: 'don',
  ArrowRight: 'ka',
};

const LESSONS = [
  {
    id: 'six-eight-1',
    name: '6/8 入門',
    subtitle: '先感受兩大拍：1-2-3 / 4-5-6',
    bpm: 72,
    countIn: 6,
    beatsPerBar: 6,
    pattern: ['don', null, null, 'don', null, null],
  },
  {
    id: 'six-eight-2',
    name: '6/8 小跑步',
    subtitle: '每個八分音符都要踩穩',
    bpm: 88,
    countIn: 6,
    beatsPerBar: 6,
    pattern: ['don', 'don', 'don', 'ka', 'don', 'don'],
  },
  {
    id: 'six-eight-3',
    name: '咚咔交替',
    subtitle: '分辨中心音「咚」與鼓邊音「咔」',
    bpm: 96,
    countIn: 6,
    beatsPerBar: 6,
    pattern: ['don', 'ka', 'don', 'don', 'ka', 'don'],
  },
  {
    id: 'six-eight-4',
    name: '附點節奏',
    subtitle: '長短交錯，對應課本常見 6/8 節奏型',
    bpm: 84,
    countIn: 6,
    beatsPerBar: 6,
    pattern: ['don', null, 'ka', 'don', 'don', null],
  },
  {
    id: 'challenge',
    name: '小小鼓王挑戰',
    subtitle: '連續四小節，練習看、聽、按同步',
    bpm: 106,
    countIn: 6,
    beatsPerBar: 6,
    pattern: [
      'don', 'don', 'ka', 'don', null, 'ka',
      'don', null, 'don', 'ka', 'ka', 'don',
      'don', 'ka', 'don', 'don', 'don', 'ka',
      'don', null, 'ka', 'don', 'ka', 'don',
    ],
  },
];

const HIT_WINDOWS = {
  perfect: 80,
  great: 135,
  good: 200,
};

function createNotes(lesson) {
  return lesson.pattern
    .map((type, index) => (type ? { id: `${lesson.id}-${index}`, type, beat: index, judged: false } : null))
    .filter(Boolean);
}

function playTone(audioCtxRef, type) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  if (!audioCtxRef.current) audioCtxRef.current = new AudioContextClass();
  const ctx = audioCtxRef.current;
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type === 'don' ? 'sine' : 'triangle';
  oscillator.frequency.setValueAtTime(type === 'don' ? 155 : 420, now);
  oscillator.frequency.exponentialRampToValueAtTime(type === 'don' ? 82 : 230, now + 0.08);

  gain.gain.setValueAtTime(type === 'don' ? 0.26 : 0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + (type === 'don' ? 0.16 : 0.09));

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.18);
}

export default function RhythmTaiko() {
  const [lessonId, setLessonId] = useState(LESSONS[0].id);
  const [spriteKey, setSpriteKey] = useState('fox');
  const [status, setStatus] = useState('idle');
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState(() => createNotes(LESSONS[0]));
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [judgement, setJudgement] = useState('準備好了嗎？');
  const [hitPulse, setHitPulse] = useState(null);
  const [stats, setStats] = useState({ perfect: 0, great: 0, good: 0, miss: 0 });
  const frameRef = useRef(null);
  const audioCtxRef = useRef(null);
  const notesRef = useRef(notes);
  const statusRef = useRef(status);

  const lesson = useMemo(
    () => LESSONS.find((item) => item.id === lessonId) || LESSONS[0],
    [lessonId],
  );

  const beatMs = 60000 / lesson.bpm / 3;
  const leadMs = Math.max(1600, beatMs * 6);
  const totalBeats = lesson.pattern.length;
  const totalDuration = leadMs + (totalBeats + 1) * beatMs;

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const resetGame = useCallback((nextLesson = lesson) => {
    const fresh = createNotes(nextLesson);
    notesRef.current = fresh;
    setNotes(fresh);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setStats({ perfect: 0, great: 0, good: 0, miss: 0 });
    setElapsed(0);
    setJudgement('準備好了嗎？');
    setHitPulse(null);
    setStatus('idle');
  }, [lesson]);

  useEffect(() => {
    resetGame(lesson);
  }, [lessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  const finishGame = useCallback(() => {
    if (statusRef.current !== 'playing') return;
    statusRef.current = 'finished';
    setStatus('finished');
    setCombo(0);
    setJudgement('完成！看看你有多準 🎉');
  }, []);

  useEffect(() => {
    if (status !== 'playing') {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return undefined;
    }

    const tick = (now) => {
      const current = now - startedAt;
      setElapsed(current);

      const updated = notesRef.current.map((note) => {
        if (note.judged) return note;
        const hitTime = leadMs + note.beat * beatMs;
        if (current - hitTime > HIT_WINDOWS.good) {
          setStats((prev) => ({ ...prev, miss: prev.miss + 1 }));
          setCombo(0);
          setJudgement('MISS');
          return { ...note, judged: true, result: 'miss' };
        }
        return note;
      });

      if (updated.some((note, i) => note !== notesRef.current[i])) {
        notesRef.current = updated;
        setNotes(updated);
      }

      if (current >= totalDuration) {
        finishGame();
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [status, startedAt, beatMs, leadMs, totalDuration, finishGame]);

  const startGame = useCallback(() => {
    const fresh = createNotes(lesson);
    notesRef.current = fresh;
    setNotes(fresh);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setStats({ perfect: 0, great: 0, good: 0, miss: 0 });
    setElapsed(0);
    setJudgement('跟著節拍開始！');
    const now = performance.now();
    setStartedAt(now);
    statusRef.current = 'playing';
    setStatus('playing');
  }, [lesson]);

  const hit = useCallback((type) => {
    playTone(audioCtxRef, type);
    setHitPulse(type);
    window.setTimeout(() => setHitPulse(null), 110);

    if (statusRef.current !== 'playing') return;

    const current = performance.now() - startedAt;
    const candidates = notesRef.current
      .map((note, index) => ({ note, index, delta: Math.abs(current - (leadMs + note.beat * beatMs)) }))
      .filter(({ note }) => !note.judged)
      .sort((a, b) => a.delta - b.delta);

    const target = candidates[0];
    if (!target || target.delta > HIT_WINDOWS.good) {
      setCombo(0);
      setJudgement('太早 / 太晚');
      return;
    }

    let result = 'good';
    if (target.delta <= HIT_WINDOWS.perfect) result = 'perfect';
    else if (target.delta <= HIT_WINDOWS.great) result = 'great';

    if (target.note.type !== type) {
      result = 'miss';
    }

    const updated = notesRef.current.map((note, index) => (
      index === target.index ? { ...note, judged: true, result } : note
    ));
    notesRef.current = updated;
    setNotes(updated);

    if (result === 'miss') {
      setStats((prev) => ({ ...prev, miss: prev.miss + 1 }));
      setCombo(0);
      setJudgement(`按錯了！這顆是「${NOTE_LABEL[target.note.type]}」`);
      return;
    }

    const points = result === 'perfect' ? 1000 : result === 'great' ? 700 : 400;
    setScore((prev) => prev + points);
    setStats((prev) => ({ ...prev, [result]: prev[result] + 1 }));
    setCombo((prev) => {
      const next = prev + 1;
      setMaxCombo((max) => Math.max(max, next));
      return next;
    });
    setJudgement(result === 'perfect' ? 'PERFECT ✨' : result === 'great' ? 'GREAT 👍' : 'GOOD 🙂');
  }, [startedAt, leadMs, beatMs]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat) return;
      if (event.code === 'Space') {
        event.preventDefault();
        if (statusRef.current === 'playing') finishGame();
        else startGame();
        return;
      }

      const type = KEY_MAP[event.key];
      if (type) {
        event.preventDefault();
        hit(type);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hit, startGame, finishGame]);

  const sprite = SPRITES[spriteKey];
  const countInLeft = Math.max(0, Math.ceil((leadMs - elapsed) / beatMs));
  const totalJudged = stats.perfect + stats.great + stats.good + stats.miss;
  const accuracy = totalJudged
    ? Math.round(((stats.perfect * 1 + stats.great * 0.8 + stats.good * 0.5) / totalJudged) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden border-4 border-amber-300 bg-gradient-to-b from-sky-100 via-cyan-50 to-amber-50 shadow-2xl">
      <div className="bg-slate-900 text-white px-5 py-4 md:px-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-black tracking-[0.25em] text-amber-300">RUNKU RHYTHM DOJO</div>
          <h2 className="text-2xl md:text-3xl font-black">🥁 小小節奏達人</h2>
        </div>
        <div className="flex gap-3 text-sm font-bold">
          <div className="rounded-xl bg-white/10 px-4 py-2">分數 {score.toLocaleString()}</div>
          <div className="rounded-xl bg-white/10 px-4 py-2">連擊 {combo}</div>
          <div className="rounded-xl bg-white/10 px-4 py-2">準確 {accuracy}%</div>
        </div>
      </div>

      <div className="p-4 md:p-7 space-y-6">
        <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-start">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block rounded-2xl bg-white border-2 border-sky-200 p-3">
              <span className="block text-xs font-black text-slate-500 mb-1">節奏課程</span>
              <select
                value={lessonId}
                disabled={status === 'playing'}
                onChange={(event) => setLessonId(event.target.value)}
                className="w-full bg-transparent font-black text-slate-800 outline-none"
              >
                {LESSONS.map((item) => (
                  <option value={item.id} key={item.id}>{item.name} · ♩.={item.bpm}</option>
                ))}
              </select>
              <span className="block text-xs text-slate-500 mt-1">{lesson.subtitle}</span>
            </label>

            <label className="block rounded-2xl bg-white border-2 border-amber-200 p-3">
              <span className="block text-xs font-black text-slate-500 mb-1">陪練角色（讀取 repo /sprite）</span>
              <select
                value={spriteKey}
                onChange={(event) => setSpriteKey(event.target.value)}
                className="w-full bg-transparent font-black text-slate-800 outline-none"
              >
                {Object.entries(SPRITES).map(([key, item]) => (
                  <option value={key} key={key}>{item.name}</option>
                ))}
              </select>
            </label>
          </div>

          <button
            onClick={status === 'playing' ? finishGame : startGame}
            className={`min-w-44 rounded-2xl px-6 py-4 font-black text-lg shadow-lg transition-transform active:scale-95 ${status === 'playing' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-slate-900 hover:bg-amber-300'}`}
          >
            {status === 'playing' ? '■ 結束' : status === 'finished' ? '↻ 再玩一次' : '▶ 開始遊戲'}
          </button>
        </div>

        <div className="rounded-3xl bg-slate-950 p-4 md:p-6 shadow-inner overflow-hidden">
          <div className="flex items-center justify-between text-white mb-3 gap-3">
            <div>
              <div className="font-black text-lg">{lesson.name}</div>
              <div className="text-xs text-slate-400">6/8：每小節 6 個八分音符位置，重拍感受在 1 與 4</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">SPACE 開始 / 重來</div>
              <div className="font-black text-amber-300">{judgement}</div>
            </div>
          </div>

          <div className="relative h-44 md:h-52 rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-white/10">
            <div className="absolute left-[14%] top-0 bottom-0 w-1 bg-amber-300 shadow-[0_0_20px_rgba(252,211,77,0.9)]" />
            <div className="absolute left-[9.5%] top-1/2 -translate-y-1/2 h-24 w-24 rounded-full border-4 border-white/80 bg-slate-800 flex items-center justify-center text-4xl">🥁</div>

            {status === 'playing' && countInLeft > 0 && (
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <div className="rounded-full bg-amber-300 text-slate-900 w-24 h-24 flex items-center justify-center text-5xl font-black shadow-2xl">
                  {countInLeft}
                </div>
              </div>
            )}

            {Array.from({ length: Math.ceil(totalBeats / lesson.beatsPerBar) * lesson.beatsPerBar }).map((_, beat) => {
              const hitTime = leadMs + beat * beatMs;
              const x = 14 + ((hitTime - elapsed) / leadMs) * 82;
              if (x < 4 || x > 104) return null;
              const isStrong = beat % 6 === 0 || beat % 6 === 3;
              return (
                <div
                  key={`beat-${beat}`}
                  className={`absolute top-0 bottom-0 border-l ${isStrong ? 'border-white/20' : 'border-white/5'}`}
                  style={{ left: `${x}%` }}
                >
                  <span className={`absolute bottom-2 -translate-x-1/2 text-[10px] font-bold ${isStrong ? 'text-amber-300' : 'text-slate-500'}`}>
                    {(beat % 6) + 1}
                  </span>
                </div>
              );
            })}

            {notes.map((note) => {
              const hitTime = leadMs + note.beat * beatMs;
              const x = 14 + ((hitTime - elapsed) / leadMs) * 82;
              if (x < -10 || x > 110 || note.judged) return null;
              const isDon = note.type === 'don';
              return (
                <div
                  key={note.id}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-14 h-14 md:w-16 md:h-16 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white font-black text-lg ${isDon ? 'bg-rose-500' : 'bg-sky-500'}`}
                  style={{ left: `${x}%` }}
                >
                  {NOTE_LABEL[note.type]}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-5 items-stretch">
          <div className="rounded-3xl bg-white border-2 border-amber-200 p-4 flex flex-col items-center justify-center overflow-hidden">
            <img
              src={sprite.src}
              alt={`${sprite.name}陪練角色`}
              className={`max-h-40 object-contain transition-transform duration-100 ${hitPulse ? '-translate-y-2 scale-105' : ''}`}
            />
            <div className="font-black text-slate-800 mt-2">{sprite.name}陪你打拍子！</div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <button
              onMouseDown={() => hit('don')}
              onTouchStart={(event) => { event.preventDefault(); hit('don'); }}
              className={`rounded-3xl border-b-8 px-5 py-7 text-center transition-transform active:translate-y-1 active:border-b-4 ${hitPulse === 'don' ? 'scale-[0.98] bg-rose-200 border-rose-500' : 'bg-rose-100 border-rose-400'}`}
            >
              <div className="text-5xl mb-2">🔴</div>
              <div className="text-2xl font-black text-rose-700">咚 DON</div>
              <div className="text-sm font-bold text-rose-500">F / J / ←</div>
            </button>
            <button
              onMouseDown={() => hit('ka')}
              onTouchStart={(event) => { event.preventDefault(); hit('ka'); }}
              className={`rounded-3xl border-b-8 px-5 py-7 text-center transition-transform active:translate-y-1 active:border-b-4 ${hitPulse === 'ka' ? 'scale-[0.98] bg-sky-200 border-sky-500' : 'bg-sky-100 border-sky-400'}`}
            >
              <div className="text-5xl mb-2">🔵</div>
              <div className="text-2xl font-black text-sky-700">咔 KA</div>
              <div className="text-sm font-bold text-sky-500">D / K / →</div>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h3 className="font-black text-slate-800 mb-3">🎼 這一關在學什麼？</h3>
            <div className="flex items-center gap-1.5 flex-wrap mb-3">
              {lesson.pattern.map((type, index) => (
                <div key={`${type || 'rest'}-${index}`} className="flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm ${type === 'don' ? 'bg-rose-100 text-rose-700' : type === 'ka' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-400'}`}>
                    {type ? NOTE_LABEL[type] : '休'}
                  </div>
                  <div className={`text-[10px] font-black ${(index % 6 === 0 || index % 6 === 3) ? 'text-amber-600' : 'text-slate-400'}`}>{(index % 6) + 1}</div>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              先用嘴巴念「1-2-3、4-5-6」，再開始遊戲。紅色是咚、藍色是咔；畫面上的 1 與 4 特別標出，幫助孩子建立 6/8 的兩大拍感。
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h3 className="font-black text-slate-800 mb-3">🏆 本局成績</h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <ResultBox label="Perfect" value={stats.perfect} />
              <ResultBox label="Great" value={stats.great} />
              <ResultBox label="Good" value={stats.good} />
              <ResultBox label="Miss" value={stats.miss} />
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              最高連擊 <strong className="text-slate-900">{maxCombo}</strong> ・ 準確度 <strong className="text-slate-900">{accuracy}%</strong>
              {status === 'finished' && accuracy >= 85 && <span className="ml-2 font-black text-emerald-600">節奏感很穩！🌟</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultBox({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
      <div className="text-xl font-black text-slate-900">{value}</div>
      <div className="text-[10px] uppercase font-bold text-slate-500">{label}</div>
    </div>
  );
}
