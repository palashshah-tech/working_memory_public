/* ============================================================
   Instructions View — Task-specific instructions
   ============================================================ */

import { render } from '../utils/dom.js';
import { navigate, injectStyle } from '../router.js';
import { t } from '../utils/i18n.js';

const getTaskInfo = () => ({
  'vwm-pure': {
    icon: `
      <svg class="task-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-opacity="0.3" />
        <path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke="currentColor" stroke-opacity="0.1" stroke-dasharray="2 2" />
        <circle cx="9" cy="9" r="2" fill="currentColor" />
        <circle cx="15" cy="15" r="2" fill="currentColor" />
        <circle cx="9" cy="15" r="1" fill="none" stroke="currentColor" stroke-opacity="0.4" />
        <circle cx="15" cy="9" r="1" fill="none" stroke="currentColor" stroke-opacity="0.4" />
        <path d="M9 9l6 6" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2" />
      </svg>
    `,
    title: t('t1_title'),
    tag: t('t1_tag'),
    summary: t('t1_sum'),
    steps: [ t('t1_s1'), t('t1_s2'), t('t1_s3'), t('t1_s4') ],
    keys: [{ label: t('key_same'), key: 'S', color: '#34d399' }, { label: t('key_diff'), key: 'D', color: '#f87171' }],
  },
  'vwm-distractor': {
    icon: `
      <svg class="task-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-opacity="0.3" />
        <path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke="currentColor" stroke-opacity="0.1" stroke-dasharray="2 2" />
        <circle cx="9" cy="9" r="2" fill="currentColor" />
        <circle cx="15" cy="15" r="2" fill="currentColor" />
        <rect x="13.5" y="7.5" width="3" height="3" rx="0.5" fill="none" stroke="currentColor" stroke-opacity="0.5" />
        <rect x="7.5" y="13.5" width="3" height="3" rx="0.5" fill="none" stroke="currentColor" stroke-opacity="0.5" />
        <circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2" stroke-opacity="0.5" />
      </svg>
    `,
    title: t('t2_title'),
    tag: t('t2_tag'),
    summary: t('t2_sum'),
    distractor_note: true,
    steps: [ t('t2_s1'), t('t2_s2'), t('t2_s3'), t('t2_s4'), t('t2_s5'), t('t2_s6') ],
    keys: [{ label: t('key_same'), key: 'S', color: '#34d399' }, { label: t('key_diff'), key: 'D', color: '#f87171' }],
  },
  'ant': {
    icon: `
      <svg class="task-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 12h3M5.5 10.5L7 12l-1.5 1.5" stroke="currentColor" stroke-opacity="0.4" stroke-width="1.2" />
        <path d="M8 12h3M9.5 10.5L11 12l-1.5 1.5" stroke="currentColor" stroke-opacity="0.4" stroke-width="1.2" />
        <path d="M12 12h5m-2.5-3.5L17 12l-2.5 3.5" stroke="currentColor" stroke-width="2" />
        <path d="M18 12h3M19.5 10.5L21 12l-1.5 1.5" stroke="currentColor" stroke-opacity="0.4" stroke-width="1.2" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.15" />
      </svg>
    `,
    title: t('t3_title'),
    tag: t('t3_tag'),
    summary: t('t3_sum'),
    steps: [ t('t3_s1'), t('t3_s2'), t('t3_s3'), t('t3_s4'), t('t3_s5'), t('t3_s6') ],
    keys: [{ label: t('key_left'), key: '←', color: '#34d399' }, { label: t('key_right'), key: '→', color: '#f87171' }],
  },
});

const NEXT_ROUTE = {
  'vwm-pure': 'task/vwm-pure',
  'vwm-distractor': 'task/vwm-distractor',
  'ant': 'task/ant',
};

