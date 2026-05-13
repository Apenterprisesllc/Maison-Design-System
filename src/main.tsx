import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { App } from './App';
import './styles/index.css';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

gsap.defaults({
  ease: 'cubic-bezier(0.2, 0.6, 0.2, 1)',
  duration: 0.6,
});

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element in index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
