/* ============================================================
   Complete View — Assessment done (no scores shown)
   ============================================================ */

import { render } from '../utils/dom.js';
import { Storage } from '../utils/storage.js';
import { computeFullScores } from '../scoring/ScoringEngine.js';
import { injectStyle } from '../router.js';
import { t } from '../utils/i18n.js';
import { endSession } from '../utils/access.js';

export function CompleteView() {
  const session = Storage.getCurrentSession();
  let syncComplete = false;

  const performSync = async () => {
    if (session?.trials?.length) {
      try {
        const scores = computeFullScores(session.trials);
        await Storage.saveCandidate({
          name: session.name,
          email: session.email,
          age: session.age,
          handle: session.handle,
          companyId: 'public',
          startedAt: session.startedAt,
          completedAt: new Date().toISOString(),
          trials: session.trials,
          metadata: session.metadata,
          scores,
        });
        Storage.clearCurrentSession();
        syncComplete = true;
        endSession('complete');
        
        // Update DOM status
        const statusVal = document.querySelector('.cv-row-val');
        if (statusVal) statusVal.innerHTML = `<span class="cv-dot"></span> ${t('cv_submit')}`;
      } catch (err) {
        console.error('Scoring/Sync error', err);
      }
    }
  };

  performSync();

  const id = 'CS-' + Date.now().toString(36).toUpperCase().slice(-6) + '-' + Math.random().toString(36).slice(2,6).toUpperCase();

  const scores = session?.trials ? computeFullScores(session.trials) : null;
  const overallAccuracy = scores ? Math.round(scores.accuracyPure * 100) : 0; // fallback to pure accuracy for simple display

  render(`
    <div class="view cv">
      <!-- Floating particles -->
      <div class="cv-particles" aria-hidden="true">
        ${Array.from({length:24}, (_,i) => `
          <div class="cv-particle" style="
            left:${Math.random()*100}%;
            top:${Math.random()*100}%;
            width:${3+Math.random()*4}px;
            height:${3+Math.random()*4}px;
            animation-delay:${Math.random()*4}s;
            animation-duration:${4+Math.random()*5}s;
            background:${i%3===0?'#d4ff00':i%3===1?'#8aff00':'#aaff00'};
          "></div>
        `).join('')}
      </div>

      <!-- Glowing background orbs -->
      <div class="cv-orb cv-orb-1"></div>
      <div class="cv-orb cv-orb-2"></div>

      <div class="cv-body">
        <svg class="cv-ring" width="100" height="100" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="46" stroke="url(#cvGrad)" stroke-width="2.5" fill="rgba(212,255,0,0.05)"/>
          <path d="M30 50L44 64L70 38" stroke="url(#cvGrad)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="cv-path"/>
          <defs>
            <linearGradient id="cvGrad" x1="0" y1="0" x2="100" y2="100">
              <stop offset="0%" stop-color="#d4ff00"/>
              <stop offset="100%" stop-color="#8aff00"/>
            </linearGradient>
          </defs>
        </svg>

        <h1 class="cv-heading">${t('cv_title')}</h1>
        <p class="cv-message" style="color:var(--text-primary); font-size:1.15rem; font-weight:500; margin-bottom:-10px;">
          ${t('cv_acc', { acc: overallAccuracy })}
        </p>
        <p class="cv-message">
          ${t('cv_msg')}
        </p>

        ${renderCandidateRaw(session?.trials || [])}

        <div class="cv-history">
          <h3 class="cv-summary-title">${t('cv_history_title')}</h3>
          <div class="cv-history-list">
            ${Storage.getLocalHistory().map(h => `
              <div class="cv-history-item">
                <span class="cv-hist-date">${new Date(h.completedAt).toLocaleDateString()}</span>
                <span class="cv-hist-score">Comp: <strong>${(h.scores?.compositeScore || 0).toFixed(1)}</strong></span>
                <span class="cv-hist-acc">Acc: <strong>${Math.round((h.scores?.accuracyPure || 0) * 100)}%</strong></span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="cv-receipt">
          <div class="cv-row">
            <span class="cv-row-label">${t('cv_status')}</span>
            <span class="cv-row-val">
              <span class="cv-dot"></span> Pending...
            </span>
          </div>
          <div class="cv-row">
            <span class="cv-row-label">${t('cv_candidate')}</span>
            <span class="cv-row-val">${session?.name || '—'}</span>
          </div>
          <div class="cv-row">
            <span class="cv-row-label">${t('cv_tasks')}</span>
            <span class="cv-row-val">3 / 3 ✓</span>
          </div>
          <div class="cv-row">
            <span class="cv-row-label">${t('cv_id')}</span>
            <span class="cv-row-val mono">${id}</span>
          </div>
        </div>

        <p class="cv-footer">
          ${t('cv_close')}
        </p>
      </div>
    </div>

  `);

  injectStyle(`
    /* ── Complete screen — volt-green dark theme ─────────────── */
    .cv {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      padding: 40px 24px;
      position: relative; overflow: hidden;
      background:
        radial-gradient(ellipse 70% 55% at 50% -5%, rgba(212,255,0,0.08) 0%, transparent 60%),
        radial-gradient(ellipse 50% 45% at 90% 90%, rgba(138,255,0,0.05) 0%, transparent 55%);
    }
    /* Animated grid — same as admin gate */
    .cv::before {
      content:''; position:absolute; inset:0;
      background-image:
        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 48px 48px;
      animation: cv-grid-drift 22s linear infinite;
      pointer-events:none; z-index:0;
    }
    @keyframes cv-grid-drift {
      from { background-position: 0 0; }
      to   { background-position: 48px 48px; }
    }
    /* Glowing orbs */
    .cv-orb {
      position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none; opacity:0.28;
      animation: cv-orb-float ease-in-out infinite alternate;
    }
    .cv-orb-1 { width:320px; height:320px; top:-60px; left:-80px; background:#d4ff00; animation-duration:9s; }
    .cv-orb-2 { width:240px; height:240px; bottom:-50px; right:-50px; background:#8aff00; animation-duration:11s; }
    @keyframes cv-orb-float {
      from { transform: translate(0,0) scale(1); }
      to   { transform: translate(10px,16px) scale(1.05); }
    }

    .cv-particles { position: fixed; inset: 0; pointer-events: none; z-index:0; }
    .cv-particle  {
      position: absolute; border-radius: 50%; opacity: 0;
      animation: cvFloat ease-in-out infinite;
    }
    @keyframes cvFloat {
      0%   { opacity:0; transform:scale(0) translateY(0); }
      50%  { opacity:0.4; transform:scale(1) translateY(-50px); }
      100% { opacity:0; transform:scale(0) translateY(-100px); }
    }

    .cv-body {
      max-width: 500px; width: 100%;
      text-align: center;
      display: flex; flex-direction: column; align-items: center; gap: 28px;
      position: relative; z-index: 1;
    }
    .cv-ring { animation: scale-in 0.5s ease-out; }
    .cv-path { stroke-dasharray: 70; stroke-dashoffset: 70; animation: drawPath 0.6s ease-out 0.4s forwards; }
    @keyframes drawPath { to { stroke-dashoffset: 0; } }

    .cv-heading {
      font-size: 2.4rem;
      background: linear-gradient(135deg, #d4ff00 20%, #aaff00 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .cv-message {
      color: var(--text-secondary); font-size: 1.05rem; line-height: 1.75;
    }
    .cv-receipt {
      width: 100%;
      background: rgba(13,13,18,0.7);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(212,255,0,0.12);
      border-radius: 16px;
      padding: 8px 24px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04);
    }
    .cv-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 0;
      border-bottom: 1px solid rgba(212,255,0,0.06);
    }
    .cv-row:last-child { border-bottom: none; }
    .cv-row-label { font-size: 13px; color: var(--text-tertiary); font-family: var(--font-mono); letter-spacing: 0.04em; }
    .cv-row-val   {
      font-size: 13px; color: var(--text-primary); font-weight: 500;
      display: flex; align-items: center; gap: 8px;
    }
    .cv-row-val.mono { font-family: var(--font-mono); font-size: 12px; color: #d4ff00; }
    .cv-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #d4ff00;
      box-shadow: 0 0 10px rgba(212,255,0,0.6);
      animation: pulse-glow 2s infinite;
    }
    .cv-footer { font-size: 0.85rem; color: var(--text-tertiary); }

    .cv-summary-card {
      width: 100%;
      background: rgba(212,255,0,0.03);
      border: 1px solid rgba(212,255,0,0.08);
      border-radius: 16px;
      padding: 24px;
      text-align: left;
    }
    .cv-summary-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-tertiary);
      margin-bottom: 20px;
      font-family: var(--font-mono);
    }
    .cv-summary-grid { display: flex; flex-direction: column; gap: 16px; }
    .cv-summary-item { padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .cv-summary-item:last-child { border-bottom: none; padding-bottom: 0; }
    .cs-label { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary); }
    .cs-metrics { display: flex; gap: 24px; }
    .cs-m { font-family: var(--font-mono); font-size: 12px; }
    .cs-m span { color: var(--text-tertiary); margin-right: 6px; }
    .cs-m strong { color: #d4ff00; }

    .cv-history { width: 100%; margin-top: 12px; text-align: left; }
    .cv-history-list { display: flex; flex-direction: column; gap: 8px; }
    .cv-history-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 16px;
      background: rgba(212,255,0,0.03);
      border: 1px solid rgba(212,255,0,0.07);
      border-radius: 8px;
      font-family: var(--font-mono); font-size: 11px;
    }
    .cv-hist-date { color: var(--text-tertiary); }
    .cv-hist-score strong { color: #d4ff00; }
    .cv-hist-acc strong { color: #8aff00; }

    /* Raw performance summary */
    .cv-raw-card {
      width: 100%; text-align: left;
      background: rgba(13,13,18,0.7);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(212,255,0,0.1);
      border-radius: 16px; padding: 24px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }
    .cv-raw-glance {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 10px; margin-bottom: 24px;
    }
    .cv-raw-stat {
      background: rgba(212,255,0,0.04);
      border: 1px solid rgba(212,255,0,0.1);
      border-radius: 10px; padding: 12px 14px;
      transition: border-color 0.15s;
    }
    .cv-raw-stat:hover { border-color: rgba(212,255,0,0.22); }
    .cv-raw-stat-label { font-size: 10px; color: var(--text-tertiary); font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
    .cv-raw-stat-val   { font-family: var(--font-display); font-size: 1.35rem; font-weight: 700; color: #d4ff00; }
    .cv-sparkline { display: flex; align-items: flex-end; gap: 2px; height: 60px; }
    .cv-spark-bar { flex: 1; border-radius: 2px 2px 0 0; min-height: 3px; opacity: 0.85; }
    .cv-spark-legend { display: flex; gap: 14px; margin-top: 8px; }
    .cv-spark-leg-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-tertiary); }
    .cv-spark-leg-dot { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
  `);
}

/* ---- Raw performance summary shown to the candidate after completing ---- */
function renderCandidateRaw(trials) {
  if (!trials.length) return '';

  const correct = trials.filter(t => t.isCorrect).length;
  const acc     = (correct / trials.length * 100).toFixed(0);
  const rtVals  = trials.filter(t => t.isCorrect && t.reactionTimeMs > 0).map(t => t.reactionTimeMs);
  const avgRT   = rtVals.length ? Math.round(rtVals.reduce((a,b)=>a+b,0)/rtVals.length) : 0;
  const fastRT  = rtVals.length ? Math.min(...rtVals) : 0;
  const slowRT  = rtVals.length ? Math.max(...rtVals) : 0;
  let maxStreak = 0, streak = 0;
  trials.forEach(t => { if (t.isCorrect) { streak++; maxStreak = Math.max(maxStreak, streak); } else streak = 0; });

  const accColor = acc >= 70 ? '#34d399' : acc >= 50 ? '#fbbf24' : '#f87171';

  const stats = [
    { label: 'Total trials',      val: trials.length,           color: '' },
    { label: 'Overall accuracy',  val: acc + '%',               color: accColor },
    { label: 'Avg response time', val: avgRT + 'ms',            color: '' },
    { label: 'Fastest correct',   val: fastRT.toFixed(2) + 'ms',         color: '#34d399' },
    { label: 'Slowest correct',   val: slowRT.toFixed(2) + 'ms',         color: '#fbbf24' },
    { label: 'Best streak',       val: maxStreak + ' in a row', color: '' },
  ];

  const glanceHtml = stats.map(s =>
    '<div class="cv-raw-stat">' +
    '<div class="cv-raw-stat-label">' + s.label + '</div>' +
    '<div class="cv-raw-stat-val"' + (s.color ? ' style="color:' + s.color + '"' : '') + '>' + s.val + '</div>' +
    '</div>'
  ).join('');

  // Cap the y-axis scaling at 1500ms so that occasional long responses or timeouts (e.g. 6000ms / 1200ms)
  // do not squash the rest of the graph. Any response time >= 1500ms will be drawn at full height.
  const maxRT = Math.min(1500, Math.max(...trials.map(t => t.reactionTimeMs || 0), 1));
  const sparkBars = trials.map((t, i) => {
    const rt = t.reactionTimeMs || 0;
    const h  = Math.max(4, (Math.min(rt, maxRT) / maxRT) * 100);
    const bg = t.isCorrect ? 'rgba(52,211,153,0.75)' : 'rgba(248,113,113,0.65)';
    return '<div class="cv-spark-bar" style="height:' + h + '%;background:' + bg + ';" title="Trial ' + (i+1) + ': ' + (t.isCorrect ? 'correct' : 'incorrect') + ' ' + rt + 'ms"></div>';
  }).join('');

  return (
    '<div class="cv-raw-card">' +
    '<div class="cv-summary-title" style="margin-bottom:16px;">Your Performance</div>' +
    '<div class="cv-raw-glance">' + glanceHtml + '</div>' +
    '<div class="cv-summary-title" style="margin-bottom:8px;">Response Time — Trial by Trial</div>' +
    '<div style="font-size:11px;color:var(--text-tertiary);margin-bottom:8px;">Each bar = one trial. Green = correct, red = incorrect. Height = how long you took.</div>' +
    '<div class="cv-sparkline">' + sparkBars + '</div>' +
    '<div class="cv-spark-legend">' +
    '<div class="cv-spark-leg-item"><div class="cv-spark-leg-dot" style="background:rgba(52,211,153,0.75)"></div>Correct</div>' +
    '<div class="cv-spark-leg-item"><div class="cv-spark-leg-dot" style="background:rgba(248,113,113,0.65)"></div>Incorrect</div>' +
    '</div>' +
    '</div>'
  );
}
