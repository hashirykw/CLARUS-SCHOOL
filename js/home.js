// home.js — the main Clarus page: preloader, smooth scroll, the chapters' text, theme switch, menus and form.
import { createHomeWorld } from './world-home.js';

/* ---------- content: edit wording here ---------- */
const CLASSES = [
  { title:'Nursery',     open:true,  color:'var(--color-sun)',   desc:'Play, songs, stories and first friends. A gentle start where little ones learn by doing.', age:'Ages to confirm' },
  { title:'KG',          open:true,  color:'var(--color-coral)', desc:'Letters, sounds and numbers come alive through picture books, rhymes and hands-on play.', age:'Ages to confirm' },
  { title:'Class 1',     open:true,  color:'var(--color-sky)',   desc:'First real reading and writing, number work, and small experiments that turn "why?" into "let me try".', age:'Ages to confirm' },
  { title:'Class 2',     open:true,  color:'var(--color-lilac)', desc:'Confident readers start working in teams, presenting ideas and exploring the wider world.', age:'Ages to confirm' },
  { title:'Classes 3–5', open:false, desc:'The primary years. Each opens as our first children reach it, so no one ever has to change schools.', age:'Opening year by year' },
  { title:'Classes 6–8', open:false, desc:'Middle school, with deeper subjects, labs and clubs, planned to open in step with our students.', age:'Planned' },
  { title:'Matric',      open:false, desc:'Classes 9 and 10. The goal the whole staircase is built towards.', age:'Planned' },
];
const CAMPUSES = [
  { tab:'Flagship', name:'Flagship Campus', status:'Open for admissions', soon:false, area:'Area to confirm', text:'The first Clarus campus, home to every class from Nursery to Class 2.', classes:'Nursery – Class 2', time:'To confirm', phone:'To confirm', map:'' },
  { tab:'Junior',   name:'Junior Campus',   status:'Open for admissions', soon:false, area:'Area to confirm', text:'Made for our youngest learners, with bright classrooms and a play garden.', classes:'Nursery – KG', time:'To confirm', phone:'To confirm', map:'' },
  { tab:'Next campus', name:'Next Campus',  status:'Coming soon',         soon:true,  area:'Location to be announced', text:'Already sketched out. Leave your details and we will tell you first when it opens.', classes:'To be announced', time:'—', phone:'—', map:'' },
];
const WHATSAPP = '';   // school WhatsApp number in international format, e.g. 923001234567. Empty = form shows a note.

/* the logo's star, in the logo's own coordinates (see src/defs.html) */
const STAR = { centre:[246.25,148], depth:30, points:{ T:[246.25,12], tr:[270.25,124], R:[353.5,148], br:[270.25,172], B:[246.25,329], bl:[222.25,172], L:[139,148], tl:[222.25,124] } };

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const root = document.documentElement;
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const loading = root.classList.contains('loading');
const loaderStart = performance.now();

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!REDUCE) {
  lenis = new Lenis({ lerp:.085, wheelMultiplier:.9, touchMultiplier:1.4 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  if (loading) lenis.stop();
}
const scrollToY = y => lenis ? lenis.scrollTo(y, { duration:1.6, easing:t => 1 - Math.pow(1 - t, 4) }) : scrollTo({ top:y, behavior:REDUCE ? 'auto' : 'smooth' });
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href'); const el = id === '#top' ? document.body : $(id); if (!el) return;
  e.preventDefault(); closeSheet(); scrollToY(id === '#top' ? 0 : el.getBoundingClientRect().top + scrollY - (id === '#campuses' || id === '#grow' ? 0 : 20));
}));

/* ---------- chapter anchors (scroll px for each keyframe) ---------- */
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

/* ---------- grow chapter text ---------- */
const g = { card:$('#g-card'), tag:$('#g-tag'), count:$('#g-count'), title:$('#g-title'), desc:$('#g-desc'), age:$('#g-age'), dots:$('#g-dots') };
CLASSES.forEach((c, i) => { const li = document.createElement('li'); li.innerHTML = `<span>${c.title}</span><i></i>`; if (!i) li.className = 'on'; g.dots.appendChild(li); });
const gSwap = [g.tag, g.count, g.title, g.desc, g.age]; gSwap.forEach(el => el.classList.add('swap'));
let gShown = 0;
function setClass(k) {
  if (k === gShown) return; gShown = k; const c = CLASSES[k];
  gSwap.forEach(el => el.classList.add('swap-out'));
  clearTimeout(setClass.t);
  setClass.t = setTimeout(() => {
    g.tag.classList.toggle('plan', !c.open); g.tag.querySelector('span').textContent = c.open ? 'Open now' : 'Planned';
    g.count.textContent = `Step ${k + 1} of ${CLASSES.length}`;
    g.title.textContent = c.title; g.title.style.setProperty('--g-color', c.open ? 'var(--color-ink)' : 'var(--color-mute)');
    g.desc.textContent = c.desc; g.age.textContent = c.age;
    gSwap.forEach((el, n) => setTimeout(() => el.classList.remove('swap-out'), n * 45));
  }, 220);
  [...g.dots.children].forEach((d, i) => { d.classList.toggle('on', i === k); d.classList.toggle('done', i < k); });
}
g.count.textContent = `Step 1 of ${CLASSES.length}`;

