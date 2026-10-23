/*
  ЖИВАЯ КОПИЯ ONEDAY ДЛЯ КЕЙСА
  По мотивам секции How it works на лендинге OneDay (oneday/src/components/
  LandingHow.tsx): не снимок, а экран из тех же элементов — карточки целей,
  неделя, фокус-режим, карточка дня — на холсте 960×600, ужатом до окна.
  Курсор ходит по холсту и нажимает то же, что нажимал бы человек.

  Четыре сцены одного дня:
  0 — утро: курсор запускает секундомер у «Coding», он начинает тикать;
  1 — фокус-режим: цифры на весь экран, свечение разгорается;
  2 — вечер: курсор отмечает бассейн (5 → 6) и добирает видео до нормы;
  3 — итоги: карточка дня собирается, курсор жмёт «Download».
  Сцена проигрывается заново каждый раз, когда становится текущей и окно видно.
  При reduced motion курсора нет, сцены стоят в конечном состоянии.
*/
const W = 960, H = 600;
const HOUR = 3_600_000, MIN = 60_000;
const C = { coding: '#60A5FA', videos: '#818CF8', swim: '#2DD4BF', spanish: '#A78BFA', training: '#34D399' };

// раскладка холста — та же, что в LandingHow
const CARD_W = 285, CARD_H = 200, CARD_TOP = 222, LEFT = [36, 337, 638];
const BTN_Y = CARD_TOP + CARD_H - 40;
const T = {
  codingStart: { x: LEFT[0] + CARD_W - 20 - 40 - 8 - 20, y: BTN_Y },
  videosPlus: { x: LEFT[1] + CARD_W - 40, y: BTN_Y },
  swimCheck: { x: LEFT[2] + CARD_W - 40, y: BTN_Y },
  save: { x: 660, y: 270 },
};
const CODING_MORNING = 3 * HOUR + 59 * MIN + 31_000;
const FOCUS_START = 3 * HOUR + 59 * MIN + 45_000;

/* ---------- формат: «3 h 59 m» и «03:59:31» ---------- */
const pad = n => String(n).padStart(2, '0');
function dur(ms) {
  const h = Math.floor(ms / HOUR), m = Math.floor(ms / MIN) % 60;
  return h ? `${h}<u>h</u>${m}<u>m</u>` : `${m}<u>m</u>`;
}
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
const bar = (color, p, key = '') => `<span class="od-bar"><i ${key} style="--c:${color};width:${Math.min(1, p) * 100}%"></i></span>`;
function card({ key, left, top, color, name, day, value, quiet, cells, actions = '' }) {
  return `<div class="od-card" data-card="${key}" style="left:${left}px;top:${top}px;--c:${color}">
    <div class="od-card__head"><i class="od-dot"></i><span class="od-card__name">${name}</span><span class="od-card__day">${day}</span></div>
    <div class="od-card__value" data-value>${value}</div>
    <div class="od-card__quiet">${quiet}</div>
    <div class="od-card__foot">${week(cells)}<span class="od-card__actions">${actions}</span></div>
  </div>`;
}
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const head = total => `
  <div class="od-dayhead">
    <p class="od-label">Thursday, October 15</p>
    <div class="od-dayhead__row"><span class="od-num od-num--40" data-total>${dur(total)}</span><span class="od-pill">Day in review</span></div>
    <p class="od-label" data-vs>+${dur(Math.max(MIN, total - 3 * HOUR)).replace(/<\/?u>/g, ' ').replace(/\s+/g, ' ').trim()} over your 7-day average</p>
  </div>
  <div class="od-days">${DAYS.map((d, i) => `<span class="${i === 3 ? 'is-on' : i > 3 ? 'is-next' : ''}"><small>${d}</small><b>${12 + i}</b><i class="${i < 4 ? 'is-dot' : ''}"></i></span>`).join('')}</div>`;

