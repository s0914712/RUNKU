import { useEffect, useMemo, useState } from 'react';
import { BEASTS, CreatureCard, speak } from './SisterCardQuest';
import { DETECTIVE_CONFIGS } from './storyDetectiveCases';
import './StoryDetectiveQuest.css';

const SAVE_VERSION = 1;
const CLUE_BASE_SCORE = 120;
const DEDUCTION_SCORE = [250, 120, 60];

function seededShuffle(items, seed) {
  const output = [...items];
  let value = seed + 61;
  for (let index = output.length - 1; index > 0; index -= 1) {
    value = (value * 9301 + 49297) % 233280;
    const target = Math.floor((value / 233280) * (index + 1));
    [output[index], output[target]] = [output[target], output[index]];
  }
  return output;
}

function spellingOf(word) {
  return (word?.english || word?.en || '').toLowerCase().replace(/[^a-z]/g, '');
}

function beastOf(id) {
  return BEASTS.find((beast) => beast.id === id);
}

function optionsFor(pool, target, seed) {
  const sameCat = pool.filter((word) => word.cat === target.cat && word.id !== target.id);
  const otherCat = pool.filter((word) => word.cat !== target.cat && word.id !== target.id);
  const picks = seededShuffle(sameCat, seed).slice(0, 3);
  if (picks.length < 3) picks.push(...seededShuffle(otherCat, seed + 7).slice(0, 3 - picks.length));
  return seededShuffle([target, ...picks], seed + 13);
}

// 劇本用英文字串指名線索單字，這裡換成該側單字庫裡真正的單字物件。
function buildCases(config, words) {
  const byEnglish = new Map(words.map((word) => [(word.english || word.en).toLowerCase(), word]));
  return config.cases
    .map((entry) => {
      const clues = entry.clues
        .map((clue) => ({ ...clue, item: byEnglish.get(clue.word.toLowerCase()) }))
        .filter((clue) => clue.item);
      return { ...entry, clues };
    })
    .filter((entry) => entry.clues.length === 5);
}

function readProgress(storageKey, partner) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey));
    if (saved?.version === SAVE_VERSION) {
      return {
        solved: Array.isArray(saved.solved) ? saved.solved : [],
        unlocked: [...new Set([partner, ...(Array.isArray(saved.unlocked) ? saved.unlocked : [])])]
          .filter((id) => BEASTS.some((beast) => beast.id === id)),
        best: saved.best && typeof saved.best === 'object' ? saved.best : {},
        cluesFound: Math.max(0, Number(saved.cluesFound) || 0),
      };
    }
  } catch {
    // A fresh casebook is friendlier than blocking the game when storage is unavailable.
  }
  return { solved: [], unlocked: [partner], best: {}, cluesFound: 0 };
}

function scoreClue(attempts, hinted) {
  return Math.max(50, CLUE_BASE_SCORE - attempts * 25 - (hinted ? 20 : 0));
}

function CaseFolder({ entry, index, locked, solved, best, onOpen }) {
  return (
    <button
      className={`sd-folder${locked ? ' is-locked' : ''}${solved ? ' is-solved' : ''}`}
      onClick={() => onOpen(index)}
      disabled={locked}
      data-case={entry.id}
    >
      <span className="sd-folder-tab">CASE {String(entry.no ?? index + 1).padStart(2, '0')}</span>
      <span className="sd-folder-icon">{locked ? '🔒' : entry.icon}</span>
      <b>{entry.title}</b>
      <small>{entry.en}</small>
      <em>{entry.place}</em>
      <span className="sd-folder-foot">
        {locked ? '破解前一件委託後開啟' : solved ? `已結案 · 最高 ${best || 0} 分` : '尚未偵辦 · 5 個線索'}
      </span>
      {solved && <span className="sd-folder-stamp">CLOSED<small>已結案</small></span>}
    </button>
  );
}

