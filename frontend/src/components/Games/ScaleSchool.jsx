import { useEffect, useMemo, useState } from 'react';
import {
  LEVELS,
  SCALE_MODES,
  OPEN_STRINGS,
  TAPE_OFFSETS,
  TAPE_MARK,
  FINGERBOARD_SPAN,
  isBlackKey,
  noteNameOf,
  spellScale,
  scaleRun,
  descendingFormula,
  violinPosition,
  midiOf,
} from './musicTheory';
import { playNote, playSequence, stopAll } from './scaleAudio';
import './ScaleSchool.css';

// v2：拿掉和聲小調、加入旋律小音階，關卡 id 全變了，舊存檔的進度已無對應關卡。
const SAVE_VERSION = 2;
const STORAGE_KEY = `runku_scale_school_mei_v${SAVE_VERSION}`;
const EAR_QUESTIONS = 5;

function readProgress() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (saved?.version === SAVE_VERSION) {
      return {
        cleared: Array.isArray(saved.cleared) ? saved.cleared : [],
        best: saved.best && typeof saved.best === 'object' ? saved.best : {},
        openAll: saved.openAll === true,
      };
    }
  } catch {
    // 沒有存檔就從第一關開始，不要因為 storage 被擋就整個玩不了。
  }
  return { cleared: [], best: {}, openAll: false };
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

// 直的畫，和琴譜上的指板圖、還有把琴立起來看的樣子一致：
// 琴頭在上，弦由左到右是 G D A E，音越低的弦畫得越粗。
// 貼紙是一條橫線跨過四條弦——琴上本來就是一條膠帶貼過去的，不是每條弦各一塊。
// 縱向位置按半音數等距擺，所以貼紙②③本來就靠在一起這件事看得出來。
function Fingerboard({ midi }) {
  const position = midi == null ? null : violinPosition(midi);
  const percentOf = (offset) => (offset / FINGERBOARD_SPAN) * 100;
  // 每條弦佔一個等寬的直欄，圓點畫在欄的正中間。
  const laneOf = (stringIndex) => ((stringIndex + 0.5) / OPEN_STRINGS.length) * 100;

  return (
    <div className="ss-fingerboard" data-testid="scale-fingerboard">
      <header>
        <small>VIOLIN · 第一把位</small>
        <b>{position ? `${position.string} 弦 · ${position.finger}` : '在小提琴上的位置'}</b>
      </header>

      <div className="ss-board">
        <span className="ss-board-corner" aria-hidden="true" />

        {/* 弦名排在琴頭上方，正對著自己那一條弦 */}
        <div className="ss-heads">
          {OPEN_STRINGS.map((string, index) => (
            <span
              key={string.name}
              className={`ss-string-name${position?.stringIndex === index ? ' is-active' : ''}`}
            >{string.name}</span>
          ))}
        </div>

        {/* 貼紙的記號排在指板左邊，免得壓到弦上的圓點 */}
        <div className="ss-marks">
          {TAPE_OFFSETS.map((offset, tapeIndex) => (
            <i
              key={offset}
              className={`ss-mark${position?.tape === tapeIndex + 1 ? ' is-active' : ''}`}
              style={{ top: `${percentOf(offset)}%` }}
            >{TAPE_MARK[tapeIndex]}</i>
          ))}
        </div>

        <div className="ss-neck">
          {/* 按到的那條弦整欄打亮，一眼看得出是哪一條 */}
          {position && (
            <i
              className="ss-lane"
              style={{ left: `${laneOf(position.stringIndex)}%`, width: `${100 / OPEN_STRINGS.length}%` }}
            />
          )}

          {TAPE_OFFSETS.map((offset, tapeIndex) => (
            <i
              key={offset}
              className={`ss-tape${position?.tape === tapeIndex + 1 ? ' is-active' : ''}`}
              style={{ top: `${percentOf(offset)}%` }}
            />
          ))}

          {OPEN_STRINGS.map((string, index) => (
            <i
              key={string.name}
              className={`ss-strand${position?.stringIndex === index ? ' is-active' : ''}`}
              style={{ left: `${laneOf(index)}%`, width: `${OPEN_STRINGS.length - index + 1}px` }}
            />
          ))}

          {position && (
            <>
              {/* 低二指的時候把一指也畫出來，並且用一條連結把兩指框起來——
                  真實的琴上這兩指是貼著的，但半音在圖上有距離，不畫連結會看起來像分開的。 */}
              {position.touching && (
                <>
                  <i
                    className={`ss-touch-link${position.stringIndex === OPEN_STRINGS.length - 1 ? ' is-flipped' : ''}`}
                    style={{
                      left: `${laneOf(position.stringIndex)}%`,
                      top: `${percentOf(2)}%`,
                      height: `${percentOf(position.offset) - percentOf(2)}%`,
                    }}
                  />
                  <i
                    className="ss-finger is-ghost"
                    style={{ left: `${laneOf(position.stringIndex)}%`, top: `${percentOf(2)}%` }}
                  >1</i>
                </>
              )}
              {position.offset > 0 && (
                <i
                  className={`ss-finger${position.touching ? ' is-touching' : ''}${position.tape ? '' : ' is-off-tape'}`}
                  style={{
                    left: `${laneOf(position.stringIndex)}%`,
                    top: `${percentOf(position.offset)}%`,
                  }}
                >{position.short}</i>
              )}
              {position.offset === 0 && (
                <i className="ss-open-tag" style={{ left: `${laneOf(position.stringIndex)}%` }}>空弦</i>
              )}
            </>
          )}
        </div>
      </div>

      <p className="ss-fingerboard-hint" data-testid="scale-finger-hint">
        {position
          ? <>{position.touching && <b className="ss-touch-badge">🤝 靠著{position.touching}</b>}{position.hint}</>
          : '按下鍵盤上的音，這裡會告訴你按哪一條弦、哪一條貼紙（琴上一共五條）'}
      </p>
    </div>
  );
}