export function InstructionsView(params = {}) {
  const taskKey = params.task || 'vwm-pure';
  const info = getTaskInfo()[taskKey];
  if (!info) { navigate(''); return; }

  render(`
    <div class="view iv">
      <div class="iv-grid"></div>
      <div class="iv-orb iv-orb-a"></div>
      <div class="iv-orb iv-orb-b"></div>

      <div class="iv-body">
        <div class="iv-header">
          <span class="iv-tag">${info.tag}</span>
          <div class="iv-icon">${info.icon}</div>
          <h1 class="iv-title">${info.title}</h1>
          <p class="iv-summary">${info.summary}</p>
        </div>

        ${info.distractor_note ? `
          <div class="iv-distractor-callout">
            <div class="iv-dist-visual">
              <div class="iv-dist-square target-sq"></div>
              <div class="iv-dist-square target-sq"></div>
              <div class="iv-dist-square distractor-sq"></div>
              <div class="iv-dist-square target-sq"></div>
              <div class="iv-dist-square distractor-sq"></div>
            </div>
            <div class="iv-dist-labels">
              <span><span class="iv-dot" style="background:#3b82f6"></span> ${t('dist_color')}</span>
              <span><span class="iv-dot" style="background:#ffffff; border:1px solid rgba(255,255,255,0.2);"></span> ${t('dist_gray')}</span>
            </div>
            <p class="iv-dist-tip">${t('dist_tip')}</p>
          </div>
        ` : ''}

          <!-- Schematics placeholder. Renders if the image exists in the public directory -->
          ${taskKey.startsWith('vwm') ? `
            <div class="iv-schematics">
              <img src="/vwm_schematics.png" alt="Task Schematics" onerror="this.style.display='none'" style="max-width:100%; border-radius:12px; display:block; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1);" />
            </div>
          ` : ''}

        <div class="iv-steps-card">
          <h3 class="iv-steps-title">${t('step_title')}</h3>
          <ol class="iv-steps">
            ${info.steps.map(s => `<li>${s}</li>`).join('')}
          </ol>
        </div>

        <div class="iv-keys">
          ${info.keys.map(k => `
            <div class="iv-key-item">
              <div class="iv-key-box" style="border-color:${k.color}66;color:${k.color}">${k.key}</div>
              <span class="iv-key-label">${k.label}</span>
            </div>
          `).join('')}
        </div>

        <button class="iv-cta" id="btn-start">
          ${t('btn_ready')}
        </button>
      </div>
    </div>
  `);

  injectStyle(`
    /* ── Instructions — volt-green unified theme ──────────── */
    .iv {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      padding: 40px 24px;
      position: relative; overflow: hidden;
      background:
        radial-gradient(ellipse 65% 50% at 50% 0%, rgba(212,255,0,0.07) 0%, transparent 60%),
        radial-gradient(ellipse 45% 40% at 85% 85%, rgba(138,255,0,0.04) 0%, transparent 55%);
    }
    .iv-grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 48px 48px;
      animation: iv-grid-drift 24s linear infinite;
      pointer-events: none; z-index: 0;
    }
    @keyframes iv-grid-drift {
      from { background-position: 0 0; }
      to   { background-position: 48px 48px; }
    }
    .iv-orb {
      position: absolute; border-radius: 50%; filter: blur(90px); pointer-events: none; opacity: 0.15;
      animation: iv-orb-breathe ease-in-out infinite alternate;
    }
    .iv-orb-a { width: 280px; height: 280px; top: -60px; left: -60px; background: #d4ff00; animation-duration: 10s; }
    .iv-orb-b { width: 200px; height: 200px; bottom: -40px; right: -40px; background: #8aff00; animation-duration: 13s; }
    @keyframes iv-orb-breathe {
      from { transform: scale(1); }
      to   { transform: scale(1.1) translate(8px, 12px); }
    }

    .iv-body {
      max-width: 640px; width: 100%;
      display: flex; flex-direction: column; gap: 24px;
      position: relative; z-index: 1;
    }
    .iv-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .iv-tag {
      display: inline-block;
      font-family: var(--font-mono); font-size: 11px;
      letter-spacing: 0.14em; padding: 4px 14px;
      border-radius: 99px;
      margin-bottom: 20px;
      color: #d4ff00;
      background: rgba(212,255,0,0.08);
      border: 1px solid rgba(212,255,0,0.25);
    }
    .iv-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      color: #d4ff00;
      filter: drop-shadow(0 0 8px rgba(212,255,0,0.3));
    }
    .iv-icon svg {
      width: 56px;
      height: 56px;
    }
    .iv-title { font-size: 2rem; margin-bottom: 12px; }
    .iv-summary {
      color: var(--text-secondary); font-size: 1.05rem;
      line-height: 1.75; max-width: 540px; margin: 0 auto;
    }
    .iv-summary strong { color: var(--text-primary); }

    /* Distractor callout */
    .iv-distractor-callout {
      background: rgba(212,255,0,0.04);
      border: 1px solid rgba(212,255,0,0.15);
      border-radius: 16px; padding: 24px; text-align: center;
    }
    .iv-dist-visual {
      display: flex; align-items: center; justify-content: center;
      gap: 10px; margin-bottom: 16px;
    }
    .iv-dist-square { width: 36px; height: 36px; border-radius: 5px; }
    .target-sq     { background: #3b82f6; }
    .distractor-sq { background: #ffffff; border: 2px solid rgba(255,255,255,0.4); }
    .iv-dist-labels {
      display: flex; gap: 24px; justify-content: center;
      font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;
    }
    .iv-dist-labels span { display: flex; align-items: center; gap: 8px; }
    .iv-dot { width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0; display: inline-block; }
    .iv-dist-tip { font-size: 13px; color: var(--text-tertiary); line-height: 1.6; }
    .iv-dist-tip strong { color: #d4ff00; }

    /* Steps */
    .iv-steps-card {
      background: rgba(13,13,18,0.6);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(212,255,0,0.1);
      border-radius: 16px; padding: 28px 32px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.25);
    }
    .iv-steps-title {
      font-size: 0.8rem; font-family: var(--font-mono);
      color: var(--text-tertiary); letter-spacing: 0.1em;
      text-transform: uppercase; margin-bottom: 16px;
    }
    .iv-steps { counter-reset: step; list-style: none; display: flex; flex-direction: column; gap: 0; }
    .iv-steps li {
      counter-increment: step;
      padding: 12px 0 12px 42px; position: relative;
      color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .iv-steps li:last-child { border-bottom: none; }
    .iv-steps li::before {
      content: counter(step);
      position: absolute; left: 0; top: 12px;
      width: 26px; height: 26px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(212,255,0,0.1); color: #d4ff00;
      font-family: var(--font-mono); font-size: 12px; font-weight: 700;
      border-radius: 6px;
    }
    .iv-steps li strong { color: var(--text-primary); }
    .iv-steps li em     { color: #d4ff00; font-style: normal; font-weight: 600; }
    .iv-steps li kbd {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 22px; padding: 1px 6px;
      background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
      border-radius: 5px; font-family: var(--font-mono); font-size: 13px; color: var(--text-primary);
    }

    /* Key indicators */
    .iv-keys { display: flex; gap: 20px; justify-content: center; }
    .iv-key-item { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .iv-key-box {
      width: 64px; height: 64px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.03); border: 2px solid; border-radius: 12px;
      font-family: var(--font-mono); font-size: 1.5rem; font-weight: 700;
    }
    .iv-key-label {
      font-size: 11px; color: var(--text-tertiary);
      font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.08em;
    }

    /* CTA */
    .iv-cta {
      font-family: var(--font-display); font-weight: 700;
      font-size: 1.05rem; color: #080810;
      padding: 18px 24px;
      background: linear-gradient(135deg, #d4ff00 0%, #aaff00 100%);
      border: none; border-radius: 14px; cursor: pointer;
      transition: all 0.2s; position: relative; overflow: hidden;
    }
    .iv-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(212,255,0,0.3); }
    .iv-cta:active { transform: translateY(0); }
  `);

  document.getElementById('btn-start').addEventListener('click', () => {
    navigate(NEXT_ROUTE[taskKey] || 'task/vwm-pure');
  });
}
