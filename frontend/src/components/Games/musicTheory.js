// 音階教室的樂理核心。
//
// 音名的拼法不能只用「第幾個半音」硬湊，否則 F 大調會拼成 A#（正確是 B♭）。
// 正確做法是：一個音階的七個音要剛好用掉 A~G 七個字母各一次，
// 先決定字母，再算這個字母需要幾個升降記號。

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const NATURAL_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const BLACK_PC = new Set([1, 3, 6, 8, 10]);

export const SCALE_MODES = {
  major: {
    label: '大調',
    en: 'MAJOR',
    mood: '聽起來明亮、開朗',
    steps: [0, 2, 4, 5, 7, 9, 11, 12],
    formula: ['全', '全', '半', '全', '全', '全', '半'],
  },
  natural: {
    label: '自然小調',
    en: 'NATURAL MINOR',
    mood: '聽起來柔和、有點憂傷',
    steps: [0, 2, 3, 5, 7, 8, 10, 12],
    formula: ['全', '半', '全', '全', '半', '全', '全'],
  },
  // 小提琴課教的小音階。上行把第六、第七音升高，下行還原成自然小調，
  // 所以上下行的音不一樣——這是它和大調、自然小調最大的差別。
  melodic: {
    label: '旋律小調',
    en: 'MELODIC MINOR',
    mood: '上行像大調一樣亮，下行變回柔和的小調',
    steps: [0, 2, 3, 5, 7, 9, 11, 12],
    formula: ['全', '半', '全', '全', '全', '全', '半'],
    descending: 'natural',
  },
};

export function accidentalLabel(value) {
  if (value === 0) return '';
  if (value === 1) return '♯';
  if (value === -1) return '♭';
  if (value === 2) return '𝄪';
  if (value === -2) return '𝄫';
  return value > 0 ? `+${value}` : `${value}`;
}

export function midiOf(letter, accidental, octave) {
  return 12 * (octave + 1) + NATURAL_PC[letter] + accidental;
}

export function isBlackKey(midi) {
  return BLACK_PC.has(((midi % 12) + 12) % 12);
}

export function noteNameOf(midi) {
  // 只用來標鍵盤上「不在音階裡」的鍵，統一用升記號即可。
  const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  return names[((midi % 12) + 12) % 12];
}

