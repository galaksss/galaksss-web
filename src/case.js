import { REDUCED, createSeg, createFade } from './motion.js';

/*
  КЕЙС ONEDAY: история со скроллом
  Слева шаги, справа липкое окно. Шаг, дошедший до середины экрана,
  становится активным; экран в окне сменяется кроссфейдом из дымки,
  плашка вкладки переезжает к нему. Вкладки прокручивают к своему шагу.
*/
const pad = n => String(n).padStart(2, '0');

export function initCase() {
  const box = document.querySelector('[data-case]');
  if (!box) return;
  const view = box.querySelector('[data-case-view]');
  const fade = createFade(view.querySelector('[data-frame]'));
  const steps = [...box.querySelectorAll('[data-step]')];
  const label = view.querySelector('[data-case-pass]');
  const seg = createSeg(view.querySelector('[data-seg]'), k => {
    steps[k].scrollIntoView({ block: 'center', behavior: REDUCED ? 'auto' : 'smooth' });
  });

  const show = i => {
    fade.show(i);
    seg.set(i);
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    label.textContent = `${pad(i + 1)} / ${pad(steps.length)}`;
  };
  show(0);

  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) show(steps.indexOf(e.target));
  }), { rootMargin: '-50% 0px -50% 0px' });
  steps.forEach(s => io.observe(s));
}
