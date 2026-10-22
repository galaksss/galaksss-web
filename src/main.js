import './style.css';
import { initHero } from './hero.js';
import { initPrompt } from './prompt.js';
import { initStory } from './story.js';
import { initReveal } from './reveal.js';
import { initCurve } from './curve.js';

/* Класс .js включает начальные «спрятанные» состояния в CSS. Ставим его
   первым делом: если скрипт не загрузится, всё на странице просто видно. */
document.documentElement.classList.add('js');

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

initHero(reduced);
initPrompt(reduced);
initStory();
initReveal(reduced);
initCurve(reduced);
