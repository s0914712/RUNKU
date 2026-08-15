import { useEffect, useMemo, useState } from 'react';
import foxStand from '../../../../sprite/FOX_CHAR/stand.png';
import foxRun from '../../../../sprite/FOX_CHAR/run1.png';
import deerStand from '../../../../sprite/DEER_CHAR/stand.png';
import dinosaurSit from '../../../../sprite/DINOSOUR/sit.png';
import dragonBoss from '../../../../sprite/DRAGON_CHAR/boss.png';
import './WordQuestRPG.css';

const ART = {
  fox: foxStand,
  foxRun,
  deer: deerStand,
  dinosaur: dinosaurSit,
  dragon: dragonBoss,
};

const GAME_CONFIGS = {
  sister: {
    profileKey: 'jie',
    eyebrow: 'THE AZURE WORD CHRONICLE',
    title: '姊姊勇者傳說',
    world: '星語大陸',
    hero: '蒼藍勇者・姊姊',
    heroTitle: 'WORD KNIGHT',
    intro: '魔王奪走了星語大陸的文字。用動作、食物、校園與生活單字鑄成勇者之劍，讓四座城鎮重新發光。',
    accent: '#43d6c5',
    dark: '#081d32',
    sky: '#2d6b8d',
    chapters: [
      { name: '疾風動詞平原', en: 'GALE VERB PLAINS', icon: '🌬️', cats: ['verbs'], enemy: 'deer', monster: '疾風角獸', story: '被封印的動詞讓風車全部停了下來。', color: '#3ca8a2' },
      { name: '月光食材鎮', en: 'MOONLIGHT PANTRY', icon: '🥕', cats: ['food'], enemy: 'dinosaur', monster: '貪吃岩龍', story: '說出食物的名字，取回旅行隊的補給。', color: '#e49a3a' },
      { name: '天空知識塔', en: 'SKYWARD ACADEMY', icon: '🏫', cats: ['school'], enemy: 'fox', monster: '謎題狐衛', story: '穿過雲端教室，點亮沉睡的知識鐘。', color: '#6c78c8' },
      { name: '星蝕魔王城', en: 'ECLIPSE CITADEL', icon: '🏰', cats: ['life'], enemy: 'dragon', monster: '三首闇語龍', story: '用生活單字完成最後一擊，奪回星語水晶。', color: '#c85062' },
    ],
  },
  younger: {
    profileKey: 'mei',
    eyebrow: 'THE SUNBEAM WORD CHRONICLE',
    title: '妹妹勇者傳說',
    world: '彩虹王國',
    hero: '曙光勇者・妹妹',
    heroTitle: 'SUNBEAM HERO',
    intro: '搗蛋龍把彩虹王國的單字變成了小怪獸。認出動物、物品、數字與身體單字，收集七彩寶石救回王國朋友！',
    accent: '#ffd45c',
    dark: '#24324b',
    sky: '#ef8b70',
    chapters: [
      { name: '閃亮數字草原', en: 'SPARKLE MEADOW', icon: '🌼', cats: ['basics', 'numbers'], enemy: 'deer', monster: '噗噗花角獸', story: '找回基礎用語與數字，修好彩虹路標。', color: '#67b985' },
      { name: '百獸朋友森林', en: 'FRIENDSHIP FOREST', icon: '🌳', cats: ['animals'], enemy: 'fox', monster: '迷路小狐王', story: '叫出動物朋友的名字，解除森林迷霧。', color: '#43a4b2' },
      { name: '玩具音樂港', en: 'TOYBOX HARBOR', icon: '🚂', cats: ['things', 'people', 'vehicles'], enemy: 'dinosaur', monster: '咚咚玩具龍', story: '帶著物品與職業單字，讓玩具船再次啟航。', color: '#d9914c' },
      { name: '身體魔法城', en: 'BODY MAGIC CASTLE', icon: '🏰', cats: ['body'], enemy: 'dragon', monster: '三首忘字龍', story: '說出身體部位，施展完整的還原魔法。', color: '#d5677c' },
    ],
  },
};

const SAVE_VERSION = 1;

