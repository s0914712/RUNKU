import { useEffect, useMemo, useState } from 'react';
import sparkitArt from '../../assets/creatures/sparkit.webp';
import fernhornArt from '../../assets/creatures/fernhorn.webp';
import tidekipArt from '../../assets/creatures/tidekip.webp';
import cinderwingArt from '../../assets/creatures/cinderwing.webp';
import skyhareArt from '../../assets/creatures/skyhare.webp';
import mosscubArt from '../../assets/creatures/mosscub.webp';
import pearlrayArt from '../../assets/creatures/pearlray.webp';
import lavahootArt from '../../assets/creatures/lavahoot.webp';
import stormothArt from '../../assets/creatures/stormoth.webp';
import bloomtoadArt from '../../assets/creatures/bloomtoad.webp';
import frostfinArt from '../../assets/creatures/frostfin.webp';
import sunroarArt from '../../assets/creatures/sunroar.webp';
import cloudrakeArt from '../../assets/creatures/cloudrake.webp';
import acornyxArt from '../../assets/creatures/acornyx.webp';
import coraliskArt from '../../assets/creatures/coralisk.webp';
import coalpupArt from '../../assets/creatures/coalpup.webp';
import neonibisArt from '../../assets/creatures/neonibis.webp';
import vinekoiArt from '../../assets/creatures/vinekoi.webp';
import moonjellyArt from '../../assets/creatures/moonjelly.webp';
import flarebeetleArt from '../../assets/creatures/flarebeetle.webp';
import rotogeckoArt from '../../assets/creatures/rotogecko.webp';
import cedarooArt from '../../assets/creatures/cedaroo.webp';
import riverwispArt from '../../assets/creatures/riverwisp.webp';
import cinnaminkArt from '../../assets/creatures/cinnamink.webp';
import starstagArt from '../../assets/creatures/starstag.webp';
import mycomoleArt from '../../assets/creatures/mycomole.webp';
import shellarkArt from '../../assets/creatures/shellark.webp';
import phoenixelArt from '../../assets/creatures/phoenixel.webp';
import zappuffArt from '../../assets/creatures/zappuff.webp';
import orchidrakeArt from '../../assets/creatures/orchidrake.webp';
import './SisterCardQuest.css';

