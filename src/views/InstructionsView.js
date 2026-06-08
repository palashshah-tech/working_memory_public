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
      right: 48px;
      transform: translateY(-50%) translateX(20px);
      width: 260px;
      background: rgba(12, 12, 14, 0.85);
      backdrop-filter: blur(40px);
      -webkit-backdrop-filter: blur(40px);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      padding: 28px 24px;
      z-index: 9999;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.55s cubic-bezier(0.4,0,0.2,1), transform 0.55s cubic-bezier(0.4,0,0.2,1);
      box-shadow: 0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06);
    }
    .iv-demo-panel.visible {
      opacity: 1;
      transform: translateY(-50%) translateX(0);
    }
    .iv-demo-label {
      font-family: var(--font-mono);
      font-size: 9px;
      letter-spacing: 0.22em;
      color: var(--accent-volt);
      margin-bottom: 18px;
    }
    .iv-demo-stage {
      width: 100%;
      min-height: 130px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 12px;
    }
    /* Fixation cross demo */
    .demo-fix {
      font-size: 2.8rem;
      color: #fff;
      line-height: 1;
      animation: demo-pulse 1.6s ease-in-out infinite;
    }
    @keyframes demo-pulse {
      0%,100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.45; transform: scale(0.92); }
    }
    /* Colored squares demo */
    .demo-squares {
      display: flex;
      gap: 10px;
      animation: demo-fade-seq 2s ease-in-out infinite;
    }
    .demo-sq {
      width: 32px;
      height: 32px;
      border-radius: 4px;
    }
    @keyframes demo-fade-seq {
      0%   { opacity: 0; transform: scale(0.82); }
      15%  { opacity: 1; transform: scale(1); }
      55%  { opacity: 1; }
      70%  { opacity: 0; transform: scale(0.96); }
      100% { opacity: 0; }
    }
    /* Blank / hold demo */
    .demo-blank-ring {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: 1.5px solid rgba(255,255,255,0.18);
      position: relative;
      display: flex; align-items: center; justify-content: center;
    }
    .demo-blank-ring::after {
      content: '';
      width: 10px; height: 10px;
      border-radius: 50%;
      background: rgba(255,255,255,0.15);
      animation: demo-pulse 1.6s ease-in-out infinite;
    }
    /* Reappear / probe demo */
    .demo-probe-wrap {
      display: flex;
      gap: 10px;
      position: relative;
    }
    .demo-probe-sq {
      width: 32px; height: 32px;
      border-radius: 4px;
      border: 1.5px solid rgba(255,255,255,0.15);
      background: transparent;
    }
    .demo-probe-sq.colored {
      border: none;
      animation: demo-probe-color 2.4s ease-in-out infinite;
    }
    @keyframes demo-probe-color {
      0%,30% { background: #e74c3c; box-shadow: 0 0 14px rgba(231,76,60,0.45); }
      60%    { background: #27ae60; box-shadow: 0 0 14px rgba(39,174,96,0.45); }
      100%   { background: #f39c12; box-shadow: 0 0 14px rgba(243,156,18,0.45); }
    }
    /* Same/Diff response demo */
    .demo-keys {
      display: flex;
      gap: 16px;
    }
    .demo-key {
      padding: 8px 14px;
      border-radius: 5px;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    .demo-key.s { background: rgba(52,211,153,0.12); border: 1px solid rgba(52,211,153,0.35); color: #34d399; }
    .demo-key.d { background: rgba(248,113,113,0.12); border: 1px solid rgba(248,113,113,0.35); color: #f87171; }
    /* Distractor: colored + white squares */
    .demo-dist-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .demo-dist-sq {
      width: 30px; height: 30px;
      border-radius: 4px;
    }
    .demo-dist-sq.color { }
    .demo-dist-sq.white {
      background: #fff;
      box-shadow: 0 0 10px rgba(255,255,255,0.2);
    }
    /* Arrow / ANT demos */
    .demo-arrow-row {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .demo-arrow {
      font-size: 1.5rem;
      line-height: 1;
      color: #a1a1aa;
      transition: color 0.3s;
    }
    .demo-arrow.center {
      font-size: 1.9rem;
      color: #fff;
    }
    /* Cue circle */
    .demo-cue-circle {
      width: 48px; height: 48px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.55);
      animation: demo-cue-flash 1.8s ease-in-out infinite;
    }
    @keyframes demo-cue-flash {
      0%,100% { opacity: 0; transform: scale(0.7); }
      40%,60% { opacity: 1; transform: scale(1); }
    }
    /* Arrow ← → keys */
    .demo-lr-keys {
      display: flex;
      gap: 16px;
    }
    .demo-lr-key {
      padding: 8px 14px;
      border-radius: 5px;
      font-family: var(--font-mono);
      font-size: 13px;
      font-weight: 700;
    }
    .demo-lr-key.left  { background: rgba(52,211,153,0.12); border: 1px solid rgba(52,211,153,0.35); color: #34d399; }
    .demo-lr-key.right { background: rgba(248,113,113,0.12); border: 1px solid rgba(248,113,113,0.35); color: #f87171; }
    /* demo sub-text */
    .demo-caption {
      font-size: 0.72rem;
      color: #71717a;
      text-align: center;
      line-height: 1.5;
      margin-top: 4px;
      font-family: var(--font-mono);
      letter-spacing: 0.04em;
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

  // ─── Hover Demo Panel ────────────────────────────────────────────
  // Builds per-step mini visual demonstrations that appear after a
  // short dwell delay so they feel deliberate, not jumpy.

  const COLORS_POOL = [
    { bg: '#e74c3c', shadow: 'rgba(231,76,60,0.45)' },
    { bg: '#27ae60', shadow: 'rgba(39,174,96,0.45)' },
    { bg: '#f39c12', shadow: 'rgba(243,156,18,0.45)' },
    { bg: '#3498db', shadow: 'rgba(52,152,219,0.45)' },
    { bg: '#9b59b6', shadow: 'rgba(155,89,182,0.45)' },
  ];

  function colorSq(c) {
    return `<div class="demo-sq" style="background:${c.bg};box-shadow:0 0 14px ${c.shadow};"></div>`;
  }

  // Define stage HTML per task + step index
  function getDemoContent(task, idx) {
    if (task === 'vwm-pure') {
      const stages = [
        // Step 0: fixation cross
        `<div class="demo-fix">+</div><div class="demo-caption">Focus on the cross</div>`,
        // Step 1: colored squares flash
        `<div class="demo-squares">${COLORS_POOL.slice(0,3).map(colorSq).join('')}</div><div class="demo-caption">Memorize the colors</div>`,
        // Step 2: blank → probe
        `<div class="demo-blank-ring"></div><div class="demo-caption">Hold them in memory...</div>`,
        // Step 3: respond
        `<div class="demo-probe-wrap"><div class="demo-probe-sq"></div><div class="demo-probe-sq colored"></div><div class="demo-probe-sq"></div></div><div class="demo-keys"><div class="demo-key s">S Same</div><div class="demo-key d">D Diff</div></div>`,
      ];
      return stages[idx] || '';
    }
    if (task === 'vwm-distractor') {
      const stages = [
        // Step 0: colored + white squares
        `<div class="demo-dist-row">${colorSq(COLORS_POOL[0])}<div class="demo-dist-sq white"></div>${colorSq(COLORS_POOL[2])}<div class="demo-dist-sq white"></div>${colorSq(COLORS_POOL[3])}</div><div class="demo-caption">Colored = targets · White = ignore</div>`,
        // Step 1: focus only colored
        `<div class="demo-dist-row">${colorSq(COLORS_POOL[1])}<div class="demo-dist-sq white" style="opacity:0.25"></div>${colorSq(COLORS_POOL[4])}</div><div class="demo-caption">Ignore the white ones</div>`,
        // Step 2: blank hold
        `<div class="demo-blank-ring"></div><div class="demo-caption">Hold color items in memory</div>`,
        // Step 3: probe reappears
        `<div class="demo-probe-wrap"><div class="demo-probe-sq"></div><div class="demo-probe-sq colored"></div><div class="demo-probe-sq"></div></div><div class="demo-caption">One target reappears colored</div>`,
        // Step 4: decide
        `<div class="demo-keys"><div class="demo-key s">S Same</div><div class="demo-key d">D Diff</div></div><div class="demo-caption">Same or Different?</div>`,
        // Step 5: accuracy emphasis
        `<div class="demo-fix" style="font-size:2rem;color:var(--accent-volt);">✓</div><div class="demo-caption">Accuracy matters most</div>`,
      ];
      return stages[idx] || '';
    }
    if (task === 'ant') {
      const stages = [
        // Step 0: fixation cross
        `<div class="demo-fix">+</div><div class="demo-caption">Center fixation</div>`,
        // Step 1: cue circle flash
        `<div class="demo-cue-circle"></div><div class="demo-caption">Cue flash — watch for it</div>`,
        // Step 2: arrow appears
        `<div class="demo-arrow-row"><span class="demo-arrow">←</span><span class="demo-arrow">←</span><span class="demo-arrow center">←</span><span class="demo-arrow">←</span><span class="demo-arrow">←</span></div><div class="demo-caption">Arrow appears above/below center</div>`,
        // Step 3: center arrow
        `<div class="demo-arrow-row"><span class="demo-arrow" style="opacity:0.2">→</span><span class="demo-arrow" style="opacity:0.2">→</span><span class="demo-arrow center" style="color:var(--accent-volt)">→</span><span class="demo-arrow" style="opacity:0.2">→</span><span class="demo-arrow" style="opacity:0.2">→</span></div><div class="demo-caption">Judge only the CENTER arrow</div>`,
        // Step 4: key presses
        `<div class="demo-lr-keys"><div class="demo-lr-key left">← Left</div><div class="demo-lr-key right">Right →</div></div><div class="demo-caption">Use arrow keys to respond</div>`,
        // Step 5: speed
        `<div class="demo-fix" style="font-size:2rem;color:var(--accent-volt);">⚡</div><div class="demo-caption">As fast & accurate as possible</div>`,
      ];
      return stages[idx] || '';
    }
    return '';
  }

  // Inject the demo panel into the DOM (outside the card so it can be fixed)
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
