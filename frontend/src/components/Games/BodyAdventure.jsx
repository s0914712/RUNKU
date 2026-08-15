import { useMemo, useState } from 'react';
import './BodyAdventure.css';
import foxStand from '../../../../sprite/FOX_CHAR/stand.png';
import foxRun from '../../../../sprite/FOX_CHAR/run1.png';
import deerStand from '../../../../sprite/DEER_CHAR/stand.png';
import dinosaurSit from '../../../../sprite/DINOSOUR/sit.png';
import dragonBoss from '../../../../sprite/DRAGON_CHAR/boss.png';

const SPRITES = {
  fox: foxStand,
  foxRun,
  deer: deerStand,
  dinosaur: dinosaurSit,
  dragon: dragonBoss,
};

const WORDS = {
  head: { en: 'head', zh: '頭', emoji: '🙂', clue: '臉上方、戴帽子的地方' },
  eye: { en: 'eye', zh: '眼睛', emoji: '👁️', clue: '用來看東西' },
  ear: { en: 'ear', zh: '耳朵', emoji: '👂', clue: '用來聽聲音' },
  nose: { en: 'nose', zh: '鼻子', emoji: '👃', clue: '用來聞花香' },
  mouth: { en: 'mouth', zh: '嘴巴', emoji: '👄', clue: '用來說話和吃東西' },
  hair: { en: 'hair', zh: '頭髮', emoji: '💇', clue: '長在頭頂上' },
  body: { en: 'body', zh: '身體', emoji: '🧍', clue: '從頭到腳的整個身體' },
  shoulder: { en: 'shoulder', zh: '肩膀', emoji: '🤷', clue: '手臂和身體連接的地方' },
  arm: { en: 'arm', zh: '手臂', emoji: '💪', clue: '肩膀到手之間' },
  hand: { en: 'hand', zh: '手', emoji: '✋', clue: '可以拿東西' },
  finger: { en: 'finger', zh: '手指', emoji: '☝️', clue: '長在手掌前端' },
  leg: { en: 'leg', zh: '腿', emoji: '🦵', clue: '幫助我們走路' },
  foot: { en: 'foot', zh: '腳', emoji: '🦶', clue: '穿鞋子的部位' },
  toe: { en: 'toe', zh: '腳趾', emoji: '🐾', clue: '長在腳掌前端' },
};

const ZONES = [
  {
    id: 'forest',
    number: '01',
    name: '迷霧臉部森林',
    english: 'Misty Face Forest',
    icon: '🌲',
    npc: 'deer',
    npcName: '小鹿 LULU',
    story: 'Lulu 想幫戴著 watch 的 bear 看時間。找回六枚臉部符文吧！',
    badge: '森林之眼',
    words: ['head', 'eye', 'ear', 'nose', 'mouth', 'hair'],
    types: ['choice', 'point', 'spell', 'point', 'choice', 'spell'],
  },
  {
    id: 'meadow',
    number: '02',
    name: '勇氣四肢原野',
    english: 'Brave Limb Meadow',
    icon: '🌾',
    npc: 'dinosaur',
    npcName: '恐龍 DODO',
    story: 'Dodo 遇見了無法爬樹的 monkey。收集四肢咒語幫助牠！',
    badge: '勇氣之掌',
    words: ['body', 'shoulder', 'arm', 'hand', 'finger', 'leg', 'foot', 'toe'],
    types: ['point', 'choice', 'spell', 'point', 'spell', 'choice', 'point', 'spell'],
  },
  {
    id: 'castle',
    number: '03',
    name: '回聲試煉城堡',
    english: 'Echo Trial Castle',
    icon: '🏰',
    npc: 'dragon',
    npcName: '三首龍 DRAGON',
    story: 'Dragon 和 lion 守著最後寶箱。仔細聽口令，點中正確部位！',
    badge: '單字皇冠',
    words: ['hair', 'eye', 'shoulder', 'hand', 'toe'],
    types: ['listen', 'listen', 'listen', 'listen', 'listen'],
  },
];

