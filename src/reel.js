import { REDUCED, createSeg, createFade, swapText } from './motion.js';

/*
  ВИТРИНА В ПЕРВОМ ЭКРАНЕ
  Окно браузера с настоящими работами: OneDay, Hour, Orrin, Noctiv.
  Кадры сменяются сами раз в 4,5 с — кроссфейд из дымки, как экраны
  в OneDay; тонкая линия под кадром показывает, сколько до следующего.
  Вкладки переключают, под курсором отсчёт стоит. Окно чуть наклоняется
  за курсором (до 3–4°). При reduced motion — без автосмены и наклона.
*/
const STEP = 4500;

export function initReel() {
  const reel = document.querySelector('[data-reel]');
  if (!reel) return;
  const fade = createFade(reel.querySelector('.reel__screen'));
  const bar = reel.querySelector('[data-reel-bar]');
  const url = reel.querySelector('[data-reel-url]');
  const kind = reel.querySelector('[data-reel-kind]');
  const name = reel.querySelector('[data-reel-name]');
  const link = reel.querySelector('[data-reel-link]');
  url.classList.add('xtext'); kind.classList.add('xtext');

  let elapsed = 0;
  const show = i => {
    fade.show(i);
    seg.set(i);
    const im = fade.img(i);
    link.href = im.dataset.href;
    link.setAttribute('aria-label', `Open ${im.alt.split(',')[0]}`);
    swapText(url, im.dataset.url);
    swapText(kind, im.dataset.kind);
    swapText(name, im.dataset.name);
    elapsed = 0;
    bar.parentElement.style.setProperty('--p', 0);
  };
  const seg = createSeg(reel.querySelector('[data-seg]'), show);

  // наклон за курсором — по всему первому экрану, сглаживает CSS-переход
  const hero = reel.closest('.hero'), tilt = reel.querySelector('[data-tilt]');
  if (!REDUCED && matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('pointermove', e => {
      const r = tilt.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2 + 200)));
      const y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2 + 200)));
      tilt.style.setProperty('--ry', (x * 4).toFixed(2) + 'deg');
      tilt.style.setProperty('--rx', (-y * 3).toFixed(2) + 'deg');
    });
    hero.addEventListener('pointerleave', () => { tilt.style.removeProperty('--rx'); tilt.style.removeProperty('--ry'); });
  }

  if (REDUCED) return;
  // автосмена: отсчёт идёт, только пока витрину видно и курсор не на ней
  let raf = 0, last = 0, visible = false, paused = false;
  const frame = t => {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(t - last, 100) : 0; last = t;
    if (paused) return;
    elapsed += dt;
    bar.parentElement.style.setProperty('--p', Math.min(1, elapsed / STEP).toFixed(4));
    if (elapsed >= STEP) show((fade.index + 1) % fade.length);
  };
  const run = () => { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  reel.addEventListener('pointerenter', () => { paused = true; });
  reel.addEventListener('pointerleave', () => { paused = false; });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? run() : stop(); }).observe(reel);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : run()));
}