function Files({ config, cases, progress, partner, style, onOpen }) {
  const unlockedBeasts = BEASTS.filter((beast) => progress.unlocked.includes(beast.id));
  const nextIndex = cases.findIndex((entry) => !progress.solved.includes(entry.id));

  return (
    <div className="story-detective sd-files" style={style} data-testid="story-detective-files">
      <header className="sd-files-head">
        <div>
          <p className="sd-kicker">{config.eyebrow}</p>
          <h1>{config.title}<br /><em>{config.subtitle}</em></h1>
          <p className="sd-lead">{config.intro}</p>
          <div className="sd-progress-row">
            <span><small>已結案</small><b>{progress.solved.length}/{cases.length}</b></span>
            <span><small>找到線索</small><b>{progress.cluesFound}</b></span>
            <span><small>星獸夥伴</small><b>{unlockedBeasts.length}/{BEASTS.length}</b></span>
          </div>
        </div>
        <aside className="sd-partner">
          <p>YOUR PARTNER</p>
          <div className="sd-partner-card"><CreatureCard beast={partner} compact /></div>
          <div className="sd-partner-speech">
            <b>{partner.name} 偵探助手</b>
            <span>「先把五個線索都解開，答案自己就會浮出來。」</span>
          </div>
        </aside>
      </header>

      <section className="sd-folder-row" aria-label="案件檔案夾">
        {cases.map((entry, index) => (
          <CaseFolder
            key={entry.id}
            entry={entry}
            index={index}
            locked={index > 0 && !progress.solved.includes(cases[index - 1].id)}
            solved={progress.solved.includes(entry.id)}
            best={progress.best[entry.id]}
            onOpen={onOpen}
          />
        ))}
      </section>

      <footer className="sd-files-foot">
        {nextIndex >= 0
          ? <button className="sd-primary" onClick={() => onOpen(nextIndex)}>接下 CASE {String(nextIndex + 1).padStart(2, '0')}・{cases[nextIndex].title} <span>➜</span></button>
          : <button className="sd-primary" onClick={() => onOpen(0)}>全部結案了！重看第一件委託 <span>➜</span></button>}
        <p>每一件委託都答對才會解鎖下一件・答錯不會扣命，可以慢慢想</p>
      </footer>
    </div>
  );
}

function Notebook({ entry, found }) {
  return (
    <aside className="sd-notebook" aria-label="偵探筆記本">
      <header><small>DETECTIVE NOTEBOOK</small><b>偵探筆記本</b></header>
      <ol>
        {entry.clues.map((clue, index) => (
          <li key={clue.word} className={found[index] ? 'is-found' : ''}>
            <span>{found[index] ? clue.item.emoji || '✦' : String(index + 1)}</span>
            {found[index]
              ? <div><b>{clue.item.english} · {clue.item.chinese}</b><p>{clue.finding}</p></div>
              : <div><b>線索 {index + 1}</b><p>還沒調查：{clue.spot}</p></div>}
          </li>
        ))}
      </ol>
    </aside>
  );
}

function LetterSlots({ spelling, tiles, selectedIds, onRemove }) {
  return (
    <div className="sd-slots" aria-label="英文拼字填空區">
      {[...spelling].map((letter, index) => {
        const tile = tiles.find((item) => item.id === selectedIds[index]);
        return (
          <button
            key={`${letter}-${index}`}
            className={tile ? 'is-filled' : ''}
            disabled={!tile}
            onClick={() => onRemove(index)}
            aria-label={tile ? `移除第 ${index + 1} 格字母 ${tile.letter}` : `第 ${index + 1} 格尚未填入`}
          >
            <span>{tile?.letter || ''}</span><small>{index + 1}</small>
          </button>
        );
      })}
    </div>
  );
}

const KIND_LABEL = {
  'choose-en': { tag: 'TRANSLATE', zh: '選出正確的英文' },
  'choose-zh': { tag: 'MEANING', zh: '選出正確的中文' },
  listen: { tag: 'LISTEN', zh: '聽發音，選出正確的英文' },
  spell: { tag: 'SPELL', zh: '點字母，拼出這個單字' },
  cloze: { tag: 'FILL IN', zh: '把單字填進句子的空格' },
};

