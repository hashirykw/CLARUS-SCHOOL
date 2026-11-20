/* clarus.js — the Clarus home page: opening, smooth scroll, hero entrance, staircase, campuses, menu, form.
 * Content you may need to edit sits at the top. */
(function () {
'use strict';

/* ═════════ content ═════════ */
const CLASSES = [
  { title: 'Nursery',     open: true,  text: 'Where it all begins.' },
  { title: 'KG',          open: true,  text: 'Letters, numbers, first stories.' },
  { title: 'Class 1',     open: true,  text: 'Reading and writing with confidence.' },
  { title: 'Class 2',     open: true,  text: 'Thinking, speaking, sharing ideas.' },
  { title: 'Classes 3–5', open: false, text: 'Opening year by year.' },
  { title: 'Classes 6–8', open: false, text: 'Opening year by year.' },
  { title: 'Matric',      open: false, text: 'Where the staircase leads.' },
];
// PLACEHOLDER campuses: fill in real details. Empty address/hours show "To be announced"; an empty map hides Directions.
const CAMPUSES = [
  { id: 'jr', name: 'Junior Campus', mark: 'Junior', classes: 'Nursery and KG', status: 'Open', address: '', hours: '', map: '',
    photo: 'assets/photos/junior-room.webp', w: 1400, h: 934, alt: 'A bright early-years room with small tables and star-shaped chairs', note: 'little ones start here' },
  { id: 'sr', name: 'Senior Campus', mark: 'Senior', classes: 'Class 1 onwards, growing to Matric', status: 'Open', address: '', hours: '', map: '',
    photo: 'assets/photos/hallway.webp', w: 760, h: 1600, alt: 'A long, sunlit school corridor with wooden floors' },
];
const WHATSAPP = '';
// School life events. Set date as 'YYYY-MM-DDTHH:MM' (Pakistan time) and the pop-up shows a live countdown; leave '' while it is to be announced.
const EVENTS = [
  { title: 'Science Week', date: '', place: '', text: 'Small hands, big questions. A week of experiments every child can try, from floating and sinking to growing seeds in the classroom.' },
  { title: 'Sports Day',   date: '', place: '', text: 'Races, relays and a cheer for every finish. Families are welcome to watch from the stands.' },
  { title: 'Annual Show',  date: '', place: '', text: 'Every class on stage, every family in the hall: songs, short plays and a first bow.' },
  { title: 'Colour Day',   date: '', place: '', text: 'Paint, play and a lot of happy mess, with every class wearing its own colour.' },
];   // school WhatsApp in international format, e.g. 923001234567

/* ═════════ setup ═════════ */
const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = () => innerWidth <= 820;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const ARW = '<svg class="arw" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';

/* ═════════ build: staircase, campuses, form options ═════════ */
const clsList = $('#cls-list');
const NOW = CLASSES.filter(c => c.open).length - 1;
clsList.innerHTML = CLASSES.map((c, i) => `
  <li class="cl${c.open ? ' is-open' : ' is-plan'}${i === NOW ? ' is-now' : ''}" style="--i:${i}">
    <span class="cl-node" aria-hidden="true"></span>
    <span class="cl-n">${String(i + 1).padStart(2, '0')}</span>
    <h3 class="cl-t">${esc(c.title)}${i === NOW ? '<span class="cl-now lbl">We are here</span>' : ''}</h3>
    <p class="cl-d">${esc(c.text)}</p>
    <span class="cl-s lbl">${c.open ? 'Open 2026' : 'Planned'}</span>
  </li>`).join('');

$('#campus-pair').innerHTML = CAMPUSES.map((c, i) => `
  <article class="campus campus-${c.id} ${i ? 'ink' : 'paper'}" aria-labelledby="cp-${c.id}">
    ${c.note ? `<p class="hand c-note" aria-hidden="true">${esc(c.note)}</p>` : ''}
    <figure class="campus-ph"><img class="ph-photo" src="${c.photo}" width="${c.w}" height="${c.h}" alt="${esc(c.alt)}" loading="lazy" decoding="async"><canvas class="ph-model" id="model-${c.id}" role="img" aria-label="Concept model of the ${esc(c.name)}, turning"></canvas><span class="lbl ph-tag">Concept model</span></figure>
    <div class="campus-txt">
      <div class="campus-k"><span class="lbl">Campus 0${i + 1}</span><span class="lbl c-status">${esc(c.status)}</span></div>
      <h3 id="cp-${c.id}">${c.id === 'jr' ? `<mark>${esc(c.mark)}</mark> Campus` : esc(c.name)}</h3>
      <p class="c-cls">${esc(c.classes)}</p>
      <dl>
        <dt>Address</dt><dd>${esc(c.address || 'To be announced')}</dd>
        <dt>Hours</dt><dd>${esc(c.hours || 'To be announced')}</dd>
      </dl>
      <div class="campus-act">
        <a class="btn${i ? ' btn-paper' : ''}" href="#admissions" data-campus="${esc(c.name)}">Book a visit${ARW}</a>
        ${c.map ? `<a class="link" href="${esc(c.map)}" target="_blank" rel="noopener">Directions</a>` : ''}
      </div>
    </div>
  </article>`).join('');

const campusSel = $('#enq-campus');
campusSel.innerHTML = CAMPUSES.map(c => `<option>${esc(c.name)}</option>`).join('');

/* ═════════ fit the giant words to the column ═════════ */
const hw = $('.hw'), fw = $('.foot-word');
function inkWidth(el) {   // width of the letters themselves, edge to edge
  const sp = el.children; if (!sp.length) return el.scrollWidth;
  return sp[sp.length - 1].getBoundingClientRect().right - sp[0].getBoundingClientRect().left;
}
function fitAll() {
  const h1 = hw.parentElement;
  hw.style.justifyContent = 'flex-start'; h1.style.fontSize = '100px';
  h1.style.fontSize = (100 * h1.clientWidth / inkWidth(hw) * .995) + 'px';
  hw.style.justifyContent = '';
  if (fw) {
    const pad = parseFloat(getComputedStyle(fw).paddingLeft) * 2;
    fw.innerHTML = fw.textContent.split('').map(c => `<span>${c}</span>`).join('');
    fw.style.display = 'flex'; fw.style.fontSize = '100px';
    fw.style.fontSize = (100 * (fw.clientWidth - pad) / inkWidth(fw) * .995) + 'px';
  }
}

/* ═════════ smooth scroll ═════════ */
let lenis = null;
if (!REDUCE) {
  lenis = new Lenis({ lerp: .09, wheelMultiplier: .95, touchMultiplier: 1.4 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
window.__lenis = lenis;

/* ═════════ marquee: always moving, faster while scrolling ═════════ */
const mq = $('#marquee');
if (mq) {
  const track = $('.mq-track', mq);
  for (let i = 0; i < 3; i++) mq.appendChild(track.cloneNode(true));
  let x = 0, boost = 0, onScreen = true;
  new IntersectionObserver(es => { onScreen = es[0].isIntersecting; }).observe(mq.parentElement);
  if (!REDUCE) {
    lenis && lenis.on('scroll', e => { boost = Math.min(Math.abs(e.velocity) * .35, 9); });
    let w = track.offsetWidth; const mw = () => { w = track.offsetWidth; }; addEventListener('resize', mw); document.fonts && document.fonts.ready.then(mw);
    gsap.ticker.add((t, dt) => {
      if (!onScreen || !w) return;
      x -= (0.045 + boost * .02) * dt; boost *= .92;
      if (-x >= w) x += w;
      mq.style.transform = `translate3d(${x}px,0,0)`;
    });
  }
}

/* ═════════ promise: words light up as you read ═════════ */
const pt = $('#promise-t');
if (pt) {
  const HL = ['every', 'child,', 'Matric.'];
  pt.innerHTML = pt.textContent.trim().split(/\s+/).map(w => `<span class="w${HL.includes(w) ? ' hl-w' : ''}">${esc(w)}</span>`).join(' ');
  const words = $$('.w', pt); let lastN = 0;
  if (REDUCE) words.forEach(w => w.classList.add('on', ...(w.classList.contains('hl-w') ? ['hl'] : [])));
  else ScrollTrigger.create({
    trigger: pt, start: 'top 80%', end: 'bottom 45%', scrub: true,
    onUpdate: s => { const n = Math.round(s.progress * words.length); if (n === lastN) return;
      const lo = Math.min(n, lastN), hi = Math.max(n, lastN); lastN = n;
      for (let i = lo; i < hi; i++) { const w = words[i], on = i < n, hl = w.classList.contains('hl-w'); w.classList.toggle(hl ? 'hl' : 'on', on); } }
  });
}

/* ═════════ section reveals ═════════ */
function reveals() {
  if (REDUCE) return;
  $$('.sec-head, .campus-head .wrap, .jr-txt, .msg-txt, .adm-head').forEach(head => {
    const lines = $$('.ln > span', head), rest = $$(':scope > :not(.h2):not(.ln)', head).filter(e => !e.matches('.h2'));
    const tl = gsap.timeline({ scrollTrigger: { trigger: head, start: 'top 82%', toggleActions: 'play none none none' } });
    if (lines.length) tl.from(lines, { yPercent: 105, duration: 1.05, ease: 'expo.out', stagger: .09 }, 0);
    tl.from(rest, { y: 18, opacity: 0, duration: .8, ease: 'power3.out', stagger: .07 }, .15);
  });
  $$('.reveal-img').forEach(el => gsap.to(el, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' } }));
  $$('.reveal-img img').forEach(img => gsap.fromTo(img, { scale: 1.18 }, { scale: 1, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: img, start: 'top 85%', toggleActions: 'play none none none' } }));
  $$('.uni-card, .tcard, .ev, .enq, .fees, .msg-pol').forEach((el, i) => gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: 'expo.out', delay: (i % 4) * .08, scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' } }));
  $$('.uni-art svg').forEach(svg => gsap.from(svg, { y: -26, rotate: -3, transformOrigin: '50% 0%', duration: 1.4, ease: 'elastic.out(1,.55)', scrollTrigger: { trigger: svg, start: 'top 85%', toggleActions: 'play none none none' } }));
  $$('.campus-ph .ph-photo').forEach(img => gsap.fromTo(img, { yPercent: -9 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
  $$('.campus').forEach(c => gsap.from($$('.campus-txt > *', c), { y: 22, opacity: 0, duration: .9, ease: 'power3.out', stagger: .07, scrollTrigger: { trigger: c, start: 'top 70%', toggleActions: 'play none none none' } }));
}

/* ═════════ classes: a rule fills down the list; this year's class is marked ═════════ */
function classes() {
  const rows = $$('.cl'), fill = $('#cls-fill'), list = $('#cls');
  if (REDUCE) { fill.style.transform = 'scaleY(1)'; return; }
  rows.forEach(r => gsap.from($$('.cl-n, .cl-t, .cl-d, .cl-s', r), { y: 26, opacity: 0, duration: .9, ease: 'expo.out', stagger: .05,
    scrollTrigger: { trigger: r, start: 'top 88%', toggleActions: 'play none none none' } }));
  const nowRow = rows[NOW];
  let H = 1, nodes = [], target = 1, lit = -1;
  const measure = () => {
    H = list.offsetHeight || 1;
    nodes = rows.map(r => r.offsetTop + r.offsetHeight / 2);
    target = Math.min(1, (nowRow.offsetTop + nowRow.offsetHeight / 2) / H);
  };
  const light = p => {
    const y = p * target * H; let n = 0; while (n < nodes.length && nodes[n] <= y + 1) n++;
    if (n === lit) return; lit = n; rows.forEach((r, i) => r.classList.toggle('lit', i < n));
  };
  measure();
  ScrollTrigger.create({ trigger: list, start: 'top 70%', endTrigger: nowRow, end: 'center 55%', scrub: .5,
    onRefresh: s => { measure(); fill.style.transform = `scaleY(${s.progress * target})`; light(s.progress); },
    onUpdate: s => { fill.style.transform = `scaleY(${s.progress * target})`; light(s.progress); } });
}

/* ═════════ school life: each event opens a pop-up with a countdown ═════════ */
function events() {
  const dlg = $('#ev-modal'); if (!dlg) return;
  const icons = $$('.ev .ev-ic').map(svg => svg.outerHTML);
  let timer = null;
  const pad = n => String(n).padStart(2, '0');
  function tick(ev) {
    const box = $('.evm-count', dlg); if (!box) return;
    const t = ev.date ? new Date(ev.date + '+05:00').getTime() : NaN;
    let parts = ['--', '--', '--', '--'], note = 'The countdown starts as soon as the school announces the date.';
    if (!isNaN(t)) {
      const d = Math.max(0, t - Date.now());
      parts = [Math.floor(d / 864e5), pad(Math.floor(d / 36e5) % 24), pad(Math.floor(d / 6e4) % 60), pad(Math.floor(d / 1e3) % 60)].map(String);
      note = d ? new Date(t).toLocaleString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Happening now!';
    }
    $$('.evm-u b', box).forEach((b, i) => { if (b.textContent !== parts[i]) b.textContent = parts[i]; });
    $('.evm-note', dlg).textContent = note;
  }
  function open(i) {
    const ev = EVENTS[i]; if (!ev) return;
    dlg.innerHTML = `
      <div class="evm-in">
        <button class="evm-x" type="button" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
        <div class="evm-top">${icons[i] || ''}<span class="lbl">Event ${pad(i + 1)} · School life</span></div>
        <h3 id="evm-t">${esc(ev.title)}</h3>
        <p class="evm-d">${esc(ev.text)}</p>
        <div class="evm-count" role="timer" aria-live="off">
          <div class="evm-u"><b>--</b><span class="lbl">Days</span></div>
          <div class="evm-u"><b>--</b><span class="lbl">Hours</span></div>
          <div class="evm-u"><b>--</b><span class="lbl">Min</span></div>
          <div class="evm-u"><b>--</b><span class="lbl">Sec</span></div>
        </div>
        <p class="lbl evm-when">${ev.date ? 'Date' : 'Date to be announced'}</p>
        <p class="evm-note"></p>
        <dl class="evm-meta"><dt class="lbl">Venue</dt><dd>${esc(ev.place || 'To be announced')}</dd><dt class="lbl">Who</dt><dd>Clarus families</dd></dl>
        <a class="btn btn-crimson" href="/#admissions">Book a visit<svg class="arw" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></a>
      </div>`;
    tick(ev); clearInterval(timer); timer = setInterval(() => tick(ev), 1000);
    dlg.showModal(); lenis && lenis.stop(); root.classList.add('modal-open');
    if (!REDUCE) gsap.fromTo($('.evm-in', dlg), { y: 30, opacity: 0, scale: .97 }, { y: 0, opacity: 1, scale: 1, duration: .6, ease: 'expo.out' });
  }
  function close() { clearInterval(timer); if (dlg.open) dlg.close(); }
  dlg.addEventListener('close', () => { clearInterval(timer); lenis && lenis.start(); root.classList.remove('modal-open'); });
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('.evm-x')) close(); else if (e.target.closest('a')) close(); });
  $$('.ev[data-ev]').forEach(card => {
    card.addEventListener('click', () => open(+card.dataset.ev));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(+card.dataset.ev); } });
  });
}

/* ═════════ 3D: the campus model in the hero, campus stills in the cards ═════════ */
let hero3d = null, want3d = false;
const play3d = () => { want3d = true; if (hero3d) hero3d.play(); };
async function load3D() {
  const cv = $('#hero3d'); if (!cv) return;
  try {
    const m = await import('./campus3d.js');
    hero3d = await m.heroModel(cv);
    $('.hero-photo').classList.add('has-3d');
    if (want3d) hero3d.play();
    const idle = window.requestIdleCallback || (f => setTimeout(f, 600));
    // more of the world: the book staircase, the crest, the school-life objects
    import('./objects3d.js').then(async o => {
      const bc = $('#books3d');
      if (bc) { await o.books(bc, CLASSES); bc.closest('.cls-3d').classList.add('on'); }
      idle(async () => {
        const urls = await o.eventStills();
        $$('.ev[data-ev]').forEach((card, i) => {
          if (!urls[i]) return;
          const img = new Image(); img.className = 'ev-3d'; img.alt = ''; img.decoding = 'async';
          img.onload = () => card.classList.add('has-3d'); img.src = urls[i];
          card.querySelector('.ev-ic').after(img);
        });
      }, { timeout: 4000 });
    }).catch(e => console.warn('3D objects unavailable', e));
    idle(async () => {
      for (const [id, kind, start, speed] of [['jr', 'junior', -.5, 1], ['sr', 'senior', 2.2, .85]]) {
        const cv = $('#model-' + id); if (!cv) continue;
        await m.campusLive(cv, kind, { start, speed });
        cv.closest('.campus-ph').classList.add('has-model');
      }
    }, { timeout: 2500 });
  } catch (e) { console.warn('3D unavailable', e); }
}

/* ═════════ hero entrance ═════════ */
function heroIn(fast) {
  const d = fast ? .55 : 1;
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  if (REDUCE) { play3d(); return tl; }
  tl.from('.hw > span', { yPercent: 108, duration: 1.3 * d, stagger: .055 }, 0)
    .from('.hero-labels', { opacity: 0, y: -10, duration: .8 * d }, .1)
    .from('.hero-tag .ln > span', { yPercent: 105, duration: 1.1 * d, stagger: .08 }, .35 * d)
    .from('.hero-p, .hero-ctas, .hero-classes', { opacity: 0, y: 16, duration: .9 * d, stagger: .08 }, .55 * d)
    .add(play3d, .1 * d)
    .from('.hero-photo picture', { clipPath: 'inset(0 0 100% 0)', duration: 1.4 * d, ease: 'expo.inOut' }, .2 * d)
    .from('.hero-photo .h', { scale: 0, duration: .5 * d, stagger: .04, ease: 'back.out(3)' }, 1.0 * d)
    .from('.sel-tag', { opacity: 0, x: -10, duration: .6 * d }, 1.2 * d)
    .from('.hero-pol', { y: 90, rotate: 8, opacity: 0, duration: 1.3 * d, ease: 'elastic.out(1,.7)' }, 1.0 * d)
    .from('.hero-star', { scale: 0, rotate: -200, duration: 1.4 * d, ease: 'back.out(2)' }, 1.2 * d)
    .from('.hero-note', { opacity: 0, x: 20, duration: .8 * d }, 1.5 * d)
    .from('.hero-cue', { opacity: 0, duration: .6 }, 1.6 * d);
  return tl;
}
// a slow drift on the hero photo and the star as the page scrolls
function heroScroll() {
  if (REDUCE) return;
  gsap.to('.hero-word', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-star', { rotate: 120, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-pol', { y: -60, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
}

/* ═════════ the opening ═════════ */
function opening() {
  const pre = $('#pre');
  const run = root.classList.contains('opening') && pre;
  if (!run) { heroIn(true); return; }
  lenis && lenis.stop();
  const num = $('#pre-num'), bar = $('#pre-bar');
  const pages = $$('.pre-pages use'), star = $('.pre-star'), letters = $$('.pre-word span');

  // real loading: fonts + the hero photo; never shorter than the animation, never longer than ~6s
  const heroImg = $('.hero-photo img');
  const ready = Promise.race([
    Promise.all([document.fonts ? document.fonts.ready : 0, heroImg.complete ? 0 : new Promise(r => { heroImg.addEventListener('load', r, { once: true }); heroImg.addEventListener('error', r, { once: true }); })]),
    new Promise(r => setTimeout(r, 6000)),
  ]);
  const count = { v: 0 };
  const show = () => { const v = Math.round(count.v); num.textContent = String(v).padStart(3, '0'); bar.style.transform = `scaleX(${v / 100})`; };

  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.pre-k', { opacity: 0, y: -8, duration: .6, stagger: .1 }, 0)
    .from('.pre-foot', { opacity: 0, duration: .6 }, .1)
    .to(pages, { strokeDashoffset: 0, duration: 1.15, ease: 'power2.inOut', stagger: { each: .06, from: 'edges' } }, .15)
    .to(pages, { fillOpacity: 1, strokeWidth: 0, duration: .55, ease: 'power2.out' }, 1.0)
    .fromTo(star, { opacity: 0, scale: .2, rotate: -140, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, rotate: 0, duration: 1.1, ease: 'back.out(2.4)' }, 1.1)
    .to(letters, { y: 0, duration: 1, ease: 'expo.out', stagger: .05 }, 1.25)
    .to('.pre-tag', { opacity: 1, duration: .7 }, 1.75)
    .to(count, { v: 86, duration: 2.2, ease: 'power1.inOut', onUpdate: show }, .1);

  Promise.all([ready, new Promise(r => intro.eventCallback('onComplete', r))]).then(() => {
    const out = gsap.timeline({
      onComplete: () => {
        pre.remove(); root.classList.remove('opening');
        try { sessionStorage.setItem('clarus-opened', '1'); } catch (e) {}
        lenis && lenis.start(); ScrollTrigger.refresh();
      }
    });
    out.to(count, { v: 100, duration: .45, ease: 'power2.out', onUpdate: show })
      .to(star, { scale: 1.3, rotate: 90, transformOrigin: '50% 50%', duration: .5, ease: 'power2.in' }, .3)
      .to('.pre-stage', { opacity: 0, y: -24, duration: .5, ease: 'power2.in' }, .55)
      .set(pre, { backgroundColor: 'transparent' }, .8)
      .to('.pre-top', { yPercent: -102, duration: 1.15, ease: 'expo.inOut' }, .8)
      .to('.pre-bot', { yPercent: 102, duration: 1.15, ease: 'expo.inOut' }, .8)
      .add(() => heroIn(false), 1.05);
  });
}

/* ═════════ enquiry form ═════════ */
const form = $('#enq'), note = $('#enq-note');
form.addEventListener('submit', e => {
  e.preventDefault();
  let ok = true;
  $$('[required]', form).forEach(f => { const bad = !f.value.trim(); f.closest('.field').classList.toggle('bad', bad); if (bad && ok) { f.focus(); ok = false; } });
  if (!ok) { note.textContent = 'Please fill in the highlighted fields.'; return; }
  const d = Object.fromEntries(new FormData(form));
  if (WHATSAPP) {
    const msg = `Assalam o Alaikum, I would like to book a visit to Clarus School.\nParent: ${d.parent}\nPhone: ${d.phone}\nClass: ${d.class}\nCampus: ${d.campus}`;
    open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    note.textContent = 'Opening WhatsApp with your details…';
  } else {
    note.textContent = 'Thank you. Online booking opens soon; the school will share its contact number here.';
  }
});
$$('input, select', form).forEach(f => f.addEventListener('input', () => f.closest('.field').classList.remove('bad')));

/* ═════════ go ═════════ */
const start = () => {
  fitAll();
  load3D();
  reveals(); classes(); events(); heroScroll();
  opening();
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { fitAll(); ScrollTrigger.refresh(); }, 150); });
};
if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(start); else start();
})();
