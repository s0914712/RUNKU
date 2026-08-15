import { useMemo, useState } from 'react';
import foxStand from '../../../../sprite/FOX_CHAR/stand.png';
import foxRun from '../../../../sprite/FOX_CHAR/run1.png';
import deerStand from '../../../../sprite/DEER_CHAR/stand.png';
import dinosaurSit from '../../../../sprite/DINOSOUR/sit.png';
import dragonBoss from '../../../../sprite/DRAGON_CHAR/boss.png';
import './SisterAdventure.css';

const CHAPTERS = [
  { cat: 'verbs', no: 'I', name: '疾風動作谷', en: 'VALLEY OF ACTION', icon: '🪁', guide: 'deer', color: '#e96b4e', story: '讓動詞化成風，啟動沉睡的天空風車。' },
  { cat: 'food', no: 'II', name: '月光食材市集', en: 'MOONLIGHT MARKET', icon: '🥕', guide: 'dino', color: '#e3aa3f', story: '找回食材的名字，為旅行隊準備魔法餐盒。' },
  { cat: 'school', no: 'III', name: '雲端知識學院', en: 'SKYWARD ACADEMY', icon: '🏫', guide: 'fox', color: '#4c8d92', story: '打開教室封印，修復遺失的學習頁面。' },
  { cat: 'life', no: 'IV', name: '星燈生活城', en: 'CITY OF STARLIGHT', icon: '🌠', guide: 'dragon', color: '#6d719b', story: '通過生活單字試煉，點亮最高處的星燈。' },
];

const ART = { fox: foxStand, foxRun, deer: deerStand, dino: dinosaurSit, dragon: dragonBoss };

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = .78;
  utterance.pitch = 1.02;
  const voice = window.speechSynthesis.getVoices().find((item) => item.lang.startsWith('en'));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

function seededShuffle(items, seed) {
  const output = [...items];
  let value = seed + 29;
  for (let index = output.length - 1; index > 0; index -= 1) {
    value = (value * 9301 + 49297) % 233280;
    const target = Math.floor((value / 233280) * (index + 1));
    [output[index], output[target]] = [output[target], output[index]];
  }
  return output;
}

function buildMissions(words, seed = 0) {
  return CHAPTERS.map((chapter, index) => ({
    ...chapter,
    words: seededShuffle(words.filter((word) => word.cat === chapter.cat), index * 37 + words.length + seed).slice(0, 4),
  }));
}

function getOptions(allWords, target, chapterIndex, round) {
  const others = allWords.filter((word) => word.english !== target.english);
  return seededShuffle([target, ...seededShuffle(others, chapterIndex * 31 + round).slice(0, 2)], round + target.id);
}

function AdventureTopbar({ stars, found, total, onMap }) {
  return (
    <header className="sa-topbar">
      <button className="sa-brand" onClick={onMap}><span>W</span><div><b>WORDWARD</b><small>姊姊的單字遠征</small></div></button>
      <div className="sa-progress"><small>DISCOVERED WORDS</small><i><span style={{ width: `${total ? (found / total) * 100 : 0}%` }} /></i><b>{found} / {total}</b></div>
      <div className="sa-top-actions"><span>✦ {stars}</span><button onClick={onMap}>遠征地圖</button></div>
    </header>
  );
}

