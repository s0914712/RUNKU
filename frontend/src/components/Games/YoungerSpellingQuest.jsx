import { useEffect, useMemo, useState } from 'react';
import { BEASTS, CreatureCard, speak } from './SisterCardQuest';
import './YoungerSpellingQuest.css';

const STORAGE_KEY = 'runku_younger_spelling_quest_v1';
const QUEST_LENGTH = 10;
const STARTER_COUNT = 4;

function seededShuffle(items, seed) {
  const output = [...items];
  let value = seed + 97;
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

function readProgress() {
  const starters = BEASTS.slice(0, STARTER_COUNT).map((beast) => beast.id);
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.mastered)) {
      const validUnlocked = Array.isArray(saved.unlocked)
        ? saved.unlocked.filter((id) => BEASTS.some((beast) => beast.id === id))
        : [];
      return {
        mastered: saved.mastered,
        unlocked: [...new Set([...starters, ...validUnlocked])],
        adventures: Math.max(0, Number(saved.adventures) || 0),
        bestScore: Math.max(0, Number(saved.bestScore) || 0),
        totalCorrect: Math.max(0, Number(saved.totalCorrect) || 0),
      };
    }
  } catch {
    // Keep a fresh in-memory storybook when browser storage is unavailable.
  }
  return { mastered: [], unlocked: starters, adventures: 0, bestScore: 0, totalCorrect: 0 };
}

const BASIC_SENTENCES = {
  what: '____ is this?',
  this: '____ is my magic key.',
  that: 'Look at ____ bright star.',
  these: '____ are my spell cards.',
  those: '____ are stars in the sky.',
  flower: 'I found a ____.',
};

function storyFor(word) {
  const english = (word.english || word.en).toLowerCase();
  const chinese = word.chinese || word.zh;
  const emoji = word.emoji || '✦';
  const variants = Math.abs(Number(word.id) || english.length) % 3;

  if (word.cat === 'animals') {
    const scenes = [
      `彩虹森林傳來一陣腳步聲，${emoji}「${chinese}」在樹後迷路了。`,
      `星光橋被霧遮住，只有叫出 ${emoji}「${chinese}」的英文名字，牠才敢向前走。`,
      `森林郵差帶來一封沒有署名的信，收信人正是 ${emoji}「${chinese}」。`,
    ];
    return { chapter: '百獸朋友森林', story: scenes[variants], sentence: `The ____ is waiting by the rainbow gate.`, mission: `把「${chinese}」的英文拼進故事裡。` };
  }

  if (word.cat === 'things') {
    const scenes = [
      `玩具工坊少了一件重要道具：${emoji}「${chinese}」。沒有它，今天的冒險就不能出發。`,
      `魔法背包發出金光，提醒妹妹要帶上 ${emoji}「${chinese}」。`,
      `小精靈在藏寶圖上畫了 ${emoji}「${chinese}」，卻忘記寫英文標籤。`,
    ];
    return { chapter: '閃亮玩具工坊', story: scenes[variants], sentence: `I packed my ____ for the adventure.`, mission: `幫道具貼上「${chinese}」的英文標籤。` };
  }

  if (word.cat === 'people') {
    return { chapter: '陽光職業村', story: `村民們正在準備慶典，大家都在等 ${emoji}「${chinese}」來幫忙。`, sentence: `The ____ will help our team.`, mission: `拼出「${chinese}」，讓新朋友找到村莊。` };
  }

  if (word.cat === 'vehicles') {
    return { chapter: '玩具音樂港', story: `彩虹遊行就要開始了，隊伍還缺少 ${emoji}「${chinese}」的聲音與力量。`, sentence: `The parade needs a ____ today.`, mission: `拼出「${chinese}」，啟動音樂港。` };
  }

  if (word.cat === 'numbers') {
    return { chapter: '閃亮數字草原', story: `草原上的第 ${emoji} 顆星星睡著了。數字精靈說，密碼就是「${chinese}」的英文。`, sentence: `The magic number is ____!`, mission: `填入數字「${chinese}」的英文密碼。` };
  }

  if (word.cat === 'body') {
    return { chapter: '身體魔法城', story: `小守護獸想學會動作咒語，它指著 ${emoji}「${chinese}」，等待妹妹教它英文。`, sentence: `Touch your ____ to cast the spell.`, mission: `把身體部位「${chinese}」拼完整。` };
  }

  return {
    chapter: '曙光魔法村',
    story: `魔法故事書翻到新的一頁，${emoji}「${chinese}」被一陣風擦掉了英文拼字。`,
    sentence: BASIC_SENTENCES[english] || `The magic word is ____!`,
    mission: `聽一聽，再把「${chinese}」填回故事。`,
  };
}

