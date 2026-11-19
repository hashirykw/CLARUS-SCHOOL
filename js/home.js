// home.js — the main Clarus page: opening, smooth scroll, reveals, chapter text, dock (theme + sound), menu and form.
import { createHomeWorld } from './world-home.js';
import { sound } from './sound.js';

/* ---------- content: edit wording here ---------- */
const CLASSES = [
  { title:'Nursery',     open:true,  tag:'var(--color-tan)',          text:'Where it all begins.' },
  { title:'KG',          open:true,  tag:'var(--color-oxblood)',  text:'Letters, numbers, first stories.' },
  { title:'Class 1',     open:true,  tag:'oklch(62% .08 160)',        text:'Reading and writing with confidence.' },
  { title:'Class 2',     open:true,  tag:'var(--color-silver)',       text:'Thinking, speaking, sharing ideas.' },
  { title:'Classes 3–5', open:false, text:'Opening year by year.' },
  { title:'Classes 6–8', open:false, text:'Opening year by year.' },
  { title:'Matric',      open:false, text:'Where the staircase leads.' },
];
// Fill in real details; empty fields are simply not shown.
const CAMPUSES = [
  { tab:'Flagship', name:'Flagship Campus', soon:false, text:'Nursery to Class 2', map:'' },
  { tab:'Junior',   name:'Junior Campus',   soon:false, text:'Nursery and KG',     map:'' },
  { tab:'Next',     name:'Next Campus',     soon:true,  text:'',                   map:'' },
];
const WHATSAPP = '';   // school WhatsApp in international format, e.g. 923001234567

/* the logo's star, in the logo's own coordinates (built in src/defs.html) */
const STAR_C = [246.25, 170], STAR_R = [92, 24, 46, 24];   // main point, valley, diagonal point, valley

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const root = document.documentElement;
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const loading = root.classList.contains('loading');
const t0 = performance.now();
const isPhone = () => innerWidth < 820;

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!REDUCE) {
  lenis = new Lenis({ lerp:.085, wheelMultiplier:.9, touchMultiplier:1.3 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  if (loading) lenis.stop();
}
const scrollToY = y => lenis ? lenis.scrollTo(y, { duration:1.5, easing:t => 1 - Math.pow(1 - t, 4) }) : scrollTo({ top:y, behavior:REDUCE ? 'auto' : 'smooth' });
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href'); if (id === '#') return;
  const el = id === '#top' ? document.body : $(id); if (!el) return;
  e.preventDefault(); closeMenu();
  scrollToY(id === '#top' ? 0 : el.getBoundingClientRect().top + scrollY);
}));
addEventListener('pointerdown', e => { if (e.target.closest('.btn, .link, .links a, .sheet a, .brand, .jr-card, .nexlyr, .seg button')) sound.tap(); });

/* ---------- motion buttons (Sir Xahid site): rolling label, arrow through its disc, colour flood ---------- */
const ARROW = '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
$$('.btn').forEach(b => {
  const label = b.textContent.trim().replace(/\s+/g, ' '); if (!label) return;
  const esc = label.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  b.innerHTML = `<span class="btn-l"><span>${esc}</span><span aria-hidden="true">${esc}</span></span><span class="btn-fill" aria-hidden="true"></span><span class="btn-i" aria-hidden="true">${ARROW}${ARROW}</span>`;
});

/* ---------- chapter anchors ---------- */
const grow = $('#grow'), campus = $('#campuses'), paper = $('#paper');
const washH = $('#wash-h'), washT = $('#wash-t'), grain = $('#grainy');
grow.style.setProperty('--steps', CLASSES.length); campus.style.setProperty('--campuses', CAMPUSES.length);
let A = [];
function anchors() {
  const vh = innerHeight, gTop = grow.offsetTop, cTop = campus.offsetTop;
  const stepH = (grow.offsetHeight - vh) / CLASSES.length, campH = (campus.offsetHeight - vh) / CAMPUSES.length;
  A = [0, ...CLASSES.map((_, i) => gTop + i * stepH), ...CAMPUSES.map((_, j) => cTop + j * campH), cTop + CAMPUSES.length * campH];
}
function scrollT(y) {
  if (y <= A[0]) return 0;
  for (let i = 0; i < A.length - 1; i++) if (y < A[i+1]) return i + (y - A[i]) / (A[i+1] - A[i]);
  return A.length - 2;
}

