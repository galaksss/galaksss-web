/*
  ЖИВАЯ КОПИЯ ONEDAY ДЛЯ КЕЙСА
  По мотивам секции How it works на лендинге OneDay (oneday/src/components/
  LandingHow.tsx): не снимок, а экран из тех же элементов — карточки целей,
  неделя, фокус-режим, история, карточка дня — на холсте 960×600, ужатом
  до окна. Курсор ходит по холсту и нажимает то же, что нажимал бы человек.

  Четыре сцены одного дня:
  0 — цели: курсор запускает секундомер у «Coding», отмечает бассейн (5 → 6)
      и двумя нажатиями «+» добирает видео до нормы;
  1 — фокус-режим: цифры на весь экран, свечение разгорается;
  2 — история: столбики недели вырастают, часы досчитываются, курсор ведёт
      по дням, подсказка показывает разбивку дня по целям;
  3 — итоги: карточка дня собирается, курсор жмёт «Download».
  Сцена проигрывается заново каждый раз, когда становится текущей и окно видно.
  Куда целиться, курсор узнаёт у самих кнопок — раскладка может меняться.
  При reduced motion курсора нет, сцены стоят в конечном состоянии.
*/
const W = 960;
const HOUR = 3_600_000, MIN = 60_000;
const C = { coding: '#60A5FA', videos: '#818CF8', swim: '#2DD4BF', spanish: '#A78BFA', training: '#34D399' };

// раскладка холста — та же, что в LandingHow
const CARD_TOP = 222, LEFT = [36, 337, 638];
const CODING_MORNING = 3 * HOUR + 59 * MIN + 31_000;
const FOCUS_START = 3 * HOUR + 59 * MIN + 45_000;

/* ---------- формат: «3 h 59 m» и «03:59:31» ---------- */
const pad = n => String(n).padStart(2, '0');
function dur(ms) {
  const h = Math.floor(ms / HOUR), m = Math.floor(ms / MIN) % 60;
  return h ? `${h}<u>h</u>${m}<u>m</u>` : `${m}<u>m</u>`;
}
const durText = ms => dur(ms).replace(/<u>/g, ' ').replace(/<\/u>/g, ' ').replace(/\s+/g, ' ').trim();
function timer(ms) {
  const s = Math.floor(ms / 1000);
  return [pad(Math.floor(s / 3600)), pad(Math.floor(s / 60) % 60), pad(s % 60)].join('<i>:</i>');
}

/* ---------- значки ---------- */
const ICON = {
  play: '<svg viewBox="0 0 16 16"><path d="M5 3.2v9.6L12.6 8z" fill="currentColor"/></svg>',
  stop: '<svg viewBox="0 0 16 16"><rect x="4.5" y="4.5" width="7" height="7" rx="1.6" fill="currentColor"/></svg>',
  check: '<svg viewBox="0 0 16 16"><path d="M3.5 8.4l3 3 6-6.8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plus: '<svg viewBox="0 0 16 16"><path d="M8 3.5v9M3.5 8h9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  cursor: '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M4 2.5l15.5 9-7 1.6-3.6 6.4z" fill="#fff" stroke="#000" stroke-width="1.4" stroke-linejoin="round"/></svg>',
};

/* ---------- кирпичи разметки ---------- */
const week = states => `<span class="od-week">${states.map(s => `<i class="is-${s}"></i>`).join('')}</span>`;
const bar = (color, p, key = '') => `<span class="od-bar"><i ${key} style="--c:${color};--p:${Math.min(1, p)}"></i></span>`;
function card({ key, left, top, color, name, day, value, quiet, cells, actions = '' }) {
  return `<div class="od-card" data-card="${key}" style="left:${left}px;top:${top}px;--c:${color}">
    <div class="od-card__head"><i class="od-dot"></i><span class="od-card__name">${name}</span><span class="od-card__day">${day}</span></div>
    <div class="od-card__value" data-value>${value}</div>
    <div class="od-card__quiet">${quiet}</div>
    <div class="od-card__foot">${week(cells)}<span class="od-card__actions">${actions}</span></div>
  </div>`;
}
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const cursor = `<span class="od-cursor">${ICON.cursor}</span>`;

