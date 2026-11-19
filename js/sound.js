// sound.js — quiet, tuned UI sounds made with Web Audio (no files to download).
// Soft glass and wood tones only: a tap for buttons, a two-note chime for the theme,
// a pitched wooden "tok" as the star lands on each book, a bell when a campus appears.
// Browsers only allow sound after the visitor's first tap or key press, so nothing plays before that.

const KEY = 'clarus-sound';
let ctx = null, master = null, enabled = true;
try { enabled = localStorage.getItem(KEY) !== 'off'; } catch (e) {}

function ensure() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = .55;
  // a touch of soft room: short feedback delay through a low-pass, very quiet
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3;
  const delay = ctx.createDelay(); delay.delayTime.value = .11;
  const fb = ctx.createGain(); fb.gain.value = .22;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
  const wet = ctx.createGain(); wet.gain.value = .18;
  master.connect(comp); master.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay); lp.connect(wet); wet.connect(comp);
  comp.connect(ctx.destination);
  return ctx;
}
['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, () => { if (enabled) ensure(); }, { passive:true }));

// one soft partial: sine with a quick attack and a natural decay
function tone(freq, { t = 0, gain = .08, attack = .004, decay = .9, type = 'sine', bend = 0 } = {}) {
  if (!enabled || !ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime + t;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, now);
  if (bend) o.frequency.exponentialRampToValueAtTime(freq * bend, now + decay * .6);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(gain, now + attack);
  g.gain.exponentialRampToValueAtTime(.0001, now + decay);
  o.connect(g); g.connect(master); o.start(now); o.stop(now + decay + .05);
}
// glass bell: fundamental + two inharmonic partials, like a small tuned glass
function bell(freq, t = 0, gain = .06) {
  tone(freq, { t, gain, decay:1.6 });
  tone(freq * 2.756, { t, gain:gain * .28, decay:.7 });
  tone(freq * 5.404, { t, gain:gain * .08, decay:.35 });
}

const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66];   // C major pentatonic, C5 up

export const sound = {
  get on() { return enabled; },
  set(on) { enabled = on; try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {} if (on) { ensure(); this.tap(); } },
  // buttons and links: a tiny, dry click
  tap() { tone(1900, { gain:.035, decay:.06, bend:.6 }); tone(950, { gain:.02, decay:.05 }); },
  // theme: two notes, rising into light, falling into dark
  theme(dark) { const [a, b] = dark ? [783.99, 587.33] : [587.33, 783.99]; bell(a, 0, .045); bell(b, .11, .05); },
  // star lands on book k: a soft wooden tok, a step higher each book
  step(k) { const f = PENTA[Math.max(0, Math.min(PENTA.length - 1, k))] / 2; tone(f, { gain:.07, decay:.22, bend:.92 }); tone(f * 3, { gain:.012, decay:.08 }); },
  // a campus appears
  campus(k) { bell([659.25, 783.99, 880][k % 3], 0, .04); },
  // the opening finishes (only audible if the visitor has already interacted)
  open() { bell(523.25, 0, .035); bell(783.99, .14, .03); bell(1046.5, .28, .022); },
};
