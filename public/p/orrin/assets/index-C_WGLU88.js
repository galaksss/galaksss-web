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
uniform float uSpin;
uniform float uExplode;
uniform vec3 uBody;
uniform vec3 uLight;
uniform float uPulse;
uniform float uDist;
uniform float uLift;
uniform float uShift;
uniform vec2 uMouse;

mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
// цилиндр со скруглёнными рёбрами (радиус r, полувысота h, скругление rb)
float sdCyl(vec3 p, float r, float h, float rb){
  vec2 d = vec2(length(p.xz) - r + rb, abs(p.y) - h + rb);
  return min(max(d.x, d.y), 0.) + length(max(d, 0.)) - rb;
}
float sdTorus(vec3 p, float R, float r){ vec2 q = vec2(length(p.xz) - R, p.y); return length(q) - r; }

vec3 obj(vec3 p){ p.xz = rot(uSpin) * p.xz; return p; }

float ringD(vec3 p){ return sdTorus(obj(p) - vec3(0., .615 + uExplode * .62, 0.), .5, .02); }

// x — расстояние, y — материал: 1 корпус, 2 стекло, 3 кольцо, 4 динамик, 5 подставка
vec2 map(vec3 p){
  vec3 q = obj(p);
  float e = uExplode;
  // скругление рёбер .035: половины корпуса сходятся тонким швом, а не как два барабана
  vec2 r = vec2(sdCyl(q - vec3(0., .275 + e * .34, 0.), .55, .325, .035), 1.);
  float d = sdCyl(q - vec3(0., -.375 - e * .34, 0.), .55, .325, .035);
  if (d < r.x) r = vec2(d, 1.);
  d = sdCyl(q - vec3(0., .69 + e * .95, 0.), .5, .06, .05);
  if (d < r.x) r = vec2(d, 2.);
  d = ringD(p);
  if (d < r.x) r = vec2(d, 3.);
  vec3 c = q - vec3(0., -.05, 0.);
  d = min(sdCyl(c, .43, .045, .02), length(c - vec3(0., .03, 0.)) - .15);
  if (d < r.x) r = vec2(d, 4.);
  d = sdCyl(q - vec3(0., -.745 - e * .62, 0.), .5, .03, .02);
  if (d < r.x) r = vec2(d, 5.);
  return r;
}

vec3 normal(vec3 p){
  vec2 k = vec2(.0015, 0.);
  return normalize(vec3(map(p + k.xyy).x - map(p - k.xyy).x, map(p + k.yxy).x - map(p - k.yxy).x, map(p + k.yyx).x - map(p - k.yyx).x));
}

