/*
  ГЕРОЙ И ШАПКА
  1. Заголовок разбивается на слова, и они проявляются по очереди: из
     размытия, снизу вверх. Курсивные слова (<em>) идут целиком, одним словом.
  2. Сетка точек на фоне видна только вокруг курсора — пишем его координаты
     в --mx/--my с инерцией, чтобы пятно плыло, а не прыгало за мышью.
  3. Шапка становится стеклянной, когда герой уехал вверх.
*/
export function initHero(reduced) {
  const hero = document.querySelector('[data-hero]');
  const title = document.querySelector('.hero__title');
  const nav = document.querySelector('[data-nav]');
  if (!hero || !title) return;

  // Строк две, счёт слов сквозной — вторая строка продолжает волну первой
  let i = 0;
  title.querySelectorAll('[data-split]').forEach(line => { i = splitWords(line, i); });

  // Ждём шрифты: иначе слова проявятся системным шрифтом и перескочат
  const start = () => requestAnimationFrame(() => {
    title.classList.add('is-in');
    hero.classList.add('is-ready');
  });
  if (reduced) start();
  else Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 900))]).then(start);

  /* Шапка: класс по положению скролла, через rAF, а не прямо в обработчике */
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    nav?.classList.toggle('is-solid', scrollY > 24);
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (reduced || !matchMedia('(pointer: fine)').matches) return;

  /* Пятно за курсором. Догоняем цель на долю пути за кадр — это вся инерция.
     Цикл живёт, только пока герой на экране. */
  const target = { x: 0.72, y: 0.38 };
  const cur = { ...target };
  let raf = 0, visible = true;

  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    target.x = (e.clientX - r.left) / r.width;
    target.y = (e.clientY - r.top) / r.height;
  });

  const frame = () => {
    cur.x += (target.x - cur.x) * 0.08;
    cur.y += (target.y - cur.y) * 0.08;
    hero.style.setProperty('--mx', (cur.x * 100).toFixed(2) + '%');
    hero.style.setProperty('--my', (cur.y * 100).toFixed(2) + '%');
    if (visible) raf = requestAnimationFrame(frame);
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) raf = requestAnimationFrame(frame);
  }).observe(hero);
}

/* Слова — в span.w с порядковым --i. Пробелы остаются текстом между ними,
   поэтому точка сразу после </em> не отрывается от слова. */
function splitWords(el, i = 0) {
  const wrap = () => {
    const s = document.createElement('span');
    s.className = 'w';
    s.style.setProperty('--i', i++);
    return s;
  };
  [...el.childNodes].forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(part); return; }
        const s = wrap();
        s.textContent = part;
        frag.append(s);
      });
      node.replaceWith(frag);
    } else {
      const s = wrap();
      node.replaceWith(s);
      s.append(node);
    }
  });
  return i;
}
