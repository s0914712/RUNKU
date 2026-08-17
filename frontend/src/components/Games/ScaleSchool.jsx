import { useEffect, useMemo, useState } from 'react';
import {
  LEVELS,
  SCALE_MODES,
  OPEN_STRINGS,
  isBlackKey,
  noteNameOf,
  spellScale,
  violinPosition,
  midiOf,
} from './musicTheory';
import { playNote, playSequence, stopAll } from './scaleAudio';
import './ScaleSchool.css';

const SAVE_VERSION = 1;
const STORAGE_KEY = `runku_scale_school_mei_v${SAVE_VERSION}`;
const EAR_QUESTIONS = 5;

function readProgress() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (saved?.version === SAVE_VERSION) {
      return {
        cleared: Array.isArray(saved.cleared) ? saved.cleared : [],
        best: saved.best && typeof saved.best === 'object' ? saved.best : {},
      };
    }
  } catch {
    // 沒有存檔就從第一關開始，不要因為 storage 被擋就整個玩不了。
  }
  return { cleared: [], best: {} };
}

function seededShuffle(items, seed) {
  const output = [...items];
  let value = seed + 17;
  for (let index = output.length - 1; index > 0; index -= 1) {
    value = (value * 9301 + 49297) % 233280;
    const target = Math.floor((value / 233280) * (index + 1));
    [output[index], output[target]] = [output[target], output[index]];
  }
  return output;
}

/* ---------------- 鍵盤 ---------------- */

