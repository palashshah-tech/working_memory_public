/* ============================================================
   PDF Report Builder — matches Xiberlinc "Cognitive Performance
   Profile" reference design. All numbers are computed live from
   candidate.trials (raw data), not from pre-computed c.scores,
   except where noted as illustrative/placeholder.
   ============================================================ */

import { t } from './i18n.js';

/* ---------------------------------------------------------------
   DATA COMPUTATION — proper Cowan's K from raw trials
   K = N * (hitRate - falseAlarmRate)
   hit = isChange true & correct | miss = isChange true & incorrect
   falseAlarm = isChange false & incorrect | correctRejection = isChange false & correct
--------------------------------------------------------------- */
function computeVWMStats(trials, taskType) {
  const stage = trials.filter(t => t.taskType === taskType);
  const bySetSize = {};
  stage.forEach(tr => {
    const key = tr.setSize;
    if (!bySetSize[key]) bySetSize[key] = { hits: 0, misses: 0, fa: 0, cr: 0, rts: [], total: 0 };
    const b = bySetSize[key];
    b.total++;
    if (tr.isChange && tr.isCorrect) b.hits++;
    else if (tr.isChange && !tr.isCorrect) b.misses++;
    else if (!tr.isChange && !tr.isCorrect) b.fa++;
    else if (!tr.isChange && tr.isCorrect) b.cr++;
    if (tr.isCorrect && tr.reactionTimeMs) b.rts.push(tr.reactionTimeMs);
  });

  const setSizes = Object.keys(bySetSize).map(Number).sort((a, b) => a - b);
  const curve = setSizes.map(size => {
    const b = bySetSize[size];
    const hitRate = (b.hits + b.misses) ? b.hits / (b.hits + b.misses) : 0;
    const faRate = (b.fa + b.cr) ? b.fa / (b.fa + b.cr) : 0;
    const k = Math.max(0, size * (hitRate - faRate));
    const acc = b.total ? (b.hits + b.cr) / b.total : 0;
    const avgRT = b.rts.length ? b.rts.reduce((a, x) => a + x, 0) / b.rts.length : 0;
    return { setSize: size, k, hitRate, faRate, accuracy: acc, avgRT, trials: b.total };
  });

  const correctRts = stage.filter(tr => tr.isCorrect && tr.reactionTimeMs).map(tr => tr.reactionTimeMs);
  const overallAcc = stage.length ? stage.filter(tr => tr.isCorrect).length / stage.length : 0;
  const avgRT = correctRts.length ? correctRts.reduce((a, b) => a + b, 0) / correctRts.length : 0;
  const fastest = correctRts.length ? Math.min(...correctRts) : 0;
  const slowest = correctRts.length ? Math.max(...correctRts) : 0;
  let maxStreak = 0, streak = 0;
  stage.forEach(tr => { if (tr.isCorrect) { streak++; maxStreak = Math.max(maxStreak, streak); } else streak = 0; });
  const maxSetSize = setSizes.length ? Math.max(...setSizes) : 0;
  const maxK = curve.length ? Math.max(...curve.map(c => c.k)) : 0;

  return { curve, overallAcc, avgRT, fastest, slowest, maxStreak, maxSetSize, maxK, totalTrials: stage.length, trialsChrono: stage };
}

function computeANTStats(trials) {
  const ant = trials.filter(t => t.taskType === 'ant');
  const byCue = {}, byFlanker = {};
  ant.forEach(tr => {
    if (!byCue[tr.cueType]) byCue[tr.cueType] = { rts: [], correct: 0, total: 0 };
    byCue[tr.cueType].total++;
    if (tr.isCorrect) { byCue[tr.cueType].correct++; if (tr.reactionTimeMs) byCue[tr.cueType].rts.push(tr.reactionTimeMs); }
    if (!byFlanker[tr.flankerType]) byFlanker[tr.flankerType] = { rts: [], correct: 0, total: 0 };
    byFlanker[tr.flankerType].total++;
    if (tr.isCorrect) { byFlanker[tr.flankerType].correct++; if (tr.reactionTimeMs) byFlanker[tr.flankerType].rts.push(tr.reactionTimeMs); }
  });
  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const accOf = obj => obj && obj.total ? obj.correct / obj.total : 0;

  const rtNone = avg(byCue['none']?.rts || []);
  const rtCenter = avg(byCue['center']?.rts || []);
  const rtDouble = avg(byCue['double']?.rts || []);
  const rtSpatial = avg(byCue['spatial']?.rts || []);
  const rtCongruent = avg(byFlanker['congruent']?.rts || []);
  const rtIncongruent = avg(byFlanker['incongruent']?.rts || []);
  const accCongruent = accOf(byFlanker['congruent']);
  const accIncongruent = accOf(byFlanker['incongruent']);
  const accNone = accOf(byCue['none']);
  const accCenter = accOf(byCue['center']);
  const accSpatial = accOf(byCue['spatial']);

  const alerting = rtNone - rtCenter;
  const orienting = rtCenter - rtSpatial;
  const executive = rtIncongruent - rtCongruent;

  return {
    alerting, orienting, executive,
    rtByCue: [
      { cue: 'None', rt: rtNone },
      { cue: 'Center', rt: rtCenter },
      { cue: 'Double', rt: rtDouble },
      { cue: 'Spatial', rt: rtSpatial },
    ],
    rtCongruent, rtIncongruent, accCongruent, accIncongruent,
    // efficiency = accuracy / RT(seconds), classic r/s throughput measure
    effCongruent: rtCongruent ? accCongruent / (rtCongruent / 1000) : 0,
    effIncongruent: rtIncongruent ? accIncongruent / (rtIncongruent / 1000) : 0,
    effAlerting: alerting ? ((accCenter - accNone) / (alerting / 1000)) : 0,
    effOrienting: orienting ? ((accSpatial - accCenter) / (orienting / 1000)) : 0,
    effExecutive: executive ? ((accCongruent - accIncongruent) / (executive / 1000)) : 0,
    totalTrials: ant.length,
    overallAcc: ant.length ? ant.filter(tr => tr.isCorrect).length / ant.length : 0,
    trialsChrono: ant,
  };
}

function scoreColor(score) {
  if (score >= 70) return '#50A87F';
  if (score >= 40) return '#D4A030';
  return '#D44040';
}
function scoreLabel(score) {
  if (score >= 90) return 'Exceptional';
  if (score >= 70) return 'Strong';
  if (score >= 50) return 'Above Average';
  if (score >= 30) return 'Average';
  return 'Developing';
}
// Component scores (0-100) don't have a true norm-referenced percentile without
// a population sample, so the score itself is shown as an illustrative percentile.
function pseudoPercentile(score) { return Math.round(score); }
function stripTags(html) { return (html || '').replace(/<[^>]*>/g, ''); }

