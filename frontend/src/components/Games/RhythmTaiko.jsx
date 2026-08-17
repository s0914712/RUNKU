import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const RAW = 'https://raw.githubusercontent.com/s0914712/RUNKU/main/sprite';

const SPRITES = {
  fox: { name: '小狐狸', src: `${RAW}/FOX_CHAR/stand.png` },
  deer: { name: '小鹿', src: `${RAW}/DEER_CHAR/stand.png` },
  dino: { name: '小恐龍', src: `${RAW}/DINOSOUR/sit.png` },
  dragon: { name: '小龍王', src: `${RAW}/DRAGON_CHAR/boss.png` },
};

const DUR = {
  s: { units: 1, name: '十六分音符' },
  e: { units: 2, name: '八分音符' },
  de: { units: 3, name: '附點八分音符' },
  q: { units: 4, name: '四分音符' },
  dq: { units: 6, name: '附點四分音符' },
};

// 逐題依照使用者提供的「節奏奏」6/8 練習第 1–16 題轉錄。
// 每題固定兩小節；一小節 = 12 個十六分音符單位。
const EXERCISES = [
  { no: 1, bpm: 76, bars: [['e', 'e', 'e', 'de', 's', 'e'], ['q', 'e', 's', 's', 'q']] },
  { no: 2, bpm: 78, bars: [['de', 's', 'e', 'e', 'e', 's', 's'], ['s', 's', 'q', 'e', 'de', 's']] },
  { no: 3, bpm: 80, bars: [['e', 'e', 's', 's', 'e', 'de', 's'], ['s', 's', 'e', 'e', 'de', 's', 'e']] },
  { no: 4, bpm: 82, bars: [['e', 's', 's', 'e', 'e', 'e', 'e'], ['e', 'q', 's', 's', 's', 's', 'e']] },
  { no: 5, bpm: 84, bars: [['e', 's', 's', 's', 's', 'de', 's', 'e'], ['dq', 'e', 's', 's', 'e']] },
  { no: 6, bpm: 84, bars: [['s', 'e', 's', 'e', 'e', 'q'], ['q', 's', 's', 'de', 's', 'e']] },
  { no: 7, bpm: 86, bars: [['e', 'e', 'e', 's', 's', 'e', 'e'], ['de', 's', 'e', 's', 's', 's', 's', 'e']] },
  { no: 8, bpm: 88, bars: [['q', 'e', 'e', 'e', 's', 's'], ['s', 's', 'e', 'e', 'e', 'de', 's']] },
  { no: 9, bpm: 88, bars: [['dq', 's', 's', 's', 's', 'e'], ['de', 's', 'e', 'e', 's', 's', 'e']] },
  { no: 10, bpm: 90, bars: [['e', 's', 's', 's', 's', 'e', 'q'], ['s', 's', 's', 's', 'e', 'de', 's', 'e']] },
  { no: 11, bpm: 90, bars: [['s', 'de', 'e', 'e', 's', 's', 'e'], ['de', 's', 'e', 'dq']] },
  { no: 12, bpm: 92, bars: [['e', 's', 'de', 'e', 'e', 'e'], ['de', 's', 's', 's', 'q', 'e']] },
  { no: 13, bpm: 94, bars: [['s', 's', 'e', 'e', 'de', 'e', 's'], ['e', 'e', 'e', 'e', 'e', 's', 's']] },
  { no: 14, bpm: 96, bars: [['de', 'e', 's', 'e', 'q'], ['s', 's', 'e', 'e', 's', 's', 's', 's', 'e']] },
  { no: 15, bpm: 98, bars: [['s', 'de', 'e', 's', 's', 'e', 'e'], ['dq', 'q', 's', 's']] },
  { no: 16, bpm: 100, bars: [['e', 's', 'e', 's', 'de', 's', 'e'], ['e', 's', 's', 's', 's', 'dq']] },
].map((exercise) => ({
  ...exercise,
  id: `exercise-${exercise.no}`,
  title: `節奏練習 ${exercise.no}`,
}));

const HIT_WINDOWS = { perfect: 78, great: 132, good: 205 };
const PROGRESS_KEY = 'runku-rhythm-v2-progress';

function sumBar(bar) {
  return bar.reduce((sum, token) => sum + DUR[token].units, 0);
}

function buildNotes(exercise) {
  const notes = [];
  exercise.bars.forEach((bar, barIndex) => {
    let cursor = barIndex * 12;
    bar.forEach((token, noteIndex) => {
      notes.push({
        id: `${exercise.id}-${barIndex}-${noteIndex}`,
        token,
        duration: DUR[token].units,
        at: cursor,
        barIndex,
        judged: false,
      });
      cursor += DUR[token].units;
    });
  });
  return notes;
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // localStorage unavailable: the game still works for this session.
  }
}

function ensureAudio(audioCtxRef) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtxRef.current) audioCtxRef.current = new AudioContextClass();
  if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
  return audioCtxRef.current;
}

