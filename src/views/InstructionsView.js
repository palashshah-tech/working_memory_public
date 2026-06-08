/* ============================================================
   Instructions View — Luxury Automotive HUD & Glassmorphism Design
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
      <!-- 3D atmospheric studio lighting & glass shards -->
      <div class="iv-mesh-cyan"></div>
      <div class="iv-mesh-gold"></div>
      <div class="iv-glass-shard shard-1"></div>
      <div class="iv-glass-shard shard-2"></div>
      <div class="iv-glass-shard shard-3"></div>

      <div class="iv-container">


        <!-- Asymmetrical layout -->
        <div class="iv-hud">
          <!-- Left side navigation panel & title -->
          <div class="iv-hud-left">
            <div class="iv-header-block">
              <span class="iv-tag-premium">${info.tag}</span>
              <h1 class="iv-title-premium">${info.title}</h1>
              <p class="iv-desc">${info.summary}</p>
            </div>

            <!-- Monospaced index navigation -->
            <div class="iv-steps-nav">
              ${info.steps.map((_, idx) => `
                <div class="iv-nav-item" data-step="${idx}">
                  <span class="iv-nav-num">0${idx + 1}</span>
                  <span class="iv-nav-sep">//</span>
                  <span class="iv-nav-label">PHASE_0${idx + 1}</span>
                  <span class="iv-nav-line"></span>
                </div>
              `).join('')}
            </div>

            <!-- Custom hardware keys block -->
            <div class="iv-keys-hud">
              <div class="iv-keys-title">HARDWARE INPUTS</div>
              <div class="iv-keys-row">
                ${info.keys.map(k => `
                  <div class="iv-key-card-premium">
                    <span class="iv-key-cap" style="color:${k.color}; border-color:${k.color}40; box-shadow: 0 0 15px ${k.color}15;">${k.key}</span>
                    <span class="iv-key-name">${k.label}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Right side main glass card -->
          <div class="iv-hud-right">
            <div class="iv-card" id="iv-tilt-card">
              <div class="iv-card-glare"></div>
              <div class="iv-card-inner">
                <h3 class="iv-card-title">SEQUENCE PROTOCOL</h3>
                <ul class="iv-steps-list-premium">
                  ${info.steps.map((step, idx) => `
                    <li class="iv-step-item-premium" data-step="${idx}" data-task="${taskKey}">
                      <span class="iv-step-badge">0${idx + 1}</span>
                      <div class="iv-step-content">${step}</div>
                    </li>
                  `).join('')}
                </ul>

                <!-- Distractor visuals / Schematics in premium frames -->
                ${info.distractor_note ? `
                  <div class="iv-distractor-card-premium">
                    <div class="iv-dist-head">DIAGNOSTIC MATRIX // DISTRACTOR NOISE</div>
                    <div class="iv-dist-display">
                      <div class="iv-dist-sq-p vwm-target" style="background:#e74c3c; box-shadow: 0 0 15px rgba(231,76,60,0.35);"></div>
                      <div class="iv-dist-sq-p vwm-target" style="background:#27ae60; box-shadow: 0 0 15px rgba(39,174,96,0.35);"></div>
                      <div class="iv-dist-sq-p vwm-noise"></div>
                      <div class="iv-dist-sq-p vwm-target" style="background:#f39c12; box-shadow: 0 0 15px rgba(243,156,18,0.35);"></div>
                      <div class="iv-dist-sq-p vwm-noise"></div>
                    </div>
                    <div class="iv-dist-legend-p">
                      <span>
                        <span class="dot-p" style="background:#e74c3c;"></span>
                        <span class="dot-p" style="background:#27ae60; margin-left:-4px;"></span>
                        <span class="dot-p" style="background:#f39c12; margin-left:-4px;"></span>
                        &nbsp;TARGETS
                      </span>
                      <span><span class="dot-p noise-dot"></span> DISTRACTORS</span>
                    </div>
                    <p class="iv-dist-text-p">${t('dist_tip')}</p>
                  </div>
                ` : ''}

                ${taskKey.startsWith('vwm') ? `
                  <div class="iv-schematics-premium">
                    <img src="/vwm_schematics.png" alt="Task Schematics" onerror="this.style.display='none'" />
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Start test button -->
            <button class="iv-cta-premium" id="btn-start">
              <span class="cta-label">INITIALIZE TEST SEQUENCE</span>
              <span class="cta-arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `);

  injectStyle(`
    /* ============================================================
       Scandinavian Minimalism / Lenna EV UI System
       ============================================================ */
    .iv {
      min-height: 100vh;
      background: #050506;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      font-family: var(--font-body);
      color: #c4c4c7;
      padding: 48px;
      position: relative;
      perspective: 1200px;
    }
    
    .iv-container {
      max-width: 1200px;
      width: 100%;
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      gap: 40px;
    }

    /* Demo Panel — appears on sustained hover */
    .iv-demo-panel {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.88);
      width: 300px;
      background: rgba(10, 10, 12, 0.92);
      backdrop-filter: blur(48px);
      -webkit-backdrop-filter: blur(48px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 36px 32px;
      z-index: 9999;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.45s cubic-bezier(0.4,0,0.2,1), transform 0.45s cubic-bezier(0.4,0,0.2,1);
      box-shadow: 0 40px 100px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.07);
    }
    .iv-demo-panel.visible {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    /* ── Demo Panel inner typography ── */
    .iv-demo-label {
      font-family: var(--font-mono);
      font-size: 9px;
      letter-spacing: 0.26em;
      color: var(--accent-volt);
      margin-bottom: 22px;
      opacity: 0.8;
    }
    .iv-demo-stage {
      width: 100%;
      min-height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 20px;
    }
    .vd-caption {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      color: #52525b;
      text-align: center;
      line-height: 1.55;
      letter-spacing: 0.04em;
      max-width: 240px;
      animation: vd-fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both;
      animation-delay: 220ms;
    }

    /* ── Spring entrance keyframes ── */
    @keyframes vd-spring-in {
      0%   { opacity: 0; transform: scale(0.6) translateY(6px); }
      60%  { opacity: 1; transform: scale(1.06) translateY(-2px); }
      80%  { transform: scale(0.97) translateY(1px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes vd-fade-up {
      0%   { opacity: 0; transform: translateY(6px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes vd-breathe {
      0%,100% { opacity: 1;  transform: scale(1); }
      50%     { opacity: 0.4; transform: scale(0.86); }
    }
    @keyframes vd-ring-out {
      0%   { transform: scale(0.9); opacity: 0.5; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    @keyframes vd-sq-flash {
      0%   { opacity: 0; transform: scale(0.65); }
      18%  { opacity: 1; transform: scale(1.07); }
      30%  { transform: scale(1); }
      68%  { opacity: 1; transform: scale(1); }
      82%  { opacity: 0; transform: scale(0.92); }
      100% { opacity: 0; }
    }
    @keyframes vd-blink-out {
      0%,45%  { opacity: 1; }
      55%,100%{ opacity: 0; }
    }
    @keyframes vd-probe-pop {
      0%   { opacity: 0; transform: scale(0.5); }
      55%  { opacity: 1; transform: scale(1.08); }
      75%  { transform: scale(0.96); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes vd-key-alt {
      0%,42%  { background: rgba(52,211,153,0.18); border-color: rgba(52,211,153,0.5); color: #34d399; transform: scale(1); }
      45%     { transform: scale(0.93); }
      48%,90% { background: rgba(52,211,153,0.06); border-color: rgba(52,211,153,0.2); color: rgba(52,211,153,0.45); transform: scale(1); }
      100%    { background: rgba(52,211,153,0.18); border-color: rgba(52,211,153,0.5); color: #34d399; }
    }
    @keyframes vd-key-alt-d {
      0%,42%  { background: rgba(248,113,113,0.06); border-color: rgba(248,113,113,0.2); color: rgba(248,113,113,0.4); transform: scale(1); }
      48%,90% { background: rgba(248,113,113,0.18); border-color: rgba(248,113,113,0.5); color: #f87171; }
      93%     { transform: scale(0.93); }
      100%    { background: rgba(248,113,113,0.06); border-color: rgba(248,113,113,0.2); color: rgba(248,113,113,0.4); }
    }
    @keyframes vd-cue-flash {
      0%,100% { opacity: 0; transform: scale(0.72); }
      35%,65% { opacity: 1; transform: scale(1); }
    }
    @keyframes vd-arrow-slide-in {
      0%   { opacity: 0; transform: translateY(-10px); }
      60%  { opacity: 1; transform: translateY(2px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes vd-ignore-fade {
      0%,100% { opacity: 0.12; }
      50%     { opacity: 0.06; }
    }
    @keyframes vd-accuracy-pop {
      0%   { opacity: 0; transform: scale(0.4) rotate(-10deg); }
      55%  { opacity: 1; transform: scale(1.15) rotate(3deg); }
      75%  { transform: scale(0.95) rotate(0deg); }
      100% { opacity: 1; transform: scale(1) rotate(0deg); }
    }
    @keyframes vd-speed-flash {
      0%,100% { opacity: 0.3; transform: scale(0.9); }
      50%     { opacity: 1;   transform: scale(1.08); }
    }

    /* ── Scene wrapper ── */
    .vd-scene {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      animation: vd-fade-up 0.38s cubic-bezier(0.16,1,0.3,1) both;
    }

    /* ── Fixation cross ── */
    .vd-fixation {
      position: relative;
      display: flex; align-items: center; justify-content: center;
      width: 72px; height: 72px;
    }
    .vd-fix-ring {
      position: absolute;
      width: 100%; height: 100%;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.12);
      animation: vd-ring-out 2.4s cubic-bezier(0.16,1,0.3,1) infinite;
    }
    .vd-fix-ring:nth-child(2) { animation-delay: 1.2s; }
    .vd-fix-cross {
      font-size: 2.6rem;
      color: #ffffff;
      line-height: 1;
      font-weight: 300;
      animation: vd-breathe 2.2s ease-in-out infinite;
      position: relative;
      z-index: 1;
    }

    /* ── VWM 2×2 grid ── */
    .vd-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .vd-sq {
      width: 38px; height: 38px;
      border-radius: 5px;
      animation: vd-spring-in 0.55s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    .vd-sq:nth-child(1) { animation-delay: 0ms; }
    .vd-sq:nth-child(2) { animation-delay: 60ms; }
    .vd-sq:nth-child(3) { animation-delay: 120ms; }
    .vd-sq:nth-child(4) { animation-delay: 180ms; }
    .vd-sq--flash {
      animation: vd-sq-flash 2.8s cubic-bezier(0.16,1,0.3,1) infinite both;
    }
    .vd-sq--flash:nth-child(1) { animation-delay: 0ms; }
    .vd-sq--flash:nth-child(2) { animation-delay: 70ms; }
    .vd-sq--flash:nth-child(3) { animation-delay: 140ms; }
    .vd-sq--flash:nth-child(4) { animation-delay: 210ms; }
    .vd-sq--blank {
      background: transparent !important;
      box-shadow: none !important;
      border: 1.5px solid rgba(255,255,255,0.1);
      animation: vd-spring-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    .vd-sq--probe {
      border: none;
      animation: vd-probe-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) both;
      animation-delay: 80ms;
    }
    .vd-sq--dim {
      background: #fff !important;
      box-shadow: 0 0 10px rgba(255,255,255,0.2) !important;
      animation: vd-ignore-fade 2.2s ease-in-out infinite both, vd-spring-in 0.55s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    .vd-sq--dim:nth-child(1) { animation-delay: 0ms, 0ms; }
    .vd-sq--dim:nth-child(2) { animation-delay: 0ms, 60ms; }
    .vd-sq--dim:nth-child(3) { animation-delay: 0.4s, 120ms; }
    .vd-sq--dim:nth-child(4) { animation-delay: 0.4s, 180ms; }

    /* ── Hold / blank phase ── */
    .vd-hold-wrap {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      animation: vd-fade-up 0.4s cubic-bezier(0.16,1,0.3,1) both;
    }
    .vd-hold-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .vd-hold-sq {
      width: 38px; height: 38px;
      border-radius: 5px;
      border: 1.5px solid rgba(255,255,255,0.08);
      background: transparent;
    }
    .vd-hold-label {
      font-family: var(--font-mono);
      font-size: 9px;
      letter-spacing: 0.2em;
      color: rgba(255,255,255,0.2);
      animation: vd-breathe 2s ease-in-out infinite;
    }

    /* ── Decision keys ── */
    .vd-decision {
      display: flex; gap: 10px;
      animation: vd-fade-up 0.45s cubic-bezier(0.16,1,0.3,1) both;
      animation-delay: 180ms;
    }
    .vd-key {
      padding: 9px 16px;
      border-radius: 6px;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.06em;
      border: 1px solid;
    }
    .vd-key--s {
      background: rgba(52,211,153,0.12);
      border-color: rgba(52,211,153,0.4);
      color: #34d399;
      animation: vd-key-alt 2.6s ease-in-out infinite;
    }
    .vd-key--d {
      background: rgba(248,113,113,0.08);
      border-color: rgba(248,113,113,0.25);
      color: rgba(248,113,113,0.5);
      animation: vd-key-alt-d 2.6s ease-in-out infinite;
    }

    /* ── ANT Scene ── */
    .vd-ant-scene {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      animation: vd-fade-up 0.38s cubic-bezier(0.16,1,0.3,1) both;
    }
    .vd-ant-cross {
      font-size: 1.1rem;
      color: rgba(255,255,255,0.35);
      line-height: 1;
      font-weight: 300;
      margin: 0;
      animation: vd-breathe 2.2s ease-in-out infinite;
    }
    .vd-ant-flanker-row {
      display: flex;
      align-items: center;
      gap: 2px;
      animation: vd-arrow-slide-in 0.55s cubic-bezier(0.16,1,0.3,1) both;
      animation-delay: 60ms;
    }
    .vd-ant-arrow {
      font-size: 1.55rem;
      line-height: 1;
      color: #71717a;
    }
    .vd-ant-arrow--center {
      font-size: 1.85rem;
      color: #ffffff;
      position: relative;
    }
    .vd-ant-arrow--center-volt {
      font-size: 1.85rem;
      color: var(--accent-volt);
      position: relative;
    }
    .vd-ant-arrow--dim {
      color: rgba(113,113,122,0.25);
    }

    /* ── Cue ── */
    .vd-cue-wrap {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      animation: vd-fade-up 0.4s cubic-bezier(0.16,1,0.3,1) both;
    }
    .vd-cue-cross { font-size: 1.1rem; color: rgba(255,255,255,0.3); }
    .vd-cue-circle {
      width: 44px; height: 44px;
      border-radius: 50%;
      border: 1.5px solid rgba(255,255,255,0.6);
      animation: vd-cue-flash 2s cubic-bezier(0.16,1,0.3,1) infinite;
    }
    .vd-cue-cross2 { font-size: 1.1rem; color: rgba(255,255,255,0.3); }

    /* ── LR keys ── */
    .vd-lr-keys {
      display: flex; gap: 12px;
      animation: vd-fade-up 0.45s cubic-bezier(0.16,1,0.3,1) both;
      animation-delay: 100ms;
    }
    .vd-lr-key {
      padding: 10px 18px;
      border-radius: 6px;
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.04em;
      border: 1px solid;
    }
    .vd-lr-key--l { background: rgba(52,211,153,0.12); border-color: rgba(52,211,153,0.4); color: #34d399; animation: vd-spring-in 0.55s cubic-bezier(0.34,1.56,0.64,1) both; }
    .vd-lr-key--r { background: rgba(248,113,113,0.12); border-color: rgba(248,113,113,0.4); color: #f87171; animation: vd-spring-in 0.55s cubic-bezier(0.34,1.56,0.64,1) both; animation-delay: 80ms; }

    /* ── Accuracy / Speed ── */
    .vd-accuracy {
      font-size: 2.6rem;
      color: var(--accent-volt);
      animation: vd-accuracy-pop 0.7s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    .vd-speed {
      font-size: 2.4rem;
      animation: vd-speed-flash 1.4s ease-in-out infinite;
    }

    .iv-hud {
      display: flex;
      gap: 64px;
      align-items: flex-start;
    }

    /* Left Panel Styles */
    .iv-hud-left {
      flex: 0 0 380px;
      display: flex;
      flex-direction: column;
      gap: 48px;
    }

    .iv-header-block {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .iv-tag-premium {
      font-family: var(--font-mono);
      font-size: 9px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--accent-volt);
      border: 1px solid rgba(212, 255, 0, 0.2);
      background: rgba(212, 255, 0, 0.04);
      padding: 4px 10px;
      border-radius: 2px;
      margin-bottom: 24px;
    }

    .iv-title-premium {
      font-family: var(--font-display);
      font-size: 3.2rem;
      font-style: italic;
      color: #fff;
      font-weight: 600;
      line-height: 1.05;
      margin-bottom: 16px;
    }

    .iv-desc {
      font-size: 0.95rem;
      color: #8a8a93;
      line-height: 1.6;
    }

    /* Steps Index HUD */
    .iv-steps-nav {
      display: flex;
      flex-direction: column;
      gap: 18px;
      border-left: 1px solid rgba(255, 255, 255, 0.03);
      padding-left: 16px;
    }

    .iv-nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: var(--font-mono);
      font-size: 10px;
      color: #4a4a4f;
      cursor: pointer;
      transition: color 0.3s;
      position: relative;
      padding: 2px 0;
    }

    .iv-nav-num {
      font-weight: 500;
    }

    .iv-nav-sep {
      opacity: 0.3;
    }

    .iv-nav-label {
      letter-spacing: 0.15em;
    }

    .iv-nav-line {
      position: absolute;
      left: -20px;
      top: 50%;
      transform: translateY(-50%);
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent-volt);
      opacity: 0;
      transition: opacity 0.3s, transform 0.3s;
      box-shadow: 0 0 8px var(--accent-volt);
    }

    .iv-nav-item.active {
      color: #fff;
    }

    .iv-nav-item.active .iv-nav-line {
      opacity: 1;
      transform: translateY(-50%) scale(1.3);
    }

    /* Keybind Layout */
    .iv-keys-hud {
      display: flex;
      flex-direction: column;
      gap: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 32px;
    }

    .iv-keys-title {
      font-family: var(--font-mono);
      font-size: 9px;
      color: #52525b;
      letter-spacing: 0.15em;
    }

    .iv-keys-row {
      display: flex;
      gap: 16px;
    }

    .iv-key-card-premium {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.04);
      padding: 8px 16px 8px 12px;
      border-radius: 4px;
    }

    .iv-key-cap {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 1px solid;
      border-radius: 4px;
      font-family: var(--font-mono);
      font-size: 14px;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.02);
    }

    .iv-key-name {
      font-size: 10px;
      text-transform: uppercase;
      font-family: var(--font-mono);
      color: #8a8a93;
      letter-spacing: 0.05em;
    }

    /* Right Panel Styles */
    .iv-hud-right {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .iv-card {
      position: relative;
      background: rgba(20, 20, 22, 0.45);
      backdrop-filter: blur(35px);
      -webkit-backdrop-filter: blur(35px);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      box-shadow: 0 40px 100px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.08);
      transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);
      transform-style: preserve-3d;
    }

    .iv-card-glare {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, transparent 60%);
      pointer-events: none;
      border-radius: 8px;
      z-index: 10;
    }

    .iv-card-inner {
      padding: 48px;
      transform: translateZ(24px);
    }

    .iv-card-title {
      font-family: var(--font-mono);
      font-size: 9px;
      color: #52525b;
      letter-spacing: 0.25em;
      margin-bottom: 28px;
    }

    /* Instructions Steps List */
    .iv-steps-list-premium {
      display: flex;
      flex-direction: column;
      gap: 0;
      list-style: none;
    }

    .iv-step-item-premium {
      display: flex;
      gap: 32px;
      padding: 24px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.3s;
      position: relative;
    }

    .iv-step-item-premium:last-child {
      border-bottom: none;
    }

    .iv-step-badge {
      font-family: var(--font-mono);
      font-size: 10px;
      color: #4a4a4f;
      margin-top: 4px;
      transition: color 0.3s;
    }

    .iv-step-content {
      font-size: 1rem;
      color: #a1a1aa;
      line-height: 1.7;
      transition: color 0.3s;
    }

    .iv-step-item-premium:hover {
      transform: translateZ(12px) translateX(8px);
    }

    .iv-step-item-premium:hover .iv-step-content {
      color: #fff;
    }

    .iv-step-item-premium:hover .iv-step-badge {
      color: var(--accent-volt);
    }

    /* Luxury Interactive Visual Callouts */
    .iv-distractor-card-premium {
      margin-top: 40px;
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 6px;
      padding: 24px;
    }

    .iv-dist-head {
      font-family: var(--font-mono);
      font-size: 9px;
      color: #52525b;
      letter-spacing: 0.15em;
      margin-bottom: 20px;
    }

    .iv-dist-display {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-bottom: 20px;
    }

    .iv-dist-sq-p {
      width: 36px;
      height: 36px;
      border-radius: 3px;
    }

    .vwm-target {
      background: #00f0ff;
      box-shadow: 0 0 15px rgba(0, 240, 255, 0.25);
    }

    .vwm-noise {
      background: #ffffff;
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
    }

    .iv-dist-legend-p {
      display: flex;
      justify-content: center;
      gap: 32px;
      font-family: var(--font-mono);
      font-size: 9px;
      color: #71717a;
      margin-bottom: 16px;
      letter-spacing: 0.05em;
    }

    .iv-dist-legend-p span {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .dot-p {
      width: 10px;
      height: 10px;
      border-radius: 2px;
      display: inline-block;
    }

    .target-dot {
      background: #00f0ff;
    }

    .noise-dot {
      background: #ffffff;
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.25);
    }

    .iv-dist-text-p {
      font-size: 0.85rem;
      color: #71717a;
      line-height: 1.6;
      text-align: center;
      max-width: 440px;
      margin: 0 auto;
    }

    .iv-schematics-premium {
      margin-top: 40px;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 6px;
      padding: 16px;
    }

    .iv-schematics-premium img {
      max-width: 100%;
      border-radius: 4px;
      display: block;
      margin: 0 auto;
      opacity: 0.65;
      transition: opacity 0.3s;
    }

    .iv-schematics-premium img:hover {
      opacity: 1;
    }

    /* Start Button - Wide low-profile automotive HUD style */
    .iv-cta-premium {
      position: relative;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #fff;
      color: #000;
      border: none;
      padding: 22px 36px;
      border-radius: 8px;
      font-family: var(--font-body);
      font-weight: 700;
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      cursor: pointer;
      transition: background 0.3s, transform 0.2s, box-shadow 0.3s;
      overflow: hidden;
    }

    .iv-cta-premium:hover {
      background: var(--accent-volt);
      transform: translateY(-2px);
      box-shadow: 0 20px 40px rgba(212, 255, 0, 0.25);
    }

    .iv-cta-premium:active {
      transform: translateY(0);
    }

    .cta-arrow {
      font-size: 1.25rem;
      font-weight: 600;
      transition: transform 0.3s;
    }

    .iv-cta-premium:hover .cta-arrow {
      transform: translateX(4px);
    }

    /* 3D Atmospheric Backlighting & Glass Objects */
    .iv-mesh-cyan {
      position: absolute;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      filter: blur(160px);
      pointer-events: none;
      opacity: 0.035;
      background: #00f0ff;
      top: -100px;
      left: -100px;
      animation: breathe-light 10s ease-in-out infinite alternate;
    }

    .iv-mesh-gold {
      position: absolute;
      width: 550px;
      height: 550px;
      border-radius: 50%;
      filter: blur(140px);
      pointer-events: none;
      opacity: 0.025;
      background: #e2b755;
      bottom: -80px;
      right: -80px;
      animation: breathe-light 14s ease-in-out infinite alternate;
    }

    @keyframes breathe-light {
      0% {
        transform: scale(1) translate(0, 0);
        opacity: 0.02;
      }
      100% {
        transform: scale(1.15) translate(20px, 15px);
        opacity: 0.045;
      }
    }

    .iv-glass-shard {
      position: absolute;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.03);
      background: rgba(255, 255, 255, 0.005);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      pointer-events: none;
      opacity: 0.5;
    }

    .shard-1 {
      width: 140px;
      height: 140px;
      top: 15%;
      left: 80%;
      transform: rotate(15deg);
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.015) 0%, transparent 80%);
    }

    .shard-2 {
      width: 90px;
      height: 90px;
      bottom: 10%;
      left: 5%;
      transform: rotate(-25deg);
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.015) 0%, transparent 80%);
    }

    .shard-3 {
      width: 60px;
      height: 180px;
      top: 45%;
      left: 45%;
      transform: rotate(45deg);
      opacity: 0.1;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.01) 0%, transparent 80%);
    }

    /* Responsive adjustments */
    @media (max-width: 980px) {
      .iv {
        padding: 32px 20px;
      }
      .iv-hud {
        flex-direction: column;
        gap: 48px;
      }
      .iv-hud-left {
        flex: 1 1 auto;
        width: 100%;
        gap: 32px;
      }
      .iv-steps-nav {
        display: none;
      }
      .iv-hud-right {
        width: 100%;
      }
      .iv-card-inner {
        padding: 32px 24px;
      }
      .iv-step-item-premium {
        padding: 16px 0;
        gap: 20px;
      }
    }
  `);

  // Interactive 3D Perspective Tilt Effect
  const card = document.getElementById('iv-tilt-card');
  if (card && window.innerWidth > 980) {
    const handleMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const xAxis = (rect.width / 2 - x) / 45;
      const yAxis = (rect.height / 2 - y) / 45;
      card.style.transform = `rotateY(${-xAxis}deg) rotateX(${yAxis}deg) translateZ(10px)`;
    };
    const handleLeave = () => {
      card.style.transform = 'rotateY(0deg) rotateX(0deg) translateZ(0px)';
    };
    card.addEventListener('mousemove', handleMove);
    card.addEventListener('mouseleave', handleLeave);
  }

  // Active step navigation connector links
  const steps = document.querySelectorAll('.iv-step-item-premium');
  const navItems = document.querySelectorAll('.iv-nav-item');
  if (navItems.length) navItems[0].classList.add('active');
  steps.forEach((step) => {
    step.addEventListener('mouseenter', () => {
      const idx = step.getAttribute('data-step');
      navItems.forEach((nav) => {
        if (nav.getAttribute('data-step') === idx) nav.classList.add('active');
        else nav.classList.remove('active');
      });
    });
  });

  // ─── Hover Demo Panel ─────────────────────────────────────────────────────
  // Apple-quality per-step visual demos. Spring physics via CSS cubic-bezier.
  // Staggered child entrance. Accurate representation of each task phase.

  const SQ_COLORS = [
    { bg: '#e74c3c', glow: 'rgba(231,76,60,0.55)' },
    { bg: '#27ae60', glow: 'rgba(39,174,96,0.55)'  },
    { bg: '#f59e0b', glow: 'rgba(245,158,11,0.55)' },
    { bg: '#3b82f6', glow: 'rgba(59,130,246,0.55)' },
    { bg: '#8b5cf6', glow: 'rgba(139,92,246,0.55)' },
    { bg: '#ec4899', glow: 'rgba(236,72,153,0.55)' },
  ];

  // Build a colored VWM square div
  function cSq(c, cls = '') {
    return `<div class="vd-sq ${cls}" style="background:${c.bg};box-shadow:0 0 18px ${c.glow};"></div>`;
  }

  function getDemoContent(task, idx) {

    // ── VWM Pure ─────────────────────────────────────────────────────
    if (task === 'vwm-pure') {
      const demos = [

        // Step 0 — Fixation cross
        `<div class="vd-scene">
          <div class="vd-fixation">
            <div class="vd-fix-ring"></div>
            <div class="vd-fix-ring"></div>
            <div class="vd-fix-cross">+</div>
          </div>
        </div>
        <div class="vd-caption">Keep your eyes on the cross<br>until the squares appear</div>`,

        // Step 1 — Colored squares flash in briefly
        `<div class="vd-scene">
          <div class="vd-grid">
            ${cSq(SQ_COLORS[0],'vd-sq--flash')}${cSq(SQ_COLORS[3],'vd-sq--flash')}
            ${cSq(SQ_COLORS[1],'vd-sq--flash')}${cSq(SQ_COLORS[2],'vd-sq--flash')}
          </div>
        </div>
        <div class="vd-caption">4 colored squares flash briefly<br>Memorize <em>every</em> color</div>`,

        // Step 2 — Blank screen, hold in memory
        `<div class="vd-hold-wrap">
          <div class="vd-hold-grid">
            <div class="vd-hold-sq"></div><div class="vd-hold-sq"></div>
            <div class="vd-hold-sq"></div><div class="vd-hold-sq"></div>
          </div>
          <div class="vd-hold-label">RETENTION INTERVAL</div>
        </div>
        <div class="vd-caption">Screen clears — hold all colors<br>in your mind</div>`,

        // Step 3 — Probe + respond
        `<div class="vd-scene">
          <div class="vd-grid">
            <div class="vd-sq vd-sq--blank"></div>
            ${cSq(SQ_COLORS[3],'vd-sq--probe')}
            <div class="vd-sq vd-sq--blank"></div>
            <div class="vd-sq vd-sq--blank"></div>
          </div>
          <div class="vd-decision">
            <div class="vd-key vd-key--s">S &nbsp;Same</div>
            <div class="vd-key vd-key--d">D &nbsp;Diff</div>
          </div>
        </div>
        <div class="vd-caption">One square reappears — is its<br>color the <em>same</em> or <em>different</em>?</div>`,
      ];
      return demos[idx] || '';
    }

    // ── VWM Distractor ───────────────────────────────────────────────
    if (task === 'vwm-distractor') {
      const demos = [

        // Step 0 — Colored targets + white distractors appear together
        `<div class="vd-scene">
          <div class="vd-grid">
            ${cSq(SQ_COLORS[0])}
            <div class="vd-sq" style="background:#ffffff;box-shadow:0 0 12px rgba(255,255,255,0.25);animation:vd-spring-in 0.55s cubic-bezier(0.34,1.56,0.64,1) both;animation-delay:60ms"></div>
            <div class="vd-sq" style="background:#ffffff;box-shadow:0 0 12px rgba(255,255,255,0.25);animation:vd-spring-in 0.55s cubic-bezier(0.34,1.56,0.64,1) both;animation-delay:120ms"></div>
            ${cSq(SQ_COLORS[2],'')}
          </div>
        </div>
        <div class="vd-caption">Colored squares = targets<br>White squares = distractors</div>`,

        // Step 1 — Ignore white, focus only on colored
        `<div class="vd-scene">
          <div class="vd-grid">
            ${cSq(SQ_COLORS[0])}
            <div class="vd-sq vd-sq--dim"></div>
            <div class="vd-sq vd-sq--dim"></div>
            ${cSq(SQ_COLORS[2],'')}
          </div>
        </div>
        <div class="vd-caption">Tune out the white squares<br>Remember <em>only</em> the colored ones</div>`,

        // Step 2 — Blank retention
        `<div class="vd-hold-wrap">
          <div class="vd-hold-grid">
            <div class="vd-hold-sq"></div><div class="vd-hold-sq"></div>
            <div class="vd-hold-sq"></div><div class="vd-hold-sq"></div>
          </div>
          <div class="vd-hold-label">HOLD IN MEMORY</div>
        </div>
        <div class="vd-caption">Blank screen — hold the colored<br>items in working memory</div>`,

        // Step 3 — Probe reappears colored, rest outlines
        `<div class="vd-scene">
          <div class="vd-grid">
            <div class="vd-sq vd-sq--blank"></div>
            ${cSq(SQ_COLORS[0],'vd-sq--probe')}
            <div class="vd-sq vd-sq--blank"></div>
            <div class="vd-sq vd-sq--blank"></div>
          </div>
        </div>
        <div class="vd-caption">One colored item reappears<br>Other positions show as outlines</div>`,

        // Step 4 — Decide same/different
        `<div class="vd-scene">
          <div class="vd-decision">
            <div class="vd-key vd-key--s">S &nbsp;Same</div>
            <div class="vd-key vd-key--d">D &nbsp;Diff</div>
          </div>
        </div>
        <div class="vd-caption">Is the probed color the <em>same</em><br>as what you saw before?</div>`,

        // Step 5 — Accuracy matters
        `<div class="vd-scene">
          <div class="vd-accuracy">✓</div>
        </div>
        <div class="vd-caption">Accuracy is the priority<br>Take your time on each trial</div>`,
      ];
      return demos[idx] || '';
    }

    // ── ANT ──────────────────────────────────────────────────────────
    if (task === 'ant') {
      const demos = [

        // Step 0 — Fixation cross center
        `<div class="vd-scene">
          <div class="vd-fixation">
            <div class="vd-fix-ring"></div>
            <div class="vd-fix-ring"></div>
            <div class="vd-fix-cross">+</div>
          </div>
        </div>
        <div class="vd-caption">Keep eyes on the center cross<br>at all times</div>`,

        // Step 1 — Cue circle flashes above or below
        `<div class="vd-cue-wrap">
          <div class="vd-cue-circle"></div>
          <div class="vd-cue-cross">+</div>
        </div>
        <div class="vd-caption">A small circle cue briefly flashes<br>above or below the cross</div>`,

        // Step 2 — Arrow row appears above/below fixation (congruent flankers)
        `<div class="vd-ant-scene">
          <div class="vd-ant-flanker-row">
            <span class="vd-ant-arrow">←</span><span class="vd-ant-arrow">←</span>
            <span class="vd-ant-arrow--center">←</span>
            <span class="vd-ant-arrow">←</span><span class="vd-ant-arrow">←</span>
          </div>
          <div class="vd-ant-cross">+</div>
        </div>
        <div class="vd-caption">5 arrows appear above or below<br>the fixation cross</div>`,

        // Step 3 — Identify CENTER arrow only (incongruent example)
        `<div class="vd-ant-scene">
          <div class="vd-ant-flanker-row">
            <span class="vd-ant-arrow vd-ant-arrow--dim">→</span>
            <span class="vd-ant-arrow vd-ant-arrow--dim">→</span>
            <span class="vd-ant-arrow--center-volt">←</span>
            <span class="vd-ant-arrow vd-ant-arrow--dim">→</span>
            <span class="vd-ant-arrow vd-ant-arrow--dim">→</span>
          </div>
          <div class="vd-ant-cross">+</div>
        </div>
        <div class="vd-caption">Ignore the flanking arrows<br>Judge <em>only</em> the center one</div>`,

        // Step 4 — Press ← or →
        `<div class="vd-scene">
          <div class="vd-lr-keys">
            <div class="vd-lr-key vd-lr-key--l">← Left</div>
            <div class="vd-lr-key vd-lr-key--r">Right →</div>
          </div>
        </div>
        <div class="vd-caption">Press the arrow key matching<br>the center arrow's direction</div>`,

        // Step 5 — Speed
        `<div class="vd-scene">
          <div class="vd-speed">⚡</div>
        </div>
        <div class="vd-caption">Respond as fast and accurately<br>as possible — every ms counts</div>`,
      ];
      return demos[idx] || '';
    }

    return '';
  }

  // Inject panel — appended to body so it sits above everything
  const demoPanel = document.createElement('div');
  demoPanel.className = 'iv-demo-panel';
  demoPanel.innerHTML = `<div class="iv-demo-label">VISUAL DEMO</div><div class="iv-demo-stage" id="iv-demo-stage"></div>`;
  document.body.appendChild(demoPanel);

  let dwellTimer = null;

  steps.forEach((step) => {
    step.addEventListener('mouseenter', () => {
      clearTimeout(dwellTimer);
      const idx = parseInt(step.getAttribute('data-step'), 10);
      const task = step.getAttribute('data-task');
      dwellTimer = setTimeout(() => {
        const stage = document.getElementById('iv-demo-stage');
        if (stage) stage.innerHTML = getDemoContent(task, idx);
        demoPanel.classList.add('visible');
      }, 600); // 600ms dwell before the panel starts fading in
    });

    step.addEventListener('mouseleave', () => {
      clearTimeout(dwellTimer);
      demoPanel.classList.remove('visible');
    });
  });

  // Clean up the panel when navigating away
  document.getElementById('btn-start').addEventListener('click', () => {
    demoPanel.remove();
    navigate(NEXT_ROUTE[taskKey] || 'task/vwm-pure');
  });
}
