/*
  КЕЙС: ИСТОРИЯ СО СКРОЛЛОМ
  Шаг становится активным, когда пересекает горизонталь посередине экрана
  (rootMargin −50% сверху и снизу сжимает зону наблюдения в линию).
  Активный шаг — яркий, в липком окне браузера — его экран, в полоске
  прогресса закрашено всё до него включительно.
  Библиотека для этого не нужна: липкость даёт CSS, переключение — один
  IntersectionObserver.
*/
export function initStory() {
  const story = document.querySelector('[data-story]');
  if (!story) return;
  const steps = [...story.querySelectorAll('[data-step]')];
  const shots = [...story.querySelectorAll('.frame__screen img')];
  const bars = [...story.querySelectorAll('.frame__progress i')];

  const activate = i => {
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    shots.forEach((s, k) => s.classList.toggle('is-on', k === i));
    bars.forEach((b, k) => b.classList.toggle('is-on', k <= i));
  };
  activate(0);

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) activate(Number(e.target.dataset.step));
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  steps.forEach(s => io.observe(s));
}
