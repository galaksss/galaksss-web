import { createBuckets } from './buckets.js';

/*
  ОКНО РЕНДЕРА В ГЕРОЕ
  Абстрактная скульптура (тор и сфера, слитые smooth-min) рисуется
  реймарчингом в одном фрагментном шейдере, в реальном времени.
  Четыре прохода, как в VFX-программе: Beauty, Normals, Depth, Wire
  (кнопки или клавиши 1–4). При загрузке и смене прохода кадр
  «дорендеривается» бакетами; их прогресс ведёт статус в шапке и HUD.
  Камера облетает скульптуру за курсором. Разрешение подстраивается
  под скорость машины, цикл стоит, когда окна не видно.
*/
const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uPass;
uniform vec2 uMouse;

mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float smin(float a, float b, float k){ float h = clamp(.5 + .5 * (b - a) / k, 0., 1.); return mix(b, a, h) - k * h * (1. - h); }
float sdTorus(vec3 p, vec2 t){ vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

const float FLOOR = -1.15;

float obj(vec3 p){
  vec3 q = p;
  q.xz = rot(uTime * .3) * q.xz;
  q.xy = rot(.6) * q.xy;
  float tor = sdTorus(q, vec2(.92, .26));
  float sph = length(p - vec3(sin(uTime * .7) * .35, .05 + cos(uTime * .5) * .15, 0.)) - .55;
  return smin(tor, sph, .38);
}
vec2 map(vec3 p){
  float o = obj(p), f = p.y - FLOOR;
  return o < f ? vec2(o, 1.) : vec2(f, 2.);
}
vec3 nrm(vec3 p){
  vec2 k = vec2(.001, 0.);
  return normalize(vec3(map(p + k.xyy).x - map(p - k.xyy).x, map(p + k.yxy).x - map(p - k.yxy).x, map(p + k.yyx).x - map(p - k.yyx).x));
}
float shadow(vec3 ro, vec3 rd){
  float r = 1., t = .02;
  for (int i = 0; i < 40; i++){ float h = obj(ro + rd * t); r = min(r, 10. * h / t); t += clamp(h, .02, .25); if (h < .001 || t > 6.) break; }
  return clamp(r, 0., 1.);
}
// студия: тёмный бокс, ультрафиолетовый софтбокс слева, синий справа, мягкий свет сверху
vec3 env(vec3 d){
  vec3 c = vec3(.02, .02, .03) + vec3(.04, .04, .06) * max(d.y, 0.);
  c += vec3(.55, .42, 1.) * smoothstep(.55, .95, dot(d, normalize(vec3(-1., .25, .35)))) * 2.2;
  c += vec3(.35, .62, 1.) * smoothstep(.6, .97, dot(d, normalize(vec3(1., .15, -.2)))) * 1.8;
  c += vec3(1.) * smoothstep(.7, 1., d.y) * .9;
  return c;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - .5 * uRes) / uRes.y;
  vec3 ro = vec3(uMouse.x * .9, .35 + uMouse.y * .35, 3.7);
  ro.xz = rot(uMouse.x * .25) * ro.xz;
  vec3 ta = vec3(0., -.1, 0.);
  vec3 fw = normalize(ta - ro), rt = normalize(cross(fw, vec3(0., 1., 0.))), up = cross(rt, fw);
  vec3 rd = normalize(fw * 1.9 + rt * uv.x + up * uv.y);

  float t = 0.; vec2 h = vec2(0.); bool hit = false;
  for (int i = 0; i < 100; i++){
    h = map(ro + rd * t);
    if (h.x < .001){ hit = true; break; }
    t += h.x;
    if (t > 12.) break;
  }
  vec3 p = ro + rd * t;
  vec3 col = vec3(0.);

  if (uPass < .5){
    // BEAUTY: чёрный глянец, отражает студию; пол глянцевый
    if (hit){
      vec3 n = nrm(p);
      if (h.y < 1.5){
        float fre = pow(1. - max(dot(n, -rd), 0.), 4.);
        vec3 L = normalize(vec3(-.4, 1., .5));
        float dif = max(dot(n, L), 0.);
        col = vec3(.03, .028, .045) * (.3 + dif) + env(reflect(rd, n)) * (.55 + fre * 1.2);
      } else {
        vec3 L = normalize(vec3(-.4, 1., .3));
        float sh = shadow(p + vec3(0., .01, 0.), L);
        float pool = exp(-length(p.xz) * 1.6);
        col = vec3(.02, .02, .03) * (.4 + .6 * sh) + vec3(.55, .42, 1.) * pool * .12 * sh;
        vec3 rr = reflect(rd, vec3(0., 1., 0.));
        float tr = 0.; float hr = 1.;
        for (int k = 0; k < 40; k++){ hr = obj(p + rr * tr); if (hr < .002 || tr > 5.) break; tr += hr; }
        vec3 refl = hr < .002 ? env(reflect(rr, nrm(p + rr * tr))) * .5 : env(rr) * .4;
        col += refl * .35 * pow(1. - max(dot(vec3(0., 1., 0.), -rd), 0.), 2.);
        col *= exp(-.06 * t * t);
      }
    } else col = env(rd) * .25;
    col *= 1. - .35 * dot(uv, uv);                     // лёгкая виньетка
  } else if (uPass < 1.5){
    // NORMALS
    if (hit) col = nrm(p) * .5 + .5;
    if (hit && h.y > 1.5) col *= .35;
  } else if (uPass < 2.5){
    // DEPTH: ближе — светлее
    if (hit) col = vec3(1. - clamp((t - 2.4) / 3.6, 0., 1.));
  } else {
    // WIRE: сетка по мировым координатам — ультрафиолет на объекте, серая на полу
    if (hit){
      vec3 g = abs(fract(p * (h.y < 1.5 ? 6. : 2.5)) - .5);
      float line = 1. - smoothstep(0., .035, min(min(g.x, g.y), g.z));
      col = h.y < 1.5 ? vec3(.62, .52, 1.) * line + vec3(.03, .02, .06) : vec3(.18) * line * exp(-.1 * t * t);
    }
  }
  col = col / (1. + col * .4);
  col += (hash(gl_FragCoord.xy + fract(uTime)) - .5) / 255.;   // дизеринг против полос
  gl_FragColor = vec4(col, 1.);
}`;

function createScene(canvas) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
  if (!gl) return null;
  const sh = (type, src) => {
    const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o));
    return o;
  };
  // в части мобильных GPU нет highp во фрагментном шейдере
  const hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
  const src = hp && hp.precision > 0 ? FRAG : FRAG.replace('precision highp float;', 'precision mediump float;');
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, src));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = ['uRes', 'uTime', 'uPass', 'uMouse'].reduce((o, n) => (o[n] = gl.getUniformLocation(pr, n), o), {});
  let quality = 1;                       // доля от полного разрешения, её крутит адаптация
  const resize = () => {
    const k = Math.min(devicePixelRatio || 1, 1.5) * quality;
    canvas.width = Math.max(2, Math.round(canvas.clientWidth * k));
    canvas.height = Math.max(2, Math.round(canvas.clientHeight * k));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  return {
    resize,
    get quality() { return quality; },
    set quality(q) { quality = q; resize(); },
    draw(time, pass, m) {
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uTime, time);
      gl.uniform1f(U.uPass, pass);
      gl.uniform2f(U.uMouse, m[0], m[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}

export function initViewport(reduced) {
  const root = document.querySelector('[data-viewport]');
  if (!root) return;
  const $ = s => root.querySelector(s);
  const frameEl = $('[data-frame]'), glCanvas = $('[data-gl]');
  const status = document.querySelector('[data-status]');
  const statusText = document.querySelector('[data-status-text]');
  const statusPct = document.querySelector('[data-status-pct]');
  const statusBar = document.querySelector('[data-status-bar]');
  const hud = { samples: $('[data-samples]'), time: $('[data-time]'), res: $('[data-res]'), pass: $('[data-pass-name]'), xy: $('[data-xy]') };

  let scene = null;
  try { scene = createScene(glCanvas); } catch (e) { console.warn('WebGL off:', e); }
  if (!scene) document.documentElement.classList.add('no-gl');

  const NAMES = ['Beauty', 'Normals', 'Depth', 'Wire'];
  let pass = 0, renderStart = performance.now();
  const showRes = () => { hud.res.textContent = scene ? `${glCanvas.width} × ${glCanvas.height}` : 'no WebGL'; };
  showRes();

  // прогресс бакетов → статус в шапке и счётчики под окном
  const progress = p => {
    statusPct.textContent = Math.round(p * 100) + '%';
    statusBar.style.transform = `scaleX(${p})`;
    hud.samples.textContent = Math.round(p * 128);
    if (p < 1) hud.time.textContent = ((performance.now() - renderStart) / 1000).toFixed(2);
    status.classList.toggle('is-done', p >= 1);
    statusText.textContent = p >= 1 ? 'Rendered' : 'Rendering';
  };
  const tiles = createBuckets($('[data-tiles]'));
  const render = ms => {
    renderStart = performance.now();
    if (reduced || !scene) { tiles.finish(); progress(1); } else tiles.run(ms, { tick: progress });
  };
  tiles.cover();

  function setPass(i) {
    if (i === pass) return;
    pass = i;
    root.querySelectorAll('[data-pass]').forEach(b => {
      const on = Number(b.dataset.pass) === i;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', on);
    });
    hud.pass.textContent = NAMES[i];
    if (reduced) drawStill();
    render(650);                         // перерендер прохода быстрее первого
  }
  root.querySelectorAll('[data-pass]').forEach(b => b.addEventListener('click', () => setPass(Number(b.dataset.pass))));

  // клавиши 1–4, пока окно видно и фокус не в поле ввода
  let inView = true;
  addEventListener('keydown', e => {
    if (!inView || e.metaKey || e.ctrlKey || e.altKey || /input|textarea/i.test(e.target.tagName)) return;
    const i = '1234'.indexOf(e.key);
    if (i >= 0) setPass(i);
  });

  // камера за курсором; координаты курсора в кадре — в углу окна
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' && !e.pressure) return;
    const r = frameEl.getBoundingClientRect();
    mouse.tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
    mouse.ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
    if (e.target.closest?.('[data-frame]')) hud.xy.textContent = `x ${mouse.tx.toFixed(2)} · y ${(-mouse.ty).toFixed(2)}`;
  }, { passive: true });

  const t0 = performance.now();
  const drawStill = () => { scene?.draw(2.2, pass, [0.18, -0.12]); };

  let raf = 0, last = 0, ema = 16, lastTune = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = last ? now - last : 16; last = now;
    ema += (Math.min(dt, 100) - ema) * 0.08;
    // адаптация разрешения: медленно — меньше пикселей, быстро — возвращаем
    if (now - lastTune > 1500 && scene) {
      if (ema > 24 && scene.quality > 0.5) { scene.quality = Math.max(0.5, scene.quality * 0.85); showRes(); lastTune = now; }
      else if (ema < 13 && scene.quality < 1) { scene.quality = Math.min(1, scene.quality * 1.1); showRes(); lastTune = now; }
    }
    mouse.x += (mouse.tx - mouse.x) * 0.06; mouse.y += (mouse.ty - mouse.y) * 0.06;
    scene?.draw((now - t0) / 1000, pass, [mouse.x, -mouse.y]);
  }
  const play = () => { if (!raf && scene && !reduced) { last = 0; raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  new IntersectionObserver(([e]) => { inView = e.isIntersecting; inView && !document.hidden ? play() : stop(); }).observe(frameEl);
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : inView && play(); });
  addEventListener('resize', () => { scene?.resize(); showRes(); if (reduced) drawStill(); tiles.finish(); });

  // первый рендер — когда шрифты и раскладка встали
  if (reduced) drawStill();
  setTimeout(() => render(1500), reduced ? 0 : 350);
}
