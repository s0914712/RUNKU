import { useEffect, useMemo, useState } from 'react';
import sparkitArt from '../../assets/creatures/sparkit.webp';
import fernhornArt from '../../assets/creatures/fernhorn.webp';
import tidekipArt from '../../assets/creatures/tidekip.webp';
import cinderwingArt from '../../assets/creatures/cinderwing.webp';
import skyhareArt from '../../assets/creatures/skyhare.webp';
import mosscubArt from '../../assets/creatures/mosscub.webp';
import pearlrayArt from '../../assets/creatures/pearlray.webp';
import lavahootArt from '../../assets/creatures/lavahoot.webp';
import './SisterCardQuest.css';

const BEASTS = [
  {
    id: 'sparkit',
    name: '閃尾',
    en: 'SPARKIT',
    element: 'spark',
    type: '雷光系',
    elementEn: 'ELECTRIC',
    symbol: 'ϟ',
    art: sparkitArt,
    hp: 8,
    power: 72,
    skill: 'THUNDER WORD',
    skillZh: '雷光單字閃',
    flavor: '牠會把剛學會的單字存進閃電尾巴。',
    flavorEn: 'New words shine inside its lightning tail.',
  },
  {
    id: 'fernhorn',
    name: '芽角',
    en: 'FERNHORN',
    element: 'forest',
    type: '森芽系',
    elementEn: 'FOREST',
    symbol: '❧',
    art: fernhornArt,
    hp: 9,
    power: 66,
    skill: 'LEAF LEXICON',
    skillZh: '森羅字典葉',
    flavor: '每記住一個意思，鹿角就會長出新芽。',
    flavorEn: 'Every meaning it remembers grows a fresh leaf.',
  },
  {
    id: 'tidekip',
    name: '泡鰭',
    en: 'TIDEKIP',
    element: 'tide',
    type: '潮汐系',
    elementEn: 'TIDE',
    symbol: '≋',
    art: tidekipArt,
    hp: 10,
    power: 61,
    skill: 'TIDAL TALK',
    skillZh: '潮聲連連看',
    flavor: '牠能從水波中聽見最清楚的英文發音。',
    flavorEn: 'It hears clear English inside every ripple.',
  },
  {
    id: 'cinderwing',
    name: '燼羽',
    en: 'CINDERWING',
    element: 'ember',
    type: '焰羽系',
    elementEn: 'EMBER',
    symbol: '✦',
    art: cinderwingArt,
    hp: 8,
    power: 78,
    skill: 'BLAZE SPELL',
    skillZh: '熾焰拼字術',
    flavor: '正確拼出單字時，翅膀會綻放成火花。',
    flavorEn: 'Correct spelling makes its small wings glow.',
  },
  {
    id: 'skyhare',
    name: '霆耳',
    en: 'SKYHARE',
    element: 'spark',
    type: '雷光系',
    elementEn: 'ELECTRIC',
    symbol: 'ϟ',
    art: skyhareArt,
    hp: 9,
    power: 69,
    skill: 'QUICK RESPONSE',
    skillZh: '霆空快答',
    flavor: '長耳能接住遠方傳來的每一個英文音節。',
    flavorEn: 'Its cloud ears catch every English sound.',
  },
  {
    id: 'mosscub',
    name: '苔甲',
    en: 'MOSSCUB',
    element: 'forest',
    type: '森芽系',
    elementEn: 'FOREST',
    symbol: '❧',
    art: mosscubArt,
    hp: 11,
    power: 58,
    skill: 'ROOT ARMOR',
    skillZh: '苔甲守護',
    flavor: '慢慢讀懂句子，苔甲就會變得更堅固。',
    flavorEn: 'Reading each sentence makes its armor strong.',
  },
  {
    id: 'pearlray',
    name: '珠翼',
    en: 'PEARLRAY',
    element: 'tide',
    type: '潮汐系',
    elementEn: 'TIDE',
    symbol: '≋',
    art: pearlrayArt,
    hp: 9,
    power: 70,
    skill: 'SPLASH PHRASE',
    skillZh: '珠浪片語',
    flavor: '牠把新片語串成閃亮的珍珠水環。',
    flavorEn: 'New phrases become a bright ring of pearls.',
  },
  {
    id: 'lavahoot',
    name: '熔梟',
    en: 'LAVAHOOT',
    element: 'ember',
    type: '焰羽系',
    elementEn: 'EMBER',
    symbol: '✦',
    art: lavahootArt,
    hp: 8,
    power: 80,
    skill: 'EMBER ECHO',
    skillZh: '熔火回音',
    flavor: '勇敢念出英文，熔梟就會回應一圈火光。',
    flavorEn: 'Speak with courage and its embers answer.',
  },
];