function CluePuzzle({ clue, index, pool, seed, attempts, hinted, feedback, selectedIds, ruledOut, onPick, onSelect, onRemove, onUndo, onHint, onCheck, onBack, onKeep }) {
  const word = clue.item;
  const spelling = spellingOf(word);
  const isSpell = clue.kind === 'spell';
  const showsZh = clue.kind === 'choose-zh';
  const tiles = useMemo(
    () => seededShuffle([...spelling].map((letter, position) => ({ id: `${word.id}-${position}`, letter })), seed),
    [spelling, word.id, seed],
  );
  const options = useMemo(() => (isSpell ? [] : optionsFor(pool, word, seed)), [isSpell, pool, word, seed]);
  const answer = selectedIds.map((id) => tiles.find((tile) => tile.id === id)?.letter || '').join('');

  useEffect(() => {
    if (clue.kind === 'listen') speak(word.english);
  }, [clue.kind, word.english]);

  return (
    <section className={`sd-puzzle${feedback === 'wrong' ? ' is-wrong' : ''}`} data-testid="story-detective-puzzle" data-word={word.english} data-kind={clue.kind}>
      <header className="sd-puzzle-head">
        <button onClick={onBack}>← 回到現場</button>
        <div><small>CLUE {String(index + 1).padStart(2, '0')} · {KIND_LABEL[clue.kind].tag}</small><b>{clue.spot}</b></div>
        <span>{KIND_LABEL[clue.kind].zh}</span>
      </header>

      <div className="sd-prompt">
        {clue.kind === 'listen' ? (
          <button className="sd-listen sd-listen-big" onClick={() => speak(word.english)}>
            <span>🔊</span><b>再聽一次</b><small>LISTEN AGAIN</small>
          </button>
        ) : clue.kind === 'cloze' ? (
          <div className="sd-sentence">
            <small>把正確的英文單字填進空格</small>
            <p>{clue.sentence}</p>
            <button className="sd-listen" onClick={() => speak(clue.sentence.replace('____', word.english))}><span>🔊</span>聽整句</button>
          </div>
        ) : showsZh ? (
          <div className="sd-word-plate">
            <b>{word.english}</b>
            <button className="sd-listen" onClick={() => speak(word.english)}><span>🔊</span>聽發音</button>
          </div>
        ) : (
          <div className="sd-word-plate">
            <span className="sd-prompt-emoji">{word.emoji || '✦'}</span>
            <b>{word.chinese}</b>
            {word.no ? <em>單字表 #{word.no}</em> : null}
          </div>
        )}
        {word.usage_tips && feedback === 'correct' ? <p className="sd-usage">📌 {word.usage_tips}</p> : null}
      </div>

      {isSpell ? (
        <div className="sd-spell">
          <button className="sd-listen" onClick={() => speak(word.english)}><span>🔊</span>聽 {word.chinese}</button>
          <LetterSlots spelling={spelling} tiles={tiles} selectedIds={selectedIds} onRemove={onRemove} />
          <div className="sd-letter-bank" aria-label="可選擇的字母">
            {tiles.map((tile) => (
              <button
                key={tile.id}
                className={selectedIds.includes(tile.id) ? 'is-used' : ''}
                disabled={selectedIds.includes(tile.id) || Boolean(feedback)}
                onClick={() => onSelect(tile.id)}
                aria-label={`${tile.letter.toUpperCase()} 字母`}
              >{tile.letter}</button>
            ))}
          </div>
          <div className="sd-spell-tools">
            <button onClick={onUndo} disabled={!selectedIds.length || Boolean(feedback)}>↶ 上一步</button>
            <button className="sd-hint" onClick={() => onHint(tiles)} disabled={selectedIds.length === spelling.length || Boolean(feedback)}>💡 提示一格</button>
            <button className="sd-check" onClick={() => onCheck(answer === spelling)} disabled={selectedIds.length !== spelling.length || Boolean(feedback)}>採集這個線索</button>
          </div>
        </div>
      ) : (
        <div className="sd-options" aria-label="答案選項">
          {options.map((option) => {
            const isTarget = option.id === word.id;
            return (
              <button
                key={option.id}
                className={ruledOut.includes(option.id) ? 'is-ruled-out' : ''}
                disabled={Boolean(feedback) || ruledOut.includes(option.id)}
                onClick={() => onPick(isTarget, option.id)}
              >
                {showsZh ? <><span>{option.emoji || '✦'}</span><b>{option.chinese}</b></> : <b>{option.english}</b>}
              </button>
            );
          })}
          <button className="sd-hint sd-hint-wide" onClick={() => onHint(options)} disabled={Boolean(feedback) || ruledOut.length >= 2}>💡 刪掉一個錯的</button>
        </div>
      )}

      {feedback === 'wrong' && (
        <div className="sd-verdict sd-verdict-wrong" role="status">
          <span>🔍</span>
          <div><small>NOT THIS ONE</small><b>這個線索還沒對上</b><p>再看一次題目，慢慢想。答錯不會失敗，只會少一點分數。</p><em>已嘗試 {attempts} 次</em></div>
        </div>
      )}

      {feedback === 'correct' && (
        <div className="sd-verdict sd-verdict-correct" role="status">
          <span>🗒️</span>
          <div>
            <small>CLUE FOUND</small>
            <b>{word.english.toUpperCase()}・{word.chinese}</b>
            <p>{clue.finding}</p>
            <em>+{scoreClue(attempts, hinted)} 分・已記進偵探筆記本</em>
          </div>
          <button onClick={onKeep}>記下線索 →</button>
        </div>
      )}
    </section>
  );
}

function Scene({ entry, found, score, onOpenClue, onDeduce, onFiles }) {
  const foundCount = Object.keys(found).length;
  const ready = foundCount === entry.clues.length;

  return (
    <>
      <header className="sd-case-head">
        <button onClick={onFiles}>← 檔案室</button>
        <div><small>CASE {String(entry.no ?? 1).padStart(2, '0')} · {entry.en}</small><b>{entry.title}</b></div>
        <span>線索 {foundCount} / {entry.clues.length}</span>
      </header>

      <div className="sd-meter"><i><span style={{ width: `${(foundCount / entry.clues.length) * 100}%` }} /></i><b>現場蒐證進度</b><em>{score} 分</em></div>

      <section className="sd-brief">
        <span className="sd-brief-icon">{entry.icon}</span>
        <div><small>{entry.place}・{entry.client}</small><p>{entry.brief}</p></div>
      </section>

      <section className="sd-spots" aria-label="現場的五個線索">
        {entry.clues.map((clue, index) => (
          <button
            key={clue.word}
            className={found[index] ? 'is-found' : ''}
            onClick={() => onOpenClue(index)}
            data-clue={clue.word}
          >
            <small>線索 {String(index + 1).padStart(2, '0')}</small>
            <span>{found[index] ? clue.item.emoji || '✦' : '❓'}</span>
            <b>{clue.spot}</b>
            <em>{found[index] ? `${clue.item.english} ✓` : '點我調查'}</em>
          </button>
        ))}
      </section>

      <footer className="sd-case-foot">
        <button className="sd-primary" onClick={onDeduce} disabled={!ready} data-testid="story-detective-deduce">
          {ready ? '五個線索到齊了，開始指認 ➜' : `還差 ${entry.clues.length - foundCount} 個線索`}
        </button>
      </footer>
    </>
  );
}

function Deduction({ entry, found, suspects, ruledOutBeasts, onAccuse, onScene }) {
  return (
    <section className="sd-deduction" data-testid="story-detective-deduction">
      <header className="sd-case-head">
        <button onClick={onScene}>← 再看一次現場</button>
        <div><small>FINAL DEDUCTION · {entry.en}</small><b>{entry.question}</b></div>
        <span>線索 {entry.clues.length} / {entry.clues.length}</span>
      </header>

      <div className="sd-deduction-body">
        <Notebook entry={entry} found={found} />
        <div className="sd-suspects" aria-label="三位嫌疑星獸">
          <p className="sd-suspects-hint">把筆記本的五條線索對照每一位的特徵，只有一位完全符合。</p>
          {suspects.map((suspect) => {
            const beast = beastOf(suspect.beast);
            const out = ruledOutBeasts.includes(suspect.beast);
            return (
              <button
                key={suspect.beast}
                className={`sd-suspect${out ? ' is-ruled-out' : ''}`}
                onClick={() => onAccuse(suspect.beast)}
                disabled={out}
                data-suspect={suspect.beast}
              >
                <div className="sd-suspect-card"><CreatureCard beast={beast} compact /></div>
                <div>
                  <b>{beast.name} · {beast.en}</b>
                  <p>{suspect.profile}</p>
                  <em>{out ? '✗ 已排除：這位有不在場證明' : '指認這一位'}</em>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Report({ entry, culprit, score, best, solvedCount, totalCases, unlockedCount, isNewBeast, hasNext, style, onNext, onFiles, onReplay }) {
  return (
    <div className="story-detective sd-report" style={style} data-testid="story-detective-report">
      <p className="sd-kicker">CASE CLOSED · {entry.en}</p>
      <h1>{entry.title}<br /><em>結案！</em></h1>
      <div className="sd-report-card"><CreatureCard beast={culprit} compact newlyUnlocked={isNewBeast} /></div>
      <div className="sd-verdict-box">
        <small>真相</small>
        <p>{entry.verdict}</p>
        {isNewBeast && <strong>✦ {culprit.name}（{culprit.en}）加入了偵探社，成為你的星獸夥伴！</strong>}
      </div>
      <div className="sd-report-grid">
        <span><small>本案得分</small><b>{score}</b></span>
        <span><small>本案最高</small><b>{best}</b></span>
        <span><small>已結案</small><b>{solvedCount}/{totalCases}</b></span>
        <span><small>星獸夥伴</small><b>{unlockedCount}/{BEASTS.length}</b></span>
      </div>
      <div className="sd-report-actions">
        {hasNext
          ? <button className="sd-primary" onClick={onNext}>接下一件委託 <span>➜</span></button>
          : <button className="sd-primary" onClick={onFiles}>四件委託全破！回檔案室 <span>➜</span></button>}
        <button onClick={onReplay}>重辦這一件</button>
        <button onClick={onFiles}>回檔案室</button>
      </div>
    </div>
  );
}

export default function StoryDetectiveQuest({ variant, words }) {
  const config = DETECTIVE_CONFIGS[variant];
  const cases = useMemo(() => buildCases(config, words), [config, words]);
  const storageKey = `runku_story_detective_${config.profileKey}_v${SAVE_VERSION}`;
  const [progress, setProgress] = useState(() => readProgress(storageKey, config.partner));

  const [screen, setScreen] = useState('files');
  const [caseIndex, setCaseIndex] = useState(0);
  const [found, setFound] = useState({});
  const [openClue, setOpenClue] = useState(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hinted, setHinted] = useState(false);
  const [ruledOut, setRuledOut] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [accuseCount, setAccuseCount] = useState(0);
  const [ruledOutBeasts, setRuledOutBeasts] = useState([]);
  const [report, setReport] = useState(null);

  const entry = cases[caseIndex];
  const partner = beastOf(config.partner);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ version: SAVE_VERSION, ...progress }));
    } catch {
      // The current visit stays playable even when persistent storage is blocked.
    }
  }, [storageKey, progress]);

  const resetPuzzle = () => {
    setAttempts(0);
    setHinted(false);
    setRuledOut([]);
    setSelectedIds([]);
    setFeedback(null);
  };

  const openCase = (index) => {
    setCaseIndex(index);
    setFound({});
    setOpenClue(null);
    setScore(0);
    setAccuseCount(0);
    setRuledOutBeasts([]);
    setReport(null);
    resetPuzzle();
    setScreen('scene');
  };

  const openClueAt = (index) => {
    if (found[index]) return;
    resetPuzzle();
    setOpenClue(index);
  };

  const answerClue = (correct, optionId) => {
    if (correct) {
      setFeedback('correct');
      speak(entry.clues[openClue].item.english);
      return;
    }
    setFeedback('wrong');
    setAttempts((current) => current + 1);
    if (optionId) setRuledOut((current) => [...new Set([...current, optionId])]);
    // 拼字題把字母收回來，讓小朋友從第一格重新排，而不是重送一樣的答案。
    if (entry.clues[openClue].kind === 'spell') setSelectedIds([]);
    window.setTimeout(() => setFeedback(null), 1100);
  };

  const hintClue = (candidates) => {
    const clue = entry.clues[openClue];
    if (clue.kind === 'spell') {
      const spelling = spellingOf(clue.item);
      const letters = selectedIds.map((id) => candidates.find((tile) => tile.id === id)?.letter || '');
      let prefix = 0;
      while (prefix < letters.length && letters[prefix] === spelling[prefix]) prefix += 1;
      const keep = selectedIds.slice(0, prefix);
      const next = candidates.find((tile) => tile.letter === spelling[prefix] && !keep.includes(tile.id));
      if (!next) return;
      setSelectedIds([...keep, next.id]);
      speak(spelling[prefix]);
    } else {
      const wrong = candidates.find((option) => option.id !== clue.item.id && !ruledOut.includes(option.id));
      if (!wrong) return;
      setRuledOut((current) => [...current, wrong.id]);
    }
    setHinted(true);
  };

  const keepClue = () => {
    const gained = scoreClue(attempts, hinted);
    setFound((current) => ({ ...current, [openClue]: true }));
    setScore((current) => current + gained);
    setProgress((current) => ({ ...current, cluesFound: current.cluesFound + 1 }));
    setOpenClue(null);
    resetPuzzle();
  };

  const accuse = (beastId) => {
    if (beastId !== entry.culprit) {
      setAccuseCount((current) => current + 1);
      setRuledOutBeasts((current) => [...current, beastId]);
      return;
    }
    const gained = DEDUCTION_SCORE[Math.min(accuseCount, DEDUCTION_SCORE.length - 1)];
    const finalScore = score + gained;
    const isNewBeast = !progress.unlocked.includes(entry.culprit);
    setScore(finalScore);
    setProgress((current) => ({
      ...current,
      solved: [...new Set([...current.solved, entry.id])],
      unlocked: [...new Set([...current.unlocked, entry.culprit])],
      best: { ...current.best, [entry.id]: Math.max(current.best[entry.id] || 0, finalScore) },
    }));
    setReport({ score: finalScore, isNewBeast });
    setScreen('report');
  };

  if (!cases.length) return <div className="story-detective sd-empty">找不到這一份單字庫對應的案件劇本。</div>;

  const style = { '--sd-ink': config.ink, '--sd-paper': config.paper, '--sd-accent': config.accent, '--sd-tint': config.tint };

  if (screen === 'files') {
    return <Files config={config} cases={cases} progress={progress} partner={partner} style={style} onOpen={openCase} />;
  }

  if (screen === 'report') {
    return (
      <Report
        entry={entry}
        culprit={beastOf(entry.culprit)}
        score={report.score}
        best={progress.best[entry.id] || report.score}
        solvedCount={progress.solved.length}
        totalCases={cases.length}
        unlockedCount={progress.unlocked.length}
        isNewBeast={report.isNewBeast}
        hasNext={caseIndex + 1 < cases.length}
        style={style}
        onNext={() => openCase(caseIndex + 1)}
        onReplay={() => openCase(caseIndex)}
        onFiles={() => setScreen('files')}
      />
    );
  }

  const suspects = seededShuffle(entry.suspects, entry.id.length * 31 + caseIndex);

  return (
    <div className="story-detective sd-case" style={style} data-testid="story-detective-scene" data-case={entry.id}>
      {screen === 'deduction' ? (
        <Deduction
          entry={entry}
          found={found}
          suspects={suspects}
          ruledOutBeasts={ruledOutBeasts}
          onAccuse={accuse}
          onScene={() => setScreen('scene')}
        />
      ) : openClue !== null ? (
        <div className="sd-investigation">
          <Notebook entry={entry} found={found} />
          <CluePuzzle
            clue={entry.clues[openClue]}
            index={openClue}
            pool={words}
            seed={entry.clues[openClue].item.id * 7 + openClue}
            attempts={attempts}
            hinted={hinted}
            feedback={feedback}
            selectedIds={selectedIds}
            ruledOut={ruledOut}
            onPick={answerClue}
            onSelect={(id) => setSelectedIds((current) => (
              current.length < spellingOf(entry.clues[openClue].item).length ? [...current, id] : current
            ))}
            onRemove={(index) => setSelectedIds((current) => current.slice(0, index))}
            onUndo={() => setSelectedIds((current) => current.slice(0, -1))}
            onHint={hintClue}
            onCheck={answerClue}
            onKeep={keepClue}
            onBack={() => { setOpenClue(null); resetPuzzle(); }}
          />
        </div>
      ) : (
        <Scene
          entry={entry}
          found={found}
          score={score}
          onOpenClue={openClueAt}
          onDeduce={() => setScreen('deduction')}
          onFiles={() => setScreen('files')}
        />
      )}
    </div>
  );
}
