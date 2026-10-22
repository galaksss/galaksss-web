/*
  ПОЯВЛЕНИЯ, СЧЁТЧИКИ, МАГНИТНЫЕ КНОПКИ, ПОДСВЕТКА КАРТОЧЕК, КОПИРОВАНИЕ ПОЧТЫ
  Всё на IntersectionObserver и requestAnimationFrame, без библиотек.
*/
export function initReveal(reduced) {
  /* Появление блоков: один раз, когда верх блока на 12% выше низа экрана */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('.reveal, [data-steps]').forEach(el => io.observe(el));

  /* Счётчики: от нуля до числа из data-count за ~1.4 с, с замедлением
     к концу. В разметке число уже стоит — без JS оно просто видно. */
  const counters = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      counters.unobserve(e.target);
      if (reduced) return;
      const el = e.target, end = Number(el.dataset.count), t0 = performance.now(), dur = 1400;
      const tick = t => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(el => counters.observe(el));

  /* Копирование почты: клик копирует адрес и на секунду говорит об этом,
     но mailto тоже срабатывает — кому-то удобнее почтовый клиент. */
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

  if (reduced || !matchMedia('(pointer: fine)').matches) return;

  /* Подсветка карточек под курсором: только координаты в --x/--y,
     сам круг рисует CSS */
  document.querySelectorAll('[data-glow]').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--x', (e.clientX - r.left) + 'px');
      card.style.setProperty('--y', (e.clientY - r.top) + 'px');
    });
  });

  /* Магнитные кнопки: тянутся к курсору на треть расстояния, не больше 8px.
     Пишем переменные, transform собирает CSS — там же и плавность. */
  document.querySelectorAll('[data-magnet]').forEach(btn => {
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / 3;
      const dy = (e.clientY - (r.top + r.height / 2)) / 3;
      btn.style.setProperty('--tx', Math.max(-8, Math.min(8, dx)) + 'px');
      btn.style.setProperty('--ty', Math.max(-8, Math.min(8, dy)) + 'px');
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.setProperty('--tx', '0px');
      btn.style.setProperty('--ty', '0px');
    });
  });
}
