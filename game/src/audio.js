// Synthesised sound only — WebAudio oscillators, no audio files, no network.
// Everything is created lazily on the first user gesture so browsers allow it.
let ctx = null;
let alarmTimer = null;

function audio() {
  if (ctx) return ctx;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  ctx = new AudioContext();
  return ctx;
}

export function unlockAudio() {
  const ac = audio();
  if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
}

function tone(freq, seconds, type = 'sine', gain = 0.08, when = 0) {
  const ac = audio();
  if (!ac) return;
  const start = ac.currentTime + when;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  amp.gain.setValueAtTime(0, start);
  amp.gain.linearRampToValueAtTime(gain, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(amp);
  amp.connect(ac.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.05);
}

export const sfx = {
  click() { tone(660, 0.07, 'triangle', 0.06); },
  grabTick() { tone(520, 0.05, 'square', 0.03); },
  loot() {
    tone(880, 0.16, 'sine', 0.09);
    tone(1318, 0.22, 'sine', 0.09, 0.1);
    tone(1760, 0.3, 'sine', 0.07, 0.2);
  },
  smoke() { tone(220, 0.35, 'sawtooth', 0.04); tone(110, 0.4, 'triangle', 0.05, 0.05); },
  emp() { tone(1200, 0.12, 'square', 0.05); tone(300, 0.25, 'square', 0.05, 0.1); },
  spotted() { tone(980, 0.14, 'square', 0.07); tone(980, 0.14, 'square', 0.07, 0.18); },
  caught() {
    tone(392, 0.25, 'sawtooth', 0.08);
    tone(311, 0.25, 'sawtooth', 0.08, 0.22);
    tone(233, 0.5, 'sawtooth', 0.08, 0.44);
  },
  win() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.28, 'triangle', 0.08, i * 0.13));
  },
};

// A soft two-note pulse while the alarm is high; silent otherwise.
export function setAlarmHum(on) {
  if (on && !alarmTimer) {
    alarmTimer = window.setInterval(() => tone(740, 0.09, 'square', 0.025), 420);
  } else if (!on && alarmTimer) {
    window.clearInterval(alarmTimer);
    alarmTimer = null;
  }
}
