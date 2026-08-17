// 音階拼法與小提琴把位的驗證。
//
// 音名拼錯是教錯，不是排版問題：F 大調的第四音是 B♭ 不是 A♯，兩者聲音一樣但寫法只有一種正確。
// 下面的預期答案是樂理上的標準答案，逐一比對 musicTheory.js 算出來的結果。
//
// 執行：node scripts/check_music_theory.mjs

import {
  LEVELS,
  SCALE_MODES,
  spellScale,
  violinPosition,
  midiOf,
} from '../frontend/src/components/Games/musicTheory.js';

const EXPECTED = {
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

  'harmonic-A': 'A B C D E F G♯ A',
  'harmonic-E': 'E F♯ G A B C D♯ E',
  'harmonic-D': 'D E F G A B♭ C♯ D',
};

let failures = 0;
const fail = (message) => {
  failures += 1;
  console.error(`  ✗ ${message}`);
};

// 1. 每個音階的拼法
console.log('音階拼法');
for (const [id, expected] of Object.entries(EXPECTED)) {
  const [mode, letter] = id.split('-');
  const level = LEVELS.find((item) => item.id === id);
  if (!level) {
    fail(`${id}: 關卡清單裡找不到`);
    continue;
  }
  const spelled = spellScale(letter, level.octave, mode).map((note) => note.name).join(' ');
  if (spelled !== expected) fail(`${id}: 得到 ${spelled}，應該是 ${expected}`);
  else console.log(`  ✓ ${id.padEnd(12)} ${spelled}`);
}

// 2. 每個音階的音程必須完全符合該調式的公式
console.log('\n音程公式');
for (const [id] of Object.entries(EXPECTED)) {
  const [mode, letter] = id.split('-');
  const level = LEVELS.find((item) => item.id === id);
  const notes = spellScale(letter, level.octave, mode);
  const gaps = notes.slice(1).map((note, index) => note.midi - notes[index].midi);
  const expectedGaps = SCALE_MODES[mode].steps
    .slice(1)
    .map((value, index) => value - SCALE_MODES[mode].steps[index]);
  if (gaps.join(',') !== expectedGaps.join(',')) {
    fail(`${id}: 音程 ${gaps.join(',')} 不符合 ${expectedGaps.join(',')}`);
  }
  // 七個音必須用掉 A~G 各一次
  const letters = new Set(notes.slice(0, 7).map((note) => note.letter));
  if (letters.size !== 7) fail(`${id}: 字母沒有用滿七個 (${[...letters].join('')})`);
}
if (!failures) console.log('  ✓ 全部符合公式，且每個音階都用滿 A~G 七個字母');

// 3. 每個音都要落在小提琴第一把位（妹妹拉的是小提琴）
console.log('\n小提琴第一把位');
for (const level of LEVELS.filter((item) => item.type === 'build')) {
  const notes = spellScale(level.letter, level.octave, level.mode);
  const unreachable = notes.filter((note) => !violinPosition(note.midi));
  if (unreachable.length) {
    fail(`${level.id}: ${unreachable.map((note) => note.name).join(' ')} 超出第一把位`);
  }
}
if (!failures) {
  const sample = spellScale('D', 4, 'major')
    .map((note) => `${note.name}=${violinPosition(note.midi).string}弦${violinPosition(note.midi).finger}`)
    .join('  ');
  console.log(`  ✓ 全部 17 個音階都在第一把位內`);
  console.log(`    例：D 大調  ${sample}`);
}

// 4. 開放弦對照，確認把位換算沒有整體平移
console.log('\n空弦對照');
for (const [letter, octave, expectedString] of [['G', 3, 'G'], ['D', 4, 'D'], ['A', 4, 'A'], ['E', 5, 'E']]) {
  const position = violinPosition(midiOf(letter, 0, octave));
  if (position.string !== expectedString || position.offset !== 0) {
    fail(`${letter}${octave} 應該是 ${expectedString} 空弦，卻算成 ${position.string}弦${position.finger}`);
  }
}
if (!failures) console.log('  ✓ G D A E 四條空弦都對得上');

console.log(failures ? `\n${failures} 項錯誤` : '\n音階拼法、音程公式、第一把位、空弦對照全部通過');
process.exit(failures ? 1 : 0);
