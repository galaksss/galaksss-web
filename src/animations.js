import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/*
  АНИМАЦИИ СТРАНИЦЫ
  Начальные состояния ставим здесь, а НЕ в CSS.
  Причина конкретная: браузер отдаёт вычисленный transform матрицей
  в пикселях, поэтому CSS translateY(105%) читается GSAP как
  y:130px / yPercent:0 — и tween на yPercent:0 не делает ничего.
  Заголовок так и остаётся под маской. Ставим yPercent из JS.
  См. раздел «Грабли» в CLAUDE.md.
*/
export function initAnimations(reduced) {
  if (reduced) return;

  gsap.registerPlugin(ScrollTrigger);

  gsap.set('.hero__type .mask > span', { yPercent: 108 });
  gsap.set('.rise', { opacity: 0, y: 26 });

  /* clearProps в конце каждого твина — не гигиена, а исправление видимого
     дефекта. Пока на элементе висит transform, браузер держит его на
     отдельном слое и показывает текст растрированным в масштабе анимации.
     Особенно заметно на .sec__label: он растягивается по scaleX, и после
     твина заголовок секции ещё несколько секунд оставался мыльным —
     анимация уже кончилась, а читать нельзя. GSAP оставляет единичную
     матрицу, но слой от этого не исчезает; убираем transform совсем. */
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro.to('.hero__type .mask > span', { yPercent: 0, duration: 1.35, stagger: 0.09, clearProps: 'transform' })
       .from('.hero__eyebrow, .hero__foot > *', { opacity: 0, y: 16, duration: .9, stagger: .08, clearProps: 'transform' }, '-=0.85')
       .from('.top > *', { opacity: 0, duration: .8, stagger: .1 }, '-=0.7');

  gsap.utils.toArray('.rise').forEach(el => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1.05, ease: 'expo.out',
      clearProps: 'transform',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
  });

  /* Длительность здесь = длительность мыла: пока идёт растяжение по scaleX,
     текст растрирован в чужом масштабе и не читается. Держим коротким. */
  gsap.utils.toArray('.sec__label').forEach(el => {
    gsap.from(el, {
      scaleX: 0, transformOrigin: 'left', duration: .75, ease: 'expo.out',
      clearProps: 'transform',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });
}
