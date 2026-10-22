import './style.css';
import { initAnimations } from './animations.js';
import { initPlayhead } from './playhead.js';
import { initSheet } from './sheet.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

initAnimations(reduced);
initPlayhead({ reduced });
initSheet(reduced);