function seededShuffle(items, seed) {
  const output = [...items];
  let value = seed + 41;
  for (let index = output.length - 1; index > 0; index -= 1) {
    value = (value * 9301 + 49297) % 233280;
    const target = Math.floor((value / 233280) * (index + 1));
    [output[index], output[target]] = [output[target], output[index]];
  }
  return output;
}

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.76;
  utterance.pitch = 1.05;
  const voice = window.speechSynthesis.getVoices().find((item) => item.lang.startsWith('en'));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

function readProgress(storageKey) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey));
    if (saved?.version === SAVE_VERSION) return saved;
  } catch {
    // A fresh quest is safer than blocking the game when storage is unavailable.
  }
  return null;
}

function buildCampaign(words, chapters, seed) {
  return chapters.map((chapter, chapterIndex) => {
    const pool = words.filter((word) => chapter.cats.includes(word.cat));
    return {
      ...chapter,
      words: seededShuffle(pool, seed + chapterIndex * 97).slice(0, 4),
    };
  });
}

function getChoiceOptions(words, target, seed) {
  const otherWords = seededShuffle(
    words.filter((word) => word.id !== target.id && word.english !== target.english),
    seed + target.id,
  ).slice(0, 3);
  return seededShuffle([target, ...otherWords], seed + target.english.length);
}

function StatBar({ label, value, max, tone = 'hp' }) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`wq-stat wq-stat-${tone}`}>
      <div><b>{label}</b><span>{value} / {max}</span></div>
      <i><span style={{ width: `${percent}%` }} /></i>
    </div>
  );
}

function GameHeader({ config, level, hp, maxHp, gold, mastered, total, onMap }) {
  return (
    <header className="wq-header">
      <button className="wq-logo" onClick={onMap} aria-label="返回冒險地圖">
        <span>W</span><div><b>WORD QUEST</b><small>{config.world}</small></div>
      </button>
      <div className="wq-header-stats">
        <span>LV <b>{level}</b></span>
        <span className="wq-mini-hp">♥ {hp}/{maxHp}</span>
        <span>🪙 <b>{gold}</b></span>
        <span>📖 <b>{mastered}/{total}</b></span>
      </div>
      <button className="wq-map-button" onClick={onMap}>世界地圖</button>
    </header>
  );
}

function IntroScreen({ config, wordCount, hasProgress, difficulty, onDifficulty, onStart, onNewGame }) {
  return (
    <div className={`word-quest wq-${config.profileKey} wq-intro`} style={{ '--wq-accent': config.accent, '--wq-dark': config.dark, '--wq-sky': config.sky }}>
      <div className="wq-intro-copy">
        <p className="wq-eyebrow">✦ {config.eyebrow} ✦</p>
        <h1>{config.title}</h1>
        <p className="wq-world-name">WORD QUEST OF {config.world.toUpperCase()}</p>
        <div className="wq-story-box"><span>國王的委託</span><p>{config.intro}</p></div>

        <div className="wq-difficulty" role="radiogroup" aria-label="選擇冒險難度">
          <button className={difficulty === 'rookie' ? 'is-active' : ''} onClick={() => onDifficulty('rookie')} role="radio" aria-checked={difficulty === 'rookie'}>
            <span>🛡️</span><div><b>見習勇者</b><small>首字母提示・答錯扣 1 HP</small></div>
          </button>
          <button className={difficulty === 'legend' ? 'is-active' : ''} onClick={() => onDifficulty('legend')} role="radio" aria-checked={difficulty === 'legend'}>
            <span>⚔️</span><div><b>傳說勇者</b><small>沒有拼字提示・怪物更強</small></div>
          </button>
        </div>

        <div className="wq-intro-actions">
          <button className="wq-primary" onClick={onStart}>{hasProgress ? '繼續冒險' : '拔出單字之劍'} <span>▶</span></button>
          {hasProgress && <button className="wq-text-button" onClick={onNewGame}>開始新的旅程</button>}
        </div>
        <div className="wq-quest-facts"><span><b>4</b> 座城鎮</span><span><b>16</b> 場單字戰</span><span><b>{wordCount}</b> 張圖鑑</span></div>
      </div>

      <div className="wq-intro-art" aria-label={`${config.hero}準備出發`}>
        <div className="wq-sunburst" />
        <div className="wq-castle-silhouette">♜<small>WORD<br />CASTLE</small></div>
        <div className="wq-title-ribbon"><span>勇者</span><b>VS</b><span>魔王</span></div>
        <img className="wq-hero-sprite" src={ART.foxRun} alt={config.hero} />
        <img className="wq-dragon-sprite" src={ART.dragon} alt="單字魔王" />
        <div className="wq-floating-word wq-word-one">APPLE!</div>
        <div className="wq-floating-word wq-word-two">DRAGON!</div>
        <div className="wq-floating-word wq-word-three">MAGIC!</div>
        <div className="wq-ground"><i /><i /><i /><i /><i /></div>
      </div>
    </div>
  );
}