function goalsScene(evening) {
  const coding = evening ? 4 * HOUR + 2 * MIN : CODING_MORNING;
  const other = evening ? 2 * HOUR + 2 * MIN : 0;
  return `
    ${head(coding + other)}
    <p class="od-title" style="top:190px">Today</p>
    ${card({ key: 'coding', left: LEFT[0], top: CARD_TOP, color: C.coding, name: 'Coding', day: 'Day 48',
      value: `<span class="od-num">${dur(coding)}</span>`,
      quiet: `${bar(C.coding, coding / (1.5 * HOUR))} of 1 h 30 m`,
      cells: ['done', 'done', 'done', 'miss', 'done', 'done', 'done'],
      actions: `<span class="od-btn" data-play>${ICON.play}</span><span class="od-btn od-btn--sq od-btn--fill">${ICON.check}</span>` })}
    ${card({ key: 'videos', left: LEFT[1], top: CARD_TOP, color: C.videos, name: 'Videos', day: 'Day 19',
      value: `<span class="od-num" data-count>${evening ? 1 : 0}</span>`,
      quiet: `${bar(C.videos, (evening ? 1 : 0) / 3, 'data-vbar')} of 3`,
      cells: ['done', 'miss', 'done', 'done', 'done', 'miss', evening ? 'done' : 'pending'],
      actions: `<span class="od-btn">${ICON.plus}</span>` })}
    ${card({ key: 'swim', left: LEFT[2], top: CARD_TOP, color: C.swim, name: 'Swimming', day: 'Day 61',
      value: `<span class="od-num"><span data-streak>5</span><u>days in a row</u></span>`,
      quiet: 'every day except Sun',
      cells: ['done', 'done', 'done', 'off', 'done', 'done', 'pending'],
      actions: '<span class="od-btn od-btn--sq" data-check></span>' })}
    <p class="od-title" style="top:452px">Other goals</p>
    ${card({ key: 'spanish', left: LEFT[0], top: 484, color: C.spanish, name: 'Spanish', day: 'Day 31',
      value: `<span class="od-num">${dur(evening ? 2 * HOUR + 2 * MIN : 0)}</span>`, quiet: 'on weekdays',
      cells: ['done', 'done', 'off', 'off', 'done', 'done', evening ? 'done' : 'pending'] })}
    ${card({ key: 'training', left: LEFT[1], top: 484, color: C.training, name: 'Training', day: 'Day 22',
      value: `<span class="od-num">${dur(0)}</span>`, quiet: 'whenever it happens',
      cells: ['done', 'off', 'done', 'off', 'off', 'done', 'pending'] })}
    <span class="od-cursor">${ICON.cursor}</span>`;
}

