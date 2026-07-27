/* ============================================================
   PDF Report Builder — matches Xiberlinc "Cognitive Performance
   Profile" design (light theme, Raleway + Roboto Mono, gauge cover)
   ============================================================ */

/* ---- Stage aggregation (from real trials) ---- */
function computeVWMStageStats(trials, taskType) {
  const stageTrials = trials.filter(t => t.taskType === taskType);
  const bySetSize = {};
  stageTrials.forEach(t => {
    const key = t.setSize;
    if (!bySetSize[key]) bySetSize[key] = { total: 0, correct: 0, rts: [] };
    bySetSize[key].total++;
    if (t.isCorrect) {
      bySetSize[key].correct++;
      if (t.reactionTimeMs) bySetSize[key].rts.push(t.reactionTimeMs);
    }
  });
  const setSizes = Object.keys(bySetSize).map(Number).sort((a, b) => a - b);
  const curve = setSizes.map(size => {
    const d = bySetSize[size];
    const acc = d.total ? d.correct / d.total : 0;
    const avgRT = d.rts.length ? d.rts.reduce((a, b) => a + b, 0) / d.rts.length : 0;
    // Rough per-setSize K approximation: N * (hit rate), floor at 0
    const k = Math.max(0, size * acc);
    return { setSize: size, accuracy: acc, avgRT, k, trials: d.total };
  });
  const correctRts = stageTrials.filter(t => t.isCorrect && t.reactionTimeMs).map(t => t.reactionTimeMs);
  const overallAcc = stageTrials.length ? stageTrials.filter(t => t.isCorrect).length / stageTrials.length : 0;
  const avgRT = correctRts.length ? correctRts.reduce((a, b) => a + b, 0) / correctRts.length : 0;
  const fastest = correctRts.length ? Math.min(...correctRts) : 0;
  const slowest = correctRts.length ? Math.max(...correctRts) : 0;
  let maxStreak = 0, streak = 0;
  stageTrials.forEach(t => { if (t.isCorrect) { streak++; maxStreak = Math.max(maxStreak, streak); } else streak = 0; });
  const maxSize = setSizes.length ? Math.max(...setSizes) : 0;
  const maxK = curve.length ? Math.max(...curve.map(c => c.k)) : 0;

  return { curve, overallAcc, avgRT, fastest, slowest, maxStreak, maxSize, maxK, totalTrials: stageTrials.length };
}