const ADVANTAGE = {
  spark: 'tide',
  tide: 'ember',
  ember: 'forest',
  forest: 'spark',
};

const ELEMENT_LABEL = {
  spark: '雷克潮',
  tide: '潮克焰',
  ember: '焰克森',
  forest: '森克雷',
};

function seededShuffle(items, seed) {
  const output = [...items];
  let value = seed + 53;
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
  utterance.rate = 0.74;
  utterance.pitch = 1.04;
  const voice = window.speechSynthesis.getVoices().find((item) => item.lang.startsWith('en'));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

function getOptions(words, target, seed) {
  const others = seededShuffle(words.filter((word) => word.id !== target.id), seed + target.id).slice(0, 3);
  return seededShuffle([target, ...others], seed + target.english.length);
}

function readRecords() {
  try {
    const saved = JSON.parse(window.localStorage.getItem('runku_sister_card_quest_v1'));
    if (saved && Array.isArray(saved.mastered)) return saved;
  } catch {
    // Start a fresh collection if storage is unavailable.
  }
  return { wins: 0, mastered: [] };
}

function CreatureCard({ beast, selected = false, compact = false, faceDown = false, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={`cq-card cq-${beast.element}${selected ? ' is-selected' : ''}${compact ? ' is-compact' : ''}${faceDown ? ' is-facedown' : ''}`}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      aria-pressed={onClick ? selected : undefined}
      data-beast={beast.id}
    >
      {faceDown ? (
        <div className="cq-card-back"><span>✦</span><b>LEXIBEAST</b><small>WORD CARD</small></div>
      ) : (
        <>
          <div className="cq-card-top"><span>NO. {String(BEASTS.findIndex((item) => item.id === beast.id) + 1).padStart(3, '0')}</span><b>{beast.elementEn}</b><i>{beast.symbol}</i></div>
          <div className="cq-card-art"><img src={beast.art} alt={`${beast.name} ${beast.en}`} /><span>AI ORIGINAL ART</span></div>
          <div className="cq-card-name"><div><small>{beast.name} · {beast.type}</small><h3>{beast.en}</h3></div><b><small>HP</small>{beast.hp}</b></div>
          <div className="cq-card-skill"><span>{beast.symbol}</span><div><em>ENGLISH SKILL</em><b>{beast.skill}</b><small>{beast.skillZh}</small></div><strong>{beast.power}</strong></div>
          {!compact && <div className="cq-card-flavor"><b>ENGLISH STORY</b><p>{beast.flavorEn}</p><small>{beast.flavor}</small></div>}
          <footer><span>ENGLISH WORD CARD</span><i>{beast.symbol} {ELEMENT_LABEL[beast.element]}</i></footer>
          {selected && <div className="cq-selected-stamp">IN DECK<small>已加入牌組</small></div>}
        </>
      )}
    </Tag>
  );
}

function Intro({ records, wordCount, onStart }) {
  return (
    <div className="card-quest cq-intro">
      <section className="cq-intro-copy">
        <p className="cq-eyebrow">SISTER EXCLUSIVE · ORIGINAL CARD GAME</p>
        <h1>星獸單字<br /><em>卡牌戰</em></h1>
        <p className="cq-title-en">LEXIBEAST · WORD CARD ARENA</p>
        <div className="cq-professor-note">
          <span>✦</span>
          <p><b>星獸研究員的委託</b>正確的英文單字會變成能量！打開卡包、組成兩張星獸牌，運用屬性相剋贏得對戰。</p>
        </div>
        <div className="cq-feature-row">
          <span><b>{BEASTS.length}</b><small>原創星獸</small></span>
          <span><b>{wordCount}</b><small>姊姊單字</small></span>
          <span><b>{records.wins}</b><small>競技場勝場</small></span>
        </div>
        <button className="cq-main-button" onClick={onStart}>開啟星光卡包 <span>✦</span></button>
        <p className="cq-safe-note">原創角色與世界觀・沒有付費抽卡・可以無限重玩</p>
      </section>

      <section className="cq-intro-showcase" aria-label="八張卡牌中的四張新星獸卡">
        <div className="cq-holo-orbit" />
        {BEASTS.slice(-4).map((beast, index) => <div className={`cq-fan cq-fan-${index + 1}`} key={beast.id}><CreatureCard beast={beast} compact /></div>)}
        <div className="cq-arena-mark"><span>LEXI</span><b>★</b><span>BEAST</span></div>
      </section>
    </div>
  );
}

function PackBuilder({ opened, selected, onOpen, onSelect, onBattle, onBack }) {
  return (
    <div className="card-quest cq-pack-screen">
      <header className="cq-game-header"><button onClick={onBack}>← 卡牌研究室</button><div><b>LEXIBEAST LAB</b><small>姊姊的星獸卡牌研究室</small></div><span>{selected.length} / 2 DECK</span></header>
      {!opened ? (
        <main className="cq-pack-opening">
          <p className="cq-eyebrow">NEW BOOSTER · CARD PACK</p>
          <h2>今天會遇見<br />哪一隻星獸？</h2>
          <button className="cq-booster" onClick={onOpen} aria-label="撕開星光卡包">
            <i /><i /><div><span>✦</span><b>LEXIBEAST</b><small>FIRST LIGHT PACK</small><em>{BEASTS.length} ORIGINAL CREATURE CARDS</em></div>
          </button>
          <p>點一下卡包，撕開封印！</p>
        </main>
      ) : (
        <main className="cq-deck-builder">
          <div className="cq-builder-heading"><div><p className="cq-eyebrow">{BEASTS.length} CARDS DISCOVERED!</p><h2>從八張卡選兩隻組隊</h2><p>Read the English name and skill · 雷 → 潮 → 焰 → 森 → 雷</p></div><div className="cq-deck-slots"><span className={selected[0] ? 'has-card' : ''}>{selected[0] ? BEASTS.find((item) => item.id === selected[0]).symbol : '1'}</span><i>+</i><span className={selected[1] ? 'has-card' : ''}>{selected[1] ? BEASTS.find((item) => item.id === selected[1]).symbol : '2'}</span></div></div>
          <div className="cq-card-grid">
            {BEASTS.map((beast, index) => (
              <div className="cq-reveal" style={{ '--reveal-delay': `${index * 120}ms` }} key={beast.id}>
                <CreatureCard beast={beast} selected={selected.includes(beast.id)} onClick={() => onSelect(beast.id)} />
              </div>
            ))}
          </div>
          <button className="cq-main-button" disabled={selected.length !== 2} onClick={onBattle}>帶著牌組出戰 <span>⚔</span></button>
        </main>
      )}
    </div>
  );
}

function BattleBar({ label, value, max, enemy = false }) {
  return <div className={`cq-hp${enemy ? ' is-enemy' : ''}`}><div><b>{label}</b><span>{value} / {max}</span></div><i><span style={{ width: `${Math.max(0, value / max) * 100}%` }} /></i></div>;
}

function Battle({ words, team, activeId, enemyId, round, playerHp, enemyHp, feedback, log, mastered, wins, onAnswer, onContinue, onSwitch, onSpeak, onLeave }) {
  const active = BEASTS.find((beast) => beast.id === activeId);
  const enemy = BEASTS.find((beast) => beast.id === enemyId);
  const bench = BEASTS.find((beast) => beast.id === team.find((id) => id !== activeId));
  const quizWords = useMemo(() => seededShuffle(words, 2026 + wins * 17), [words, wins]);
  const target = quizWords[round % quizWords.length];
  const type = ['translation', 'listen', 'meaning'][round % 3];
  const options = useMemo(() => getOptions(words, target, round * 31 + wins), [words, target, round, wins]);
  const advantage = ADVANTAGE[active.element] === enemy.element;
  const enemyAdvantage = ADVANTAGE[enemy.element] === active.element;
  const instruction = type === 'listen' ? '聽發音，打出正確的英文卡' : type === 'meaning' ? `「${target.english}」是什麼意思？` : `哪一張英文卡是「${target.chinese}」？`;

  return (
    <div className={`card-quest cq-battle${feedback === 'correct' ? ' is-attacking' : ''}${feedback === 'wrong' ? ' is-damaged' : ''}`} data-testid="card-quest-battle">
      <header className="cq-game-header"><button onClick={onLeave}>← 暫停對戰</button><div><b>STARLIGHT ARENA</b><small>姊姊的單字卡牌競技場</small></div><span>WIN {wins} · 📖 {mastered}</span></header>
      <main className="cq-battle-table">
        <section className="cq-duel-field">
          <div className="cq-arena-lines" />
          <div className="cq-opponent-zone">
            <div className="cq-trainer-tag"><span>CPU TRAINER</span><b>星蝕牌手</b></div>
            <BattleBar label={`${enemy.name} HP`} value={enemyHp} max={8} enemy />
            <div className="cq-battle-card cq-enemy-card"><CreatureCard beast={enemy} compact /></div>
          </div>
          <div className="cq-versus">VS<small>TURN {round + 1}</small></div>
          <div className="cq-player-zone">
            <div className="cq-trainer-tag"><span>WORD TRAINER</span><b>姊姊</b></div>
            <BattleBar label="牌手 HP" value={playerHp} max={8} />
            <div className="cq-battle-card cq-player-card"><CreatureCard beast={active} compact /></div>
          </div>
          {feedback === 'correct' && <div className="cq-attack-flash">{active.symbol}<b>{advantage ? 'SUPER WORD!' : 'WORD HIT!'}</b></div>}
          {feedback === 'wrong' && <div className="cq-counter-flash">COUNTER!<b>-{enemyAdvantage ? 2 : 1} HP</b></div>}
        </section>

        <section className="cq-command-board">
          <div className="cq-battle-log"><span>▶</span><p>{log}</p></div>
          <div className="cq-question-row">
            <div><small>{type === 'listen' ? 'SOUND CARD' : type === 'meaning' ? 'MEANING CARD' : 'WORD CARD'} · TURN {round + 1}</small><h2>{instruction}</h2></div>
            <button className="cq-sound-button" onClick={() => onSpeak(target.english)}><span>🔊</span><small>{type === 'listen' ? 'PLAY SOUND' : target.english}</small></button>
          </div>
          <div className="cq-command-layout">
            <aside className="cq-deck-panel">
              <b>ACTIVE BEAST</b>
              <span className={`cq-type-pill cq-${active.element}`}>{active.symbol} {active.type}</span>
              <small>{advantage ? '屬性有利：攻擊 +1' : enemyAdvantage ? '屬性不利：反擊 +1' : '屬性普通'}</small>
              <button onClick={() => onSwitch(bench.id)} disabled={Boolean(feedback)}><img src={bench.art} alt="" /><span>交換主將<br /><b>{bench.name}</b></span></button>
            </aside>
            <div className="cq-word-hand">
              {options.map((word, index) => (
                <button key={word.id} onClick={() => onAnswer(word.id, target, active, enemy)} disabled={Boolean(feedback)} data-correct={word.id === target.id ? 'true' : 'false'}>
                  <small>CARD 0{index + 1}</small><span>{word.emoji || '✦'}</span><b>{type === 'meaning' ? word.chinese : word.english}</b>{type !== 'listen' && <em>{type === 'meaning' ? word.english : word.chinese}</em>}
                </button>
              ))}
            </div>
          </div>
          {feedback && (
            <div className={`cq-feedback cq-feedback-${feedback}`} role="status">
              <span>{feedback === 'correct' ? active.symbol : '↻'}</span>
              <div><b>{feedback === 'correct' ? `${target.english.toUpperCase()} 發動成功！` : '差一點，對手發動反擊！'}</b><small>{feedback === 'correct' ? `${target.english} = ${target.chinese}` : '看看圖案與意思，再選一次就會記住。'}</small></div>
              <button onClick={onContinue}>{feedback === 'correct' && enemyHp <= 0 ? '收下勝利卡' : feedback === 'wrong' && playerHp <= 0 ? '回研究室休息' : '下一回合'} →</button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Result({ won, beast, wins, mastered, total, onReplay, onHome }) {
  return (
    <div className={`card-quest cq-result ${won ? 'is-victory' : 'is-defeat'}`}>
      <div className="cq-result-rays" />
      <p className="cq-eyebrow">{won ? 'ARENA VICTORY · RARE REWARD' : 'TRAINING COMPLETE · TRY AGAIN'}</p>
      <div className="cq-reward-card"><CreatureCard beast={beast} compact /></div>
      <h1>{won ? '單字牌手' : '星獸休息中'}<br /><em>{won ? '勝利！' : '再來一場'}</em></h1>
      <p>{won ? `${beast.name} 和姊姊完成了完美連擊！答對的單字已收入永久圖鑑。` : '每次答錯都會讓下一次的記憶更牢。重新選牌，再挑戰一次吧！'}</p>
      <div className="cq-result-stats"><span><small>競技場勝場</small><b>{wins}</b></span><span><small>單字圖鑑</small><b>{mastered} / {total}</b></span><span><small>獲得徽章</small><b>{won ? '✦ STAR FOIL' : '♡ BRAVE'}</b></span></div>
      <div className="cq-result-actions"><button className="cq-main-button" onClick={onReplay}>再開一包 <span>✦</span></button><button onClick={onHome}>回卡牌封面</button></div>
    </div>
  );
}

export default function SisterCardQuest({ words }) {
  const initialRecords = useMemo(readRecords, []);
  const [screen, setScreen] = useState('intro');
  const [opened, setOpened] = useState(false);
  const [selected, setSelected] = useState([]);
  const [team, setTeam] = useState([]);
  const [activeId, setActiveId] = useState('sparkit');
  const [enemyId, setEnemyId] = useState('tidekip');
  const [round, setRound] = useState(0);
  const [playerHp, setPlayerHp] = useState(8);
  const [enemyHp, setEnemyHp] = useState(8);
  const [feedback, setFeedback] = useState(null);
  const [log, setLog] = useState('選擇正確的單字卡，為星獸充入 WORD CORE！');
  const [wins, setWins] = useState(initialRecords.wins || 0);
  const [mastered, setMastered] = useState(initialRecords.mastered || []);
  const [wonLastBattle, setWonLastBattle] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem('runku_sister_card_quest_v1', JSON.stringify({ wins, mastered }));
    } catch {
      // Keep progress in memory if storage is unavailable.
    }
  }, [wins, mastered]);

  const toggleCard = (id) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 2 ? [...current, id] : [current[1], id]);
  };

  const startBattle = () => {
    const first = BEASTS.find((beast) => beast.id === selected[0]);
    const opponent = BEASTS.find((beast) => beast.element === ADVANTAGE[first.element]) || BEASTS[2];
    setTeam(selected);
    setActiveId(first.id);
    setEnemyId(opponent.id);
    setRound(0);
    setPlayerHp(8);
    setEnemyHp(8);
    setFeedback(null);
    setLog(`${opponent.name}接受挑戰！${first.name}準備發動 ${first.skill}。`);
    setScreen('battle');
  };

  const answer = (pickedId, target, active, enemy) => {
    if (feedback) return;
    if (pickedId === target.id) {
      const damage = ADVANTAGE[active.element] === enemy.element ? 3 : 2;
      setEnemyHp((current) => Math.max(0, current - damage));
      setMastered((current) => current.includes(target.id) ? current : [...current, target.id]);
      setFeedback('correct');
      setLog(`屬性${damage === 3 ? '相剋！' : '能量命中！'} ${active.skill} 造成 ${damage} 點傷害。`);
      speak(target.english);
    } else {
      const enemy = BEASTS.find((beast) => beast.id === enemyId);
      const active = BEASTS.find((beast) => beast.id === activeId);
      const damage = ADVANTAGE[enemy.element] === active.element ? 2 : 1;
      setPlayerHp((current) => Math.max(0, current - damage));
      setFeedback('wrong');
      setLog(`${enemy.name}抓到空檔，反擊造成 ${damage} 點傷害。`);
    }
  };

  const continueTurn = () => {
    if (enemyHp <= 0) {
      setWins((current) => current + 1);
      setWonLastBattle(true);
      setScreen('result');
      setFeedback(null);
      return;
    }
    if (playerHp <= 0) {
      setWonLastBattle(false);
      setScreen('result');
      setFeedback(null);
      return;
    }
    setRound((current) => current + 1);
    setFeedback(null);
    setLog('下一張單字卡已抽到手中，仔細觀察後再出牌。');
  };

  const replay = () => {
    setOpened(false);
    setSelected([]);
    setScreen('pack');
  };

  if (screen === 'intro') return <Intro records={{ wins, mastered }} wordCount={words.length} onStart={() => setScreen('pack')} />;
  if (screen === 'pack') return <PackBuilder opened={opened} selected={selected} onOpen={() => setOpened(true)} onSelect={toggleCard} onBattle={startBattle} onBack={() => setScreen('intro')} />;
  if (screen === 'battle') return <Battle words={words} team={team} activeId={activeId} enemyId={enemyId} round={round} playerHp={playerHp} enemyHp={enemyHp} feedback={feedback} log={log} mastered={mastered.length} wins={wins} onAnswer={answer} onContinue={continueTurn} onSwitch={(id) => { setActiveId(id); setLog(`${BEASTS.find((beast) => beast.id === id).name}交換上場！屬性關係改變了。`); }} onSpeak={speak} onLeave={() => setScreen('pack')} />;
  const rewardBeast = BEASTS.find((beast) => beast.id === activeId);
  return <Result won={wonLastBattle} beast={rewardBeast} wins={wins} mastered={mastered.length} total={words.length} onReplay={replay} onHome={() => setScreen('intro')} />;
}
