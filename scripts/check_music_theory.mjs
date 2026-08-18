// 音階拼法、上下行、與小提琴把位的驗證。
//
// 音名拼錯是教錯，不是排版問題：F 大調的第四音是 B♭ 不是 A♯，兩者聲音一樣但寫法只有一種正確。
// 旋律小音階更關鍵——上行升第六、七音，下行還原，上下行的音本來就不一樣，
// 弄錯的話小提琴課上拉出來就是錯的。下面的預期答案是樂理上的標準答案。
//
// 執行：node scripts/check_music_theory.mjs

import {
  LEVELS,
  SCALE_MODES,
  OPEN_STRINGS,
  TAPE_OFFSETS,
  spellScale,
  scaleRun,
  descendingFormula,
  violinPosition,
  midiOf,
} from '../frontend/src/components/Games/musicTheory.js';

const ASCENDING = {
  'major-C': 'C D E F G A B C',
  'major-D': 'D E F♯ G A B C♯ D',
  'major-E': 'E F♯ G♯ A B C♯ D♯ E',
  'major-F': 'F G A B♭ C D E F',
  'major-G': 'G A B C D E F♯ G',
  'major-A': 'A B C♯ D E F♯ G♯ A',
  'major-B': 'B C♯ D♯ E F♯ G♯ A♯ B',

  'natural-A': 'A B C D E F G A',
  'natural-E': 'E F♯ G A B C D E',
  'natural-D': 'D E F G A B♭ C D',
  'natural-G': 'G A B♭ C D E♭ F G',
  'natural-B': 'B C♯ D E F♯ G A B',
  'natural-C': 'C D E♭ F G A♭ B♭ C',
  'natural-F': 'F G A♭ B♭ C D♭ E♭ F',

  // 旋律小音階上行：第六、七音升高，聽起來像大調的上半段。
  'melodic-A': 'A B C D E F♯ G♯ A',
  'melodic-E': 'E F♯ G A B C♯ D♯ E',
  'melodic-D': 'D E F G A B C♯ D',
  'melodic-G': 'G A B♭ C D E F♯ G',
  'melodic-B': 'B C♯ D E F♯ G♯ A♯ B',
  'melodic-C': 'C D E♭ F G A B C',
  'melodic-F': 'F G A♭ B♭ C D E F',
};

// 旋律小音階下行還原成自然小調。這幾個是最要緊的：拉錯就是拉錯的音。
const DESCENDING = {
  'melodic-A': 'A G F E D C B A',
  'melodic-E': 'E D C B A G F♯ E',
  'melodic-D': 'D C B♭ A G F E D',
  'melodic-G': 'G F E♭ D C B♭ A G',
  'melodic-B': 'B A G F♯ E D C♯ B',
  'melodic-C': 'C B♭ A♭ G F E♭ D C',
  'melodic-F': 'F E♭ D♭ C B♭ A♭ G F',
};

let failures = 0;
const fail = (message) => {
  failures += 1;
  console.error(`  ✗ ${message}`);
};
const levelOf = (id) => LEVELS.find((item) => item.id === id);

// 1. 上行拼法
console.log('上行拼法');
for (const [id, expected] of Object.entries(ASCENDING)) {
  const [mode, letter] = id.split('-');
  const level = levelOf(id);
  if (!level) {
    fail(`${id}: 關卡清單裡找不到`);
    continue;
  }
  const spelled = spellScale(letter, level.octave, mode).map((note) => note.name).join(' ');
  if (spelled !== expected) fail(`${id}: 得到 ${spelled}，應該是 ${expected}`);
  else console.log(`  ✓ ${id.padEnd(11)} ${spelled}`);
}

// 2. 旋律小音階的下行必須還原成自然小調，而且真的和上行不同
console.log('\n旋律小音階下行（還原）');
for (const [id, expected] of Object.entries(DESCENDING)) {
  const [mode, letter] = id.split('-');
  const level = levelOf(id);
  const run = scaleRun(letter, level.octave, mode);
  const descending = [run.up.at(-1), ...run.down].map((note) => note.name).join(' ');
  if (descending !== expected) {
    fail(`${id}: 下行得到 ${descending}，應該是 ${expected}`);
    continue;
  }
  const ascending = run.up.map((note) => note.name).join(' ');
  const reversedUp = [...run.up].reverse().map((note) => note.name).join(' ');
  if (descending === reversedUp) fail(`${id}: 下行和上行倒過來一樣，第六七音沒有還原`);
  else console.log(`  ✓ ${id.padEnd(11)} 上 ${ascending}\n                 下 ${descending}`);
}

// 3. 大調與自然小調上下行同音
console.log('\n大調與自然小調：下行等於上行倒序');
for (const level of LEVELS.filter((item) => item.type === 'build' && item.mode !== 'melodic')) {
  const run = scaleRun(level.letter, level.octave, level.mode);
  const descending = [run.up.at(-1), ...run.down].map((note) => note.name).join(' ');
  const reversedUp = [...run.up].reverse().map((note) => note.name).join(' ');
  if (descending !== reversedUp) fail(`${level.id}: 下行 ${descending} 不等於上行倒序 ${reversedUp}`);
}
if (!failures) console.log('  ✓ 全部相符');

