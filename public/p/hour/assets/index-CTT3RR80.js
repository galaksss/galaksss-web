(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`
attribute vec2 p;
void main(){ gl_Position = vec4(p, 0., 1.); }`,t=`
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform float uDay;
uniform vec2 uMouse;

const float PI = 3.14159265;
const float LAKE = .34;          // линия воды, доля высоты

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float n1(float x){ float i = floor(x), f = fract(x); return mix(hash(vec2(i, 1.)), hash(vec2(i + 1., 1.)), f * f * (3. - 2. * f)); }
float fbm(float x){ float v = 0., a = .5; for (int i = 0; i < 5; i++){ v += a * n1(x); x *= 2.07; a *= .5; } return v; }

// значение по ключевым точкам суток
vec3 key(float t, vec3 a, vec3 b, vec3 c, vec3 d, vec3 e, vec3 f){
  if (t < .18) return mix(a, b, smoothstep(0., .18, t));
  if (t < .42) return mix(b, c, smoothstep(.18, .42, t));
  if (t < .68) return mix(c, d, smoothstep(.42, .68, t));
  if (t < .84) return mix(d, e, smoothstep(.68, .84, t));
  return mix(e, f, smoothstep(.84, 1., t));
}
float keyf(float t, float a, float b, float c, float d, float e, float f){
  return key(t, vec3(a), vec3(b), vec3(c), vec3(d), vec3(e), vec3(f)).x;
}

// высота солнца: встаёт в .10, в зените в .45, садится в .80 — до синего часа
float sunH(float t){ return sin(PI * clamp((t - .10) / .70, -.15, 1.15)); }

// refl = 1 для отражения в воде: диск солнца там приглушаем, остаётся свечение
vec3 scene(vec2 uv, float aspect, float t, float refl){
  vec3 top = key(t, vec3(.02,.025,.06), vec3(.17,.22,.40), vec3(.20,.45,.82), vec3(.26,.32,.58), vec3(.06,.10,.27), vec3(.012,.016,.05));
  vec3 hor = key(t, vec3(.06,.08,.18), vec3(.95,.62,.48), vec3(.74,.88,1.), vec3(1.,.66,.34), vec3(.30,.37,.66), vec3(.04,.06,.16));
  vec3 sunC = key(t, vec3(0.), vec3(1.,.78,.62), vec3(1.,1.,.94), vec3(1.,.80,.50), vec3(.55,.60,.9), vec3(0.));
  vec3 lit = key(t, vec3(.10,.13,.24), vec3(.80,.62,.60), vec3(1.), vec3(1.,.74,.48), vec3(.38,.45,.78), vec3(.07,.09,.19));

  float h = uv.y - LAKE;                                 // высота над водой
  vec3 col = mix(hor, top, pow(clamp(h / (1. - LAKE), 0., 1.), .55));

  // солнце идёт по дуге слева направо
  float e = sunH(t);
  vec2 sun = vec2(mix(-.75, .75, clamp((t - .10) / .70, 0., 1.)) * aspect * .5, LAKE + .06 + e * .5);
  float d = length(uv - sun);
  float vis = smoothstep(-.05, .05, e);
  col += sunC * (exp(-d * 7.) * .55 + exp(-d * 28.) * .5) * vis;
  col = mix(col, sunC * 1.6, (1. - smoothstep(.028, .034, d)) * vis * (1. - refl * .7));   // smoothstep только с a < b

  // звёзды — только когда солнце глубоко под горизонтом
  float night = 1. - smoothstep(-.25, .05, e);
  // звезда — мягкая точка в случайном месте своей клетки, а не квадрат клетки
  vec2 cell = uv * 160.;                        // uv уже с поправкой на пропорции
  vec2 g = floor(cell);
  float s = hash(g);
  vec2 at = vec2(hash(g + 7.1), hash(g + 3.7)) * .6 + .2;
  float star = (1. - smoothstep(0., .16 + s * .1, length(fract(cell) - at))) * step(.985, s);
  float tw = .6 + .4 * sin(uTime * 2. + s * 40.);
  col += vec3(.9, .92, 1.) * star * tw * night * smoothstep(.0, .25, h) * (1. - refl * .5);

  // три гряды: дальняя светлее и в дымке, ближняя тёмная; мышь даёт параллакс
  for (int i = 0; i < 3; i++){
    float fi = float(i);
    float x = uv.x * (1.4 + fi * .9) + fi * 7.3 + uMouse.x * (.03 + fi * .05);
    // pow делает вершины острее, а долины шире — горы, а не холмы
    float ridge = .02 + (.30 - fi * .08) * pow(fbm(x), 1.6) + fi * .012;
    if (h < ridge){
      float haze = .78 - fi * .32;                       // дальняя почти тонет в небе
      // объём: к гребню светлее, к подножию темнее, плюс мелкая фактура осыпей
      float up = smoothstep(0., ridge, h);
      float grit = n1(x * 38. + h * 90.) * .5 + n1(x * 9. - h * 20.) * .5;
      vec3 rock = lit * (.16 - fi * .05) * (.55 + .55 * up) * (.85 + .3 * grit) + vec3(.01, .012, .02);
      // освещённый край гряды со стороны солнца
      float rim = smoothstep(ridge - .012, ridge, h) * vis * .35;
      col = mix(rock, hor, haze) + sunC * rim * (.4 - fi * .12);
    }
  }
  return col;
}

void main(){
  float aspect = uRes.x / uRes.y;
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = vec2((uv.x - .5) * aspect, uv.y);
  float t = clamp(uDay, 0., 1.);

  vec3 col;
  if (uv.y > LAKE) col = scene(p, aspect, t, 0.);
  else {
    // отражение: зеркалим по линии воды, рябь сильнее у берега
    float depth = LAKE - uv.y;
    vec2 q = vec2(p.x + sin(uv.y * 160. + uTime * 1.4) * .004 * (depth * 6. + .3), LAKE + depth * 1.15);
    col = scene(q, aspect, t, 1.) * .62;
    vec3 water = key(t, vec3(.02,.03,.07), vec3(.25,.18,.2), vec3(.1,.22,.35), vec3(.22,.14,.1), vec3(.05,.08,.18), vec3(.01,.015,.04));
    col = mix(col, water, .35 + depth * .9);
    col += vec3(.9) * (1. - smoothstep(0., .0035, abs(depth - .002))) * .06;   // блик на кромке
  }

  /* ----- ГРЕЙД: у каждого часа свой лук ----- */
  float sat = keyf(t, .75, .92, 1.02, 1.12, .82, .7);
  float con = keyf(t, 1.08, 1.0, 1.06, 1.1, 1.04, 1.16);
  vec3 shTint = key(t, vec3(.0,.02,.08), vec3(.08,.02,.06), vec3(0.), vec3(-.03,.05,.08), vec3(-.02,.0,.09), vec3(-.01,.0,.06));
  vec3 hiTint = key(t, vec3(0.), vec3(.06,.02,-.02), vec3(.0,.0,-.01), vec3(.09,.03,-.06), vec3(-.04,.0,.06), vec3(0.));
  float lum = dot(col, vec3(.2126, .7152, .0722));
  col = mix(vec3(lum), col, sat);
  col += shTint * (1. - smoothstep(0., .45, lum)) + hiTint * smoothstep(.35, 1., lum);
  col = (col - .5) * con + .5;
  col = col / (1. + col * .12);                           // мягкое плечо светов
  col *= 1. - .42 * pow(length((uv - .5) * vec2(1., .9)), 2.2);   // виньетка
  col += (hash(gl_FragCoord.xy + fract(uTime) * 91.) - .5) * .028;   // зерно
  gl_FragColor = vec4(clamp(col, 0., 1.), 1.);
}`;function n(n,{reduced:r=!1}={}){let i=n.getContext(`webgl`,{antialias:!1,premultipliedAlpha:!1,powerPreference:`high-performance`});if(!i)return null;let a=(e,t)=>{let n=i.createShader(e);if(i.shaderSource(n,t),i.compileShader(n),!i.getShaderParameter(n,i.COMPILE_STATUS))throw Error(i.getShaderInfoLog(n));return n},o=i.createProgram();i.attachShader(o,a(i.VERTEX_SHADER,e)),i.attachShader(o,a(i.FRAGMENT_SHADER,t)),i.linkProgram(o),i.useProgram(o);let s=i.createBuffer();i.bindBuffer(i.ARRAY_BUFFER,s),i.bufferData(i.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),i.STATIC_DRAW);let c=i.getAttribLocation(o,`p`);i.enableVertexAttribArray(c),i.vertexAttribPointer(c,2,i.FLOAT,!1,0,0);let l=e=>i.getUniformLocation(o,e),u={res:l(`uRes`),time:l(`uTime`),day:l(`uDay`),mouse:l(`uMouse`)},d=()=>{let e=Math.min(devicePixelRatio||1,1.5)*.75;n.width=Math.round(n.clientWidth*e),n.height=Math.round(n.clientHeight*e),i.viewport(0,0,n.width,n.height)};d();let f=performance.now();return{resize:d,draw({day:e,mouse:t=[0,0]}){i.uniform2f(u.res,n.width,n.height),i.uniform1f(u.time,r?0:(performance.now()-f)/1e3),i.uniform1f(u.day,e),i.uniform2f(u.mouse,t[0],t[1]),i.drawArrays(i.TRIANGLES,0,3)}}}var r=matchMedia(`(prefers-reduced-motion: reduce)`).matches,i=document.querySelector(`[data-story]`),a=document.querySelector(`[data-gl]`),o=[...document.querySelectorAll(`[data-ch]`)],s=document.querySelector(`[data-clock]`),c=document.querySelector(`[data-day-bar]`),l=null;try{l=n(a,{reduced:r})}catch(e){console.warn(`WebGL scene failed`,e)}l||document.documentElement.classList.add(`no-gl`);var u=e=>.02+e*.96,d=[[0,280],[.1,370],[.18,410],[.42,750],[.68,1125],[.8,1180],[.84,1205],[1,1420]];function f(e){for(let t=1;t<d.length;t++){let[n,r]=d[t],[i,a]=d[t-1];if(e<=n)return a+(r-a)*((e-i)/(n-i))}return d[d.length-1][1]}var p=e=>`${String(Math.floor(e/60)%24).padStart(2,`0`)}:${String(Math.floor(e%60)).padStart(2,`0`)}`,m=()=>{let e=i.getBoundingClientRect(),t=e.height-innerHeight;return t>0?Math.min(1,Math.max(0,-e.top/t)):0},h={x:0,y:0,tx:0,ty:0};addEventListener(`pointermove`,e=>{h.tx=(e.clientX/innerWidth-.5)*2,h.ty=(e.clientY/innerHeight-.5)*2},{passive:!0});var g=u(m()),_=!0,v=0;function y(){let e=m(),t=u(e);g=r?t:g+(t-g)*.08,h.x+=(h.tx-h.x)*.05,h.y+=(h.ty-h.y)*.05,l?.draw({day:g,mouse:[h.x,h.y]}),l||document.documentElement.style.setProperty(`--day`,g.toFixed(3)),s.textContent=p(f(g)),c.style.transform=`scaleX(${e.toFixed(4)})`;let n=.085;for(let t of o){let r=e-(t.dataset.ch===`intro`?0:Number(t.dataset.at)),i=t.dataset.ch===`intro`?1-b(.02,.09,e):1-b(n*.5,n,Math.abs(r));t.style.opacity=i.toFixed(3),t.style.transform=`translate3d(0,${(-r*260).toFixed(1)}px,0)`,t.style.visibility=i<.01?`hidden`:`visible`}_&&(v=requestAnimationFrame(y))}var b=(e,t,n)=>{let r=Math.min(1,Math.max(0,(n-e)/(t-e)));return r*r*(3-2*r)};new IntersectionObserver(([e])=>{_=e.isIntersecting,cancelAnimationFrame(v),_&&(v=requestAnimationFrame(y))}).observe(i),addEventListener(`resize`,()=>l?.resize()),y();