function MapScreen({ config, campaign, unlocked, completed, mastered, total, level, hp, maxHp, gold, onEnter, onIntro, onNewRun }) {
  return (
    <div className={`word-quest wq-${config.profileKey} wq-world`} style={{ '--wq-accent': config.accent, '--wq-dark': config.dark, '--wq-sky': config.sky }}>
      <GameHeader config={config} level={level} hp={hp} maxHp={maxHp} gold={gold} mastered={mastered} total={total} onMap={() => {}} />
      <main className="wq-map-main">
        <section className="wq-map-heading">
          <div><p className="wq-eyebrow">ADVENTURE MAP / 冒險地圖</p><h2>{config.world}</h2><p>沿著金色道路前進，打倒每一區的單字首領。</p></div>
          <div className="wq-king-message"><span>👑</span><p><b>國王：</b>勇者啊，答對單字就是最強的攻擊！</p></div>
        </section>

        <section className="wq-route" aria-label="冒險關卡">
          <div className="wq-route-line" aria-hidden="true" />
          {campaign.map((chapter, index) => {
            const locked = index > unlocked;
            const done = completed.includes(index);
            return (
              <article className={`wq-stage${locked ? ' is-locked' : ''}${done ? ' is-complete' : ''}`} key={chapter.name} style={{ '--stage-color': chapter.color }}>
                <div className="wq-stage-number">{index + 1}</div>
                <div className="wq-stage-scene"><span>{chapter.icon}</span>{locked ? <b>🔒</b> : <img src={ART[chapter.enemy]} alt={chapter.monster} />}</div>
                <small>STAGE 0{index + 1} · {chapter.en}</small>
                <h3>{chapter.name}</h3>
                <p>{chapter.story}</p>
                <div className="wq-word-preview">{chapter.words.map((word) => <span key={word.id}>{locked ? '???' : word.english}</span>)}</div>
                <button disabled={locked} onClick={() => onEnter(index)}>{locked ? '尚未解鎖' : done ? '再次巡邏' : '迎戰怪物'} <span>{!locked && '⚔'}</span></button>
                {done && <div className="wq-clear-seal">CLEAR<small>討伐成功</small></div>}
              </article>
            );
          })}
        </section>

        <footer className="wq-map-footer">
          <button onClick={onIntro}>← 回到遊戲封面</button>
          <span>本次旅程：每區 4 個單字・最後一戰是雙回合首領</span>
          <button onClick={onNewRun}>換一批單字 ↻</button>
        </footer>
      </main>
    </div>
  );
}

function ChoiceChallenge({ options, target, type, onAnswer, disabled }) {
  return (
    <div className="wq-choice-grid">
      {options.map((word, index) => (
        <button key={word.id} onClick={() => onAnswer(word.english)} disabled={disabled} data-correct={word.id === target.id ? 'true' : 'false'}>
          <small>0{index + 1}</small><span>{word.emoji || '✦'}</span><b>{word.english}</b>
          {type === 'meaning' && <em>{word.chinese}</em>}
        </button>
      ))}
    </div>
  );
}

