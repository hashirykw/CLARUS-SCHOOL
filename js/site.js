/* site.js — shared by every Clarus page: navbar, dropdown menu, smooth anchor links and the chat assistant.
 * The chat answers only from what the school has confirmed; edit the answers in KB below. */
(function () {
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement, body = document.body;
const PAGE = body.dataset.page || 'home';
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const lenis = () => window.__lenis || null;

/* ═════════ smooth links: /#section on the home page, #section anywhere ═════════ */
function scrollToEl(el) {
  const y = el === body ? 0 : el.getBoundingClientRect().top + scrollY;
  const l = lenis();
  if (l) l.scrollTo(y, { duration: 1.4, easing: t => 1 - Math.pow(1 - t, 4) });
  else scrollTo({ top: y, behavior: REDUCE ? 'auto' : 'smooth' });
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]'); if (!a) return;
  let h = a.getAttribute('href');
  if (h === '/' && PAGE === 'home') { e.preventDefault(); closeMenu(); scrollToEl(body); return; }
  if (h.startsWith('/#') && PAGE === 'home') h = h.slice(1);
  if (!h.startsWith('#') || h.length < 2) { closeMenu(); return; }
  const el = $(h); if (!el) return;
  e.preventDefault(); closeMenu();
  if (a.dataset.campus) { const sel = $('#enq-campus'); if (sel) sel.value = a.dataset.campus; }
  scrollToEl(el);
});

/* ═════════ navbar ═════════ */
const nav = $('#nav');
let lastY = scrollY;
function onScroll() {
  const y = scrollY;
  nav.classList.toggle('is-solid', y > 24 || PAGE !== 'home');
  if (!root.classList.contains('menu-open')) {
    if (y > 640 && y > lastY + 4) nav.classList.add('is-hidden');
    else if (y < lastY - 4 || y < 640) nav.classList.remove('is-hidden');
  }
  lastY = y;
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();
$$('[data-page]', nav).forEach(a => { if (a.dataset.page === PAGE) { a.classList.add('on'); a.setAttribute('aria-current', 'page'); } });
if (PAGE === 'home' && 'IntersectionObserver' in window) {
  const links = $$('.links a[data-sec]');
  const io = new IntersectionObserver(es => es.forEach(en => {
    const l = links.find(x => x.dataset.sec === en.target.id); if (l) l.classList.toggle('on', en.isIntersecting);
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(l => { const s = document.getElementById(l.dataset.sec); if (s) io.observe(s); });
}

/* ═════════ dropdown menu (a small panel, never full screen) ═════════ */
const menuBtn = $('#menu-btn'), pop = $('#menu-pop');
function openMenu() {
  pop.hidden = false; requestAnimationFrame(() => pop.classList.add('open'));
  menuBtn.setAttribute('aria-expanded', 'true'); menuBtn.setAttribute('aria-label', 'Close menu');
  root.classList.add('menu-open'); nav.classList.remove('is-hidden');
}
function closeMenu() {
  if (!pop || pop.hidden) return;
  pop.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Open menu');
  root.classList.remove('menu-open');
  setTimeout(() => { if (!pop.classList.contains('open')) pop.hidden = true; }, 320);
}
window.closeMenu = closeMenu;
menuBtn && menuBtn.addEventListener('click', e => { e.stopPropagation(); pop.hidden ? openMenu() : closeMenu(); });
document.addEventListener('click', e => { if (pop && !pop.hidden && !pop.contains(e.target) && e.target !== menuBtn) closeMenu(); });
addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); closeChat(); } });
addEventListener('resize', () => { if (innerWidth > 1080) closeMenu(); });