function createTiles(word, seed) {
  return seededShuffle(
    [...spellingOf(word)].map((letter, index) => ({ id: `${word.id}-${seed}-${index}`, letter })),
    seed,
  );
}

function ProgressPill({ icon, value, label }) {
  return <span className="ysq-progress-pill"><i>{icon}</i><b>{value}</b><small>{label}</small></span>;
}

function Intro({ words, mastered, available, adventures, bestScore, onStart }) {
  return (
    <div className="spell-quest ysq-intro" data-testid="younger-spelling-intro">
      <section className="ysq-intro-copy">
        <p className="ysq-kicker">妹妹專屬 · STORY SPELLING QUEST</p>
        <h1>星獸拼字<br /><em>故事學院</em></h1>
        <p className="ysq-lead">跟著故事聽單字、找字母、填入英文空格。每學會 2 個新單字，就會有新星獸加入故事書！</p>
        <div className="ysq-steps" aria-label="三個拼字步驟">
          <span><b>1</b><i>🔊</i><strong>聽發音</strong></span>
          <span><b>2</b><i>📖</i><strong>讀故事</strong></span>
          <span><b>3</b><i>🔤</i><strong>填字母</strong></span>
        </div>
        <div className="ysq-intro-progress">
          <ProgressPill icon="✦" value={`${available.length}/30`} label="星獸圖鑑" />
          <ProgressPill icon="📚" value={`${mastered.length}/${words.length}`} label="學會單字" />
          <ProgressPill icon="🏅" value={bestScore} label="最高分數" />
        </div>
        <button className="ysq-primary" onClick={onStart}>打開拼字故事書 <span>➜</span></button>
        <p className="ysq-reassure">不扣生命、可以慢慢想，也可以使用「提示一格」。</p>
      </section>
      <section className="ysq-card-stage" aria-label="目前已收集的四張星獸卡">
        <div className="ysq-moon"><span>ABC</span><small>SPELLING MAGIC</small></div>
        {available.slice(-4).map((beast, index) => (
          <div className={`ysq-story-card ysq-story-card-${index + 1}`} key={beast.id}><CreatureCard beast={beast} compact /></div>
        ))}
        <div className="ysq-bookmark"><b>第 {adventures + 1} 次遠征</b><span>下一章正在等你</span></div>
      </section>
    </div>
  );
}

function LetterSlots({ spelling, tiles, selectedIds, onRemove }) {
  return (
    <div className="ysq-letter-slots" aria-label="英文拼字填空區">
      {[...spelling].map((letter, index) => {
        const tile = tiles.find((item) => item.id === selectedIds[index]);
        return (
          <button
            className={tile ? 'is-filled' : ''}
            disabled={!tile}
            onClick={() => onRemove(index)}
            aria-label={tile ? `移除第 ${index + 1} 格字母 ${tile.letter}` : `第 ${index + 1} 格尚未填入`}
            key={`${letter}-${index}`}
          >
            <span>{tile?.letter || ''}</span><small>{index + 1}</small>
          </button>
        );
      })}
    </div>
  );
}

