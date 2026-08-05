/* ============================================================
   PDF Report Builder — matches Xiberlinc "Cognitive Performance
   Profile" reference design. All numbers are computed live from
   candidate.trials (raw data). All static/translatable copy is
   sourced from the i18n dictionary via t().
   ============================================================ */

import { t } from './i18n.js';
import reportStyles from '../styles/reportBuilder.css?raw';

const STANDARD_SET_SIZES = [1, 2, 3, 4, 6, 8];
const logoUrl = window.location.origin + '/xiberlinc_logo_transparent.png';

function padToStandardSizes(curve) {
    return STANDARD_SET_SIZES.map(size => {
        const pt = curve.find(c => c.setSize === size);
        return pt || { setSize: size, k: 0, accuracy: 0, avgRT: 0, trials: 0 };
    });
}

/* ---------------------------------------------------------------
   DATA COMPUTATION — proper Cowan's K from raw trials
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
    if (score >= 90) return t('rpt_band_exceptional');
    if (score >= 70) return t('rpt_band_strong');
    if (score >= 50) return t('rpt_band_aboveavg');
    if (score >= 30) return t('rpt_band_average');
    return t('rpt_band_developing');
}
function pseudoPercentile(score) { return Math.round(score); }
function computeNiceAxis(values, targetTicks = 5) {
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    if (dataMin === dataMax) return { min: 0, max: (dataMax || 1) * 1.2, ticks: [0, dataMax || 1] };
    const range = dataMax - dataMin;
    const rawStep = range / (targetTicks - 1);
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const norm = rawStep / mag;
    const niceStep = norm < 1.5 ? mag : norm < 3 ? 2 * mag : norm < 7 ? 5 * mag : 10 * mag;
    const min = Math.floor(dataMin / niceStep) * niceStep;
    let max = Math.ceil(dataMax / niceStep) * niceStep;
    if (max === min) max = min + niceStep;
    const ticks = [];
    for (let v = min; v <= max + 1e-9; v += niceStep) ticks.push(Math.round(v));
    return { min, max, ticks };
}

function axisLabelsHTML(axis, valueFmt) {
    return `<div class="axis-labels">${axis.ticks.slice().reverse().map(tick => `<div class="axis-label">${valueFmt(tick)}</div>`).join('')}</div>`;
}

function gridlinesHTML(axis) {
    const range = axis.max - axis.min || 1;
    return `<div class="gridlines">${axis.ticks.map(tick => `<div class="gridline" style="bottom:${((tick - axis.min) / range) * 100}%;"></div>`).join('')}</div>`;
}
function stripTags(html) { return (html || '').replace(/<[^>]*>/g, ''); }

/* ---------------------------------------------------------------
   HTML FRAGMENT BUILDERS
--------------------------------------------------------------- */
function metricCardHTML({ label, value, unit = '', accent = '#E95295', sub = '', highlight = false }) {
    return `
    <div class="mc ${highlight ? 'mc-hl' : ''}" style="${highlight ? `border-color:${accent}55; background:${accent}08;` : ''}">
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
      <div class="wyd-title" style="color:${accent};">${t('rpt_wyd_title')}</div>
      <div class="wyd-body">${bodyHtml}</div>
    </div>
  `;
}

function interpretBoxHTML(accent, bgTint, bodyHtml) {
    return `
    <div class="wyd-box" style="background:${bgTint}; border-color:${accent}22;">
      <div class="wyd-title" style="color:${accent};">${t('rpt_results_mean_title')}</div>
      <div class="wyd-body">${bodyHtml}</div>
    </div>
  `;
}

function glossaryHTML(accent, items) {
    return `
    <div class="glossary-title">${t('rpt_glossary_title')}</div>
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
        <div class="sec-number" style="color:${accent}28;">${number}</div>
        <div class="sec-header-text">
          <div class="sec-label" style="color:${accent};">${label}</div>
          <h2 class="sec-title">${title}</h2>
          <p class="sec-desc">${description}</p>
        </div>
      </div>
    </div>
  `;
}