/* ---------- classes panel ---------- */
const g = { tag:$('#g-tag'), title:$('#g-title'), text:$('#g-desc'), bar:$('#g-bar') };
CLASSES.forEach((_, i) => { const s = document.createElement('i'); if (!i) s.className = 'on'; g.bar.appendChild(s); });
const gParts = [g.tag, g.title, g.text]; gParts.forEach(el => el.classList.add('swap'));
function paintClass(k) {
  const c = CLASSES[k];
  g.tag.querySelector('span').textContent = c.open ? 'Open' : 'Planned';
  g.tag.style.setProperty('--tag', c.open ? c.tag : 'var(--color-faint)');
  g.title.textContent = c.title; g.text.textContent = c.text;
}
paintClass(0);
let gShown = 0;
function setClass(k) {
  if (k === gShown) return; gShown = k;
  [...g.bar.children].forEach((d, i) => { d.classList.toggle('on', i === k); d.classList.toggle('done', i < k); });
  gParts.forEach(el => el.classList.add('out'));
  clearTimeout(setClass.t);
  setClass.t = setTimeout(() => { paintClass(k); gParts.forEach((el, n) => setTimeout(() => el.classList.remove('out'), n * 60)); }, 210);
}

/* ---------- campus panel + segmented control ---------- */
const c = { tag:$('#c-status'), name:$('#c-name'), text:$('#c-text'), map:$('#c-map'), tabs:$('#c-tabs'), visit:$('#c-visit') };
const cParts = [c.tag, c.name, c.text]; cParts.forEach(el => el.classList.add('swap'));
const pill = document.createElement('i'); pill.className = 'seg-pill'; c.tabs.appendChild(pill);
const tabs = CAMPUSES.map((cp, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab');
  b.setAttribute('aria-selected', String(i === 0)); b.textContent = cp.tab;
  b.addEventListener('click', () => goCampus(i)); c.tabs.appendChild(b); return b;
});
function placePill(k) { const b = tabs[k]; pill.style.width = b.offsetWidth + 'px'; pill.style.transform = `translateX(${b.offsetLeft - 4}px)`; }
function paintCampus(k) {
  const cp = CAMPUSES[k];
  c.tag.querySelector('span').textContent = cp.soon ? 'Coming soon' : 'Open';
  c.tag.style.setProperty('--tag', cp.soon ? 'var(--color-gold)' : 'var(--color-ok)');
  c.name.textContent = cp.name; c.text.textContent = cp.text;
  c.visit.hidden = cp.soon;
  c.map.hidden = !cp.map; if (cp.map) { c.map.href = cp.map; c.map.target = '_blank'; c.map.rel = 'noopener'; }
}
paintCampus(0);
const enqCampus = $('#enq-campus');
CAMPUSES.filter(cp => !cp.soon).forEach(cp => { const o = document.createElement('option'); o.textContent = cp.name; enqCampus.appendChild(o); });
let cShown = 0;
function setCampus(k) {
  if (k === cShown) return; cShown = k;
  tabs.forEach((b, i) => b.setAttribute('aria-selected', String(i === k))); placePill(k);
  cParts.forEach(el => el.classList.add('out'));
  clearTimeout(setCampus.t);
  setCampus.t = setTimeout(() => { paintCampus(k); cParts.forEach((el, n) => setTimeout(() => el.classList.remove('out'), n * 60)); }, 210);
  sound.campus(k);
}
function goCampus(k) { scrollToY(A[1 + CLASSES.length + k] + 2); }