/* ---------- campus chapter text + tabs ---------- */
const c = { swap:$('#c-swap'), status:$('#c-status'), name:$('#c-name'), area:$('#c-area'), text:$('#c-text'), classes:$('#c-classes'), time:$('#c-time'), phone:$('#c-phone'), num:$('#c-num'), map:$('#c-map'), tabs:$('#c-tabs') };
$('#c-total').textContent = String(CAMPUSES.length).padStart(2, '0');
const pill = document.createElement('i'); pill.className = 'c-pill'; c.tabs.appendChild(pill);
const tabs = CAMPUSES.map((cp, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'c-tab'; b.setAttribute('role', 'tab');
  b.setAttribute('aria-selected', i === 0); b.innerHTML = `<span>${cp.tab}</span>`;
  b.addEventListener('click', () => goCampus(i)); c.tabs.appendChild(b); return b;
});
function placePill(k) { const b = tabs[k]; pill.style.width = b.offsetWidth + 'px'; pill.style.transform = `translateX(${b.offsetLeft}px)`; }
const enqCampus = $('#enq-campus');
CAMPUSES.forEach(cp => { const o = document.createElement('option'); o.textContent = cp.name; enqCampus.appendChild(o); });
let cShown = 0;
c.swap.classList.add('swap');
function setCampus(k) {
  if (k === cShown) return; cShown = k; const cp = CAMPUSES[k];
  tabs.forEach((b, i) => b.setAttribute('aria-selected', i === k)); placePill(k);
  b_scrollTab(k);
  c.swap.classList.add('swap-out');
  clearTimeout(setCampus.t);
  setCampus.t = setTimeout(() => {
    c.status.classList.toggle('soon', cp.soon); c.status.querySelector('span').textContent = cp.status;
    c.name.textContent = cp.name; c.area.textContent = cp.area; c.text.textContent = cp.text;
    c.classes.textContent = cp.classes; c.time.textContent = cp.time; c.phone.textContent = cp.phone;
    c.num.textContent = String(k + 1).padStart(2, '0');
    c.map.href = cp.map || '#campuses'; c.map.toggleAttribute('aria-disabled', !cp.map);
    c.swap.classList.remove('swap-out');
  }, 260);
}
function b_scrollTab(k) { const b = tabs[k]; c.tabs.scrollTo({ left:b.offsetLeft - 20, behavior:'smooth' }); }
function goCampus(k) { k = (k + CAMPUSES.length) % CAMPUSES.length; scrollToY(A[1 + CLASSES.length + k] + 2); }
$('#c-prev').addEventListener('click', () => goCampus(cShown - 1));
$('#c-next').addEventListener('click', () => goCampus(cShown + 1));
c.map.addEventListener('click', e => { if (c.map.hasAttribute('aria-disabled')) e.preventDefault(); });

/* ---------- nav ---------- */
const nav = $('#nav');
const navLinks = $$('.links a[href^="#"]');
function navState(y) {
  nav.classList.toggle('scrolled', y > 40);
  const marks = navLinks.map(a => { const el = $(a.getAttribute('href')); return el ? el.getBoundingClientRect().top : 1e9; });
  let on = -1; marks.forEach((top, i) => { if (top < innerHeight * .45) on = i; });
  navLinks.forEach((a, i) => a.classList.toggle('on', i === on));
}
// mobile sheet
const sheet = $('#sheet'), menuBtn = $('#menu-btn');
function openSheet() { sheet.hidden = false; requestAnimationFrame(() => sheet.classList.add('open')); menuBtn.setAttribute('aria-expanded', 'true'); menuBtn.setAttribute('aria-label', 'Close menu'); lenis && lenis.stop(); }
function closeSheet() { if (sheet.hidden) return; sheet.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Open menu'); setTimeout(() => { sheet.hidden = true; }, 360); lenis && lenis.start(); }
menuBtn.addEventListener('click', () => sheet.hidden ? openSheet() : closeSheet());
sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin:'0px 0px -8% 0px' });
$$('.reveal').forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 70}ms`; io.observe(el); });

/* ---------- form ---------- */
const form = $('#enq'), note = $('#enq-note'), sendBtn = $('#enq-btn');
form.addEventListener('submit', e => {
  e.preventDefault();
  let ok = true;
  form.querySelectorAll('[required]').forEach(f => { const bad = !f.value.trim(); f.closest('.field').classList.toggle('bad', bad); if (bad && ok) { f.focus(); ok = false; } });
  if (!ok) { note.textContent = 'Please fill in the highlighted fields.'; note.classList.remove('ok'); return; }
  const d = new FormData(form);
  if (WHATSAPP) {
    const msg = `Assalam o Alaikum, I'd like to book a visit to Clarus School.\nParent: ${d.get('parent')}\nPhone: ${d.get('phone')}\nClass: ${d.get('class')}\nCampus: ${d.get('campus')}`;
    open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    note.textContent = 'WhatsApp is opening with your details. Just press send.'; note.classList.add('ok');
  } else {
    note.textContent = 'Thank you. This form is connected before launch; for now please message the school directly.'; note.classList.add('ok');
  }
});
form.addEventListener('input', e => e.target.closest('.field')?.classList.remove('bad'));