// 4. 每次遠征都是 15 個音，最高音不重按
console.log('\n每關的音數');
for (const level of LEVELS.filter((item) => item.type === 'build')) {
  const run = scaleRun(level.letter, level.octave, level.mode);
  if (run.notes.length !== 15) fail(`${level.id}: 共 ${run.notes.length} 個音，應該是 15`);
  if (run.up.at(-1).midi === run.down[0].midi) fail(`${level.id}: 最高音被重按了兩次`);
}
if (!failures) console.log('  ✓ 21 關都是 8 上行 + 7 下行 = 15 個音');

// 5. 音程必須符合調式公式，七個字母各用一次
console.log('\n音程公式與字母');
for (const [id] of Object.entries(ASCENDING)) {
  const [mode, letter] = id.split('-');
  const notes = spellScale(letter, levelOf(id).octave, mode);
  const gaps = notes.slice(1).map((note, index) => note.midi - notes[index].midi);
  const expectedGaps = SCALE_MODES[mode].steps.slice(1).map((value, index) => value - SCALE_MODES[mode].steps[index]);
  if (gaps.join(',') !== expectedGaps.join(',')) fail(`${id}: 音程 ${gaps} 不符合 ${expectedGaps}`);
  if (new Set(notes.slice(0, 7).map((note) => note.letter)).size !== 7) fail(`${id}: 字母沒有用滿七個`);
}
// 下行公式也要跟著換調式
if (descendingFormula('melodic').join('') !== [...SCALE_MODES.natural.formula].reverse().join('')) {
  fail('旋律小調的下行公式沒有換成自然小調');
}
if (!failures) console.log('  ✓ 全部符合公式，字母用滿，下行公式正確換調式');

// 6. 和聲小調確定已經移除（琴課用不到，留著只會混淆）
console.log('\n已移除和聲小調');
if (SCALE_MODES.harmonic) fail('SCALE_MODES 還留著 harmonic');
if (LEVELS.some((level) => level.mode === 'harmonic')) fail('還有關卡在用 harmonic');
if (!failures) console.log('  ✓ SCALE_MODES 與關卡清單都沒有 harmonic 了');

// 7. 上下行的每個音都要留在第一把位
console.log('\n小提琴第一把位');
// violinPosition 的上限開到 +9（貼紙⑤）是為了講得出四指伸展的位置，
// 但關卡本身必須留在真正的第一把位，也就是空弦到四指的 0~7。
for (const level of LEVELS.filter((item) => item.type === 'build')) {
  const unreachable = scaleRun(level.letter, level.octave, level.mode)
    .notes.filter((note) => {
      const position = violinPosition(note.midi);
      return !position || position.offset > 7;
    });
  if (unreachable.length) fail(`${level.id}: ${unreachable.map((n) => n.name).join(' ')} 超出第一把位`);
}
if (!failures) console.log('  ✓ 21 關的上行與下行全部在第一把位內（0~7）');

// 8. 五條貼紙要對得上真實的琴。E 弦上面沒有別條弦可以接手，
// 所以在 E 弦上五條貼紙都會用到：F♯① G♯② A③ B④ C♯⑤。
console.log('\n五條貼紙');
const eString = OPEN_STRINGS[3];
const tapeNotes = TAPE_OFFSETS.map((offset) => {
  const position = violinPosition(eString.midi + offset);
  return position.tape ? `貼紙${position.tape}` : '無';
});
if (tapeNotes.join(' ') !== '貼紙1 貼紙2 貼紙3 貼紙4 貼紙5') {
  fail(`貼紙沒有落在 +2/+4/+5/+7/+9：${tapeNotes.join(' ')}`);
}
// 貼紙④ 和上面那條空弦同音，這是拉琴時對音的依據，弦與弦之間都要成立。
// 也因為這樣，G / D / A 弦上的貼紙④⑤ 在拉音階時會換成上面那條弦——
// 貼紙照樣畫在指板上（琴上本來就貼著），但亮起來的是實際會按的那條弦。
for (let index = 0; index < OPEN_STRINGS.length - 1; index += 1) {
  const lower = OPEN_STRINGS[index];
  const upper = OPEN_STRINGS[index + 1];
  if (lower.midi + 7 !== upper.midi) {
    fail(`${lower.name} 弦的貼紙④ 對不上 ${upper.name} 空弦`);
  }
  const handover = violinPosition(lower.midi + 9);
  if (handover.string !== upper.name || handover.tape !== 1) {
    fail(`${lower.name} 弦的貼紙⑤ 應該換成 ${upper.name} 弦貼紙①，實際是 ${handover.string} 弦 ${handover.finger}`);
  }
}
// 只有低二指（+3）永遠是「靠著一指」，其他把位不該亂標
const aString = OPEN_STRINGS[2];
const touching = [0, 1, 2, 3, 4, 5, 6, 7].filter((offset) => violinPosition(aString.midi + offset).touching);
if (touching.join(',') !== '3') fail(`只有 +3 該標「靠著」，實際是 ${touching}`);
// 同一個音既能用 D 弦四指、也能用 A 空弦按到時，要挑空弦——實際拉琴就是這樣。
const both = violinPosition(OPEN_STRINGS[1].midi + 7);
if (both.string !== 'A' || both.offset !== 0) {
  fail(`A4 應該挑 A 空弦，實際是 ${both.string} 弦 ${both.finger}`);
}
if (!failures) console.log('  ✓ 貼紙在 +2/+4/+5/+7/+9、貼紙④＝上面那條空弦、只有低二指標「靠著一指」、能用空弦時不用四指');

console.log(failures ? `\n${failures} 項錯誤` : '\n全部通過：上行、旋律小調下行、音程、把位、五條貼紙');
process.exit(failures ? 1 : 0);