function computeANTStats(trials) {
  const antTrials = trials.filter(t => t.taskType === 'ant');
  const byCue = {}, byFlanker = {};
  antTrials.forEach(t => {
    if (!byCue[t.cueType]) byCue[t.cueType] = { rts: [], correct: 0, total: 0 };
    byCue[t.cueType].total++;
    if (t.isCorrect) { byCue[t.cueType].correct++; if (t.reactionTimeMs) byCue[t.cueType].rts.push(t.reactionTimeMs); }
    if (!byFlanker[t.flankerType]) byFlanker[t.flankerType] = { rts: [], correct: 0, total: 0 };
    byFlanker[t.flankerType].total++;
    if (t.isCorrect) { byFlanker[t.flankerType].correct++; if (t.reactionTimeMs) byFlanker[t.flankerType].rts.push(t.reactionTimeMs); }
  });
  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const rtNone = avg(byCue['none']?.rts || []);
  const rtCenter = avg(byCue['center']?.rts || []);
  const rtDouble = avg(byCue['double']?.rts || []);
  const rtSpatial = avg(byCue['spatial']?.rts || []);
  const rtCongruent = avg(byFlanker['congruent']?.rts || []);
  const rtIncongruent = avg(byFlanker['incongruent']?.rts || []);
  const accCongruent = byFlanker['congruent']?.total ? byFlanker['congruent'].correct / byFlanker['congruent'].total : 0;
  const accIncongruent = byFlanker['incongruent']?.total ? byFlanker['incongruent'].correct / byFlanker['incongruent'].total : 0;

  return {
    alerting: rtNone - rtCenter,
    orienting: rtCenter - rtSpatial,
    executive: rtIncongruent - rtCongruent,
    rtByCue: [
      { cue: 'None', rt: rtNone },
      { cue: 'Center', rt: rtCenter },
      { cue: 'Double', rt: rtDouble },
      { cue: 'Spatial', rt: rtSpatial },
    ],
    rtCongruent, rtIncongruent, accCongruent, accIncongruent,
    totalTrials: antTrials.length,
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

/* ---- Shared HTML fragment builders ---- */
function metricCardHTML(label, value, unit, accent, sub, highlight) {
  return `
    <div class="mc ${highlight ? 'mc-hl' : ''}" style="${highlight ? `border-color:${accent}55; box-shadow:0 2px 12px ${accent}18;` : ''}">
      <div class="mc-label">${label}</div>
      <div class="mc-val-row">
        <span class="mc-val" style="${highlight ? `color:${accent}` : ''}">${value}</span>
        ${unit ? `<span class="mc-unit">${unit}</span>` : ''}
      </div>
      ${sub ? `<div class="mc-sub">${sub}</div>` : ''}
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

function barChartHTML(items, accent, valueFmt) {
  const max = Math.max(...items.map(i => i.val), 1);
  return `
    <div class="chart">
      ${items.map(i => `
        <div class="chart-col">
          <div class="chart-val">${valueFmt(i.val)}</div>
          <div class="chart-fill" style="height:${Math.max(4, (i.val / max) * 100)}%; background:${accent};"></div>
          <div class="chart-lbl">${i.label}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function compositeGaugeHTML(score) {
  const size = 200, sw = 16, r = (size - sw) / 2;
  const circumference = 2 * Math.PI * r;
  const arc = 0.75;
  const dashArray = circumference * arc;
  const offset = circumference * (1 - arc * (score / 100));
  return `
    <div class="gauge-wrap">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(135deg);">
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#EBEBEB" stroke-width="${sw}"
          stroke-dasharray="${dashArray} ${circumference}" stroke-linecap="round" />
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="url(#gaugeGrad)" stroke-width="${sw}"
          stroke-dasharray="${dashArray - offset} ${circumference}" stroke-linecap="round" />
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#E95295" />
            <stop offset="50%" stop-color="#D4A030" />
            <stop offset="100%" stop-color="#50A87F" />
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

/* ---- Main builder ---- */
function buildReportHTML(c) {
  const trials = c.trials || [];
  const s = c.scores || {};
  const pure = computeVWMStageStats(trials, 'vwm-pure');
  const dist = computeVWMStageStats(trials, 'vwm-distractor');
  const ant = computeANTStats(trials);

  const composite = s.compositeScore || 0;
  const reportId = 'XBL-' + (c.completedAt ? new Date(c.completedAt).toISOString().slice(0,10).replace(/-/g,'') : '00000000') +
    '-' + (c.name || 'CAND').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,3);
  const assessDate = c.completedAt ? new Date(c.completedAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) : '—';
  const completedTime = c.completedAt ? new Date(c.completedAt).toLocaleTimeString('en-US') : '—';

  const componentScores = s.componentScores ? [
    { name: "Cowan's K", short: 'CowanK', score: s.componentScores.kPure || 0 },
    { name: "Cowan's K (Dist.)", short: 'CowanK(D)', score: s.componentScores.kDistractor || 0 },
    { name: 'Max N', short: 'MaxN', score: s.componentScores.maxSetSize || 0 },
    { name: 'RT Efficiency', short: 'RT Eff', score: s.componentScores.rtEfficiency || 0 },
    { name: 'Alerting', short: 'Alert', score: s.componentScores.alerting || 0 },
    { name: 'Orienting', short: 'Orient', score: s.componentScores.orienting || 0 },
    { name: 'Executive', short: 'Exec', score: s.componentScores.executive || 0 },
  ] : [];

  const distDrop = (pure.overallAcc - dist.overallAcc) * 100;
  const execCost = ant.executive;

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
  body {
    font-family: 'Raleway', sans-serif;
    background: #EDEDED;
    color: #1A1A1A;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .page { max-width: 960px; margin: 0 auto; background: #fff; }

  /* ---- Cover ---- */
  .cover { padding: 56px 64px 64px; border-bottom: 1px solid #EBEBEB; position: relative; overflow: hidden; }
  .cover-stripe { position: absolute; top:0; left:0; right:0; height:4px; background: linear-gradient(90deg,#E95295,#D4A030,#50A87F,#1BA8D8); }
  .cover-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:56px; }
  .cover-logo { font-size:20px; font-weight:800; letter-spacing:-0.02em; }
  .report-id-label { font-size:9px; font-weight:700; color:#CCC; letter-spacing:0.14em; text-transform:uppercase; margin-bottom:4px; text-align:right; }
  .report-id { font-family:'Roboto Mono',monospace; font-size:11px; color:#AAA; text-align:right; }
  .cover-grid { display:grid; grid-template-columns:1fr auto; gap:48px; align-items:center; }
  .eyebrow { font-size:10px; font-weight:700; color:#E95295; letter-spacing:0.2em; text-transform:uppercase; margin-bottom:16px; }
  .cover-title { font-size:44px; font-weight:800; letter-spacing:-0.03em; line-height:1.05; margin-bottom:20px; }
  .cover-title .accent { color:#E95295; }
  .cover-sub { font-size:14px; color:#888; line-height:1.7; max-width:420px; margin-bottom:36px; }
  .cand-box { background:#F7F7F7; border:1px solid #EBEBEB; border-radius:8px; padding:20px 24px; display:inline-block; min-width:360px; }
  .cand-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px 32px; }
  .cand-label { font-size:9px; font-weight:700; color:#BBB; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:3px; }
  .cand-val { font-size:13px; font-weight:600; color:#333; }
  .gauge-side { display:flex; flex-direction:column; align-items:center; gap:28px; }
  .gauge-wrap { position:relative; width:200px; height:200px; }
  .gauge-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; }
  .gauge-score { font-family:'Roboto Mono',monospace; font-size:44px; font-weight:500; line-height:1; }
  .gauge-label { font-size:9px; font-weight:700; color:#BBB; letter-spacing:0.15em; text-transform:uppercase; }
  .comp-scores-title { font-size:9px; font-weight:700; color:#CCC; letter-spacing:0.14em; text-transform:uppercase; margin-bottom:4px; text-align:center; }
  .cs-row { display:flex; align-items:center; gap:10px; width:100%; margin-bottom:8px; }
  .cs-name { font-size:10px; color:#CCC; width:76px; flex-shrink:0; text-align:right; }
  .cs-bar-track { flex:1; height:5px; background:#EBEBEB; border-radius:3px; overflow:hidden; }
  .cs-bar-fill { height:100%; border-radius:3px; }
  .cs-val { font-family:'Roboto Mono',monospace; font-size:10px; width:28px; flex-shrink:0; font-weight:500; }
  .cover-footer { margin-top:52px; padding-top:20px; border-top:1px solid #EBEBEB; display:flex; justify-content:space-between; align-items:center; }
  .idx-group { display:flex; gap:28px; }
  .idx-item { display:flex; align-items:center; gap:10px; }
  .idx-bar { width:3px; height:28px; border-radius:2px; flex-shrink:0; }
  .idx-label { font-size:9px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; }
  .idx-desc { font-size:11px; color:#AAA; }
  .confidential { font-family:'Roboto Mono',monospace; font-size:10px; color:#CCC; }

  /* ---- Sections ---- */
  .section { padding: 56px 64px; border-bottom:1px solid #EBEBEB; break-inside: avoid; page-break-before: always; }
  .sec-header { margin-bottom:36px; }
  .sec-rule { height:3px; margin-bottom:32px; }
  .sec-header-row { display:flex; align-items:flex-start; gap:24px; }
  .sec-number { font-size:72px; font-weight:800; line-height:0.85; letter-spacing:-0.04em; flex-shrink:0; margin-top:-8px; }
  .sec-label { font-size:10px; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; margin-bottom:6px; }
  .sec-title { font-size:28px; font-weight:700; letter-spacing:-0.02em; line-height:1.1; margin-bottom:10px; }
  .sec-desc { font-size:13px; color:#888; line-height:1.7; }

  .mc-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:32px; }
  .mc { background:#FAFAFA; border:1.5px solid #E8E8E8; border-radius:8px; padding:18px 20px 16px; }
  .mc-label { font-size:9px; font-weight:700; color:#AAA; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:4px; }
  .mc-val-row { display:flex; align-items:baseline; gap:4px; margin-top:2px; }
  .mc-val { font-family:'Roboto Mono',monospace; font-size:26px; font-weight:500; line-height:1; }
  .mc-unit { font-size:13px; color:#AAA; }
  .mc-sub { font-size:10px; color:#BBB; margin-top:4px; }

  .chart { display:flex; gap:10px; height:160px; align-items:flex-end; padding:16px 12px; background:#FAFAFA; border:1px solid #EBEBEB; border-radius:8px; margin-bottom:32px; }
  .chart-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; height:100%; justify-content:flex-end; }
  .chart-val { font-family:'Roboto Mono',monospace; font-size:10px; color:#888; }
  .chart-fill { width:100%; border-radius:3px 3px 0 0; min-height:4px; }
  .chart-lbl { font-family:'Roboto Mono',monospace; font-size:10px; color:#AAA; }

  .ibox { background:#FAFAFA; border:1px solid #EBEBEB; border-left-width:4px; border-radius:0 8px 8px 0; padding:20px 24px; margin-top: 8px; }
  .ibox-title { font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:10px; }
  .ibox-body { font-size:13px; color:#555; line-height:1.8; }
  .ibox-body strong { color:#1A1A1A; }

  /* ---- Summary ---- */
  .summary { padding:56px 64px 64px; }
  .summary-title { font-size:24px; font-weight:800; margin-bottom:24px; }
  .summary-body { font-size:14px; color:#444; line-height:1.9; }
</style>
</head>
<body>
<div class="page">

  <!-- COVER -->
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

  <!-- SECTION 1 — VWM PURE -->
  <div class="section">
    ${sectionHeaderHTML('01', 'Section 01 · Baseline', 'Working Memory Capacity', '#E95295',
      'Measures raw visual working memory span with no distraction — how many items can be held and compared accurately.')}
    <div class="mc-grid">
      ${metricCardHTML('Cowan\'s K', pure.maxK.toFixed(2), '', '#E95295', '', true)}
      ${metricCardHTML('Max N Reached', pure.maxSize, '', '#E95295')}
      ${metricCardHTML('Accuracy', (pure.overallAcc*100).toFixed(0), '%', '#E95295')}
      ${metricCardHTML('Avg RT', pure.avgRT.toFixed(0), 'ms', '#E95295')}
    </div>
    <div class="chart-title" style="font-size:11px; font-weight:700; color:#AAA; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:12px;">Accuracy by Set Size</div>
    ${barChartHTML(pure.curve.map(pt => ({ label: 'N=' + pt.setSize, val: pt.accuracy * 100 })), '#E95295', v => Math.round(v) + '%')}
    ${interpretBoxHTML('#E95295', 'Interpretation', `
      Baseline memory capacity reached set size <strong>${pure.maxSize}</strong> across ${pure.totalTrials} trials, with an overall accuracy of
      <strong>${(pure.overallAcc*100).toFixed(0)}%</strong>. Best streak: ${pure.maxStreak} correct in a row.
      Fastest correct response: ${pure.fastest.toFixed(0)}ms, slowest: ${pure.slowest.toFixed(0)}ms.
    `)}
  </div>

  <!-- SECTION 2 — VWM DISTRACTOR -->
  <div class="section">
    ${sectionHeaderHTML('02', 'Section 02 · Interference', 'Working Memory Filtering', '#50A87F',
      'The same memory task, now with distraction present — testing whether capacity holds up under interference.')}
    <div class="mc-grid">
      ${metricCardHTML('Cowan\'s K', dist.maxK.toFixed(2), '', '#50A87F', '', true)}
      ${metricCardHTML('Accuracy', (dist.overallAcc*100).toFixed(0), '%', '#50A87F')}
      ${metricCardHTML('Avg RT', dist.avgRT.toFixed(0), 'ms', '#50A87F')}
      ${metricCardHTML('Accuracy Change', (distDrop >= 0 ? '−' : '+') + Math.abs(distDrop).toFixed(0), 'pts', '#50A87F', distDrop >= 0 ? 'vs. baseline' : 'improved under distraction')}
    </div>
    <div class="chart-title" style="font-size:11px; font-weight:700; color:#AAA; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:12px;">Accuracy by Set Size (Distractor)</div>
    ${barChartHTML(dist.curve.map(pt => ({ label: 'N=' + pt.setSize, val: pt.accuracy * 100 })), '#50A87F', v => Math.round(v) + '%')}
    ${interpretBoxHTML('#50A87F', 'Interpretation', `
      With distraction present, accuracy was <strong>${(dist.overallAcc*100).toFixed(0)}%</strong> across ${dist.totalTrials} trials —
      a change of <strong>${distDrop >= 0 ? distDrop.toFixed(0) + ' points lower' : Math.abs(distDrop).toFixed(0) + ' points higher'}</strong> than the distraction-free baseline.
      This reflects ${Math.abs(distDrop) < 5 ? 'high resilience to interference' : Math.abs(distDrop) < 20 ? 'moderate resilience to interference' : 'notable sensitivity to interference'}.
    `)}
  </div>

  <!-- SECTION 3 — ANT -->
  <div class="section">
    ${sectionHeaderHTML('03', 'Section 03 · Attention', 'Attention Network Task', '#1BA8D8',
      'Isolates three independent attention systems: alerting (response to warnings), orienting (use of spatial cues), and executive control (resolving conflicting information).')}
    <div class="mc-grid">
      ${metricCardHTML('Alerting', ant.alerting.toFixed(0), 'ms', '#1BA8D8', '', true)}
      ${metricCardHTML('Orienting', ant.orienting.toFixed(0), 'ms', '#1BA8D8')}
      ${metricCardHTML('Executive Cost', ant.executive.toFixed(0), 'ms', '#1BA8D8')}
      ${metricCardHTML('Trials', ant.totalTrials, '', '#1BA8D8')}
    </div>
    <div class="chart-title" style="font-size:11px; font-weight:700; color:#AAA; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:12px;">Response Time by Cue Type</div>
    ${barChartHTML(ant.rtByCue.map(r => ({ label: r.cue, val: r.rt })), '#1BA8D8', v => Math.round(v) + 'ms')}
    ${interpretBoxHTML('#1BA8D8', 'Interpretation', `
      Warning cues changed response speed by <strong>${ant.alerting.toFixed(0)}ms</strong> (alerting), and precise location cues added a further
      <strong>${ant.orienting.toFixed(0)}ms</strong> benefit (orienting). Conflicting visual information cost
      <strong>${ant.executive.toFixed(0)}ms</strong> — congruent trials averaged ${ant.rtCongruent.toFixed(0)}ms vs.
      ${ant.rtIncongruent.toFixed(0)}ms on incongruent trials, reflecting
      ${ant.executive < 30 ? 'minimal cost from conflicting information' : ant.executive < 100 ? 'typical cost from conflicting information' : 'high cost from conflicting information'}.
    `)}
  </div>

  <!-- SUMMARY -->
  <div class="section" style="border-bottom:none;">
    <div class="summary-title">Summary</div>
    <div class="summary-body">
      ${c.name || 'This candidate'} achieved a composite score of <strong>${composite.toFixed(1)}</strong> (${scoreLabel(composite)}),
      reflecting ${scoreLabel(pure.maxK * 100/8).toLowerCase()} baseline working memory reaching set size ${pure.maxSize},
      ${Math.abs(distDrop) < 10 ? 'strong resilience to distraction' : 'reduced resilience to distraction'} when interference was introduced,
      and ${ant.executive < 60 ? 'efficient' : 'effortful'} attentional control when resolving conflicting visual information.
    </div>
  </div>

</div>
</body>
</html>
  `;
}

export { buildReportHTML };