function playDrum(audioCtxRef, strength = 1) {
  const ctx = ensureAudio(audioCtxRef);
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const click = ctx.createOscillator();
  const clickGain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(170, now);
  osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);
  gain.gain.setValueAtTime(0.24 * strength, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  click.type = 'triangle';
  click.frequency.setValueAtTime(540, now);
  click.frequency.exponentialRampToValueAtTime(220, now + 0.035);
  clickGain.gain.setValueAtTime(0.08 * strength, now);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

  osc.connect(gain);
  gain.connect(ctx.destination);
  click.connect(clickGain);
  clickGain.connect(ctx.destination);
  osc.start(now);
  click.start(now);
  osc.stop(now + 0.2);
  click.stop(now + 0.06);
}

function scheduleCountIn(audioCtxRef, eighthMs) {
  const ctx = ensureAudio(audioCtxRef);
  if (!ctx) return;
  const start = ctx.currentTime + 0.02;

  for (let i = 0; i < 6; i += 1) {
    const t = start + (i * eighthMs) / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const strong = i === 0 || i === 3;
    osc.type = 'square';
    osc.frequency.setValueAtTime(strong ? 880 : 620, t);
    gain.gain.setValueAtTime(strong ? 0.08 : 0.045, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.055);
  }
}

function scoreToStars(accuracy) {
  if (accuracy >= 92) return 3;
  if (accuracy >= 78) return 2;
  if (accuracy >= 60) return 1;
  return 0;
}

