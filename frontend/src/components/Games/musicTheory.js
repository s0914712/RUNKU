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
  harmonic: {
    label: '和聲小調',
    en: 'HARMONIC MINOR',
    mood: '第七音升高半音，聽起來有點神秘',
    steps: [0, 2, 3, 5, 7, 8, 11, 12],
    formula: ['全', '半', '全', '全', '半', '全半', '半'],
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

// 小提琴第一把位。妹妹拉的是小提琴，所以每個音都要能指出「哪一條弦、第幾指」。
export const OPEN_STRINGS = [
  { name: 'G', midi: 55 },
  { name: 'D', midi: 62 },
  { name: 'A', midi: 69 },
  { name: 'E', midi: 76 },
];

const FINGER_BY_OFFSET = {
  0: { finger: '空弦', short: '0' },
  1: { finger: '低一指', short: '1' },
  2: { finger: '一指', short: '1' },
  3: { finger: '低二指', short: '2' },
  4: { finger: '二指', short: '2' },
  5: { finger: '三指', short: '3' },
  6: { finger: '高三指', short: '3' },
  7: { finger: '四指', short: '4' },
};

// 選「搆得到這個音的最高那條弦」，這也是實際拉音階時的自然選擇。
export function violinPosition(midi) {
  for (let index = OPEN_STRINGS.length - 1; index >= 0; index -= 1) {
    const offset = midi - OPEN_STRINGS[index].midi;
    if (offset >= 0 && offset <= 7) {
      return { string: OPEN_STRINGS[index].name, stringIndex: index, offset, ...FINGER_BY_OFFSET[offset] };
    }
  }
  return null;
}

// 每個調的起始八度都挑過，讓整個音階留在第一把位（見 scripts/test_music_theory.py）。
const TONIC_OCTAVE = { G: 3, A: 3, B: 3, C: 4, D: 4, E: 4, F: 4 };

function scaleLevel(letter, mode, note) {
  const octave = TONIC_OCTAVE[letter];
  const { label } = SCALE_MODES[mode];
  return {
    id: `${mode}-${letter}`,
    type: 'build',
    letter,
    octave,
    mode,
    name: `${letter} ${label}`,
    en: `${letter} ${SCALE_MODES[mode].en}`,
    note,
  };
}

export const LEVELS = [
  {
    id: 'lesson-steps',
    type: 'lesson',
    name: '全音與半音',
    en: 'WHOLE & HALF STEPS',
    note: '所有大調小調都是用這兩種距離拼出來的。先把它們分清楚，後面每一關都會用到。',
  },
  scaleLevel('D', 'major', '從空弦 D 出發，這是小提琴最先學的音階。'),
  scaleLevel('G', 'major', '從空弦 G 出發，最低的那條弦。'),
  scaleLevel('A', 'major', '從空弦 A 出發，三條空弦都用上了。'),
  scaleLevel('C', 'major', '全部都是白鍵，鋼琴上最單純的大調。'),
  scaleLevel('A', 'natural', '和 C 大調用一模一樣的音，但聽起來完全不同——差別只在從哪裡開始。'),
  {
    id: 'ear-1',
    type: 'ear',
    name: '聽聽看：大調還是小調？',
    en: 'MAJOR OR MINOR?',
    note: '不用按鍵盤，只要聽。大調明亮，小調柔和一點。',
  },
  scaleLevel('F', 'major', '第一個有降記號的調，B 要降成 B♭。'),
  scaleLevel('E', 'natural', '從空弦 E 的低八度出發。'),
  scaleLevel('D', 'natural', '和 D 大調同一個起點，只有三個音不一樣，聽起來卻差很多。'),
  scaleLevel('A', 'harmonic', '把自然小調的第七音升高半音，最後一步會變成一個半音的大跳。'),
  scaleLevel('E', 'harmonic', '同樣的升七音手法，換到 E 上面。'),
  scaleLevel('G', 'natural', '兩個降記號。'),
  scaleLevel('B', 'natural', '兩個升記號，和 D 大調用同一組音。'),
  {
    id: 'ear-2',
    type: 'ear',
    name: '再聽一次：大調還是小調？',
    en: 'MAJOR OR MINOR? · ROUND 2',
    note: '這一輪的調子比較多，慢慢聽。',
  },
  scaleLevel('E', 'major', '四個升記號，開始有難度了。'),
  scaleLevel('B', 'major', '五個升記號，七個音裡有五個要升。'),
  scaleLevel('C', 'natural', '三個降記號。'),
  scaleLevel('F', 'natural', '四個降記號，最後一個大調小調也集滿了。'),
  scaleLevel('D', 'harmonic', '最後一關，升七音的小調再一次。'),
];

export function levelIndexOf(id) {
  return LEVELS.findIndex((level) => level.id === id);
}
