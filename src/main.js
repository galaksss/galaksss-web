import './style.css';
import { initMotion, REDUCED } from './motion.js';
import { initReel } from './reel.js';
import { initCase } from './case.js';
import { buildSections, initSections } from './sections.js';

// Начальные состояния анимаций живут под .js — без скрипта контент виден
document.documentElement.classList.add('js');

const built = buildSections();   // сначала разметка (окна карточек), потом движение
initMotion();
initReel();
initCase();
initSections(REDUCED, built);