// студийный фон: тёмный градиент и мягкое пятно света за предметом
vec3 studio(vec3 rd){
  vec3 c = mix(vec3(.018, .02, .03), vec3(.05, .055, .08), smoothstep(-.4, .6, rd.y));
  c += vec3(.06, .065, .1) * exp(-pow(length(rd.xy - vec2(0., .08)) * 2.2, 2.));
  return c;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - .5 * uRes) / uRes.y;
  uv.x -= uShift;                                   // колонку — в свободную от текста сторону
  float e = uExplode;
  vec3 ro = vec3(uMouse.x * .25, .32 + uLift + uMouse.y * .12, uDist);
  vec3 ta = vec3(0., .02 + e * .16, 0.);            // в разобранном виде крышка уходит вверх — целимся выше
  vec3 fw = normalize(ta - ro), rt = normalize(cross(fw, vec3(0., 1., 0.))), up = cross(rt, fw);
  vec3 rd = normalize(fw * 2.1 + rt * uv.x + up * uv.y);

  // марш луча; по пути запоминаем, как близко он прошёл к кольцу
  float t = 0., ringMin = 1e3;
  vec2 h = vec2(0.);
  bool hit = false;
  for (int i = 0; i < 110; i++){
    vec3 p = ro + rd * t;
    h = map(p);
    ringMin = min(ringMin, ringD(p));
    if (h.x < .0012){ hit = true; break; }
    t += h.x * .9;
    if (t > 12.) break;
  }

  float pulse = .65 + .35 * uPulse;
  vec3 L = normalize(vec3(-.55, .8, .6));          // ключевой свет — сверху слева
  vec3 col;
  float floorY = -.775 - e * .62;

  if (hit){
    vec3 p = ro + rd * t;
    vec3 n = normal(p);
    vec3 q = obj(p);
    float dif = max(dot(n, L), 0.);
    float fre = pow(1. - max(dot(n, -rd), 0.), 3.);
    vec3 refl = reflect(rd, n);
    float spec = pow(max(dot(refl, L), 0.), 40.);
    // свет кольца на соседних деталях: ближе к кольцу — сильнее
    float ringLit = exp(-max(ringD(p), 0.) * 9.) * pulse;

    if (h.y < 1.5){
      // корпус: ткань с перфорацией на боковой поверхности
      float ang = atan(q.z, q.x);
      vec2 g = vec2(ang * 30. / 6.2832 * 2., q.y * 38.);
      g.x += step(1., mod(floor(g.y), 2.)) * .5;    // ряды со сдвигом, как соты
      float dots = (1. - smoothstep(.2, .3, length(fract(g) - .5))) * (1. - smoothstep(.4, .6, abs(n.y)));
      vec3 base = uBody * (1. - dots * .45);
      col = base * (.18 + dif * .9) + vec3(1.) * spec * .12 + uBody * fre * .5 + uLight * ringLit * .35;
    } else if (h.y < 2.5){
      // стекло: почти чёрное, сильный блик и отражение студии по Френелю
      col = vec3(.012, .013, .02) + studio(refl) * (.15 + fre * 1.2) + vec3(1.) * pow(max(dot(refl, L), 0.), 90.) * .9 + uLight * ringLit * .25;
    } else if (h.y < 3.5){
      col = uLight * 2.2 * pulse;                   // кольцо светит само
    } else if (h.y < 4.5){
      // динамик: тёмный, с концентрическими кольцами подвеса
      float rr = length(q.xz);
      col = vec3(.03, .032, .04) * (.5 + dif) + vec3(.05) * spec + uLight * ringLit * .2;
      col += vec3(.04) * (1. - smoothstep(.0, .015, abs(fract(rr * 14.) - .5) - .45));
    } else {
      col = vec3(.025, .026, .034) * (.6 + dif) + vec3(.1) * spec;
    }
  } else {
    col = studio(rd);
    // пол: мягкая тень под колонкой и цветное пятно от кольца
    if (rd.y < 0.){
      float tf = (floorY - ro.y) / rd.y;
      vec3 fp = ro + rd * tf;
      float r = length(fp.xz);
      col *= .55 + .45 * smoothstep(.15, 1.1, r);
      col += uLight * exp(-r * 2.6) * .22 * pulse;
    }
  }

  // свечение кольца в воздухе
  col += uLight * exp(-ringMin * 16.) * .32 * pulse;

  col = col / (1. + col * .55);                     // мягкое плечо светов
  col *= 1. - .35 * dot(uv * .9, uv * .9);          // виньетка
  gl_FragColor = vec4(pow(col, vec3(.92)), 1.);
}`;function n(n){let r=n.getContext(`webgl`,{antialias:!1,powerPreference:`high-performance`});if(!r)return null;let i=(e,t)=>{let n=r.createShader(e);if(r.shaderSource(n,t),r.compileShader(n),!r.getShaderParameter(n,r.COMPILE_STATUS))throw Error(r.getShaderInfoLog(n));return n},a=r.createProgram();r.attachShader(a,i(r.VERTEX_SHADER,e)),r.attachShader(a,i(r.FRAGMENT_SHADER,t)),r.linkProgram(a),r.useProgram(a);let o=r.createBuffer();r.bindBuffer(r.ARRAY_BUFFER,o),r.bufferData(r.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),r.STATIC_DRAW);let s=r.getAttribLocation(a,`p`);r.enableVertexAttribArray(s),r.vertexAttribPointer(s,2,r.FLOAT,!1,0,0);let c={};[`uRes`,`uTime`,`uSpin`,`uExplode`,`uBody`,`uLight`,`uPulse`,`uDist`,`uLift`,`uShift`,`uMouse`].forEach(e=>{c[e]=r.getUniformLocation(a,e)});let l=()=>{let e=Math.min(devicePixelRatio||1,1.5)*.7;n.width=Math.round(n.clientWidth*e),n.height=Math.round(n.clientHeight*e),r.viewport(0,0,n.width,n.height)};return l(),{resize:l,draw(e){r.uniform2f(c.uRes,n.width,n.height),r.uniform1f(c.uTime,e.time),r.uniform1f(c.uSpin,e.spin),r.uniform1f(c.uExplode,e.explode),r.uniform3fv(c.uBody,e.body),r.uniform3fv(c.uLight,e.light),r.uniform1f(c.uPulse,e.pulse),r.uniform1f(c.uDist,e.dist),r.uniform1f(c.uLift,e.lift),r.uniform1f(c.uShift,e.shift),r.uniform2f(c.uMouse,e.mouse[0],e.mouse[1]),r.drawArrays(r.TRIANGLES,0,3)}}}var r=matchMedia(`(prefers-reduced-motion: reduce)`).matches,i=document.querySelector(`[data-story]`),a=document.querySelector(`[data-gl]`),o=[...document.querySelectorAll(`[data-at]`)],s=document.querySelector(`[data-hint]`),c=e=>[1,3,5].map(t=>parseInt(e.slice(t,t+2),16)/255),l=[`#1C2436`,`#C9D3E6`,`#5A4BD0`].map(c),u=[`#BFD5FF`,`#5A93FF`,`#A57BFF`].map(c),d=[[0,0,4.7,.05,.42],[.25,0,3.7,.3,.4],[.5,1,7.8,.2,-.4],[.73,0,4.2,-.12,.4],[.94,0,4.5,.08,-.4],[1,0,4.5,.08,-.4]],f=e=>e*e*(3-2*e),p=(e,t,n)=>e+(t-e)*n,m=(e,t,n)=>e.map((e,r)=>p(e,t[r],n));function h(e){for(let t=1;t<d.length;t++)if(e<=d[t][0]){let n=d[t-1],r=d[t],i=f((e-n[0])/(r[0]-n[0]));return[p(n[1],r[1],i),p(n[2],r[2],i),p(n[3],r[3],i),p(n[4],r[4],i)]}return d[d.length-1].slice(1)}var g=(e,t,n=.1)=>Math.max(0,1-Math.abs(e-t)/n),_=()=>{let e=i.getBoundingClientRect(),t=e.height-innerHeight;return t>0?Math.min(1,Math.max(0,-e.top/t)):0},v=null;try{v=n(a)}catch(e){console.warn(`WebGL failed`,e)}v||document.documentElement.classList.add(`no-gl`);var y=null,b=[...document.querySelectorAll(`[data-fin]`)],x=e=>b.forEach((t,n)=>{t.classList.toggle(`is-on`,n===e),t.setAttribute(`aria-checked`,n===e)});b.forEach((e,t)=>e.addEventListener(`click`,()=>{y=t,x(t)}));var S={x:0,y:0,tx:0,ty:0};addEventListener(`pointermove`,e=>{S.tx=(e.clientX/innerWidth-.5)*2,S.ty=(e.clientY/innerHeight-.5)*2},{passive:!0});var C={e:0,dist:4.7,lift:.05,shift:.42,body:l[0],light:u[0]},w=0,T=!0,E=0,D=performance.now();function O(e){let t=r?0:Math.max(0,(e-D)/1e3),n=_(),[i,a,c,d]=h(n),b=r?1:.07;C.e=p(C.e,i,b),C.dist=p(C.dist,a,b),C.lift=p(C.lift,c,b),C.shift=p(C.shift,innerWidth<760?0:d,b);let k=g(n,.73,.12),A=t*.35%3,j=Math.floor(A),M=m(u[j],u[(j+1)%3],f(A-j));C.light=m(C.light,m(u[0],M,k),b);let N=n<.86?0:Math.min(2,Math.floor((n-.86)/.045)),P=y??N;P!==w&&y===null&&(w=P,x(P)),C.body=m(C.body,l[P],r?1:.06);let F=(.5+.5*Math.sin(t*Math.PI*2*1.9))**3,I=p(.5+.5*Math.sin(t*1.2),F,g(n,.25,.12));S.x=p(S.x,S.tx,.05),S.y=p(S.y,S.ty,.05),v?.draw({time:t,spin:t*.22+n*Math.PI*1.2,explode:C.e,body:C.body,light:C.light,pulse:I,dist:C.dist,lift:C.lift,shift:C.shift,mouse:[S.x,S.y]});for(let e of o){let t=Number(e.dataset.at),r=n-t,i=t===0?1-f(Math.min(1,Math.max(0,(n-.03)/.07))):g(n,t,.09)>.45?1:g(n,t,.09)/.45;e.style.opacity=i.toFixed(3),e.style.transform=`translate3d(0,${(-r*220).toFixed(1)}px,0)`,e.style.visibility=i<.01?`hidden`:`visible`}s.style.opacity=+(n<.02),T&&(E=requestAnimationFrame(O))}new IntersectionObserver(([e])=>{T=e.isIntersecting,cancelAnimationFrame(E),T&&(E=requestAnimationFrame(O))}).observe(i),addEventListener(`resize`,()=>v?.resize()),requestAnimationFrame(O);