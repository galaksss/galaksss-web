/*
  ДВИЖЕНИЕ — на языке OneDay (docs/DESIGN.md OneDay, раздел 2):
  одна кривая cubic-bezier(.16, 1, .3, 1); двигается блок, а не каждая
  строчка; появление — затухание со сдвигом, заголовки выходят из лёгкой
  дымки по словам; экраны сменяются кроссфейдом с размытием; выбор
  переезжает плашкой. При reduced motion остаётся только затухание.
  Здесь общие кирпичи: слова, появление, шапка, свет под курсором,
  переключатель с плашкой, кроссфейд кадров, свечение контакта.
*/
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const REDUCED = reduced;

/* ---------- заголовки по словам ---------- */
function splitWords(root) {
  let i = 0;
  const walk = node => {
    [...node.childNodes].forEach(ch => {
      if (ch.nodeType === 3) {
        const parts = ch.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.append(p); return; }
          const w = document.createElement('span');
          w.className = 'w';
          w.style.setProperty('--i', i++);
          w.textContent = p;
          frag.append(w);
        });
        ch.replaceWith(frag);
      } else if (ch.nodeType === 1 && ch.tagName !== 'BR') walk(ch);
    });
  };
  walk(root);
}

/* ---------- появление по скроллу ---------- */
function initReveal() {
  document.querySelectorAll('[data-words]').forEach(splitWords);
  // соседи в одном ряду выходят по очереди, шаг 90 мс
  const groups = new Map();
  document.querySelectorAll('[data-up]').forEach(el => {
    const list = groups.get(el.parentElement) || [];
    list.push(el); groups.set(el.parentElement, list);
  });
  groups.forEach(list => list.forEach((el, k) => { if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', `${k * 90}ms`); }));

  const scrolled = [...document.querySelectorAll('[data-up], [data-words]')].filter(el => !el.closest('.hero'));
  if (reduced) { scrolled.forEach(el => el.classList.add('is-in')); }
  else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
    scrolled.forEach(el => io.observe(el));
  }
  // первый экран — при загрузке, по своим задержкам
  const intro = document.querySelectorAll('.hero [data-in], .hero [data-words]');
  requestAnimationFrame(() => requestAnimationFrame(() => intro.forEach(el => el.classList.add('is-in'))));
}

/* ---------- переключатель с переезжающей плашкой ---------- */
export function createSeg(el, onPick) {
  const pill = el.querySelector('.seg__pill, .menu__pill');
  const items = [...el.querySelectorAll('button, a[data-sec]')];
  let cur = items.findIndex(b => b.classList.contains('is-on'));
  const place = () => {
    const b = items[cur];
    if (!b || !pill) return;
    pill.style.setProperty('--x', b.offsetLeft + 'px');
    pill.style.setProperty('--w', b.offsetWidth + 'px');
  };
  // встать на место без переезда: при первом показе и когда плашки не было
  const jump = () => { if (!pill) return; pill.style.transition = 'none'; place(); pill.getBoundingClientRect(); pill.style.transition = ''; };
  const set = i => {
    const was = cur;
    cur = i;
    items.forEach((b, k) => {
      b.classList.toggle('is-on', k === i);
      if (b.getAttribute('role') === 'tab') b.setAttribute('aria-selected', k === i);
    });
    el.classList.toggle('has-on', i >= 0);
    if (was < 0) jump(); else place();
  };
  jump();
  el.classList.add('is-live');
  if (onPick) items.forEach((b, k) => b.addEventListener('click', () => onPick(k)));
  addEventListener('resize', place);
  document.fonts?.ready.then(place);
  return { set, get index() { return cur; } };
}

/* ---------- кроссфейд кадров ---------- */
export function createFade(box) {
  const imgs = [...box.querySelectorAll(':scope > img')];
  let cur = Math.max(0, imgs.findIndex(im => im.classList.contains('is-on')));
  return {
    show(i) {
      if (i === cur) return;
      const prev = imgs[cur], next = imgs[i];
      cur = i;
      next.classList.remove('is-out');
      next.classList.add('is-on');
      prev.classList.remove('is-on');
      prev.classList.add('is-out');
      clearTimeout(prev._t);
      prev._t = setTimeout(() => prev.classList.remove('is-out'), 650);
    },
    get index() { return cur; },
    get length() { return imgs.length; },
    img: i => imgs[i],
  };
}

/* ---------- смена текста подписи: тает, меняется, проявляется ---------- */
export function swapText(el, text) {
  if (el.textContent === text) return;
  if (reduced) { el.textContent = text; return; }
  el.classList.add('is-swap');
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.textContent = text; el.classList.remove('is-swap'); }, 200);
}

/* ---------- шапка: темнеет после прокрутки, плашка раздела, линия прочитанного ---------- */
function initHeader() {
  const top = document.querySelector('[data-top]');
  const read = document.querySelector('[data-read]');
  const menuEl = document.querySelector('[data-menu]');
  const menu = createSeg(menuEl);
  const links = [...menuEl.querySelectorAll('a[data-sec]')];
  let ticking = false;
  const update = () => {
    ticking = false;
    top.classList.toggle('is-scrolled', scrollY > 8);
    const max = document.documentElement.scrollHeight - innerHeight;
    read.style.setProperty('--read', max > 0 ? (scrollY / max).toFixed(4) : 0);
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();

  // какой раздел пересекает середину экрана, тот и горит; между разделами — ничего
  const centered = new Set();
  const io = new IntersectionObserver(es => {
    es.forEach(e => (e.isIntersecting ? centered.add(e.target.id) : centered.delete(e.target.id)));
    menu.set(links.findIndex(a => centered.has(a.dataset.sec)));
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const s = document.getElementById(a.dataset.sec); if (s) io.observe(s); });
}

/* ---------- свет под курсором: координаты получают все карточки рядом ---------- */
function initSpot() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let x = 0, y = 0, raf = 0;
  const near = new Set();
  const io = new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? near.add(e.target) : near.delete(e.target))));
  document.querySelectorAll('.spot').forEach(el => io.observe(el));
  const paint = () => {
    raf = 0;
    near.forEach(el => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--x', `${x - r.left}px`);
      el.style.setProperty('--y', `${y - r.top}px`);
    });
  };
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (!raf) raf = requestAnimationFrame(paint);
  }, { passive: true });
  document.addEventListener('pointerleave', () => { x = y = -9999; paint(); });
}

/* ---------- свечение контакта разгорается, пока секция въезжает ---------- */
function initContactGlow() {
  const sec = document.querySelector('[data-contact]');
  if (!sec) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = sec.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * 0.8)));
    sec.style.setProperty('--glow', (reduced ? 1 : p).toFixed(3));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

export function initMotion() {
  initReveal();
  initHeader();
  initSpot();
  initContactGlow();
}