function Intro({ wordCount, onStart }) {
  const [mode, setMode] = useState('mixed');
  return (
    <div className="sister-adventure sa-intro">
      <div className="sa-intro-copy">
        <p className="sa-eyebrow"><span>SISTER’S QUEST</span> 進階單字冒險</p>
        <h1>星光單字<br /><em>遠征隊</em></h1>
        <p className="sa-intro-en">THE WORDWARD EXPEDITION</p>
        <p className="sa-lead">單字王國的四枚羅盤碎片散落了。帶著狐狸夥伴穿越動作谷、市集、學院與星燈城，讓英文再次指引方向。</p>
        <div className="sa-book-facts"><span><b>{wordCount}</b> 個姊姊單字</span><span><b>4</b> 座探索區</span><span><b>16</b> 張遠征卡</span></div>
        <div className="sa-mode" role="radiogroup" aria-label="選擇遠征模式">
          <button className={mode === 'mixed' ? 'is-on' : ''} onClick={() => setMode('mixed')}><b>🧭 綜合遠征</b><small>選擇、聽力與拼字交替</small></button>
          <button className={mode === 'spelling' ? 'is-on' : ''} onClick={() => setMode('spelling')}><b>✒️ 拼字特訓</b><small>更多字母排列挑戰</small></button>
        </div>
        <button className="sa-main-button" onClick={() => onStart(mode)}>打開遠征日誌 <span>→</span></button>
      </div>
      <div className="sa-intro-scene">
        <div className="sa-orbit"><i>BUY</i><i>CLASS</i><i>CHOOSE</i><i>COLOR</i></div>
        <div className="sa-star-map">✦<span>WORD<br />WARD</span></div>
        <img className="sa-intro-fox" src={ART.foxRun} alt="奔跑中的狐狸冒險家" />
        <img className="sa-intro-deer" src={ART.deer} alt="小鹿遠征夥伴" />
        <div className="sa-horizon"><span>♜</span><span>♜</span><span>♜</span></div>
      </div>
    </div>
  );
}

function Map({ missions, unlocked, completed, stars, found, total, onEnter, onReset }) {
  return (
    <div className="sister-adventure sa-map-shell">
      <AdventureTopbar stars={stars} found={found} total={total} onMap={() => {}} />
      <main className="sa-map">
        <div className="sa-map-heading"><p className="sa-eyebrow"><span>EXPEDITION LOG</span> 遠征地圖</p><h2>找回四枚羅盤碎片</h2><p>每區隨機挑選四個姊姊單字；再次遠征會遇到不同題目。</p></div>
        <div className="sa-route">
          {missions.map((mission, index) => {
            const locked = index > unlocked;
            const done = completed.includes(index);
            return (
              <article key={mission.cat} className={`sa-stop${locked ? ' is-locked' : ''}${done ? ' is-done' : ''}`} style={{ '--stop-color': mission.color }}>
                <div className="sa-stop-line"><span>{mission.no}</span><i /></div>
                <div className="sa-stop-card">
                  <div className="sa-stop-art"><b>{mission.icon}</b>{locked ? <span>🔒</span> : <img src={ART[mission.guide]} alt="" />}</div>
                  <small>{mission.en}</small><h3>{mission.name}</h3><p>{mission.story}</p>
                  <div className="sa-preview">{mission.words.map((word) => <span key={word.id}>{locked ? '???' : word.english}</span>)}</div>
                  <button disabled={locked} onClick={() => onEnter(index)}>{locked ? '尚未解鎖' : done ? '重新探索' : '前往這一區'} <b>{!locked && '→'}</b></button>
                </div>
                {done && <strong className="sa-seal">✓<small>CLEAR</small></strong>}
              </article>
            );
          })}
        </div>
        <button className="sa-reset" onClick={onReset}>重新抽取本次遠征單字</button>
      </main>
    </div>
  );
}

function Choice({ target, options, askEnglish, onAnswer }) {
  return (
    <div className="sa-choice-grid">
      {options.map((word, index) => (
        <button key={word.id} onClick={() => onAnswer(word.english)}>
          <small>OPTION 0{index + 1}</small><span>{word.emoji}</span><b>{askEnglish ? word.english : word.chinese}</b>
        </button>
      ))}
    </div>
  );
}

