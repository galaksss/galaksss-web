import { REDUCED, createSeg, createFade, swapText } from './motion.js';

/*
  ВИТРИНА В ПЕРВОМ ЭКРАНЕ
  Окно браузера с настоящими работами: OneDay, Hour, Orrin, Noctiv.
  Кадры сменяются сами раз в 4,5 с — кроссфейд из дымки, как экраны
  в OneDay; тонкая линия под кадром показывает, сколько до следующего.
  Вкладки переключают. Под курсором смена не встаёт, а идёт медленнее
  (раз в 10 с): успеть прочитать и открыть сайт можно, а курсор,
  который просто лежит на витрине с загрузки, её не останавливает. Окно
  чуть наклоняется за курсором (до 3–4°). При reduced motion — без
  автосмены и наклона.
*/
const STEP = 4500;
const SLOW = STEP / 10000;   // под курсором — раз в 10 с, чтобы витрина не казалась мёртвой

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
  // автосмена: отсчёт идёт, пока витрину видно; под курсором — медленнее, но не стоит
  let raf = 0, last = 0, visible = false, rate = 1;
  const frame = t => {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(t - last, 100) : 0; last = t;
    elapsed += dt * rate;
    bar.parentElement.style.setProperty('--p', Math.min(1, elapsed / STEP).toFixed(4));
    if (elapsed >= STEP) show((fade.index + 1) % fade.length);
  };
  const run = () => { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  reel.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') rate = SLOW; });
  reel.addEventListener('pointerleave', () => { rate = 1; });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? run() : stop(); }).observe(reel);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : run()));
}