export const BEASTS = [
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
  {
    id: 'stormoth',
    name: '雷蛾',
    en: 'STORMOTH',
    element: 'spark',
    type: '雷光系',
    elementEn: 'ELECTRIC',
    symbol: 'ϟ',
    art: stormothArt,
    hp: 9,
    power: 76,
    skill: 'MOON VOLT',
    skillZh: '月雷閃翼',
    flavor: '每讀對一個字，翅膀就會多亮一道金色電紋。',
    flavorEn: 'Every correct word lights a golden wing line.',
  },
  {
    id: 'bloomtoad',
    name: '花躍',
    en: 'BLOOMTOAD',
    element: 'forest',
    type: '森芽系',
    elementEn: 'FOREST',
    symbol: '❧',
    art: bloomtoadArt,
    hp: 12,
    power: 60,
    skill: 'PETAL BOUNCE',
    skillZh: '花瓣彈跳',
    flavor: '牠會用花瓣替每個新學會的單字鼓掌。',
    flavorEn: 'Its petals clap for every new English word.',
  },
  {
    id: 'frostfin',
    name: '霜鰭',
    en: 'FROSTFIN',
    element: 'tide',
    type: '潮汐系',
    elementEn: 'TIDE',
    symbol: '≋',
    art: frostfinArt,
    hp: 11,
    power: 67,
    skill: 'AURORA WAVE',
    skillZh: '極光冰浪',
    flavor: '清楚念出英文時，極光會在冰浪上跳舞。',
    flavorEn: 'Clear English makes the aurora dance on ice.',
  },
  {
    id: 'sunroar',
    name: '陽吼',
    en: 'SUNROAR',
    element: 'ember',
    type: '焰羽系',
    elementEn: 'EMBER',
    symbol: '✦',
    art: sunroarArt,
    hp: 10,
    power: 83,
    skill: 'SOLAR ROAR',
    skillZh: '日輪咆哮',
    flavor: '勇敢答題會讓牠的太陽鬃毛變得又大又亮。',
    flavorEn: 'Brave answers make its solar mane shine.',
  },
  {
    id: 'cloudrake', name: '雲爪', en: 'CLOUDRAKE', element: 'spark', type: '雷光系', elementEn: 'ELECTRIC', symbol: 'ϟ', art: cloudrakeArt,
    hp: 10, power: 74, skill: 'CLOUD CURRENT', skillZh: '雲流電爪',
    flavor: '牠在雲島間追逐每一個響亮的英文音節。', flavorEn: 'It chases bright English sounds between cloud islands.',
  },
  {
    id: 'acornyx', name: '橡尾', en: 'ACORNYX', element: 'forest', type: '森芽系', elementEn: 'FOREST', symbol: '❧', art: acornyxArt,
    hp: 10, power: 65, skill: 'ACORN DASH', skillZh: '橡果疾走',
    flavor: '每答對一題，牠就把一顆知識橡果收進尾巴。', flavorEn: 'Every correct answer adds an acorn to its clever tail.',
  },
  {
    id: 'coralisk', name: '珊角', en: 'CORALISK', element: 'tide', type: '潮汐系', elementEn: 'TIDE', symbol: '≋', art: coraliskArt,
    hp: 11, power: 68, skill: 'CORAL CURRENT', skillZh: '珊瑚潮流',
    flavor: '牠用七彩珊瑚記住所有新單字的意思。', flavorEn: 'Colorful coral helps it remember every new meaning.',
  },
  {
    id: 'coalpup', name: '炭犬', en: 'COALPUP', element: 'ember', type: '焰羽系', elementEn: 'EMBER', symbol: '✦', art: coalpupArt,
    hp: 10, power: 73, skill: 'COAL PAW', skillZh: '炭火飛爪',
    flavor: '牠的腳印會把正確的拼字燒成金色。', flavorEn: 'Its pawprints turn correct spelling into golden fire.',
  },
  {
    id: 'neonibis', name: '霓羽', en: 'NEONIBIS', element: 'spark', type: '雷光系', elementEn: 'ELECTRIC', symbol: 'ϟ', art: neonibisArt,
    hp: 9, power: 81, skill: 'NEON FLIGHT', skillZh: '霓虹翔擊',
    flavor: '清楚的發音會讓牠畫出一道彩虹電弧。', flavorEn: 'Clear pronunciation paints a rainbow arc in the sky.',
  },
  {
    id: 'vinekoi', name: '藤鯉', en: 'VINEKOI', element: 'forest', type: '森芽系', elementEn: 'FOREST', symbol: '❧', art: vinekoiArt,
    hp: 11, power: 70, skill: 'VINE CIRCLE', skillZh: '藤蔓迴游',
    flavor: '牠游過空中花園，把片語串成長長的藤環。', flavorEn: 'It loops new phrases into vines across the garden sky.',
  },
  {
    id: 'moonjelly', name: '月晶', en: 'MOONJELLY', element: 'tide', type: '潮汐系', elementEn: 'TIDE', symbol: '≋', art: moonjellyArt,
    hp: 12, power: 62, skill: 'MOON BUBBLE', skillZh: '月光泡泡',
    flavor: '聽懂單字時，月光泡泡就會一顆顆升起。', flavorEn: 'Moonlit bubbles rise whenever it understands a word.',
  },
  {
    id: 'flarebeetle', name: '焰甲', en: 'FLAREBEETLE', element: 'ember', type: '焰羽系', elementEn: 'EMBER', symbol: '✦', art: flarebeetleArt,
    hp: 12, power: 71, skill: 'FLARE HORN', skillZh: '烈焰巨角',
    flavor: '牠用火焰大角守護每一段新學會的句子。', flavorEn: 'Its blazing horn guards every sentence it learns.',
  },
  {
    id: 'rotogecko', name: '磁尾', en: 'ROTOGECKO', element: 'spark', type: '雷光系', elementEn: 'ELECTRIC', symbol: 'ϟ', art: rotogeckoArt,
    hp: 10, power: 77, skill: 'MAGNET DASH', skillZh: '磁極疾衝',
    flavor: '字母一靠近，牠的磁力尾巴就會排出正確順序。', flavorEn: 'Its magnetic tail snaps loose letters into order.',
  },
  {
    id: 'cedaroo', name: '杉袋', en: 'CEDAROO', element: 'forest', type: '森芽系', elementEn: 'FOREST', symbol: '❧', art: cedarooArt,
    hp: 12, power: 64, skill: 'CEDAR JUMP', skillZh: '雪杉躍擊',
    flavor: '牠把難記的單字放進葉袋，跳著複習。', flavorEn: 'It carries tricky words in a leafy pouch for review.',
  },
  {
    id: 'riverwisp', name: '川靈', en: 'RIVERWISP', element: 'tide', type: '潮汐系', elementEn: 'TIDE', symbol: '≋', art: riverwispArt,
    hp: 10, power: 75, skill: 'RIVER MIRROR', skillZh: '川流鏡影',
    flavor: '水面會映出牠剛剛聽見的英文單字。', flavorEn: 'The river mirrors every English word it hears.',
  },
  {
    id: 'cinnamink', name: '桂火', en: 'CINNAMINK', element: 'ember', type: '焰羽系', elementEn: 'EMBER', symbol: '✦', art: cinnaminkArt,
    hp: 9, power: 79, skill: 'SPICE SPARK', skillZh: '香料火星',
    flavor: '新單字讓牠的香料火花變得溫暖又明亮。', flavorEn: 'New words make its cinnamon sparks warm and bright.',
  },
  {
    id: 'starstag', name: '星角', en: 'STARSTAG', element: 'spark', type: '雷光系', elementEn: 'ELECTRIC', symbol: 'ϟ', art: starstagArt,
    hp: 11, power: 82, skill: 'STAR CIRCUIT', skillZh: '星環電路',
    flavor: '牠把答對的英文連成夜空中的星座。', flavorEn: 'Correct English answers become constellations in its antlers.',
  },
  {
    id: 'mycomole', name: '菇鼴', en: 'MYCOMOLE', element: 'forest', type: '森芽系', elementEn: 'FOREST', symbol: '❧', art: mycomoleArt,
    hp: 13, power: 59, skill: 'MUSHROOM MARCH', skillZh: '蘑菇進行曲',
    flavor: '牠會在樹根下種出一整排單字蘑菇。', flavorEn: 'It plants a neat row of word mushrooms under the roots.',
  },
  {
    id: 'shellark', name: '貝雀', en: 'SHELLARK', element: 'tide', type: '潮汐系', elementEn: 'TIDE', symbol: '≋', art: shellarkArt,
    hp: 10, power: 73, skill: 'SHELL SONG', skillZh: '貝殼之歌',
    flavor: '牠的貝殼歌聲會慢慢唸出每個字母。', flavorEn: 'Its shell song gently sounds out every letter.',
  },
  {
    id: 'phoenixel', name: '晨羽', en: 'PHOENIXEL', element: 'ember', type: '焰羽系', elementEn: 'EMBER', symbol: '✦', art: phoenixelArt,
    hp: 10, power: 84, skill: 'SUNRISE SPLASH', skillZh: '旭日焰浪',
    flavor: '就算答錯也會再站起來，帶著晨光重新挑戰。', flavorEn: 'It rises with the sunrise and bravely tries again.',
  },
  {
    id: 'zappuff', name: '電絨', en: 'ZAPPUFF', element: 'spark', type: '雷光系', elementEn: 'ELECTRIC', symbol: 'ϟ', art: zappuffArt,
    hp: 12, power: 68, skill: 'CLOUD CHARGE', skillZh: '雲絨充能',
    flavor: '牠把聽到的英文收進柔軟蓬鬆的電光雲。', flavorEn: 'It stores spoken English inside a soft electric cloud.',
  },
  {
    id: 'orchidrake', name: '蘭翼', en: 'ORCHIDRAKE', element: 'forest', type: '森芽系', elementEn: 'FOREST', symbol: '❧', art: orchidrakeArt,
    hp: 10, power: 78, skill: 'ORCHID GLIDE', skillZh: '蘭花滑翔',
    flavor: '牠飛過的地方會開出寫著英文的小蘭花。', flavorEn: 'Tiny English orchids bloom wherever it glides.',
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

const QUIZ_TYPES = ['translation', 'listen', 'meaning', 'picture', 'spelling'];
const QUIZ_LABELS = {
  translation: '中翻英',
  listen: '聽音辨字',
  meaning: '英翻中',
  picture: '看圖選字',
  spelling: '拼字辨識',
};

const ATTACKS = {
  spark: [
    { en: 'VOLT WORD RUSH', zh: '雷霆字流' },
    { en: 'THUNDER SENTENCE', zh: '轟雷句式' },
    { en: 'SKY FLASH COMBO', zh: '天光連擊' },
  ],
  forest: [
    { en: 'LEAF LETTER DANCE', zh: '葉文字之舞' },
    { en: 'ROOT STORY BIND', zh: '根語纏繞' },
    { en: 'EVERGREEN LEXICON', zh: '森羅萬字典' },
  ],
  tide: [
    { en: 'RIPPLE PHRASE', zh: '漣漪片語' },
    { en: 'AURORA WORD WAVE', zh: '極光單字浪' },
    { en: 'OCEAN VOICE FINALE', zh: '海聲終奏' },
  ],
  ember: [
    { en: 'EMBER SPELL', zh: '火星拼字' },
    { en: 'BLAZING MEANING', zh: '熾焰解意' },
    { en: 'SOLAR STORY BURST', zh: '日輪故事爆' },
  ],
};

const PLAYER_MAX_HP = 12;
const ENEMY_MAX_HP = 18;

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

export function speak(text) {
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

function getSpellingOptions(target, seed) {
  const original = target.english.toLowerCase();
  const letters = [...original];
  const letterIndexes = letters.map((letter, index) => letter !== ' ' ? index : -1).filter((index) => index >= 0);
  const variants = new Set();

  if (letterIndexes.length > 2) {
    const first = letterIndexes[0];
    const second = letterIndexes[1];
    const swapped = [...letters];
    [swapped[first], swapped[second]] = [swapped[second], swapped[first]];
    variants.add(swapped.join(''));

    const removed = [...letters];
    removed.splice(letterIndexes[Math.floor(letterIndexes.length / 2)], 1);
    variants.add(removed.join(''));

    const changed = [...letters];
    const last = letterIndexes.at(-1);
    changed[last] = changed[last] === 's' ? 't' : 's';
    variants.add(changed.join(''));
  }

  variants.add(`${original}${original.endsWith('e') ? 's' : 'e'}`);
  const traps = [...variants].filter((word) => word !== original).slice(0, 3).map((english, index) => ({
    ...target,
    id: `spell-${target.id}-${index}`,
    english,
  }));
  return seededShuffle([target, ...traps], seed + target.id);
}

function readRecords() {
  const starterIds = BEASTS.slice(0, 4).map((beast) => beast.id);
  try {
    const saved = JSON.parse(window.localStorage.getItem('runku_sister_card_quest_v1'));
    if (saved && Array.isArray(saved.mastered)) {
      const savedUnlocked = Array.isArray(saved.unlocked) ? saved.unlocked.filter((id) => BEASTS.some((beast) => beast.id === id)) : [];
      return {
        wins: Number(saved.wins) || 0,
        mastered: saved.mastered,
        unlocked: [...new Set([...starterIds, ...savedUnlocked])],
        drawTokens: Math.max(0, Number(saved.drawTokens) || 0),
      };
    }
  } catch {
    // Start a fresh collection if storage is unavailable.
  }
  return { wins: 0, mastered: [], unlocked: starterIds, drawTokens: 0 };
}

export function CreatureCard({ beast, selected = false, compact = false, faceDown = false, newlyUnlocked = false, onClick }) {
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
          {newlyUnlocked && <div className="cq-new-ribbon">NEW CARD<small>新星獸出現！</small></div>}
        </>
      )}
    </Tag>
  );
}

