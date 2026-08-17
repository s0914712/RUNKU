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
].map((exercise) => ({ ...exercise, id: `exercise-${exercise.no}`, title: `節奏練習 ${exercise.no}` }));

const HIT_WINDOWS = { perfect: 78, great: 132, good: 205 };
const PROGRESS_KEY = 'runku-rhythm-v2-progress';
const MIN_BPM = 48;
const MAX_BPM = 140;
const MAX_MISTAKES = 3;
const ERROR_SCORE_PENALTY = 400;

function sumBar(bar) {
  return bar.reduce((sum, token) => sum + DUR[token].units, 0);
}

function buildNotes(exercise) {
  const notes = [];
  exercise.bars.forEach((bar, barIndex) => {
    let cursor = barIndex * 12;
    bar.forEach((token, noteIndex) => {
      notes.push({ id: `${exercise.id}-${barIndex}-${noteIndex}`, token, duration: DUR[token].units, at: cursor, barIndex, judged: false });
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

function playDrumAt(ctx, atTime, strength = 1) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const click = ctx.createOscillator();
  const clickGain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(170, atTime);
  osc.frequency.exponentialRampToValueAtTime(70, atTime + 0.12);
  gain.gain.setValueAtTime(0.24 * strength, atTime);
  gain.gain.exponentialRampToValueAtTime(0.001, atTime + 0.18);

  click.type = 'triangle';
  click.frequency.setValueAtTime(540, atTime);
  click.frequency.exponentialRampToValueAtTime(220, atTime + 0.035);
  clickGain.gain.setValueAtTime(0.08 * strength, atTime);
  clickGain.gain.exponentialRampToValueAtTime(0.001, atTime + 0.045);

  osc.connect(gain);
  gain.connect(ctx.destination);
  click.connect(clickGain);
  clickGain.connect(ctx.destination);
  osc.start(atTime);
  click.start(atTime);
  osc.stop(atTime + 0.2);
  click.stop(atTime + 0.06);
}

function playDrum(audioCtxRef, strength = 1) {
  const ctx = ensureAudio(audioCtxRef);
  if (ctx) playDrumAt(ctx, ctx.currentTime, strength);
}

function playMetronomeAt(ctx, atTime, strong = false, volume = 1) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(strong ? 1080 : 760, atTime);
  gain.gain.setValueAtTime((strong ? 0.075 : 0.045) * volume, atTime);
  gain.gain.exponentialRampToValueAtTime(0.001, atTime + 0.045);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(atTime);
  osc.stop(atTime + 0.055);
}

function playMetronomeNow(audioCtxRef, strong = false) {
  const ctx = ensureAudio(audioCtxRef);
  if (ctx) playMetronomeAt(ctx, ctx.currentTime, strong, 0.95);
}

function scheduleCountIn(audioCtxRef, eighthMs) {
  const ctx = ensureAudio(audioCtxRef);
  if (!ctx) return;
  const start = ctx.currentTime + 0.02;
  for (let i = 0; i < 6; i += 1) {
    playMetronomeAt(ctx, start + (i * eighthMs) / 1000, i === 0 || i === 3, 0.9);
  }
}

function previewMetronome(audioCtxRef, bpm) {
  const ctx = ensureAudio(audioCtxRef);
  if (!ctx) return;
  const dottedQuarterSeconds = 60 / bpm;
  const start = ctx.currentTime + 0.03;
  for (let beat = 0; beat < 4; beat += 1) {
    playMetronomeAt(ctx, start + beat * dottedQuarterSeconds, beat % 2 === 0, 1);
  }
}

function scheduleDemoAudio(audioCtxRef, exercise, unitMs, leadMs, metronomeEnabled, delayMs = 40) {
  const ctx = ensureAudio(audioCtxRef);
  if (!ctx) return;
  const start = ctx.currentTime + delayMs / 1000;
  const eighthMs = unitMs * 2;
  for (let i = 0; i < 6; i += 1) {
    playMetronomeAt(ctx, start + (i * eighthMs) / 1000, i === 0 || i === 3, 0.9);
  }
  buildNotes(exercise).forEach((note, index) => {
    playDrumAt(ctx, start + (leadMs + note.at * unitMs) / 1000, index % 4 === 0 ? 1.08 : 0.96);
  });
  if (metronomeEnabled) {
    for (let beat = 0; beat < 4; beat += 1) {
      playMetronomeAt(ctx, start + (leadMs + beat * unitMs * 6) / 1000, beat % 2 === 0, 0.55);
    }
  }
}

function scoreToStars(accuracy) {
  if (accuracy >= 92) return 3;
  if (accuracy >= 78) return 2;
  if (accuracy >= 60) return 1;
  return 0;
}

function clampTempo(value) {
  return Math.max(MIN_BPM, Math.min(MAX_BPM, value));
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
    const groups = [items.filter((item) => item.onset < 6), items.filter((item) => item.onset >= 6)];

    return (
      <g key={`bar-${barIndex}`}>
        {items.map((item) => {
          const dotted = item.token === 'de' || item.token === 'dq';
          const standalone = groups.every((group) => !(group.length > 1 && group.includes(item) && group.every((g) => DUR[g.token].units <= 3)));
          return (
            <g key={`${barIndex}-${item.index}`}>
              <ellipse cx={item.x} cy={baselineY} rx="7.2" ry="5.4" fill="#111827" transform={`rotate(-14 ${item.x} ${baselineY})`} />
              <line x1={item.x + 6} y1={baselineY - 1} x2={item.x + 6} y2={stemTop} stroke="#111827" strokeWidth="3" />
              {dotted && <circle cx={item.x + 15} cy={baselineY - 1} r="2.6" fill="#111827" />}
              {(item.token === 'e' || item.token === 's') && standalone && (
                <path d={`M ${item.x + 6} ${stemTop} Q ${item.x + 19} ${stemTop + 8} ${item.x + 12} ${stemTop + 22}`} fill="none" stroke="#111827" strokeWidth="3" />
              )}
              {item.token === 's' && standalone && (
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
      {[0, 1, 2].map((index) => <span key={index} className={index < stars ? 'opacity-100' : 'opacity-20'}>★</span>)}
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
  const [mistakes, setMistakes] = useState(0);
  const [judgement, setJudgement] = useState('選一題，先聽示範，再自己挑戰！');
  const [impact, setImpact] = useState(null);
  const [result, setResult] = useState(null);
  const [tempoBpm, setTempoBpm] = useState(EXERCISES[0].bpm);
  const [metronomeEnabled, setMetronomeEnabled] = useState(true);
  const [metronomePulse, setMetronomePulse] = useState(0);

  const frameRef = useRef(null);
  const audioCtxRef = useRef(null);
  const notesRef = useRef(notes);
  const statusRef = useRef(status);
  const statsRef = useRef(stats);
  const scoreRef = useRef(score);
  const comboRef = useRef(combo);
  const maxComboRef = useRef(maxCombo);
  const mistakesRef = useRef(mistakes);
  const lastMetronomeBeatRef = useRef(-1);
  const pulseTimerRef = useRef(null);

  const exercise = EXERCISES[exerciseNo - 1];
  const sprite = SPRITES[spriteKey];
  const busy = status === 'playing' || status === 'demo';
  const demoing = status === 'demo';
  const failed = status === 'failed';
  const unitMs = 60000 / tempoBpm / 6;
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
  useEffect(() => { mistakesRef.current = mistakes; }, [mistakes]);

  useEffect(() => {
    const invalid = EXERCISES.find((item) => item.bars.some((bar) => sumBar(bar) !== 12));
    if (invalid) console.warn(`Rhythm transcription bar length error in exercise ${invalid.no}`);
  }, []);

  useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (pulseTimerRef.current) window.clearTimeout(pulseTimerRef.current);
  }, []);

  const flashMetronome = useCallback((beatIndex) => {
    setMetronomePulse(beatIndex + 1);
    if (pulseTimerRef.current) window.clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = window.setTimeout(() => setMetronomePulse(0), 110);
  }, []);

  const resetRound = useCallback((nextExercise = exercise, message = '按 ENTER 開始；手機直接敲下方左右鼓面') => {
    const fresh = buildNotes(nextExercise);
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
    setMistakes(0);
    mistakesRef.current = 0;
    setElapsed(0);
    setJudgement(message);
    setImpact(null);
    setResult(null);
    setMetronomePulse(0);
    lastMetronomeBeatRef.current = -1;
    statusRef.current = 'idle';
    setStatus('idle');
  }, [exercise]);

  useEffect(() => {
    const next = EXERCISES[exerciseNo - 1];
    setTempoBpm(next.bpm);
    resetRound(next, '可以先按「示範本題」聽一次，再開始挑戰');
  }, [exerciseNo]); // eslint-disable-line react-hooks/exhaustive-deps

  const failRound = useCallback(() => {
    if (statusRef.current !== 'playing') return;
    statusRef.current = 'failed';
    setStatus('failed');
    comboRef.current = 0;
    setCombo(0);
    setMistakes(MAX_MISTAKES);
    mistakesRef.current = MAX_MISTAKES;
    setJudgement('💥 3 次錯誤！本題失敗，請重新挑戰');
    setImpact({ seq: Date.now() + Math.random(), side: 'center', grade: 'fail' });
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([90, 50, 120]);
    }
  }, []);

  const applyMistakes = useCallback((type, count = 1, side = 'center') => {
    if (statusRef.current !== 'playing' || count <= 0) return false;

    const nextStats = { ...statsRef.current, [type]: statsRef.current[type] + count };
    statsRef.current = nextStats;
    setStats(nextStats);

    comboRef.current = 0;
    setCombo(0);

    scoreRef.current = Math.max(0, scoreRef.current - ERROR_SCORE_PENALTY * count);
    setScore(scoreRef.current);

    const nextMistakes = Math.min(MAX_MISTAKES, mistakesRef.current + count);
    mistakesRef.current = nextMistakes;
    setMistakes(nextMistakes);

    setImpact({ seq: Date.now() + Math.random(), side, grade: type === 'ghost' ? 'ghost' : 'miss' });

    if (nextMistakes >= MAX_MISTAKES) {
      failRound();
      return true;
    }

    const remaining = MAX_MISTAKES - nextMistakes;
    setJudgement(type === 'ghost'
      ? `❌ 空拍！錯誤 ${nextMistakes}/${MAX_MISTAKES}，再錯 ${remaining} 次就重來`
      : `❌ MISS！錯誤 ${nextMistakes}/${MAX_MISTAKES}，再錯 ${remaining} 次就重來`);
    return false;
  }, [failRound]);

  const finishGame = useCallback(() => {
    if (statusRef.current !== 'playing') return;
    const s = statsRef.current;
    const judged = s.perfect + s.great + s.good + s.miss + s.ghost;
    const accuracy = judged
      ? Math.round(((s.perfect + s.great * 0.82 + s.good * 0.58) / judged) * 100)
      : 0;
    const stars = scoreToStars(accuracy);
    const finalScore = scoreRef.current;
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
    setResult({ stars, accuracy, score: finalScore, combo: maxComboRef.current, mistakes: mistakesRef.current });
    setCombo(0);
    comboRef.current = 0;
    statusRef.current = 'finished';
    setStatus('finished');
    setJudgement(stars > 0 ? '過關！下一題解鎖 🎉' : '這次未達過關標準，再試一次！');
  }, [exercise.no, progress]);

  const stopDemo = useCallback((message = '示範已停止，換你試試看！') => {
    if (statusRef.current !== 'demo') return;
    const fresh = buildNotes(exercise);
    notesRef.current = fresh;
    setNotes(fresh);
    setElapsed(0);
    setImpact(null);
    setMetronomePulse(0);
    lastMetronomeBeatRef.current = -1;
    statusRef.current = 'idle';
    setStatus('idle');
    setJudgement(message);
  }, [exercise]);

  useEffect(() => {
    if (status !== 'playing' && status !== 'demo') {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return undefined;
    }

    const tick = (now) => {
      const current = Math.max(0, now - startedAt);
      setElapsed(current);

      if (statusRef.current === 'demo') {
        let lastTriggered = null;
        const updated = notesRef.current.map((note, index) => {
          if (note.judged) return note;
          if (current >= leadMs + note.at * unitMs) {
            lastTriggered = { index, note };
            return { ...note, judged: true, result: 'demo' };
          }
          return note;
        });
        if (lastTriggered) {
          notesRef.current = updated;
          setNotes(updated);
          setImpact({ seq: Date.now() + Math.random(), side: lastTriggered.index % 2 === 0 ? 'left' : 'right', grade: 'demo' });
          setJudgement(`👂 示範：第 ${lastTriggered.note.barIndex + 1} 小節 · 咚！`);
        }
        if (metronomeEnabled && current >= leadMs) {
          const beatIndex = Math.floor((current - leadMs + 12) / (unitMs * 6));
          if (beatIndex >= 0 && beatIndex < 4 && beatIndex !== lastMetronomeBeatRef.current) {
            lastMetronomeBeatRef.current = beatIndex;
            flashMetronome(beatIndex);
          }
        }
        if (current >= totalDuration || updated.every((note) => note.judged)) {
          stopDemo('✅ 示範完成！現在換你打一次');
          return;
        }
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      let missed = 0;
      const updated = notesRef.current.map((note) => {
        if (note.judged) return note;
        if (current - (leadMs + note.at * unitMs) > HIT_WINDOWS.good) {
          missed += 1;
          return { ...note, judged: true, result: 'miss' };
        }
        return note;
      });

      if (missed > 0) {
        notesRef.current = updated;
        setNotes(updated);
        const failedNow = applyMistakes('miss', missed, 'center');
        if (failedNow || statusRef.current !== 'playing') return;
      }

      if (metronomeEnabled && current >= leadMs) {
        const beatIndex = Math.floor((current - leadMs + 12) / (unitMs * 6));
        if (beatIndex >= 0 && beatIndex < 4 && beatIndex !== lastMetronomeBeatRef.current) {
          lastMetronomeBeatRef.current = beatIndex;
          playMetronomeNow(audioCtxRef, beatIndex % 2 === 0);
          flashMetronome(beatIndex);
        }
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
  }, [status, startedAt, leadMs, unitMs, totalDuration, finishGame, stopDemo, metronomeEnabled, flashMetronome, applyMistakes]);

  const startGame = useCallback(() => {
    if (statusRef.current === 'demo') stopDemo();
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
    setMistakes(0);
    mistakesRef.current = 0;
    setElapsed(0);
    setResult(null);
    setImpact(null);
    setMetronomePulse(0);
    lastMetronomeBeatRef.current = -1;
    setJudgement('預備：1 2 3・4 5 6　⚠️ 三次錯誤就重來');
    setStartedAt(performance.now());
    statusRef.current = 'playing';
    setStatus('playing');
    scheduleCountIn(audioCtxRef, eighthMs);
  }, [exercise, eighthMs, stopDemo]);

  const startDemo = useCallback(() => {
    if (statusRef.current === 'playing') return;
    if (statusRef.current === 'demo') {
      stopDemo();
      return;
    }
    const fresh = buildNotes(exercise);
    notesRef.current = fresh;
    setNotes(fresh);
    setElapsed(0);
    setResult(null);
    setImpact(null);
    setCombo(0);
    comboRef.current = 0;
    setMistakes(0);
    mistakesRef.current = 0;
    lastMetronomeBeatRef.current = -1;
    setJudgement('👂 老師示範：先聽 1 2 3・4 5 6，再聽完整節奏');
    const delayMs = 40;
    setStartedAt(performance.now() + delayMs);
    statusRef.current = 'demo';
    setStatus('demo');
    scheduleDemoAudio(audioCtxRef, exercise, unitMs, leadMs, metronomeEnabled, delayMs);
  }, [exercise, unitMs, leadMs, metronomeEnabled, stopDemo]);

  const burstImpact = useCallback((side, grade = 'tap') => {
    setImpact({ seq: Date.now() + Math.random(), side, grade });
  }, []);

  const hit = useCallback((side = 'center') => {
    if (statusRef.current === 'demo' || statusRef.current === 'failed') return;
    playDrum(audioCtxRef, comboRef.current >= 10 ? 1.15 : 1);
    burstImpact(side, 'tap');
    if (statusRef.current !== 'playing') return;

    const current = performance.now() - startedAt;
    const candidates = notesRef.current
      .map((note, index) => ({ note, index, delta: Math.abs(current - (leadMs + note.at * unitMs)) }))
      .filter(({ note }) => !note.judged)
      .sort((a, b) => a.delta - b.delta);
    const target = candidates[0];

    if (!target || target.delta > HIT_WINDOWS.good) {
      applyMistakes('ghost', 1, side);
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

    const nextStats = { ...statsRef.current, [grade]: statsRef.current[grade] + 1 };
    statsRef.current = nextStats;
    setStats(nextStats);
    setJudgement(grade === 'perfect' ? `PERFECT ✨ +${points}` : grade === 'great' ? `GREAT! ⚡ +${points}` : `GOOD! +${points}`);
    burstImpact(side, grade);
  }, [startedAt, leadMs, unitMs, burstImpact, applyMistakes]);

  const mobileHit = useCallback((event, side) => {
    event.preventDefault();
    if (statusRef.current === 'demo' || statusRef.current === 'failed') return;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(16);
    hit(side);
  }, [hit]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat) return;
      if (event.code === 'Enter') {
        event.preventDefault();
        if (statusRef.current !== 'playing' && statusRef.current !== 'demo') startGame();
        return;
      }
      if (event.code === 'Escape') {
        if (statusRef.current === 'playing') {
          event.preventDefault();
          failRound();
        } else if (statusRef.current === 'demo') {
          event.preventDefault();
          stopDemo();
        }
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
  }, [hit, startGame, failRound, stopDemo]);

  const totalAttempts = stats.perfect + stats.great + stats.good + stats.miss + stats.ghost;
  const liveAccuracy = totalAttempts
    ? Math.round(((stats.perfect + stats.great * 0.82 + stats.good * 0.58) / totalAttempts) * 100)
    : 100;
  const countInLeft = Math.max(0, Math.ceil((leadMs - elapsed) / eighthMs));
  const fever = combo >= 10;
  const currentBest = progress[exercise.no] || {};
  const remainingLives = Math.max(0, MAX_MISTAKES - mistakes);

  const selectExercise = (no) => {
    const unlocked = freePractice || no <= unlockedThrough;
    if (unlocked && !busy) setExerciseNo(no);
  };
  const nextExercise = () => { if (exercise.no < 16 && !busy) setExerciseNo(exercise.no + 1); };
  const adjustTempo = (delta) => { if (!busy) setTempoBpm((value) => clampTempo(value + delta)); };
  const setTempo = (value) => { if (!busy) setTempoBpm(clampTempo(Number(value))); };
  const resetTempo = () => { if (!busy) setTempoBpm(exercise.bpm); };

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-[235px] md:pb-0">
      <style>{`
        @keyframes rhythmScreenShake{0%{transform:translate3d(0,0,0)}18%{transform:translate3d(-5px,1px,0) rotate(-.25deg)}38%{transform:translate3d(5px,-1px,0) rotate(.25deg)}60%{transform:translate3d(-2px,0,0)}100%{transform:translate3d(0,0,0)}}
        @keyframes rhythmDrumPunch{0%{transform:translate(-50%,-50%) scale(1)}35%{transform:translate(-50%,-50%) scale(.82) rotate(-5deg)}68%{transform:translate(-50%,-50%) scale(1.16) rotate(3deg)}100%{transform:translate(-50%,-50%) scale(1)}}
        @keyframes rhythmRing{0%{opacity:.95;transform:translate(-50%,-50%) scale(.45)}100%{opacity:0;transform:translate(-50%,-50%) scale(2.25)}}
        @keyframes rhythmSpriteLeft{0%{transform:translateY(0) rotate(0) scale(1)}35%{transform:translateY(-18px) rotate(-8deg) scale(1.08)}70%{transform:translateY(3px) rotate(4deg) scale(.98)}100%{transform:translateY(0) rotate(0) scale(1)}}
        @keyframes rhythmSpriteRight{0%{transform:translateY(0) rotate(0) scale(1)}35%{transform:translateY(-18px) rotate(8deg) scale(1.08)}70%{transform:translateY(3px) rotate(-4deg) scale(.98)}100%{transform:translateY(0) rotate(0) scale(1)}}
        @keyframes rhythmSpriteCenter{0%{transform:translateY(0) scale(1)}30%{transform:translateY(-22px) scale(1.1,.92)}65%{transform:translateY(4px) scale(.96,1.06)}100%{transform:translateY(0) scale(1)}}
        @keyframes rhythmParticle{0%{opacity:1;transform:translate(-50%,-50%) scale(.6)}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1.35) rotate(var(--rot))}}
        @keyframes rhythmJudgement{0%{opacity:0;transform:translateY(12px) scale(.7)}35%{opacity:1;transform:translateY(-5px) scale(1.12)}100%{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes rhythmFever{0%,100%{box-shadow:inset 0 0 0 rgba(251,191,36,0),0 0 30px rgba(251,191,36,.2)}50%{box-shadow:inset 0 0 65px rgba(251,191,36,.18),0 0 60px rgba(251,191,36,.48)}}
        @keyframes mobilePadPunch{0%{transform:scale(1)}35%{transform:scale(.86)}68%{transform:scale(1.07)}100%{transform:scale(1)}}
        @keyframes mobilePadRing{0%{opacity:.95;transform:translate(-50%,-50%) scale(.72)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.55)}}
        @keyframes metroPulse{0%{transform:scale(.82);opacity:.45}45%{transform:scale(1.25);opacity:1}100%{transform:scale(1);opacity:.75}}
        @keyframes dangerPulse{0%,100%{box-shadow:0 0 0 rgba(244,63,94,0)}50%{box-shadow:0 0 32px rgba(244,63,94,.55)}}
        .rhythm-screen-shake{animation:rhythmScreenShake 150ms ease-out}.rhythm-fever{animation:rhythmFever .7s ease-in-out infinite}.metro-pulse{animation:metroPulse 140ms ease-out}.danger-pulse{animation:dangerPulse .65s ease-in-out infinite}
      `}</style>

      <div className="rounded-3xl overflow-hidden border-4 border-amber-300 bg-gradient-to-b from-sky-100 via-cyan-50 to-amber-50 shadow-2xl">
        <div className="bg-slate-950 text-white px-4 py-3 md:px-7 md:py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] md:text-xs font-black tracking-[0.22em] text-amber-300">RUNKU RHYTHM ARCADE · V2.3 THREE STRIKES</div>
            <h2 className="text-xl md:text-3xl font-black">🥁 6/8 小小節奏達人</h2>
            <p className="hidden sm:block text-xs text-slate-400 mt-1">空拍或漏拍都算錯；累積 3 次錯誤立刻失敗重來，不能靠狂按過關。</p>
          </div>
          <div className="grid grid-cols-4 gap-1.5 md:flex md:flex-wrap md:gap-2 text-[10px] md:text-sm font-black w-full sm:w-auto">
            <div className="rounded-xl bg-white/10 px-2 py-2 text-center">分數<br className="sm:hidden" /> {score.toLocaleString()}</div>
            <div className={`rounded-xl px-2 py-2 text-center ${fever ? 'bg-amber-400 text-slate-950' : 'bg-white/10'}`}>連擊<br className="sm:hidden" /> {combo}</div>
            <div className="rounded-xl bg-white/10 px-2 py-2 text-center">準確<br className="sm:hidden" /> {liveAccuracy}%</div>
            <div className={`rounded-xl px-2 py-2 text-center ${mistakes >= 2 ? 'bg-rose-500 text-white danger-pulse' : mistakes > 0 ? 'bg-rose-900/70' : 'bg-white/10'}`}>錯誤<br className="sm:hidden" /> {mistakes}/{MAX_MISTAKES}</div>
          </div>
        </div>

        <div className="p-3 md:p-6 space-y-4 md:space-y-5">
          <div className="rounded-2xl bg-rose-50 border-2 border-rose-200 p-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-black text-rose-800">🚨 三次錯誤就重來</div>
              <div className="text-xs text-rose-600">空拍（亂按）與 MISS（漏拍）都算錯，每次另外扣 {ERROR_SCORE_PENALTY} 分。</div>
            </div>
            <div className="flex gap-2 text-2xl" aria-label={`剩餘 ${remainingLives} 次容錯`}>
              {[0, 1, 2].map((index) => <span key={index} className={index < remainingLives ? 'opacity-100' : 'opacity-20 grayscale'}>❤️</span>)}
            </div>
          </div>

          <div className="rounded-2xl bg-white border-2 border-slate-200 p-3 md:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div><div className="font-black text-slate-800">🎯 16 題闖關地圖</div><div className="text-[11px] md:text-xs text-slate-500">過關解鎖下一題；自由練習可直接選題。</div></div>
              <label className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-700 select-none"><input type="checkbox" checked={freePractice} onChange={(event) => setFreePractice(event.target.checked)} disabled={busy} className="w-4 h-4" />自由練習</label>
            </div>
            <div className="grid grid-cols-8 lg:grid-cols-16 gap-1.5 md:gap-2">
              {EXERCISES.map((item) => {
                const record = progress[item.no] || {};
                const unlocked = freePractice || item.no <= unlockedThrough;
                const active = exercise.no === item.no;
                return (
                  <button key={item.no} onClick={() => selectExercise(item.no)} disabled={!unlocked || busy} className={`relative min-h-12 md:min-h-16 rounded-lg md:rounded-xl border-2 font-black transition-all ${active ? 'border-amber-500 bg-amber-100 -translate-y-1 shadow-lg' : unlocked ? 'border-sky-200 bg-sky-50 hover:-translate-y-1 hover:shadow-md' : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                    <div className="text-sm md:text-lg">{unlocked ? item.no : '🔒'}</div>
                    <StarRow stars={record.stars || 0} size="text-[8px] md:text-[10px]" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl bg-white border-2 border-indigo-200 p-4 md:p-5 shadow-sm">
            <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-center">
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div><div className="text-xs font-black tracking-[0.18em] text-indigo-600">TEMPO & METRONOME</div><div className="flex items-end gap-2"><span className="text-3xl font-black text-slate-900">{tempoBpm}</span><span className="pb-1 text-sm font-bold text-slate-500">BPM · ♩.</span></div></div>
                  <div className="flex items-center gap-2">{[0, 1].map((beat) => <span key={beat} className={`w-4 h-4 rounded-full border-2 border-indigo-300 ${metronomePulse && (metronomePulse - 1) % 2 === beat ? 'bg-amber-400 metro-pulse' : 'bg-slate-100'}`} />)}<span className="text-xs font-black text-slate-500">1 · 4</span></div>
                </div>
                <input type="range" min={MIN_BPM} max={MAX_BPM} step="1" value={tempoBpm} disabled={busy} onChange={(event) => setTempo(event.target.value)} className="w-full accent-indigo-600" aria-label="遊戲速度 BPM" />
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <button onClick={() => adjustTempo(-5)} disabled={busy} className="rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 font-black active:scale-95 disabled:opacity-40">−5</button>
                  <button onClick={() => adjustTempo(5)} disabled={busy} className="rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 font-black active:scale-95 disabled:opacity-40">+5</button>
                  {[60, 80, 100, 120].map((bpm) => <button key={bpm} onClick={() => setTempo(bpm)} disabled={busy} className={`rounded-xl px-3 py-2 text-sm font-black border-2 active:scale-95 disabled:opacity-40 ${tempoBpm === bpm ? 'border-indigo-500 bg-indigo-100 text-indigo-800' : 'border-slate-200 bg-white text-slate-600'}`}>{bpm}</button>)}
                  <button onClick={resetTempo} disabled={busy} className="rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-2 text-sm font-black text-amber-800 active:scale-95 disabled:opacity-40">原速 {exercise.bpm}</button>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                <button onClick={() => setMetronomeEnabled((value) => !value)} className={`rounded-2xl border-b-4 px-4 py-3 font-black active:translate-y-1 active:border-b-2 ${metronomeEnabled ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-slate-100 border-slate-400 text-slate-600'}`}>{metronomeEnabled ? '🔊 節拍器 ON' : '🔇 節拍器 OFF'}<div className="text-[10px] opacity-70 mt-1">遊戲中提示 1、4 大拍</div></button>
                <button onClick={() => previewMetronome(audioCtxRef, tempoBpm)} disabled={busy} className="rounded-2xl border-b-4 border-indigo-500 bg-indigo-100 px-4 py-3 font-black text-indigo-800 active:translate-y-1 active:border-b-2 disabled:opacity-40">▶ 試聽 2 小節<div className="text-[10px] opacity-70 mt-1">目前 {tempoBpm} BPM</div></button>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_260px] gap-4 md:gap-5 items-stretch">
            <div className="rounded-3xl bg-white border-2 border-slate-200 p-3 md:p-5 shadow-sm overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1"><div><div className="text-[10px] md:text-xs font-black tracking-[0.18em] text-sky-600">ORIGINAL RHYTHM · 6/8</div><h3 className="text-xl md:text-2xl font-black text-slate-900">第 {exercise.no} 題</h3></div><div className="text-right"><div className="text-[10px] md:text-xs text-slate-500">現在速度 / 原速</div><div className="font-black text-slate-800">♩. = {tempoBpm} / {exercise.bpm}</div></div></div>
              <div className="w-full overflow-x-auto"><div className="min-w-[520px] sm:min-w-0"><RhythmScore exercise={exercise} /></div></div>
              <div className="text-[10px] md:text-xs text-slate-500 border-t pt-2 flex flex-wrap justify-between gap-2"><span>節奏資料不因調速改變，只改演奏速度。</span><span>小節檢查：{exercise.bars.map(sumBar).join(' / ')} units</span></div>
            </div>

            <div className="rounded-3xl bg-white border-2 border-amber-200 p-3 md:p-4 flex items-center lg:flex-col lg:items-center justify-between gap-3 overflow-hidden">
              <div className="w-full flex items-center justify-between gap-2"><div><div className="text-xs font-black text-slate-500">陪練角色</div><div className="font-black text-slate-900">{sprite.name}</div></div><select value={spriteKey} disabled={busy} onChange={(event) => setSpriteKey(event.target.value)} className="rounded-xl border border-slate-200 px-2 py-1 text-sm font-bold bg-white">{Object.entries(SPRITES).map(([key, item]) => <option key={key} value={key}>{item.name}</option>)}</select></div>
              <div className="relative h-24 w-28 lg:h-40 lg:w-full flex items-end justify-center shrink-0"><div key={impact ? `${spriteKey}-${impact.seq}` : spriteKey} className="h-full flex items-end justify-center" style={impact ? { animation: `${impact.side === 'left' ? 'rhythmSpriteLeft' : impact.side === 'right' ? 'rhythmSpriteRight' : 'rhythmSpriteCenter'} 230ms cubic-bezier(.2,.9,.2,1)` } : undefined}><img src={sprite.src} alt={sprite.name} className="max-h-full max-w-full object-contain drop-shadow-lg" /></div></div>
              <div className="hidden lg:block text-center text-sm font-bold text-slate-600">每次敲擊，角色會跟著跳！</div>
            </div>
          </div>

          <div key={impact ? `arena-${impact.seq}` : 'arena'} className={`relative rounded-3xl bg-slate-950 p-3 md:p-6 overflow-hidden border-4 ${failed ? 'border-rose-500 danger-pulse' : fever ? 'border-amber-300 rhythm-fever' : 'border-slate-800'} ${impact && !['ghost', 'miss'].includes(impact.grade) ? 'rhythm-screen-shake' : ''}`}>
            <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(56,189,248,.35), transparent 30%), radial-gradient(circle at 55% 100%, rgba(251,191,36,.28), transparent 35%)' }} />
            {fever && !failed && <div className="absolute top-2 right-3 z-20 rounded-full bg-amber-300 text-slate-950 px-3 py-1 text-[10px] md:text-xs font-black tracking-widest animate-pulse">🔥 FEVER ×{Math.min(2, 1 + Math.floor(combo / 10) * 0.25).toFixed(2)}</div>}

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 text-white mb-3">
              <div><div className="font-black text-sm md:text-lg">第 {exercise.no} 題 · 音符進黃圈才打！</div><div className="hidden md:block text-xs text-slate-400">F / ← = 左手　J / → = 右手　SPACE = 任一手　ENTER = 開始</div><div className="md:hidden text-[10px] text-slate-400">手機：只在音符到黃圈時敲下方鼓面</div></div>
              <div key={impact ? `judge-${impact.seq}` : judgement} className={`text-base md:text-2xl font-black ${judgement.includes('PERFECT') ? 'text-amber-300' : judgement.includes('GREAT') ? 'text-cyan-300' : judgement.includes('錯誤') || judgement.includes('失敗') || judgement.includes('MISS') ? 'text-rose-300' : 'text-white'}`} style={{ animation: 'rhythmJudgement 220ms ease-out' }}>{judgement}</div>
            </div>

            <div className="relative z-10 h-44 sm:h-52 md:h-60 rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900">
              <div className="absolute left-[14%] top-0 bottom-0 w-1.5 bg-amber-300 shadow-[0_0_25px_rgba(252,211,77,1)] z-10" />
              <div key={impact ? `drum-${impact.seq}` : 'drum'} className="absolute left-[14%] top-1/2 h-20 w-20 md:h-28 md:w-28 rounded-full border-[6px] md:border-8 border-white/90 bg-gradient-to-br from-rose-400 to-rose-600 shadow-2xl z-20 flex items-center justify-center" style={{ transform: 'translate(-50%,-50%)', animation: impact ? 'rhythmDrumPunch 180ms cubic-bezier(.2,.85,.25,1)' : undefined }}><span className="text-3xl md:text-5xl">🥁</span></div>

              {impact && <><div key={`ring-${impact.seq}`} className={`absolute left-[14%] top-1/2 h-20 w-20 md:h-28 md:w-28 rounded-full border-[6px] md:border-8 z-30 pointer-events-none ${impact.grade === 'perfect' || impact.grade === 'demo' ? 'border-amber-200' : impact.grade === 'ghost' || impact.grade === 'miss' || impact.grade === 'fail' ? 'border-rose-300' : 'border-cyan-200'}`} style={{ animation: 'rhythmRing 360ms ease-out forwards' }} />{[['-70px', '-45px', '-25deg'], ['-52px', '50px', '20deg'], ['0px', '-70px', '45deg'], ['58px', '-45px', '80deg'], ['72px', '16px', '110deg'], ['22px', '65px', '150deg']].map(([dx, dy, rot], index) => <span key={`${impact.seq}-particle-${index}`} className="absolute left-[14%] top-1/2 z-40 text-xl md:text-2xl pointer-events-none" style={{ '--dx': dx, '--dy': dy, '--rot': rot, animation: 'rhythmParticle 430ms ease-out forwards' }}>{impact.grade === 'ghost' || impact.grade === 'miss' || impact.grade === 'fail' ? '❌' : impact.grade === 'perfect' || impact.grade === 'demo' ? '✨' : '⚡'}</span>)}</>}

              {status === 'playing' && countInLeft > 0 && <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/25 pointer-events-none"><div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-amber-300 text-slate-950 flex items-center justify-center text-4xl md:text-5xl font-black shadow-2xl border-8 border-white/80 animate-pulse">{Math.min(6, countInLeft)}</div></div>}
              {demoing && <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 rounded-full bg-indigo-400 text-white px-4 py-1 text-xs font-black animate-pulse">👂 示範中</div>}
              {failed && <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-rose-950/75 text-white text-center p-5"><div className="text-5xl mb-2">💥</div><div className="text-3xl font-black">3 次錯誤，本題重來！</div><div className="text-sm text-rose-100 mt-2">亂按也會算空拍錯誤，請看準黃圈再敲。</div><button onClick={startGame} className="mt-5 rounded-2xl bg-white text-rose-700 px-6 py-3 font-black shadow-xl">↻ 馬上重新挑戰</button></div>}

              {Array.from({ length: 13 }).map((_, index) => {
                const at = index * 2;
                const hitTime = leadMs + at * unitMs;
                const x = 14 + ((hitTime - elapsed) / leadMs) * 82;
                if (x < 4 || x > 104) return null;
                const withinBar = index % 6;
                const strong = withinBar === 0 || withinBar === 3;
                return <div key={`grid-${index}`} className={`absolute top-0 bottom-0 border-l ${strong ? 'border-amber-200/20' : 'border-white/5'}`} style={{ left: `${x}%` }}><span className={`absolute bottom-2 -translate-x-1/2 text-[9px] md:text-[10px] font-black ${strong ? 'text-amber-300' : 'text-slate-600'}`}>{(withinBar % 6) + 1}</span></div>;
              })}

              {notes.map((note) => {
                const hitTime = leadMs + note.at * unitMs;
                const x = 14 + ((hitTime - elapsed) / leadMs) * 82;
                if (x < -8 || x > 108 || note.judged) return null;
                return <div key={note.id} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20" style={{ left: `${x}%` }}><div className="relative w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 border-4 border-white shadow-[0_0_20px_rgba(251,113,133,.55)] flex items-center justify-center text-white font-black text-xs md:text-base">咚<span className="absolute -bottom-4 md:-bottom-5 text-[8px] md:text-[10px] text-slate-300 whitespace-nowrap">{DUR[note.token].units === 1 ? '♬' : DUR[note.token].units === 2 ? '♪' : DUR[note.token].units === 3 ? '♪.' : DUR[note.token].units === 4 ? '♩' : '♩.'}</span></div></div>;
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <button onClick={startDemo} disabled={status === 'playing' || failed} className={`rounded-2xl border-b-4 px-5 py-4 font-black active:translate-y-1 active:border-b-2 disabled:opacity-40 ${demoing ? 'bg-rose-100 border-rose-500 text-rose-700' : 'bg-indigo-100 border-indigo-500 text-indigo-800'}`}>{demoing ? '■ 停止示範' : '👂 示範本題'}<div className="text-[10px] opacity-70 mt-1">不計分、不算錯</div></button>
            <button onClick={status === 'playing' ? failRound : startGame} disabled={demoing} className={`rounded-2xl border-b-4 px-5 py-4 font-black active:translate-y-1 active:border-b-2 disabled:opacity-40 ${status === 'playing' ? 'bg-rose-500 border-rose-800 text-white' : failed ? 'bg-rose-600 border-rose-900 text-white' : 'bg-emerald-400 border-emerald-700 text-slate-950'}`}>{status === 'playing' ? '■ 放棄本局' : failed ? '↻ 3錯重來' : status === 'finished' ? '↻ 再挑戰' : '▶ 開始闖關'}<div className="text-[10px] opacity-70 mt-1">ENTER</div></button>
            <div className="rounded-2xl border-2 border-rose-200 bg-white px-5 py-3 flex items-center justify-between"><div><div className="text-xs font-black text-slate-500">本局容錯</div><div className="font-black text-rose-700">錯誤 {mistakes} / {MAX_MISTAKES}</div></div><div className="text-2xl">{[0, 1, 2].map((index) => <span key={index} className={index < remainingLives ? '' : 'opacity-20 grayscale'}>❤️</span>)}</div></div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-5">
            <div className="rounded-2xl bg-white border border-slate-200 p-4 md:p-5"><h4 className="font-black text-slate-800 mb-3">🏆 本題紀錄</h4><div className="grid grid-cols-2 gap-2 md:gap-3 text-sm"><div className="rounded-xl bg-amber-50 p-3"><div className="text-slate-500">星星</div><StarRow stars={currentBest.stars || 0} /></div><div className="rounded-xl bg-sky-50 p-3"><div className="text-slate-500">最高分</div><div className="font-black text-lg">{(currentBest.score || 0).toLocaleString()}</div></div><div className="rounded-xl bg-emerald-50 p-3"><div className="text-slate-500">最佳準確</div><div className="font-black text-lg">{currentBest.accuracy || 0}%</div></div><div className="rounded-xl bg-violet-50 p-3"><div className="text-slate-500">最高連擊</div><div className="font-black text-lg">{currentBest.combo || 0}</div></div></div></div>
            <div className="rounded-2xl bg-white border border-slate-200 p-4 md:p-5"><h4 className="font-black text-slate-800 mb-3">🎮 嚴格判定</h4><div className="grid grid-cols-5 gap-1.5 md:gap-2 text-center text-[10px] md:text-xs"><div className="rounded-xl bg-amber-50 p-2"><div className="font-black text-amber-700">PERFECT</div><div className="text-lg md:text-xl font-black">{stats.perfect}</div></div><div className="rounded-xl bg-cyan-50 p-2"><div className="font-black text-cyan-700">GREAT</div><div className="text-lg md:text-xl font-black">{stats.great}</div></div><div className="rounded-xl bg-emerald-50 p-2"><div className="font-black text-emerald-700">GOOD</div><div className="text-lg md:text-xl font-black">{stats.good}</div></div><div className="rounded-xl bg-rose-50 p-2"><div className="font-black text-rose-700">MISS</div><div className="text-lg md:text-xl font-black">{stats.miss}</div></div><div className="rounded-xl bg-slate-100 p-2"><div className="font-black text-slate-600">空拍</div><div className="text-lg md:text-xl font-black">{stats.ghost}</div></div></div><div className="mt-3 text-xs text-slate-500">MISS 與空拍都會降低準確率、扣分並消耗 1 顆心；第 3 次立刻失敗。</div></div>
          </div>
        </div>
      </div>

      {result && status === 'finished' && <div className="rounded-3xl border-4 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-5 md:p-8 shadow-xl text-center"><div className="text-sm font-black tracking-[0.25em] text-amber-600">STAGE CLEAR</div><div className="text-3xl md:text-4xl font-black text-slate-900 mt-1">第 {exercise.no} 題完成！</div><div className="my-3"><StarRow stars={result.stars} size="text-5xl" /></div><div className="flex flex-wrap justify-center gap-2 md:gap-3 text-sm font-black"><span className="rounded-full bg-white border px-4 py-2">分數 {result.score.toLocaleString()}</span><span className="rounded-full bg-white border px-4 py-2">準確 {result.accuracy}%</span><span className="rounded-full bg-white border px-4 py-2">錯誤 {result.mistakes}/{MAX_MISTAKES}</span><span className="rounded-full bg-white border px-4 py-2">最高連擊 {result.combo}</span></div><div className="mt-5 flex flex-wrap justify-center gap-3"><button onClick={startGame} className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-black">↻ 再打一遍</button>{exercise.no < 16 && (result.stars > 0 || freePractice) && <button onClick={nextExercise} className="rounded-2xl bg-amber-400 text-slate-950 px-6 py-3 font-black">下一題 →</button>}</div></div>}

      <div className="md:hidden fixed inset-x-0 bottom-0 z-[80] border-t border-white/20 bg-slate-950/95 backdrop-blur-xl shadow-[0_-18px_45px_rgba(15,23,42,.42)]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)' }}>
        <div className="max-w-md mx-auto px-3 pt-2">
          <div className="flex items-center justify-between px-2 mb-1 text-[10px] font-black tracking-wider text-slate-300"><span>{demoing ? '👂 示範中' : failed ? '💥 本題失敗' : '手機雙鼓面'}</span><span className="rounded-full bg-white/10 px-2 py-1">♩. {tempoBpm} BPM</span><span className={mistakes >= 2 ? 'text-rose-300' : ''}>❤️ {remainingLives}/3</span></div>
          <div className="flex items-end justify-center gap-3">
            {[
              { side: 'left', label: '左手', sub: 'LEFT', base: 'from-rose-400 to-rose-600', ring: 'border-rose-200', glow: 'shadow-[0_0_35px_rgba(251,113,133,.48)]' },
              { side: 'right', label: '右手', sub: 'RIGHT', base: 'from-sky-400 to-sky-600', ring: 'border-sky-200', glow: 'shadow-[0_0_35px_rgba(56,189,248,.48)]' },
            ].map((pad) => {
              const active = impact?.side === pad.side;
              return <button key={`${pad.side}-${active ? impact.seq : 'idle'}`} type="button" disabled={demoing || failed} onTouchStart={(event) => mobileHit(event, pad.side)} className={`relative select-none overflow-visible rounded-full border-[7px] border-white/90 bg-gradient-to-br ${pad.base} ${pad.glow} w-[42vw] h-[42vw] max-w-[176px] max-h-[176px] min-w-[132px] min-h-[132px] flex flex-col items-center justify-center text-white font-black disabled:opacity-40`} style={{ touchAction: 'none', WebkitTapHighlightColor: 'transparent', animation: active ? 'mobilePadPunch 180ms cubic-bezier(.2,.85,.25,1)' : undefined }} aria-label={`${pad.label}鼓面`}><span className="text-4xl leading-none">🥁</span><span className="text-xl mt-1">{pad.label}</span><span className="text-[10px] opacity-80 tracking-[0.18em]">{pad.sub}</span>{active && <><span className={`absolute left-1/2 top-1/2 w-full h-full rounded-full border-[7px] ${pad.ring} pointer-events-none`} style={{ animation: 'mobilePadRing 360ms ease-out forwards' }} />{[['-48px', '-70px', '-25deg'], ['-72px', '0px', '15deg'], ['-42px', '62px', '35deg'], ['48px', '-70px', '60deg'], ['72px', '0px', '100deg'], ['42px', '62px', '145deg']].map(([dx, dy, rot], index) => <span key={`${impact.seq}-${pad.side}-spark-${index}`} className="absolute left-1/2 top-1/2 text-xl pointer-events-none" style={{ '--dx': dx, '--dy': dy, '--rot': rot, animation: 'rhythmParticle 420ms ease-out forwards' }}>{impact.grade === 'ghost' || impact.grade === 'miss' || impact.grade === 'fail' ? '❌' : impact.grade === 'perfect' ? '✨' : '⚡'}</span>)}</>}</button>;
            })}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2"><button onClick={startDemo} disabled={status === 'playing' || failed} className="rounded-xl bg-indigo-100 text-indigo-800 py-2 font-black text-xs disabled:opacity-40">{demoing ? '■ 停止示範' : '👂 示範本題'}</button><button onClick={status === 'playing' ? failRound : startGame} disabled={demoing} className={`rounded-xl py-2 font-black text-xs ${status === 'playing' || failed ? 'bg-rose-500 text-white' : 'bg-emerald-400 text-slate-950'} disabled:opacity-40`}>{status === 'playing' ? '■ 放棄' : failed ? '↻ 重新挑戰' : '▶ 開始'}</button></div>
          <div className="text-center text-[10px] text-slate-400 mt-1">只在音符到黃圈時敲；空拍與漏拍累積 3 次就重來</div>
        </div>
      </div>
    </div>
  );
}
