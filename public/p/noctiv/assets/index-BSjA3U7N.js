(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=Math.PI*2;function t(e){let t=e>>>0;return()=>(t=t*1664525+1013904223>>>0)/4294967296}var n=t=>Math.sqrt(-2*Math.log(t()+1e-9))*Math.cos(e*t());function r(e,t,n){let r=Math.PI*(3-Math.sqrt(5));for(let i=0;i<e;i++){let a=1-i/(e-1)*2,o=Math.sqrt(1-a*a),s=r*i,c=1.55+(t()-.5)*.06;n.set([Math.cos(s)*o*c,a*c,Math.sin(s)*o*c],i*3)}}function i(e,t,n){let r=Math.ceil(Math.sqrt(e));for(let i=0;i<e;i++){let e=(i%r/r-.5)*7.5+(t()-.5)*.02,a=(Math.floor(i/r)/r-.5)*5+(t()-.5)*.02;n.set([e,-.6,a],i*3)}}function a(e,t,r,i,a){let o=document.createElement(`canvas`);o.width=1200,o.height=300;let s=o.getContext(`2d`);s.fillStyle=`#fff`;let c=230;s.font=`600 ${c}px ${a}`;let l=s.measureText(i).width;l>1120&&(c=Math.floor(c*1120/l),s.font=`600 ${c}px ${a}`),s.textAlign=`center`,s.textBaseline=`middle`,s.fillText(i,600,155);let u=s.getImageData(0,0,o.width,o.height).data,d=[];for(let e=0;e<o.height;e+=2)for(let t=0;t<o.width;t+=2)u[(e*o.width+t)*4+3]>128&&d.push(t,e);let f=d.length/2||1;for(let i=0;i<e;i++){let e=Math.floor(t()*f)*2;r.set([(d[e]/o.width-.5)*7.2+(t()-.5)*.01,-(d[e+1]/o.height-.5)*1.8,n(t)*.08],i*3)}}function o(t,r,i){for(let a=0;a<t;a++){let t=r()*e,o=r()*e,s=Math.sqrt(r())*.22,c=1.25+.5*Math.cos(3*t),l=c*Math.cos(2*t),u=c*Math.sin(2*t),d=.6*Math.sin(3*t);i.set([l+Math.cos(o)*s,u+Math.sin(o)*s,d+n(r)*.08],a*3)}}function s(t,r,i){for(let a=0;a<t;a++){let t=r()**.7*3.6,o=Math.floor(r()*3),s=t*1.35+o*e/3+n(r)*.22/(t+.4);i.set([Math.cos(s)*t,n(r)*.08*(1.2-t/4),Math.sin(s)*t],a*3)}}function c(e,n){let c=t(7),l=Array.from({length:5},()=>new Float32Array(e*3));r(e,c,l[0]),i(e,c,l[1]),a(e,c,l[2],`NOCTIV`,n),o(e,c,l[3]),s(e,c,l[4]);let u=new Float32Array(e);for(let t=0;t<e;t++)u[t]=c();return{shapes:l,seed:u}}var l=`
attribute vec3 a0;
attribute vec3 a1;
attribute vec3 a2;
attribute vec3 a3;
attribute vec3 a4;
attribute float aSeed;
uniform float uStage;
uniform float uTime;
uniform float uAspect;
uniform float uSize;
uniform vec2 uRot;
uniform vec2 uShift;
varying float vSeed;
varying float vDepth;

float w(float i){ return clamp(1. - abs(uStage - i), 0., 1.); }
vec3 h3(float s){ return fract(sin(vec3(s * 127.1, s * 311.7, s * 74.7)) * 43758.5453) - .5; }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

void main(){
  vec3 p = a0 * w(0.) + a1 * w(1.) + a2 * w(2.) + a3 * w(3.) + a4 * w(4.);

  // волновое поле дышит, сфера пульсирует, галактика вращается
  float wf = w(1.);
  p.y += wf * (sin(p.x * 1.3 + uTime * .9) * .32 + sin(p.z * 1.9 - uTime * .7) * .18 + sin((p.x + p.z) * .6 + uTime * .5) * .25);
  p *= 1. + w(0.) * sin(uTime * 1.1 + aSeed * 6.283) * .015;
  p.xz = rot(w(4.) * uTime * .06) * p.xz;

  // переход: разлёт и закрутка, сильнее всего посередине между формами
  float tr = sin(fract(uStage) * 3.14159);
  vec3 j = h3(aSeed * 91.7);
  p += j * tr * 1.3;
  p.xz = rot(tr * j.x * 1.6) * p.xz;

  // общий поворот сцены
  p.xz = rot(uRot.x) * p.xz;
  p.yz = rot(uRot.y) * p.yz;

  // сдвиг формы в свободную от текста сторону экрана
  p.xy += uShift;

  // камера на z = +7 смотрит в −z; z клипа — 0, глубину не используем
  vec3 v = p - vec3(0., 0., 7.);
  float f = 1.9;
  gl_Position = vec4(v.x * f / uAspect, v.y * f, 0., -v.z);
  gl_PointSize = uSize * (.55 + aSeed * .9) * 7. / max(.5, -v.z);
  vSeed = aSeed;
  vDepth = clamp((-v.z - 4.) / 6., 0., 1.);
}`,u=`
precision mediump float;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
uniform float uGain;
varying float vSeed;
varying float vDepth;
void main(){
  float d = length(gl_PointCoord - .5);
  float a = 1. - smoothstep(0., .5, d);      // мягкая круглая точка
  a *= a;
  vec3 col = mix(uA, uB, vSeed);
  col = mix(col, uC, step(.95, vSeed));      // редкие яркие искры
  col *= 1.25 - vDepth * .8;                 // дальние тусклее
  gl_FragColor = vec4(col * a * uGain, 1.);
}`;function d(e,t){let n=e.getContext(`webgl`,{antialias:!1,alpha:!1,powerPreference:`high-performance`});if(!n)return null;let r=(e,t)=>{let r=n.createShader(e);if(n.shaderSource(r,t),n.compileShader(r),!n.getShaderParameter(r,n.COMPILE_STATUS))throw Error(n.getShaderInfoLog(r));return r},i=n.createProgram();if(n.attachShader(i,r(n.VERTEX_SHADER,l)),n.attachShader(i,r(n.FRAGMENT_SHADER,u)),n.linkProgram(i),!n.getProgramParameter(i,n.LINK_STATUS))throw Error(n.getProgramInfoLog(i));n.useProgram(i);let a=(e,t,r)=>{let a=n.createBuffer();n.bindBuffer(n.ARRAY_BUFFER,a),n.bufferData(n.ARRAY_BUFFER,t,n.STATIC_DRAW);let o=n.getAttribLocation(i,e);n.enableVertexAttribArray(o),n.vertexAttribPointer(o,r,n.FLOAT,!1,0,0)};t.shapes.forEach((e,t)=>a(`a`+t,e,3)),a(`aSeed`,t.seed,1);let o=t.seed.length,s={};[`uStage`,`uTime`,`uAspect`,`uSize`,`uRot`,`uShift`,`uA`,`uB`,`uC`,`uGain`].forEach(e=>{s[e]=n.getUniformLocation(i,e)}),n.disable(n.DEPTH_TEST),n.enable(n.BLEND),n.blendFunc(n.ONE,n.ONE),n.clearColor(.012,.012,.035,1);let c=1,d=()=>{c=Math.min(devicePixelRatio||1,1.75),e.width=Math.round(e.clientWidth*c),e.height=Math.round(e.clientHeight*c),n.viewport(0,0,e.width,e.height)};return d(),{count:o,resize:d,draw({stage:t,time:r,rot:i,shift:a,colors:c,gain:l}){n.clear(n.COLOR_BUFFER_BIT),n.uniform1f(s.uStage,t),n.uniform1f(s.uTime,r),n.uniform1f(s.uAspect,e.width/e.height),n.uniform1f(s.uSize,Math.max(1.3,e.height/520)*1.35),n.uniform2f(s.uRot,i[0],i[1]),n.uniform2f(s.uShift,a[0],a[1]),n.uniform3fv(s.uA,c[0]),n.uniform3fv(s.uB,c[1]),n.uniform3fv(s.uC,c[2]),n.uniform1f(s.uGain,l),n.drawArrays(n.POINTS,0,o)}}}var f=matchMedia(`(prefers-reduced-motion: reduce)`).matches,p=document.querySelector(`[data-gl]`),m=[...document.querySelectorAll(`[data-chapter]`)],h=[.18,.62,0,.3,.9],g=e=>[1,3,5].map(t=>parseInt(e.slice(t,t+2),16)/255),_=[[`#3D5AFE`,`#8E5CFF`,`#FFFFFF`],[`#2E7BFF`,`#6A4CFF`,`#9FE8FF`],[`#9DB4FF`,`#C9A8FF`,`#FFFFFF`],[`#7A5CFF`,`#FF5CC8`,`#FFFFFF`],[`#3D5AFE`,`#FF7AD9`,`#FFF4E0`]].map(e=>e.map(g)),v=[.62,.5,.42,.55,.6],y=[[2.6,-.05],[.3,0],[0,.45],[-2.05,0],[1.9,.1]],b=[[0,.9],[0,.7],[0,.6],[0,.7],[0,.7]],x=(e,t,n)=>e+(t-e)*n,S=e=>e*e*(3-2*e);function C(e,t){let n=Math.min(e.length-1,Math.floor(t)),r=Math.min(e.length-1,n+1),i=t-n;return Array.isArray(e[0])?Array.isArray(e[0][0])?e[n].map((t,n)=>t.map((t,a)=>x(t,e[r][n][a],i))):e[n].map((t,n)=>x(t,e[r][n],i)):x(e[n],e[r],i)}function w(){let e=innerHeight/2,t=m.map(t=>{let n=t.getBoundingClientRect();return n.top+n.height/2-e});if(t[0]>=0)return 0;for(let e=0;e<t.length-1;e++)if(t[e+1]>=0){let n=-t[e]/(t[e+1]-t[e]);return e+S(Math.min(1,Math.max(0,(n-.2)/.6)))}return m.length-1}var T={x:0,y:0,tx:0,ty:0};addEventListener(`pointermove`,e=>{T.tx=(e.clientX/innerWidth-.5)*2,T.ty=(e.clientY/innerHeight-.5)*2},{passive:!0});async function E(){await Promise.race([document.fonts.load(`600 230px Geist`),new Promise(e=>setTimeout(e,1500))]);let e=innerWidth<760?26e3:6e4,t=null;try{t=d(p,c(e,`Geist, sans-serif`))}catch(e){console.warn(`WebGL failed`,e)}if(!t){document.documentElement.classList.add(`no-gl`);return}document.querySelector(`[data-count]`).textContent=e.toLocaleString(`en-US`),document.documentElement.classList.add(`gl-ready`);let n=w(),r=performance.now(),i=e=>{let a=f?0:(e-r)/1e3;n=f?w():x(n,w(),.07),T.x=x(T.x,T.tx,.05),T.y=x(T.y,T.ty,.05);let o=Math.max(0,1-Math.abs(n-2)),s=(1-o)*Math.sin(a*.15)*.55;t.draw({stage:n,time:a,rot:[s+T.x*.25*(1-o*.7),C(h,n)+T.y*.12],shift:C(innerWidth<760?b:y,n),colors:C(_,n),gain:C(v,n)}),requestAnimationFrame(i)};requestAnimationFrame(i),addEventListener(`resize`,()=>t.resize())}E();var D=new IntersectionObserver(e=>e.forEach(e=>e.target.classList.toggle(`is-in`,e.isIntersecting)),{rootMargin:`-30% 0px -30% 0px`});document.querySelectorAll(`[data-chapter], .outro`).forEach(e=>D.observe(e));