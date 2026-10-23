import './style.css';
import { initViewport } from './viewport.js';
import { initCase } from './case.js';
import { initSections } from './sections.js';

// Начальные состояния анимаций живут под .js — без скрипта контент виден
document.documentElement.classList.add('js');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

initViewport(reduced);
initCase(reduced);
initSections(reduced);

requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('is-ready')));