export function frequencyOf(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// 一個音階的八個音（含高八度的主音），含正確的音名拼法。
export function spellScale(letter, octave, mode) {
  const { steps } = SCALE_MODES[mode];
  const letterIndex = LETTERS.indexOf(letter);
  const tonicPc = NATURAL_PC[letter];
  const tonicMidi = midiOf(letter, 0, octave);

  return steps.map((semitones, index) => {
    const noteLetter = LETTERS[(letterIndex + index) % 7];
    const targetPc = (tonicPc + semitones) % 12;
    let accidental = targetPc - NATURAL_PC[noteLetter];
    // 字母繞過八度時差值會爆掉，收回 -6~6 才是真正的升降數。
    if (accidental > 6) accidental -= 12;
    if (accidental < -6) accidental += 12;
    return {
      degree: index + 1,
      letter: noteLetter,
      accidental,
      name: noteLetter + accidentalLabel(accidental),
      midi: tonicMidi + semitones,
    };
  });
}

// 一次完整的音階：上行八個音，再下行回到主音。
// 最高音在上行最後一步已經按過，下行不重按，所以一共是 15 個音。
export function scaleRun(letter, octave, mode) {
  const up = spellScale(letter, octave, mode);
  const descendingMode = SCALE_MODES[mode].descending || mode;
  const down = [...spellScale(letter, octave, descendingMode)].reverse().slice(1);
  return { up, down, notes: [...up, ...down] };
}

// 下行要看的音程。旋律小調下行走自然小調，所以公式也要跟著換。
export function descendingFormula(mode) {
  const descendingMode = SCALE_MODES[mode].descending || mode;
  return [...SCALE_MODES[descendingMode].formula].reverse();
}

// 小提琴第一把位。妹妹拉的是小提琴，所以每個音都要能指出「哪一條弦、第幾指」。
export const OPEN_STRINGS = [
  { name: 'G', midi: 55 },
  { name: 'D', midi: 62 },
  { name: 'A', midi: 69 },
  { name: 'E', midi: 76 },
];

// 芊芊的琴上貼了五條貼紙，位置是距空弦 +2、+4、+5、+7、+9 個半音。
// 從最粗的 G 弦看，由琴頭往琴身依序是 A①、B②、C③、D④、E⑤——
// 剛好是從空弦往上數的五個音階音，每條弦都一樣。
// 貼紙④ 和上面那條空弦同音（G 弦的 D＝空弦 D），所以它也是對音用的參考點。
export const TAPE_OFFSETS = [2, 4, 5, 7, 9];
export const TAPE_MARK = ['①', '②', '③', '④', '⑤'];

// 畫指板時的橫軸長度（半音數）。比最後一條貼紙多留一點，貼紙⑤ 才不會擠在最右邊。
export const FINGERBOARD_SPAN = 10;

// 第一把位按得到 0~7（空弦到四指）；貼紙⑤ 的 +9 要把四指往前伸才按得到。
// 上限開到 9 只是為了把貼紙⑤ 也講得出來——因為是由高往低找弦，
// 其他弦上的 +8、+9 都會先被上面那條弦用更小的把位接走，只有 E 弦最上面幾個音會用到。
const MAX_OFFSET = 9;

// 每個把位怎麼跟貼紙講。措辭要對得起實際的手感：
// 只有 offset 3 的「二指靠著一指」永遠成立——二指往回退半音時，真的貼在一指旁邊。
// offset 5 只描述貼紙②③本來就靠在一起，不寫成「三指靠著二指」，
// 因為二指有可能正按在 offset 3，那時候兩指並沒有相靠。
const FIRST_POSITION = {
  0: { finger: '空弦', short: '0', tape: null, touching: null, hint: '空弦，不用按手指' },
  1: { finger: '一指', short: '1', tape: null, touching: null, hint: '一指往琴頭方向靠，比貼紙①再後面一點' },
  2: { finger: '一指', short: '1', tape: 1, touching: null, hint: '一指按在貼紙①' },
  3: { finger: '二指', short: '2', tape: null, touching: '一指', hint: '二指靠著一指，兩根手指貼在一起（這個音沒有貼紙）' },
  4: { finger: '二指', short: '2', tape: 2, touching: null, hint: '二指按在貼紙②' },
  5: { finger: '三指', short: '3', tape: 3, touching: null, hint: '三指按在貼紙③（貼紙②和③本來就靠在一起）' },
  6: { finger: '三指', short: '3', tape: null, touching: null, hint: '三指比貼紙③再往前一點，在貼紙③和④中間' },
  7: { finger: '四指', short: '4', tape: 4, touching: null, hint: '四指按在貼紙④，聲音和上面那條空弦一樣，可以拿來對音' },
  8: { finger: '四指', short: '4', tape: null, touching: null, hint: '四指往前伸一點，在貼紙④和⑤中間' },
  9: { finger: '四指', short: '4', tape: 5, touching: null, hint: '四指伸到貼紙⑤' },
};

// 選「搆得到這個音的最高那條弦」，這也是實際拉音階時的自然選擇。
export function violinPosition(midi) {
  for (let index = OPEN_STRINGS.length - 1; index >= 0; index -= 1) {
    const offset = midi - OPEN_STRINGS[index].midi;
    if (offset >= 0 && offset <= MAX_OFFSET) {
      // 由高往低找，所以同時能用空弦和四指按到的音會挑空弦——實際拉琴也是這樣選。
      return { string: OPEN_STRINGS[index].name, stringIndex: index, offset, ...FIRST_POSITION[offset] };
    }
  }
  return null;
}

// 每個調的起始八度都挑過，讓整個音階留在第一把位（見 scripts/test_music_theory.py）。
const TONIC_OCTAVE = { G: 3, A: 3, B: 3, C: 4, D: 4, E: 4, F: 4 };

function scaleLevel(letter, mode, note, violinCourse = false) {
  const octave = TONIC_OCTAVE[letter];
  return {
    id: `${mode}-${letter}`,
    type: 'build',
    letter,
    octave,
    mode,
    violinCourse,
    name: `${letter} ${SCALE_MODES[mode].label}`,
    en: `${letter} ${SCALE_MODES[mode].en}`,
    note,
  };
}

export const LEVELS = [
  {
    id: 'lesson-steps',
    type: 'lesson',
    lesson: 'steps',
    name: '全音與半音',
    en: 'WHOLE & HALF STEPS',
    note: '所有大調小調都是用這兩種距離拼出來的。先把它們分清楚，後面每一關都會用到。',
  },
  scaleLevel('D', 'major', '從空弦 D 出發，這是小提琴最先學的音階。', true),
  scaleLevel('G', 'major', '從空弦 G 出發，最低的那條弦。', true),
  scaleLevel('A', 'major', '從空弦 A 出發，三條空弦都用上了。', true),
  scaleLevel('C', 'major', '鍵盤上全是白鍵，琴上從 G 弦的三指出發。', true),
  scaleLevel('A', 'natural', '和 C 大調用一模一樣的音，但聽起來完全不同——差別只在從哪裡開始。', true),
  {
    id: 'ear-1',
    type: 'ear',
    name: '聽聽看：大調還是小調？',
    en: 'MAJOR OR MINOR?',
    note: '不用按鍵盤，只要聽。大調明亮，小調柔和一點。',
  },
  {
    id: 'lesson-melodic',
    type: 'lesson',
    lesson: 'melodic',
    name: '旋律小音階：上行下行不一樣',
    en: 'THE MELODIC MINOR',
    note: '小提琴課教的小音階。上行把第六、七音升高，下行再還原回來——所以上去和下來的音是不同的。',
  },
  scaleLevel('A', 'melodic', '上行的 G♯ 要用三指往前伸一點，下行變回 G 就退回貼紙③。', true),
  scaleLevel('E', 'natural', '從空弦 E 的低八度出發。', true),
  scaleLevel('E', 'melodic', '上行升 C♯ 和 D♯，下行還原成 C 和 D。', true),
  scaleLevel('D', 'natural', '和 D 大調同一個起點，只有三個音不一樣，聽起來卻差很多。', true),
  scaleLevel('D', 'melodic', 'F 這個音要二指靠著一指，整個音階都會用到它。', true),
  scaleLevel('F', 'major', '第一個有降記號的調，B 要降成 B♭。'),
  scaleLevel('G', 'natural', '兩個降記號。', true),
  scaleLevel('G', 'melodic', '上行升到 E 和 F♯，下行回到 E♭ 和 F。', true),
  {
    id: 'ear-2',
    type: 'ear',
    name: '再聽一次：大調還是小調？',
    en: 'MAJOR OR MINOR? · ROUND 2',
    note: '這一輪的調子比較多，慢慢聽。',
  },
  scaleLevel('B', 'natural', '兩個升記號，和 D 大調用同一組音。'),
  scaleLevel('B', 'melodic', '上行的 G♯ 和 A♯ 都要往前伸。'),
  scaleLevel('E', 'major', '四個升記號，開始有難度了。'),
  scaleLevel('B', 'major', '五個升記號，七個音裡有五個要升。'),
  scaleLevel('C', 'natural', '三個降記號。'),
  scaleLevel('C', 'melodic', '上行的 A 和 B 都要還原回白鍵。'),
  scaleLevel('F', 'natural', '四個降記號，最後一個大調小調也集滿了。'),
  scaleLevel('F', 'melodic', '最後一關，降記號最多的旋律小音階。'),
];

export function levelIndexOf(id) {
  return LEVELS.findIndex((level) => level.id === id);
}
