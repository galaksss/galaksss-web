/*
  КАДРЫ В ПРОСТРАНСТВЕ

  Шесть кадров висят вокруг слогана на разной глубине (--z в CSS) и развёрнуты
  лицом к центру. Композиция целиком лежит в таблице стилей, здесь только
  движение — два независимых слоя.

  Первое — поворот сцены за мышью, с инерцией. Ничего не считаем покадрово
  для каждого кадра: дети лежат в общем объёме (preserve-3d), поэтому поворот
  сам разводит их с разной скоростью — дальние уезжают заметно, ближние почти
  стоят. Это настоящий параллакс, а не имитация разными коэффициентами.

  Второе — тихий дрейф каждого кадра по отдельности. У всех свои амплитуды,
  периоды и фазы, причём периоды намеренно некратные: если бы они совпадали,
  шесть кадров качались бы в такт и это читалось бы как заводная игрушка.
  Поэтому даже без мыши сцена не замирает.

  Значения отдаются переменными, сам transform собирается в таблице стилей:
  inline-стиль сильнее любой таблицы, и если писать transform из JS, отменить
  его на мобильном медиазапросом уже нечем.
*/

/* Поворот сцены от мыши: размах в градусах от края экрана до края.
   Держим маленьким намеренно — разброс глубины больше тысячи пикселей,
   и каждый лишний градус уводит дальние кадры на десятки пикселей. */
const MOUSE_RY = 4, MOUSE_RX = 2.6;
const EASE = 0.05;                    // доля пути к цели за кадр — она же инерция

export function initSheet(reduced) {
  const stage = document.querySelector('.sheet__grid');
  if (!stage) return;

  const cells = [...stage.querySelectorAll('.sheet__cell')];
  if (!cells.length) return;

  /* Статичная сцена, если пользователь просил меньше движения. Кадры при
     этом остаются на своих глубинах: композиция задана в CSS и не двигается. */
  if (reduced) return;

  // На узких экранах объём разобран в плоскую сетку (см. медиазапрос)
  if (!matchMedia('(min-width:821px)').matches) return;

  /* Параметры дрейфа. Разводим их по индексу — так у каждого кадра своя
     траектория, и совпадения фаз не случается на всём обозримом времени. */
  const drift = cells.map((_, i) => ({
    ax: 10 + (i % 3) * 5,       // размах, px
    ay: 7 + ((i + 1) % 3) * 4,
    az: 40 + (i % 2) * 30,      // по глубине — заметнее, это и даёт «дыхание»
    px: 9000  + i * 1700,       // периоды, мс
    py: 11000 + i * 1300,
    pz: 15000 + i * 2100,
    ph: i * 1.7                 // фаза
  }));

  const target = { x: 0, y: 0 };
  const cur    = { x: 0, y: 0 };
  let running = true;
  let raf = 0;

  addEventListener('pointermove', e => {
    target.x = e.clientX / innerWidth  - 0.5;    // −0.5 … 0.5
    target.y = e.clientY / innerHeight - 0.5;
  }, { passive: true });

  function frame(t) {
    /* Догоняем цель на доле расстояния за кадр — это и есть вся инерция.
       Двигать сцену прямо в обработчике нельзя: рывками и дёшево. */
    cur.x += (target.x - cur.x) * EASE;
    cur.y += (target.y - cur.y) * EASE;

    /* Даже с неподвижной мышью сцена очень медленно обходит по кругу */
    const ry =  cur.x * MOUSE_RY + Math.sin(t / 17000) * 1.8;
    const rx = -cur.y * MOUSE_RX + Math.cos(t / 23000) * 1.2;
    stage.style.setProperty('--ry', ry.toFixed(2) + 'deg');
    stage.style.setProperty('--rx', rx.toFixed(2) + 'deg');

    for (let i = 0; i < cells.length; i++) {
      const d = drift[i], s = cells[i].style;
      s.setProperty('--dx', (Math.sin(t / d.px + d.ph) * d.ax).toFixed(1) + 'px');
      s.setProperty('--dy', (Math.cos(t / d.py + d.ph) * d.ay).toFixed(1) + 'px');
      s.setProperty('--dz', (Math.sin(t / d.pz + d.ph * 1.3) * d.az).toFixed(1) + 'px');
    }

    if (running) raf = requestAnimationFrame(frame);
  }

  /* Герой ушёл с экрана — считать объём незачем */
  new IntersectionObserver(([e]) => {
    running = e.isIntersecting;
    if (running) raf = requestAnimationFrame(frame);
    else cancelAnimationFrame(raf);
  }).observe(stage.closest('.hero') || stage);
}