const MAP_POINTS = [
  { en: 'hair', x: 50, y: 7 },
  { en: 'head', x: 50, y: 15.5 },
  { en: 'eye', x: 44, y: 23 },
  { en: 'ear', x: 29, y: 22.5 },
  { en: 'nose', x: 50, y: 26 },
  { en: 'mouth', x: 50, y: 32.5 },
  { en: 'shoulder', x: 34, y: 37 },
  { en: 'body', x: 50, y: 49 },
  { en: 'arm', x: 25, y: 50 },
  { en: 'hand', x: 20, y: 62 },
  { en: 'finger', x: 10, y: 65 },
  { en: 'leg', x: 42, y: 72 },
  { en: 'foot', x: 62, y: 91 },
  { en: 'toe', x: 74, y: 94 },
];

const ALL_WORD_KEYS = Object.keys(WORDS);

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.76;
  utterance.pitch = 1.08;
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find((voice) => voice.lang.startsWith('en'));
  if (englishVoice) utterance.voice = englishVoice;
  window.speechSynthesis.speak(utterance);
}

function shuffleWithSeed(items, seed) {
  const result = [...items];
  let value = seed + 17;
  for (let i = result.length - 1; i > 0; i -= 1) {
    value = (value * 9301 + 49297) % 233280;
    const j = Math.floor((value / 233280) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function makeChoices(target, round) {
  const alternatives = ALL_WORD_KEYS.filter((key) => key !== target);
  const picked = shuffleWithSeed(alternatives, round * 9 + target.length).slice(0, 2);
  return shuffleWithSeed([target, ...picked], round + target.charCodeAt(0));
}

function HeroCharacter({ small = false, running = false }) {
  return (
    <div className={`ba-hero-character${small ? ' ba-hero-character--small' : ''}`} aria-hidden="true">
      <img src={running ? SPRITES.foxRun : SPRITES.fox} alt="" />
      <span className="ba-hero-spark">✦</span>
    </div>
  );
}

function WordRibbon({ collected }) {
  return (
    <div className="ba-word-ribbon" aria-label={`已收集 ${collected.length} 個身體單字`}>
      <span className="ba-ribbon-title">MAGIC WORDS</span>
      <div className="ba-ribbon-track">
        <span className="ba-ribbon-fill" style={{ width: `${(collected.length / ALL_WORD_KEYS.length) * 100}%` }} />
      </div>
      <strong>{collected.length}<small> / {ALL_WORD_KEYS.length}</small></strong>
    </div>
  );
}

function AdventureHeader({ stars, collected, onMap, showMapButton = true }) {
  return (
    <header className="ba-game-header">
      <button className="ba-brand" onClick={onMap} aria-label="回到冒險地圖">
        <span className="ba-brand-mark">M</span>
        <span><b>BODY QUEST</b><small>魔法身體探險</small></span>
      </button>
      <WordRibbon collected={collected} />
      <div className="ba-header-tools">
        <span className="ba-star-count">★ {stars}</span>
        {showMapButton && <button className="ba-map-button" onClick={onMap}>地圖</button>}
      </div>
    </header>
  );
}

function IntroScreen({ onStart }) {
  const [mode, setMode] = useState('junior');
  return (
    <div className="body-adventure ba-intro-shell">
      <div className="ba-sky-dots" aria-hidden="true" />
      <section className="ba-intro-copy">
        <p className="ba-kicker"><span>NEW QUEST</span> 英語魔法任務</p>
        <h1>奇幻身體<br /><em>探險記</em></h1>
        <p className="ba-title-en">THE MAGIC BODY ADVENTURE</p>
        <p className="ba-intro-lead">搗蛋鬼偷走了身體部位的英文名字。拿起魔法杖，幫助森林朋友找回失落的單字！</p>

        <div className="ba-mode-picker" role="radiogroup" aria-label="選擇冒險難度">
          <button
            className={mode === 'junior' ? 'is-selected' : ''}
            onClick={() => setMode('junior')}
            role="radio"
            aria-checked={mode === 'junior'}
          >
            <span>🌱</span><b>小小冒險家</b><small>顯示單字與提示</small>
          </button>
          <button
            className={mode === 'hero' ? 'is-selected' : ''}
            onClick={() => setMode('hero')}
            role="radio"
            aria-checked={mode === 'hero'}
          >
            <span>⚔️</span><b>拼字勇者</b><small>少一點提示，更有挑戰</small>
          </button>
        </div>

        <button className="ba-primary-button" onClick={() => onStart(mode)}>
          <span>開始冒險</span><i>→</i>
        </button>
        <p className="ba-no-pressure">沒有倒數計時・答錯可以再試一次</p>
      </section>

      <section className="ba-intro-art" aria-label="魔法身體探險插畫">
        <div className="ba-moon">ABC</div>
        <div className="ba-cloud ba-cloud-one" />
        <div className="ba-cloud ba-cloud-two" />
        <div className="ba-castle">♜<span>DOCTOR<br />&amp; NURSE</span></div>
        <div className="ba-friend ba-friend-bear"><img src={SPRITES.deer} alt="小鹿 Lulu" /><small>DEER LULU</small></div>
        <div className="ba-friend ba-friend-monkey"><img src={SPRITES.dinosaur} alt="恐龍 Dodo" /><small>DINO DODO</small></div>
        <HeroCharacter running />
        <div className="ba-intro-ground"><span>🌲</span><span>🌳</span><span>🌲</span><span>🌳</span></div>
        <div className="ba-magic-word ba-word-eye">EYE</div>
        <div className="ba-magic-word ba-word-hand">HAND</div>
        <div className="ba-magic-word ba-word-foot">FOOT</div>
      </section>
    </div>
  );
}

function MapScreen({ unlocked, completed, collected, stars, mode, onEnter, onReset }) {
  return (
    <div className="body-adventure ba-world-shell">
      <AdventureHeader stars={stars} collected={collected} onMap={() => {}} showMapButton={false} />
      <main className="ba-map-main">
        <div className="ba-map-heading">
          <div>
            <p className="ba-kicker"><span>ADVENTURE MAP</span> 冒險地圖</p>
            <h2>選擇下一段旅程</h2>
            <p>跟著發光的路前進，每一站都會遇見新的魔法單字。</p>
          </div>
          <div className="ba-doctor-note">
            <span>👩‍⚕️</span>
            <p><b>Nurse 提醒你：</b><br />點一下喇叭，記得跟著大聲念！</p>
          </div>
        </div>

        <div className="ba-map-board">
          <div className="ba-map-compass">N<span>✦</span></div>
          <div className="ba-map-path" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          {ZONES.map((zone, index) => {
            const locked = index > unlocked;
            const done = completed.includes(zone.id);
            return (
              <article className={`ba-zone-card ba-zone-${zone.id}${locked ? ' is-locked' : ''}${done ? ' is-done' : ''}`} key={zone.id}>
                <span className="ba-zone-number">{zone.number}</span>
                <div className="ba-zone-scene">
                  <span className="ba-zone-landmark">{zone.icon}</span>
                  <span className="ba-zone-npc">
                    {locked ? <b>🔒</b> : <img src={SPRITES[zone.npc]} alt={zone.npcName} />}
                  </span>
                </div>
                <div className="ba-zone-copy">
                  <p>{zone.english}</p>
                  <h3>{zone.name}</h3>
                  <span>{zone.story}</span>
                </div>
                <button disabled={locked} onClick={() => onEnter(index)}>
                  {locked ? '完成上一區解鎖' : done ? '再次挑戰' : index === unlocked ? '進入任務' : '開始探索'}
                  {!locked && <b>→</b>}
                </button>
                {done && <div className="ba-done-stamp">完成<br />CLEAR</div>}
              </article>
            );
          })}
        </div>

        <footer className="ba-map-footer">
          <span>目前模式：<b>{mode === 'junior' ? '🌱 小小冒險家' : '⚔️ 拼字勇者'}</b></span>
          <button onClick={onReset}>重新開始旅程</button>
        </footer>
      </main>
    </div>
  );
}

function BodyMap({ target, onPick, feedback }) {
  return (
    <div className={`ba-body-map${feedback === 'correct' ? ' is-correct' : ''}`}>
      <svg viewBox="0 0 240 400" role="img" aria-label="可點選身體部位的魔法學徒">
        <ellipse cx="120" cy="379" rx="70" ry="10" fill="#143c3a" opacity=".14" />
        <path d="M79 151 Q56 175 52 240 L73 245 91 184Z" fill="#f3a78d" stroke="#183b3a" strokeWidth="5" />
        <path d="M161 151 Q184 175 188 240 L167 245 149 184Z" fill="#f3a78d" stroke="#183b3a" strokeWidth="5" />
        <path d="M88 141 Q120 123 152 141 L165 263 Q120 285 75 263Z" fill="#e85848" stroke="#183b3a" strokeWidth="6" />
        <path d="M103 261 L101 349 75 368 68 354 78 254Z" fill="#f3a78d" stroke="#183b3a" strokeWidth="6" />
        <path d="M137 261 L139 349 165 368 172 354 162 254Z" fill="#f3a78d" stroke="#183b3a" strokeWidth="6" />
        <path d="M96 138 Q120 157 144 138 L150 207 Q120 227 90 207Z" fill="#f8c94c" opacity=".95" />
        <circle cx="120" cy="93" r="53" fill="#f4b29a" stroke="#183b3a" strokeWidth="6" />
        <path d="M70 89 Q70 24 121 30 Q173 25 171 92 Q151 67 115 70 Q89 72 70 89Z" fill="#213d3b" />
        <path d="M72 79 Q95 16 127 29 Q94 29 84 94Z" fill="#213d3b" />
        <circle cx="101" cy="94" r="5" fill="#183b3a" /><circle cx="139" cy="94" r="5" fill="#183b3a" />
        <path d="M120 98 L115 111 124 111" fill="none" stroke="#b85d55" strokeWidth="4" strokeLinecap="round" />
        <path d="M104 122 Q120 137 136 122" fill="none" stroke="#8d3e45" strokeWidth="4" strokeLinecap="round" />
        <path d="M73 237 Q62 260 48 253 Q42 246 54 235Z" fill="#f4b29a" stroke="#183b3a" strokeWidth="5" />
        <path d="M167 237 Q178 260 192 253 Q198 246 186 235Z" fill="#f4b29a" stroke="#183b3a" strokeWidth="5" />
        <path d="M67 354 Q48 361 45 376 Q70 384 91 368Z" fill="#f8c94c" stroke="#183b3a" strokeWidth="6" />
        <path d="M173 354 Q192 361 195 376 Q170 384 149 368Z" fill="#f8c94c" stroke="#183b3a" strokeWidth="6" />
        <path d="M79 151 L62 179" stroke="#f8c94c" strokeWidth="10" strokeLinecap="round" />
        <path d="M161 151 L178 179" stroke="#f8c94c" strokeWidth="10" strokeLinecap="round" />
      </svg>
      {MAP_POINTS.map((point) => (
        <button
          key={point.en}
          className={`ba-body-hotspot${point.en === target ? ' is-target' : ''}`}
          style={{ left: `${point.x}%`, top: `${point.y}%` }}
          onClick={() => onPick(point.en)}
          aria-label={WORDS[point.en].zh}
          title={WORDS[point.en].zh}
        >
          <span />
        </button>
      ))}
    </div>
  );
}

function ChoiceChallenge({ word, round, onAnswer, feedback }) {
  const choices = useMemo(() => makeChoices(word.en, round), [word.en, round]);
  return (
    <div className="ba-choice-grid">
      {choices.map((key, index) => (
        <button
          key={key}
          onClick={() => onAnswer(key)}
          className={feedback && key === word.en ? 'is-answer' : ''}
        >
          <small>0{index + 1}</small>
          <span>{WORDS[key].emoji}</span>
          <b>{WORDS[key].en}</b>
        </button>
      ))}
    </div>
  );
}

function SpellChallenge({ word, mode, round, onAnswer, feedback }) {
  const tiles = useMemo(
    () => shuffleWithSeed(word.en.toUpperCase().split('').map((letter, index) => ({ letter, id: `${letter}-${index}` })), round + word.en.length),
    [word.en, round],
  );
  const [picked, setPicked] = useState([]);
  const pickedIds = new Set(picked.map((tile) => tile.id));

  const chooseTile = (tile) => {
    if (!pickedIds.has(tile.id) && !feedback) setPicked([...picked, tile]);
  };

  const removeTile = (tileIndex) => {
    if (!feedback) setPicked(picked.filter((_, index) => index !== tileIndex));
  };

  const submit = () => onAnswer(picked.map((tile) => tile.letter).join('').toLowerCase());

  return (
    <div className="ba-spell-challenge">
      <div className="ba-spell-slots" aria-label="目前拼出的單字">
        {word.en.split('').map((letter, index) => (
          <button key={`${letter}-${index}`} onClick={() => removeTile(index)} className={picked[index] ? 'has-letter' : ''}>
            {picked[index]?.letter || (mode === 'junior' && index === 0 ? letter.toUpperCase() : '')}
          </button>
        ))}
      </div>
      <div className="ba-letter-bank">
        {tiles.map((tile) => (
          <button key={tile.id} disabled={pickedIds.has(tile.id)} onClick={() => chooseTile(tile)}>{tile.letter}</button>
        ))}
      </div>
      <button className="ba-check-button" disabled={picked.length !== word.en.length} onClick={submit}>施展還原魔法 ✦</button>
    </div>
  );
}

function QuestScreen({ zoneIndex, mode, stars, collected, onLeave, onCompleteZone }) {
  const zone = ZONES[zoneIndex];
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [wrongPick, setWrongPick] = useState('');
  const targetKey = zone.words[round];
  const word = WORDS[targetKey];
  const type = zone.types[round];

  const answer = (value) => {
    if (feedback) return;
    if (value === targetKey) {
      setFeedback('correct');
      speak(word.en);
    } else {
      setWrongPick(value);
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback(null);
        setWrongPick('');
      }, 850);
    }
  };

  const continueQuest = () => {
    if (round === zone.words.length - 1) {
      onCompleteZone(zoneIndex, zone.words);
      return;
    }
    setRound(round + 1);
    setFeedback(null);
    setWrongPick('');
  };

  const instruction = type === 'spell'
    ? '依照正確順序點選字母'
    : type === 'listen'
      ? '聽口令，點選正確的身體部位'
      : type === 'point'
        ? `在魔法學徒身上找到「${word.zh}」`
        : `哪一個英文單字是「${word.zh}」？`;

  return (
    <div className={`body-adventure ba-quest-shell ba-theme-${zone.id}`}>
      <AdventureHeader stars={stars} collected={collected} onMap={onLeave} />
      <main className="ba-quest-main">
        <aside className="ba-quest-sidebar">
          <button className="ba-back-link" onClick={onLeave}>← 暫停並回地圖</button>
          <div className="ba-npc-card">
            <span className={`ba-npc-sprite ba-npc-${zone.npc}`}><img src={SPRITES[zone.npc]} alt={zone.npcName} /></span>
            <small>YOUR QUEST GUIDE</small>
            <h3>{zone.npcName}</h3>
            <p>「{round === 0 ? zone.story : `太棒了！下一個魔法是 ${mode === 'junior' ? word.en.toUpperCase() : '……'}。`}」</p>
          </div>
          <div className="ba-quest-list">
            <b>任務進度</b>
            {zone.words.map((key, index) => (
              <span key={key} className={index < round ? 'is-done' : index === round ? 'is-current' : ''}>
                <i>{index < round ? '✓' : index + 1}</i>
                {mode === 'junior' || index <= round ? WORDS[key].en : '???'}
              </span>
            ))}
          </div>
        </aside>

        <section className="ba-challenge-card">
          <div className="ba-challenge-topline">
            <span>QUEST {zone.number}</span>
            <div className="ba-round-pips">
              {zone.words.map((key, index) => <i key={key} className={index <= round ? 'is-on' : ''} />)}
            </div>
            <b>{round + 1} / {zone.words.length}</b>
          </div>

          <div className="ba-prompt">
            <p>{instruction}</p>
            <div className="ba-target-word">
              <span>{word.emoji}</span>
              <div>
                <small>{type === 'listen' ? 'LISTEN TO THE MAGIC WORD' : word.zh}</small>
                <h2>{type === 'listen' && mode === 'hero' ? '••••••' : word.en.toUpperCase()}</h2>
              </div>
              <button onClick={() => speak(type === 'listen' ? `Touch your ${word.en}` : word.en)} aria-label="播放英文發音">🔊</button>
            </div>
            {mode === 'junior' && <span className="ba-clue">💡 {word.clue}</span>}
          </div>

          <div className={`ba-challenge-stage${feedback === 'wrong' ? ' is-shaking' : ''}`}>
            {type === 'choice' && <ChoiceChallenge word={word} round={round} onAnswer={answer} feedback={feedback} />}
            {type === 'spell' && <SpellChallenge key={`${zone.id}-${round}`} word={word} mode={mode} round={round} onAnswer={answer} feedback={feedback} />}
            {(type === 'point' || type === 'listen') && <BodyMap target={targetKey} onPick={answer} feedback={feedback} />}
          </div>

          {feedback === 'wrong' && (
            <div className="ba-feedback ba-feedback-wrong" role="status">
              <span>↻</span><p><b>差一點點！</b>{wrongPick && WORDS[wrongPick] ? ` 你點到的是 ${WORDS[wrongPick].en}。` : ''} 再試一次吧。</p>
            </div>
          )}

          {feedback === 'correct' && (
            <div className="ba-success-overlay">
              <div className="ba-word-card">
                <small>NEW MAGIC WORD</small>
                <span>{word.emoji}</span>
                <h2>{word.en}</h2>
                <p>{word.zh}・{word.clue}</p>
                <div>★ + 1</div>
                <button onClick={continueQuest}>{round === zone.words.length - 1 ? '完成這一區' : '收下單字卡'} →</button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function FinaleScreen({ stars, collected, onMap, onReplay }) {
  return (
    <div className="body-adventure ba-finale-shell">
      <AdventureHeader stars={stars} collected={collected} onMap={onMap} />
      <main className="ba-finale">
        <div className="ba-rays" aria-hidden="true" />
        <p className="ba-kicker"><span>QUEST COMPLETE</span> 任務完成</p>
        <div className="ba-crown">♛</div>
        <h1>身體單字<br /><em>魔法師</em></h1>
        <p>你找回了所有失落的身體單字，動物朋友們又能自在地奔跑、看見和歡笑了！</p>
        <div className="ba-finale-friends">
          <span>👩‍⚕️</span>
          <img src={SPRITES.deer} alt="小鹿 Lulu" />
          <HeroCharacter small />
          <img src={SPRITES.dinosaur} alt="恐龍 Dodo" />
          <img className="ba-finale-dragon" src={SPRITES.dragon} alt="三首龍 Dragon" />
        </div>
        <div className="ba-treasure-row">
          <div><small>獲得星星</small><b>★ {stars}</b></div>
          <div><small>收集單字</small><b>{collected.length} / {ALL_WORD_KEYS.length}</b></div>
          <div><small>最終獎勵</small><b>🧸 TOY</b></div>
        </div>
        <div className="ba-finale-actions">
          <button className="ba-primary-button" onClick={onReplay}><span>再玩一次</span><i>↻</i></button>
          <button className="ba-secondary-button" onClick={onMap}>回冒險地圖</button>
        </div>
      </main>
    </div>
  );
}

export default function BodyAdventure() {
  const [screen, setScreen] = useState('intro');
  const [mode, setMode] = useState('junior');
  const [zoneIndex, setZoneIndex] = useState(0);
  const [unlocked, setUnlocked] = useState(0);
  const [completed, setCompleted] = useState([]);
  const [collected, setCollected] = useState([]);
  const [stars, setStars] = useState(0);

  const start = (selectedMode) => {
    setMode(selectedMode);
    setScreen('map');
  };

  const enterZone = (index) => {
    setZoneIndex(index);
    setScreen('quest');
  };

  const finishZone = (index, learnedWords) => {
    const zoneId = ZONES[index].id;
    const newWords = learnedWords.filter((key) => !collected.includes(key));
    setCollected((current) => [...new Set([...current, ...learnedWords])]);
    setStars((current) => current + newWords.length);
    setCompleted((current) => current.includes(zoneId) ? current : [...current, zoneId]);
    setUnlocked((current) => Math.max(current, Math.min(index + 1, ZONES.length - 1)));
    setScreen(index === ZONES.length - 1 ? 'finale' : 'map');
  };

  const reset = () => {
    setUnlocked(0);
    setCompleted([]);
    setCollected([]);
    setStars(0);
    setScreen('intro');
  };

  if (screen === 'intro') return <IntroScreen onStart={start} />;
  if (screen === 'quest') {
    return (
      <QuestScreen
        key={`${zoneIndex}-${completed.includes(ZONES[zoneIndex].id) ? 'replay' : 'new'}`}
        zoneIndex={zoneIndex}
        mode={mode}
        stars={stars}
        collected={collected}
        onLeave={() => setScreen('map')}
        onCompleteZone={finishZone}
      />
    );
  }
  if (screen === 'finale') {
    return <FinaleScreen stars={stars} collected={collected} onMap={() => setScreen('map')} onReplay={reset} />;
  }
  return (
    <MapScreen
      unlocked={unlocked}
      completed={completed}
      collected={collected}
      stars={stars}
      mode={mode}
      onEnter={enterZone}
      onReset={reset}
    />
  );
}