function Keyboard({ fromMidi, scale, pressedCount, wrongMidi, hintMidi, onPress, disabled }) {
  const keys = Array.from({ length: 13 }, (_, index) => fromMidi + index);
  const whites = keys.filter((midi) => !isBlackKey(midi));
  const nameByMidi = new Map(scale.map((note) => [note.midi, note.name]));
  const doneMidis = new Set(scale.slice(0, pressedCount).map((note) => note.midi));

  const labelFor = (midi) => nameByMidi.get(midi) || noteNameOf(midi);
  const stateOf = (midi) => {
    if (midi === wrongMidi) return ' is-wrong';
    if (doneMidis.has(midi)) return ' is-done';
    if (midi === hintMidi) return ' is-hint';
    return '';
  };

  return (
    <div className="ss-keyboard" data-testid="scale-keyboard">
      <div className="ss-keys-white">
        {whites.map((midi) => (
          <button
            key={midi}
            className={`ss-key ss-key-white${stateOf(midi)}`}
            data-midi={midi}
            data-note={labelFor(midi)}
            disabled={disabled}
            onClick={() => onPress(midi)}
            aria-label={labelFor(midi)}
          >
            <span>{labelFor(midi)}</span>
          </button>
        ))}
      </div>
      <div className="ss-keys-black" aria-hidden="true">
        {keys.filter(isBlackKey).map((midi) => {
          const whiteBefore = whites.filter((white) => white < midi).length;
          return (
            <button
              key={midi}
              className={`ss-key ss-key-black${stateOf(midi)}`}
              data-midi={midi}
              data-note={labelFor(midi)}
              disabled={disabled}
              onClick={() => onPress(midi)}
              style={{ left: `calc(${whiteBefore} * (100% / ${whites.length}) - 0.5 * var(--ss-black-w))` }}
            >
              <span>{labelFor(midi)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- 小提琴指板 ---------------- */

function Fingerboard({ midi }) {
  const position = midi == null ? null : violinPosition(midi);
  return (
    <div className="ss-fingerboard" data-testid="scale-fingerboard">
      <header><small>VIOLIN · 第一把位</small><b>{position ? `${position.string} 弦 · ${position.finger}` : '在小提琴上的位置'}</b></header>
      <div className="ss-strings">
        {OPEN_STRINGS.map((string, index) => (
          <div key={string.name} className={`ss-string${position?.stringIndex === index ? ' is-active' : ''}`}>
            <span className="ss-string-name">{string.name}</span>
            <div className="ss-string-line">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((offset) => {
                const active = position?.stringIndex === index && position.offset === offset;
                return (
                  <i key={offset} className={`ss-dot${active ? ' is-active' : ''}${offset === 0 ? ' is-open' : ''}`}>
                    {active ? position.short : ''}
                  </i>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p>{position ? `按 ${position.string} 弦的${position.finger}` : '按下鍵盤上的音，這裡會顯示小提琴上的位置'}</p>
    </div>
  );
}

/* ---------------- 公式列 ---------------- */

function FormulaRow({ mode, pressedCount }) {
  return (
    <div className="ss-formula" aria-label="音階公式">
      {SCALE_MODES[mode].formula.map((step, index) => (
        <span
          key={index}
          className={index < pressedCount - 1 ? 'is-done' : index === pressedCount - 1 ? 'is-next' : ''}
        >{step}</span>
      ))}
    </div>
  );
}

/* ---------------- 關卡地圖 ---------------- */

function LevelMap({ progress, onOpen }) {
  const clearedCount = progress.cleared.length;
  return (
    <div className="scale-school ss-map" data-testid="scale-school-map">
      <header className="ss-map-head">
        <p className="ss-kicker">SCALE SCHOOL · 妹妹專屬</p>
        <h1>星獸音階教室<br /><em>大調與小調</em></h1>
        <p className="ss-lead">
          用鍵盤按出音階，下面同時告訴你這個音在小提琴的哪一條弦、第幾指。
          全部 17 個音階都排在第一把位裡，和你的小提琴課接得上。
        </p>
        <div className="ss-progress-row">
          <span><small>已完成</small><b>{clearedCount}/{LEVELS.length}</b></span>
          <span><small>大調</small><b>7</b></span>
          <span><small>小調</small><b>10</b></span>
        </div>
      </header>

      <ol className="ss-levels">
        {LEVELS.map((level, index) => {
          const cleared = progress.cleared.includes(level.id);
          const locked = index > 0 && !progress.cleared.includes(LEVELS[index - 1].id);
          return (
            <li key={level.id}>
              <button
                className={`ss-level${cleared ? ' is-cleared' : ''}${locked ? ' is-locked' : ''}`}
                onClick={() => onOpen(index)}
                disabled={locked}
                data-level={level.id}
              >
                <span className="ss-level-no">{locked ? '🔒' : cleared ? '✓' : index + 1}</span>
                <div>
                  <b>{level.name}</b>
                  <small>{level.en}</small>
                  <p>{level.note}</p>
                </div>
                {cleared && <em>{progress.best[level.id] || 0} 分</em>}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ---------------- 教學關 ---------------- */

const LESSON_STEPS = [
  {
    title: '半音：最靠近的下一個鍵',
    body: '半音就是鍵盤上「緊鄰的下一個鍵」，中間不能再插進任何鍵——黑鍵也要算進去。',
    task: '從 C 往右按一個半音',
    from: midiOf('C', 0, 4),
    answer: midiOf('C', 0, 4) + 1,
  },
  {
    title: '全音：跳過一個鍵',
    body: '全音等於兩個半音，中間會跳過一個鍵。從 C 往上一個全音就是 D，中間跳過了黑鍵 C♯。',
    task: '從 C 往右按一個全音',
    from: midiOf('C', 0, 4),
    answer: midiOf('C', 0, 4) + 2,
  },
  {
    title: '大調的公式',
    body: '每個大調都長一樣：全 全 半 全 全 全 半。小調換一組順序，聽起來就完全不同。接下來每一關，就是把公式套在不同的起點上。',
  },
];

function Lesson({ onDone, onHome }) {
  const [step, setStep] = useState(0);
  const [wrongMidi, setWrongMidi] = useState(null);
  const [solved, setSolved] = useState(false);
  const current = LESSON_STEPS[step];
  const scale = useMemo(() => spellScale('C', 4, 'major'), []);

  const press = (midi) => {
    playNote(midi);
    if (midi === current.answer) {
      setSolved(true);
      setWrongMidi(null);
      return;
    }
    setWrongMidi(midi);
    window.setTimeout(() => setWrongMidi(null), 700);
  };

  const next = () => {
    if (step + 1 >= LESSON_STEPS.length) {
      onDone();
      return;
    }
    setStep((value) => value + 1);
    setSolved(false);
  };

  return (
    <div className="scale-school ss-play" data-testid="scale-school-lesson">
      <header className="ss-play-head">
        <button onClick={onHome}>← 音階地圖</button>
        <div><small>LESSON {step + 1} / {LESSON_STEPS.length}</small><b>{current.title}</b></div>
        <span>教學</span>
      </header>

      <div className="ss-lesson-body">
        <p className="ss-lesson-text">{current.body}</p>

        {current.task ? (
          <>
            <p className="ss-task">🎯 {current.task}</p>
            <Keyboard
              fromMidi={current.from}
              scale={scale}
              pressedCount={0}
              wrongMidi={wrongMidi}
              hintMidi={solved ? null : current.answer}
              onPress={press}
              disabled={solved}
            />
            {solved && (
              <div className="ss-verdict is-correct" role="status">
                <span>✅</span>
                <div><b>就是這個！</b><p>{current.title.split('：')[0]}＝{current.answer - current.from === 1 ? '往右一個鍵' : '往右兩個鍵'}</p></div>
                <button onClick={next}>下一步 →</button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="ss-formula-demo">
              <div><b>大調</b><FormulaRow mode="major" pressedCount={0} /></div>
              <div><b>自然小調</b><FormulaRow mode="natural" pressedCount={0} /></div>
            </div>
            <button className="ss-primary" onClick={next}>我懂了，開始按音階 <span>➜</span></button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- 按音階關 ---------------- */

function Build({ level, onClear, onHome }) {
  const scale = useMemo(() => spellScale(level.letter, level.octave, level.mode), [level]);
  const [pressed, setPressed] = useState(0);
  const [wrongMidi, setWrongMidi] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [hintOn, setHintOn] = useState(false);
  const [lastMidi, setLastMidi] = useState(null);

  useEffect(() => {
    setPressed(0);
    setMistakes(0);
    setHintOn(false);
    setLastMidi(null);
    return stopAll;
  }, [level.id]);

  const done = pressed >= scale.length;
  const nextNote = done ? null : scale[pressed];

  const press = (midi) => {
    playNote(midi);
    setLastMidi(midi);
    if (nextNote && midi === nextNote.midi) {
      setPressed((value) => value + 1);
      setWrongMidi(null);
      return;
    }
    setWrongMidi(midi);
    setMistakes((value) => value + 1);
    window.setTimeout(() => setWrongMidi(null), 650);
  };

  const score = Math.max(40, 150 - mistakes * 15 - (hintOn ? 25 : 0));

  return (
    <div className="scale-school ss-play" data-testid="scale-school-build" data-level={level.id} data-progress={pressed}>
      <header className="ss-play-head">
        <button onClick={onHome}>← 音階地圖</button>
        <div><small>{level.en}</small><b>{level.name}</b></div>
        <span>{pressed} / {scale.length}</span>
      </header>

      <div className="ss-play-body">
        <div className="ss-brief">
          <p>{level.note}</p>
          <div className="ss-brief-tools">
            <button onClick={() => playSequence(scale.map((note) => note.midi))}>🔊 先聽一次</button>
            <button className={hintOn ? 'is-on' : ''} onClick={() => setHintOn((value) => !value)}>
              💡 提示{hintOn ? '（開）' : ''}
            </button>
          </div>
        </div>

        <div className="ss-target">
          <small>{SCALE_MODES[level.mode].label}的公式</small>
          <FormulaRow mode={level.mode} pressedCount={pressed} />
          <em>{SCALE_MODES[level.mode].mood}</em>
        </div>

        <p className="ss-task" data-testid="scale-next-note">
          {done ? '🎉 整個音階按完了！' : <>🎯 第 {pressed + 1} 個音{pressed > 0 ? <>：往上走 <b>{SCALE_MODES[level.mode].formula[pressed - 1]}音</b></> : '：從主音開始'}</>}
        </p>

        <Keyboard
          fromMidi={scale[0].midi}
          scale={scale}
          pressedCount={pressed}
          wrongMidi={wrongMidi}
          hintMidi={hintOn && nextNote ? nextNote.midi : null}
          onPress={press}
          disabled={done}
        />

        <div className="ss-note-strip" aria-label="已按出的音">
          {scale.map((note, index) => (
            <span key={note.degree} className={index < pressed ? 'is-done' : ''}>{index < pressed ? note.name : '?'}</span>
          ))}
        </div>

        <Fingerboard midi={done ? scale[scale.length - 1].midi : lastMidi} />
      </div>

      {wrongMidi != null && !done && (
        <div className="ss-verdict is-wrong" role="status">
          <span>🎧</span>
          <div>
            <b>這個音不在 {level.name} 裡</b>
            <p>看一下公式：這一步要走「{SCALE_MODES[level.mode].formula[pressed - 1] || '主音'}」。按錯不會失敗，可以打開提示。</p>
          </div>
        </div>
      )}

      {done && (
        <div className="ss-verdict is-correct" data-testid="scale-build-done" role="status">
          <span>🎻</span>
          <div>
            <b>{level.name} 完成！</b>
            <p>{scale.map((note) => note.name).join(' ')}</p>
            <em>按錯 {mistakes} 次・得 {score} 分</em>
          </div>
          <button onClick={() => playSequence(scale.map((note) => note.midi))}>🔊 再聽一次</button>
          <button className="ss-primary" onClick={() => onClear(score)}>完成這一關 →</button>
        </div>
      )}
    </div>
  );
}

/* ---------------- 聽辨關 ---------------- */

function buildEarQuestions(seed) {
  const tonics = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const octaves = { G: 3, A: 3, B: 3, C: 4, D: 4, E: 4, F: 4 };
  const pool = tonics.flatMap((letter) => [
    { letter, mode: 'major' },
    { letter, mode: 'natural' },
  ]);
  return seededShuffle(pool, seed)
    .slice(0, EAR_QUESTIONS)
    .map((item) => ({ ...item, notes: spellScale(item.letter, octaves[item.letter], item.mode) }));
}

function Ear({ level, onClear, onHome }) {
  const [seed] = useState(() => Math.floor(Math.random() * 9999));
  const questions = useMemo(() => buildEarQuestions(seed), [seed]);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [correct, setCorrect] = useState(0);

  const question = questions[index];
  const isMajor = question.mode === 'major';

  useEffect(() => {
    const timer = window.setTimeout(() => playSequence(question.notes.map((note) => note.midi), { gap: 0.34, duration: 0.4 }), 320);
    return () => {
      window.clearTimeout(timer);
      stopAll();
    };
  }, [question]);

  const answer = (choice) => {
    const right = (choice === 'major') === isMajor;
    setAnswered({ choice, right });
    if (right) setCorrect((value) => value + 1);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      onClear(Math.max(40, correct * 30));
      return;
    }
    setIndex((value) => value + 1);
    setAnswered(null);
  };

  return (
    <div className="scale-school ss-play" data-testid="scale-school-ear">
      <header className="ss-play-head">
        <button onClick={onHome}>← 音階地圖</button>
        <div><small>{level.en}</small><b>{level.name}</b></div>
        <span>{index + 1} / {questions.length}</span>
      </header>

      <div className="ss-ear-body">
        <p className="ss-lesson-text">{level.note}</p>
        <button className="ss-listen-big" onClick={() => playSequence(question.notes.map((note) => note.midi), { gap: 0.34, duration: 0.4 })}>
          <span>🔊</span><b>再播一次</b><small>LISTEN AGAIN</small>
        </button>

        <div className="ss-ear-options">
          <button disabled={Boolean(answered)} onClick={() => answer('major')} data-choice="major">
            <span>☀️</span><b>大調</b><small>明亮、開朗</small>
          </button>
          <button disabled={Boolean(answered)} onClick={() => answer('minor')} data-choice="minor">
            <span>🌙</span><b>小調</b><small>柔和、有點憂傷</small>
          </button>
        </div>

        {answered && (
          <div className={`ss-verdict ${answered.right ? 'is-correct' : 'is-wrong'}`} role="status">
            <span>{answered.right ? '✅' : '🎧'}</span>
            <div>
              <b>{answered.right ? '答對了！' : '再聽聽看'}</b>
              <p>剛剛那個是 <b>{question.letter} {SCALE_MODES[question.mode].label}</b>：{question.notes.map((note) => note.name).join(' ')}</p>
            </div>
            <button className="ss-primary" onClick={next}>
              {index + 1 >= questions.length ? '看成績' : '下一題'} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- 主元件 ---------------- */

export default function ScaleSchool() {
  const [progress, setProgress] = useState(readProgress);
  const [screen, setScreen] = useState('map');
  const [levelIndex, setLevelIndex] = useState(0);

  const level = LEVELS[levelIndex];

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SAVE_VERSION, ...progress }));
    } catch {
      // 沒有 storage 也要能玩完這一輪。
    }
  }, [progress]);

  useEffect(() => stopAll, []);

  const openLevel = (index) => {
    setLevelIndex(index);
    setScreen(LEVELS[index].type);
  };

  const clearLevel = (score) => {
    setProgress((current) => ({
      cleared: [...new Set([...current.cleared, level.id])],
      best: { ...current.best, [level.id]: Math.max(current.best[level.id] || 0, score) },
    }));
    stopAll();
    const nextIndex = levelIndex + 1;
    if (nextIndex < LEVELS.length) {
      setLevelIndex(nextIndex);
      setScreen(LEVELS[nextIndex].type);
      return;
    }
    setScreen('map');
  };

  const home = () => {
    stopAll();
    setScreen('map');
  };

  if (screen === 'map') return <LevelMap progress={progress} onOpen={openLevel} />;
  if (screen === 'lesson') return <Lesson onDone={() => clearLevel(100)} onHome={home} />;
  if (screen === 'ear') return <Ear level={level} onClear={clearLevel} onHome={home} />;
  return <Build level={level} onClear={clearLevel} onHome={home} />;
}
