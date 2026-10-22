/*
  КРИВАЯ СКОРОСТИ В КАРТОЧКЕ «MOTION FOR THE WEB»
  Кивок тем, кто открывал график скорости в After Effects: вертикальная
  линия-время идёт по кривой равномерно, точка на кривой показывает,
  какая доля пути пройдена, а квадрат под графиком едет с этим же easing.
  Кривая та же, что у всего сайта: cubic-bezier(.16, 1, .3, 1).
*/
const P1 = [0.16, 1], P2 = [0.3, 1];
const RUN = 1800, PAUSE = 900;

// Точка кубической кривой Безье по параметру u (P0 = 0,0; P3 = 1,1)
const bez = (u, a, b) => 3 * (1 - u) ** 2 * u * a + 3 * (1 - u) * u ** 2 * b + u ** 3;

// По времени x находим u бинарным поиском, по u — прогресс y
function ease(x) {
  let lo = 0, hi = 1;
  for (let k = 0; k < 24; k++) {
    const mid = (lo + hi) / 2;
    if (bez(mid, P1[0], P2[0]) < x) lo = mid; else hi = mid;
  }
  return bez((lo + hi) / 2, P1[1], P2[1]);
}

export function initCurve(reduced) {
  const box = document.querySelector('[data-curve]');
  if (!box) return;
  const head = box.querySelector('.viz-curve__head');
  const dot = box.querySelector('.viz-curve__dot');
  const track = box.querySelector('.viz-curve__track');
  const W = 220, H = 120;

  const draw = x => {
    const y = ease(x);
    head.setAttribute('x1', x * W); head.setAttribute('x2', x * W);
    dot.setAttribute('cx', x * W); dot.setAttribute('cy', H - y * H);
    track.style.setProperty('--p', (y * (track.clientWidth - 12)).toFixed(1) + 'px');
  };

  if (reduced) { draw(1); return; }

  let visible = false, raf = 0, t0 = 0;
  const frame = t => {
    if (!t0) t0 = t;
    const cycle = (t - t0) % (RUN + PAUSE);
    draw(Math.min(cycle / RUN, 1));
    if (visible) raf = requestAnimationFrame(frame);
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) { t0 = 0; raf = requestAnimationFrame(frame); }
  }).observe(box);
}