/* ---------- 3D world ---------- */
const canvas = $('#world');
await Promise.all([document.fonts.load('500 76px Cinzel'), document.fonts.load('600 76px Manrope'), document.fonts.ready]).catch(() => {});
const bands = [1,2,3,4].map(i => document.getElementById('cb' + i).getAttribute('d'));
let world = null;
try { world = await createHomeWorld(canvas, { bands, star:STAR }); }
catch (err) { console.warn('3D world unavailable', err); canvas.remove(); }
if (world) world.applyTheme(root.dataset.theme, true);

let lastY = -1, worldOn = true;
function onScroll() {
  const y = lenis ? lenis.animatedScroll : scrollY;
  const t = scrollT(y);
  if (world) world.state.t = Math.max(0, Math.min(A.length - 2, t));
  // text for the sticky chapters
  if (t >= .5 && t < 1 + CLASSES.length) setClass(Math.min(CLASSES.length - 1, Math.max(0, Math.round(t - 1))));
  if (t >= CLASSES.length + .5) setCampus(Math.min(CAMPUSES.length - 1, Math.max(0, Math.round(t - 1 - CLASSES.length))));
  washL.style.opacity = Math.max(0, 1 - t * 1.3).toFixed(3);
  const covered = paper.getBoundingClientRect().top <= 0;
  if (covered === worldOn) { worldOn = !covered; canvas.classList.toggle('off', covered); }
  navState(y); lastY = y;
}
anchors(); onScroll();
addEventListener('resize', () => { anchors(); world && world.resize(); placePill(cShown); onScroll(); });
if (lenis) lenis.on('scroll', onScroll); else addEventListener('scroll', onScroll, { passive:true });
requestAnimationFrame(() => placePill(0));

addEventListener('pointermove', e => { if (!world) return; world.state.pointer.x = e.clientX / innerWidth * 2 - 1; world.state.pointer.y = e.clientY / innerHeight * 2 - 1; }, { passive:true });
// drag the campus turntable
const pinC = campus.querySelector('.pin'); let dragX = null;
pinC.addEventListener('pointerdown', e => { if (e.target.closest('.c-card,.c-tabs,a,button')) return; dragX = e.clientX; });
addEventListener('pointermove', e => { if (dragX === null || !world) return; world.state.dragV = (e.clientX - dragX) * .0025; world.state.drag += (e.clientX - dragX) * .006; dragX = e.clientX; }, { passive:true });
addEventListener('pointerup', () => { dragX = null; });

let visible = true;
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
gsap.ticker.add(time => { if (world && worldOn && visible) world.frame(time); });

/* ---------- theme switch: a circle of the new theme grows from the button ---------- */
const themeBtn = $('#theme-btn');
function setThemeLabel() { themeBtn.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'); }
setThemeLabel();
themeBtn.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  const apply = () => {
    root.dataset.theme = next; $('#meta-theme').content = next === 'dark' ? '#0B132B' : '#F6F1E6';
    try { localStorage.setItem('clarus-theme', next); } catch (e) {}
    if (world) { world.applyTheme(next, true); world.render(); }
    setThemeLabel();
  };
  if (!document.startViewTransition || REDUCE) { if (world) world.applyTheme(next, false); root.dataset.theme = next; try { localStorage.setItem('clarus-theme', next); } catch (e) {} setThemeLabel(); return; }
  const r = themeBtn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const vt = document.startViewTransition(apply);
  vt.ready.then(() => document.documentElement.animate({ clipPath:[`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
    { duration:900, easing:'cubic-bezier(.65,0,.35,1)', pseudoElement:'::view-transition-new(root)' }));
});

/* ---------- preloader → intro ---------- */
function startIntro(fast) { if (world) world.intro(fast ? 1.6 : 2.4); }
if (loading) {
  const wait = Math.max(0, 2850 - (performance.now() - loaderStart));
  setTimeout(() => {
    const ld = $('#loader'); ld.classList.add('out');
    setTimeout(() => startIntro(false), 250);
    setTimeout(() => { ld.classList.add('gone'); root.classList.remove('loading'); lenis && lenis.start(); try { sessionStorage.setItem('clarus-loaded', '1'); } catch (e) {} }, 1150);
  }, wait);
} else startIntro(true);
window.__ready = true;