function RhythmScore({ exercise }) {
  const width = 760;
  const height = 150;
  const left = 92;
  const barWidth = 310;
  const baselineY = 88;
  const stemTop = 43;

  const renderBar = (bar, barIndex) => {
    const startX = left + barIndex * barWidth;
    let unitCursor = 0;
    const items = bar.map((token, index) => {
      const x = startX + (unitCursor / 12) * barWidth + 13;
      const item = { token, x, units: DUR[token].units, index, onset: unitCursor };
      unitCursor += DUR[token].units;
      return item;
    });

    const groups = [
      items.filter((item) => item.onset < 6),
      items.filter((item) => item.onset >= 6),
    ];

    return (
      <g key={`bar-${barIndex}`}>
        {items.map((item) => {
          const dotted = item.token === 'de' || item.token === 'dq';
          return (
            <g key={`${barIndex}-${item.index}`}>
              <ellipse cx={item.x} cy={baselineY} rx="7.2" ry="5.4" fill="#111827" transform={`rotate(-14 ${item.x} ${baselineY})`} />
              <line x1={item.x + 6} y1={baselineY - 1} x2={item.x + 6} y2={stemTop} stroke="#111827" strokeWidth="3" />
              {dotted && <circle cx={item.x + 15} cy={baselineY - 1} r="2.6" fill="#111827" />}
              {(item.token === 'e' || item.token === 's') && groups.every((group) => !(group.length > 1 && group.includes(item) && group.every((g) => DUR[g.token].units <= 3))) && (
                <path d={`M ${item.x + 6} ${stemTop} Q ${item.x + 19} ${stemTop + 8} ${item.x + 12} ${stemTop + 22}`} fill="none" stroke="#111827" strokeWidth="3" />
              )}
              {item.token === 's' && groups.every((group) => !(group.length > 1 && group.includes(item) && group.every((g) => DUR[g.token].units <= 3))) && (
                <path d={`M ${item.x + 7} ${stemTop + 8} Q ${item.x + 19} ${stemTop + 15} ${item.x + 12} ${stemTop + 28}`} fill="none" stroke="#111827" strokeWidth="3" />
              )}
            </g>
          );
        })}

        {groups.map((group, groupIndex) => {
          const beamable = group.length > 1 && group.every((item) => DUR[item.token].units <= 3);
          if (!beamable) return null;
          const x1 = group[0].x + 6;
          const x2 = group[group.length - 1].x + 6;
          return (
            <g key={`beam-${barIndex}-${groupIndex}`}>
              <line x1={x1} y1={stemTop} x2={x2} y2={stemTop} stroke="#111827" strokeWidth="6" />
              {group.map((item, index) => {
                if (item.token !== 's') return null;
                const prev = group[index - 1];
                const next = group[index + 1];
                let sx1 = item.x + 6;
                let sx2 = item.x + 6;
                if (next && next.token === 's') sx2 = next.x + 6;
                else if (prev && prev.token === 's') sx1 = prev.x + 6;
                else if (next) sx2 = Math.min(next.x + 1, item.x + 19);
                else if (prev) sx1 = Math.max(prev.x + 11, item.x - 7);
                return <line key={`sub-${index}`} x1={sx1} y1={stemTop + 10} x2={sx2} y2={stemTop + 10} stroke="#111827" strokeWidth="5" />;
              })}
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label={`6/8 節奏練習第 ${exercise.no} 題`}>
      <text x="12" y="96" fontSize="26" fontWeight="700" fill="#111827">{exercise.no}.</text>
      <line x1="52" y1="55" x2="52" y2="100" stroke="#111827" strokeWidth="5" />
      <line x1="64" y1="55" x2="64" y2="100" stroke="#111827" strokeWidth="5" />
      <text x="70" y="72" fontSize="25" fontWeight="800" fill="#111827">6</text>
      <text x="70" y="101" fontSize="25" fontWeight="800" fill="#111827">8</text>
      <line x1={left - 8} y1={baselineY} x2={left + barWidth * 2 + 18} y2={baselineY} stroke="#374151" strokeWidth="1.5" opacity="0.42" />
      {exercise.bars.map(renderBar)}
      <line x1={left + barWidth} y1="48" x2={left + barWidth} y2="108" stroke="#111827" strokeWidth="2.5" />
      <line x1={left + barWidth * 2 + 7} y1="48" x2={left + barWidth * 2 + 7} y2="108" stroke="#111827" strokeWidth="2.5" />
      <line x1={left + barWidth * 2 + 15} y1="48" x2={left + barWidth * 2 + 15} y2="108" stroke="#111827" strokeWidth="5" />
    </svg>
  );
}

function StarRow({ stars, size = 'text-xl' }) {
  return (
    <span className={`${size} tracking-tight`} aria-label={`${stars} 顆星`}>
      {[0, 1, 2].map((index) => (
        <span key={index} className={index < stars ? 'opacity-100' : 'opacity-20'}>★</span>
      ))}
    </span>
  );
}

export default function RhythmTaiko() {
  const [exerciseNo, setExerciseNo] = useState(1);
  const [spriteKey, setSpriteKey] = useState('fox');
  const [freePractice, setFreePractice] = useState(false);
  const [progress, setProgress] = useState(() => loadProgress());
  const [status, setStatus] = useState('idle');
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState(() => buildNotes(EXERCISES[0]));
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [stats, setStats] = useState({ perfect: 0, great: 0, good: 0, miss: 0, ghost: 0 });
  const [judgement, setJudgement] = useState('選一題，準備闖關！');
  const [impact, setImpact] = useState(null);
  const [result, setResult] = useState(null);

  const frameRef = useRef(null);
  const audioCtxRef = useRef(null);
  const notesRef = useRef(notes);
  const statusRef = useRef(status);
  const statsRef = useRef(stats);
  const scoreRef = useRef(score);
  const comboRef = useRef(combo);
  const maxComboRef = useRef(maxCombo);

  const exercise = EXERCISES[exerciseNo - 1];
  const sprite = SPRITES[spriteKey];
  const unitMs = 60000 / exercise.bpm / 6;
  const eighthMs = unitMs * 2;
  const leadMs = unitMs * 12;
  const totalDuration = leadMs + unitMs * 26;

  const unlockedThrough = useMemo(() => {
    let unlocked = 1;
    for (let no = 1; no <= 16; no += 1) {
      if ((progress[no]?.stars || 0) > 0) unlocked = Math.min(16, no + 1);
      else break;
    }
    return unlocked;
  }, [progress]);

  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { maxComboRef.current = maxCombo; }, [maxCombo]);

  useEffect(() => {
    const invalid = EXERCISES.find((item) => item.bars.some((bar) => sumBar(bar) !== 12));
    if (invalid) console.warn(`Rhythm transcription bar length error in exercise ${invalid.no}`);
  }, []);

  const resetRound = useCallback((nextExercise = exercise) => {
    const fresh = buildNotes(nextExercise);
    notesRef.current = fresh;
    setNotes(fresh);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setStats({ perfect: 0, great: 0, good: 0, miss: 0, ghost: 0 });
    setElapsed(0);
    setJudgement('按 ENTER 開始，F / J / SPACE 打節奏');
    setImpact(null);
    setResult(null);
    statusRef.current = 'idle';
    setStatus('idle');
  }, [exercise]);

  useEffect(() => {
    resetRound(exercise);
  }, [exerciseNo]); // eslint-disable-line react-hooks/exhaustive-deps

  const finishGame = useCallback(() => {
    if (statusRef.current !== 'playing') return;

    const s = statsRef.current;
    const judged = s.perfect + s.great + s.good + s.miss;
    const accuracy = judged
      ? Math.round(((s.perfect + s.great * 0.82 + s.good * 0.58) / judged) * 100)
      : 0;
    const stars = scoreToStars(accuracy);
    const finalScore = Math.max(0, scoreRef.current - s.ghost * 80);
    const previous = progress[exercise.no] || {};
    const nextRecord = {
      stars: Math.max(previous.stars || 0, stars),
      score: Math.max(previous.score || 0, finalScore),
      accuracy: Math.max(previous.accuracy || 0, accuracy),
      combo: Math.max(previous.combo || 0, maxComboRef.current),
    };
    const nextProgress = { ...progress, [exercise.no]: nextRecord };

    setProgress(nextProgress);
    saveProgress(nextProgress);
    setResult({ stars, accuracy, score: finalScore, combo: maxComboRef.current });
    setCombo(0);
    comboRef.current = 0;
    statusRef.current = 'finished';
    setStatus('finished');
    setJudgement(stars > 0 ? '過關！下一題解鎖 🎉' : '再試一次，抓住節奏就會進步！');
  }, [exercise.no, progress]);

  useEffect(() => {
    if (status !== 'playing') {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return undefined;
    }

    const tick = (now) => {
      const current = now - startedAt;
      setElapsed(current);

      let missed = 0;
      const updated = notesRef.current.map((note) => {
        if (note.judged) return note;
        const hitTime = leadMs + note.at * unitMs;
        if (current - hitTime > HIT_WINDOWS.good) {
          missed += 1;
          return { ...note, judged: true, result: 'miss' };
        }
        return note;
      });

      if (missed > 0) {
        notesRef.current = updated;
        setNotes(updated);
        setStats((prev) => {
          const next = { ...prev, miss: prev.miss + missed };
          statsRef.current = next;
          return next;
        });
        comboRef.current = 0;
        setCombo(0);
        setJudgement('MISS — 下一顆追回來！');
      }

      if (current >= totalDuration || updated.every((note) => note.judged)) {
        finishGame();
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [status, startedAt, leadMs, unitMs, totalDuration, finishGame]);

  const startGame = useCallback(() => {
    const fresh = buildNotes(exercise);
    notesRef.current = fresh;
    setNotes(fresh);
    setScore(0);
    scoreRef.current = 0;
    setCombo(0);
    comboRef.current = 0;
    setMaxCombo(0);
    maxComboRef.current = 0;
    const freshStats = { perfect: 0, great: 0, good: 0, miss: 0, ghost: 0 };
    setStats(freshStats);
    statsRef.current = freshStats;
    setElapsed(0);
    setResult(null);
    setJudgement('預備：1 2 3・4 5 6');
    const now = performance.now();
    setStartedAt(now);
    statusRef.current = 'playing';
    setStatus('playing');
    scheduleCountIn(audioCtxRef, eighthMs);
  }, [exercise, eighthMs]);

  const burstImpact = useCallback((side, grade = 'tap') => {
    setImpact({ seq: Date.now() + Math.random(), side, grade });
  }, []);

  const hit = useCallback((side = 'center') => {
    playDrum(audioCtxRef, comboRef.current >= 10 ? 1.15 : 1);
    burstImpact(side, 'tap');

    if (statusRef.current !== 'playing') return;

    const current = performance.now() - startedAt;
    const candidates = notesRef.current
      .map((note, index) => ({
        note,
        index,
        delta: Math.abs(current - (leadMs + note.at * unitMs)),
      }))
      .filter(({ note }) => !note.judged)
      .sort((a, b) => a.delta - b.delta);

    const target = candidates[0];
    if (!target || target.delta > HIT_WINDOWS.good) {
      comboRef.current = 0;
      setCombo(0);
      setStats((prev) => {
        const next = { ...prev, ghost: prev.ghost + 1 };
        statsRef.current = next;
        return next;
      });
      setJudgement('空拍！等音符進圈再打');
      burstImpact(side, 'ghost');
      return;
    }

    let grade = 'good';
    if (target.delta <= HIT_WINDOWS.perfect) grade = 'perfect';
    else if (target.delta <= HIT_WINDOWS.great) grade = 'great';

    const updated = notesRef.current.map((note, index) => (
      index === target.index ? { ...note, judged: true, result: grade } : note
    ));
    notesRef.current = updated;
    setNotes(updated);

    const nextCombo = comboRef.current + 1;
    comboRef.current = nextCombo;
    setCombo(nextCombo);
    if (nextCombo > maxComboRef.current) {
      maxComboRef.current = nextCombo;
      setMaxCombo(nextCombo);
    }

    const multiplier = Math.min(2, 1 + Math.floor(nextCombo / 10) * 0.25);
    const base = grade === 'perfect' ? 1000 : grade === 'great' ? 700 : 450;
    const points = Math.round(base * multiplier);
    scoreRef.current += points;
    setScore(scoreRef.current);

    setStats((prev) => {
      const next = { ...prev, [grade]: prev[grade] + 1 };
      statsRef.current = next;
      return next;
    });

    setJudgement(
      grade === 'perfect'
        ? `PERFECT ✨ +${points}`
        : grade === 'great'
          ? `GREAT! ⚡ +${points}`
          : `GOOD! +${points}`,
    );
    burstImpact(side, grade);
  }, [startedAt, leadMs, unitMs, burstImpact]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat) return;

      if (event.code === 'Enter') {
        event.preventDefault();
        if (statusRef.current !== 'playing') startGame();
        return;
      }

      if (event.code === 'Escape' && statusRef.current === 'playing') {
        event.preventDefault();
        finishGame();
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 'f' || event.key === 'ArrowLeft') {
        event.preventDefault();
        hit('left');
      } else if (key === 'j' || event.key === 'ArrowRight') {
        event.preventDefault();
        hit('right');
      } else if (event.code === 'Space') {
        event.preventDefault();
        hit('center');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hit, startGame, finishGame]);

  const totalJudged = stats.perfect + stats.great + stats.good + stats.miss;
  const liveAccuracy = totalJudged
    ? Math.round(((stats.perfect + stats.great * 0.82 + stats.good * 0.58) / totalJudged) * 100)
    : 100;
  const countInLeft = Math.max(0, Math.ceil((leadMs - elapsed) / eighthMs));
  const fever = combo >= 10;
  const currentBest = progress[exercise.no] || {};

  const selectExercise = (no) => {
    const unlocked = freePractice || no <= unlockedThrough;
    if (!unlocked || status === 'playing') return;
    setExerciseNo(no);
  };

  const nextExercise = () => {
    if (exercise.no >= 16) return;
    setExerciseNo(exercise.no + 1);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <style>{`
        @keyframes rhythmScreenShake {
          0% { transform: translate3d(0,0,0); }
          18% { transform: translate3d(-5px,1px,0) rotate(-0.25deg); }
          38% { transform: translate3d(5px,-1px,0) rotate(0.25deg); }
          60% { transform: translate3d(-2px,0,0); }
          100% { transform: translate3d(0,0,0); }
        }
        @keyframes rhythmDrumPunch {
          0% { transform: translate(-50%,-50%) scale(1); }
          35% { transform: translate(-50%,-50%) scale(.82) rotate(-5deg); }
          68% { transform: translate(-50%,-50%) scale(1.16) rotate(3deg); }
          100% { transform: translate(-50%,-50%) scale(1); }
        }
        @keyframes rhythmRing {
          0% { opacity:.95; transform: translate(-50%,-50%) scale(.45); }
          100% { opacity:0; transform: translate(-50%,-50%) scale(2.25); }
        }
        @keyframes rhythmSpriteLeft {
          0% { transform: translateY(0) rotate(0) scale(1); }
          35% { transform: translateY(-18px) rotate(-8deg) scale(1.08); }
          70% { transform: translateY(3px) rotate(4deg) scale(.98); }
          100% { transform: translateY(0) rotate(0) scale(1); }
        }
        @keyframes rhythmSpriteRight {
          0% { transform: translateY(0) rotate(0) scale(1); }
          35% { transform: translateY(-18px) rotate(8deg) scale(1.08); }
          70% { transform: translateY(3px) rotate(-4deg) scale(.98); }
          100% { transform: translateY(0) rotate(0) scale(1); }
        }
        @keyframes rhythmSpriteCenter {
          0% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-22px) scale(1.1,.92); }
          65% { transform: translateY(4px) scale(.96,1.06); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes rhythmParticle {
          0% { opacity:1; transform: translate(-50%,-50%) scale(.6); }
          100% { opacity:0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.35) rotate(var(--rot)); }
        }
        @keyframes rhythmJudgement {
          0% { opacity:0; transform: translateY(12px) scale(.7); }
          35% { opacity:1; transform: translateY(-5px) scale(1.12); }
          100% { opacity:1; transform: translateY(0) scale(1); }
        }
        @keyframes rhythmFever {
          0%,100% { box-shadow: inset 0 0 0 rgba(251,191,36,0), 0 0 30px rgba(251,191,36,.2); }
          50% { box-shadow: inset 0 0 65px rgba(251,191,36,.18), 0 0 60px rgba(251,191,36,.48); }
        }
        .rhythm-screen-shake { animation: rhythmScreenShake 150ms ease-out; }
        .rhythm-fever { animation: rhythmFever .7s ease-in-out infinite; }
      `}</style>

      <div className="rounded-3xl overflow-hidden border-4 border-amber-300 bg-gradient-to-b from-sky-100 via-cyan-50 to-amber-50 shadow-2xl">
        <div className="bg-slate-950 text-white px-5 py-4 md:px-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-black tracking-[0.25em] text-amber-300">RUNKU RHYTHM ARCADE · V2</div>
            <h2 className="text-2xl md:text-3xl font-black">🥁 6/8 小小節奏達人</h2>
            <p className="text-xs text-slate-400 mt-1">題目 1–16 依照課本照片逐題轉錄；遊戲化只加在判定、動畫與闖關，不改節奏。</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm font-black">
            <div className="rounded-xl bg-white/10 px-3 py-2">分數 {score.toLocaleString()}</div>
            <div className={`rounded-xl px-3 py-2 ${fever ? 'bg-amber-400 text-slate-950' : 'bg-white/10'}`}>連擊 {combo}</div>
            <div className="rounded-xl bg-white/10 px-3 py-2">準確 {liveAccuracy}%</div>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-5">
          <div className="rounded-2xl bg-white border-2 border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <div className="font-black text-slate-800">🎯 16 題闖關地圖</div>
                <div className="text-xs text-slate-500">過關就解鎖下一題；老師也可開「自由練習」直接選題。</div>
              </div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={freePractice}
                  onChange={(event) => setFreePractice(event.target.checked)}
                  disabled={status === 'playing'}
                  className="w-4 h-4"
                />
                自由練習
              </label>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-16 gap-2">
              {EXERCISES.map((item) => {
                const record = progress[item.no] || {};
                const unlocked = freePractice || item.no <= unlockedThrough;
                const active = exercise.no === item.no;
                return (
                  <button
                    key={item.no}
                    onClick={() => selectExercise(item.no)}
                    disabled={!unlocked || status === 'playing'}
                    className={`relative min-h-16 rounded-xl border-2 font-black transition-all ${active ? 'border-amber-500 bg-amber-100 -translate-y-1 shadow-lg' : unlocked ? 'border-sky-200 bg-sky-50 hover:-translate-y-1 hover:shadow-md' : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                  >
                    <div className="text-lg">{unlocked ? item.no : '🔒'}</div>
                    <StarRow stars={record.stars || 0} size="text-[10px]" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_260px] gap-5 items-stretch">
            <div className="rounded-3xl bg-white border-2 border-slate-200 p-4 md:p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div>
                  <div className="text-xs font-black tracking-[0.2em] text-sky-600">ORIGINAL RHYTHM · 6/8</div>
                  <h3 className="text-2xl font-black text-slate-900">第 {exercise.no} 題</h3>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">遊戲速度</div>
                  <div className="font-black text-slate-800">♩. = {exercise.bpm}</div>
                </div>
              </div>
              <RhythmScore exercise={exercise} />
              <div className="text-xs text-slate-500 border-t pt-2 flex flex-wrap justify-between gap-2">
                <span>每題兩小節，節奏長度完全依照照片轉錄。</span>
                <span>小節檢查：{exercise.bars.map(sumBar).join(' / ')} units</span>
              </div>
            </div>

            <div className="rounded-3xl bg-white border-2 border-amber-200 p-4 flex flex-col items-center justify-between gap-3 overflow-hidden">
              <div className="w-full flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-black text-slate-500">陪練角色</div>
                  <div className="font-black text-slate-900">{sprite.name}</div>
                </div>
                <select
                  value={spriteKey}
                  disabled={status === 'playing'}
                  onChange={(event) => setSpriteKey(event.target.value)}
                  className="rounded-xl border border-slate-200 px-2 py-1 text-sm font-bold bg-white"
                >
                  {Object.entries(SPRITES).map(([key, item]) => <option key={key} value={key}>{item.name}</option>)}
                </select>
              </div>
              <div className="relative h-40 w-full flex items-end justify-center">
                <div
                  key={impact ? `${spriteKey}-${impact.seq}` : spriteKey}
                  className="h-full flex items-end justify-center"
                  style={impact ? {
                    animation: `${impact.side === 'left' ? 'rhythmSpriteLeft' : impact.side === 'right' ? 'rhythmSpriteRight' : 'rhythmSpriteCenter'} 230ms cubic-bezier(.2,.9,.2,1)`,
                  } : undefined}
                >
                  <img src={sprite.src} alt={sprite.name} className="max-h-40 max-w-full object-contain drop-shadow-lg" />
                </div>
              </div>
              <div className="text-center text-sm font-bold text-slate-600">每次按鍵，角色會跟著節奏跳！</div>
            </div>
          </div>

          <div
            key={impact ? `arena-${impact.seq}` : 'arena'}
            className={`relative rounded-3xl bg-slate-950 p-4 md:p-6 overflow-hidden border-4 ${fever ? 'border-amber-300 rhythm-fever' : 'border-slate-800'} ${impact && impact.grade !== 'ghost' ? 'rhythm-screen-shake' : ''}`}
          >
            <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(56,189,248,.35), transparent 30%), radial-gradient(circle at 55% 100%, rgba(251,191,36,.28), transparent 35%)' }} />
            {fever && <div className="absolute top-3 right-4 z-20 rounded-full bg-amber-300 text-slate-950 px-4 py-1 text-xs font-black tracking-widest animate-pulse">🔥 FEVER ×{Math.min(2, 1 + Math.floor(combo / 10) * 0.25).toFixed(2)}</div>}

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 text-white mb-4">
              <div>
                <div className="font-black text-lg">第 {exercise.no} 題 · 音符進黃圈就打！</div>
                <div className="text-xs text-slate-400">F / ← = 左手　J / → = 右手　SPACE = 任一手　ENTER = 開始</div>
              </div>
              <div
                key={impact ? `judge-${impact.seq}` : judgement}
                className={`text-xl md:text-2xl font-black ${judgement.includes('PERFECT') ? 'text-amber-300' : judgement.includes('GREAT') ? 'text-cyan-300' : judgement.includes('MISS') || judgement.includes('空拍') ? 'text-rose-300' : 'text-white'}`}
                style={{ animation: 'rhythmJudgement 220ms ease-out' }}
              >
                {judgement}
              </div>
            </div>

            <div className="relative z-10 h-52 md:h-60 rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900">
              <div className="absolute left-[14%] top-0 bottom-0 w-1.5 bg-amber-300 shadow-[0_0_25px_rgba(252,211,77,1)] z-10" />
              <div
                key={impact ? `drum-${impact.seq}` : 'drum'}
                className="absolute left-[14%] top-1/2 h-28 w-28 rounded-full border-8 border-white/90 bg-gradient-to-br from-rose-400 to-rose-600 shadow-2xl z-20 flex items-center justify-center"
                style={{ transform: 'translate(-50%,-50%)', animation: impact ? 'rhythmDrumPunch 180ms cubic-bezier(.2,.85,.25,1)' : undefined }}
              >
                <span className="text-5xl">🥁</span>
              </div>

              {impact && (
                <>
                  <div
                    key={`ring-${impact.seq}`}
                    className={`absolute left-[14%] top-1/2 h-28 w-28 rounded-full border-8 z-30 pointer-events-none ${impact.grade === 'perfect' ? 'border-amber-200' : impact.grade === 'ghost' ? 'border-rose-300' : 'border-cyan-200'}`}
                    style={{ animation: 'rhythmRing 360ms ease-out forwards' }}
                  />
                  {[
                    ['-90px', '-55px', '-25deg'], ['-65px', '60px', '20deg'], ['0px', '-92px', '45deg'],
                    ['70px', '-58px', '80deg'], ['92px', '20px', '110deg'], ['28px', '82px', '150deg'],
                  ].map(([dx, dy, rot], index) => (
                    <span
                      key={`${impact.seq}-particle-${index}`}
                      className="absolute left-[14%] top-1/2 z-40 text-2xl pointer-events-none"
                      style={{ '--dx': dx, '--dy': dy, '--rot': rot, animation: 'rhythmParticle 430ms ease-out forwards' }}
                    >
                      {impact.grade === 'ghost' ? '💨' : impact.grade === 'perfect' ? '✨' : '⚡'}
                    </span>
                  ))}
                </>
              )}

              {status === 'playing' && countInLeft > 0 && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/25 pointer-events-none">
                  <div className="w-28 h-28 rounded-full bg-amber-300 text-slate-950 flex items-center justify-center text-5xl font-black shadow-2xl border-8 border-white/80 animate-pulse">
                    {Math.min(6, countInLeft)}
                  </div>
                </div>
              )}

              {Array.from({ length: 13 }).map((_, index) => {
                const at = index * 2;
                const hitTime = leadMs + at * unitMs;
                const x = 14 + ((hitTime - elapsed) / leadMs) * 82;
                if (x < 4 || x > 104) return null;
                const withinBar = index % 6;
                const strong = withinBar === 0 || withinBar === 3;
                return (
                  <div key={`grid-${index}`} className={`absolute top-0 bottom-0 border-l ${strong ? 'border-amber-200/20' : 'border-white/5'}`} style={{ left: `${x}%` }}>
                    <span className={`absolute bottom-2 -translate-x-1/2 text-[10px] font-black ${strong ? 'text-amber-300' : 'text-slate-600'}`}>{(withinBar % 6) + 1}</span>
                  </div>
                );
              })}

              {notes.map((note) => {
                const hitTime = leadMs + note.at * unitMs;
                const x = 14 + ((hitTime - elapsed) / leadMs) * 82;
                if (x < -8 || x > 108 || note.judged) return null;
                return (
                  <div
                    key={note.id}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
                    style={{ left: `${x}%` }}
                  >
                    <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 border-4 border-white shadow-[0_0_20px_rgba(251,113,133,.55)] flex items-center justify-center text-white font-black">
                      咚
                      <span className="absolute -bottom-5 text-[10px] text-slate-300 whitespace-nowrap">{DUR[note.token].units === 1 ? '♬' : DUR[note.token].units === 2 ? '♪' : DUR[note.token].units === 3 ? '♪.' : DUR[note.token].units === 4 ? '♩' : '♩.'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-stretch">
            <div className="grid sm:grid-cols-3 gap-3">
              <button
                onMouseDown={() => hit('left')}
                onTouchStart={(event) => { event.preventDefault(); hit('left'); }}
                className={`rounded-3xl border-b-8 px-5 py-6 font-black transition-all active:translate-y-2 active:border-b-2 ${impact?.side === 'left' ? 'bg-rose-300 border-rose-600 scale-[.97]' : 'bg-rose-100 border-rose-400'}`}
              >
                <div className="text-4xl">👈🥁</div>
                <div className="text-xl text-rose-700">左手打</div>
                <div className="text-sm text-rose-500">F / ←</div>
              </button>
              <button
                onMouseDown={() => hit('center')}
                onTouchStart={(event) => { event.preventDefault(); hit('center'); }}
                className={`rounded-3xl border-b-8 px-5 py-6 font-black transition-all active:translate-y-2 active:border-b-2 ${impact?.side === 'center' ? 'bg-amber-300 border-amber-600 scale-[.97]' : 'bg-amber-100 border-amber-400'}`}
              >
                <div className="text-4xl">💥</div>
                <div className="text-xl text-amber-800">大力打</div>
                <div className="text-sm text-amber-600">SPACE</div>
              </button>
              <button
                onMouseDown={() => hit('right')}
                onTouchStart={(event) => { event.preventDefault(); hit('right'); }}
                className={`rounded-3xl border-b-8 px-5 py-6 font-black transition-all active:translate-y-2 active:border-b-2 ${impact?.side === 'right' ? 'bg-sky-300 border-sky-600 scale-[.97]' : 'bg-sky-100 border-sky-400'}`}
              >
                <div className="text-4xl">🥁👉</div>
                <div className="text-xl text-sky-700">右手打</div>
                <div className="text-sm text-sky-500">J / →</div>
              </button>
            </div>

            <button
              onClick={status === 'playing' ? finishGame : startGame}
              className={`lg:min-w-52 rounded-3xl px-7 py-5 font-black text-xl border-b-8 transition-all active:translate-y-2 active:border-b-2 ${status === 'playing' ? 'bg-rose-500 border-rose-800 text-white' : 'bg-emerald-400 border-emerald-700 text-slate-950 hover:bg-emerald-300'}`}
            >
              {status === 'playing' ? '■ 提前結束' : status === 'finished' ? '↻ 再挑戰' : '▶ 開始闖關'}
              <div className="text-xs mt-1 opacity-70">ENTER</div>
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <h4 className="font-black text-slate-800 mb-3">🏆 本題紀錄</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-amber-50 p-3"><div className="text-slate-500">星星</div><StarRow stars={currentBest.stars || 0} /></div>
                <div className="rounded-xl bg-sky-50 p-3"><div className="text-slate-500">最高分</div><div className="font-black text-lg">{(currentBest.score || 0).toLocaleString()}</div></div>
                <div className="rounded-xl bg-emerald-50 p-3"><div className="text-slate-500">最佳準確</div><div className="font-black text-lg">{currentBest.accuracy || 0}%</div></div>
                <div className="rounded-xl bg-violet-50 p-3"><div className="text-slate-500">最高連擊</div><div className="font-black text-lg">{currentBest.combo || 0}</div></div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <h4 className="font-black text-slate-800 mb-3">🎮 遊戲判定</h4>
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div className="rounded-xl bg-amber-50 p-2"><div className="font-black text-amber-700">PERFECT</div><div className="text-xl font-black">{stats.perfect}</div></div>
                <div className="rounded-xl bg-cyan-50 p-2"><div className="font-black text-cyan-700">GREAT</div><div className="text-xl font-black">{stats.great}</div></div>
                <div className="rounded-xl bg-emerald-50 p-2"><div className="font-black text-emerald-700">GOOD</div><div className="text-xl font-black">{stats.good}</div></div>
                <div className="rounded-xl bg-rose-50 p-2"><div className="font-black text-rose-700">MISS</div><div className="text-xl font-black">{stats.miss}</div></div>
                <div className="rounded-xl bg-slate-100 p-2"><div className="font-black text-slate-600">空拍</div><div className="text-xl font-black">{stats.ghost}</div></div>
              </div>
              <div className="mt-3 text-xs text-slate-500">60% = ★　78% = ★★　92% = ★★★；10 Combo 起進入 FEVER 加成。</div>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className="rounded-3xl border-4 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-6 md:p-8 shadow-xl text-center">
          <div className="text-sm font-black tracking-[0.25em] text-amber-600">STAGE CLEAR</div>
          <div className="text-4xl font-black text-slate-900 mt-1">第 {exercise.no} 題完成！</div>
          <div className="my-3"><StarRow stars={result.stars} size="text-5xl" /></div>
          <div className="flex flex-wrap justify-center gap-3 text-sm font-black">
            <span className="rounded-full bg-white border px-4 py-2">分數 {result.score.toLocaleString()}</span>
            <span className="rounded-full bg-white border px-4 py-2">準確 {result.accuracy}%</span>
            <span className="rounded-full bg-white border px-4 py-2">最高連擊 {result.combo}</span>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button onClick={startGame} className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-black">↻ 再打一遍</button>
            {exercise.no < 16 && (result.stars > 0 || freePractice) && (
              <button onClick={nextExercise} className="rounded-2xl bg-amber-400 text-slate-950 px-6 py-3 font-black">下一題 →</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