function Intro({ wordCount, available, drawTokens, onStart }) {
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
          <span><b>{available.length}/{BEASTS.length}</b><small>星獸圖鑑</small></span>
          <span><b>{wordCount}</b><small>姊姊單字</small></span>
          <span><b>{drawTokens}</b><small>可抽新卡</small></span>
        </div>
        <button className="cq-main-button" onClick={onStart}>開啟星光卡包 <span>✦</span></button>
        <p className="cq-safe-note">原創角色與世界觀・沒有付費抽卡・可以無限重玩</p>
      </section>

      <section className="cq-intro-showcase" aria-label={`${BEASTS.length} 張卡牌中已解鎖的星獸卡`}>
        <div className="cq-holo-orbit" />
        {available.slice(-4).map((beast, index) => <div className={`cq-fan cq-fan-${index + 1}`} key={beast.id}><CreatureCard beast={beast} compact /></div>)}
        <div className="cq-arena-mark"><span>LEXI</span><b>★</b><span>BEAST</span></div>
      </section>
    </div>
  );
}

function PackBuilder({ opened, selected, available, drawTokens, newUnlockId, onOpen, onSelect, onBattle, onBack }) {
  return (
    <div className="card-quest cq-pack-screen">
      <header className="cq-game-header"><button onClick={onBack}>← 卡牌研究室</button><div><b>LEXIBEAST LAB</b><small>姊姊的星獸卡牌研究室</small></div><span>{selected.length} / 2 DECK</span></header>
      {!opened ? (
        <main className="cq-pack-opening">
          <p className="cq-eyebrow">{drawTokens > 0 ? 'NEW BEAST READY · CARD DRAW' : 'STARTER DECK · FOUR CARDS'}</p>
          <h2>{drawTokens > 0 ? <>抽出一張<br />全新星獸卡！</> : <>打開牌庫<br />選擇初始夥伴</>}</h2>
          <button className="cq-booster" onClick={onOpen} aria-label="撕開星光卡包">
            <i /><i /><div><span>✦</span><b>LEXIBEAST</b><small>{drawTokens > 0 ? `${drawTokens} DRAW READY` : 'FIRST LIGHT DECK'}</small><em>{available.length} / {BEASTS.length} CARDS DISCOVERED</em></div>
          </button>
          <p>{drawTokens > 0 ? '點一下消耗 1 次抽卡機會，解鎖下一張卡！' : '一開始有 4 張卡；學習單字與獲勝可以繼續抽卡。'}</p>
        </main>
      ) : (
        <main className="cq-deck-builder">
          <div className="cq-builder-heading"><div><p className="cq-eyebrow">{available.length} OF {BEASTS.length} CARDS DISCOVERED!</p><h2>從 {available.length} 張卡選兩隻組隊</h2><p>每學會 3 個新單字，加 1 次抽卡機會；競技場獲勝也會加 1 次。</p></div><div className="cq-deck-slots"><span className={selected[0] ? 'has-card' : ''}>{selected[0] ? BEASTS.find((item) => item.id === selected[0]).symbol : '1'}</span><i>+</i><span className={selected[1] ? 'has-card' : ''}>{selected[1] ? BEASTS.find((item) => item.id === selected[1]).symbol : '2'}</span></div></div>
          <div className="cq-collection-progress"><div><b>{available.length} / {BEASTS.length}</b><span>星獸圖鑑進度</span></div><i><span style={{ width: `${available.length / BEASTS.length * 100}%` }} /></i><strong>✦ 可抽新卡：{drawTokens}</strong></div>
          <div className="cq-card-grid">
            {available.map((beast, index) => (
              <div className={`cq-reveal${newUnlockId === beast.id ? ' is-new-unlock' : ''}`} style={{ '--reveal-delay': `${index * 120}ms` }} key={beast.id}>
                <CreatureCard beast={beast} selected={selected.includes(beast.id)} newlyUnlocked={newUnlockId === beast.id} onClick={() => onSelect(beast.id)} />
              </div>
            ))}
          </div>
          {available.length < BEASTS.length && <p className="cq-locked-vault">🔒 還有 {BEASTS.length - available.length} 張星獸卡等待答題解鎖</p>}
          <button className="cq-main-button" disabled={selected.length !== 2} onClick={onBattle}>帶著牌組出戰 <span>⚔</span></button>
        </main>
      )}
    </div>
  );
}