const focusScene = () => `
  <div class="od-glow" data-glow></div>
  <div class="od-focus">
    <div class="od-focus__top"><b>OneDay</b><span><i class="od-dot" style="--c:${C.coding}"></i>Coding</span><small>Day 61 · Thursday, October 15</small></div>
    <p class="od-focus__digits" data-focus>${timer(FOCUS_START)}</p>
    <div class="od-focus__bot"><span data-stretch>15 m in focus</span><span><i class="od-ring"></i>Daily goal met · 1 h 30 m</span></div>
  </div>`;

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
  <span class="od-cursor">${ICON.cursor}</span>`;

/* ---------- сборка и проигрывание ---------- */
export function createDemo(root, frame, reduced) {
  root.innerHTML = [goalsScene(false), focusScene(), goalsScene(true), cardScene()]
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
  const move = (s, p) => { const c = $(s, '.od-cursor'); c.style.left = p.x + 'px'; c.style.top = p.y + 'px'; };
  const click = s => {
    const c = $(s, '.od-cursor'), r = document.createElement('span');
    r.className = 'od-ripple'; c.append(r);
    setTimeout(() => r.remove(), 700);
  };
  // число выкатывается снизу (num-roll в OneDay)
  const roll = (el, html) => { el.innerHTML = `<span class="od-roll">${html}</span>`; };

  function playGoals(s, evening) {
    const coding = $(s, '[data-card=coding]'), videos = $(s, '[data-card=videos]'), swim = $(s, '[data-card=swim]');
    const total = $(s, '[data-total]');
    // исходное состояние сцены
    coding.classList.toggle('is-lit', evening);
    coding.classList.remove('is-running');
    $(coding, '[data-play]').innerHTML = ICON.play;
    swim.classList.remove('is-lit');
    $(swim, '[data-check]').innerHTML = '';
    $(swim, '[data-check]').classList.remove('od-btn--fill');
    $(swim, '[data-streak]').textContent = '5';
    swim.querySelector('.od-week i:last-child').className = 'is-pending';
    videos.classList.remove('is-lit');
    $(videos, '[data-count]').textContent = evening ? '1' : '0';
    $(videos, '[data-vbar]').style.width = `${(evening ? 1 : 0) / 3 * 100}%`;
    $(coding, '[data-value]').innerHTML = `<span class="od-num">${dur(evening ? 4 * HOUR + 2 * MIN : CODING_MORNING)}</span>`;
    const other = evening ? 2 * HOUR + 2 * MIN : 0;

    if (reduced) {
      if (!evening) { coding.classList.add('is-lit', 'is-running'); $(coding, '[data-play]').innerHTML = ICON.stop; $(coding, '[data-value]').innerHTML = `<span class="od-num od-num--timer">${timer(CODING_MORNING)}</span>`; }
      else {
        swim.classList.add('is-lit'); $(swim, '[data-check]').innerHTML = ICON.check; $(swim, '[data-check]').classList.add('od-btn--fill');
        $(swim, '[data-streak]').textContent = '6'; swim.querySelector('.od-week i:last-child').className = 'is-done'; videos.classList.add('is-lit'); $(videos, '[data-count]').textContent = '3'; $(videos, '[data-vbar]').style.width = '100%';
      }
      return;
    }
    const c = $(s, '.od-cursor');
    c.style.transition = 'none'; move(s, { x: 520, y: 560 }); c.getBoundingClientRect(); c.style.transition = '';

    if (!evening) {
      at(450, () => move(s, T.codingStart));
      at(1500, () => {
        click(s);
        coding.classList.add('is-lit', 'is-running');
        $(coding, '[data-play]').innerHTML = ICON.stop;
        const t0 = Date.now();
        const draw = () => {
          const ms = CODING_MORNING + Date.now() - t0;
          $(coding, '[data-value]').innerHTML = `<span class="od-num od-num--timer">${timer(ms)}</span>`;
          total.innerHTML = dur(ms + other);
        };
        draw(); every(250, draw);
      });
      at(2700, () => move(s, { x: 600, y: 540 }));
    } else {
      at(450, () => move(s, T.swimCheck));
      at(1500, () => {
        click(s);
        swim.classList.add('is-lit');
        const btn = $(swim, '[data-check]');
        btn.classList.add('od-btn--fill'); btn.innerHTML = `<span class="od-pop">${ICON.check}</span>`;
        roll($(swim, '[data-streak]'), '6');
        swim.querySelector('.od-week i:last-child').className = 'is-done';
      });
      at(2300, () => move(s, T.videosPlus));
      const add = n => () => {
        click(s);
        roll($(videos, '[data-count]'), String(n));
        $(videos, '[data-vbar]').style.width = `${n / 3 * 100}%`;
        videos.classList.toggle('is-lit', n >= 3);
      };
      at(3300, add(2));
      at(4000, add(3));
      at(5000, () => move(s, { x: 760, y: 548 }));
    }
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

  function playCard(s) {
    const dc = $(s, '[data-dc]'), dl = $(s, '[data-dl]');
    dl.textContent = 'Download'; dl.classList.remove('is-busy');
    dc.classList.remove('is-reveal');
    if (reduced) return;
    dc.getBoundingClientRect();
    dc.classList.add('is-reveal');
    const c = $(s, '.od-cursor');
    c.style.transition = 'none'; move(s, { x: 760, y: 520 }); c.getBoundingClientRect(); c.style.transition = '';
    at(1500, () => move(s, T.save));
    at(2500, () => { click(s); dl.textContent = 'Preparing…'; dl.classList.add('is-busy'); });
    at(3700, () => { dl.textContent = 'Download'; dl.classList.remove('is-busy'); });
    at(4300, () => move(s, { x: 780, y: 470 }));
  }

  const play = i => {
    stop();
    const s = scenes[i];
    if (i === 0) playGoals(s, false);
    else if (i === 1) playFocus(s);
    else if (i === 2) playGoals(s, true);
    else playCard(s);
  };

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