/* ---------- сцена 0: цели ---------- */
const goalsScene = () => `
  <div class="od-dayhead">
    <p class="od-label">Thursday, October 15</p>
    <div class="od-dayhead__row"><span class="od-num od-num--40" data-total>${dur(CODING_MORNING)}</span><span class="od-pill">Day in review</span></div>
    <p class="od-label" data-vs></p>
  </div>
  <div class="od-days">${DAYS.map((d, i) => `<span class="${i === 3 ? 'is-on' : i > 3 ? 'is-next' : ''}"><small>${d}</small><b>${12 + i}</b><i class="${i < 4 ? 'is-dot' : ''}"></i></span>`).join('')}</div>
  <p class="od-title" style="top:190px">Today</p>
  ${card({ key: 'coding', left: LEFT[0], top: CARD_TOP, color: C.coding, name: 'Coding', day: 'Day 48',
    value: `<span class="od-num">${dur(CODING_MORNING)}</span>`,
    quiet: `${bar(C.coding, 1)} of 1 h 30 m`,
    cells: ['done', 'done', 'done', 'miss', 'done', 'done', 'done'],
    actions: `<span class="od-btn" data-play>${ICON.play}</span><span class="od-btn od-btn--sq od-btn--fill">${ICON.check}</span>` })}
  ${card({ key: 'videos', left: LEFT[1], top: CARD_TOP, color: C.videos, name: 'Videos', day: 'Day 19',
    value: '<span class="od-num" data-count>1</span>',
    quiet: `${bar(C.videos, 1 / 3, 'data-vbar')} of 3`,
    cells: ['done', 'miss', 'done', 'done', 'done', 'miss', 'done'],
    actions: `<span class="od-btn" data-plus>${ICON.plus}</span>` })}
  ${card({ key: 'swim', left: LEFT[2], top: CARD_TOP, color: C.swim, name: 'Swimming', day: 'Day 61',
    value: '<span class="od-num"><span data-streak>5</span><u>days in a row</u></span>',
    quiet: 'every day except Sun',
    cells: ['done', 'done', 'done', 'off', 'done', 'done', 'pending'],
    actions: '<span class="od-btn od-btn--sq" data-check></span>' })}
  <p class="od-title" style="top:452px">Other goals</p>
  ${card({ key: 'spanish', left: LEFT[0], top: 484, color: C.spanish, name: 'Spanish', day: 'Day 31',
    value: `<span class="od-num">${dur(72 * MIN)}</span>`, quiet: 'on weekdays',
    cells: ['done', 'done', 'off', 'off', 'done', 'done', 'done'] })}
  ${card({ key: 'training', left: LEFT[1], top: 484, color: C.training, name: 'Training', day: 'Day 22',
    value: `<span class="od-num">${dur(0)}</span>`, quiet: 'whenever it happens',
    cells: ['done', 'off', 'done', 'off', 'off', 'done', 'pending'] })}
  ${cursor}`;
const SPANISH_MORNING = 72 * MIN;

/* ---------- сцена 1: фокус ---------- */
const focusScene = () => `
  <div class="od-glow" data-glow></div>
  <div class="od-focus">
    <div class="od-focus__top"><b>OneDay</b><span><i class="od-dot" style="--c:${C.coding}"></i>Coding</span><small>Day 61 · Thursday, October 15</small></div>
    <p class="od-focus__digits" data-focus>${timer(FOCUS_START)}</p>
    <div class="od-focus__bot"><span data-stretch>15 m in focus</span><span><i class="od-ring"></i>Daily goal met · 1 h 30 m</span></div>
  </div>`;

