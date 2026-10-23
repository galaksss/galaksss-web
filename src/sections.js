import { createBuckets } from './buckets.js';

/*
  ОСТАЛЬНЫЕ СЕКЦИИ
  · [data-up] проявляются по скроллу (один раз);
  · цифры кейса досчитываются;
  · карточки «More renders»: кадр дорендеривается бакетами, когда показался,
    а при наведении (на телефоне — по тапу) рендерится второй кадр проекта;
  · лог процесса: строки считаются по очереди — queued → rendering → done;
  · кривая скорости в услуге «Motion for the web»;
  · почта копируется по клику.
*/
const once = (el, fn, opts = { rootMargin: '0px 0px -12% 0px' }) => {
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); fn(); } }, opts);
  io.observe(el);
};

function initReveal(reduced) {
  const els = document.querySelectorAll('[data-up]');
  if (reduced) { els.forEach(el => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  els.forEach(el => io.observe(el));
}

function initCounts(reduced) {
  document.querySelectorAll('[data-count]').forEach(el => {
    const end = Number(el.dataset.count), dec = Number(el.dataset.dec || 0);
    if (reduced) return;
    el.textContent = (0).toFixed(dec);
    once(el, () => {
      const t0 = performance.now();
      const tick = t => {
        const p = Math.min(1, (t - t0) / 1400);
        el.textContent = (end * (1 - Math.pow(1 - p, 3))).toFixed(dec);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  });
}

function initRenders(reduced) {
  const all = [];
  document.querySelectorAll('[data-alt-frame]').forEach(f => {
    const card = f.closest('.render');
    const a = f.dataset.a || 'Beauty', b = f.dataset.b || 'Pass 2';
    // мини-окно: полоска с именем и двумя проходами над кадром
    const view = document.createElement('div');
    view.className = 'render__view';
    const num = card.querySelector('.render__meta span')?.textContent || '';
    const name = card.querySelector('.render__t')?.textContent || '';
    view.innerHTML = `<div class="render__bar"><span class="render__name">${num} · ${name.toLowerCase()}</span>
      <div class="passes passes--sm" role="tablist" aria-label="${name} frames"><button class="is-on" role="tab" aria-selected="true">${a}</button><button role="tab" aria-selected="false">${b}</button></div></div>`;
    f.before(view);
    view.append(f);
    const btns = [...view.querySelectorAll('button')];

    const tiles = createBuckets(f.querySelector('[data-tiles]'), { size: 36 });
    const item = { tiles, seen: reduced };
    all.push(item);
    if (!reduced) {
      tiles.cover();
      once(f, () => { item.seen = true; tiles.run(1100); });
    }
    const set = alt => {
      if (f.classList.contains('is-alt') === alt) return;
      f.classList.toggle('is-alt', alt);
      btns.forEach((x, k) => { x.classList.toggle('is-on', k === +alt); x.setAttribute('aria-selected', k === +alt); });
      if (!reduced && item.seen) tiles.run(480);
    };
    btns.forEach((x, k) => x.addEventListener('click', () => set(k === 1)));
    card.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') set(true); });
    card.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') set(false); });
    f.addEventListener('click', e => { if (e.pointerType !== 'mouse') set(!f.classList.contains('is-alt')); });
  });
  addEventListener('resize', () => all.forEach(i => (i.seen ? i.tiles.finish() : i.tiles.cover())));
}

function initLog(reduced) {
  const log = document.querySelector('[data-log]');
  if (!log) return;
  const rows = [...log.querySelectorAll('.log__row')];
  const st = r => r.querySelector('.log__st');
  if (reduced) { rows.forEach(r => r.classList.add('is-run', 'is-done')); return; }
  rows.forEach(r => { st(r).textContent = 'queued'; });
  once(log, () => rows.forEach((r, i) => {
    setTimeout(() => { r.classList.add('is-run'); st(r).textContent = 'rendering'; }, i * 650);
    setTimeout(() => { r.classList.add('is-done'); st(r).textContent = 'done'; }, i * 650 + 900);
  }), { rootMargin: '0px 0px -25% 0px' });
}

/* Кривая скорости: вертикальная линия-время идёт равномерно, точка на кривой
   показывает долю пути, квадрат под графиком едет с тем же easing.
   Кривая та же, что у всего сайта: cubic-bezier(.16, 1, .3, 1). */
const P1 = [0.16, 1], P2 = [0.3, 1];
const bez = (u, a, b) => 3 * (1 - u) ** 2 * u * a + 3 * (1 - u) * u ** 2 * b + u ** 3;
function ease(x) {
  let lo = 0, hi = 1;
  for (let k = 0; k < 24; k++) { const mid = (lo + hi) / 2; if (bez(mid, P1[0], P2[0]) < x) lo = mid; else hi = mid; }
  return bez((lo + hi) / 2, P1[1], P2[1]);
}
function initCurve(reduced) {
  const box = document.querySelector('[data-curve]');
  if (!box) return;
  const head = box.querySelector('.viz-curve__head'), dot = box.querySelector('.viz-curve__dot'), track = box.querySelector('.viz-curve__track');
  const W = 220, H = 110, RUN = 1800, PAUSE = 900;
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
    draw(Math.min(((t - t0) % (RUN + PAUSE)) / RUN, 1));
    if (visible) raf = requestAnimationFrame(frame);
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) { t0 = 0; raf = requestAnimationFrame(frame); }
  }).observe(box);
}

function initCopy() {
  document.querySelectorAll('[data-copy]').forEach(btn => {
    const label = btn.querySelector('[data-copy-label]');
    btn.addEventListener('click', () => {
      navigator.clipboard?.writeText(btn.dataset.copy).then(() => {
        if (!label) return;
        const was = label.textContent;
        label.textContent = 'Copied — talk soon';
        setTimeout(() => { label.textContent = was; }, 1600);
      }).catch(() => {});
    });
  });
}

export function initSections(reduced) {
  initReveal(reduced);
  initCounts(reduced);
  initRenders(reduced);
  initLog(reduced);
  initCurve(reduced);
  initCopy();
}
