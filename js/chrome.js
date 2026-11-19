// chrome.js: the shared pieces for pages other than the home page (Clarus Junior):
// motion buttons, the ink-glass nav (scrolled / hide on scroll down), the phone menu, and the footer photo drift.
(function () {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // buttons: rolling label, arrow through a lit orb, colour flood (same markup as the home page)
  const ARROW = '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  $$('.btn').forEach(b => {
    const label = b.textContent.trim().replace(/\s+/g, ' '); if (!label) return;
    const esc = label.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    b.innerHTML = `<span class="btn-l"><span>${esc}</span><span aria-hidden="true">${esc}</span></span><span class="btn-fill" aria-hidden="true"></span><span class="btn-i" aria-hidden="true">${ARROW}${ARROW}</span>`;
  });
  window.setBtnLabel = (b, text) => { const l = b.querySelectorAll('.btn-l > span'); if (l.length) l.forEach(s => s.textContent = text); else b.textContent = text; };

  // nav + phone menu
  const nav = $('#nav'), sheet = $('#sheet'), menuBtn = $('#menu-btn');
  if (!nav) return;
  const open = () => sheet.classList.contains('open');
  const close = () => { if (!open()) return; sheet.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Open menu'); };
  menuBtn.addEventListener('click', () => {
    if (open()) close();
    else { sheet.classList.add('open'); menuBtn.setAttribute('aria-expanded', 'true'); menuBtn.setAttribute('aria-label', 'Close menu'); }
  });
  addEventListener('pointerdown', e => { if (open() && !e.target.closest('.nav, .sheet')) close(); });
  sheet.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY, down = y > lastY + 2, up = y < lastY - 2;
    nav.classList.toggle('scrolled', y > 40);
    if (y < 80 || up) nav.classList.remove('hide'); else if (down && !open()) nav.classList.add('hide');
    lastY = y;
  }, { passive: true });

  if (REDUCE) $$('.strip-track').forEach(t => t.style.animation = 'none');
})();