/* ═════════ chat assistant ═════════ */
const BOOK = { label: 'Book a visit', href: '/#admissions' };
const KB = [
  { k: ['salam', 'assalam', 'aoa', 'hello', 'hi', 'hey', 'salaam', 'good morning', 'good evening'],
    a: 'Wa Alaikum Assalam! I can help with admissions, classes, fees, campuses, the uniform and school life. What would you like to know?' },
  { k: ['admission', 'admissions', 'enrol', 'enroll', 'register', 'registration', 'apply', 'seat', 'join'],
    a: 'Admissions for 2026 are open for Nursery, KG, Class 1 and Class 2. Book a visit with the short form and the school will call you back to arrange it.', l: BOOK },
  { k: ['fee', 'fees', 'cost', 'charges', 'price', 'monthly', 'tuition', 'kitni', 'paisay'],
    a: 'The fee schedule has not been announced yet. The school will share it with families before admissions close, and can go through it with you on your visit.', l: BOOK },
  { k: ['class', 'classes', 'grade', 'nursery', 'kg', 'matric', 'prep', 'level'],
    a: 'This year Clarus opens Nursery, KG, Class 1 and Class 2. After that a new class opens every year, all the way to Matric.', l: { label: 'See the classes', href: '/#classes' } },
  { k: ['age', 'old', 'years old', 'eligib'],
    a: 'The school will confirm the age for each class when you visit. Leave your details and they will call you back.', l: BOOK },
  { k: ['campus', 'campuses', 'location', 'address', 'where', 'branch', 'located'],
    a: 'Clarus has a Junior Campus (Nursery and KG) and a Senior Campus (Class 1 onwards). The addresses will be announced soon.', l: { label: 'See the campuses', href: '/#campuses' } },
  { k: ['time', 'timing', 'timings', 'hours', 'schedule', 'start', 'off', 'chutti'],
    a: 'School hours will be announced soon. You can ask the school directly when they call you back about your visit.' },
  { k: ['uniform', 'dress', 'shirt', 'tie', 'blazer'],
    a: 'Crisp white with Clarus crimson: a crimson pinafore for juniors, and a navy blazer with a crimson tie for seniors. The final design is still being confirmed.', l: { label: 'See the uniform', href: '/#uniform' } },
  { k: ['event', 'events', 'sports', 'science', 'show', 'colour', 'color', 'function', 'activities'],
    a: 'Events planned for the first year: Science Week, Sports Day, the Annual Show and Colour Day. Dates will be shared with families.', l: { label: 'See school life', href: '/#life' } },
  { k: ['contact', 'phone', 'number', 'whatsapp', 'call', 'email', 'reach'],
    a: 'The school\'s contact number will be added here soon. Until then, leave your number in the visit form and the school will call you.', l: BOOK },
  { k: ['teacher', 'teachers', 'staff', 'principal', 'faculty'],
    a: 'The principal and class teachers will be introduced on the website soon.' },
  { k: ['junior', '3d', 'walk', 'tour', 'virtual'],
    a: 'You can walk through the early-years classrooms in 3D on the Clarus Junior page.', l: { label: 'Open the walk', href: '/junior' } },
  { k: ['transport', 'van', 'bus', 'pick', 'drop'],
    a: 'Transport has not been announced yet. Ask the school about it when they call you back.' },
  { k: ['thank', 'thanks', 'shukriya', 'jazak'],
    a: 'You\'re welcome! Anything else about Clarus?' },
];
const QUICK = ['Admissions', 'Fees', 'Classes', 'Campuses', 'Uniform', 'Timings'];
const chatBtn = $('#chat-btn'), chatPop = $('#chat-pop'), log = $('#chat-log'), form = $('#chat-form'), input = $('#chat-in'), quick = $('#chat-quick');

function answer(q) {
  const t = ' ' + q.toLowerCase().replace(/[^a-z0-9\s]/g, ' ') + ' ';
  let best = null, score = 0;
  KB.forEach(item => {
    const s = item.k.reduce((n, k) => n + (t.includes(' ' + k) ? (k.length > 3 ? 2 : 1) : 0), 0);
    if (s > score) { score = s; best = item; }
  });
  return best || { a: 'I don\'t have that answer yet. The quickest way is to book a visit, and the school will answer it directly.', l: BOOK };
}
function bubble(text, who, link) {
  const d = document.createElement('div');
  d.className = 'msg-b ' + who;
  d.innerHTML = `<p>${esc(text)}</p>${link ? `<a class="msg-l" href="${esc(link.href)}">${esc(link.label)} <span aria-hidden="true">→</span></a>` : ''}`;
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
  return d;
}
function reply(q) {
  bubble(q, 'me');
  const typing = document.createElement('div'); typing.className = 'msg-b bot typing'; typing.innerHTML = '<i></i><i></i><i></i>';
  log.appendChild(typing); log.scrollTop = log.scrollHeight;
  const r = answer(q);
  setTimeout(() => { typing.remove(); bubble(r.a, 'bot', r.l); }, REDUCE ? 50 : 520 + Math.min(r.a.length * 6, 700));
}
let greeted = false;
function openChat() {
  chatPop.hidden = false; requestAnimationFrame(() => chatPop.classList.add('open'));
  chatBtn.setAttribute('aria-expanded', 'true'); root.classList.add('chat-open');
  if (!greeted) {
    greeted = true;
    bubble('Assalam o Alaikum! I\'m the Clarus help desk. Ask me anything about admissions, classes, fees, campuses or the uniform.', 'bot');
    quick.innerHTML = QUICK.map(x => `<button type="button">${x}</button>`).join('');
  }
  setTimeout(() => input.focus({ preventScroll: true }), 250);
}
function closeChat() {
  if (!chatPop || chatPop.hidden) return;
  chatPop.classList.remove('open'); chatBtn.setAttribute('aria-expanded', 'false'); root.classList.remove('chat-open');
  setTimeout(() => { if (!chatPop.classList.contains('open')) chatPop.hidden = true; }, 320);
}
if (chatBtn) {
  chatBtn.addEventListener('click', () => chatPop.hidden ? openChat() : closeChat());
  $('#chat-x').addEventListener('click', closeChat);
  quick.addEventListener('click', e => { const b = e.target.closest('button'); if (b) reply(b.textContent); });
  form.addEventListener('submit', e => { e.preventDefault(); const q = input.value.trim(); if (!q) return; input.value = ''; reply(q); });
  log.addEventListener('click', e => { if (e.target.closest('.msg-l')) closeChat(); });
}
})();
