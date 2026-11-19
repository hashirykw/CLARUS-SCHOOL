// home.js — the main Clarus page: opening, smooth scroll, chapter text, theme + sound, menu and form.
import { createHomeWorld } from './world-home.js';
import { sound } from './sound.js';

/* ---------- content: edit wording here ---------- */
const CLASSES = [
  { title:'Nursery',     open:true,  tag:'var(--color-tan)', text:'Where it all begins.' },
  { title:'KG',          open:true,  tag:'var(--color-oxblood)', text:'Letters, numbers, first stories.' },
  { title:'Class 1',     open:true,  tag:'var(--color-forest)', text:'Reading and writing with confidence.' },
  { title:'Class 2',     open:true,  tag:'var(--color-navy)', text:'Thinking, speaking, sharing ideas.' },
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

/* the logo's star, in the logo's own coordinates (see src/defs.html) */
const STAR = { centre:[246.25,148], depth:30, points:{ T:[246.25,12], tr:[270.25,124], R:[353.5,148], br:[270.25,172], B:[246.25,329], bl:[222.25,172], L:[139,148], tl:[222.25,124] } };

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
  lenis = new Lenis({ lerp:.09, wheelMultiplier:.85, touchMultiplier:1.3 });
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
addEventListener('pointerdown', e => { if (e.target.closest('.btn, .pbtn, .link, .links a, .menu a, .logo, .jr-card, .nexlyr')) sound.tap(); });

/* ---------- magnetic buttons (as on the SMK site): they lean towards the pointer ---------- */
if (matchMedia('(pointer: fine)').matches && !REDUCE) $$('[data-mag]').forEach(el => {
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px,${(e.clientY - r.top - r.height / 2) * .32}px)`;
  });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
});

/* ---------- chapter anchors ---------- */
const grow = $('#grow'), campus = $('#campuses'), paper = $('#paper'), washL = $('#wash-l');
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
  setClass.t = setTimeout(() => { paintClass(k); gParts.forEach((el, n) => setTimeout(() => el.classList.remove('out'), n * 50)); }, 200);
}

/* ---------- campus panel + segmented control ---------- */
const c = { tag:$('#c-status'), name:$('#c-name'), text:$('#c-text'), map:$('#c-map'), tabs:$('#c-tabs') };
const cParts = [c.tag, c.name, c.text]; cParts.forEach(el => el.classList.add('swap'));
const pill = document.createElement('i'); pill.className = 'seg-pill'; c.tabs.appendChild(pill);
const tabs = CAMPUSES.map((cp, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab');
  b.setAttribute('aria-selected', String(i === 0)); b.textContent = cp.tab;
  b.addEventListener('click', () => { sound.tap(); goCampus(i); }); c.tabs.appendChild(b); return b;
});
function placePill(k) { const b = tabs[k]; pill.style.width = b.offsetWidth + 'px'; pill.style.transform = `translateX(${b.offsetLeft - 3}px)`; }
function paintCampus(k) {
  const cp = CAMPUSES[k];
  c.tag.querySelector('span').textContent = cp.soon ? 'Coming soon' : 'Open';
  c.tag.style.setProperty('--tag', cp.soon ? 'var(--color-gold)' : 'var(--color-ok)');
  c.name.textContent = cp.name; c.text.textContent = cp.text;
  $('#c-visit').hidden = cp.soon;
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
  setCampus.t = setTimeout(() => { paintCampus(k); cParts.forEach((el, n) => setTimeout(() => el.classList.remove('out'), n * 50)); }, 200);
  sound.campus(k);
}
function goCampus(k) { scrollToY(A[1 + CLASSES.length + k] + 2); }

/* ---------- nav: compact, hides on the way down, returns on the way up ---------- */
const nav = $('#nav'), side = $('.side');
const navLinks = $$('.links a[href^="#"]');
let lastY = 0;
const menu = $('#menu'), menuBtn = $('#menu-btn');
const menuOpen = () => !menu.hidden;
function navState(y) {
  if (y < 80 || y < lastY - 2) nav.classList.remove('hide'); else if (y > lastY + 2 && !menuOpen()) nav.classList.add('hide');
  const inPaper = paper.getBoundingClientRect().top < innerHeight * .6;
  side.classList.toggle('tuck', isPhone() && inPaper && nav.classList.contains('hide'));
  let on = -1; navLinks.forEach((a, i) => { const el = $(a.getAttribute('href')); if (el && el.getBoundingClientRect().top < innerHeight * .45) on = i; });
  navLinks.forEach((a, i) => a.classList.toggle('on', i === on));
  lastY = y;
}
function openMenu() { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('open')); menuBtn.setAttribute('aria-expanded', 'true'); menuBtn.setAttribute('aria-label', 'Close menu'); }
function closeMenu() { if (menu.hidden) return; menu.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Open menu'); setTimeout(() => { if (!menu.classList.contains('open')) menu.hidden = true; }, 380); }
menuBtn.addEventListener('click', () => { sound.tap(); menuOpen() ? closeMenu() : openMenu(); });
addEventListener('pointerdown', e => { if (menuOpen() && !e.target.closest('.nav')) closeMenu(); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

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

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin:'0px 0px -10% 0px' });
$$('.reveal').forEach((el, i) => { el.style.transitionDelay = `${(i % 2) * 90}ms`; io.observe(el); });

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

/* ---------- theme switch + sound switch ---------- */
const themeBtn = $('#theme-btn'), soundBtn = $('#sound-btn');
const syncTheme = () => themeBtn.setAttribute('aria-checked', String(root.dataset.theme === 'dark'));
syncTheme();
soundBtn.setAttribute('aria-pressed', String(sound.on));
soundBtn.addEventListener('click', () => { sound.set(!sound.on); soundBtn.setAttribute('aria-pressed', String(sound.on)); });
let world = null;
themeBtn.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  sound.theme(next === 'dark');
  const apply = () => {
    root.dataset.theme = next; $('#meta-theme').content = next === 'dark' ? '#0B0B0C' : '#F4F4F1';
    try { localStorage.setItem('clarus-theme', next); } catch (e) {}
    if (world) { world.applyTheme(next, true); world.render(); }
    syncTheme();
  };
  if (!document.startViewTransition || REDUCE) { apply(); return; }
  const r = themeBtn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const vt = document.startViewTransition(apply);
  vt.ready.then(() => root.animate({ clipPath:[`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
    { duration:850, easing:'cubic-bezier(.65,0,.35,1)', pseudoElement:'::view-transition-new(root)' }));
});

