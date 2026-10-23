import { createBuckets } from './buckets.js';

/*
  КЕЙС ONEDAY: история со скроллом
  Слева шаги, справа липкое окно. Шаг, дошедший до середины экрана,
  становится активным, и его экран в окне «дорендеривается» бакетами —
  как смена прохода в герое. Вкладки над окном прокручивают к шагу.
  Первый рендер — когда окно впервые показалось.
*/
const pad = n => String(n).padStart(2, '0');

export function initCase(reduced) {
  const box = document.querySelector('[data-case]');
  if (!box) return;
  const view = box.querySelector('[data-case-view]');
  const imgs = [...view.querySelectorAll('[data-frame] > img')];
  const tabs = [...view.querySelectorAll('[data-go]')];
  const steps = [...box.querySelectorAll('[data-step]')];
  const label = view.querySelector('[data-case-pass]');
  const tiles = createBuckets(view.querySelector('[data-tiles]'), { size: 40 });
  let cur = -1, seen = reduced;

  function show(i) {
    if (i === cur) return;
    cur = i;
    imgs.forEach((im, k) => im.classList.toggle('is-on', k === i));
    tabs.forEach((t, k) => t.classList.toggle('is-on', k === i));
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    label.textContent = `${pad(i + 1)} / ${pad(imgs.length)}`;
    if (seen && !reduced) tiles.run(620);
  }
  show(0);
  if (!reduced) tiles.cover();

  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return;
    seen = true; io.disconnect();
    if (!reduced) tiles.run(1000);
  }, { threshold: 0.35 }).observe(view);

  const stepIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) show(steps.indexOf(e.target));
  }), { rootMargin: '-50% 0px -50% 0px' });
  steps.forEach(s => stepIO.observe(s));

  tabs.forEach((t, k) => t.addEventListener('click', () => {
    steps[k].scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
  }));
  addEventListener('resize', () => { if (seen) tiles.finish(); });
}