function Adventure({ route, round, available, score, streak, hints, attempts, selectedIds, feedback, newCardId, onSelect, onRemove, onUndo, onClear, onHint, onCheck, onListen, onContinue, onRetry, onHome }) {
  const word = route[round];
  const spelling = spellingOf(word);
  const tiles = useMemo(() => createTiles(word, round + Number(word.id) * 17), [word, round]);
  const story = storyFor(word);
  const activeBeast = available[(round + available.length - 1) % available.length];
  const newBeast = BEASTS.find((beast) => beast.id === newCardId);
  const answer = selectedIds.map((id) => tiles.find((tile) => tile.id === id)?.letter || '').join('');

  return (
    <div className={`spell-quest ysq-adventure${feedback === 'correct' ? ' is-success' : feedback === 'wrong' ? ' is-try-again' : ''}`} data-testid="younger-spelling-game" data-word={word.english}>
      <header className="ysq-header">
        <button onClick={onHome}>← 故事書封面</button>
        <div><small>CHAPTER {String(round + 1).padStart(2, '0')}</small><b>{story.chapter}</b></div>
        <span>{round + 1} / {QUEST_LENGTH}</span>
      </header>

      <div className="ysq-quest-meter"><i><span style={{ width: `${(round + 1) / QUEST_LENGTH * 100}%` }} /></i><b>本次拼字遠征</b></div>

      <main className="ysq-worktable">
        <aside className="ysq-companion">
          <p>YOUR STORY PARTNER</p>
          <div className="ysq-companion-card"><CreatureCard beast={activeBeast} compact /></div>
          <div className="ysq-companion-speech"><b>{activeBeast.name}</b><span>「慢慢聽，我陪你把字母排好！」</span></div>
          <div className="ysq-scoreboard"><span><small>星光分數</small><b>{score}</b></span><span><small>連續答對</small><b>×{streak}</b></span></div>
        </aside>

        <section className="ysq-story-page">
          <div className="ysq-story-heading"><span>{word.emoji || '✦'}</span><div><small>WORD STORY · {word.cat?.toUpperCase()}</small><h2>{story.story}</h2></div></div>
          <div className="ysq-sentence"><small>故事裡的英文</small><p>{story.sentence}</p><strong>{story.mission}</strong></div>

          <div className="ysq-guide-row">
            <div><b>① 按喇叭聽英文</b><span>② 找字母　③ 依序填入格子</span></div>
            <button className="ysq-listen" onClick={() => onListen(word.english)}><span>🔊</span><b>聽 {word.chinese}</b><small>LISTEN</small></button>
          </div>

          <LetterSlots spelling={spelling} tiles={tiles} selectedIds={selectedIds} onRemove={onRemove} />

          <div className="ysq-letter-bank" aria-label="可選擇的字母">
            {tiles.map((tile) => (
              <button
                className={selectedIds.includes(tile.id) ? 'is-used' : ''}
                disabled={selectedIds.includes(tile.id) || Boolean(feedback)}
                onClick={() => onSelect(tile.id)}
                aria-label={`${tile.letter.toUpperCase()} 字母`}
                key={tile.id}
              >{tile.letter}</button>
            ))}
          </div>

          <div className="ysq-tools">
            <button onClick={onUndo} disabled={!selectedIds.length || Boolean(feedback)}>↶ 上一步</button>
            <button onClick={onClear} disabled={!selectedIds.length || Boolean(feedback)}>⌫ 清空</button>
            <button className="ysq-hint" onClick={() => onHint(tiles)} disabled={selectedIds.length === spelling.length || Boolean(feedback)}>💡 提示一格 <small>已用 {hints}</small></button>
            <button className="ysq-check" onClick={() => onCheck(answer)} disabled={selectedIds.length !== spelling.length || Boolean(feedback)}>完成拼字 SPELL!</button>
          </div>
        </section>
      </main>

      {feedback === 'wrong' && (
        <div className="ysq-feedback ysq-feedback-wrong" role="status">
          <span>🌱</span><div><small>STORY MAGIC IS STILL GROWING</small><h2>有幾個字母走錯房間了</h2><p>再聽一次發音，從第一格慢慢排。答錯不會扣分！</p><em>這次已嘗試 {attempts} 次</em></div>
          <button onClick={onRetry}>再試一次</button>
        </div>
      )}

      {feedback === 'correct' && (
        <div className="ysq-feedback ysq-feedback-correct" role="status">
          {newBeast ? <div className="ysq-new-beast"><CreatureCard beast={newBeast} compact newlyUnlocked /></div> : <span className="ysq-success-seal">✓</span>}
          <div><small>{newBeast ? 'NEW LEXIBEAST JOINS THE STORY!' : 'SPELLING MAGIC COMPLETE'}</small><h2>{word.english.toUpperCase()} 拼對了！</h2><p><b>{word.english}</b> = {word.chinese}</p><em>{newBeast ? `新卡「${newBeast.name} · ${newBeast.en}」已加入圖鑑！` : '故事書恢復了閃亮的英文文字。'}</em></div>
          <button onClick={onContinue}>{round + 1 >= QUEST_LENGTH ? '完成這一章' : '翻到下一頁'} →</button>
        </div>
      )}
    </div>
  );
}