function barChartHTML(title, sub, items, accent, valueFmt, refLine, useAxis) {
    const axis = useAxis ? computeNiceAxis(items.map(i => i.val).concat(refLine != null ? [refLine] : [])) : null;
    const min = axis ? axis.min : 0;
    const max = axis ? axis.max : Math.max(...items.map(i => i.val), refLine || 0, 1) * 1.05;
    const range = max - min || 1;

    return `
    <div class="chart-panel">
      <div class="chart-title">${title}</div>
      <div class="chart-sub">${sub}</div>
      <div class="chart-with-axis">
        ${axis ? axisLabelsHTML(axis, valueFmt) : ''}
        <div class="chart-plot">
          ${axis ? gridlinesHTML(axis) : ''}
          <div class="chart">
            ${items.map(i => `
              <div class="chart-col">
                <div class="chart-val">${valueFmt(i.val)}</div>
                <div class="chart-fill" style="height:${Math.max(3, ((i.val - min) / range) * 100)}%; background:${i.color || accent};"></div>
                <div class="chart-lbl">${i.label}</div>
              </div>
            `).join('')}
          </div>
          ${refLine != null ? `<div class="ref-line" style="bottom:${((refLine - min) / range) * 100}%;"><span class="ref-line-label">${valueFmt(refLine)}</span></div>` : ''}
        </div>
      </div>
    </div>
  `;
}

