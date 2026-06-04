/* ============================================================
   Router — Simple hash-based SPA routing
   ============================================================ */

import { WelcomeView } from './views/WelcomeView.js';
import { InstructionsView } from './views/InstructionsView.js';
import { TaskView } from './views/TaskView.js';
import { TransitionView } from './views/TransitionView.js';
import { CompleteView } from './views/CompleteView.js';
import { AdminView } from './views/AdminView.js';

const routes = {
  '': WelcomeView,
  'instructions': InstructionsView,
  'task/vwm-pure': (params) => TaskView('vwm-pure', params),
  'task/vwm-distractor': (params) => TaskView('vwm-distractor', params),
  'task/ant': (params) => TaskView('ant', params),
  'transition': TransitionView,
  'complete': CompleteView,
  'admin': AdminView,
};

let currentParams = {};

export function navigate(route, params = {}) {
  currentParams = params;
  window.location.hash = `#/${route}`;
}

function parseHash() {
  // Handle case where user might type localhost:3000/admin instead of /#/admin
  const path = window.location.pathname;
  if (path.includes('/admin') && !window.location.hash) {
    window.location.hash = '#/admin';
  }
  
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  return hash || '';
}

function handleRouteChange() {
  const route = parseHash();
  const handler = routes[route];

  // ONLY remove styles injected by views (marked with data-view-style),
  // NOT the Vite-injected CSS bundle styles
  document.querySelectorAll('head style[data-view-style]').forEach(el => el.remove());

  if (handler) {
    handler(currentParams);
  } else {
    WelcomeView();
  }

  currentParams = {};

  // Scroll to top
  window.scrollTo(0, 0);
}

export function initRouter() {
  window.addEventListener('hashchange', handleRouteChange);
  handleRouteChange();
}

/**
 * Inject view-specific styles (marked so they get cleaned up on navigation)
 */
export function injectStyle(css) {
  const style = document.createElement('style');
  style.setAttribute('data-view-style', '');
  style.textContent = css;
  document.head.appendChild(style);
}