function SpellChallenge({ target, seed, difficulty, onAnswer, disabled }) {
  const spellValue = target.english.replace(/\s+/g, '');
  const tiles = useMemo(
    () => seededShuffle(spellValue.toUpperCase().split('').map((letter, index) => ({ letter, id: `${letter}-${index}` })), seed),
    [spellValue, seed],
  );
  const [picked, setPicked] = useState([]);
  const pickedIds = new Set(picked.map((tile) => tile.id));
  const answer = picked.map((tile) => tile.letter).join('').toLowerCase();

  return (
    <div className="wq-spell">
      <div className="wq-spell-slots">
        {spellValue.split('').map((letter, index) => (
          <button key={`${letter}-${index}`} className={picked[index] ? 'has-letter' : ''} onClick={() => !disabled && setPicked(picked.filter((_, pickedIndex) => pickedIndex !== index))}>
            {picked[index]?.letter || (difficulty === 'rookie' && index === 0 ? letter.toUpperCase() : '')}
          </button>
        ))}
      </div>
      <div className="wq-letter-bank">
        {tiles.map((tile) => <button key={tile.id} data-letter={tile.letter} disabled={disabled || pickedIds.has(tile.id)} onClick={() => setPicked([...picked, tile])}>{tile.letter}</button>)}
      </div>
      <button className="wq-cast-button" disabled={disabled || picked.length !== spellValue.length} onClick={() => onAnswer(answer)}>施展拼字斬！</button>
    </div>
  );
}

