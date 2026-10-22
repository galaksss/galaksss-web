/*
  ОКНО «ПРОМПТ → ПРОДУКТ»
  Короткий фильм в окне героя, по кругу: печатается задача, бежит код,
  окно «собирается» в живой интерфейс. Две сцены — фокус-режим и карточка
  дня из OneDay, то есть ровно то, что потом показывает кейс.

  Без JS и при reduced motion в окне просто стоит готовая первая сцена:
  у неё в разметке уже есть класс is-shown.
*/
const SCENES = [
  {
    prompt: 'a focus mode: full screen, calm, one big timer',
    code: [
      'export function Focus({ goal }) {',
      '  const time = useStopwatch(goal);',
      '  return (',
      '    <Screen dimWhenIdle>',
      '      <Timer value={time} />',
      '    </Screen>',
      '  );',
      '}',
    ],
  },
  {
    prompt: 'turn the day into a card worth sharing',
    code: [
      'export function DayCard({ day }) {',
      '  return (',
      '    <Card format="story">',
      '      <Total value={day.total} />',
      '      <Bar goals={day.goals} />',
      '      <Goals items={day.goals} />',
      '    </Card>',
      '  );',
      '}',
    ],
  },
];

const HOLD = 5200;       // сколько живёт готовый интерфейс, мс
const TYPE = 30;         // скорость печати, мс на знак

export function initPrompt(reduced) {
  const win = document.querySelector('[data-prompt]');
  if (!win) return;
  const typed = win.querySelector('[data-typed]');
  const lines = win.querySelector('[data-lines]');
  const state = win.querySelector('[data-state]');
  const scenes = [...win.querySelectorAll('[data-scene]')];
  const clock = win.querySelector('[data-clock]');

  const setState = s => { state.textContent = s; state.dataset.s = s; };
  setState('live');
  if (reduced) return;

  /* Часы в фокус-режиме идут по-настоящему */
  let secs = 42 * 60 + 17;
  setInterval(() => {
    secs++;
    const p = n => String(n).padStart(2, '0');
    clock.textContent = `${p(Math.floor(secs / 3600))}:${p(Math.floor(secs / 60) % 60)}:${p(secs % 60)}`;
  }, 1000);

  /* Фильм идёт, только пока окно видно: в фоне печатать некому смотреть */
  let visible = false;
  let wake = null;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && wake) { wake(); wake = null; }
  }).observe(win);
  const whenVisible = () => visible && !document.hidden
    ? Promise.resolve()
    : new Promise(r => { wake = r; });
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function play(i) {
    const scene = SCENES[i];
    await whenVisible();

    // Назад в редактор: прячем интерфейс, чистим текст
    win.classList.add('is-coding');
    typed.textContent = '';
    lines.innerHTML = '';
    setState('thinking');
    await sleep(700);

    for (const ch of scene.prompt) {
      typed.textContent += ch;
      await sleep(TYPE + Math.random() * 40);
    }
    await sleep(380);

    setState('writing');
    for (const src of scene.code) {
      const ln = document.createElement('span');
      ln.className = 'ln';
      ln.innerHTML = paint(src) || ' ';
      lines.append(ln);
      requestAnimationFrame(() => ln.classList.add('is-in'));
      await sleep(115);
    }
    await sleep(650);

    // Сборка: редактор уходит, на его месте проявляется интерфейс
    setState('building');
    await sleep(500);
    scenes.forEach((s, k) => s.classList.toggle('is-shown', k === i));
    win.classList.remove('is-coding');
    setState('live');
    await sleep(HOLD);
  }

  (async () => {
    // Первая сцена уже стоит готовой — даём на неё посмотреть, потом крутим
    await sleep(3200);
    for (let i = 1; ; i = (i + 1) % SCENES.length) await play(i);
  })();
}

/* Подсветка: строки → ключевые слова → JSX-теги. Строки первыми, чтобы
   кавычки в class="..." вставленных span-ов не приняли за строку. */
function paint(src) {
  return src
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/("[^"]*")/g, '<span class="tk-s">$1</span>')
    .replace(/\b(export|function|const|return)\b/g, '<span class="tk-k">$1</span>')
    .replace(/(&lt;\/?)([A-Z]\w*)/g, '$1<span class="tk-t">$2</span>');
}