/* ---------------- 公式列 ---------------- */

function FormulaRow({ steps, activeIndex = -1 }) {
  return (
    <div className="ss-formula" aria-label="音階公式">
      {steps.map((step, index) => (
        <span
          key={index}
          className={index < activeIndex ? 'is-done' : index === activeIndex ? 'is-next' : ''}
        >{step}</span>
      ))}
    </div>
  );
}

/* ---------------- 關卡地圖 ---------------- */

function LevelMap({ progress, onOpen, onToggleOpenAll }) {
  const clearedCount = progress.cleared.length;
  return (
    <div className="scale-school ss-map" data-testid="scale-school-map">
      <header className="ss-map-head">
        <p className="ss-kicker">SCALE SCHOOL · 妹妹專屬</p>
        <h1>星獸音階教室<br /><em>大調與小調</em></h1>
        <p className="ss-lead">
          用鍵盤按出音階（上行再下行），下面同時告訴你這個音在小提琴的哪一條弦、按哪一條貼紙。
          全部 21 個音階都排在第一把位裡，🎻 標記的是你琴課上會拉到的。
        </p>
        <div className="ss-progress-row">
          <span><small>已完成</small><b>{clearedCount}/{LEVELS.length}</b></span>
          <span><small>大調</small><b>7</b></span>
          <span><small>小調</small><b>14</b></span>
          <span><small>🎻 琴課範圍</small><b>{LEVELS.filter((level) => level.violinCourse).length}</b></span>
        </div>
      </header>

      <ol className="ss-levels">
        {LEVELS.map((level, index) => {
          const cleared = progress.cleared.includes(level.id);
          const locked = !progress.openAll && index > 0 && !progress.cleared.includes(LEVELS[index - 1].id);
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
                  <b>{level.name}{level.violinCourse && <span className="ss-violin-badge" title="琴課會拉到">🎻</span>}</b>
                  <small>{level.en}</small>
                  <p>{level.note}</p>
                </div>
                {cleared && <em>{progress.best[level.id] || 0} 分</em>}
              </button>
            </li>
          );
        })}
      </ol>

      {/* 給大人用的：老師要跳到某個音階看指法時，不必先把前面的關卡玩完。
          只解鎖，不動 cleared 與 best，所以芊芊真正的紀錄不會被蓋掉，也隨時關得掉。 */}
      <button
        className={`ss-open-all${progress.openAll ? ' is-on' : ''}`}
        onClick={onToggleOpenAll}
        data-testid="scale-open-all"
      >
        {progress.openAll ? '🔒 全部關卡已打開・點我恢復順序' : '🔓 打開全部關卡'}
      </button>
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

function StepsLesson({ onDone, onHome }) {
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
              <div><b>大調</b><FormulaRow steps={SCALE_MODES.major.formula} /></div>
              <div><b>小調</b><FormulaRow steps={SCALE_MODES.natural.formula} /></div>
            </div>
            <button className="ss-primary" onClick={next}>我懂了，開始按音階 <span>➜</span></button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- 旋律小音階教學 ---------------- */

// 這一關是整個修改的重點：讓她親耳聽出「上去」和「下來」用的不是同一組音。
function MelodicLesson({ level, onDone, onHome }) {
  const [step, setStep] = useState(0);
  const natural = useMemo(() => scaleRun('A', 3, 'natural'), []);
  const melodic = useMemo(() => scaleRun('A', 3, 'melodic'), []);

  const pages = [
    {
      title: '先聽自然小調',
      body: 'A 自然小調上去和下來是同一組音：A B C D E F G A。聽起來柔柔的、有點憂傷。',
      play: () => playSequence(natural.notes.map((note) => note.midi), { gap: 0.34, duration: 0.32 }),
      label: '🔊 聽 A 自然小調（上行＋下行）',
      notes: natural,
    },
    {
      title: '旋律小音階：上行升第六、七音',
      body: '往上走的時候，第六音 F 升成 F♯、第七音 G 升成 G♯。上半段聽起來忽然亮了起來，很像大調。',
      play: () => playSequence(melodic.up.map((note) => note.midi), { gap: 0.36, duration: 0.34 }),
      label: '🔊 聽上行 A B C D E F♯ G♯ A',
      notes: null,
    },
    {
      title: '下行再還原回來',
      body: '往下走的時候，G♯ 和 F♯ 又變回 G 和 F——所以下行其實就是自然小調。這就是為什麼這一關要上行下行各按一次。',
      play: () => playSequence([melodic.up.at(-1), ...melodic.down].map((note) => note.midi), { gap: 0.36, duration: 0.34 }),
      label: '🔊 聽下行 A G F E D C B A',
      notes: null,
    },
  ];
  const page = pages[step];

  return (
    <div className="scale-school ss-play" data-testid="scale-school-melodic-lesson">
      <header className="ss-play-head">
        <button onClick={onHome}>← 音階地圖</button>
        <div><small>{level.en}</small><b>{page.title}</b></div>
        <span>{step + 1} / {pages.length}</span>
      </header>

      <div className="ss-lesson-body">
        <p className="ss-lesson-text">{page.body}</p>

        <div className="ss-compare">
          <div>
            <b>上行</b>
            <span className="ss-compare-notes">{melodic.up.map((note) => note.name).join(' ')}</span>
          </div>
          <div>
            <b>下行</b>
            <span className="ss-compare-notes">{[melodic.up.at(-1), ...melodic.down].map((note) => note.name).join(' ')}</span>
          </div>
        </div>

        <button className="ss-listen-big" onClick={page.play}>
          <span>🔊</span><b>{page.label.replace('🔊 ', '')}</b><small>LISTEN</small>
        </button>

        <button className="ss-primary" onClick={() => (step + 1 >= pages.length ? onDone() : setStep((value) => value + 1))}>
          {step + 1 >= pages.length ? '開始按旋律小音階' : '下一步'} <span>➜</span>
        </button>
      </div>
    </div>
  );
}

/* ---------------- 按音階關 ---------------- */

function Build({ level, onClear, onHome }) {
  const run = useMemo(() => scaleRun(level.letter, level.octave, level.mode), [level]);
  const scale = run.notes;
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
  // notes[0..7] 是上行，notes[8..14] 是下行。旋律小調在這裡真的會走到不同的音。
  const goingUp = pressed < run.up.length;
  const upSteps = SCALE_MODES[level.mode].formula;
  const downSteps = descendingFormula(level.mode);
  const steps = goingUp ? upSteps : downSteps;
  const stepIndex = goingUp ? pressed - 1 : pressed - run.up.length;
  const stepLabel = steps[stepIndex];
  const differentWayDown = SCALE_MODES[level.mode].descending != null;

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
        <span data-testid="scale-direction">{done ? '完成' : goingUp ? '⬆ 上行' : '⬇ 下行'} {pressed}/{scale.length}</span>
      </header>

      <div className="ss-play-body">
        <div className="ss-brief">
          <p>{level.note}</p>
          <div className="ss-brief-tools">
            <button onClick={() => playSequence(scale.map((note) => note.midi), { gap: 0.34, duration: 0.32 })}>🔊 先聽一次（上下行）</button>
            <button className={hintOn ? 'is-on' : ''} onClick={() => setHintOn((value) => !value)}>
              💡 提示{hintOn ? '（開）' : ''}
            </button>
          </div>
        </div>

        <div className="ss-target">
          <small>{SCALE_MODES[level.mode].label}・{goingUp ? '上行' : '下行'}的公式</small>
          <FormulaRow steps={steps} activeIndex={stepIndex} />
          <em>
            {differentWayDown
              ? goingUp ? '上行把第六、七音升高' : '下行把第六、七音還原回來——所以和上行不一樣'
              : SCALE_MODES[level.mode].mood}
          </em>
        </div>

        <p className="ss-task" data-testid="scale-next-note">
          {done
            ? '🎉 上行下行都按完了！'
            : pressed === 0
              ? '🎯 第 1 個音：從主音開始往上'
              : pressed === run.up.length
                ? <>🔄 到頂了，換<b>下行</b>：從最高音往下走 <b>{stepLabel}音</b></>
                : <>🎯 第 {pressed + 1} 個音：往{goingUp ? '上' : '下'}走 <b>{stepLabel}音</b></>}
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
          <b className="ss-strip-label">⬆</b>
          {run.up.map((note, index) => (
            <span key={`up-${index}`} className={index < pressed ? 'is-done' : ''}>{index < pressed ? note.name : '?'}</span>
          ))}
          <b className="ss-strip-label">⬇</b>
          {run.down.map((note, index) => {
            const at = run.up.length + index;
            return <span key={`down-${index}`} className={at < pressed ? 'is-done' : ''}>{at < pressed ? note.name : '?'}</span>;
          })}
        </div>

        <Fingerboard midi={done ? scale[scale.length - 1].midi : lastMidi} />
      </div>

      {wrongMidi != null && !done && (
        <div className="ss-verdict is-wrong" role="status">
          <span>🎧</span>
          <div>
            <b>這個音不在 {level.name} 裡</b>
            <p>看一下公式：這一步要往{goingUp ? '上' : '下'}走「{stepLabel || '主音'}」。按錯不會失敗，可以打開提示。</p>
          </div>
        </div>
      )}

      {done && (
        <div className="ss-verdict is-correct" data-testid="scale-build-done" role="status">
          <span>🎻</span>
          <div>
            <b>{level.name} 完成！</b>
            <p>⬆ {run.up.map((note) => note.name).join(' ')}</p>
            <p>⬇ {[run.up.at(-1), ...run.down].map((note) => note.name).join(' ')}</p>
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

  if (screen === 'map') {
    return (
      <LevelMap
        progress={progress}
        onOpen={openLevel}
        onToggleOpenAll={() => setProgress((current) => ({ ...current, openAll: !current.openAll }))}
      />
    );
  }
  if (screen === 'lesson') {
    return level.lesson === 'melodic'
      ? <MelodicLesson level={level} onDone={() => clearLevel(100)} onHome={home} />
      : <StepsLesson onDone={() => clearLevel(100)} onHome={home} />;
  }
  if (screen === 'ear') return <Ear level={level} onClear={clearLevel} onHome={home} />;
  return <Build level={level} onClear={clearLevel} onHome={home} />;
}