/* ---------- 3D world ---------- */
const canvas = $('#world');
await Promise.all([document.fonts.load('500 76px Cinzel'), document.fonts.ready]).catch(() => {});
const bands = [1,2,3,4].map(i => document.getElementById('cb' + i).getAttribute('d'));
try { world = await createHomeWorld(canvas, { bands, star:STAR }); }
catch (err) { console.warn('3D world unavailable', err); canvas.remove(); }
if (world) world.applyTheme(root.dataset.theme, true);

let worldOn = true, lastStep = 0;
function onScroll() {
  const y = lenis ? lenis.animatedScroll : scrollY;
  const t = scrollT(y);
  if (world) world.state.t = Math.max(0, Math.min(A.length - 2, t));
  washL.style.opacity = Math.max(0, 1 - t * 1.4).toFixed(3);
  if (t >= .5 && t < 1 + CLASSES.length) {
    const k = Math.min(CLASSES.length - 1, Math.max(0, Math.round(t - 1)));
    if (k !== lastStep) { sound.step(k); lastStep = k; }
    setClass(k);
  }
  if (t >= CLASSES.length + .5) setCampus(Math.min(CAMPUSES.length - 1, Math.max(0, Math.round(t - 1 - CLASSES.length))));
  const covered = paper.getBoundingClientRect().top <= 0;
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

/* ---------- opening → page ---------- */
function finishOpening() {
  const ld = $('#loader'), from = $('#ld-mark'), to = $('#nav-mark');
  ld.classList.add('out');
  // the mark glides from the centre of the screen into the navbar
  setTimeout(() => {
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    const dx = (b.left + b.width / 2) - (a.left + a.width / 2), dy = (b.top + b.height / 2) - (a.top + a.height / 2), s = b.width / a.width;
    from.animate([{ transform:'none' }, { transform:`translate(${dx}px, ${dy}px) scale(${s})` }], { duration:1000, easing:'cubic-bezier(.65,0,.35,1)', fill:'forwards' });
    setTimeout(() => ld.classList.add('fade'), 380);
    setTimeout(() => { root.classList.add('mark-wait'); root.classList.remove('loading'); if (world) world.intro(2.2); lenis && lenis.start(); sound.open(); }, 620);
    setTimeout(() => { root.classList.remove('mark-wait'); ld.remove(); try { sessionStorage.setItem('clarus-loaded', '1'); } catch (e) {} }, 1330);
  }, 300);
}
if (loading) setTimeout(finishOpening, Math.max(0, 2900 - (performance.now() - t0)));
else if (world) world.intro(1.6);
window.__ready = true;