/* ---------- сцена 2: история ---------- */
// неделя Fri 9 → Thu 15: минуты по целям; сумма — 30.1 часа, четверг — лучший день
const HIST = [
  { d: 'Fr', full: 'Friday, October 9', v: [78, 48, 0], swim: true },
  { d: 'Sa', full: 'Saturday, October 10', v: [96, 54, 30], swim: true },
  { d: 'Su', full: 'Sunday, October 11', v: [110, 82, 0], swim: false },
  { d: 'Mo', full: 'Monday, October 12', v: [150, 60, 30], swim: true },
  { d: 'Tu', full: 'Tuesday, October 13', v: [146, 74, 45], swim: true },
  { d: 'We', full: 'Wednesday, October 14', v: [200, 112, 60], swim: true },
  { d: 'Th', full: 'Thursday, October 15', v: [239, 122, 74], swim: true },
];
const HIST_COLORS = [C.coding, C.spanish, C.training];
const HIST_NAMES = ['Coding', 'Spanish', 'Training'];
const PX_PER_MIN = 0.66;                 // 435 мин четверга → 287 px
const historyScene = () => `
  <p class="od-h" style="top:32px">History</p>
  <div class="od-seg od-seg--top"><span class="is-on">Week</span><span>Month</span></div>
  <div class="od-hist">
    <div class="od-hist__facts">
      <p class="od-hist__big" data-hours>30.1</p>
      <p class="od-label">hours this week</p>
      <dl>
        <div><dt>Day</dt><dd class="od-num">61</dd></div>
        <div><dt>Streak</dt><dd class="od-num">9<u>days</u></dd></div>
        <div><dt>Best day</dt><dd class="od-num">7<u>h</u>15<u>m</u></dd></div>
      </dl>
    </div>
    <div class="od-hist__chart" data-chart>
      ${HIST.map((day, i) => `<div class="od-col${i === 6 ? ' is-best' : ''}" data-col="${i}">
        ${i === 6 ? '<span class="od-col__best">Best day</span>' : ''}
        <span class="od-col__stack" style="--d:${i * 60}ms">${day.v.map((m, k) => (m ? `<i style="--c:${HIST_COLORS[k]};height:${Math.round(m * PX_PER_MIN)}px"></i>` : '')).reverse().join('')}</span>
        <span class="od-col__day">${day.d}</span>
        <i class="od-col__mark${day.swim ? ' is-on' : ''}"></i>
      </div>`).join('')}
      <div class="od-tip" data-tip></div>
    </div>
  </div>
  ${cursor}`;

/* ---------- сцена 3: итоги дня ---------- */
const cardScene = () => `
  <p class="od-label" style="position:absolute;top:28px;left:36px">Thursday, October 15</p>
  <p class="od-h" style="top:50px">Day in review</p>
  <div class="od-dc" data-dc>
    <div class="od-dc__head" data-r style="--d:90ms"><span>Day 61 · October 15</span><em>New record</em></div>
    <div class="od-dc__glow" data-r="glow"></div>
    <p class="od-dc__total od-num" data-r="num" style="--d:170ms">7<u>h</u>15<u>m</u></p>
    <p class="od-dc__sub" data-r style="--d:300ms">+3 h 29 m over your 7-day average · 9 days in a row</p>
    <div class="od-dc__bar" data-r="bar" style="--d:360ms"><i style="--c:${C.coding};flex:239"></i><i style="--c:${C.spanish};flex:122"></i><i style="--c:${C.training};flex:74"></i></div>
    <ul class="od-dc__rows">
      <li data-r style="--d:440ms;--c:${C.coding}"><span><i class="od-dot"></i>Coding</span><span>3 h 59 m</span></li>
      <li data-r style="--d:510ms;--c:${C.spanish}"><span><i class="od-dot"></i>Spanish</span><span>2 h 2 m</span></li>
      <li data-r style="--d:580ms;--c:${C.training}"><span><i class="od-dot"></i>Training</span><span>1 h 14 m</span></li>
      <li data-r style="--d:650ms;--c:${C.swim}"><span><i class="od-dot"></i>Swimming</span><span>marked</span></li>
    </ul>
    <p class="od-dc__brand" data-r style="--d:720ms">OneDay<small>one day starts with day one</small></p>
  </div>
  <div class="od-side">
    <p class="od-label">Card format</p>
    <div class="od-seg"><span class="is-on">Square</span><span>Story</span></div>
    <span class="od-dl" data-dl>Download</span>
  </div>
  ${cursor}`;