function Spelling({ target, seed, onAnswer }) {
  const letters = useMemo(() => seededShuffle(target.english.toUpperCase().split('').map((letter, index) => ({ letter, id: `${letter}-${index}` })), seed), [target, seed]);
  const [picked, setPicked] = useState([]);
  const used = new Set(picked.map((item) => item.id));
  const answer = picked.map((item) => item.letter).join('').toLowerCase();
  return (
    <div className="sa-spell">
      <div className="sa-slots">{target.english.split('').map((letter, index) => <button key={`${letter}-${index}`} onClick={() => setPicked(picked.filter((_, itemIndex) => itemIndex !== index))}>{picked[index]?.letter || ''}</button>)}</div>
      <div className="sa-letters">{letters.map((item) => <button key={item.id} disabled={used.has(item.id)} onClick={() => setPicked([...picked, item])}>{item.letter}</button>)}</div>
      <button className="sa-cast" disabled={picked.length !== target.english.length} onClick={() => onAnswer(answer)}>確認咒語 ✦</button>
    </div>
  );
}

function Quest({ mission, chapterIndex, allWords, mode, stars, found, total, onMap, onComplete }) {
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const target = mission.words[round];
  const baseType = mode === 'spelling' ? (round === 1 ? 'listen' : 'spell') : ['choice', 'listen', 'spell', 'choice'][round];
  const type = target.english.includes(' ') || target.english.length > 10 ? 'choice' : baseType;
  const options = useMemo(() => getOptions(allWords, target, chapterIndex, round), [allWords, target, chapterIndex, round]);

  const answer = (value) => {
    if (feedback) return;
    if (value === target.english) {
      setFeedback('correct');
      speak(target.english);
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 850);
    }
  };

  const next = () => {
    if (round === mission.words.length - 1) onComplete(chapterIndex, mission.words);
    else { setRound(round + 1); setFeedback(null); }
  };

  return (
    <div className="sister-adventure sa-quest-shell" style={{ '--chapter-color': mission.color }}>
      <AdventureTopbar stars={stars} found={found} total={total} onMap={onMap} />
      <main className="sa-quest">
        <aside>
          <button onClick={onMap}>← 回到遠征地圖</button>
          <div className="sa-guide-card"><img src={ART[mission.guide]} alt="關卡嚮導" /><small>CHAPTER {mission.no}</small><h3>{mission.name}</h3><p>「{mission.story}」</p></div>
          <div className="sa-mission-list">{mission.words.map((word, index) => <span key={word.id} className={index < round ? 'is-done' : index === round ? 'is-current' : ''}><i>{index < round ? '✓' : index + 1}</i>{index <= round ? word.english : 'UNKNOWN'}</span>)}</div>
        </aside>
        <section className="sa-question">
          <div className="sa-question-head"><b>MISSION {round + 1}</b><div>{mission.words.map((word, index) => <i key={word.id} className={index <= round ? 'is-on' : ''} />)}</div><span>{round + 1} / {mission.words.length}</span></div>
          <div className="sa-question-prompt">
            <small>{type === 'listen' ? 'LISTENING CHALLENGE' : type === 'spell' ? 'SPELLING CHALLENGE' : 'WORD CHALLENGE'}</small>
            {type === 'listen' ? (
              <><h2>聽見的是哪個意思？</h2><button className="sa-audio" onClick={() => speak(target.english)}>▶ 播放任務語音</button></>
            ) : type === 'spell' ? (
              <><h2>{target.emoji}「{target.chinese}」怎麼拼？</h2><p>依照順序點選字母，拼出完整英文單字。</p></>
            ) : (
              <><h2>{target.emoji}「{target.chinese}」的英文是？</h2><button className="sa-small-audio" onClick={() => speak(target.english)}>🔊 聽發音</button></>
            )}
          </div>
          <div className={`sa-stage${feedback === 'wrong' ? ' is-wrong' : ''}`}>
            {type === 'spell'
              ? <Spelling key={target.id} target={target} seed={target.id + round} onAnswer={answer} />
              : <Choice target={target} options={options} askEnglish={type !== 'listen'} onAnswer={answer} />}
          </div>
          {feedback === 'wrong' && <div className="sa-wrong">↻ 差一點，看看圖案與意思，再試一次！</div>}
          {feedback === 'correct' && (
            <div className="sa-found-overlay"><div className="sa-found-card"><small>EXPEDITION WORD</small><span>{target.emoji}</span><h2>{target.english}</h2><p>{target.chinese}</p>{target.note && <em>{target.note}</em>}<b>✦ +1</b><button onClick={next}>{round === mission.words.length - 1 ? '收下羅盤碎片' : '記入遠征日誌'} →</button></div></div>
          )}
        </section>
      </main>
    </div>
  );
}