/* ---------- nav + menu ---------- */
const nav = $('#nav'), dock = $('#dock'), sheet = $('#sheet'), menuBtn = $('#menu-btn');
const navLinks = $$('.links a[href^="#"]');
let lastY = 0;
const menuOpen = () => sheet.classList.contains('open');
function openMenu() { sheet.classList.add('open'); menuBtn.setAttribute('aria-expanded', 'true'); menuBtn.setAttribute('aria-label', 'Close menu'); dock.classList.add('away'); }
function closeMenu() { if (!menuOpen()) return; sheet.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Open menu'); dock.classList.remove('away'); }
menuBtn.addEventListener('click', () => { sound.tap(); menuOpen() ? closeMenu() : openMenu(); });
addEventListener('pointerdown', e => { if (menuOpen() && !e.target.closest('.nav, .sheet')) closeMenu(); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
function navState(y) {
  const down = y > lastY + 2, upw = y < lastY - 2;
  nav.classList.toggle('scrolled', y > 40);
  if (y < 80 || upw) nav.classList.remove('hide'); else if (down && !menuOpen()) nav.classList.add('hide');
  // on phones the dock steps aside while scrolling down, back on the way up
  if (isPhone() && !menuOpen()) dock.classList.toggle('away', down && y > 200 ? true : upw ? false : dock.classList.contains('away'));
  let on = -1; navLinks.forEach((a, i) => { const el = $(a.getAttribute('href')); if (el && el.getBoundingClientRect().top < innerHeight * .45) on = i; });
  navLinks.forEach((a, i) => a.classList.toggle('on', i === on));
  lastY = y;
}

/* ---------- reveals: lines rise from behind masks, images wipe open, cards drift up ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin:'0px 0px -12% 0px' });
$$('.reveal, .wipe, .rv, .ch-head').forEach((el, i) => io.observe(el));

/* ---------- footer photographs drift faster while the page is moving ---------- */
const stripAnims = () => $$('.strip-track').flatMap(t => t.getAnimations ? t.getAnimations() : []);
let stripRate = 1, stripTarget = 1, stripList = null;
if (!REDUCE && lenis) {
  lenis.on('scroll', e => { stripTarget = 1 + Math.min(4, Math.abs(e.velocity || 0) * .12); });
  gsap.ticker.add(() => {
    stripTarget += (1 - stripTarget) * .04;
    stripRate += (stripTarget - stripRate) * .1;
    if (!stripList || !stripList.length) stripList = stripAnims();
    stripList.forEach(a => a.playbackRate = stripRate);
  });
}
document.body.classList.add('split-ready');

/* ---------- statement: words light up as it scrolls through ---------- */
const st = $('#statement');
st.innerHTML = st.textContent.split(' ').map(w => `<span class="w">${w}</span>`).join(' ');
const words = [...st.querySelectorAll('.w')];
function statementState() {
  const r = st.getBoundingClientRect(), vh = innerHeight;
  const p = Math.min(1, Math.max(0, (vh * .85 - r.top) / (r.height + vh * .45)));
  const n = Math.round(p * words.length);
  words.forEach((w, i) => w.classList.toggle('lit', i < n));
}

/* ---------- form ---------- */
const form = $('#enq'), note = $('#enq-note');
form.addEventListener('submit', e => {
  e.preventDefault();
  let ok = true;
  form.querySelectorAll('[required]').forEach(f => { const bad = !f.value.trim(); f.closest('.field').classList.toggle('bad', bad); if (bad && ok) { f.focus(); ok = false; } });
  if (!ok) { note.textContent = 'Please fill in the highlighted fields.'; return; }
  const d = new FormData(form);
  if (WHATSAPP) {
    const msg = `Assalam o Alaikum. I'd like to book a visit to Clarus School.\nParent: ${d.get('parent')}\nPhone: ${d.get('phone')}\nClass: ${d.get('class')}\nCampus: ${d.get('campus')}`;
    open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    note.textContent = 'WhatsApp is opening with your details.';
  } else note.textContent = 'Online booking opens soon.';
});
form.addEventListener('input', e => e.target.closest('.field')?.classList.remove('bad'));

/* ---------- dock: theme switch + sound ---------- */
const themeBtn = $('#theme-btn'), soundBtn = $('#sound-btn');
const syncTheme = () => themeBtn.setAttribute('aria-checked', String(root.dataset.theme === 'dark'));
syncTheme();
const syncSound = () => { soundBtn.setAttribute('aria-pressed', String(sound.on)); soundBtn.setAttribute('aria-label', sound.on ? 'Sound effects on' : 'Sound effects off'); };
syncSound();
soundBtn.addEventListener('click', () => { sound.set(!sound.on); syncSound(); });
let world = null;
themeBtn.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  sound.theme(next === 'dark');
  const apply = () => {
    root.dataset.theme = next; $('#meta-theme').content = next === 'dark' ? '#0F1D31' : '#13233A';
    try { localStorage.setItem('clarus-theme', next); } catch (e) {}
    if (world) { world.applyTheme(next, true); world.render(); }
    syncTheme();
  };
  if (!document.startViewTransition || REDUCE) { apply(); return; }
  const k = themeBtn.querySelector('.tpill-k').getBoundingClientRect(), x = k.left + k.width / 2, y = k.top + k.height / 2;
  const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const vt = document.startViewTransition(apply);
  vt.ready.then(() => root.animate({ clipPath:[`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
    { duration:850, easing:'cubic-bezier(.65,0,.35,1)', pseudoElement:'::view-transition-new(root)' }));
});

/* ---------- opening progress ---------- */
const pr = $('#ld-pr'), pct = $('#ld-pct');
let shown = 0, target = 0;
function setProgress(p) { target = Math.max(target, p); }
if (loading) (function tick() {
  shown += (target - shown) * .08 + .002; shown = Math.min(shown, target);
  pr.style.setProperty('--p', shown.toFixed(3)); pct.textContent = String(Math.round(shown * 100)).padStart(2, '0');
  if (shown < .999 || !document.getElementById('loader')) { if (document.getElementById('loader')) requestAnimationFrame(tick); }
})();
setProgress(.18);

/* ---------- 3D world ---------- */
const canvas = $('#world');
await Promise.all([document.fonts.load('500 64px Cinzel'), document.fonts.load('600 40px "Playfair Display"'), document.fonts.ready]).catch(() => {});
setProgress(.45);
const bands = [1,2,3,4].map(i => document.getElementById('cb' + i).getAttribute('d'));
try { world = await createHomeWorld(canvas, { bands, star:{ centre:STAR_C, radii:STAR_R, depth:22 } }); }
catch (err) { console.warn('3D world unavailable', err); canvas.remove(); }
if (world) { world.applyTheme(root.dataset.theme, true); world.render(); }
setProgress(.92);

let worldOn = true, lastStep = 0;
function onScroll() {
  const y = lenis ? lenis.animatedScroll : scrollY;
  const t = scrollT(y);
  if (world) world.state.t = Math.max(0, Math.min(A.length - 2, t));
  const heroMix = 1 - Math.min(1, Math.max(0, t / .55));
  washH.style.opacity = heroMix.toFixed(3);
  washT.style.opacity = (1 - heroMix).toFixed(3);
  grain.style.opacity = (.06 + heroMix * .12).toFixed(3);
  if (t >= .5 && t < 1 + CLASSES.length) {
    const k = Math.min(CLASSES.length - 1, Math.max(0, Math.round(t - 1)));
    if (k !== lastStep) { sound.step(k); lastStep = k; }
    setClass(k);
  }
  if (t >= CLASSES.length + .5) setCampus(Math.min(CAMPUSES.length - 1, Math.max(0, Math.round(t - 1 - CLASSES.length))));
  const covered = paper.getBoundingClientRect().top <= -160;
  if (covered === worldOn) { worldOn = !covered; canvas.classList.toggle('off', covered); }
  navState(y); statementState();
}
anchors(); onScroll(); window.__A = () => A;
addEventListener('resize', () => { anchors(); world && world.resize(); placePill(cShown); onScroll(); });
if (lenis) lenis.on('scroll', onScroll); else addEventListener('scroll', onScroll, { passive:true });
requestAnimationFrame(() => placePill(0));

addEventListener('pointermove', e => { if (!world) return; world.state.pointer.x = e.clientX / innerWidth * 2 - 1; world.state.pointer.y = e.clientY / innerHeight * 2 - 1; }, { passive:true });
const pinC = campus.querySelector('.pin'); let dragX = null;
pinC.addEventListener('pointerdown', e => { if (e.target.closest('.panel,.seg,a,button')) return; dragX = e.clientX; });
addEventListener('pointermove', e => { if (dragX === null || !world) return; world.state.dragV = (e.clientX - dragX) * .002; world.state.drag += (e.clientX - dragX) * .006; dragX = e.clientX; }, { passive:true });
addEventListener('pointerup', () => { dragX = null; });

let visible = true;
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
gsap.ticker.add(time => { if (world && worldOn && visible) world.frame(time); });

/* ---------- opening → hero ---------- */
function heroIn() { $('#hero-h').classList.add('in'); }
if (loading) {
  setProgress(1);
  setTimeout(() => {
    const ld = $('#loader'); ld.classList.add('out');
    setTimeout(() => { root.classList.remove('loading'); heroIn(); if (world) world.intro(2.2); lenis && lenis.start(); sound.open(); }, 380);
    setTimeout(() => { ld.remove(); try { sessionStorage.setItem('clarus-loaded', '1'); } catch (e) {} }, 1300);
  }, Math.max(0, 2600 - (performance.now() - t0)));
} else { heroIn(); if (world) world.intro(1.6); }
window.__ready = true;