/* ---------------------------------------------------------------
   HTML FRAGMENT BUILDERS
--------------------------------------------------------------- */
function metricCardHTML({ label, value, unit = '', accent = '#E95295', sub = '', highlight = false }) {
  return `
    <div class="mc ${highlight ? 'mc-hl' : ''}" style="${highlight ? `border-color:${accent}55;box-shadow:0 2px 12px ${accent}18;` : ''}">
      <div class="mc-label">${label}</div>
      <div class="mc-val-row">
        <span class="mc-val" style="${highlight ? `color:${accent}` : ''}">${value}</span>
        ${unit ? `<span class="mc-unit">${unit}</span>` : ''}
      </div>
      ${sub ? `<div class="mc-sub">${sub}</div>` : ''}
    </div>
  `;
}

function whatYouDidBoxHTML(accent, bgTint, bodyHtml) {
  return `
    <div class="wyd-box" style="background:${bgTint}; border-color:${accent}22;">
      <div class="wyd-title" style="color:${accent};">WHAT YOU DID IN THIS TASK</div>
      <div class="wyd-body">${bodyHtml}</div>
    </div>
  `;
}

function interpretBoxHTML(accent, title, bodyHtml) {
  return `
    <div class="ibox" style="border-left-color:${accent};">
      <div class="ibox-title" style="color:${accent};">${title}</div>
      <div class="ibox-body">${bodyHtml}</div>
    </div>
  `;
}