function Finale({ stars, found, total, onReplay, onMap }) {
  return (
    <div className="sister-adventure sa-finale-shell">
      <AdventureTopbar stars={stars} found={found} total={total} onMap={onMap} />
      <main className="sa-finale">
        <div className="sa-compass">✦</div><p className="sa-eyebrow"><span>EXPEDITION COMPLETE</span> 遠征完成</p><h1>星光單字<br /><em>領航員</em></h1>
        <p>四枚羅盤碎片再次合而為一。姊姊已完成本次 16 個單字任務，下一次遠征還會遇見新的字！</p>
        <div className="sa-finale-party"><img src={ART.deer} alt="小鹿" /><img src={ART.fox} alt="狐狸" /><img src={ART.dino} alt="恐龍" /><img className="is-dragon" src={ART.dragon} alt="三首龍" /></div>
        <div className="sa-final-stats"><span><small>找到單字</small><b>{found} / {total}</b></span><span><small>遠征星光</small><b>✦ {stars}</b></span><span><small>獲得稱號</small><b>WORD GUIDE</b></span></div>
        <div className="sa-final-actions"><button className="sa-main-button" onClick={onReplay}>抽取新任務 <span>↻</span></button><button onClick={onMap}>查看地圖</button></div>
      </main>
    </div>
  );
}

export default function SisterAdventure({ words }) {
  const [screen, setScreen] = useState('intro');
  const [mode, setMode] = useState('mixed');
  const [missions, setMissions] = useState(() => buildMissions(words, 1));
  const [chapter, setChapter] = useState(0);
  const [unlocked, setUnlocked] = useState(0);
  const [completed, setCompleted] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [stars, setStars] = useState(0);
  const total = missions.reduce((sum, mission) => sum + mission.words.length, 0);

  const start = (selectedMode) => { setMode(selectedMode); setScreen('map'); };
  const reset = () => { setMissions(buildMissions(words, Date.now())); setUnlocked(0); setCompleted([]); setFoundWords([]); setStars(0); setScreen('intro'); };
  const finish = (index, discovered) => {
    const isReplay = completed.includes(index);
    setFoundWords((current) => {
      const byId = new globalThis.Map([...current, ...discovered].map((word) => [word.id, word]));
      return [...byId.values()];
    });
    if (!isReplay) setStars((current) => current + discovered.length);
    setCompleted((current) => current.includes(index) ? current : [...current, index]);
    setUnlocked((current) => Math.max(current, Math.min(index + 1, missions.length - 1)));
    setScreen(index === missions.length - 1 ? 'finale' : 'map');
  };

  if (screen === 'intro') return <Intro wordCount={words.length} onStart={start} />;
  if (screen === 'quest') return <Quest key={`${chapter}-${completed.includes(chapter)}`} mission={missions[chapter]} chapterIndex={chapter} allWords={words} mode={mode} stars={stars} found={foundWords.length} total={total} onMap={() => setScreen('map')} onComplete={finish} />;
  if (screen === 'finale') return <Finale stars={stars} found={foundWords.length} total={total} onReplay={reset} onMap={() => setScreen('map')} />;
  return <Map missions={missions} unlocked={unlocked} completed={completed} stars={stars} found={foundWords.length} total={total} onEnter={(index) => { setChapter(index); setScreen('quest'); }} onReset={reset} />;
}