/* ---------- сборка и проигрывание ---------- */
export function createDemo(root, frame, reduced) {
  root.innerHTML = [goalsScene(), focusScene(), historyScene(), cardScene()]
    .map((html, i) => `<div class="od-scene${i === 0 ? ' is-on' : ''}" data-i="${i}">${html}</div>`).join('');
  const scenes = [...root.children];
  const fit = () => { root.style.transform = `scale(${frame.clientWidth / W})`; };
  new ResizeObserver(fit).observe(frame);
  fit();

  let cur = 0, live = false, timers = [], loops = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  const every = (ms, fn) => loops.push(setInterval(fn, ms));
  const stop = () => { timers.forEach(clearTimeout); loops.forEach(clearInterval); timers = []; loops = []; };

  const $ = (s, sel) => s.querySelector(sel);
  // центр элемента в координатах сцены (холст не ужат: offset* — в пикселях холста)
  const center = (scene, el) => {
    let x = el.offsetWidth / 2, y = el.offsetHeight / 2;
    for (let n = el; n && n !== scene; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
    return { x, y };
  };
  const move = (s, p) => { const c = $(s, '.od-cursor'); c.style.transform = `translate(${p.x}px, ${p.y}px)`; };
  const place = (s, p) => { const c = $(s, '.od-cursor'); c.style.transition = 'none'; move(s, p); c.getBoundingClientRect(); c.style.transition = ''; };
  const aim = (s, sel) => move(s, center(s, typeof sel === 'string' ? $(s, sel) : sel));
  const click = s => {
    const c = $(s, '.od-cursor'), r = document.createElement('span');
    r.className = 'od-ripple'; c.append(r);
    setTimeout(() => r.remove(), 700);
  };
  // число выкатывается снизу (num-roll в OneDay)
  const roll = (el, html) => { el.innerHTML = `<span class="od-roll">${html}</span>`; };

  function playGoals(s) {
    const coding = $(s, '[data-card=coding]'), videos = $(s, '[data-card=videos]'), swim = $(s, '[data-card=swim]');
    const total = $(s, '[data-total]'), vs = $(s, '[data-vs]');
    const setTotal = ms => {
      total.innerHTML = dur(ms + SPANISH_MORNING);
      vs.textContent = `+${durText(Math.max(MIN, ms + SPANISH_MORNING - 4 * HOUR))} over your 7-day average`;
    };
    // исходное состояние: секундомер стоит, бассейн не отмечен, видео 1 из 3
    coding.classList.remove('is-lit', 'is-running');
    $(coding, '[data-play]').innerHTML = ICON.play;
    $(coding, '[data-value]').innerHTML = `<span class="od-num">${dur(CODING_MORNING)}</span>`;
    swim.classList.remove('is-lit');
    const check = $(swim, '[data-check]');
    check.innerHTML = ''; check.classList.remove('od-btn--fill');
    $(swim, '[data-streak]').textContent = '5';
    swim.querySelector('.od-week i:last-child').className = 'is-pending';
    videos.classList.remove('is-lit');
    $(videos, '[data-count]').textContent = '1';
    $(videos, '[data-vbar]').style.setProperty('--p', 1 / 3);
    setTotal(CODING_MORNING);

    const startTimer = () => {
      coding.classList.add('is-lit', 'is-running');
      $(coding, '[data-play]').innerHTML = ICON.stop;
      const t0 = Date.now();
      const draw = () => {
        const ms = CODING_MORNING + (reduced ? 0 : Date.now() - t0);
        $(coding, '[data-value]').innerHTML = `<span class="od-num od-num--timer">${timer(ms)}</span>`;
        setTotal(ms);
      };
      draw();
      if (!reduced) every(250, draw);
    };
    const markSwim = () => {
      swim.classList.add('is-lit');
      check.classList.add('od-btn--fill');
      check.innerHTML = reduced ? ICON.check : `<span class="od-pop">${ICON.check}</span>`;
      if (reduced) $(swim, '[data-streak]').textContent = '6'; else roll($(swim, '[data-streak]'), '6');
      swim.querySelector('.od-week i:last-child').className = 'is-done';
    };
    const addVideo = n => {
      if (reduced) $(videos, '[data-count]').textContent = String(n); else roll($(videos, '[data-count]'), String(n));
      $(videos, '[data-vbar]').style.setProperty('--p', n / 3);
      videos.classList.toggle('is-lit', n >= 3);
    };

    if (reduced) { startTimer(); markSwim(); addVideo(3); return; }
    place(s, { x: 520, y: 560 });
    at(450, () => aim(s, '[data-play]'));
    at(1500, () => { click(s); startTimer(); });
    at(2400, () => aim(s, '[data-check]'));
    at(3400, () => { click(s); markSwim(); });
    at(4200, () => aim(s, '[data-plus]'));
    at(5200, () => { click(s); addVideo(2); });
    at(5900, () => { click(s); addVideo(3); });
    at(6900, () => move(s, { x: 760, y: 548 }));
  }

  function playFocus(s) {
    const digits = $(s, '[data-focus]'), glow = $(s, '[data-glow]'), stretch = $(s, '[data-stretch]');
    glow.classList.remove('is-lit');
    digits.innerHTML = timer(FOCUS_START);
    if (reduced) { glow.classList.add('is-lit'); return; }
    at(500, () => glow.classList.add('is-lit'));
    const t0 = Date.now();
    every(250, () => {
      const ms = FOCUS_START + Date.now() - t0;
      digits.innerHTML = timer(ms);
      stretch.textContent = `${15 + Math.floor((ms - FOCUS_START) / MIN)} m in focus`;
    });
  }

  function playHistory(s) {
    const chart = $(s, '[data-chart]'), tip = $(s, '[data-tip]'), hours = $(s, '[data-hours]');
    const cols = [...s.querySelectorAll('[data-col]')];
    // подсказка над столбиком: дата, итог и разбивка по целям (как в «Истории» OneDay)
    const showTip = i => {
      const day = HIST[i], sum = day.v.reduce((a, b) => a + b, 0) * MIN;
      tip.innerHTML = `<p class="od-label">${day.full}</p><p class="od-num">${dur(sum)}</p><ul>${day.v.map((m, k) => (m ? `<li style="--c:${HIST_COLORS[k]}"><span><i class="od-dot"></i>${HIST_NAMES[k]}</span><span>${durText(m * MIN)}</span></li>` : '')).join('')}${day.swim ? `<li style="--c:${C.swim}"><span><i class="od-dot"></i>Swimming</span><span>marked</span></li>` : ''}</ul>`;
      const col = cols[i];
      // слева от столбика, чтобы не закрывать сам день; у края — справа
      const left = col.offsetLeft - 240 - 14;
      tip.style.transform = `translateX(${left >= 0 ? left : col.offsetLeft + col.offsetWidth + 14}px)`;
      tip.classList.add('is-on');
      chart.classList.add('has-hover');
      cols.forEach((c, k) => c.classList.toggle('is-hover', k === i));
    };
    const hideTip = () => { tip.classList.remove('is-on'); chart.classList.remove('has-hover'); cols.forEach(c => c.classList.remove('is-hover')); };
    hideTip();
    chart.classList.remove('is-in', 'is-wait');
    if (reduced) { hours.textContent = '30.1'; return; }
    // спрятать столбики, дать сцене проявиться и только тогда растить — с нуля
    chart.classList.add('is-wait');
    chart.getBoundingClientRect();
    const GROW_AT = 250;
    at(GROW_AT, () => { chart.classList.remove('is-wait'); chart.classList.add('is-in'); });
    hours.textContent = '0.0';
    const t0 = performance.now() + GROW_AT;
    every(30, () => {
      const p = Math.max(0, Math.min(1, (performance.now() - t0) / 1400));
      hours.textContent = (30.1 * (1 - Math.pow(1 - p, 3))).toFixed(1);
    });
    place(s, { x: 600, y: 560 });
    at(1300, () => aim(s, cols[4].querySelector('.od-col__stack')));
    at(2300, () => showTip(4));
    at(3500, () => aim(s, cols[5].querySelector('.od-col__stack')));
    at(4300, () => showTip(5));
    at(5600, () => { hideTip(); move(s, { x: 640, y: 560 }); });
  }

  function playCard(s) {
    const dc = $(s, '[data-dc]'), dl = $(s, '[data-dl]');
    dl.textContent = 'Download'; dl.classList.remove('is-busy');
    dc.classList.remove('is-reveal');
    if (reduced) return;
    dc.getBoundingClientRect();
    dc.classList.add('is-reveal');
    place(s, { x: 760, y: 520 });
    at(1500, () => aim(s, dl));
    at(2500, () => { click(s); dl.textContent = 'Preparing…'; dl.classList.add('is-busy'); });
    at(3700, () => { dl.textContent = 'Download'; dl.classList.remove('is-busy'); });
    at(4300, () => move(s, { x: 780, y: 470 }));
  }

  const PLAY = [playGoals, playFocus, playHistory, playCard];
  const play = i => { stop(); PLAY[i](scenes[i]); };

  return {
    // смена сцены — кроссфейд из дымки, как в OneDay
    show(i) {
      if (i === cur) return;
      const prev = scenes[cur], next = scenes[i];
      cur = i;
      next.classList.remove('is-out'); next.classList.add('is-on');
      prev.classList.remove('is-on'); prev.classList.add('is-out');
      clearTimeout(prev._t); prev._t = setTimeout(() => prev.classList.remove('is-out'), 650);
      if (live) play(i);
    },
    // сразу на нужную сцену, без кроссфейда (окна у шагов на телефоне)
    jump(i) {
      scenes.forEach((s, k) => { s.classList.toggle('is-on', k === i); s.classList.remove('is-out'); });
      cur = i;
      if (live) play(i);
    },
    setLive(v) {
      if (v === live) return;
      live = v;
      if (live) play(cur); else stop();
    },
  };
}