function glossaryHTML(accent, items) {
  return `
    <div class="glossary-title">PLAIN-LANGUAGE GLOSSARY</div>
    <div class="glossary-grid">
      ${items.map(it => `
        <div class="glossary-card">
          <div class="glossary-term" style="color:${accent};">${it.term}</div>
          <div class="glossary-def">${it.def}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function sectionHeaderHTML(number, label, title, accent, description) {
  return `
    <div class="sec-header">
      <div class="sec-rule" style="background:linear-gradient(90deg, ${accent} 0%, ${accent}00 100%);"></div>
      <div class="sec-header-row">
        <div class="sec-number" style="color:${accent}14;">${number}</div>
        <div class="sec-header-text">
          <div class="sec-label" style="color:${accent};">${label}</div>
          <h2 class="sec-title">${title}</h2>
          <p class="sec-desc">${description}</p>
        </div>
      </div>
    </div>
  `;
}

function barChartHTML(title, sub, items, accent, valueFmt, refLine) {
  const max = Math.max(...items.map(i => i.val), refLine || 0, 1) * 1.05;
  return `
    <div class="chart-panel">
      <div class="chart-title">${title}</div>
      <div class="chart-sub">${sub}</div>
      <div class="chart-area">
        ${refLine != null ? `<div class="ref-line" style="bottom:${(refLine / max) * 100}%; border-color:${accent};"><span class="ref-line-label" style="color:${accent};">${valueFmt(refLine)}</span></div>` : ''}
        <div class="chart">
          ${items.map(i => `
            <div class="chart-col">
              <div class="chart-val">${valueFmt(i.val)}</div>
              <div class="chart-fill" style="height:${Math.max(3, (i.val / max) * 100)}%; background:${i.color || accent};"></div>
              <div class="chart-lbl">${i.label}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function comparisonBarChartHTML(title, sub, labels, seriesA, seriesB, colorA, colorB, nameA, nameB, valueFmt) {
  const max = Math.max(...seriesA, ...seriesB, 1) * 1.05;
  return `
    <div class="chart-panel">
      <div class="chart-title">${title}</div>
      <div class="chart-sub">${sub}</div>
      <div class="legend-row">
        <span class="legend-item"><span class="legend-dot" style="background:${colorA};"></span>${nameA}</span>
        <span class="legend-item"><span class="legend-dot" style="background:${colorB};"></span>${nameB}</span>
      </div>
      <div class="chart">
        ${labels.map((lbl, i) => `
          <div class="chart-col chart-col-pair">
            <div class="pair-bars">
              <div class="pair-bar" style="height:${Math.max(3, (seriesA[i] / max) * 100)}%; background:${colorA};" title="${valueFmt(seriesA[i])}"></div>
              <div class="pair-bar" style="height:${Math.max(3, (seriesB[i] / max) * 100)}%; background:${colorB};" title="${valueFmt(seriesB[i])}"></div>
            </div>
            <div class="chart-lbl">${lbl}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function sparklineHTML(title, trialsChrono, labelEvery = 5) {
  if (!trialsChrono.length) return '';
  const maxRT = Math.min(2000, Math.max(...trialsChrono.map(t => t.reactionTimeMs || 0), 1));
  return `
    <div class="chart-panel">
      <div class="chart-title">${title} — TRIAL BY TRIAL (${trialsChrono.length} TRIALS)</div>
      <div class="chart-sub"><span style="color:#50A87F;font-weight:700;">Green = correct</span>, <span style="color:#D44040;font-weight:700;">red = incorrect</span>. Taller bars = slower response.</div>
      <div class="spark">
        ${trialsChrono.map((tr, i) => {
          const rt = tr.reactionTimeMs || 0;
          const h = Math.max(3, (Math.min(rt, maxRT) / maxRT) * 100);
          return `<div class="spark-bar" style="height:${h}%; background:${tr.isCorrect ? '#50A87F' : '#D44040'};" title="Trial ${i + 1}: ${tr.isCorrect ? 'correct' : 'incorrect'}, ${rt.toFixed(0)}ms"></div>`;
        }).join('')}
      </div>
      <div class="spark-axis">
        ${trialsChrono.map((_, i) => (i === 0 || (i + 1) % labelEvery === 0) ? `<span style="left:${(i / (trialsChrono.length - 1)) * 100}%;">#${i + 1}</span>` : '').join('')}
      </div>
    </div>
  `;
}

function compositeGaugeHTML(score) {
  const size = 180, sw = 14, r = (size - sw) / 2;
  const circumference = 2 * Math.PI * r;
  const arc = 0.75;
  const dashArray = circumference * arc;
  const offset = circumference * (1 - arc * (Math.min(100, score) / 100));
  return `
    <div class="gauge-wrap">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(135deg);">
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#EBEBEB" stroke-width="${sw}"
          stroke-dasharray="${dashArray} ${circumference}" stroke-linecap="round" />
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="url(#gaugeGrad)" stroke-width="${sw}"
          stroke-dasharray="${dashArray - offset} ${circumference}" stroke-linecap="round" />
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#E95295" /><stop offset="50%" stop-color="#D4A030" /><stop offset="100%" stop-color="#50A87F" />
          </linearGradient>
        </defs>
      </svg>
      <div class="gauge-center">
        <span class="gauge-score">${score.toFixed(1)}</span>
        <span class="gauge-label">COMPOSITE</span>
      </div>
    </div>
  `;
}

function footerHTML(sectionLabel, reportId) {
  return `
    <div class="page-footer">
      <div>Xiberlinc · Cognitive Performance Profile</div>
      <div>${sectionLabel} · ${reportId}</div>
    </div>
  `;
}

/* ---------------------------------------------------------------
   MAIN BUILDER
--------------------------------------------------------------- */
function buildReportHTML(c) {
  const trials = c.trials || [];
  const s = c.scores || {};
  const pure = computeVWMStats(trials, 'vwm-pure');
  const dist = computeVWMStats(trials, 'vwm-distractor');
  const ant = computeANTStats(trials);

  const composite = s.compositeScore || 0;
  const reportId = 'XBL-' + (c.completedAt ? new Date(c.completedAt).toISOString().slice(0, 10).replace(/-/g, '') : '00000000') +
    '-' + (c.name || 'CAND').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
  const assessDate = c.completedAt ? new Date(c.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  const completedTime = c.completedAt ? new Date(c.completedAt).toLocaleTimeString('en-US') : '—';
  const candFirst = (c.name || 'The candidate').split(' ')[0];

  const componentScores = s.componentScores ? [
    { name: "Cowan's K", short: 'CowanK', score: s.componentScores.kPure || 0 },
    { name: "Cowan's K (Dist.)", short: 'CowanK(D)', score: s.componentScores.kDistractor || 0 },
    { name: 'Max N', short: 'MaxN', score: s.componentScores.maxSetSize || 0 },
    { name: 'RT Efficiency', short: 'RT Eff', score: s.componentScores.rtEfficiency || 0 },
    { name: 'Alerting', short: 'Alert', score: s.componentScores.alerting || 0 },
    { name: 'Orienting', short: 'Orient', score: s.componentScores.orienting || 0 },
    { name: 'Executive', short: 'Exec', score: s.componentScores.executive || 0 },
  ] : [];

  const execEfficiency = pure.maxK ? ((dist.maxK - pure.maxK) / pure.maxK) * 100 : 0;
  const execSpeed = pure.avgRT - dist.avgRT; // positive = faster with distractors
  const distDrop = (pure.overallAcc - dist.overallAcc) * 100;

  // Sort component scores to pick strengths / development areas (top 4 / bottom 3)
  const sortedScores = [...componentScores].sort((a, b) => b.score - a.score);
  const strengths = sortedScores.slice(0, Math.min(4, sortedScores.length));
  const developing = sortedScores.slice(-Math.min(3, sortedScores.length)).reverse();

  /* ---------------- SECTION 1 ---------------- */
  const sec1 = `
  <div class="section">
    ${sectionHeaderHTML('01', 'SECTION ONE', 'Working Memory Capacity', '#E95295',
      'How many things can you hold in your visual memory at once? This section measures the raw size of your visual short-term memory — without any extra distractions.')}

    ${whatYouDidBoxHTML('#E95295', '#FDF3F7', stripTags(t('t1_sum')) + ' ' + stripTags(t('t1_s2')) + ' ' + stripTags(t('t1_s3')))}

    <div class="mc-grid">
      ${metricCardHTML({ label: "Cowan's K", value: pure.maxK.toFixed(1), accent: '#E95295', sub: 'Memory capacity estimate', highlight: true })}
      ${metricCardHTML({ label: 'Max Set Size', value: 'N=' + pure.maxSetSize, accent: '#E95295', sub: 'Largest array tested' })}
      ${metricCardHTML({ label: 'Avg. Reaction Time', value: pure.avgRT.toFixed(0), unit: 'ms', accent: '#E95295', sub: 'Mean across correct trials' })}
      ${metricCardHTML({ label: 'Overall Accuracy', value: (pure.overallAcc * 100).toFixed(0), unit: '%', accent: '#E95295', sub: pure.totalTrials + ' trials total' })}
    </div>
    <div class="mc-grid mc-grid-3">
      ${metricCardHTML({ label: 'Fastest Correct', value: pure.fastest.toFixed(0), unit: 'ms', accent: '#E95295', sub: 'Quickest correct response' })}
      ${metricCardHTML({ label: 'Slowest Correct', value: pure.slowest.toFixed(0), unit: 'ms', accent: '#E95295', sub: 'Most deliberate correct response' })}
      ${metricCardHTML({ label: 'Best Streak', value: pure.maxStreak, unit: 'in a row', accent: '#E95295', sub: 'Consecutive correct trials' })}
    </div>

    <div class="chart-grid-2">
      ${barChartHTML('MEMORY CAPACITY (COWAN\'S K) BY NUMBER OF SQUARES', 'Higher bars = more items held in memory.',
        pure.curve.map(pt => ({ label: 'N=' + pt.setSize, val: pt.k, color: pt.k >= pure.maxK * 0.9 ? '#E95295' : '#F3B8CE' })),
        '#E95295', v => v.toFixed(1), pure.maxK)}
      ${barChartHTML('ACCURACY BY NUMBER OF SQUARES', 'The dashed line (50%) = random guessing. Above it = genuine memory.',
        pure.curve.map(pt => ({ label: 'N=' + pt.setSize, val: pt.accuracy * 100, color: pt.accuracy >= 0.7 ? '#E95295' : pt.accuracy >= 0.5 ? '#F3B8CE' : '#DDD' })),
        '#E95295', v => Math.round(v) + '%', 50)}
    </div>

    ${sparklineHTML('RESPONSE SPEED', pure.trialsChrono)}

    ${glossaryHTML('#E95295', [
      { term: "Cowan's K", def: "Your memory 'size' — how many items your brain can hold in mind at once. Think of it as the number of slots on your mental whiteboard. Most people have 3–4 slots." },
      { term: 'Set Size (N)', def: 'The number of coloured squares shown in a single trial. N=1 is one square; N=8 is eight squares at once.' },
    ])}

    ${interpretBoxHTML('#E95295', 'WHAT THESE RESULTS MEAN', `
      ${candFirst}'s visual memory capacity — measured as <strong>Cowan's K = ${pure.maxK.toFixed(1)}</strong> — reached its peak around set size ${pure.curve.find(c => c.k === pure.maxK)?.setSize || pure.maxSetSize}.
      Accuracy stayed strongest at lower set sizes and declined as more items were added, which is the expected pattern for visual working memory: a hard capacity limit rather than a gradual one.
      Overall accuracy across all ${pure.totalTrials} trials in this stage was <strong>${(pure.overallAcc * 100).toFixed(0)}%</strong>, with a best streak of ${pure.maxStreak} consecutive correct trials.
      <em>[Placeholder: deeper narrative synthesis of this candidate's memory profile would be generated here.]</em>
    `)}

    ${footerHTML('Section 01 / 03', reportId)}
  </div>
  `;

  /* ---------------- SECTION 2 ---------------- */
  const sec2 = `
  <div class="section">
    ${sectionHeaderHTML('02', 'SECTION TWO', 'Working Memory Filtering', '#50A87F',
      "Can your brain hold onto important information while surrounded by irrelevant distractions? This section adds 'decoy' squares to the memory test — and measures how well you filtered them out.")}

    ${whatYouDidBoxHTML('#50A87F', '#F2FAF6', stripTags(t('t2_sum')) + ' ' + stripTags(t('t2_s2')) + ' ' + stripTags(t('t2_s5')))}

    <div class="mc-grid">
      ${metricCardHTML({ label: "Cowan's K (Distractor)", value: dist.maxK.toFixed(1), accent: '#50A87F', sub: 'Memory capacity under load', highlight: true })}
      ${metricCardHTML({ label: 'Overall Accuracy', value: (dist.overallAcc * 100).toFixed(0), unit: '%', accent: '#50A87F', sub: dist.totalTrials + ' trials total' })}
      ${metricCardHTML({ label: 'Executive Efficiency', value: execEfficiency.toFixed(1), unit: '%', accent: '#50A87F', sub: 'Distractor filtering ability' })}
      ${metricCardHTML({ label: 'Executive Speed', value: (execSpeed >= 0 ? '−' : '+') + Math.abs(execSpeed).toFixed(0), unit: 'ms', accent: '#50A87F', sub: execSpeed >= 0 ? 'Faster with distractors' : 'Slower with distractors' })}
    </div>

    <div class="change-panel">
      <div class="change-val" style="color:${(dist.maxK - pure.maxK) >= 0 ? '#50A87F' : '#D44040'};">${(dist.maxK - pure.maxK) >= 0 ? '+' : ''}${(dist.maxK - pure.maxK).toFixed(1)}</div>
      <div class="change-label">CHANGE IN MEMORY CAPACITY</div>
      <div class="change-text">
        ${candFirst}'s memory capacity ${(dist.maxK - pure.maxK) >= 0 ? 'increased' : 'decreased'} by ${Math.abs(dist.maxK - pure.maxK).toFixed(1)} points when decoy squares were added
        (K=${pure.maxK.toFixed(1)} → K=${dist.maxK.toFixed(1)}).
        <em>[Placeholder: additional interpretive context on this pattern would be generated here.]</em>
      </div>
      <div class="change-boxes">
        <div class="change-box">${pure.maxK.toFixed(1)}<span>TASK 1</span></div>
        <div class="change-arrow">→</div>
        <div class="change-box" style="border-color:#50A87F55;color:#50A87F;">${dist.maxK.toFixed(1)}<span>TASK 2</span></div>
      </div>
    </div>

    <div class="chart-grid-2">
      ${comparisonBarChartHTML('MEMORY CAPACITY: TASK 1 VS TASK 2', 'Pink = Task 1 (no distractors) · Green = Task 2 (with distractors)',
        Array.from(new Set([...pure.curve.map(c => c.setSize), ...dist.curve.map(c => c.setSize)])).sort((a, b) => a - b).map(n => 'N=' + n),
        Array.from(new Set([...pure.curve.map(c => c.setSize), ...dist.curve.map(c => c.setSize)])).sort((a, b) => a - b).map(n => pure.curve.find(c => c.setSize === n)?.k || 0),
        Array.from(new Set([...pure.curve.map(c => c.setSize), ...dist.curve.map(c => c.setSize)])).sort((a, b) => a - b).map(n => dist.curve.find(c => c.setSize === n)?.k || 0),
        '#E95295', '#50A87F', 'Task 1 (Pure)', 'Task 2 (Distractor)', v => v.toFixed(1))}
      ${comparisonBarChartHTML('ACCURACY COMPARISON: TASK 1 VS TASK 2', 'How accuracy held up with distractors present.',
        Array.from(new Set([...pure.curve.map(c => c.setSize), ...dist.curve.map(c => c.setSize)])).sort((a, b) => a - b).map(n => 'N=' + n),
        Array.from(new Set([...pure.curve.map(c => c.setSize), ...dist.curve.map(c => c.setSize)])).sort((a, b) => a - b).map(n => (pure.curve.find(c => c.setSize === n)?.accuracy || 0) * 100),
        Array.from(new Set([...pure.curve.map(c => c.setSize), ...dist.curve.map(c => c.setSize)])).sort((a, b) => a - b).map(n => (dist.curve.find(c => c.setSize === n)?.accuracy || 0) * 100),
        '#E95295', '#50A87F', 'Task 1 (Pure)', 'Task 2 (Distractor)', v => Math.round(v) + '%')}
    </div>

    ${sparklineHTML('RESPONSE SPEED', dist.trialsChrono, 5)}

    ${glossaryHTML('#50A87F', [
      { term: "Cowan's K (Distractor)", def: 'Your memory capacity when white decoy squares were also on screen. A higher score than Task 1 means your brain focused better under extra visual noise.' },
      { term: 'Executive Efficiency', def: 'How effectively your brain blocked out distractor squares, expressed as a percentage change in capacity relative to the distraction-free baseline.' },
      { term: 'Executive Speed', def: 'The response-time difference between the pure and distractor tasks. A negative number means you responded faster with distractors present.' },
      { term: 'Distractor Effect', def: 'The overall difference in memory performance between Task 1 (no decoys) and Task 2. A positive change means distractors actually helped — which is unusual and interesting.' },
    ])}

    ${interpretBoxHTML('#50A87F', 'WHAT THESE RESULTS MEAN', `
      With distraction present, accuracy was <strong>${(dist.overallAcc * 100).toFixed(0)}%</strong> across ${dist.totalTrials} trials —
      a change of <strong>${distDrop >= 0 ? distDrop.toFixed(0) + ' points lower' : Math.abs(distDrop).toFixed(0) + ' points higher'}</strong> than the distraction-free baseline.
      Memory capacity moved from K=${pure.maxK.toFixed(1)} to K=${dist.maxK.toFixed(1)}, and executive filtering efficiency measured at ${execEfficiency.toFixed(1)}%.
      This reflects ${Math.abs(distDrop) < 5 ? 'high resilience to interference' : Math.abs(distDrop) < 20 ? 'moderate resilience to interference' : 'notable sensitivity to interference'}.
      <em>[Placeholder: deeper narrative synthesis of this candidate's filtering profile would be generated here.]</em>
    `)}

    ${footerHTML('Section 02 / 03', reportId)}
  </div>
  `;

  /* ---------------- SECTION 3 ---------------- */
  const networkCard = (label, val, accent, body, pct) => `
    <div class="net-card" style="border-color:${accent}33;">
      <div class="net-label" style="color:${accent};">${label}</div>
      <div class="net-val">${val >= 0 ? '+' : ''}${val.toFixed(0)}<span class="net-unit">ms</span></div>
      <div class="net-body">${body}</div>
      <div class="net-pct-row">
        <span class="net-pct-label">SCORE PERCENTILE (illustrative)</span>
        <span class="net-pct-val" style="color:${accent};">${pct}th</span>
      </div>
      <div class="net-pct-track"><div class="net-pct-fill" style="width:${pct}%; background:${accent};"></div></div>
    </div>
  `;

  const alertPct = pseudoPercentile(s.componentScores?.alerting || 0);
  const orientPct = pseudoPercentile(s.componentScores?.orienting || 0);
  const execPct = pseudoPercentile(s.componentScores?.executive || 0);

  const sec3 = `
  <div class="section">
    ${sectionHeaderHTML('03', 'SECTION THREE', 'Attention Network Task', '#1BA8D8',
      'Your attention system is actually three separate brain networks working together. This task teases them apart — measuring how well you use time-based cues, spatial cues, and how well you handle conflicting information.')}

    ${whatYouDidBoxHTML('#1BA8D8', '#F1F8FB', stripTags(t('t3_sum')) + ' ' + stripTags(t('t3_s2')) + ' ' + stripTags(t('t3_s4')))}

    <div class="net-grid">
      ${networkCard('ALERTING NETWORK', ant.alerting, '#D4A030', `A time-warning flash changed response speed by ${ant.alerting.toFixed(0)}ms. This reflects how well the brain picks up on 'something is coming soon' signals.`, alertPct)}
      ${networkCard('ORIENTING NETWORK', ant.orienting, '#E95295', `A location flash changed response speed by ${ant.orienting.toFixed(0)}ms. This reflects the benefit gained from knowing exactly where the target will appear.`, orientPct)}
      ${networkCard('EXECUTIVE NETWORK', ant.executive, '#1BA8D8', `Conflicting arrows changed response time by ${ant.executive.toFixed(0)}ms. This measures the ability to resolve conflicting visual information.`, execPct)}
    </div>

    <div class="mc-grid">
      ${metricCardHTML({ label: 'Congruent RT', value: ant.rtCongruent.toFixed(0), unit: 'ms', accent: '#1BA8D8', sub: 'Easy trials (arrows agree)' })}
      ${metricCardHTML({ label: 'Incongruent RT', value: ant.rtIncongruent.toFixed(0), unit: 'ms', accent: '#1BA8D8', sub: 'Hard trials (arrows conflict)' })}
      ${metricCardHTML({ label: 'Alerting Efficiency', value: ant.effAlerting.toFixed(2), unit: 'r/s', accent: '#1BA8D8', sub: 'Speed-corrected score' })}
      ${metricCardHTML({ label: 'Orienting Efficiency', value: ant.effOrienting.toFixed(2), unit: 'r/s', accent: '#1BA8D8', sub: 'Speed-corrected score' })}
    </div>

    <div class="chart-grid-2">
      ${barChartHTML('RESPONSE SPEED BY CUE TYPE', 'Lower bars = faster responses.',
        ant.rtByCue.map(r => ({ label: r.cue, val: r.rt })), '#1BA8D8', v => Math.round(v) + 'ms')}
      ${barChartHTML('CONGRUENT VS INCONGRUENT ARROWS', `The ${Math.abs(ant.executive).toFixed(0)}ms gap between these bars = Executive Control score.`,
        [{ label: 'Congruent', val: ant.rtCongruent, color: '#1BA8D8' }, { label: 'Incongruent', val: ant.rtIncongruent, color: '#E95295' }], '#1BA8D8', v => Math.round(v) + 'ms')}
    </div>

    ${sparklineHTML('RESPONSE SPEED', ant.trialsChrono, 4)}

    <div class="mc-grid mc-grid-3">
      ${metricCardHTML({ label: 'Alerting Efficiency', value: ant.effAlerting.toFixed(2), unit: 'r/s', accent: '#D4A030', sub: 'Normal range ≈ 0.3–0.5 r/s' })}
      ${metricCardHTML({ label: 'Orienting Efficiency', value: ant.effOrienting.toFixed(2), unit: 'r/s', accent: '#E95295', sub: 'Negative = no spatial benefit' })}
      ${metricCardHTML({ label: 'Executive Efficiency', value: ant.effExecutive.toFixed(2), unit: 'r/s', accent: '#1BA8D8', sub: 'Higher = better conflict handling' })}
    </div>

    ${glossaryHTML('#1BA8D8', [
      { term: 'Alerting Network', def: "Your brain's general 'heads-up' system. When you see a warning signal, does your brain get ready faster?" },
      { term: 'Orienting Network', def: "Your brain's ability to point attention at a specific location before something appears there." },
      { term: 'Executive Control', def: "Your brain's ability to override an automatic response when surrounding arrows point the wrong way." },
      { term: 'Congruent vs Incongruent', def: 'Congruent = surrounding arrows point the same direction as the target (easy). Incongruent = they point the opposite direction (hard).' },
      { term: 'Flanker Arrows', def: 'The arrows that surround the target centre arrow. They may match or oppose the target direction.' },
      { term: 'Cue Types', def: 'None = no warning. Center = a flash in the middle. Spatial = a flash exactly where the target will appear. Double = flashes in two places.' },
    ])}

    ${interpretBoxHTML('#1BA8D8', 'WHAT THESE RESULTS MEAN', `
      The Attention Network Task revealed a profile across three brain systems: alerting (${ant.alerting.toFixed(0)}ms benefit),
      orienting (${ant.orienting.toFixed(0)}ms benefit), and executive control (${ant.executive.toFixed(0)}ms cost when resolving conflict).
      Congruent trials averaged ${ant.rtCongruent.toFixed(0)}ms versus ${ant.rtIncongruent.toFixed(0)}ms on incongruent trials, across ${ant.totalTrials} total trials
      at ${(ant.overallAcc * 100).toFixed(0)}% overall accuracy.
      <em>[Placeholder: deeper narrative synthesis of this candidate's attention profile would be generated here.]</em>
    `)}

    ${footerHTML('Section 03 / 03', reportId)}
  </div>
  `;

  /* ---------------- SUMMARY ---------------- */
  const bands = [
    { label: 'Developing', range: '0–29', lo: 0, hi: 29 },
    { label: 'Average', range: '30–49', lo: 30, hi: 49 },
    { label: 'Above Avg', range: '50–69', lo: 50, hi: 69 },
    { label: 'Strong', range: '70–89', lo: 70, hi: 89 },
    { label: 'Exceptional', range: '90+', lo: 90, hi: 999 },
  ];

  const summary = `
  <div class="section" style="border-bottom:none;">
    <div class="summary-eyebrow">OVERALL SUMMARY</div>
    <h2 class="summary-title">Cognitive Profile Summary</h2>
    <p class="summary-sub">Integrated performance across all three assessment modules</p>

    <div class="composite-panel">
      <div>
        <div class="composite-panel-label">COMPOSITE SCORE</div>
        <div class="composite-panel-val">${composite.toFixed(1)}<span>/100</span></div>
        <div class="composite-panel-band">${scoreLabel(composite)}</div>
        <p class="composite-panel-text">A combined score across all 7 component metrics. ${composite.toFixed(1)} places ${candFirst} in the '${scoreLabel(composite)}' band.</p>
      </div>
      <div class="bands-row">
        <div class="bands-title">PERFORMANCE BANDS</div>
        <div class="bands-list">
          ${bands.map(b => `<div class="band-box ${composite >= b.lo && composite <= b.hi ? 'band-active' : ''}"><div>${b.label}</div><span>${b.range}</span></div>`).join('')}
        </div>
      </div>
    </div>

    <div class="chart-panel" style="margin-top:24px;">
      <div class="chart-title">ALL COMPONENT SCORES (0–100)</div>
      <div class="chart-sub"><span style="color:#50A87F;font-weight:700;">Green ≥ 70 (Strong)</span> · <span style="color:#D4A030;font-weight:700;">Amber 40–69 (Moderate)</span> · <span style="color:#D44040;font-weight:700;">Red &lt; 40 (Developing)</span></div>
      <div class="chart" style="height:180px;">
        ${componentScores.map(cs => `
          <div class="chart-col">
            <div class="chart-val">${cs.score.toFixed(0)}</div>
            <div class="chart-fill" style="height:${Math.max(3, cs.score)}%; background:${scoreColor(cs.score)};"></div>
            <div class="chart-lbl">${cs.short}</div>
          </div>
        `).join('')}
      </div>
      <div class="comp-legend-row">
        ${componentScores.map(cs => `
          <div class="comp-legend-item">
            <div class="comp-legend-val" style="color:${scoreColor(cs.score)};">${cs.score.toFixed(0)}</div>
            <div class="comp-legend-name">${cs.name}</div>
            <div class="comp-legend-band" style="color:${scoreColor(cs.score)};">${scoreLabel(cs.score)}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="strength-grid">
      <div class="strength-box strength-good">
        <div class="strength-title" style="color:#50A87F;">↑ COGNITIVE STRENGTHS</div>
        <ul>
          ${strengths.map(st => `<li><strong>${st.name}:</strong> ${st.score.toFixed(0)}th percentile (illustrative). <em>[Placeholder: candidate-specific strength narrative.]</em></li>`).join('')}
        </ul>
      </div>
      <div class="strength-box strength-dev">
        <div class="strength-title" style="color:#D4A030;">◇ AREAS FOR DEVELOPMENT</div>
        <ul>
          ${developing.map(dv => `<li><strong>${dv.name}:</strong> ${dv.score.toFixed(0)}th percentile (illustrative). <em>[Placeholder: candidate-specific development narrative.]</em></li>`).join('')}
        </ul>
      </div>
    </div>

    <div class="about-box">
      <div class="about-title">ABOUT THIS ASSESSMENT</div>
      <p>This report is generated from behavioural data collected via the Xiberlinc neurocognitive assessment platform.
      Task paradigms are based on validated scientific protocols: the Visual Working Memory change-detection task (Luck &amp; Vogel, 1997; Cowan, 2001)
      and the Attention Network Task (Fan et al., 2002). Composite and component scores are derived from candidate performance data.
      Percentile estimates are illustrative and should not be taken as clinical benchmarks. This report is intended for screening and
      performance purposes only and does not constitute a clinical diagnosis. Results should be interpreted alongside a qualified evaluator
      where clinical decisions are involved.</p>
    </div>

    <div class="final-footer">
      <div class="final-footer-logo">XIBERLINC</div>
      <div class="final-footer-meta">
        <div>${reportId} · ${assessDate}</div>
        <div>© ${new Date().getFullYear()} Xiberlinc Inc. · All rights reserved · Confidential</div>
      </div>
    </div>
  </div>
  `;

  /* ---------------- COVER ---------------- */
  const cover = `
  <div class="cover">
    <div class="cover-stripe"></div>
    <div class="cover-head">
      <div class="cover-logo">XIBERLINC</div>
      <div>
        <div class="report-id-label">Report ID</div>
        <div class="report-id">${reportId}</div>
      </div>
    </div>
    <div class="cover-grid">
      <div>
        <div class="eyebrow">Neurocognitive Assessment · Full Report</div>
        <div class="cover-title">Cognitive<br>Performance<br><span class="accent">Profile</span></div>
        <div class="cover-sub">An evidence-based analysis of visual working memory capacity, attentional filtering, and executive control — across three validated cognitive science tests.</div>
        <div class="cand-box">
          <div class="cand-grid">
            <div><div class="cand-label">Participant</div><div class="cand-val">${c.name || '—'}</div></div>
            <div><div class="cand-label">Handle</div><div class="cand-val">@${c.handle || '—'}</div></div>
            <div><div class="cand-label">Assessment Date</div><div class="cand-val">${assessDate}</div></div>
            <div><div class="cand-label">Completed At</div><div class="cand-val">${completedTime}</div></div>
            <div><div class="cand-label">Total Trials</div><div class="cand-val">${trials.length}</div></div>
            <div><div class="cand-label">Age</div><div class="cand-val">${c.age || '—'}</div></div>
          </div>
        </div>
      </div>
      <div class="gauge-side">
        ${compositeGaugeHTML(composite)}
        <div style="width:100%;">
          <div class="comp-scores-title">Component Scores</div>
          ${componentScores.map(cs => `
            <div class="cs-row">
              <span class="cs-name">${cs.short}</span>
              <div class="cs-bar-track"><div class="cs-bar-fill" style="width:${cs.score}%; background:${scoreColor(cs.score)};"></div></div>
              <span class="cs-val" style="color:${scoreColor(cs.score)};">${cs.score.toFixed(0)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    <div class="cover-footer">
      <div class="idx-group">
        <div class="idx-item"><div class="idx-bar" style="background:#E95295;"></div><div><div class="idx-label" style="color:#E95295;">Section 01</div><div class="idx-desc">Working Memory Capacity</div></div></div>
        <div class="idx-item"><div class="idx-bar" style="background:#50A87F;"></div><div><div class="idx-label" style="color:#50A87F;">Section 02</div><div class="idx-desc">Working Memory Filtering</div></div></div>
        <div class="idx-item"><div class="idx-bar" style="background:#1BA8D8;"></div><div><div class="idx-label" style="color:#1BA8D8;">Section 03</div><div class="idx-desc">Attention Network Task</div></div></div>
      </div>
      <div class="confidential">CONFIDENTIAL · ${assessDate}</div>
    </div>
  </div>
  `;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${c.name || 'Candidate'} — Cognitive Performance Profile</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700;800&family=Roboto+Mono:wght@400;500&display=swap');
  @page { margin: 0; size: A4; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family:'Raleway',sans-serif; background:#EDEDED; color:#1A1A1A; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .page { max-width: 960px; margin: 0 auto; background: #fff; }

  .cover { padding:56px 64px 64px; border-bottom:1px solid #EBEBEB; position:relative; overflow:hidden; }
  .cover-stripe { position:absolute; top:0; left:0; right:0; height:4px; background:linear-gradient(90deg,#E95295,#D4A030,#50A87F,#1BA8D8); }
  .cover-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:56px; }
  .cover-logo { font-size:20px; font-weight:800; letter-spacing:-0.02em; }
  .report-id-label { font-size:9px; font-weight:700; color:#CCC; letter-spacing:0.14em; text-transform:uppercase; margin-bottom:4px; text-align:right; }
  .report-id { font-family:'Roboto Mono',monospace; font-size:11px; color:#AAA; text-align:right; }
  .cover-grid { display:grid; grid-template-columns:1fr auto; gap:48px; align-items:center; }
  .eyebrow { font-size:10px; font-weight:700; color:#E95295; letter-spacing:0.2em; text-transform:uppercase; margin-bottom:16px; }
  .cover-title { font-size:40px; font-weight:800; letter-spacing:-0.03em; line-height:1.08; margin-bottom:20px; }
  .cover-title .accent { color:#E95295; }
  .cover-sub { font-size:13px; color:#888; line-height:1.7; max-width:400px; margin-bottom:32px; }
  .cand-box { background:#F7F7F7; border:1px solid #EBEBEB; border-radius:8px; padding:18px 22px; display:inline-block; min-width:340px; }
  .cand-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px 28px; }
  .cand-label { font-size:9px; font-weight:700; color:#BBB; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:3px; }
  .cand-val { font-size:13px; font-weight:600; color:#333; }
  .gauge-side { display:flex; flex-direction:column; align-items:center; gap:24px; }
  .gauge-wrap { position:relative; width:180px; height:180px; }
  .gauge-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; }
  .gauge-score { font-family:'Roboto Mono',monospace; font-size:38px; font-weight:500; line-height:1; }
  .gauge-label { font-size:9px; font-weight:700; color:#BBB; letter-spacing:0.15em; text-transform:uppercase; }
  .comp-scores-title { font-size:9px; font-weight:700; color:#CCC; letter-spacing:0.14em; text-transform:uppercase; margin-bottom:8px; text-align:center; }
  .cs-row { display:flex; align-items:center; gap:10px; width:100%; margin-bottom:7px; }
  .cs-name { font-size:10px; color:#CCC; width:74px; flex-shrink:0; text-align:right; }
  .cs-bar-track { flex:1; height:5px; background:#EBEBEB; border-radius:3px; overflow:hidden; }
  .cs-bar-fill { height:100%; border-radius:3px; }
  .cs-val { font-family:'Roboto Mono',monospace; font-size:10px; width:26px; flex-shrink:0; font-weight:500; }
  .cover-footer { margin-top:44px; padding-top:20px; border-top:1px solid #EBEBEB; display:flex; justify-content:space-between; align-items:center; }
  .idx-group { display:flex; gap:24px; }
  .idx-item { display:flex; align-items:center; gap:10px; }
  .idx-bar { width:3px; height:26px; border-radius:2px; flex-shrink:0; }
  .idx-label { font-size:9px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; }
  .idx-desc { font-size:11px; color:#AAA; }
  .confidential { font-family:'Roboto Mono',monospace; font-size:10px; color:#CCC; }

  .section { padding:48px 56px 44px; border-bottom:1px solid #EBEBEB; break-inside:avoid; page-break-before:always; }
  .sec-header { margin-bottom:28px; }
  .sec-rule { height:3px; margin-bottom:24px; }
  .sec-header-row { display:flex; align-items:flex-start; gap:20px; }
  .sec-number { font-size:60px; font-weight:800; line-height:0.85; letter-spacing:-0.04em; flex-shrink:0; margin-top:-6px; }
  .sec-label { font-size:10px; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; margin-bottom:6px; }
  .sec-title { font-size:24px; font-weight:700; letter-spacing:-0.02em; line-height:1.1; margin-bottom:8px; }
  .sec-desc { font-size:12.5px; color:#888; line-height:1.65; max-width:640px; }

  .wyd-box { border:1px solid; border-radius:10px; padding:18px 22px; margin-bottom:24px; }
  .wyd-title { font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px; }
  .wyd-body { font-size:12.5px; color:#555; line-height:1.7; }

  .mc-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:14px; }
  .mc-grid-3 { grid-template-columns:repeat(3,1fr); margin-bottom:24px; }
  .mc { background:#FAFAFA; border:1.5px solid #E8E8E8; border-radius:8px; padding:14px 16px 13px; }
  .mc-label { font-size:8.5px; font-weight:700; color:#AAA; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:4px; }
  .mc-val-row { display:flex; align-items:baseline; gap:4px; margin-top:2px; }
  .mc-val { font-family:'Roboto Mono',monospace; font-size:22px; font-weight:500; line-height:1; }
  .mc-unit { font-size:11px; color:#AAA; }
  .mc-sub { font-size:9.5px; color:#BBB; margin-top:4px; }

  .change-panel { background:#F2FAF6; border:1px solid #DCEEE3; border-radius:10px; padding:20px 24px; margin-bottom:24px; display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:24px; }
  .change-val { font-family:'Roboto Mono',monospace; font-size:32px; font-weight:600; }
  .change-label { font-size:9px; font-weight:700; color:#888; letter-spacing:0.1em; text-transform:uppercase; margin-top:2px; }
  .change-text { font-size:12px; color:#555; line-height:1.6; border-left:1px solid #DCEEE3; padding-left:20px; }
  .change-boxes { display:flex; align-items:center; gap:8px; }
  .change-box { border:1px solid #E8E8E8; border-radius:6px; padding:8px 14px; font-family:'Roboto Mono',monospace; font-size:16px; font-weight:600; text-align:center; }
  .change-box span { display:block; font-size:8px; font-weight:700; color:#AAA; letter-spacing:0.08em; margin-top:2px; }
  .change-arrow { color:#AAA; }

  .chart-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:20px; }
  .chart-panel { background:#FAFAFA; border:1px solid #EBEBEB; border-radius:10px; padding:16px 18px; margin-bottom:20px; }
  .chart-title { font-size:10.5px; font-weight:700; color:#888; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:4px; }
  .chart-sub { font-size:10.5px; color:#AAA; margin-bottom:14px; line-height:1.5; }
  .chart-area { position:relative; }
  .ref-line { position:absolute; left:0; right:0; border-top:1.5px dashed; z-index:1; }
  .ref-line-label { position:absolute; right:0; top:-16px; font-size:9px; font-family:'Roboto Mono',monospace; background:#FAFAFA; padding:0 4px; }
  .chart { display:flex; gap:6px; height:130px; align-items:flex-end; position:relative; z-index:2; }
  .chart-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; height:100%; justify-content:flex-end; }
  .chart-val { font-family:'Roboto Mono',monospace; font-size:9px; color:#888; }
  .chart-fill { width:100%; border-radius:2px 2px 0 0; min-height:3px; }
  .chart-lbl { font-family:'Roboto Mono',monospace; font-size:9px; color:#AAA; }
  .chart-col-pair .pair-bars { display:flex; gap:2px; width:100%; height:100%; align-items:flex-end; }
  .pair-bar { flex:1; border-radius:2px 2px 0 0; min-height:3px; }
  .legend-row { display:flex; gap:16px; margin-bottom:10px; }
  .legend-item { font-size:10px; color:#888; display:flex; align-items:center; gap:5px; }
  .legend-dot { width:8px; height:8px; border-radius:2px; display:inline-block; }

  .spark { display:flex; align-items:flex-end; gap:1.5px; height:80px; margin-top:4px; }
  .spark-bar { flex:1; border-radius:1px 1px 0 0; min-height:2px; opacity:0.9; }
  .spark-axis { position:relative; height:14px; margin-top:4px; }
  .spark-axis span { position:absolute; transform:translateX(-50%); font-family:'Roboto Mono',monospace; font-size:8.5px; color:#BBB; }

  .glossary-title { font-size:10px; font-weight:700; color:#AAA; letter-spacing:0.1em; text-transform:uppercase; margin:20px 0 10px; }
  .glossary-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px; }
  .glossary-card { background:#FAFAFA; border:1px solid #EBEBEB; border-radius:8px; padding:14px 16px; }
  .glossary-term { font-size:11.5px; font-weight:700; margin-bottom:5px; }
  .glossary-def { font-size:11px; color:#777; line-height:1.55; }

  .ibox { background:#FAFAFA; border:1px solid #EBEBEB; border-left-width:4px; border-radius:0 8px 8px 0; padding:18px 20px; margin-bottom:8px; }
  .ibox-title { font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px; }
  .ibox-body { font-size:12px; color:#555; line-height:1.75; }
  .ibox-body strong { color:#1A1A1A; }
  .ibox-body em { color:#AAA; }

  .page-footer { display:flex; justify-content:space-between; font-size:10px; color:#BBB; margin-top:32px; padding-top:16px; border-top:1px solid #EFEFEF; font-family:'Roboto Mono',monospace; }

  .net-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:20px; }
  .net-card { background:#FAFAFA; border:1px solid; border-radius:10px; padding:16px 18px; }
  .net-label { font-size:9.5px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:8px; }
  .net-val { font-family:'Roboto Mono',monospace; font-size:26px; font-weight:600; color:#1A1A1A; margin-bottom:8px; }
  .net-val span { font-size:13px; color:#AAA; margin-left:2px; }
  .net-body { font-size:11px; color:#666; line-height:1.6; margin-bottom:12px; min-height: 54px; }
  .net-pct-row { display:flex; justify-content:space-between; font-size:9px; color:#AAA; margin-bottom:4px; }
  .net-pct-val { font-weight:700; }
  .net-pct-track { height:4px; background:#EBEBEB; border-radius:2px; overflow:hidden; }
  .net-pct-fill { height:100%; }

  .summary-eyebrow { font-size:10px; font-weight:700; color:#E95295; letter-spacing:0.15em; text-transform:uppercase; margin-bottom:8px; }
  .summary-title { font-size:26px; font-weight:800; margin-bottom:6px; }
  .summary-sub { font-size:12.5px; color:#888; margin-bottom:24px; }
  .composite-panel { background:#FAFAFA; border:1px solid #EBEBEB; border-radius:10px; padding:24px; display:grid; grid-template-columns:1fr auto 1fr; gap:24px; align-items:center; }
  .composite-panel-label { font-size:9.5px; font-weight:700; color:#AAA; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:6px; }
  .composite-panel-val { font-family:'Roboto Mono',monospace; font-size:40px; font-weight:600; }
  .composite-panel-val span { font-size:16px; color:#AAA; margin-left:4px; }
  .composite-panel-band { font-size:14px; font-weight:700; margin:4px 0 8px; }
  .composite-panel-text { font-size:11.5px; color:#888; line-height:1.6; max-width:280px; }
  .bands-row { border-left:1px solid #EBEBEB; padding-left:24px; }
  .bands-title { font-size:9.5px; font-weight:700; color:#AAA; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:10px; }
  .bands-list { display:flex; gap:8px; }
  .band-box { border:1px solid #EBEBEB; border-radius:6px; padding:8px 12px; font-size:10.5px; color:#AAA; text-align:center; }
  .band-box span { display:block; font-size:9px; margin-top:2px; }
  .band-active { border-color:#1A1A1A; color:#1A1A1A; font-weight:700; }

  .comp-legend-row { display:flex; justify-content:space-between; margin-top:16px; padding-top:14px; border-top:1px solid #EFEFEF; }
  .comp-legend-item { text-align:center; flex:1; }
  .comp-legend-val { font-family:'Roboto Mono',monospace; font-size:18px; font-weight:700; }
  .comp-legend-name { font-size:9px; color:#888; margin-top:2px; }
  .comp-legend-band { font-size:9px; font-weight:700; margin-top:1px; }

  .strength-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:24px 0; }
  .strength-box { border-radius:10px; padding:18px 20px; }
  .strength-good { background:#F2FAF6; border:1px solid #DCEEE3; }
  .strength-dev { background:#FDF8EF; border:1px solid #F0E3C8; }
  .strength-title { font-size:10.5px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:12px; }
  .strength-box ul { list-style:none; display:flex; flex-direction:column; gap:12px; }
  .strength-box li { font-size:11.5px; color:#555; line-height:1.6; padding-left:14px; position:relative; }
  .strength-box li::before { content:'•'; position:absolute; left:0; font-size:16px; line-height:1; }
  .strength-box li em { color:#AAA; }

  .about-box { background:#FAFAFA; border:1px solid #EBEBEB; border-radius:10px; padding:18px 20px; margin-bottom:24px; }
  .about-title { font-size:9.5px; font-weight:700; color:#AAA; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:8px; }
  .about-box p { font-size:11px; color:#888; line-height:1.7; }

  .final-footer { display:flex; justify-content:space-between; align-items:center; padding-top:20px; border-top:1px solid #EBEBEB; }
  .final-footer-logo { font-size:14px; font-weight:800; }
  .final-footer-meta { text-align:right; font-family:'Roboto Mono',monospace; font-size:9.5px; color:#BBB; line-height:1.6; }
</style>
</head>
<body>
<div class="page">
  ${cover}
  ${sec1}
  ${sec2}
  ${sec3}
  ${summary}
</div>
</body>
</html>
  `;
}

export { buildReportHTML };