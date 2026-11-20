/* Turntable: one controller for every 3D model on the site.
 * - On its own, the model sways across its front (never showing the back), holds at each end, then sweeps back.
 * - Drag with a finger or the mouse to turn it any way you like, all the way round; it keeps a little momentum.
 * - A moment after you let go, it eases back to its front and carries on swaying.
 * Horizontal drags turn the model; vertical swipes still scroll the page (touch-action: pan-y). */
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export class Turntable {
  constructor(el, { center = 0, range = .7, sweep = 7, hold = 2.2, perPx = null, idle = 2.6, onChange } = {}) {
    Object.assign(this, { el, center, range, sweep, hold, idle, onChange });
    this.perPx = perPx;                       // radians per pixel of drag; default: a full turn across ~1.3 widths
    this.a = center; this.v = 0; this.drag = null; this.lastTouch = -1e9; this.dragged = false;
    this.t = hold + sweep / 2;                // start mid-sweep, at the front, moving
    this.active = false;                      // true while dragging or coasting: callers render every frame
    if (!el) return;
    el.style.touchAction = 'pan-y';
    el.classList.add('turnable');
    el.addEventListener('pointerdown', e => this.down(e));
    el.addEventListener('pointermove', e => this.move(e));
    const up = e => this.up(e);
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
    // swallow the click that follows a real drag, so dragging a model inside a link or card doesn't open it
    el.addEventListener('click', e => { if (this.dragged) { e.preventDefault(); e.stopPropagation(); this.dragged = false; } }, true);
  }
  now() { return performance.now() / 1000; }
  down(e) {
    if (e.button > 0) return;
    this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, lt: this.now(), on: false };
    this.v = 0; this.dragged = false;
  }
  move(e) {
    const d = this.drag; if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.on) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) { this.drag = null; return; }      // a vertical swipe: let the page scroll
      d.on = true; this.dragged = true; this.el.classList.add('turning');
      try { this.el.setPointerCapture(e.pointerId); } catch (_) {}
    }
    const per = this.perPx || (Math.PI * 2) / Math.max(240, this.el.clientWidth * 1.3);
    const t = this.now(), step = (e.clientX - d.lx) * per;
    this.a += step;
    const dt = Math.max(.008, t - d.lt); this.v = this.v * .6 + (step / dt) * .4;
    d.lx = e.clientX; d.lt = t; this.lastTouch = t; this.active = true;
    e.preventDefault();
    this.onChange && this.onChange();
  }
  up(e) {
    const d = this.drag; if (!d || (e && e.pointerId !== d.id)) return;
    if (this.now() - d.lt > .08) this.v = 0;  // held still before letting go: no fling
    this.drag = null; this.lastTouch = this.now(); this.el.classList.remove('turning');
  }
  auto(t) {
    const { sweep, hold, range, center } = this, T = 2 * (sweep + hold), u = ((t % T) + T) % T;
    if (u < hold) return center - range;
    if (u < hold + sweep) return center - range + 2 * range * ease((u - hold) / sweep);
    if (u < 2 * hold + sweep) return center + range;
    return center + range - 2 * range * ease((u - 2 * hold - sweep) / sweep);
  }
  /* advance by dt seconds; returns the angle to use */
  update(dt) {
    dt = Math.min(.05, dt);
    if (this.drag && this.drag.on) { this.active = true; return this.a; }
    if (Math.abs(this.v) > .015) { this.a += this.v * dt; this.v *= Math.exp(-dt * 3.2); this.lastTouch = this.now(); this.active = true; return this.a; }
    this.v = 0;
    if (REDUCE) { this.active = false; return this.a; }
    const since = this.now() - this.lastTouch;
    if (since < this.idle) { this.active = false; return this.a; }
    this.t += dt;
    const target = this.auto(this.t), d = wrap(target - this.a);
    const k = 1 - Math.exp(-dt * (since < this.idle + 2.5 ? 1.8 : 10));   // glide home first, then follow closely
    this.a += d * k;
    this.active = true;
    return this.a;
  }
}