function BattleScreen({ config, campaign, stageIndex, enemyIndex, enemyHp, enemyMaxHp, heroHp, maxHp, potions, level, xp, gold, mastered, total, difficulty, hit, feedback, battleLog, allWords, onAnswer, onContinue, onRetry, onPotion, onMap }) {
  const stage = campaign[stageIndex];
  const target = stage.words[enemyIndex];
  const isBoss = enemyIndex === stage.words.length - 1;
  const types = difficulty === 'rookie' ? ['meaning', 'listen', 'meaning', 'spell'] : ['listen', 'meaning', 'spell', 'listen'];
  const type = isBoss && hit > 0 ? 'spell' : types[enemyIndex % types.length];
  const options = useMemo(() => getChoiceOptions(allWords, target, stageIndex * 100 + enemyIndex * 11 + hit), [allWords, target, stageIndex, enemyIndex, hit]);
  const prompt = type === 'spell' ? `依照順序拼出「${target.chinese}」` : type === 'listen' ? '聽聲音，選出正確的英文單字' : `哪一個英文單字是「${target.chinese}」？`;
  const xpForNext = 40;

  return (
    <div className={`word-quest wq-${config.profileKey} wq-battle${feedback === 'wrong' ? ' is-hit' : ''}${feedback === 'correct' ? ' is-attacking' : ''}`} style={{ '--wq-accent': config.accent, '--wq-dark': config.dark, '--wq-sky': config.sky, '--stage-color': stage.color }} data-testid="word-quest-battle">
      <GameHeader config={config} level={level} hp={heroHp} maxHp={maxHp} gold={gold} mastered={mastered} total={total} onMap={onMap} />
      <main className="wq-battle-main">
        <section className="wq-battlefield">
          <div className="wq-battle-sky"><i /><i /><i /><i /></div>
          <div className="wq-enemy-panel">
            <div className="wq-nameplate"><span>{isBoss ? 'BOSS' : `ENEMY ${enemyIndex + 1}`}</span><b>{isBoss ? `${stage.monster}・王` : stage.monster}</b></div>
            <StatBar label="HP" value={enemyHp} max={enemyMaxHp} tone="enemy" />
          </div>
          <img className={`wq-enemy-sprite wq-enemy-${stage.enemy}`} src={ART[stage.enemy]} alt={stage.monster} />
          <div className="wq-monster-shadow" />
          <div className="wq-hero-panel">
            <div><small>{config.heroTitle}</small><b>{config.hero}</b></div>
            <StatBar label="HP" value={heroHp} max={maxHp} />
            <StatBar label="EXP" value={xp % xpForNext} max={xpForNext} tone="xp" />
          </div>
          <img className="wq-battle-hero" src={feedback === 'correct' ? ART.foxRun : ART.fox} alt={config.hero} />
          <div className="wq-hero-shadow" />
          {feedback === 'correct' && <div className="wq-slash">WORD<br />SLASH!</div>}
          {feedback === 'wrong' && <div className="wq-damage">-1 HP</div>}
        </section>

        <section className="wq-command-panel">
          <div className="wq-battle-log"><span>▶</span><p>{battleLog}</p></div>
          <div className="wq-command-title">
            <div><small>{stage.en} · BATTLE {enemyIndex + 1}/{stage.words.length}</small><h2>{prompt}</h2></div>
            <div className="wq-target-clue">
              <span>{target.emoji || '✦'}</span>
              <div><small>MONSTER WEAKNESS</small><b>{type === 'listen' ? (difficulty === 'rookie' ? `${target.english[0].toUpperCase()}…` : 'LISTEN!') : target.chinese}</b></div>
              <button onClick={() => speak(target.english)} aria-label="播放英文發音">🔊</button>
            </div>
          </div>

          <div className="wq-command-body">
            <aside className="wq-actions">
              <b>勇者指令</b>
              <span className="is-selected">⚔ 單字攻擊</span>
              <button onClick={onPotion} disabled={feedback || potions <= 0 || heroHp >= maxHp}>🧪 回復藥水 <em>×{potions}</em></button>
              <button onClick={() => speak(target.english)}>🔊 再聽一次</button>
              <button onClick={onMap}>🗺 暫停冒險</button>
            </aside>
            <div className="wq-challenge">
              {type === 'spell'
                ? <SpellChallenge key={`${target.id}-${hit}`} target={target} seed={target.id + hit * 19} difficulty={difficulty} onAnswer={onAnswer} disabled={Boolean(feedback)} />
                : <ChoiceChallenge options={options} target={target} type={type} onAnswer={onAnswer} disabled={Boolean(feedback)} />}
            </div>
          </div>

          {feedback && (
            <div className={`wq-feedback wq-feedback-${feedback}`} role="status">
              <span>{feedback === 'correct' ? '⚔️' : '🛡️'}</span>
              <div><b>{feedback === 'correct' ? `命中弱點：${target.english.toUpperCase()}！` : '怪物反擊！勇者失去 1 HP。'}</b><small>{feedback === 'correct' ? `${target.english} = ${target.chinese}` : `正確答案不是剛才那一個，再看一次提示。`}</small></div>
              <button onClick={feedback === 'correct' ? onContinue : onRetry}>{feedback === 'correct' ? (enemyHp > 1 ? '繼續攻擊' : '收下戰利品') : '重新出招'} →</button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function VictoryScreen({ config, chapter, stageIndex, gold, xp, isFinal, onContinue, onReplay }) {
  return (
    <div className={`word-quest wq-${config.profileKey} wq-victory`} style={{ '--wq-accent': config.accent, '--wq-dark': config.dark, '--wq-sky': config.sky, '--stage-color': chapter.color }}>
      <div className="wq-victory-rays" />
      <p className="wq-eyebrow">STAGE CLEAR!</p>
      <div className="wq-treasure">🎁<i>✦</i><i>✦</i><i>✦</i></div>
      <h1>{chapter.name}<br /><em>討伐成功</em></h1>
      <p>四張單字卡化為光芒，打開了通往下一座城鎮的道路！</p>
      <div className="wq-reward-grid"><span><small>勇者經驗</small><b>EXP {xp}</b></span><span><small>目前金幣</small><b>🪙 {gold}</b></span><span><small>寶箱補給</small><b>🧪 +1</b></span></div>
      <button className="wq-primary" onClick={onContinue}>{isFinal ? '迎接王國黎明' : `前往第 ${stageIndex + 2} 區`} <span>▶</span></button>
      <button className="wq-text-button" onClick={onReplay}>再戰一次</button>
    </div>
  );
}

function DefeatScreen({ config, chapter, onRetry, onMap }) {
  return (
    <div className={`word-quest wq-${config.profileKey} wq-defeat`} style={{ '--wq-accent': config.accent, '--wq-dark': config.dark, '--wq-sky': config.sky }}>
      <img src={ART.fox} alt="休息中的勇者" />
      <p className="wq-eyebrow">THE QUEST CONTINUES</p>
      <h1>勇者需要<br /><em>休息一下</em></h1>
      <div className="wq-story-box"><span>{chapter.name}的營火</span><p>答錯不是失敗，是找到下一次會答對的線索。補滿 HP 後再挑戰吧！</p></div>
      <button className="wq-primary" onClick={onRetry}>在營火旁復活 <span>♥</span></button>
      <button className="wq-text-button" onClick={onMap}>先回世界地圖</button>
    </div>
  );
}

function FinaleScreen({ config, mastered, total, gold, level, onNewGame, onMap }) {
  return (
    <div className={`word-quest wq-${config.profileKey} wq-finale`} style={{ '--wq-accent': config.accent, '--wq-dark': config.dark, '--wq-sky': config.sky }}>
      <div className="wq-victory-rays" />
      <div className="wq-crown">♛</div>
      <p className="wq-eyebrow">QUEST COMPLETE · TRUE HERO</p>
      <h1>{config.world}<br /><em>重現光明</em></h1>
      <p>{config.hero}用英文單字擊敗了最後的魔王。每一個學會的單字，都已成為勇者真正的力量！</p>
      <div className="wq-finale-party"><img src={ART.deer} alt="小鹿夥伴" /><img className="hero" src={ART.foxRun} alt={config.hero} /><img src={ART.dinosaur} alt="恐龍夥伴" /><img className="dragon" src={ART.dragon} alt="被淨化的龍" /></div>
      <div className="wq-reward-grid"><span><small>勇者等級</small><b>LV {level}</b></span><span><small>單字圖鑑</small><b>{mastered} / {total}</b></span><span><small>冒險金幣</small><b>🪙 {gold}</b></span></div>
      <div className="wq-finale-actions"><button className="wq-primary" onClick={onNewGame}>開啟二周目 <span>↻</span></button><button className="wq-text-button" onClick={onMap}>回世界地圖</button></div>
    </div>
  );
}

export default function WordQuestRPG({ variant, words }) {
  const config = GAME_CONFIGS[variant];
  const storageKey = `runku_word_quest_${config.profileKey}_v${SAVE_VERSION}`;
  const saved = useMemo(() => readProgress(storageKey), [storageKey]);
  const [screen, setScreen] = useState('intro');
  const [difficulty, setDifficulty] = useState(saved?.difficulty || 'rookie');
  const [runSeed, setRunSeed] = useState(saved?.runSeed || 1);
  const [unlocked, setUnlocked] = useState(saved?.unlocked || 0);
  const [completed, setCompleted] = useState(saved?.completed || []);
  const [masteredIds, setMasteredIds] = useState(saved?.masteredIds || []);
  const [xp, setXp] = useState(saved?.xp || 0);
  const [gold, setGold] = useState(saved?.gold || 0);
  const [potions, setPotions] = useState(saved?.potions ?? 3);
  const [stageIndex, setStageIndex] = useState(0);
  const [enemyIndex, setEnemyIndex] = useState(0);
  const [enemyHp, setEnemyHp] = useState(1);
  const [hit, setHit] = useState(0);
  const [heroHp, setHeroHp] = useState(() => 5 + Math.floor(Math.floor((saved?.xp || 0) / 40) / 2));
  const [feedback, setFeedback] = useState(null);
  const [battleLog, setBattleLog] = useState('怪物出現了！選擇正確單字發動攻擊。');

  const campaign = useMemo(() => buildCampaign(words, config.chapters, runSeed), [words, config.chapters, runSeed]);
  const level = 1 + Math.floor(xp / 40);
  const maxHp = 5 + Math.floor((level - 1) / 2);
  const hasProgress = unlocked > 0 || completed.length > 0 || masteredIds.length > 0 || xp > 0;

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ version: SAVE_VERSION, difficulty, runSeed, unlocked, completed, masteredIds, xp, gold, potions }));
    } catch {
      // The game remains playable for the current visit without persistence.
    }
  }, [storageKey, difficulty, runSeed, unlocked, completed, masteredIds, xp, gold, potions]);

  const enterStage = (index) => {
    setStageIndex(index);
    setEnemyIndex(0);
    setEnemyHp(1);
    setHit(0);
    setHeroHp(maxHp);
    setFeedback(null);
    setBattleLog(`${campaign[index].monster}擋住去路！用單字之劍迎戰吧。`);
    setScreen('battle');
  };

  const answer = (value) => {
    if (feedback) return;
    const target = campaign[stageIndex].words[enemyIndex];
    if (value.toLowerCase().replace(/\s+/g, '') === target.english.toLowerCase().replace(/\s+/g, '')) {
      setFeedback('correct');
      setBattleLog(`攻擊命中！${target.english.toUpperCase()} 的力量正在發光。`);
      speak(target.english);
    } else {
      const nextHp = heroHp - 1;
      setHeroHp(nextHp);
      setBattleLog('怪物看穿了招式並發動反擊！別急，再觀察一次弱點。');
      if (nextHp <= 0) setScreen('defeat');
      else setFeedback('wrong');
    }
  };

  const continueBattle = () => {
    const stage = campaign[stageIndex];
    const target = stage.words[enemyIndex];
    const isBoss = enemyIndex === stage.words.length - 1;
    if (enemyHp > 1) {
      setEnemyHp(enemyHp - 1);
      setHit(hit + 1);
      setFeedback(null);
      setBattleLog(`${stage.monster}還沒倒下！改用拼字斬完成第二擊。`);
      return;
    }

    const firstMastery = !masteredIds.includes(target.id);
    if (firstMastery) setMasteredIds((current) => [...current, target.id]);
    setXp((current) => current + (isBoss ? 20 : 12));
    setGold((current) => current + (isBoss ? 30 : 10));

    if (enemyIndex < stage.words.length - 1) {
      const nextEnemy = enemyIndex + 1;
      const nextIsBoss = nextEnemy === stage.words.length - 1;
      setEnemyIndex(nextEnemy);
      setEnemyHp(nextIsBoss ? 2 : 1);
      setHit(0);
      setFeedback(null);
      setBattleLog(nextIsBoss ? `警告！${stage.monster}・王現身了，首領需要兩次正確攻擊！` : `獲得 ${isBoss ? 30 : 10} 金幣！下一隻怪物靠近了。`);
      return;
    }

    setCompleted((current) => current.includes(stageIndex) ? current : [...current, stageIndex]);
    setUnlocked((current) => Math.max(current, Math.min(stageIndex + 1, campaign.length - 1)));
    setPotions((current) => Math.min(5, current + 1));
    setScreen('victory');
    setEnemyHp(1);
    setFeedback(null);
  };

  const usePotion = () => {
    if (potions <= 0 || heroHp >= maxHp || feedback) return;
    setPotions((current) => current - 1);
    setHeroHp((current) => Math.min(maxHp, current + 2));
    setBattleLog('勇者使用回復藥水，HP 恢復了！');
  };

  const newRun = () => {
    setRunSeed((current) => current + 1);
    setUnlocked(0);
    setCompleted([]);
    setXp(0);
    setGold(0);
    setPotions(3);
    setHeroHp(5);
    setScreen('map');
  };

  if (screen === 'intro') return <IntroScreen config={config} wordCount={words.length} hasProgress={hasProgress} difficulty={difficulty} onDifficulty={setDifficulty} onStart={() => setScreen('map')} onNewGame={newRun} />;
  if (screen === 'battle') {
    const isBoss = enemyIndex === campaign[stageIndex].words.length - 1;
    return <BattleScreen config={config} campaign={campaign} stageIndex={stageIndex} enemyIndex={enemyIndex} enemyHp={enemyHp} enemyMaxHp={isBoss ? 2 : 1} heroHp={heroHp} maxHp={maxHp} potions={potions} level={level} xp={xp} gold={gold} mastered={masteredIds.length} total={words.length} difficulty={difficulty} hit={hit} feedback={feedback} battleLog={battleLog} allWords={words} onAnswer={answer} onContinue={continueBattle} onRetry={() => setFeedback(null)} onPotion={usePotion} onMap={() => setScreen('map')} />;
  }
  if (screen === 'defeat') return <DefeatScreen config={config} chapter={campaign[stageIndex]} onRetry={() => { setHeroHp(maxHp); setFeedback(null); setScreen('battle'); }} onMap={() => setScreen('map')} />;
  if (screen === 'victory') return <VictoryScreen config={config} chapter={campaign[stageIndex]} stageIndex={stageIndex} gold={gold} xp={xp} isFinal={stageIndex === campaign.length - 1} onContinue={() => setScreen(stageIndex === campaign.length - 1 ? 'finale' : 'map')} onReplay={() => enterStage(stageIndex)} />;
  if (screen === 'finale') return <FinaleScreen config={config} mastered={masteredIds.length} total={words.length} gold={gold} level={level} onNewGame={newRun} onMap={() => setScreen('map')} />;
  return <MapScreen config={config} campaign={campaign} unlocked={unlocked} completed={completed} mastered={masteredIds.length} total={words.length} level={level} hp={heroHp} maxHp={maxHp} gold={gold} onEnter={enterStage} onIntro={() => setScreen('intro')} onNewRun={newRun} />;
}
