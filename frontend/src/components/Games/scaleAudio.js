import { frequencyOf } from './musicTheory';

// 用 Web Audio 直接合成音高，不需要任何音檔。
// 三角波加上柔和的包絡，比純正弦有一點點弦樂的味道，也不會像方波那樣刺耳。

let context = null;
let scheduled = [];

function audioContext() {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!context) context = new Ctor();
  // 瀏覽器要求使用者互動後才能出聲，被擋住時第一次點擊會把它喚醒。
  if (context.state === 'suspended') context.resume();
  return context;
}

export function isAudioAvailable() {
  return Boolean(typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext));
}

function scheduleNote(ctx, midi, startAt, duration) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = frequencyOf(midi);

  const peak = 0.22;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.02);
  gain.gain.setValueAtTime(peak, startAt + duration * 0.55);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.05);
  scheduled.push(oscillator);
  oscillator.onended = () => {
    scheduled = scheduled.filter((item) => item !== oscillator);
  };
}

export function stopAll() {
  scheduled.forEach((oscillator) => {
    try {
      oscillator.stop();
    } catch {
      // 已經自己停掉的振盪器再停一次會丟例外，忽略即可。
    }
  });
  scheduled = [];
}

export function playNote(midi, duration = 0.55) {
  const ctx = audioContext();
  if (!ctx) return;
  scheduleNote(ctx, midi, ctx.currentTime, duration);
}

export function playSequence(midis, { gap = 0.42, duration = 0.5 } = {}) {
  const ctx = audioContext();
  if (!ctx) return;
  stopAll();
  midis.forEach((midi, index) => scheduleNote(ctx, midi, ctx.currentTime + 0.05 + index * gap, duration));
}

export function playChord(midis, duration = 1.1) {
  const ctx = audioContext();
  if (!ctx) return;
  midis.forEach((midi) => scheduleNote(ctx, midi, ctx.currentTime + 0.03, duration));
}
