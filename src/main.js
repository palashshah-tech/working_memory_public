/* ============================================================
   CogScreen — Main Entry Point
   ============================================================ */

import './styles/index.css';
import './styles/tasks.css';
import './styles/admin.css';
import { initRouter } from './router.js';
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

// Initialize Vercel Analytics & Speed Insights
inject();
injectSpeedInsights();

// Single init — avoid double firing
initRouter();
