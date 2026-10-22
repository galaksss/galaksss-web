/*
  ПЛЕЙХЕД И ТАЙМКОД
  Левая рейка — не декор, а подпись страницы (см. CLAUDE.md): вертикальная
  линия с плейхедом и живым таймкодом, который бежит по мере скролла.
  Маркеры кликабельны и ведут к секциям, их позиция считается из
  реального положения секций на странице — добавишь секцию, маркер
  встанет сам.
*/
export function initPlayhead({ reduced } = {}) {
  const head  = document.querySelector('.rail__head');
  const tcEl  = document.querySelector('.rail__tc');
  const label = document.getElementById('tc');
  const marks = document.querySelectorAll('.rail__mark');
  const track = document.querySelector('.rail__track');

  const FPS = 24, DUR = 90;
  const pad = n => String(n).padStart(2, '0');

  function toTimecode(p) {
    const f = Math.floor(p * DUR * FPS);
    return pad(Math.floor(f / (3600 * FPS))) + ':' +
           pad(Math.floor(f / (60 * FPS)) % 60) + ':' +
           pad(Math.floor(f / FPS) % 60) + ':' +
           pad(f % FPS);
  }

  function markProgress(m) {
    const sec = document.querySelector(m.dataset.target);
    if (!sec) return 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    return max > 0 ? Math.min(Math.max(sec.offsetTop / max, 0), 1) : 0;
  }

  function placeMarks() {
    if (!track) return;
    const h = track.offsetHeight;
    marks.forEach(m => {
      const p = markProgress(m);
      m.dataset.p = p;
      m.style.top = (96 + p * h) + 'px';
    });
  }

  /* Клик по маркеру — переход к секции */
  marks.forEach(m => {
    m.setAttribute('aria-label', 'Go to ' + m.dataset.label);
    m.addEventListener('click', () => {
      const sec = document.querySelector(m.dataset.target);
      if (sec) sec.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    });
  });

  let ticking = false;

  function update() {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(scrollY / max, 1) : 0;

    if (track) {
      const y = p * track.offsetHeight;
      head.style.transform = 'translateY(' + y + 'px)';
      tcEl.style.transform = 'translateY(' + (y - 6) + 'px)';
      label.textContent = toTimecode(p);
      marks.forEach(m => m.classList.toggle('is-past', p >= parseFloat(m.dataset.p || 0)));
    }
  }

  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  addEventListener('resize', () => { placeMarks(); update(); });

  placeMarks();
  update();
}