function comparisonBarChartHTML(title, sub, labels, seriesA, seriesB, colorA, colorB, nameA, nameB, valueFmt, useAxis) {
    const axis = useAxis ? computeNiceAxis([...seriesA, ...seriesB]) : null;
    const min = axis ? axis.min : 0;
    const max = axis ? axis.max : Math.max(...seriesA, ...seriesB, 1) * 1.05;
    const range = max - min || 1;

    return `
    <div class="chart-panel">
      <div class="chart-title">${title}</div>
      <div class="chart-sub">${sub}</div>
      <div class="legend-row">
        <span class="legend-item"><span class="legend-dot" style="background:${colorA};"></span>${nameA}</span>
        <span class="legend-item"><span class="legend-dot" style="background:${colorB};"></span>${nameB}</span>
      </div>
      <div class="chart-with-axis">
        ${axis ? axisLabelsHTML(axis, valueFmt) : ''}
        <div class="chart-plot">
          ${axis ? gridlinesHTML(axis) : ''}
          <div class="chart">
            ${labels.map((lbl, i) => `
              <div class="chart-col chart-col-pair">
                <div class="pair-bars">
                  <div class="pair-bar" style="height:${Math.max(3, ((seriesA[i] - min) / range) * 100)}%; background:${colorA};" title="${valueFmt(seriesA[i])}"></div>
                  <div class="pair-bar" style="height:${Math.max(3, ((seriesB[i] - min) / range) * 100)}%; background:${colorB};" title="${valueFmt(seriesB[i])}"></div>
                </div>
                <div class="chart-lbl">${lbl}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function sparklineHTML(trialsChrono, totalLabel, accent, labelEvery = 5) {
    if (!trialsChrono.length) return '';
    const rts = trialsChrono.map(tr => tr.reactionTimeMs || 0).filter(v => v > 0);
    const axis = computeNiceAxis(rts.length ? rts : [0, 1000]);
    const min = axis.min, range = (axis.max - axis.min) || 1;

    return `
    <div class="chart-panel">
      <div class="chart-title">${t('rpt_spark_title')} — ${totalLabel}</div>
      <div class="chart-sub">${t('rpt_spark_desc')}</div>
      <div class="chart-with-axis">
        <div class="axis-labels-worded">
          <span style="color:${accent};">${t('rpt_spark_slowest')}</span>
          ${axisLabelsHTML(axis, v => Math.round(v) + 'ms')}
          <span style="color:${accent};">${t('rpt_spark_fastest')}</span>
        </div>
        <div class="chart-plot chart-plot-spark">
          ${gridlinesHTML(axis)}
          <div class="spark">
            ${trialsChrono.map((tr, i) => {
        const rt = tr.reactionTimeMs || 0;
        const h = Math.max(3, ((rt - min) / range) * 100);
        return `<div class="spark-bar" style="height:${h}%; background:${tr.isCorrect ? '#50A87F' : '#D44040'};" title="${i + 1}: ${rt.toFixed(0)}ms"></div>`;
    }).join('')}
          </div>
        </div>
      </div>
        <div class="spark-axis" style="margin-left:54px;">
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
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#EBEBEB" stroke-width="${sw}"
          stroke-dasharray="${dashArray} ${circumference}" stroke-linecap="round" />
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="url(#gaugeGrad)" stroke-width="${sw}"
          stroke-dasharray="${dashArray - offset} ${circumference}" stroke-linecap="round" />
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#E95295" /><stop offset="50%" stop-color="#D4A030" /><stop offset="100%" stop-color="#50A87F" />
          </linearGradient>
        </defs>
      </svg>
      <div class="gauge-center">
        <span class="gauge-score">${score.toFixed(1)}</span>
        <span class="gauge-label">${t('rpt_composite_label')}</span>
      </div>
    </div>
  `;
}

function footerHTML(sectionLabel, reportId) {
    return `
    <div class="page-footer">
      <div>${t('rpt_footer_line')}</div>
      <div>${sectionLabel} · ${reportId}</div>
    </div>
  `;
}

/* ---------------------------------------------------------------
   MAIN BUILDER
--------------------------------------------------------------- */
function buildReportHTML(c, allCandidates = []) {
    const trials = c.trials || [];
    const s = c.scores || {};
    const pure = computeVWMStats(trials, 'vwm-pure');
    const dist = computeVWMStats(trials, 'vwm-distractor');
    const ant = computeANTStats(trials);

    const composite = s.compositeScore || 0;
    const reportId = 'XBL-' + (c.completedAt ? new Date(c.completedAt).toISOString().slice(0, 10).replace(/-/g, '') : '00000000') +
        '-' + (c.name || 'CAND').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
    const assessDate = c.completedAt ? new Date(c.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
    const sessions = allCandidates.filter(x => x.email && c.email && x.email === c.email && x.completedAt);
    const sessionDates = sessions.map(x => new Date(x.completedAt).getTime());
    const earliestDate = sessionDates.length ? new Date(Math.min(...sessionDates)) : (c.completedAt ? new Date(c.completedAt) : null);
    const latestDate = sessionDates.length ? new Date(Math.max(...sessionDates)) : (c.completedAt ? new Date(c.completedAt) : null);
    const sessionCount = sessions.length || (c.completedAt ? 1 : 0);
    const assessDateRange = (earliestDate && latestDate)
        ? (earliestDate.getTime() === latestDate.getTime()
            ? earliestDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : `${earliestDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${latestDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`)
        : '—';
    const sportType = c.sportType || 'Futsal';
    const playerType = c.playerType || 'Pro';
    const completedTime = c.completedAt ? new Date(c.completedAt).toLocaleTimeString('en-US') : '—';
    const candFirst = (c.name || 'The candidate').split(' ')[0];

    const componentScores = s.componentScores ? [
        { name: t('rpt_cs_cowansk'), short: 'CowanK', score: s.componentScores.kPure || 0 },
        { name: t('rpt_cs_cowansk_dist'), short: 'CowanK(D)', score: s.componentScores.kDistractor || 0 },
        { name: t('rpt_cs_maxn'), short: 'MaxN', score: s.componentScores.maxSetSize || 0 },
        { name: t('rpt_cs_rteff'), short: 'RT Eff', score: s.componentScores.rtEfficiency || 0 },
        { name: t('rpt_cs_alerting'), short: 'Alert', score: s.componentScores.alerting || 0 },
        { name: t('rpt_cs_orienting'), short: 'Orient', score: s.componentScores.orienting || 0 },
        { name: t('rpt_cs_executive'), short: 'Exec', score: s.componentScores.executive || 0 },
    ] : [];

    const execEfficiency = pure.maxK ? ((dist.maxK - pure.maxK) / pure.maxK) * 100 : 0;
    const execSpeed = pure.avgRT - dist.avgRT;
    const distDrop = (pure.overallAcc - dist.overallAcc) * 100;

    const sortedScores = [...componentScores].sort((a, b) => b.score - a.score);
    const strengths = sortedScores.slice(0, Math.min(4, sortedScores.length));
    const developing = sortedScores.slice(-Math.min(3, sortedScores.length)).reverse();

    /* ---------------- SECTION 1 ---------------- */
    const sec1 = `
  <div class="section">
    ${sectionHeaderHTML('01', t('rpt_sec1_label'), t('rpt_sec1_title'), '#E95295', t('rpt_sec1_desc'))}

    ${interpretBoxHTML('#E95295', '#FDF3F7', `
      ${t('rpt_interp1', {
        name: candFirst, k: pure.maxK.toFixed(1),
        peakSize: pure.curve.find(c => c.k === pure.maxK)?.setSize || pure.maxSetSize,
        trials: pure.totalTrials, acc: (pure.overallAcc * 100).toFixed(0), streak: pure.maxStreak,
    })}
    `)}

    <div class="mc-grid">
      ${metricCardHTML({ label: t('rpt_m_cowansk'), value: pure.maxK.toFixed(1), accent: '#E95295', sub: t('rpt_m_cowansk_sub'), highlight: true })}
      ${metricCardHTML({ label: t('rpt_m_maxsetsize'), value: 'N=' + pure.maxSetSize, accent: '#E95295', sub: t('rpt_m_maxsetsize_sub') })}
      ${metricCardHTML({ label: t('rpt_m_avgrt'), value: pure.avgRT.toFixed(0), unit: 'ms', accent: '#E95295', sub: t('rpt_m_avgrt_sub') })}
      ${metricCardHTML({ label: t('rpt_m_overallacc'), value: (pure.overallAcc * 100).toFixed(0), unit: '%', accent: '#E95295', sub: t('rpt_m_overallacc_sub', { count: pure.totalTrials }) })}
    </div>
    <div class="mc-grid mc-grid-3">
      ${metricCardHTML({ label: t('rpt_m_fastest'), value: pure.fastest.toFixed(0), unit: 'ms', accent: '#E95295', sub: t('rpt_m_fastest_sub') })}
      ${metricCardHTML({ label: t('rpt_m_slowest'), value: pure.slowest.toFixed(0), unit: 'ms', accent: '#E95295', sub: t('rpt_m_slowest_sub') })}
      ${metricCardHTML({ label: t('rpt_m_beststreak'), value: pure.maxStreak, unit: t('rpt_m_beststreak_unit'), accent: '#E95295', sub: t('rpt_m_beststreak_sub') })}
    </div>

    <div class="chart-grid-2">
        ${barChartHTML(t('rpt_chart_k_title'), t('rpt_chart_k_sub'),
        padToStandardSizes(pure.curve).map(pt => ({ label: 'N=' + pt.setSize, val: pt.k, color: pt.k >= pure.maxK * 0.9 ? '#E95295' : '#F3B8CE' })),
        '#E95295', v => v.toFixed(1), pure.maxK)}
        ${barChartHTML(t('rpt_chart_acc_title'), t('rpt_chart_acc_sub'),
            padToStandardSizes(pure.curve).map(pt => ({ label: 'N=' + pt.setSize, val: pt.accuracy * 100, color: pt.accuracy >= 0.7 ? '#E95295' : pt.accuracy >= 0.5 ? '#F3B8CE' : '#DDD' })),
            '#E95295', v => Math.round(v) + '%', 50)}
    </div>

${sparklineHTML(pure.trialsChrono, `TRIAL BY TRIAL (${pure.trialsChrono.length})`, '#E95295')}

    ${glossaryHTML('#E95295', [
                { term: t('rpt_gloss_cowansk_term'), def: t('rpt_gloss_cowansk_def') },
                { term: t('rpt_gloss_setsize_term'), def: t('rpt_gloss_setsize_def') },
            ])}

    ${footerHTML('Section 01 / 03', reportId)}
  </div>
  `;

    /* ---------------- SECTION 2 ---------------- */
    const kDelta = dist.maxK - pure.maxK;
    const sec2 = `
  <div class="section">
    ${sectionHeaderHTML('02', t('rpt_sec2_label'), t('rpt_sec2_title'), '#50A87F', t('rpt_sec2_desc'))}

    ${interpretBoxHTML('#50A87F', '#F2FAF6', `
      ${t('rpt_interp2', {
        acc: (dist.overallAcc * 100).toFixed(0), trials: dist.totalTrials,
        change: distDrop >= 0 ? t('rpt_interp2_change_lower', { n: distDrop.toFixed(0) }) : t('rpt_interp2_change_higher', { n: Math.abs(distDrop).toFixed(0) }),
        k1: pure.maxK.toFixed(1), k2: dist.maxK.toFixed(1), execEff: execEfficiency.toFixed(1),
        resilience: Math.abs(distDrop) < 5 ? t('rpt_interp2_resilience_high') : Math.abs(distDrop) < 20 ? t('rpt_interp2_resilience_mod') : t('rpt_interp2_resilience_low'),
    })}
    `)}

    <div class="mc-grid">
      ${metricCardHTML({ label: t('rpt_m_cowansk_dist'), value: dist.maxK.toFixed(1), accent: '#50A87F', sub: t('rpt_m_cowansk_dist_sub'), highlight: true })}
      ${metricCardHTML({ label: t('rpt_m_overallacc'), value: (dist.overallAcc * 100).toFixed(0), unit: '%', accent: '#50A87F', sub: t('rpt_m_overallacc_sub', { count: dist.totalTrials }) })}
      ${metricCardHTML({ label: t('rpt_m_execeff'), value: execEfficiency.toFixed(1), unit: '%', accent: '#50A87F', sub: t('rpt_m_execeff_sub') })}
      ${metricCardHTML({ label: t('rpt_m_execspeed'), value: (execSpeed >= 0 ? '−' : '+') + Math.abs(execSpeed).toFixed(0), unit: 'ms', accent: '#50A87F', sub: execSpeed >= 0 ? t('rpt_m_execspeed_sub_faster') : t('rpt_m_execspeed_sub_slower') })}
    </div>

    <div class="change-panel">
      <div class="change-val" style="color:${kDelta >= 0 ? '#50A87F' : '#D44040'};">${kDelta >= 0 ? '+' : ''}${kDelta.toFixed(1)}</div>
      <div class="change-label">${t('rpt_change_label')}</div>
      <div class="change-text">
        ${t('rpt_change_text', {
        name: candFirst, direction: kDelta >= 0 ? t('rpt_change_increased') : t('rpt_change_decreased'),
        delta: Math.abs(kDelta).toFixed(1), k1: pure.maxK.toFixed(1), k2: dist.maxK.toFixed(1),
    })}
      </div>
      <div class="change-boxes">
        <div class="change-box">${pure.maxK.toFixed(1)}<span>${t('rpt_task1_label')}</span></div>
        <div class="change-arrow">→</div>
        <div class="change-box" style="border-color:#50A87F55;color:#50A87F;">${dist.maxK.toFixed(1)}<span>${t('rpt_task2_label')}</span></div>
      </div>
    </div>

    <div class="chart-grid-2">
        ${comparisonBarChartHTML(t('rpt_chart_kcompare_title'), t('rpt_chart_kcompare_sub'),
        STANDARD_SET_SIZES.map(n => 'N=' + n),
        padToStandardSizes(pure.curve).map(c => c.k),
        padToStandardSizes(dist.curve).map(c => c.k),
        '#E95295', '#50A87F', t('rpt_task1_pure'), t('rpt_task2_distractor'), v => v.toFixed(1))}
        ${comparisonBarChartHTML(t('rpt_chart_acccompare_title'), t('rpt_chart_acccompare_sub'),
            STANDARD_SET_SIZES.map(n => 'N=' + n),
            padToStandardSizes(pure.curve).map(c => c.accuracy * 100),
            padToStandardSizes(dist.curve).map(c => c.accuracy * 100),
            '#E95295', '#50A87F', t('rpt_task1_pure'), t('rpt_task2_distractor'), v => Math.round(v) + '%')}
    </div>

    ${sparklineHTML(dist.trialsChrono, `TRIAL BY TRIAL (${dist.trialsChrono.length})`, '#50A87F', 5)}

    ${glossaryHTML('#50A87F', [
                { term: t('rpt_gloss_cowanskdist_term'), def: t('rpt_gloss_cowanskdist_def') },
                { term: t('rpt_gloss_execeff_term'), def: t('rpt_gloss_execeff_def') },
                { term: t('rpt_gloss_execspeed_term'), def: t('rpt_gloss_execspeed_def') },
                { term: t('rpt_gloss_distractoreffect_term'), def: t('rpt_gloss_distractoreffect_def') },
            ])}

    ${footerHTML('Section 02 / 03', reportId)}
  </div>
  `;

    /* ---------------- SECTION 3 ---------------- */
    const networkCard = (labelKey, val, accent, bodyKey, pct) => `
    <div class="net-card" style="border-color:${accent}33;">
      <div class="net-label" style="color:${accent};">${t(labelKey)}</div>
      <div class="net-val">${val >= 0 ? '+' : ''}${val.toFixed(0)}<span class="net-unit">ms</span></div>
      <div class="net-body">${t(bodyKey, { val: val.toFixed(0) })}</div>
      <div class="net-pct-row">
        <span class="net-pct-label">${t('rpt_net_percentile_label')}</span>
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
    ${sectionHeaderHTML('03', t('rpt_sec3_label'), t('rpt_sec3_title'), '#1BA8D8', t('rpt_sec3_desc'))}

    ${interpretBoxHTML('#1BA8D8', '#F1F8FB', `
      ${t('rpt_interp3', {
        alerting: ant.alerting.toFixed(0), orienting: ant.orienting.toFixed(0), executive: ant.executive.toFixed(0),
        rtC: ant.rtCongruent.toFixed(0), rtI: ant.rtIncongruent.toFixed(0), trials: ant.totalTrials, acc: (ant.overallAcc * 100).toFixed(0),
    })}
    `)}

    <div class="net-grid">
      ${networkCard('rpt_net_alerting_label', ant.alerting, '#D4A030', 'rpt_net_alerting_body', alertPct)}
      ${networkCard('rpt_net_orienting_label', ant.orienting, '#E95295', 'rpt_net_orienting_body', orientPct)}
      ${networkCard('rpt_net_executive_label', ant.executive, '#1BA8D8', 'rpt_net_executive_body', execPct)}
    </div>

    <div class="mc-grid mc-grid-2">
    ${metricCardHTML({ label: t('rpt_m_congruentrt'), value: ant.rtCongruent.toFixed(0), unit: 'ms', accent: '#1BA8D8', sub: t('rpt_m_congruentrt_sub') })}
    ${metricCardHTML({ label: t('rpt_m_incongruentrt'), value: ant.rtIncongruent.toFixed(0), unit: 'ms', accent: '#1BA8D8', sub: t('rpt_m_incongruentrt_sub') })}
    </div>

    <div class="chart-grid-2">
        ${barChartHTML(t('rpt_chart_cuespeed_title'), t('rpt_chart_cuespeed_sub'),
        ant.rtByCue.map(r => ({ label: r.cue, val: r.rt })), '#1BA8D8', v => Math.round(v) + 'ms', null, true)}
        ${barChartHTML(t('rpt_chart_congr_title'), t('rpt_chart_congr_sub', { gap: Math.abs(ant.executive).toFixed(0) }),
            [{ label: 'Congruent', val: ant.rtCongruent, color: '#1BA8D8' }, { label: 'Incongruent', val: ant.rtIncongruent, color: '#E95295' }], '#1BA8D8', v => Math.round(v) + 'ms', null, true)}
    </div>

    ${sparklineHTML(ant.trialsChrono, `TRIAL BY TRIAL (${ant.trialsChrono.length})`, '#1BA8D8', 4)}

    <div class="mc-grid mc-grid-3">
      ${metricCardHTML({ label: t('rpt_m_alerteff'), value: ant.effAlerting.toFixed(2), unit: 'r/s', accent: '#D4A030', sub: t('rpt_m_alerteff_sub2') })}
      ${metricCardHTML({ label: t('rpt_m_orienteff'), value: ant.effOrienting.toFixed(2), unit: 'r/s', accent: '#E95295', sub: t('rpt_m_orienteff_sub2') })}
      ${metricCardHTML({ label: t('rpt_cs_executive') + ' Efficiency', value: ant.effExecutive.toFixed(2), unit: 'r/s', accent: '#1BA8D8', sub: t('rpt_m_execeff2_sub') })}
    </div>

    ${glossaryHTML('#1BA8D8', [
                { term: t('rpt_gloss_alerting_term'), def: t('rpt_gloss_alerting_def') },
                { term: t('rpt_gloss_orienting_term'), def: t('rpt_gloss_orienting_def') },
                { term: t('rpt_gloss_executive_term'), def: t('rpt_gloss_executive_def') },
                { term: t('rpt_gloss_congr_term'), def: t('rpt_gloss_congr_def') },
                { term: t('rpt_gloss_flanker_term'), def: t('rpt_gloss_flanker_def') },
                { term: t('rpt_gloss_cuetypes_term'), def: t('rpt_gloss_cuetypes_def') },
            ])}

    ${footerHTML('Section 03 / 03', reportId)}
  </div>
  `;

    /* ---------------- SUMMARY ---------------- */
    const bands = [
        { label: t('rpt_band_developing'), range: '0–29', lo: 0, hi: 29 },
        { label: t('rpt_band_average'), range: '30–49', lo: 30, hi: 49 },
        { label: t('rpt_band_aboveavg'), range: '50–69', lo: 50, hi: 69 },
        { label: t('rpt_band_strong'), range: '70–89', lo: 70, hi: 89 },
        { label: t('rpt_band_exceptional'), range: '90+', lo: 90, hi: 999 },
    ];

    const summary = `
  <div class="section" style="border-bottom:none;">
    <div class="summary-eyebrow">${t('rpt_summary_eyebrow')}</div>
    <h2 class="summary-title">${t('rpt_summary_title')}</h2>
    <p class="summary-sub">${t('rpt_summary_sub')}</p>

    <div class="composite-panel">
      <div>
        <div class="composite-panel-label">${t('rpt_composite_label')}</div>
        <div class="composite-panel-val">${composite.toFixed(1)}<span>/100</span></div>
        <div class="composite-panel-band">${scoreLabel(composite)}</div>
        <p class="composite-panel-text">${t('rpt_composite_text', { score: composite.toFixed(1), name: candFirst, band: scoreLabel(composite) })}</p>
      </div>
      <div class="bands-row">
        <div class="bands-title">${t('rpt_bands_title')}</div>
        <div class="bands-list">
          ${bands.map(b => `<div class="band-box ${composite >= b.lo && composite <= b.hi ? 'band-active' : ''}"><div>${b.label}</div><span>${b.range}</span></div>`).join('')}
        </div>
      </div>
    </div>

    <div class="chart-panel" style="margin-top:24px;">
    <div class="chart-title">${t('rpt_allscores_title')}</div>
    <div class="chart-sub"><span style="color:#50A87F;font-weight:700;">${t('rpt_allscores_legend_green')}</span> · <span style="color:#D4A030;font-weight:700;">${t('rpt_allscores_legend_amber')}</span> · <span style="color:#D44040;font-weight:700;">${t('rpt_allscores_legend_red')}</span></div>
    <div class="chart-with-axis">
        ${axisLabelsHTML({ min: 0, max: 100, ticks: [0, 25, 50, 75, 100] }, v => v)}
        <div class="chart-plot" style="height:180px;">
        ${gridlinesHTML({ min: 0, max: 100, ticks: [0, 25, 50, 75, 100] })}
        <div class="chart">
            ${componentScores.map(cs => `
            <div class="chart-col">
                <div class="chart-val">${cs.score.toFixed(0)}</div>
                <div class="chart-fill" style="height:${Math.max(3, cs.score)}%; background:${scoreColor(cs.score)};"></div>
                <div class="chart-lbl">${cs.short}</div>
            </div>
            `).join('')}
        </div>
        </div>
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
        <div class="strength-title" style="color:#50A87F;">${t('rpt_strengths_title')}</div>
        <ul>
          ${strengths.map(st => `<li>${t('rpt_strength_item', { name: st.name, score: st.score.toFixed(0) })}</li>`).join('')}
        </ul>
      </div>
      <div class="strength-box strength-dev">
        <div class="strength-title" style="color:#D4A030;">${t('rpt_dev_title')}</div>
        <ul>
          ${developing.map(dv => `<li>${t('rpt_strength_item', { name: dv.name, score: dv.score.toFixed(0) })}</li>`).join('')}
        </ul>
      </div>
    </div>

    <div class="about-box">
      <div class="about-title">${t('rpt_about_title')}</div>
      <p>${t('rpt_about_text')}</p>
    </div>

    <div class="final-footer">
    <img src="${logoUrl}" alt="Xiberlinc" class="final-footer-logo-img" />
      <div class="final-footer-meta">
        <div>${reportId} · ${assessDate}</div>
        <div>${t('rpt_footer_copyright', { year: new Date().getFullYear() })}</div>
      </div>
    </div>
  </div>
  `;

    /* ---------------- COVER ---------------- */
    const cover = `
  <div class="cover">
    <div class="cover-stripe"></div>
    <div class="cover-head">
    <img src="${logoUrl}" alt="Xiberlinc" class="cover-logo-img" />
      <div>
        <div class="report-id-label">${t('rpt_report_id')}</div>
        <div class="report-id">${reportId}</div>
      </div>
    </div>
    <div class="cover-grid">
      <div>
        <div class="eyebrow">${t('rpt_eyebrow')}</div>
        <div class="cover-title">${t('rpt_cover_title_1')}<br>${t('rpt_cover_title_2')}<br><span class="accent">${t('rpt_cover_title_3')}</span></div>
        <div class="cover-sub">${t('rpt_cover_sub')}</div>
        <div class="cand-box">
        <div class="cand-grid">
        <div><div class="cand-label">${t('rpt_cand_participant')}</div><div class="cand-val">${c.name || '—'}</div></div>
        <div><div class="cand-label">${t('rpt_cand_handle')}</div><div class="cand-val">@${c.handle || '—'}</div></div>
        <div><div class="cand-label">${t('rpt_cand_assessperiod')}</div><div class="cand-val">${assessDateRange}${sessionCount > 1 ? ` (${sessionCount} sessions)` : ''}</div></div>
        <div><div class="cand-label">${t('rpt_cand_completedat')}</div><div class="cand-val">${completedTime}</div></div>
        <div><div class="cand-label">${t('rpt_cand_totaltrials')}</div><div class="cand-val">${trials.length}</div></div>
        <div><div class="cand-label">${t('rpt_cand_age')}</div><div class="cand-val">${c.age || '—'}</div></div>
        <div><div class="cand-label">${t('rpt_cand_sporttype')}</div><div class="cand-val">${sportType}</div></div>
        <div><div class="cand-label">${t('rpt_cand_playertype')}</div><div class="cand-val">${playerType}</div></div>
        </div>
        </div>
      </div>
      <div class="gauge-side">
        ${compositeGaugeHTML(composite)}
        <div style="width:100%;">
          <div class="comp-scores-title">${t('rpt_component_scores')}</div>
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
        <div class="idx-item"><div class="idx-bar" style="background:#E95295;"></div><div><div class="idx-label" style="color:#E95295;">${t('rpt_sec1_label').replace('SECTION ', 'Section ')}</div><div class="idx-desc">${t('rpt_sec1_title')}</div></div></div>
        <div class="idx-item"><div class="idx-bar" style="background:#50A87F;"></div><div><div class="idx-label" style="color:#50A87F;">${t('rpt_sec2_label').replace('SECTION ', 'Section ')}</div><div class="idx-desc">${t('rpt_sec2_title')}</div></div></div>
        <div class="idx-item"><div class="idx-bar" style="background:#1BA8D8;"></div><div><div class="idx-label" style="color:#1BA8D8;">${t('rpt_sec3_label').replace('SECTION ', 'Section ')}</div><div class="idx-desc">${t('rpt_sec3_title')}</div></div></div>
      </div>
      <div class="confidential">${t('rpt_confidential')} · ${assessDate}</div>
    </div>
  </div>
  `;

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${c.name || 'Candidate'} — ${t('rpt_summary_title')}</title>
<style>${reportStyles}</style>
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