function Result({ score, bestScore, mastered, totalWords, available, onAgain, onHome }) {
  const featured = available.at(-1);
  return (
    <div className="spell-quest ysq-result" data-testid="younger-spelling-result">
      <div className="ysq-result-stars" aria-hidden="true">✦　·　✧　·　✦</div>
      <p className="ysq-kicker">STORY CHAPTER COMPLETE</p>
      <div className="ysq-result-card"><CreatureCard beast={featured} compact /></div>
      <h1>妹妹完成了<br /><em>十頁拼字故事！</em></h1>
      <p>每一個填進故事的字母，都變成星獸的魔法。下一次遠征會帶你遇見新的單字。</p>
      <div className="ysq-result-grid"><span><small>本次分數</small><b>{score}</b></span><span><small>最高分數</small><b>{bestScore}</b></span><span><small>單字圖鑑</small><b>{mastered.length}/{totalWords}</b></span><span><small>星獸卡</small><b>{available.length}/30</b></span></div>
      <div className="ysq-result-actions"><button className="ysq-primary" onClick={onAgain}>繼續下一章 <span>➜</span></button><button onClick={onHome}>回故事書封面</button></div>
    </div>
  );
}

export default function YoungerSpellingQuest({ words }) {
  const initial = useMemo(readProgress, []);
  const eligibleWords = useMemo(() => words.filter((word) => spellingOf(word)), [words]);
  const [screen, setScreen] = useState('intro');
  const [round, setRound] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hints, setHints] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [mastered, setMastered] = useState(initial.mastered);
  const [unlocked, setUnlocked] = useState(initial.unlocked);
  const [adventures, setAdventures] = useState(initial.adventures);
  const [bestScore, setBestScore] = useState(initial.bestScore);
  const [totalCorrect, setTotalCorrect] = useState(initial.totalCorrect);
  const [newCardId, setNewCardId] = useState(null);

  const orderedWords = useMemo(() => seededShuffle(eligibleWords, 20260816), [eligibleWords]);
  const route = useMemo(
    () => Array.from({ length: Math.min(QUEST_LENGTH, orderedWords.length) }, (_, index) => orderedWords[(adventures * QUEST_LENGTH + index) % orderedWords.length]),
    [orderedWords, adventures],
  );
  const available = useMemo(() => BEASTS.filter((beast) => unlocked.includes(beast.id)), [unlocked]);
  const currentWord = route[round];
  const currentSpelling = spellingOf(currentWord);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ mastered, unlocked, adventures, bestScore, totalCorrect }));
    } catch {
      // The current session remains playable without persistent browser storage.
    }
  }, [mastered, unlocked, adventures, bestScore, totalCorrect]);

  const startQuest = () => {
    setRound(0);
    setSelectedIds([]);
    setFeedback(null);
    setScore(0);
    setStreak(0);
    setHints(0);
    setAttempts(0);
    setNewCardId(null);
    setScreen('adventure');
  };

  const hintOneLetter = (tiles) => {
    const selectedLetters = selectedIds.map((id) => tiles.find((tile) => tile.id === id)?.letter || '');
    let correctPrefix = 0;
    while (correctPrefix < selectedLetters.length && selectedLetters[correctPrefix] === currentSpelling[correctPrefix]) correctPrefix += 1;
    const validIds = selectedIds.slice(0, correctPrefix);
    const nextLetter = currentSpelling[correctPrefix];
    const nextTile = tiles.find((tile) => tile.letter === nextLetter && !validIds.includes(tile.id));
    if (!nextTile) return;
    setSelectedIds([...validIds, nextTile.id]);
    setHints((current) => current + 1);
    speak(nextLetter);
  };

  const checkAnswer = (answer) => {
    if (answer !== currentSpelling) {
      setFeedback('wrong');
      setStreak(0);
      setAttempts((current) => current + 1);
      speak(currentWord.english);
      return;
    }

    const nextStreak = streak + 1;
    const points = Math.max(60, 100 + nextStreak * 10 - hints * 15 - attempts * 10);
    const isNewWord = !mastered.includes(currentWord.id);
    const nextMastered = isNewWord ? [...mastered, currentWord.id] : mastered;
    let unlockedBeast = null;

    if (isNewWord && nextMastered.length % 2 === 0 && unlocked.length < BEASTS.length) {
      unlockedBeast = BEASTS.find((beast) => !unlocked.includes(beast.id));
      if (unlockedBeast) setUnlocked((current) => [...current, unlockedBeast.id]);
    }

    setMastered(nextMastered);
    setNewCardId(unlockedBeast?.id || null);
    setScore((current) => current + points);
    setStreak(nextStreak);
    setTotalCorrect((current) => current + 1);
    setFeedback('correct');
    speak(currentWord.english);
  };

  const continueStory = () => {
    if (round + 1 >= route.length) {
      const finalScore = score;
      setBestScore((current) => Math.max(current, finalScore));
      setAdventures((current) => current + 1);
      setScreen('result');
      setFeedback(null);
      return;
    }
    setRound((current) => current + 1);
    setSelectedIds([]);
    setFeedback(null);
    setHints(0);
    setAttempts(0);
    setNewCardId(null);
  };

  if (!eligibleWords.length) return <div className="spell-quest ysq-empty">找不到可以練習拼字的妹妹單字。</div>;
  if (screen === 'intro') return <Intro words={eligibleWords} mastered={mastered} available={available} adventures={adventures} bestScore={bestScore} onStart={startQuest} />;
  if (screen === 'result') return <Result score={score} bestScore={Math.max(bestScore, score)} mastered={mastered} totalWords={eligibleWords.length} available={available} onAgain={startQuest} onHome={() => setScreen('intro')} />;
  return (
    <Adventure
      route={route} round={round} available={available} score={score} streak={streak} hints={hints} attempts={attempts}
      selectedIds={selectedIds} feedback={feedback} newCardId={newCardId}
      onSelect={(id) => setSelectedIds((current) => current.length < currentSpelling.length ? [...current, id] : current)}
      onRemove={(index) => setSelectedIds((current) => current.slice(0, index))}
      onUndo={() => setSelectedIds((current) => current.slice(0, -1))}
      onClear={() => setSelectedIds([])}
      onHint={hintOneLetter}
      onCheck={checkAnswer}
      onListen={speak}
      onContinue={continueStory}
      onRetry={() => { setSelectedIds([]); setFeedback(null); setHints(0); }}
      onHome={() => setScreen('intro')}
    />
  );
}
