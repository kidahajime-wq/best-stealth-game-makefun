// Sound: everything is synthesized with WebAudio, so the game ships
// no audio files. Soft footsteps, a pebble clink, a rising alarm
// sting, a pickup chime and a small win arpeggio.

let ctx = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone(freq, dur, type, gain, when = 0, slideTo = null) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, gain, lowpass) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(ctx.destination);
  src.start(t0);
}

export const sfx = {
  step(sneaking) {
    noiseBurst(0.05, sneaking ? 0.02 : 0.05, sneaking ? 500 : 900);
  },
  pebble() {
    tone(1900, 0.07, 'triangle', 0.06);
    tone(1400, 0.09, 'triangle', 0.05, 0.07);
  },
  clink() {
    tone(2400, 0.12, 'sine', 0.05);
    tone(3100, 0.1, 'sine', 0.04, 0.05);
  },
  pickup() {
    tone(660, 0.1, 'sine', 0.07);
    tone(990, 0.16, 'sine', 0.07, 0.08);
  },
  spotted() {
    tone(220, 0.35, 'sawtooth', 0.07, 0, 440);
    tone(233, 0.35, 'sawtooth', 0.05, 0.02, 466);
  },
  caught() {
    tone(330, 0.5, 'sawtooth', 0.09, 0, 110);
    tone(165, 0.6, 'square', 0.05, 0.1, 82);
  },
  levelClear() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.07, i * 0.09));
  },
  win() {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.3, 'triangle', 0.07, i * 0.11));
  },
};
