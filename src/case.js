import { REDUCED } from './motion.js';
import { createDemo } from './oneday-demo.js';

/*
  КЕЙС ONEDAY: один день с приложением (как How it works на лендинге OneDay)
  Слева шаги дня, справа липкое окно с живой копией приложения. Шаг,
  который пересекает середину экрана, — текущий: он ярче остальных, окно
  показывает его сцену, а черты под окном — сколько дня уже прошло.
  Сцена играет, только пока окно видно.
  На телефоне, как в OneDay, у каждого шага своё окно со своей сценой:
  оно играет, когда доехало до экрана.
*/
const WIN = `<div class="appwin" role="img" aria-label="The OneDay app">
  <div class="appwin__bar" aria-hidden="true"><span class="appwin__dots"><i></i><i></i><i></i></span><span class="appwin__url">myoneday.vercel.app</span><span></span></div>
  <div class="appwin__frame" data-od-frame><div class="od" data-od aria-hidden="true"></div></div>
</div>`;

export function initCase() {
  const box = document.querySelector('[data-case]');
  if (!box) return;
  const steps = [...box.querySelectorAll('[data-step]')];

  if (matchMedia('(max-width: 900px)').matches) {
    steps.forEach((step, i) => {
      const slot = document.createElement('div');
      slot.className = 'step__win';
      slot.innerHTML = WIN;
      step.append(slot);
      const frame = slot.querySelector('[data-od-frame]');
      const demo = createDemo(slot.querySelector('[data-od]'), frame, REDUCED);
      demo.jump(i);
      new IntersectionObserver(([e]) => demo.setLive(e.isIntersecting), { threshold: 0.6 }).observe(frame);
    });
    return;
  }

  const dashes = [...box.querySelectorAll('.case__dashes i')];
  const frame = box.querySelector('.case__stage [data-od-frame]');
  const demo = createDemo(box.querySelector('.case__stage [data-od]'), frame, REDUCED);

  const show = i => {
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    dashes.forEach((d, k) => d.classList.toggle('is-on', k <= i));
    demo.show(i);
  };
  show(0);

  const stepIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) show(steps.indexOf(e.target));
  }), { rootMargin: '-50% 0px -50% 0px' });
  steps.forEach(s => stepIO.observe(s));

  new IntersectionObserver(([e]) => demo.setLive(e.isIntersecting), { threshold: 0.4 }).observe(frame);
}