function BattleBar({ label, value, max, enemy = false }) {
  return <div className={`cq-hp${enemy ? ' is-enemy' : ''}`}><div><b>{label}</b><span>{value} / {max}</span></div><i><span style={{ width: `${Math.max(0, value / max) * 100}%` }} /></i></div>;
}

function Battle({ words, team, activeId, enemyId, round, playerHp, enemyHp, combo, feedback, lastMove, lastDamage, log, mastered, wins, onAnswer, onContinue, onSwitch, onSpeak, onLeave }) {
  const active = BEASTS.find((beast) => beast.id === activeId);
  const enemy = BEASTS.find((beast) => beast.id === enemyId);
  const bench = BEASTS.find((beast) => beast.id === team.find((id) => id !== activeId));
  const quizWords = useMemo(() => seededShuffle(words, 2026 + wins * 17), [words, wins]);
  const target = quizWords[round % quizWords.length];
  const type = QUIZ_TYPES[round % QUIZ_TYPES.length];
  const options = useMemo(
    () => type === 'spelling' ? getSpellingOptions(target, round * 31 + wins) : getOptions(words, target, round * 31 + wins),
    [type, words, target, round, wins],
  );
  const advantage = ADVANTAGE[active.element] === enemy.element;
  const enemyAdvantage = ADVANTAGE[enemy.element] === active.element;
  const instruction = type === 'listen'
    ? '仔細聽發音，選出正確的英文卡'
    : type === 'meaning'
      ? `「${target.english}」是哪一個中文意思？`
      : type === 'picture'
        ? `看圖選英文：${target.emoji || '✦'}`
        : type === 'spelling'
          ? '哪一張卡的英文拼字完全正確？'
          : `哪一張英文卡是「${target.chinese}」？`;
  const questionLabel = type === 'listen' ? 'SOUND' : type === 'meaning' ? 'MEANING' : type === 'picture' ? 'PICTURE' : type === 'spelling' ? 'SPELLING' : 'TRANSLATION';

  return (
    <div className={`card-quest cq-battle cq-attack-${active.element}${feedback === 'correct' ? ' is-attacking' : ''}${feedback === 'wrong' ? ' is-damaged' : ''}`} data-testid="card-quest-battle" data-quiz-type={type}>
      <header className="cq-game-header"><button onClick={onLeave}>← 暫停對戰</button><div><b>STARLIGHT ARENA</b><small>姊姊的大字單字卡牌競技場</small></div><span>WIN {wins} · 📖 {mastered}</span></header>
      <main className="cq-battle-table">
        <section className="cq-duel-field">
          <div className="cq-arena-lines" />
          <div className="cq-combo-meter"><small>WORD COMBO</small><b>×{combo}</b><span>{combo >= 3 ? 'POWER UP!' : '連續答對會增強招式'}</span></div>
          <div className="cq-opponent-zone">
            <div className="cq-trainer-tag"><span>CPU TRAINER</span><b>星蝕牌手</b></div>
            <BattleBar label={`${enemy.name} HP`} value={enemyHp} max={ENEMY_MAX_HP} enemy />
            <div className="cq-battle-card cq-enemy-card"><CreatureCard beast={enemy} compact /></div>
          </div>
          <div className="cq-versus">VS<small>TURN {round + 1}</small></div>
          <div className="cq-player-zone">
            <div className="cq-trainer-tag"><span>WORD TRAINER</span><b>姊姊</b></div>
            <BattleBar label="牌手 HP" value={playerHp} max={PLAYER_MAX_HP} />
            <div className="cq-battle-card cq-player-card"><CreatureCard beast={active} compact /></div>
          </div>

          {feedback === 'correct' && lastMove && (
            <div className={`cq-attack-cinematic cq-cinematic-${active.element}`} aria-live="polite">
              <div className="cq-energy-core">{active.symbol}</div>
              <div className="cq-move-title"><small>{lastMove.zh}</small><b>{lastMove.en}</b><strong>{lastDamage} DAMAGE · COMBO ×{combo}</strong></div>
              <div className="cq-move-particles" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <i key={index} />)}</div>
            </div>
          )}
          {feedback === 'wrong' && <div className="cq-counter-flash">COUNTER!<b>-{enemyAdvantage ? 2 : 1} HP</b></div>}
        </section>

        <section className="cq-command-board">
          <div className="cq-quiz-modes" aria-label="五種單字測驗">
            {QUIZ_TYPES.map((quizType, index) => <span className={quizType === type ? 'is-current' : ''} key={quizType}><b>0{index + 1}</b>{QUIZ_LABELS[quizType]}</span>)}
          </div>
          <div className="cq-battle-log"><span>▶</span><p>{log}</p></div>
          <div className="cq-question-row">
            <div><small>{questionLabel} CARD · TURN {round + 1}</small><h2>{instruction}</h2></div>
            <button className="cq-sound-button" onClick={() => onSpeak(target.english)}><span>🔊</span><small>LISTEN</small></button>
          </div>
          <div className="cq-command-layout">
            <aside className="cq-deck-panel">
              <b>ACTIVE BEAST</b>
              <span className={`cq-type-pill cq-${active.element}`}>{active.symbol} {active.type}</span>
              <small>{advantage ? '屬性有利：攻擊 +1' : enemyAdvantage ? '屬性不利：反擊 +1' : '屬性普通'}</small>
              <button onClick={() => onSwitch(bench.id)} disabled={Boolean(feedback)}><img src={bench.art} alt="" /><span>交換主將<br /><b>{bench.name} · {bench.en}</b></span></button>
            </aside>
            <div className="cq-word-hand">
              {options.map((word, index) => (
                <button key={word.id} onClick={() => onAnswer(word.id, target, active, enemy)} disabled={Boolean(feedback)} data-correct={word.id === target.id ? 'true' : 'false'}>
                  <small>CARD 0{index + 1}</small>
                  <span>{type === 'picture' ? '✦' : type === 'spelling' ? '✎' : word.emoji || '✦'}</span>
                  <b>{type === 'meaning' ? word.chinese : word.english}</b>
                  <em>{type === 'meaning' ? 'MEANING CARD' : type === 'spelling' ? 'CHECK SPELLING' : 'ENGLISH ATTACK'}</em>
                </button>
              ))}
            </div>
          </div>
          {feedback && (
            <div className={`cq-feedback cq-feedback-${feedback}`} role="status">
              <span>{feedback === 'correct' ? active.symbol : '↻'}</span>
              <div><b>{feedback === 'correct' ? `${target.english.toUpperCase()} · ${lastMove.en}！` : '差一點，對手發動反擊！'}</b><small>{feedback === 'correct' ? `${target.english} = ${target.chinese} · 造成 ${lastDamage} 點傷害` : `正確答案：${target.english} = ${target.chinese}`}</small></div>
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
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [enemyHp, setEnemyHp] = useState(ENEMY_MAX_HP);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [lastDamage, setLastDamage] = useState(0);
  const [log, setLog] = useState('選擇正確的單字卡，為星獸充入 WORD CORE！');
  const [wins, setWins] = useState(initialRecords.wins || 0);
  const [mastered, setMastered] = useState(initialRecords.mastered || []);
  const [unlocked, setUnlocked] = useState(initialRecords.unlocked);
  const [drawTokens, setDrawTokens] = useState(initialRecords.drawTokens);
  const [newUnlockId, setNewUnlockId] = useState(null);
  const [wonLastBattle, setWonLastBattle] = useState(false);
  const available = useMemo(() => BEASTS.filter((beast) => unlocked.includes(beast.id)), [unlocked]);

  useEffect(() => {
    try {
      window.localStorage.setItem('runku_sister_card_quest_v1', JSON.stringify({ wins, mastered, unlocked, drawTokens }));
    } catch {
      // Keep progress in memory if storage is unavailable.
    }
  }, [wins, mastered, unlocked, drawTokens]);

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
    setPlayerHp(PLAYER_MAX_HP);
    setEnemyHp(ENEMY_MAX_HP);
    setCombo(0);
    setFeedback(null);
    setLastMove(null);
    setLastDamage(0);
    setLog(`${opponent.name}接受挑戰！五種單字測驗與華麗連擊即將開始。`);
    setScreen('battle');
  };

  const answer = (pickedId, target, active, enemy) => {
    if (feedback) return;
    if (pickedId === target.id) {
      const isNewWord = !mastered.includes(target.id);
      const nextMasteredCount = mastered.length + (isNewWord ? 1 : 0);
      const nextCombo = combo + 1;
      const comboBonus = Math.min(2, Math.floor(nextCombo / 3));
      const damage = (ADVANTAGE[active.element] === enemy.element ? 3 : 2) + comboBonus;
      const move = ATTACKS[active.element][(nextCombo - 1) % ATTACKS[active.element].length];
      setEnemyHp((current) => Math.max(0, current - damage));
      setMastered((current) => current.includes(target.id) ? current : [...current, target.id]);
      if (isNewWord && nextMasteredCount % 3 === 0 && unlocked.length < BEASTS.length) {
        setDrawTokens((current) => current + 1);
      }
      setCombo(nextCombo);
      setLastMove(move);
      setLastDamage(damage);
      setFeedback('correct');
      setLog(`${move.zh} · ${move.en}！連擊 ×${nextCombo}，造成 ${damage} 點傷害。`);
      speak(target.english);
    } else {
      const enemy = BEASTS.find((beast) => beast.id === enemyId);
      const active = BEASTS.find((beast) => beast.id === activeId);
      const damage = ADVANTAGE[enemy.element] === active.element ? 2 : 1;
      setPlayerHp((current) => Math.max(0, current - damage));
      setCombo(0);
      setLastMove(null);
      setLastDamage(damage);
      setFeedback('wrong');
      setLog(`${enemy.name}抓到空檔，反擊造成 ${damage} 點傷害；COMBO 重新累積。`);
    }
  };

  const continueTurn = () => {
    if (enemyHp <= 0) {
      setWins((current) => current + 1);
      if (unlocked.length < BEASTS.length) setDrawTokens((current) => current + 1);
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

  const openPack = () => {
    setOpened(true);
    setNewUnlockId(null);
    if (drawTokens <= 0) return;
    const nextBeast = BEASTS.find((beast) => !unlocked.includes(beast.id));
    if (!nextBeast) return;
    setUnlocked((current) => [...current, nextBeast.id]);
    setDrawTokens((current) => Math.max(0, current - 1));
    setNewUnlockId(nextBeast.id);
  };

  if (screen === 'intro') return <Intro wordCount={words.length} available={available} drawTokens={drawTokens} onStart={() => setScreen('pack')} />;
  if (screen === 'pack') return <PackBuilder opened={opened} selected={selected} available={available} drawTokens={drawTokens} newUnlockId={newUnlockId} onOpen={openPack} onSelect={toggleCard} onBattle={startBattle} onBack={() => setScreen('intro')} />;
  if (screen === 'battle') return <Battle words={words} team={team} activeId={activeId} enemyId={enemyId} round={round} playerHp={playerHp} enemyHp={enemyHp} combo={combo} feedback={feedback} lastMove={lastMove} lastDamage={lastDamage} log={log} mastered={mastered.length} wins={wins} onAnswer={answer} onContinue={continueTurn} onSwitch={(id) => { setActiveId(id); setCombo(0); setLastMove(null); setLog(`${BEASTS.find((beast) => beast.id === id).name}交換上場！COMBO 重新蓄力。`); }} onSpeak={speak} onLeave={() => setScreen('pack')} />;
  const rewardBeast = BEASTS.find((beast) => beast.id === activeId);
  return <Result won={wonLastBattle} beast={rewardBeast} wins={wins} mastered={mastered.length} total={words.length} onReplay={replay} onHome={() => setScreen('intro')} />;
}
