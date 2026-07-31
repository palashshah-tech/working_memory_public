/* ============================================================
   Admin View — Hidden dashboard (/admin)
   Primary/Secondary Key Architecture
   ============================================================ */

import { render, $, downloadFile } from '../utils/dom.js';
import { Storage } from '../utils/storage.js';
import { recalculateRanks, getTierDistribution, getStatsSummary } from '../scoring/RankingEngine.js';
import { computeFullScores } from '../scoring/ScoringEngine.js';
import { injectStyle } from '../router.js';
import { validateAdminAccess, validatePlayerAccess, createSecondaryKey, getSecondaryKeys, revokeSecondaryKey, reactivateSecondaryKey } from '../utils/access.js';
import { t, getLang, setLang } from '../utils/i18n.js';
import { generateSvgLineChart } from '../utils/charts.js';

let authed = false;
let adminCompanyId = null;
let adminCompanyName = '';
let adminCode = null;        // the primary key code used to login
let playerMode = false;      // true if logged in with a secondary key
let playerCode = null;       // the secondary key code
let playerName = '';         // the player name from the secondary key

export function AdminView() {
  injectStyle(`
    /* Gate screen — premium redesign */
    .av-gate {
      min-height:100vh; display:flex; align-items:center;
      justify-content:center; padding:40px 24px;
      position:relative; overflow:hidden;
      background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,255,0,0.09) 0%, transparent 60%),
                  radial-gradient(ellipse 60% 50% at 85% 80%, rgba(160,255,0,0.06) 0%, transparent 55%);
    }
    /* Animated grid */
    .av-gate::before {
      content:''; position:absolute; inset:0;
      background-image:
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
      background-size: 48px 48px;
      animation: grid-drift 20s linear infinite;
      pointer-events:none;
    }
    @keyframes grid-drift {
      from { background-position: 0 0; }
      to   { background-position: 48px 48px; }
    }
    /* Glowing orbs */
    .av-gate-orb {
      position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none; opacity:0.35;
      animation: orb-float ease-in-out infinite alternate;
    }
    .av-gate-orb-1 { width:350px; height:350px; top:-80px; left:-80px; background:#d4ff00; animation-duration:8s; }
    .av-gate-orb-2 { width:280px; height:280px; bottom:-60px; right:-40px; background:#8aff00; animation-duration:10s; }
    .av-gate-orb-3 { width:180px; height:180px; top:40%; left:60%; background:#d4ff00; opacity:0.12; animation-duration:6s; }
    @keyframes orb-float {
      from { transform: translate(0,0) scale(1); }
      to   { transform: translate(12px,18px) scale(1.06); }
    }
    .av-gate-card {
      max-width: 420px; width:100%;
      position: relative; z-index: 1;
      background: rgba(13,13,18,0.75);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px;
      padding: 48px 44px;
      box-shadow: 0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
      animation: gate-card-in 0.5s cubic-bezier(0.2,0,0,1);
    }
    @keyframes gate-card-in {
      from { opacity:0; transform: translateY(24px) scale(0.97); }
      to   { opacity:1; transform: none; }
    }
    .av-err { color:#f87171; font-size:13px; margin-top:12px; }

    /* Layout */
    .av { min-height:100vh; display:flex; flex-direction:column; }
    .av-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:12px 24px;
      border-bottom:1px solid rgba(255,255,255,0.06);
      background:rgba(0,0,0,0.4);
      backdrop-filter:blur(16px);
      position:sticky; top:0; z-index:50;
    }
    .av-logo {
      display:flex; align-items:center; gap:10px;
      font-size:1.1rem; font-weight:700;
      font-family: var(--font-body);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .av-logo-img {
      height: 28px;
      width: auto;
    }
    .av-actions { display:flex; gap:8px; }

    .av-body { flex:1; padding:24px; }

    /* Top section */
    .av-top { display:grid; grid-template-columns:1fr; gap:16px; margin-bottom:20px; }
    .av-title h1 { font-size:1.6rem; margin-bottom:6px; }
    .av-title p { color:var(--text-tertiary); font-size:0.9rem; }
    .av-top-row {
      display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;
    }
    .av-controls { display:flex; gap:8px; flex-wrap:wrap; }
    .av-control {
      display:flex; align-items:center; gap:6px;
      padding:6px 10px; border-radius:4px;
      background:rgba(212,255,0,0.04);
      border:1px solid rgba(212,255,0,0.1);
      font-family:var(--font-mono); font-size:11px; color:#9a9a9f;
      transition:all 0.15s ease;
    }
    .av-control-btn {
      cursor:pointer; background:transparent;
    }
    .av-control:hover, .av-control-btn:hover {
      background:rgba(212,255,0,0.08);
      border-color:rgba(212,255,0,0.2);
    }
    .av-control-btn.active {
      background:rgba(212,255,0,0.1);
      border-color:rgba(212,255,0,0.3);
      color:#d4ff00;
    }
    .av-search {
      min-width:240px; flex:1; max-width:360px;
      background:rgba(212,255,0,0.04);
      border:1px solid rgba(212,255,0,0.12);
      border-radius:4px; padding:8px 12px;
      display:flex; align-items:center; gap:8px;
      color:#9a9a9f;
      transition:all 0.2s ease;
    }
    .av-search:focus-within {
      background:rgba(212,255,0,0.08);
      border-color:rgba(212,255,0,0.3);
    }
    .av-search input {
      background:transparent; border:none; outline:none; color:#e0e0e2;
      width:100%; font-size:13px; font-family:var(--font-body);
    }
    .av-search input::placeholder { color:#9a9a9f; }

    /* KPIs */
    .av-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:22px; }
    @media (max-width: 980px) {
      .av-kpis { grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); }
    }
    .av-kpi-card {
      background:rgba(255,255,255,0.02);
      border:1px solid rgba(255,255,255,0.07);
      border-radius:16px; padding:18px 20px;
    }
    .av-kpi-label {
      font-family:var(--font-mono); font-size:11px; color:var(--text-tertiary);
      letter-spacing:0.08em; text-transform:uppercase; margin-bottom:8px;
    }
    .av-kpi-val { font-family:var(--font-display); font-size:2.2rem; font-weight:700; }

    /* Leaderboard */
    .av-board {
      background:rgba(255,255,255,0.02);
      border:1px solid rgba(255,255,255,0.07);
      border-radius:16px; overflow:hidden;
      margin-bottom:24px;
    }
    .av-board-head {
      display:flex; justify-content:space-between; align-items:center;
      padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.06);
    }
    .av-board-head h2 { font-size:1rem; }
    .av-board-sub { font-size:12px; color:var(--text-tertiary); }
    .av-board-table { width:100%; border-collapse:collapse; font-size:13px; }
    .av-board-table thead { background:rgba(0,0,0,0.3); }
    .av-board-table th {
      padding:10px 14px; text-align:left;
      font-family:var(--font-mono); font-size:10px; color:var(--text-tertiary);
      letter-spacing:0.08em; text-transform:uppercase;
      border-bottom:1px solid rgba(255,255,255,0.06);
      white-space:nowrap;
    }
    .av-board-table td {
      padding:12px 14px; border-bottom:1px solid rgba(255,255,255,0.04);
      color:var(--text-secondary); white-space:nowrap;
    }
    .av-board-table tr:hover { background:rgba(255,255,255,0.03); }
    .av-rank { font-family:var(--font-mono); font-weight:700; color:var(--text-primary); }
    .av-candidate { display:flex; align-items:center; gap:10px; }
    .av-avatar {
      width:28px; height:28px; border-radius:50%;
      background:linear-gradient(135deg,#00f0ff33,#a855f733);
      border:1px solid rgba(255,255,255,0.1);
      display:flex; align-items:center; justify-content:center;
      font-size:12px; color:#00f0ff;
    }
    .av-name { display:flex; flex-direction:column; gap:2px; }
    .av-name strong { color:var(--text-primary); font-weight:600; }
    .av-handle {
      font-family:var(--font-mono); font-size:10px; color:#00f0ff;
      background:rgba(0,240,255,0.08); padding:2px 8px; border-radius:999px;
      width:max-content;
    }

    /* Tier bar */
    .av-tier-bar-wrap {
      background:rgba(255,255,255,0.02);
      border:1px solid rgba(255,255,255,0.07);
      border-radius:14px; padding:16px 20px;
      margin-bottom:24px;
    }
    .av-tier-bar-head {
      display:flex; justify-content:space-between; align-items:center;
      margin-bottom:10px;
      font-family:var(--font-mono); font-size:11px; color:var(--text-tertiary); letter-spacing:0.08em; text-transform:uppercase;
    }
    .av-tier-legend { display:flex; gap:14px; flex-wrap:wrap; }
    .av-tier-dot { display:inline-block; width:8px; height:8px; border-radius:2px; }
    .av-tier-bar { display:flex; height:10px; border-radius:99px; overflow:hidden; }
    .av-tier-seg { height:100%; transition:width 0.5s ease; }

    /* Table */
    .av-table-wrap {
      background:rgba(255,255,255,0.02);
      border:1px solid rgba(255,255,255,0.07);
      border-radius:14px; overflow:hidden;
    }
    .av-table-head {
      display:flex; justify-content:space-between; align-items:center;
      padding:14px 20px;
      border-bottom:1px solid rgba(255,255,255,0.06);
    }
    .av-table-head h2 { font-size:1rem; }
    .av-table-count   { font-size:13px; color:var(--text-tertiary); }
    .av-table-scroll  { overflow-x:auto; }
    table.av-t { width:100%; border-collapse:collapse; font-size:13px; }
    table.av-t thead { background:rgba(0,0,0,0.3); }
    table.av-t th {
      padding:9px 14px; text-align:left;
      font-family:var(--font-mono); font-size:10px; color:var(--text-tertiary);
      letter-spacing:0.08em; text-transform:uppercase;
      border-bottom:1px solid rgba(255,255,255,0.06);
      white-space:nowrap; cursor:pointer;
    }
    table.av-t th:hover { color:var(--text-secondary); }
    table.av-t td { padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.04); color:var(--text-secondary); white-space:nowrap; }
    table.av-t tr:last-child td { border-bottom:none; }
    table.av-t tbody tr:hover { background:rgba(255,255,255,0.025); }

    .td-name  { color:var(--text-primary)!important; font-weight:500; }
    .td-score-hi { color:#34d399!important; font-family:var(--font-mono); }
    .td-score-md { color:#fbbf24!important; font-family:var(--font-mono); }
    .td-score-lo { color:#f87171!important; font-family:var(--font-mono); }
    .td-mono     { font-family:var(--font-mono); }

    .tier-pip {
      display:inline-flex; align-items:center; justify-content:center;
      width:30px; height:22px; font-size:11px; font-weight:700;
      font-family:var(--font-mono); border-radius:5px; letter-spacing:0.03em;
    }
    .tier-sp { background:#ffd70020; color:#ffd700; }
    .tier-s  { background:rgba(0,240,255,0.12); color:#00f0ff; }
    .tier-a  { background:rgba(168,85,247,0.15); color:#a855f7; }
    .tier-b  { background:rgba(52,211,153,0.15); color:#34d399; }
    .tier-c  { background:rgba(251,191,36,0.15); color:#fbbf24; }
    .tier-d  { background:rgba(248,113,113,0.15); color:#f87171; }

    .av-empty { padding:80px 24px; text-align:center; color:var(--text-tertiary); }
    .av-empty-icon { font-size:3rem; margin-bottom:16px; opacity:0.4; }

    /* Detail modal */
    .av-modal-bg {
      position:fixed; inset:0; background:rgba(8,8,9,0.8);
      backdrop-filter:blur(12px);
      display:flex; align-items:center; justify-content:center;
      z-index:200; padding:20px;
      animation:fade-in 0.2s ease-out;
    }
    .av-modal {
      max-width:920px; width:100%;
      max-height:90vh; overflow-y:auto;
      background:var(--bg-offset);
      border:1px solid rgba(212,255,0,0.15);
      border-radius:4px;
      box-shadow:0 30px 80px rgba(0,0,0,0.6), 0 0 1px rgba(212,255,0,0.1);
      animation:slide-up 0.3s cubic-bezier(0.2,0,0,1);
    }
    .av-modal-header {
      display:flex; justify-content:space-between; align-items:flex-start;
      padding:24px 28px;
      border-bottom:1px solid rgba(212,255,0,0.08);
      position:sticky; top:0; background:var(--bg-offset); z-index:1;
    }
    .av-modal-header h2 { font-family:var(--font-display); font-size:1.8rem; }
    .av-modal-body { padding:28px; }
    .av-modal-meta {
      display:flex; align-items:center; gap:12px; flex-wrap:wrap;
      color:#9a9a9f; font-size:13px; margin-top:6px;
      font-family:var(--font-mono);
    }
    .av-metrics {
      display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
      gap:12px; margin:26px 0 32px;
    }
    .av-metric  {
      background:rgba(212,255,0,0.03);
      border:1px solid rgba(212,255,0,0.1);
      border-radius:4px; padding:16px 14px;
      display:flex; flex-direction:column; gap:8px;
      transition:all 0.2s ease;
      position:relative;
    }
    .av-metric:hover {
      background:rgba(212,255,0,0.06);
      border-color:rgba(212,255,0,0.2);
    }
    .av-metric-label {
      font-family:var(--font-mono); font-size:10px; color:#9a9a9f;
      letter-spacing:0.1em; text-transform:uppercase;
    }
    .av-metric-val { font-family:var(--font-display); font-size:1.7rem; font-weight:700; color:#d4ff00; }

    .av-chart-title {
      font-size:11px; margin-bottom:14px; color:#9a9a9f;
      font-family:var(--font-mono); text-transform:uppercase; letter-spacing:0.1em;
      margin-top:28px;
    }
    .av-chart {
      display:flex; align-items:flex-end; gap:10px; height:180px;
      margin-bottom:28px; padding:16px 12px 16px;
      background:rgba(212,255,0,0.02);
      border:1px solid rgba(212,255,0,0.08);
      border-radius:4px;
    }
    .av-bar-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; height:100%; justify-content:flex-end; }
    .av-bar-val { font-family:var(--font-mono); font-size:10px; color:#9a9a9f; }
    .av-bar {
      width:100%; border-radius:3px 3px 0 0; min-height:4px;
      background:#d4ff00;
      box-shadow:0 8px 24px rgba(212,255,0,0.25);
      transition:all 0.2s ease;
    }
    .av-bar-lbl { font-family:var(--font-mono); font-size:10px; color:#9a9a9f; }
    @keyframes fade-in { from { opacity:0; } to { opacity:1; } }
    @keyframes slide-up { from { transform:translateY(12px); opacity:0; } to { transform:translateY(0); opacity:1; } }

    /* Buttons */
    .av-btn {
      font-family:var(--font-display); font-size:13px; font-weight:500;
      padding:8px 16px; border-radius:8px; cursor:pointer;
      transition:all 0.15s; outline:none;
    }
    .av-btn-ghost {
      background:transparent; color:var(--text-secondary);
      border:1px solid rgba(255,255,255,0.1);
    }
    .av-btn-ghost:hover { background:rgba(255,255,255,0.05); color:var(--text-primary); }
    .av-btn-primary {
      background:linear-gradient(135deg,#00f0ff,#a855f7);
      color:#000; border:none;
    }
    .av-btn-view {
      font-family:var(--font-mono); font-size:11px;
      background:rgba(255,255,255,0.04);
      border:1px solid rgba(255,255,255,0.08);
      color:var(--text-secondary);
      padding:4px 10px; border-radius:6px; cursor:pointer;
    }
    .av-btn-view:hover { background:rgba(255,255,255,0.08); color:var(--text-primary); }

    /* ── Tabs ─────────────────────────────────────────────── */
    .av-tabs {
      display:flex; border-bottom:1px solid rgba(255,255,255,0.08);
      padding:0 28px; background:var(--bg-offset);
      position:sticky; top:77px; z-index:1;
    }
    .av-tab {
      padding:12px 20px; font-family:var(--font-mono); font-size:12px;
      letter-spacing:0.06em; text-transform:uppercase;
      color:var(--text-tertiary); background:transparent; border:none;
      border-bottom:2px solid transparent; cursor:pointer;
      transition:all 0.15s; margin-bottom:-1px;
    }
    .av-tab:hover { color:var(--text-secondary); }
    .av-tab.av-tab-active { color:#d4ff00; border-bottom-color:#d4ff00; }
    .av-hidden { display:none !important; }


    /* ── Raw data tab ─────────────────────────────────────── */
    .raw-section { margin-bottom:28px; }
    .raw-section-title {
      font-family:var(--font-mono); font-size:10px; text-transform:uppercase;
      letter-spacing:0.1em; color:var(--text-tertiary); margin-bottom:12px;
      padding-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.06);
    }
    .raw-glance-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:10px; }
    .raw-glance-card {
      background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07);
      border-radius:10px; padding:14px;
    }
    .raw-glance-label { font-size:11px; color:var(--text-tertiary); margin-bottom:6px; }
    .raw-glance-val { font-family:var(--font-display); font-size:1.4rem; font-weight:700; }
    .raw-trial-table { width:100%; border-collapse:collapse; font-size:12px; }
    .raw-trial-table th {
      padding:7px 10px; text-align:left; font-family:var(--font-mono); font-size:10px;
      color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.07em;
      border-bottom:1px solid rgba(255,255,255,0.07); white-space:nowrap;
    }
    .raw-trial-table td { padding:7px 10px; border-bottom:1px solid rgba(255,255,255,0.04); color:var(--text-secondary); }
    .raw-trial-table tr:last-child td { border-bottom:none; }
    .raw-trial-table tbody tr:hover td { background:rgba(255,255,255,0.02); }
    .color-swatch { display:inline-block; width:11px; height:11px; border-radius:2px; margin-right:2px; vertical-align:middle; border:1px solid rgba(255,255,255,0.15); }
    .raw-correct { color:#34d399; font-weight:700; }
    .raw-wrong   { color:#f87171; font-weight:700; }
    .color-acc-grid { display:flex; flex-wrap:wrap; gap:8px; }
    .color-acc-card {
      display:flex; align-items:center; gap:10px;
      background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.07);
      border-radius:8px; padding:10px 14px;
      transition:border-color 0.15s;
    }
    .color-acc-card:hover { border-color:rgba(255,255,255,0.15); }
    .color-acc-swatch { width:20px; height:20px; border-radius:4px; border:1px solid rgba(255,255,255,0.2); flex-shrink:0; }
    .color-acc-name { font-size:11px; color:var(--text-tertiary); text-transform:capitalize; margin-bottom:2px; }
    .color-acc-pct { font-family:var(--font-display); font-size:1.1rem; font-weight:700; line-height:1; }
    .color-acc-count { font-size:10px; color:var(--text-tertiary); font-family:var(--font-mono); margin-top:2px; }
    .sparkline { display:flex; align-items:flex-end; gap:2px; height:64px; }
    .spark-bar { flex:1; border-radius:2px 2px 0 0; min-height:3px; cursor:default; opacity:0.85; transition:opacity 0.1s; }
    .spark-bar:hover { opacity:1; }
    .spark-legend { display:flex; gap:16px; margin-top:8px; }
    .spark-legend-item { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-tertiary); }
    .spark-legend-dot { width:10px; height:10px; border-radius:2px; flex-shrink:0; }

    /* ── Metric info button (i) ──────────────────────────── */
    .av-metric-info-btn {
      position: absolute; top: 8px; right: 8px;
      width: 18px; height: 18px; border-radius: 50%;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      color: var(--text-tertiary); font-size: 10px; font-style: italic; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.15s; line-height: 1; font-family: serif;
      padding: 0;
    }
    .av-metric-info-btn:hover {
      background: rgba(212,255,0,0.1); border-color: rgba(212,255,0,0.4);
      color: #d4ff00; transform: scale(1.1);
    }

    /* ── Metric explanation overlay ──────────────────────── */
    .av-explain-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(4px);
      z-index: 500;
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      animation: av-fade-in 0.2s ease;
    }
    @keyframes av-fade-in { from { opacity:0; } to { opacity:1; } }
    .av-explain-card {
      background: #13131a;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      max-width: 600px; width: 100%;
      padding: 36px 32px;
      position: relative;
      animation: av-card-in 0.28s cubic-bezier(0.2,0,0,1.2);
      box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,255,0,0.08);
    }
    @keyframes av-card-in { from { opacity:0; transform:scale(0.88) translateY(16px); } to { opacity:1; transform:none; } }
    .av-explain-tag {
      font-family: var(--font-mono); font-size: 10px; text-transform: uppercase;
      letter-spacing: 0.12em; color: #d4ff00;
      background: rgba(212,255,0,0.08); border: 1px solid rgba(212,255,0,0.2);
      padding: 3px 10px; border-radius: 20px;
      display: inline-block; margin-bottom: 16px;
    }
    .av-explain-title {
      font-size: 1.6rem; font-weight: 700;
      background: linear-gradient(135deg,#ffffff,rgba(255,255,255,0.7));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 14px; line-height: 1.2;
    }
    .av-explain-body {
      font-size: 15px; color: var(--text-secondary); line-height: 1.7;
      margin-bottom: 20px;
    }
    .av-explain-analogy {
      background: rgba(212,255,0,0.05);
      border-left: 3px solid #d4ff00;
      border-radius: 0 10px 10px 0;
      padding: 14px 16px;
      font-size: 13px; color: var(--text-secondary); line-height: 1.6;
      margin-bottom: 20px;
    }
    .av-explain-analogy strong { color: var(--text-primary); }
    .av-explain-close {
      position: absolute; top: 16px; right: 16px;
      width: 32px; height: 32px; border-radius: 50%;
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      color: var(--text-tertiary); font-size: 1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s;
    }
    .av-explain-close:hover { background: rgba(255,255,255,0.1); color: var(--text-primary); }
    .av-explain-formula {
      font-family: var(--font-mono); font-size: 12px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px; padding: 12px 14px;
      color: var(--text-secondary); line-height: 1.6;
      margin-bottom: 20px; word-break: break-word;
    }
    .av-formula-label {
      display: block; font-size: 9px; text-transform: uppercase;
      letter-spacing: 0.12em; color: var(--text-tertiary);
      margin-bottom: 6px;
    }
  `);

  if (!authed) { showGate(); } else if (playerMode) { showPlayerDashboard(); } else { showDashboard(); }
}

/* ---- Gate ---- */
function showGate() {
  render(`
    <div class="av-gate">
      <div class="av-gate-orb av-gate-orb-1"></div>
      <div class="av-gate-orb av-gate-orb-2"></div>
      <div class="av-gate-orb av-gate-orb-3"></div>

      <!-- Language switch at top right -->
      <div style="position: absolute; top: 24px; right: 24px; z-index: 100;">
        <button id="av-lang-toggle-gate" class="av-btn av-btn-ghost" style="padding:6px 12px; font-size:12px; font-family:var(--font-mono); border:1px solid rgba(255,255,255,0.12); border-radius:6px; background:rgba(255,255,255,0.03); color:#e0e0e2; cursor:pointer;">
          ${t('lang_toggle')}
        </button>
      </div>

      <div class="av-gate-card">
        <!-- Logo -->
        <div class="agc-logo">
          <img src="/xiberlinc_logo.png" alt="Xiberlinc" class="agc-logo-img" />
        </div>

        <div class="agc-eyebrow">${t('ad_gate_restricted')}</div>
        <h1 class="agc-title">${t('ad_gate_title')}</h1>
        <p class="agc-sub">${t('ad_gate_sub')}</p>

        <div class="agc-fields">
          <div class="agc-field-wrap">
            <div class="agc-field-icon">🔒</div>
            <input class="agc-input" type="password" id="ap-pass" placeholder="${t('ad_gate_placeholder_pass')}" autocomplete="off" />
          </div>
        </div>

        <button class="agc-btn" id="ap-auth">
          <span class="agc-btn-text">${t('ad_gate_btn')}</span>
          <span class="agc-btn-arrow">→</span>
        </button>

        <div class="av-err" id="ap-err" style="display:none;"></div>

        <div class="agc-footer">${t('ad_gate_footer')}</div>
      </div>
    </div>
  `);

  injectStyle(`
    /* ── Gate card internals ─────────────────────────────── */
    .agc-logo {
      width: 180px; margin: 0 auto 24px;
      display: flex; align-items: center; justify-content: center;
    }
    .agc-logo-img {
      width: 100%; height: auto;
      opacity: 0.92;
    }
    .agc-eyebrow {
      font-family: var(--font-mono); font-size: 10px; font-weight: 600;
      letter-spacing: 0.2em; text-transform: uppercase;
      color: #d4ff00; text-align: center; margin-bottom: 10px;
    }
    .agc-title {
      font-family: var(--font-display); font-size: 2.2rem; font-weight: 800;
      text-align: center; margin-bottom: 10px; line-height: 1.1;
      background: linear-gradient(160deg, #ffffff 30%, rgba(255,255,255,0.5));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .agc-sub {
      font-size: 13px; color: var(--text-tertiary); text-align: center;
      line-height: 1.65; margin-bottom: 36px;
    }
    .agc-fields { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
    .agc-field-wrap {
      position: relative; display: flex; align-items: center;
    }
    .agc-field-icon {
      position: absolute; left: 14px;
      font-size: 13px; color: var(--text-tertiary);
      pointer-events: none; font-family: var(--font-mono);
      transition: color 0.2s;
    }
    .agc-input {
      width: 100%; padding: 14px 16px 14px 42px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      font-size: 14px; color: var(--text-primary);
      font-family: var(--font-mono);
      outline: none; transition: all 0.2s;
      letter-spacing: 0.04em;
    }
    .agc-input::placeholder { color: var(--text-tertiary); font-style: italic; letter-spacing: 0; }
    .agc-input:focus {
      background: rgba(212,255,0,0.03);
      border-color: rgba(212,255,0,0.35);
      box-shadow: 0 0 0 3px rgba(212,255,0,0.07);
    }
    .agc-field-wrap:focus-within .agc-field-icon { color: #d4ff00; }
    .agc-btn {
      width: 100%; padding: 15px 24px;
      background: linear-gradient(135deg, #d4ff00 0%, #aaff00 100%);
      border: none; border-radius: 12px; cursor: pointer;
      font-family: var(--font-display); font-size: 15px; font-weight: 700;
      color: #080810;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      position: relative; overflow: hidden;
      transition: transform 0.15s, box-shadow 0.15s;
      margin-bottom: 16px;
    }
    .agc-btn::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%);
      opacity: 0; transition: opacity 0.2s;
    }
    .agc-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 32px rgba(212,255,0,0.3); }
    .agc-btn:hover::before { opacity: 1; }
    .agc-btn:active { transform: translateY(0); }
    .agc-btn-arrow { font-size: 1.1rem; transition: transform 0.2s; }
    .agc-btn:hover .agc-btn-arrow { transform: translateX(3px); }
    .agc-footer {
      text-align: center; font-size: 11px; color: var(--text-tertiary);
      font-family: var(--font-mono); margin-top: 4px; letter-spacing: 0.04em;
    }
    .av-err { color:#f87171; font-size:13px; margin-top:4px; text-align:center; }
  `);

  const doAuth = async () => {
    const pass  = document.getElementById('ap-pass').value;
    const errEl = document.getElementById('ap-err');
    const btn   = document.getElementById('ap-auth');
    errEl.style.display = 'none';
    btn.querySelector('.agc-btn-text').textContent = 'Verifying...';
    btn.disabled = true;

    // Validate as Admin Password (public database uses admin@cogscreen.public)
    const res = await validateAdminAccess(pass);

    btn.querySelector('.agc-btn-text').textContent = t('ad_gate_btn');
    btn.disabled = false;
    if (res.ok) {
      authed = true;
      playerMode = false;
      adminCode = res.code;
      adminCompanyId = res.companyId;
      adminCompanyName = res.companyName || res.companyId;
      showDashboard();
    } else {
      if (res.reason === 'auth_failed') {
        errEl.textContent = `Admin account not found. Create a Firebase Auth user: ${res.email}`;
      } else {
        errEl.textContent = 'Invalid password.';
      }
      errEl.style.display = 'block';
      document.getElementById('ap-pass').value = '';
      document.getElementById('ap-pass').focus();
    }
  };
  document.getElementById('ap-auth').addEventListener('click', doAuth);
  document.getElementById('ap-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doAuth(); });
  document.getElementById('av-lang-toggle-gate').addEventListener('click', () => {
    const newLang = getLang() === 'en' ? 'ja' : 'en';
    setLang(newLang);
    AdminView();
  });
}

/* ---- Dashboard ---- */
async function showDashboard() {
  const loadingHtml = `
    <div class="av">
      <div class="av-empty">
        <div class="av-empty-icon animate-pulse">☁️</div>
        <p>${t('ad_syncing')}</p>
      </div>
    </div>
  `;
  render(loadingHtml);

  const rawCandidates = await Storage.getCandidates(adminCompanyId || undefined);
  rawCandidates.forEach(c => {
    if (c.trials && c.trials.length > 0) {
      c.scores = computeFullScores(c.trials);
    }
  });
  const candidates = recalculateRanks(rawCandidates);
  const stats = getStatsSummary(candidates);
  const tiers = getTierDistribution(candidates);
  const n = candidates.length;

  const TIER_COLORS = { 'S+':'#ffd700','S':'#00f0ff','A':'#a855f7','B':'#34d399','C':'#fbbf24','D':'#f87171' };
  const TIER_CLS    = { 'S+':'sp','S':'s','A':'a','B':'b','C':'c','D':'d' };

  render(`
    <div class="av">
      <header class="av-header">
        <div class="av-logo">
          <img src="/xiberlinc_mark.png" alt="Xiberlinc" class="av-logo-img" />
          <span>${t('ad_admin')}</span>
        </div>
        <div class="av-actions">
          <button class="av-btn av-btn-ghost" id="av-keys" style="color:#d4ff00; font-family:var(--font-mono); font-size:12px; border:1px solid rgba(212,255,0,0.25); background:rgba(212,255,0,0.08);">🔑 Player Keys</button>
          <button class="av-btn av-btn-ghost" id="av-lang-toggle" style="color:#d4ff00; font-family:var(--font-mono); font-size:12px; border:1px solid rgba(212,255,0,0.25); background:rgba(212,255,0,0.08);">${t('lang_toggle')}</button>
          <button class="av-btn av-btn-ghost" id="av-refresh">↻ ${t('ad_refresh')}</button>
          <button class="av-btn av-btn-ghost" id="av-logout">🚪 ${t('ad_logout')}</button>
          <button class="av-btn av-btn-ghost" id="av-json">↓ ${t('ad_json')}</button>
          <button class="av-btn av-btn-ghost" id="av-csv">↓ ${t('ad_csv')}</button>
        </div>
      </header>

      <div class="av-body">
        <div class="av-top">
          <div class="av-title">
            <h1>${t('ad_leaderboard')}</h1>
            <p>${t('ad_leaderboard_sub')}</p>
          </div>
          <div class="av-top-row">
            <label class="av-search" aria-label="Search candidates">
              <span>${t('ad_search_label')}</span>
              <input type="text" placeholder="${t('ad_search_placeholder')}" />
            </label>
          </div>
        </div>

        <div class="av-kpis">
          <div class="av-kpi-card">
            <div class="av-kpi-label">${t('ad_kpi_total')}</div>
            <div class="av-kpi-val">${n}</div>
          </div>
          <div class="av-kpi-card">
            <div class="av-kpi-label">${t('ad_kpi_avg_composite')}</div>
            <div class="av-kpi-val" style="color:#00f0ff">${stats.avgComposite}</div>
          </div>
          <div class="av-kpi-card">
            <div class="av-kpi-label">${t('ad_kpi_avg_cowan')}</div>
            <div class="av-kpi-val" style="color:#a855f7">${stats.avgK}</div>
          </div>
          <div class="av-kpi-card">
            <div class="av-kpi-label">${t('ad_kpi_top_tier')}</div>
            <div class="av-kpi-val" style="color:#34d399">${stats.topTierCount}</div>
          </div>
        </div>

        ${n > 0 ? `
          <div class="av-board">
            <div class="av-board-head">
              <div>
                <h2>${t('ad_table_ranked_title')}</h2>
                <div class="av-board-sub">${t('ad_table_ranked_sub', { count: Math.min(10, n) })}</div>
              </div>
            </div>
            <div class="av-table-scroll">
              <table class="av-board-table">
                <thead>
                  <tr>
                    <th>${t('ad_col_pos')}</th>
                    <th>${t('ad_col_candidate')}</th>
                    <th>${t('ad_col_tier')}</th>
                    <th>${t('ad_col_composite')}</th>
                    <th>${t('ad_col_cowan')}</th>
                    <th>${t('ad_col_maxn')}</th>
                    <th>${t('ad_col_avgrt')}</th>
                    <th>${t('ad_col_accdist')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${candidates.slice(0, 10).map((c, i) => {
                    const s = c.scores || {};
                    const cs = s.compositeScore || 0;
                    const tc = TIER_CLS[s.tier || 'D'] || 'd';
                    const initials = (c.name || 'N A').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase();
                    const userSessions = candidates.filter(x => 
                      (x.name && c.name && x.name.trim().toLowerCase() === c.name.trim().toLowerCase())
                    );
                    const sessionCount = userSessions.length;
                    const sessionBadge = sessionCount > 1 ? `<span style="font-family:var(--font-mono);font-size:10px;background:rgba(52,211,153,0.12);color:#34d399;padding:2px 6px;border-radius:4px;margin-left:6px;font-weight:bold;" title="${sessionCount} sessions completed">📈 x${sessionCount}</span>` : '';
                    return `
                      <tr>
                        <td class="av-rank">${c.rank || i+1}</td>
                        <td>
                          <div class="av-candidate">
                            <div class="av-avatar">${initials}</div>
                            <div class="av-name">
                              <strong>${c.name || '—'}${sessionBadge}</strong>
                              <span class="av-handle">${c.handle||'—'}</span>
                            </div>
                          </div>
                        </td>
                        <td><span class="tier-pip tier-${tc}">${s.tier||'—'}</span></td>
                        <td class="td-mono">${cs.toFixed(1)}</td>
                        <td class="td-mono">${(s.kPure||0).toFixed(2)}</td>
                        <td class="td-mono">${s.maxSetSize||0}</td>
                        <td class="td-mono">${(s.meanRT||0).toFixed(0)}ms</td>
                        <td class="td-mono">${((s.accuracyDistractor||0)*100).toFixed(0)}%</td>
                        <td><button class="av-btn-view" data-id="${c.id}">${t('ad_btn_detail')}</button></td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="av-tier-bar-wrap">
            <div class="av-tier-bar-head">
              <span>${t('ad_tier_dist_title')}</span>
              <div class="av-tier-legend">
                ${Object.entries(tiers).map(([t_name, c]) => `
                  <span style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-tertiary)">
                    <span class="av-tier-dot" style="background:${TIER_COLORS[t_name]}"></span>${t_name}: ${c}
                  </span>
                `).join('')}
              </div>
            </div>
            <div class="av-tier-bar">
              ${Object.entries(tiers).map(([t_name, c]) => `
                <div class="av-tier-seg" style="width:${n>0?(c/n)*100:0}%;background:${TIER_COLORS[t_name]}"></div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Candidate table -->
        <div class="av-table-wrap">
          <div class="av-table-head">
            <h2>${t('ad_table_all_title')}</h2>
            <span class="av-table-count">${t('ad_table_all_count', { count: n })}</span>
          </div>
          ${n === 0 ? `
            <div class="av-empty">
              <div class="av-empty-icon">📊</div>
              <p>${t('ad_table_empty')}</p>
            </div>
          ` : `
            <div class="av-table-scroll">
              <table class="av-t">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>${t('ad_col_candidate')}</th>
                    <th>${t('ad_col_age')}</th>
                    <th>${t('ad_col_tier')}</th>
                    <th>${t('ad_col_composite')}</th>
                    <th>${t('ad_col_cowan')}</th>
                    <th>${t('ad_col_cowandist')}</th>
                    <th>${t('ad_col_maxn')}</th>
                    <th>${t('ad_col_avgrt')}</th>
                    <th>${t('ad_col_accpure')}</th>
                    <th>${t('ad_col_accdist')}</th>
                    <th>${t('ad_col_alerting')}</th>
                    <th>${t('ad_col_orienting')}</th>
                    <th>${t('ad_col_executive')}</th>
                    <th>${t('ad_col_completed')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${candidates.map((c, i) => {
                    const s = c.scores || {};
                    const cs = s.compositeScore || 0;
                    const sc = cs >= 70 ? 'td-score-hi' : cs >= 40 ? 'td-score-md' : 'td-score-lo';
                    const tc = TIER_CLS[s.tier || 'D'] || 'd';
                    const date = c.completedAt ? new Date(c.completedAt).toLocaleDateString() : '—';
                    const userSessions = candidates.filter(x => 
                      (x.name && c.name && x.name.trim().toLowerCase() === c.name.trim().toLowerCase())
                    );
                    const sessionCount = userSessions.length;
                    const sessionBadge = sessionCount > 1 ? `<span style="font-family:var(--font-mono);font-size:10px;background:rgba(52,211,153,0.12);color:#34d399;padding:2px 6px;border-radius:4px;margin-left:6px;font-weight:bold;" title="${sessionCount} sessions completed">📈 x${sessionCount}</span>` : '';
                    return `
                      <tr>
                        <td class="td-mono">${c.rank || i+1}</td>
                        <td class="td-name">${c.name || '—'}${sessionBadge}</td>
                        <td><span style="font-family:var(--font-mono);font-size:11px;background:rgba(0,240,255,0.08);color:#00f0ff;padding:2px 8px;border-radius:99px">${c.handle||'—'}</span></td>
                        <td class="td-mono">${c.age||'—'}</td>
                        <td><span class="tier-pip tier-${tc}">${s.tier||'—'}</span></td>
                        <td class="${sc}">${cs.toFixed(1)}</td>
                        <td class="td-mono">${(s.kPure||0).toFixed(2)}</td>
                        <td class="td-mono">${(s.kDistractor||0).toFixed(2)}</td>
                        <td class="td-mono">${s.maxSetSize||0}</td>
                        <td class="td-mono">${(s.meanRT||0).toFixed(0)}ms</td>
                        <td class="td-mono">${((s.accuracyPure||0)*100).toFixed(0)}%</td>
                        <td class="td-mono">${(s.alerting||0).toFixed(0)}ms</td>
                        <td class="td-mono">${(s.orienting||0).toFixed(0)}ms</td>
                        <td class="td-mono">${(s.executive||0).toFixed(0)}ms</td>
                        <td class="td-mono">${date}</td>
                        <td><button class="av-btn-view" data-id="${c.id}">${t('ad_btn_detail')}</button></td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>

      <div id="av-modal-container"></div>
    </div>
  `);

  // Button handlers
  document.getElementById('av-keys')?.addEventListener('click', () => showKeyManagerModal(adminCode, adminCompanyId));
  document.getElementById('av-refresh')?.addEventListener('click', () => showDashboard());
  document.getElementById('av-logout')?.addEventListener('click', () => {
    authed = false;
    playerMode = false;
    adminCode = null;
    playerCode = null;
    AdminView();
  });
  document.getElementById('av-json')?.addEventListener('click', () => {
    downloadFile(Storage.exportJSON(candidates), 'candidates.json', 'application/json');
  });
  document.getElementById('av-csv')?.addEventListener('click', () => {
    downloadFile(Storage.exportCSV(candidates), 'candidates.csv', 'text/csv');
  });
  document.getElementById('av-lang-toggle')?.addEventListener('click', () => {
    const newLang = getLang() === 'en' ? 'ja' : 'en';
    setLang(newLang);
    AdminView();
  });

  document.querySelectorAll('.av-btn-view').forEach(btn => {
    btn.addEventListener('click', () => showDetail(btn.dataset.id, candidates));
  });

  // Search functionality
  const searchInput = document.querySelector('.av-search input');

  if (searchInput) {
    searchInput.addEventListener('input', e => {
      const query = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('.av-board-table tbody tr, .av-t tbody tr');
      rows.forEach(row => {
        const name = row.textContent.toLowerCase();
        row.style.display = name.includes(query) ? '' : 'none';
      });
    });
  }
}

/* ---- Player Access Keys Manager Modal ---- */
async function showKeyManagerModal(parentCode, companyId) {
  const container = document.getElementById('av-modal-container');
  if (!container) return;

  const keys = await getSecondaryKeys(parentCode || 'xiber_privatekey$');

  const modalHtml = `
    <div class="av-modal-backdrop" id="key-modal-backdrop" style="position:fixed; inset:0; z-index:100; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; padding:20px;">
      <div class="av-modal" style="max-width: 640px; width:100%; background:#0e0e12; border:1px solid rgba(212,255,0,0.25); box-shadow:0 24px 60px rgba(0,0,0,0.9); border-radius:18px; padding:24px; color:#fff;">
        <div class="av-modal-head" style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:16px;">
          <div>
            <h2 style="font-family:var(--font-display); font-size:20px; font-weight:700; color:var(--text-primary); margin:0;">${t('km_modal_title')}</h2>
            <p style="font-size:12px; color:var(--text-secondary); margin:4px 0 0 0;">${t('km_modal_sub')}</p>
          </div>
          <button class="av-modal-close" id="key-modal-close" style="background:transparent; border:none; color:var(--text-tertiary); font-size:20px; cursor:pointer;">✕</button>
        </div>

        <div class="av-modal-body" style="padding:20px 0 0 0;">
          <form id="sk-form" style="background:rgba(212,255,0,0.03); padding:16px; border-radius:12px; border:1px solid rgba(212,255,0,0.12); margin-bottom:20px;">
            <h4 style="font-family:var(--font-mono); font-size:11px; color:var(--accent-volt); margin:0 0 12px 0; letter-spacing:0.08em; text-transform:uppercase;">${t('km_form_title')}</h4>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
              <div>
                <label for="sk-player-name" style="font-size:11px; color:var(--text-tertiary); display:block; margin-bottom:4px; font-family:var(--font-mono);">${t('km_label_name')}</label>
                <input type="text" id="sk-player-name" name="playerName" placeholder="e.g. Yuki Sakai" style="width:100%; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:#fff; padding:10px 12px; font-size:13px;" required />
              </div>
              <div>
                <label for="sk-custom-code" style="font-size:11px; color:var(--text-tertiary); display:block; margin-bottom:4px; font-family:var(--font-mono);">${t('km_label_custom')}</label>
                <input type="text" id="sk-custom-code" name="customCode" placeholder="e.g. PLY-SAKAI-01" style="width:100%; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:#fff; padding:10px 12px; font-size:13px; font-family:var(--font-mono);" />
              </div>
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:10px; margin-bottom:12px;">
              <div>
                <label for="sk-email" style="font-size:10px; color:var(--text-tertiary); display:block; margin-bottom:4px; font-family:var(--font-mono);">${t('label_email')}</label>
                <input type="email" id="sk-email" placeholder="yuki@example.com" style="width:100%; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:#fff; padding:8px 10px; font-size:12px;" />
              </div>
              <div>
                <label for="sk-age" style="font-size:10px; color:var(--text-tertiary); display:block; margin-bottom:4px; font-family:var(--font-mono);">${t('label_age')}</label>
                <input type="number" id="sk-age" placeholder="22" min="13" max="60" style="width:100%; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:#fff; padding:8px 10px; font-size:12px;" />
              </div>
              <div>
                <label for="sk-gender" style="font-size:10px; color:var(--text-tertiary); display:block; margin-bottom:4px; font-family:var(--font-mono);">${t('label_gender')}</label>
                <select id="sk-gender" style="width:100%; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:#fff; padding:8px 10px; font-size:12px;">
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label for="sk-handle" style="font-size:10px; color:var(--text-tertiary); display:block; margin-bottom:4px; font-family:var(--font-mono);">${t('label_handle')}</label>
                <input type="text" id="sk-handle" placeholder="YUKI_FPS" style="width:100%; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:#fff; padding:8px 10px; font-size:12px;" />
              </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span id="sk-form-msg" style="font-size:12px; color:#f87171; display:none;"></span>
              <button type="submit" id="sk-create-btn" class="av-btn" style="background:var(--accent-volt); color:#080810; font-weight:700; font-family:var(--font-mono); border:none; padding:10px 18px; border-radius:8px; cursor:pointer; margin-left:auto; font-size:12px;">
                ${t('km_btn_issue')}
              </button>
            </div>
          </form>

          <h4 style="font-family:var(--font-mono); font-size:11px; color:var(--text-secondary); margin:0 0 10px 0; letter-spacing:0.05em; text-transform:uppercase;">${t('km_issued_title', { count: keys.length })}</h4>
          <div style="max-height:240px; overflow-y:auto; border:1px solid rgba(255,255,255,0.08); border-radius:10px;">
            <table class="av-board-table" style="font-size:12px; width:100%;">
              <thead>
                <tr>
                  <th>${t('km_col_code')}</th>
                  <th>${t('km_col_name')}</th>
                  <th>${t('km_col_status')}</th>
                  <th>${t('km_col_action')}</th>
                </tr>
              </thead>
              <tbody id="sk-table-body">
                ${keys.length === 0 ? `
                  <tr><td colspan="4" style="text-align:center; color:var(--text-tertiary); padding:20px;">${t('km_empty')}</td></tr>
                ` : keys.map(k => `
                  <tr>
                    <td class="td-mono" style="color:var(--accent-volt); font-weight:bold;">${k.code}</td>
                    <td>${k.playerName || '—'}</td>
                    <td><span class="badge ${k.active !== false ? 'badge-b' : 'badge-d'}">${k.active !== false ? t('km_status_active') : t('km_status_revoked')}</span></td>
                    <td>
                      <button class="av-btn-copy" data-code="${k.code}" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:#fff; border-radius:6px; padding:4px 10px; font-size:11px; cursor:pointer; font-family:var(--font-mono);">
                        ${t('km_btn_copy')}
                      </button>
                      ${k.active !== false ? `
                        <button class="av-btn-revoke" data-code="${k.code}" style="background:rgba(248,113,113,0.12); border:1px solid rgba(248,113,113,0.3); color:#f87171; border-radius:6px; padding:4px 10px; font-size:11px; cursor:pointer; font-family:var(--font-mono); margin-left:6px;">
                          ${t('km_btn_revoke')}
                        </button>
                      ` : `
                        <button class="av-btn-reactivate" data-code="${k.code}" style="background:rgba(52,211,153,0.12); border:1px solid rgba(52,211,153,0.3); color:#34d399; border-radius:6px; padding:4px 10px; font-size:11px; cursor:pointer; font-family:var(--font-mono); margin-left:6px;">
                          ${t('km_btn_reactivate')}
                        </button>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = modalHtml;

  document.getElementById('key-modal-close')?.addEventListener('click', () => { container.innerHTML = ''; });
  document.getElementById('key-modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'key-modal-backdrop') container.innerHTML = '';
  });

  const handleKeyCreate = async (e) => {
    if (e) e.preventDefault();
    const nameVal = document.getElementById('sk-player-name').value.trim();
    const customCodeVal = document.getElementById('sk-custom-code').value.trim();
    const emailVal = document.getElementById('sk-email')?.value.trim();
    const ageVal = document.getElementById('sk-age')?.value.trim();
    const genderVal = document.getElementById('sk-gender')?.value;
    const handleVal = document.getElementById('sk-handle')?.value.trim();
    const msgEl = document.getElementById('sk-form-msg');
    
    msgEl.style.display = 'none';
    const res = await createSecondaryKey({
      parentCode: parentCode || 'xiber_privatekey$',
      companyId: companyId || 'xiberlinc',
      customCode: customCodeVal || null,
      playerName: nameVal,
      email: emailVal || null,
      age: ageVal || null,
      gender: genderVal || null,
      handle: handleVal || null
    });

    if (res.ok) {
      showKeyManagerModal(parentCode, companyId);
    } else {
      if (res.reason === 'exists') {
        msgEl.textContent = t('km_err_exists', { code: res.code });
      } else if (res.reason === 'permission_denied') {
        msgEl.textContent = t('km_err_permission');
      } else {
        msgEl.textContent = 'Failed to create player key.';
      }
      msgEl.style.display = 'inline';
    }
  };

  document.getElementById('sk-form')?.addEventListener('submit', handleKeyCreate);

  container.querySelectorAll('.av-btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.code;
      navigator.clipboard.writeText(code);
      btn.textContent = t('km_btn_copied');
      setTimeout(() => { btn.textContent = t('km_btn_copy'); }, 2000);
    });
  });

  container.querySelectorAll('.av-btn-revoke').forEach(btn => {
    btn.addEventListener('click', async () => {
      await revokeSecondaryKey(btn.dataset.code);
      showKeyManagerModal(parentCode, companyId);
    });
  });

  container.querySelectorAll('.av-btn-reactivate').forEach(btn => {
    btn.addEventListener('click', async () => {
      await reactivateSecondaryKey(btn.dataset.code);
      showKeyManagerModal(parentCode, companyId);
    });
  });
}

/* ---- Player Individual Dashboard ---- */
/* ---- Player Individual Dashboard ---- */
async function showPlayerDashboard() {
  const loadingHtml = `
    <div class="av">
      <div class="av-empty">
        <div class="av-empty-icon animate-pulse">☁️</div>
        <p>${t('ad_syncing')}</p>
      </div>
    </div>
  `;
  render(loadingHtml);

  // Fetch player sessions by playerCode
  let playerSessions = await Storage.getCandidatesByAccessCode(playerCode);
  
  // Fallback: if playerCode has no exact accessCode matches yet, match by playerName
  if (playerSessions.length === 0 && playerName) {
    const allC = await Storage.getCandidates(adminCompanyId || undefined);
    playerSessions = allC.filter(c => c.name && c.name.trim().toLowerCase() === playerName.trim().toLowerCase());
  }

  playerSessions.forEach(c => {
    if (!c.scores && c.trials && c.trials.length > 0) {
      c.scores = computeFullScores(c.trials);
    }
  });

  const sessionsNewest = [...playerSessions].sort((a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt));
  const sessionsOldest = [...playerSessions].sort((a, b) => new Date(a.completedAt || a.createdAt) - new Date(b.completedAt || b.createdAt));

  const latestSession = sessionsNewest[0] || null;
  const latestScores = latestSession?.scores || {};
  const n = playerSessions.length;

  // Compute Growth & Peak Metrics for Charts
  const compositePoints = sessionsOldest.map((s, i) => ({
    label: `#${i + 1}`,
    value: s.scores?.compositeScore || 0
  }));
  const kPoints = sessionsOldest.map((s, i) => ({
    label: `#${i + 1}`,
    value: s.scores?.kPure || 0
  }));

  const compositeValues = compositePoints.map(p => p.value);
  const kValues = kPoints.map(p => p.value);
  const maxComposite = compositeValues.length > 0 ? Math.max(...compositeValues) : 0;
  const maxK = kValues.length > 0 ? Math.max(...kValues) : 0;

  const firstComposite = compositeValues[0] || 0;
  const lastComposite = compositeValues[compositeValues.length - 1] || 0;
  const compositeGrowth = firstComposite > 0 ? ((lastComposite - firstComposite) / firstComposite) * 100 : 0;

  // Calculate Cognitive Superpower Profile & Averages
  const kPureAvg = playerSessions.length > 0 
    ? playerSessions.reduce((acc, s) => acc + (s.scores?.kPure || 0), 0) / playerSessions.length 
    : (latestScores.kPure || 0);

  const kDistAvg = playerSessions.length > 0 
    ? playerSessions.reduce((acc, s) => acc + (s.scores?.kDistractor || 0), 0) / playerSessions.length 
    : (latestScores.kDistractor || 0);

  const execEffAvg = playerSessions.length > 0 
    ? playerSessions.reduce((acc, s) => acc + (s.scores?.vwmExecEfficiency || (s.scores?.accuracyDistractor ? s.scores.accuracyDistractor * 100 : 0)), 0) / playerSessions.length 
    : (latestScores.vwmExecEfficiency || 0);

  const rtAvg = playerSessions.length > 0 
    ? playerSessions.reduce((acc, s) => acc + (s.scores?.meanRT || 0), 0) / playerSessions.length 
    : (latestScores.meanRT || 0);

  let powerBadgeTitle = t('player_power_balanced_title');
  let powerBadgeDesc = t('player_power_balanced_desc');

  if (kDistAvg >= kPureAvg * 0.88 || execEffAvg >= 82) {
    powerBadgeTitle = t('player_power_distractor_title');
    powerBadgeDesc = t('player_power_distractor_desc');
  } else if (kPureAvg >= 4.2) {
    powerBadgeTitle = t('player_power_pure_title');
    powerBadgeDesc = t('player_power_pure_desc');
  } else if (rtAvg > 0 && rtAvg <= 380) {
    powerBadgeTitle = t('player_power_speed_title');
    powerBadgeDesc = t('player_power_speed_desc');
  }

  const TIER_COLORS = { 'S+':'#ffd700','S':'#00f0ff','A':'#a855f7','B':'#34d399','C':'#fbbf24','D':'#f87171' };
  const TIER_CLS    = { 'S+':'sp','S':'s','A':'a','B':'b','C':'c','D':'d' };

  render(`
    <div class="av">
      <header class="av-header">
        <div class="av-logo">
          <img src="/xiberlinc_mark.png" alt="Xiberlinc" class="av-logo-img" />
          <span>${t('player_portal_title')}</span>
        </div>
        <div class="av-actions">
          <button class="av-btn av-btn-ghost" id="av-lang-toggle" style="color:#d4ff00; font-family:var(--font-mono); font-size:12px; border:1px solid rgba(212,255,0,0.25); background:rgba(212,255,0,0.08);">${t('lang_toggle')}</button>
          <button class="av-btn av-btn-ghost" id="av-refresh">↻ ${t('ad_refresh')}</button>
          <button class="av-btn av-btn-ghost" id="av-logout">🚪 ${t('ad_logout')}</button>
        </div>
      </header>

      <div class="av-body">
        <div class="av-top">
          <div class="av-title">
            <div style="font-family:var(--font-mono); font-size:11px; color:var(--accent-volt); letter-spacing:0.1em; text-transform:uppercase; margin-bottom:4px;">KEY: ${playerCode}</div>
            <h1>${t('player_welcome', { name: playerName || 'Player' })}</h1>
            <p>${t('player_portal_sub')}</p>
          </div>
        </div>

        <!-- Top KPI Overview -->
        <div class="av-kpis">
          <div class="av-kpi-card">
            <div class="av-kpi-label">${t('player_kpi_sessions')}</div>
            <div class="av-kpi-val">${n}</div>
          </div>
          <div class="av-kpi-card">
            <div class="av-kpi-label">${t('player_kpi_composite')}</div>
            <div class="av-kpi-val" style="color:#00f0ff">${latestScores.compositeScore ? latestScores.compositeScore.toFixed(1) : '—'}</div>
          </div>
          <div class="av-kpi-card">
            <div class="av-kpi-label">${t('player_kpi_cowan')}</div>
            <div class="av-kpi-val" style="color:#a855f7">${latestScores.kPure ? latestScores.kPure.toFixed(2) : '—'}</div>
          </div>
          <div class="av-kpi-card">
            <div class="av-kpi-label">${t('player_kpi_tier')}</div>
            <div class="av-kpi-val" style="color:${TIER_COLORS[latestScores.tier || 'D']}">${latestScores.tier || '—'}</div>
          </div>
        </div>

        <!-- Memory Capacity & Cognitive Breakdown Card -->
        ${n > 0 ? `
          <div style="background:rgba(18,18,24,0.8); border:1px solid rgba(212,255,0,0.2); border-radius:18px; padding:24px; margin-bottom:32px; box-shadow:0 12px 36px rgba(0,0,0,0.5);">
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:16px;">
              <div>
                <span style="font-family:var(--font-mono); font-size:10px; color:var(--accent-volt); letter-spacing:0.12em; text-transform:uppercase;">COGNITIVE PROFILE ANALYTICS</span>
                <h2 style="font-family:var(--font-display); font-size:20px; font-weight:700; color:var(--text-primary); margin:4px 0 0 0;">${t('player_power_title')}</h2>
                <p style="font-size:12px; color:var(--text-secondary); margin:4px 0 0 0;">${t('player_power_sub')}</p>
              </div>
            </div>

            <!-- Side-by-Side Visual Memory Capacity Bars -->
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px;">
              
              <!-- Skill 1: Pure Memory Capacity -->
              <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <span style="font-size:11px; font-family:var(--font-mono); color:var(--text-tertiary);">${t('player_skill_pure')}</span>
                  <span style="font-size:12px; font-family:var(--font-mono); font-weight:bold; color:#00f0ff;">${kPureAvg.toFixed(2)}</span>
                </div>
                <div style="height:8px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden; margin-bottom:8px;">
                  <div style="width:${Math.min(100, (kPureAvg / 8) * 100)}%; height:100%; background:linear-gradient(90deg, #00f0ff, #0071e3); border-radius:4px;"></div>
                </div>
                <span style="font-size:10px; font-family:var(--font-mono); color:var(--text-tertiary);">${t('player_skill_capacity_label', { val: kPureAvg.toFixed(2) })}</span>
              </div>

              <!-- Skill 2: Distractor Memory Capacity -->
              <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <span style="font-size:11px; font-family:var(--font-mono); color:var(--text-tertiary);">${t('player_skill_dist')}</span>
                  <span style="font-size:12px; font-family:var(--font-mono); font-weight:bold; color:#a855f7;">${kDistAvg.toFixed(2)}</span>
                </div>
                <div style="height:8px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden; margin-bottom:8px;">
                  <div style="width:${Math.min(100, (kDistAvg / 8) * 100)}%; height:100%; background:linear-gradient(90deg, #a855f7, #5e5ce6); border-radius:4px;"></div>
                </div>
                <span style="font-size:10px; font-family:var(--font-mono); color:var(--text-tertiary);">${t('player_skill_capacity_label', { val: kDistAvg.toFixed(2) })}</span>
              </div>

              <!-- Skill 3: Focus Retention Rate -->
              <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <span style="font-size:11px; font-family:var(--font-mono); color:var(--text-tertiary);">${t('player_skill_retention')}</span>
                  <span style="font-size:12px; font-family:var(--font-mono); font-weight:bold; color:#34d399;">${execEffAvg.toFixed(1)}%</span>
                </div>
                <div style="height:8px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden; margin-bottom:8px;">
                  <div style="width:${Math.min(100, execEffAvg)}%; height:100%; background:linear-gradient(90deg, #34d399, #34c759); border-radius:4px;"></div>
                </div>
                <span style="font-size:10px; font-family:var(--font-mono); color:var(--text-tertiary);">${execEffAvg >= 80 ? 'Outstanding Focus Under Noise' : 'Consistent Attention Retention'}</span>
              </div>

            </div>
          </div>
        ` : ''}

        <!-- Performance Trends & Trajectory Charts -->
        ${n > 1 ? `
          <div style="background:rgba(18,18,24,0.8); border:1px solid rgba(212,255,0,0.2); border-radius:16px; padding:24px; margin-bottom:32px; box-shadow:0 12px 32px rgba(0,0,0,0.4);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:14px;">
              <div>
                <h3 style="font-family:var(--font-display); font-size:18px; font-weight:700; color:var(--text-primary); margin:0;">${t('player_trajectory_title')}</h3>
                <p style="font-size:12px; color:var(--text-secondary); margin:4px 0 0 0;">${t('player_trajectory_sub', { count: n })}</p>
              </div>
              <div style="font-family:var(--font-mono); font-size:11px; background:rgba(52,211,153,0.12); color:#34d399; border:1px solid rgba(52,211,153,0.3); padding:6px 14px; border-radius:99px; font-weight:bold;">
                ${t('player_trend_progress', { growth: (compositeGrowth >= 0 ? '+' : '') + compositeGrowth.toFixed(1) })}
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
              <!-- Chart 1: Composite Score Growth -->
              <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                  <span style="font-family:var(--font-mono); font-size:11px; color:#00f0ff; letter-spacing:0.05em; text-transform:uppercase; font-weight:bold;">${t('player_trend_composite')}</span>
                  <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-tertiary);">${t('player_peak_composite', { val: maxComposite.toFixed(1) })}</span>
                </div>
                ${generateSvgLineChart(compositePoints, 480, 180, -1, 0, 100)}
              </div>

              <!-- Chart 2: Cowan's K Memory Capacity Trend -->
              <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                  <span style="font-family:var(--font-mono); font-size:11px; color:#a855f7; letter-spacing:0.05em; text-transform:uppercase; font-weight:bold;">${t('player_trend_cowan')}</span>
                  <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-tertiary);">${t('player_peak_k', { val: maxK.toFixed(2) })}</span>
                </div>
                ${generateSvgLineChart(kPoints, 480, 180, -1, 0, 12)}
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Evaluation History Table -->
        <div class="av-table-wrap">
          <div class="av-table-head">
            <h2>${t('player_history_title')}</h2>
            <span class="av-table-count">${n} Session${n === 1 ? '' : 's'}</span>
          </div>
          ${n === 0 ? `
            <div class="av-empty">
              <div class="av-empty-icon">📊</div>
              <p>${t('player_history_empty')}</p>
            </div>
          ` : `
            <div class="av-table-scroll">
              <table class="av-t">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>${t('ad_col_completed')}</th>
                    <th>${t('ad_col_tier')}</th>
                    <th>${t('ad_col_composite')}</th>
                    <th>${t('ad_col_cowan')}</th>
                    <th>${t('ad_col_cowandist')}</th>
                    <th>${t('ad_metric_execeff')}</th>
                    <th>${t('ad_col_avgrt')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${sessionsNewest.map((s, i) => {
                    const sc = s.scores || {};
                    const cs = sc.compositeScore || 0;
                    const tierVal = sc.tier || 'D';
                    const tc = TIER_CLS[tierVal] || 'd';
                    const kPureVal = sc.kPure !== undefined ? sc.kPure.toFixed(2) : '—';
                    const kDistVal = sc.kDistractor !== undefined ? sc.kDistractor.toFixed(2) : '—';
                    const execEffVal = sc.vwmExecEfficiency !== undefined ? sc.vwmExecEfficiency.toFixed(1) + '%' : (sc.accuracyDistractor !== undefined ? (sc.accuracyDistractor * 100).toFixed(0) + '%' : '—');
                    const meanRtVal = sc.meanRT !== undefined ? sc.meanRT.toFixed(0) + 'ms' : '—';
                    const date = s.completedAt ? new Date(s.completedAt).toLocaleDateString() : '—';
                    return `
                      <tr>
                        <td class="td-mono">#${sessionsNewest.length - i}</td>
                        <td class="td-mono">${date}</td>
                        <td><span class="tier-pip tier-${tc}">${tierVal}</span></td>
                        <td class="td-mono td-bold" style="color:${TIER_COLORS[tierVal]}">${cs.toFixed(1)}</td>
                        <td class="td-mono">${kPureVal}</td>
                        <td class="td-mono">${kDistVal}</td>
                        <td class="td-mono">${execEffVal}</td>
                        <td class="td-mono">${meanRtVal}</td>
                        <td><button class="av-btn-view" data-id="${s.id}">${t('ad_btn_detail')}</button></td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

      </div>

      <div id="av-modal-container"></div>
    </div>
  `);

  document.getElementById('av-refresh')?.addEventListener('click', () => showPlayerDashboard());
  document.getElementById('av-logout')?.addEventListener('click', () => {
    authed = false;
    playerMode = false;
    adminCode = null;
    playerCode = null;
    AdminView();
  });
  document.getElementById('av-lang-toggle')?.addEventListener('click', () => {
    const newLang = getLang() === 'en' ? 'ja' : 'en';
    setLang(newLang);
    showPlayerDashboard();
  });

  document.querySelectorAll('.av-btn-view').forEach(btn => {
    btn.addEventListener('click', () => showDetail(btn.dataset.id, sessionsNewest));
  });
}

/* ---- Detail modal (tabbed) ---- */
function showDetail(id, candidates) {
  const c = candidates.find(x => x.id === id);
  if (!c) return;
  const email = c.email || '';
  const s = c.scores || {};

  const skipsHtml = c.metadata?.skips
    ? '<div style="margin-top:8px;display:flex;gap:6px;">' +
      Object.keys(c.metadata.skips).map(t =>
        '<span style="background:#fbbf2420;color:#fbbf24;border:1px solid #fbbf2440;padding:2px 8px;font-size:10px;font-family:var(--font-mono)">SKIPPED: ' + t.toUpperCase() + '</span>'
      ).join('') + '</div>'
    : '';

  const userSessions = candidates
    .filter(x => (x.name && c.name && x.name.trim().toLowerCase() === c.name.trim().toLowerCase()))
    .map(x => {
      if (x.trials && x.trials.length > 0) {
        x.scores = computeFullScores(x.trials);
      }
      return x;
    })
    .sort((a, b) => new Date(a.completedAt || a.createdAt) - new Date(b.completedAt || b.createdAt));
  const currentSessionIndex = userSessions.findIndex(x => x.id === id);

  const mc = document.getElementById('av-modal-container');
  mc.innerHTML = `
    <div class="av-modal-bg" id="av-modal-bg">
      <div class="av-modal">
        <div class="av-modal-header">
          <div>
            <div style="display:flex;align-items:center;gap:12px;">
              <h2>${c.name}</h2>
              <span class="tier-pip tier-${(s.tier||'D').toLowerCase().replace('+','sp')}">${s.tier||'—'}</span>
            </div>
            <p style="color:var(--text-tertiary);font-size:13px;margin-top:4px;">${c.email} · @${c.handle} · Age ${c.age} · ${c.gender||'—'}</p>
            ${skipsHtml}
          </div>
          <button class="av-btn av-btn-ghost" id="av-close-modal" style="font-size:1.2rem;padding:6px 12px;color:#d4ff00;border:1px solid rgba(212,255,0,0.2);background:rgba(212,255,0,0.04);">✕</button>
        </div>

        <div class="av-tabs">
          <button class="av-tab av-tab-active" data-tab="overview">${t('ad_modal_tab_overview')}</button>
          <button class="av-tab" data-tab="raw">${t('ad_modal_tab_raw')}</button>
        </div>

        <div class="av-tab-content" id="av-tab-overview">
          ${renderOverviewTab(c, s)}
        </div>
        <div class="av-tab-content av-hidden" id="av-tab-raw">
          ${renderRawTab(c)}
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll('.av-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.av-tab').forEach(b => b.classList.remove('av-tab-active'));
      document.querySelectorAll('.av-tab-content').forEach(tc => tc.classList.add('av-hidden'));
      btn.classList.add('av-tab-active');
      document.getElementById('av-tab-' + btn.dataset.tab).classList.remove('av-hidden');
    });
  });

  document.querySelectorAll('.av-metric-info-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      showMetricExplain(btn.dataset.metricKey, userSessions, currentSessionIndex);
    });
  });

  const close = () => { mc.innerHTML = ''; };
  document.getElementById('av-close-modal').addEventListener('click', close);
  document.getElementById('av-modal-bg').addEventListener('click', e => { if (e.target === e.currentTarget) close(); });
}

/* ---- Overview tab (separated task sections & localized) ---- */
function renderOverviewTab(c, s) {
  const setSizes = [1, 2, 3, 4, 6, 8];
  const maxKVal  = 6;

  // --- TASK 1: VWM PURE ---
  const kDataPure = s.vwmPure?.kScores || {};
  const pureMetricsHtml = [
    { key:'kpure',    label:t('ad_metric_kpure'), val:(s.kPure||0).toFixed(2) },
    { key:'maxn',     label:t('ad_metric_maxn'), val:s.maxSetSize||0 },
    { key:'acc-pure', label:t('ad_metric_accpure'), val:((s.accuracyPure||0)*100).toFixed(0)+'%' },
    { key:'meanrt',   label:t('ad_metric_meanrt'), val:(s.meanRT||0).toFixed(0)+'ms' },
  ].map(m =>
    '<div class="av-metric">' +
    '<div class="av-metric-label">' + m.label + '</div>' +
    '<div class="av-metric-val" style="color:#00f0ff">' + m.val + '</div>' +
    '<button class="av-metric-info-btn" data-metric-key="' + m.key + '">i</button>' +
    '</div>'
  ).join('');

  const pureKChartHtml = setSizes.map(n => {
    const k   = kDataPure[n]?.k || 0;
    const pct = Math.max(2, (k / maxKVal) * 100);
    return '<div class="av-bar-col"><div class="av-bar-val">' + k.toFixed(1) + '</div>' +
      '<div class="av-bar" style="height:' + pct + '%;background:#00f0ff"></div>' +
      '<div class="av-bar-lbl">N=' + n + '</div></div>';
  }).join('');

  const pureSetTableRows = setSizes.map(n => {
    const acc = s.vwmPure?.accuracyBySetSize?.[n] !== undefined ? Math.round(s.vwmPure.accuracyBySetSize[n] * 100) + '%' : '—';
    const rt = s.vwmPure?.correctRtBySetSize?.[n] ? Math.round(s.vwmPure.correctRtBySetSize[n]) + 'ms' : '—';
    const k = kDataPure[n]?.k !== undefined ? kDataPure[n].k.toFixed(2) : '—';
    return '<tr><td>N=' + n + '</td><td>' + k + '</td><td>' + acc + '</td><td>' + rt + '</td></tr>';
  }).join('');

  // --- TASK 2: VWM DISTRACTOR ---
  const kDataDist = s.vwmDistractor?.kScores || {};
  const distMetricsHtml = [
    { key:'kdist',      label:t('ad_metric_kdist'), val:(s.kDistractor||0).toFixed(2) },
    { key:'exec-eff',   label:t('ad_metric_execeff'), val:(s.vwmExecEfficiency||0).toFixed(1)+'%' },
    { key:'exec-speed', label:t('ad_metric_execspeed'), val:(s.vwmExecSpeed||0).toFixed(0)+'ms' },
    { key:'acc-dist',   label:t('ad_metric_accdist'), val:((s.accuracyDistractor||0)*100).toFixed(0)+'%' },
  ].map(m =>
    '<div class="av-metric">' +
    '<div class="av-metric-label">' + m.label + '</div>' +
    '<div class="av-metric-val" style="color:#fbbf24">' + m.val + '</div>' +
    '<button class="av-metric-info-btn" data-metric-key="' + m.key + '">i</button>' +
    '</div>'
  ).join('');

  const distKChartHtml = setSizes.map(n => {
    const k   = kDataDist[n]?.k || 0;
    const pct = Math.max(2, (k / maxKVal) * 100);
    return '<div class="av-bar-col"><div class="av-bar-val">' + k.toFixed(1) + '</div>' +
      '<div class="av-bar" style="height:' + pct + '%;background:#fbbf24"></div>' +
      '<div class="av-bar-lbl">N=' + n + '</div></div>';
  }).join('');

  const distSetTableRows = setSizes.map(n => {
    const acc = s.vwmDistractor?.accuracyBySetSize?.[n] !== undefined ? Math.round(s.vwmDistractor.accuracyBySetSize[n] * 100) + '%' : '—';
    const rt = s.vwmDistractor?.correctRtBySetSize?.[n] ? Math.round(s.vwmDistractor.correctRtBySetSize[n]) + 'ms' : '—';
    const k = kDataDist[n]?.k !== undefined ? kDataDist[n].k.toFixed(2) : '—';
    return '<tr><td>N=' + n + '</td><td>' + k + '</td><td>' + acc + '</td><td>' + rt + '</td></tr>';
  }).join('');

  // --- TASK 3: ANT ---
  const antHtml = [
    { key:'alerting',        label:t('ad_metric_alerting'), val:(s.alerting||0).toFixed(0)+'ms' },
    { key:'orienting',       label:t('ad_metric_orienting'), val:(s.orienting||0).toFixed(0)+'ms' },
    { key:'executive',       label:t('ad_metric_executive'), val:(s.executive||0).toFixed(0)+'ms' },
    { key:'ant-congruent',   label:t('ad_metric_ant_congruent'), val:(s.ant?.rtByFlanker?.congruent||0).toFixed(0)+'ms' },
    { key:'ant-incongruent', label:t('ad_metric_ant_incongruent'), val:(s.ant?.rtByFlanker?.incongruent||0).toFixed(0)+'ms' },
    { key:'eff-congruent',   label:t('ad_metric_eff_congruent'), val:(s.antCongruentEfficiency||0).toFixed(2)+' r/s' },
    { key:'eff-incongruent', label:t('ad_metric_eff_incongruent'), val:(s.antIncongruentEfficiency||0).toFixed(2)+' r/s' },
    { key:'eff-alerting',    label:t('ad_metric_eff_alerting'), val:(s.antAlertingEfficiency||0).toFixed(2) },
    { key:'eff-orienting',   label:t('ad_metric_eff_orienting'), val:(s.antOrientingEfficiency||0).toFixed(2) },
    { key:'eff-executive',   label:t('ad_metric_eff_executive'), val:(s.antExecutiveEfficiency||0).toFixed(2) },
  ].map(m =>
    '<div class="av-metric">' +
    '<div class="av-metric-label">' + m.label + '</div>' +
    '<div class="av-metric-val" style="color:#c084fc">' + m.val + '</div>' +
    '<button class="av-metric-info-btn" data-metric-key="' + m.key + '">i</button>' +
    '</div>'
  ).join('');

  // --- COMPONENT SCORES ---
  const COMP_LABELS = { kPure:'CowanK (Pure)', kDistractor:'CowanK (Dist)', maxSetSize:'Max N', rtEfficiency:'RT Eff', alerting:'Alert', orienting:'Orient', executive:'Exec' };
  const componentHtml = s.componentScores
    ? '<div class="av-chart-title">' + t('ad_chart_component') + '</div><div class="av-chart">' +
      Object.entries(s.componentScores).map(([key, val]) => {
        const color = val>=70?'#34d399':val>=40?'#fbbf24':'#f87171';
        return '<div class="av-bar-col"><div class="av-bar-val">' + val.toFixed(0) + '</div>' +
          '<div class="av-bar" style="height:' + Math.max(2,val) + '%;background:' + color + '"></div>' +
          '<div class="av-bar-lbl">' + (COMP_LABELS[key]||key) + '</div></div>';
      }).join('') + '</div>'
    : '';

  const totalTrials = (s.vwmPure?.totalTrials||0) + (s.vwmDistractor?.totalTrials||0) + (s.ant?.totalTrials||0);
  const completedAt = c.completedAt ? new Date(c.completedAt).toLocaleString() : '—';
  const metaHtml = c.metadata
    ? '<div style="font-family:var(--font-mono);font-size:11px;color:var(--text-tertiary);">' +
      '<div>' + t('ad_meta_resolution') + ' ' + c.metadata.windowWidth + 'x' + c.metadata.windowHeight + '</div>' +
      '<div style="margin-top:4px;opacity:0.7;line-height:1.4;word-break:break-all;">' + t('ad_meta_agent') + ' ' + c.metadata.userAgent + '</div></div>'
    : '';

  return '<div class="av-modal-body">' +
    '<!-- TASK 1: VWM PURE -->' +
    '<div class="av-task-section">' +
      '<div class="av-task-header">' +
        '<div class="av-task-title"><span>🟦</span> ' + t('ad_task1_title') + '</div>' +
        '<span class="av-task-badge av-badge-cyan">' + t('ad_task1_badge') + '</span>' +
      '</div>' +
      '<div class="av-metrics" style="grid-template-columns:repeat(auto-fit, minmax(160px, 1fr));">' + pureMetricsHtml + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;">' +
        '<div>' +
          '<div class="av-chart-title">' + t('ad_chart_k_pure') + '</div>' +
          '<div class="av-chart">' + pureKChartHtml + '</div>' +
        '</div>' +
        '<div>' +
          '<div class="av-chart-title">' + t('ad_table_set_pure') + '</div>' +
          '<table class="av-set-table">' +
            '<thead><tr><th>' + t('ad_th_set_size') + '</th><th>' + t('ad_th_cowan_k') + '</th><th>' + t('ad_th_accuracy') + '</th><th>' + t('ad_th_median_rt') + '</th></tr></thead>' +
            '<tbody>' + pureSetTableRows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- TASK 2: VWM DISTRACTOR -->' +
    '<div class="av-task-section">' +
      '<div class="av-task-header">' +
        '<div class="av-task-title"><span>🟨</span> ' + t('ad_task2_title') + '</div>' +
        '<span class="av-task-badge av-badge-amber">' + t('ad_task2_badge') + '</span>' +
      '</div>' +
      '<div class="av-metrics" style="grid-template-columns:repeat(auto-fit, minmax(160px, 1fr));">' + distMetricsHtml + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;">' +
        '<div>' +
          '<div class="av-chart-title">' + t('ad_chart_k_dist') + '</div>' +
          '<div class="av-chart">' + distKChartHtml + '</div>' +
        '</div>' +
        '<div>' +
          '<div class="av-chart-title">' + t('ad_table_set_dist') + '</div>' +
          '<table class="av-set-table">' +
            '<thead><tr><th>' + t('ad_th_set_size') + '</th><th>' + t('ad_th_cowan_k') + '</th><th>' + t('ad_th_accuracy') + '</th><th>' + t('ad_th_median_rt') + '</th></tr></thead>' +
            '<tbody>' + distSetTableRows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- TASK 3: ANT -->' +
    '<div class="av-task-section">' +
      '<div class="av-task-header">' +
        '<div class="av-task-title"><span>⚡</span> ' + t('ad_task3_title') + '</div>' +
        '<span class="av-task-badge av-badge-purple">' + t('ad_task3_badge') + '</span>' +
      '</div>' +
      '<div class="av-metrics" style="grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));">' + antHtml + '</div>' +
    '</div>' +

    '<!-- COMPONENT SCORES & TELEMETRY -->' +
    '<div class="av-task-section">' +
      '<div class="av-task-header">' +
        '<div class="av-task-title"><span>📊</span> ' + t('ad_task_diag_title') + '</div>' +
        '<span class="av-task-badge av-badge-volt">' + t('ad_task_diag_badge') + '</span>' +
      '</div>' +
      componentHtml +
      '<div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;align-items:center;">' +
        '<div style="font-family:var(--font-mono);font-size:12px;color:var(--text-tertiary);">' +
          t('ad_meta_total_trials') + ' <strong>' + totalTrials + '</strong> · ' + t('ad_meta_completed') + ' <strong>' + completedAt + '</strong>' +
        '</div>' +
        metaHtml +
      '</div>' +
    '</div>' +
  '</div>';
}

/* ---- Raw Data tab (separated task sections & localized) ---- */
function renderRawTab(c) {
  const trials = c.trials || [];
  if (!trials.length) {
    return '<div class="av-modal-body"><div class="av-empty"><div class="av-empty-icon">📋</div><p>' + t('ad_modal_no_raw') + '</p></div></div>';
  }

  const vwmPure = trials.filter(t => t.taskType === 'vwm-pure');
  const vwmDist = trials.filter(t => t.taskType === 'vwm-distractor');
  const antT    = trials.filter(t => t.taskType === 'ant');

  // At-a-glance overall
  const correct  = trials.filter(t => t.isCorrect).length;
  const acc      = trials.length ? (correct / trials.length * 100).toFixed(0) : 0;
  const rtVals   = trials.filter(t => t.isCorrect && t.reactionTimeMs > 0).map(t => t.reactionTimeMs);
  const avgRT    = rtVals.length ? Math.round(rtVals.reduce((a,b)=>a+b,0)/rtVals.length) : 0;
  const fastRT   = rtVals.length ? Math.min(...rtVals).toFixed(2) : '0.00';
  const slowRT   = rtVals.length ? Math.max(...rtVals).toFixed(2) : '0.00';
  let maxStreak  = 0, streak = 0;
  trials.forEach(t => { if (t.isCorrect) { streak++; maxStreak = Math.max(maxStreak, streak); } else streak = 0; });

  const accColor = acc >= 70 ? '#34d399' : acc >= 50 ? '#fbbf24' : '#f87171';
  const glanceHtml =
    '<div class="raw-glance-card"><div class="raw-glance-label">' + t('ad_raw_card_total') + '</div><div class="raw-glance-val">' + trials.length + '</div></div>' +
    '<div class="raw-glance-card"><div class="raw-glance-label">' + t('ad_raw_card_acc') + '</div><div class="raw-glance-val" style="color:' + accColor + '">' + acc + '%</div></div>' +
    '<div class="raw-glance-card"><div class="raw-glance-label">' + t('ad_raw_card_avgrt') + '</div><div class="raw-glance-val">' + avgRT + 'ms</div></div>' +
    '<div class="raw-glance-card"><div class="raw-glance-label">' + t('ad_raw_card_fast') + '</div><div class="raw-glance-val" style="color:#34d399">' + fastRT + 'ms</div></div>' +
    '<div class="raw-glance-card"><div class="raw-glance-label">' + t('ad_raw_card_slow') + '</div><div class="raw-glance-val" style="color:#fbbf24">' + slowRT + 'ms</div></div>' +
    '<div class="raw-glance-card"><div class="raw-glance-label">' + t('ad_raw_card_streak') + '</div><div class="raw-glance-val">' + maxStreak + ' ' + t('ad_raw_streak_suffix') + '</div></div>';

  // Section A: VWM Pure (Normal)
  const vwmPureSection = vwmPure.length
    ? '<div class="av-task-section">' +
        '<div class="av-task-header">' +
          '<div class="av-task-title"><span>🟦</span> ' + t('ad_raw_t1_title') + '</div>' +
          '<span class="av-task-badge av-badge-cyan">' + t('ad_raw_trials_count', { count: vwmPure.length }) + '</span>' +
        '</div>' +
        '<div class="raw-section">' +
          '<div class="raw-section-title">' + t('ad_raw_acc_color_pure') + '</div>' +
          renderColorAccuracy(vwmPure) +
        '</div>' +
        '<div class="raw-section" style="margin-top:16px;">' +
          '<div class="raw-section-title">' + t('ad_raw_rt_trend_pure') + '</div>' +
          '<div style="font-size:11px;color:var(--text-tertiary);margin-bottom:8px;">' + t('ad_raw_spark_sub') + '</div>' +
          renderSparkline(vwmPure) +
        '</div>' +
        '<div class="raw-section" style="margin-top:16px;">' +
          '<div class="raw-section-title">' + t('ad_raw_table_pure') + '</div>' +
          renderVWMTrialTable(vwmPure, false) +
        '</div>' +
      '</div>'
    : '';

  // Section B: VWM Distractor (With Distractors)
  const vwmDistSection = vwmDist.length
    ? '<div class="av-task-section">' +
        '<div class="av-task-header">' +
          '<div class="av-task-title"><span>🟨</span> ' + t('ad_raw_t2_title') + '</div>' +
          '<span class="av-task-badge av-badge-amber">' + t('ad_raw_trials_count', { count: vwmDist.length }) + '</span>' +
        '</div>' +
        '<div class="raw-section">' +
          '<div class="raw-section-title">' + t('ad_raw_acc_color_dist') + '</div>' +
          renderColorAccuracy(vwmDist) +
        '</div>' +
        '<div class="raw-section" style="margin-top:16px;">' +
          '<div class="raw-section-title">' + t('ad_raw_rt_trend_dist') + '</div>' +
          '<div style="font-size:11px;color:var(--text-tertiary);margin-bottom:8px;">' + t('ad_raw_spark_sub') + '</div>' +
          renderSparkline(vwmDist) +
        '</div>' +
        '<div class="raw-section" style="margin-top:16px;">' +
          '<div class="raw-section-title">' + t('ad_raw_table_dist') + '</div>' +
          renderVWMTrialTable(vwmDist, true) +
        '</div>' +
      '</div>'
    : '';

  // Section C: ANT
  const antSection = antT.length
    ? '<div class="av-task-section">' +
        '<div class="av-task-header">' +
          '<div class="av-task-title"><span>⚡</span> ' + t('ad_raw_t3_title') + '</div>' +
          '<span class="av-task-badge av-badge-purple">' + t('ad_raw_trials_count', { count: antT.length }) + '</span>' +
        '</div>' +
        '<div class="raw-section">' +
          '<div class="raw-section-title">' + t('ad_raw_rt_trend_ant') + '</div>' +
          '<div style="font-size:11px;color:var(--text-tertiary);margin-bottom:8px;">' + t('ad_raw_spark_sub') + '</div>' +
          renderSparkline(antT) +
        '</div>' +
        '<div class="raw-section" style="margin-top:16px;">' +
          '<div class="raw-section-title">' + t('ad_raw_table_ant') + '</div>' +
          renderANTTrialTable(antT) +
        '</div>' +
      '</div>'
    : '';

  return '<div class="av-modal-body">' +
    '<div class="raw-section" style="margin-bottom:20px;">' +
      '<div class="raw-section-title">' + t('ad_raw_at_glance') + '</div>' +
      '<div class="raw-glance-grid">' + glanceHtml + '</div>' +
    '</div>' +
    vwmPureSection +
    vwmDistSection +
    antSection +
  '</div>';
}

/* ---- Colour accuracy (per colour across specified trials) ---- */
function renderColorAccuracy(trials) {
  const map = {};
  trials.forEach(t => {
    (t.stimulusColors || []).forEach(col => {
      if (!map[col]) map[col] = { correct: 0, total: 0 };
      map[col].total++;
      if (t.isCorrect) map[col].correct++;
    });
  });

  if (!Object.keys(map).length) return '<div style="color:var(--text-tertiary);font-size:13px;">' + t('ad_raw_no_color') + '</div>';

  return '<div class="color-acc-grid">' +
    Object.entries(map).sort((a, b) => b[1].total - a[1].total).map(([col, d]) => {
      const pct      = d.total ? Math.round(d.correct / d.total * 100) : 0;
      const valColor = pct >= 70 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#f87171';
      return '<div class="color-acc-card">' +
        '<div class="color-acc-swatch" style="background:' + col + '"></div>' +
        '<div><div class="color-acc-name">' + col + '</div>' +
        '<div class="color-acc-pct" style="color:' + valColor + '">' + pct + '%</div>' +
        '<div class="color-acc-count">' + d.correct + '/' + d.total + ' ' + t('cv_raw_spark_correct') + '</div></div>' +
        '</div>';
    }).join('') + '</div>';
}

/* ---- RT sparkline ---- */
function renderSparkline(trials) {
  if (!trials.length) return '';
  const maxRT = Math.min(1500, Math.max(...trials.map(t => t.reactionTimeMs || 0), 1));
  const bars  = trials.map((t, i) => {
    const rt = t.reactionTimeMs || 0;
    const h  = Math.max(5, (Math.min(rt, maxRT) / maxRT) * 100);
    const bg = t.isCorrect ? 'rgba(52,211,153,0.75)' : 'rgba(248,113,113,0.65)';
    return '<div class="spark-bar" style="height:' + h + '%;background:' + bg + ';" title="Trial ' + (i+1) + ': ' + (t.isCorrect?'✅':'❌') + ' ' + rt + 'ms"></div>';
  }).join('');
  return '<div class="sparkline">' + bars + '</div>' +
    '<div class="spark-legend">' +
    '<div class="spark-legend-item"><div class="spark-legend-dot" style="background:rgba(52,211,153,0.75)"></div>Correct</div>' +
    '<div class="spark-legend-item"><div class="spark-legend-dot" style="background:rgba(248,113,113,0.65)"></div>Incorrect</div>' +
    '</div>';
}

/* ---- VWM trial-by-trial table ---- */
function renderVWMTrialTable(trials, showDistractors = false) {
  const rows = trials.map((t, i) => {
    const swatches = (t.stimulusColors || []).map(col =>
      '<span class="color-swatch" style="background:' + col + '" title="' + col + '"></span>'
    ).join('');
    return '<tr>' +
      '<td style="font-family:var(--font-mono);color:var(--text-tertiary)">' + (i+1) + '</td>' +
      '<td style="font-family:var(--font-mono)">' + (t.setSize||'—') + '</td>' +
      (showDistractors ? '<td style="font-family:var(--font-mono);color:#fbbf24">' + (t.distractorCount||0) + '</td>' : '') +
      '<td>' + swatches + '</td>' +
      '<td style="font-size:11px;font-family:var(--font-mono)">' + (t.probeType||'—') + '</td>' +
      '<td style="font-size:11px;font-family:var(--font-mono)">' + (t.userResponse||'—') + '</td>' +
      '<td class="' + (t.isCorrect?'raw-correct':'raw-wrong') + '">' + (t.isCorrect?'✅':'❌') + '</td>' +
      '<td style="font-family:var(--font-mono)">' + (t.reactionTimeMs||'—') + '</td>' +
      '</tr>';
  }).join('');
  return '<div style="overflow-x:auto;"><table class="raw-trial-table">' +
    '<thead><tr><th>' + t('ad_th_num') + '</th><th>N</th>' + (showDistractors ? '<th>' + t('ad_th_distractors') + '</th>' : '') + '<th>' + t('ad_th_colors') + '</th><th>' + t('ad_th_type') + '</th><th>' + t('ad_th_response') + '</th><th>' + t('ad_th_result') + '</th><th>' + t('ad_th_rt') + '</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table></div>';
}

/* ---- ANT trial-by-trial table ---- */
function renderANTTrialTable(trials) {
  const rows = trials.map((t, i) =>
    '<tr>' +
    '<td style="font-family:var(--font-mono);color:var(--text-tertiary)">' + (i+1) + '</td>' +
    '<td style="font-size:11px;font-family:var(--font-mono)">' + (t.cueType||'—') + '</td>' +
    '<td style="font-size:11px;font-family:var(--font-mono)">' + (t.flankerType||'—') + '</td>' +
    '<td style="font-size:11px;font-family:var(--font-mono)">' + (t.targetDirection||'—') + '</td>' +
    '<td style="font-size:11px;font-family:var(--font-mono)">' + (t.userResponse||'—') + '</td>' +
    '<td class="' + (t.isCorrect?'raw-correct':'raw-wrong') + '">' + (t.isCorrect?'✅':'❌') + '</td>' +
    '<td style="font-family:var(--font-mono)">' + (t.reactionTimeMs||'—') + '</td>' +
    '</tr>'
  ).join('');
  return '<div style="overflow-x:auto;"><table class="raw-trial-table">' +
    '<thead><tr><th>' + t('ad_th_num') + '</th><th>' + t('ad_th_cue') + '</th><th>' + t('ad_th_flanker') + '</th><th>' + t('ad_th_target') + '</th><th>' + t('ad_th_response') + '</th><th>' + t('ad_th_result') + '</th><th>' + t('ad_th_rt') + '</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table></div>';
}

/* ---- Metric explanation overlay (trajectory chart + plain-English, general audience) ---- */
function getMetricValueForSession(key, session) {
  const s = session.scores || {};
  switch (key) {
    case 'composite':
      return { val: s.compositeScore || 0, min: 0, max: 100 };
    case 'kpure':
      return { val: s.kPure || 0, min: 0, max: 8 };
    case 'kdist':
      return { val: s.kDistractor || 0, min: 0, max: 8 };
    case 'maxn':
      return { val: s.maxSetSize || 0, min: 1, max: 8 };
    case 'meanrt':
      return { val: s.meanRT || 0, min: null, max: null };
    case 'acc-pure':
      return { val: (s.accuracyPure || 0) * 100, min: 0, max: 100 };
    case 'acc-dist':
      return { val: (s.accuracyDistractor || 0) * 100, min: 0, max: 100 };
    case 'exec-eff':
      return { val: s.vwmExecEfficiency || 0, min: null, max: null };
    case 'exec-speed':
      return { val: s.vwmExecSpeed || 0, min: null, max: null };
    case 'alerting':
      return { val: s.alerting || 0, min: null, max: null };
    case 'orienting':
      return { val: s.orienting || 0, min: null, max: null };
    case 'executive':
      return { val: s.executive || 0, min: null, max: null };
    case 'ant-congruent':
      return { val: s.ant?.rtByFlanker?.congruent || 0, min: null, max: null };
    case 'ant-incongruent':
      return { val: s.ant?.rtByFlanker?.incongruent || 0, min: null, max: null };
    case 'eff-congruent':
      return { val: s.antCongruentEfficiency || 0, min: 0, max: null };
    case 'eff-incongruent':
      return { val: s.antIncongruentEfficiency || 0, min: 0, max: null };
    case 'eff-alerting':
      return { val: s.antAlertingEfficiency || 0, min: null, max: null };
    case 'eff-orienting':
      return { val: s.antOrientingEfficiency || 0, min: null, max: null };
    case 'eff-executive':
      return { val: s.antExecutiveEfficiency || 0, min: null, max: null };
    default:
      return { val: 0, min: null, max: null };
  }
}

function showMetricExplain(key, userSessions = [], currentSessionIndex = -1) {
  document.getElementById('av-explain-overlay')?.remove();

  const isJa = getLang() === 'ja';

  const EXPLAINS = {
    composite: {
      tag: 'Overall Score',
      title: 'Overall Performance',
      body: 'Think of this as a final grade for the brain. It pulls together memory, speed, focus, and attention control into a single score from 0 to 100. A higher score means sharper overall mental performance.',
      analogy: '<strong>Real-world analogy:</strong> Like a credit score, but for the brain. It doesn\'t just look at one thing — it weighs up multiple factors to give a complete picture of mental performance.',
    },
    kpure: {
      tag: 'Working Memory',
      title: 'Memory Size (No Distractions)',
      body: 'This measures how many items the brain can hold in mind at the same time without any distractions. Most healthy adults score between 3 and 4.',
      analogy: '<strong>Real-world analogy:</strong> Imagine trying to remember a phone number while walking to find a pen. K measures how many digits you can keep in mind before they start dropping out.',
    },
    kdist: {
      tag: 'Working Memory Under Pressure',
      title: 'Memory Size (With Distractions)',
      body: 'This measures memory capacity when distracting elements are present. Comparing this to pure memory capacity shows how well focus is maintained under pressure.',
      analogy: '<strong>Real-world analogy:</strong> Can you still remember your shopping list if someone starts talking to you? The gap between this score and pure K tells you how sensitive this person is to interruptions.',
    },
    maxn: {
      tag: 'Task Progression',
      title: 'Peak Memory Level',
      body: 'The largest number of items shown in a single round. The test difficulty increases as you answer correctly; a higher level means you progressed further.',
      analogy: '<strong>Real-world analogy:</strong> Like levels in a video game. This tells you how far the player got before the difficulty became too much.',
    },
    meanrt: {
      tag: 'Processing Speed',
      title: 'Average Response Speed',
      body: 'The average time (in milliseconds) taken to give correct answers. Lower reaction times indicate faster mental processing speed.',
      analogy: '<strong>Real-world analogy:</strong> Like a sprinter\'s average lap time — but only counting the laps they finished cleanly. Under 400ms is very fast; above 800ms on simple tasks suggests slower processing.',
    },
    'acc-pure': {
      tag: 'Accuracy',
      title: 'Memory Accuracy (No Distractions)',
      body: 'The percentage of memory trials answered correctly when there were no distractions. This is a baseline measure of visual memory reliability.',
      analogy: '<strong>Real-world analogy:</strong> If someone showed you 10 flash cards and you got 8 right, that\'s 80% accuracy. This works the same way, across many repeated trials.',
    },
    'acc-dist': {
      tag: 'Accuracy Under Pressure',
      title: 'Memory Accuracy (With Distractions)',
      body: 'The percentage of memory trials answered correctly when distractions were present. A drop compared to pure accuracy shows how distractions affect accuracy.',
      analogy: '<strong>Real-world analogy:</strong> Could you still pass the flash card test if someone was tapping on your desk? The gap between pure and distractor accuracy shows how easily this person is thrown off.',
    },
    alerting: {
      tag: 'Attention Network',
      title: 'Alert Preparation Speed',
      body: 'This measures how well warning cues alert the brain to prepare for an upcoming stimulus, speeding up response times.',
      analogy: '<strong>Real-world analogy:</strong> The difference between being startled by a sudden knock vs. opening the door when the doorbell rings. Alerting captures how well the brain uses "heads-up" signals.',
    },
    orienting: {
      tag: 'Attention Network',
      title: 'Target Focus Speed',
      body: 'This measures how effectively the brain directs its visual attention to a specific location on the screen when given a directional cue.',
      analogy: '<strong>Real-world analogy:</strong> Looking for someone in a crowd. If a friend taps you and points in the right direction, you find them faster. Orienting measures how much that "point" helps.',
    },
    executive: {
      tag: 'Attention Network',
      title: 'Conflict Resolution Speed',
      body: "This measures the brain's ability to filter out conflict and stay focused. It captures the extra processing time needed to ignore misleading information.",
      analogy: '<strong>Real-world analogy:</strong> Reading the word "RED" printed in blue ink — your brain has to override one signal to process another. This score captures that mental tug-of-war.',
    },
    'exec-eff': {
      tag: 'Focus Resilience',
      title: 'Focus Retention Under Distraction',
      body: 'This shows the relative percentage change in memory capacity when distractions are introduced. Closer to 0% means higher distraction resilience.',
      analogy: '<strong>Real-world analogy:</strong> If you can remember 4 tasks when it is quiet, but only 3 tasks when the TV is on, your efficiency drops by 25%. This score captures that relative drop under distraction.',
    },
    'exec-speed': {
      tag: 'Focus Speed',
      title: 'Speed Cost Under Distraction',
      body: 'The speed difference when distractions are present. It shows if visual distraction causes the player to slow down to maintain accuracy.',
      analogy: '<strong>Real-world analogy:</strong> The extra time you take to read a sign when there are flashing advertisements around it. It shows if you slow down to maintain accuracy when distractors pop up.',
    },
    'ant-congruent': {
      tag: 'Attention Network',
      title: 'Standard Response Speed',
      body: 'The average speed to identify the center arrow when surrounding arrows point in the same direction. This represents baseline speed under no conflict.',
      analogy: '<strong>Real-world analogy:</strong> Like driving when all traffic flow indicators point in the same direction. It requires very little mental filter to make a decision.',
    },
    'ant-incongruent': {
      tag: 'Attention Network',
      title: 'Conflicting Response Speed',
      body: 'The average speed to identify the center arrow when surrounding arrows point in the opposite direction, representing speed under conflict.',
      analogy: '<strong>Real-world analogy:</strong> Like driving in a construction zone where some arrows point left but a sign says "Turn Right". It takes longer because your brain must filter out the misleading visual cues.',
    },
    'eff-congruent': {
      tag: 'Attention Throughput',
      title: 'Standard Task Efficiency',
      body: 'Overall cognitive throughput (speed and accuracy combined) under low-conflict conditions. Higher is better.',
      analogy: '<strong>Real-world analogy:</strong> Typing speed on a keyboard when you are typing familiar words — high speed and high accuracy combine for high productivity.',
    },
    'eff-incongruent': {
      tag: 'Attention Throughput',
      title: 'Conflicting Task Efficiency',
      body: 'Overall cognitive throughput (speed and accuracy combined) under high-conflict conditions. Higher is better.',
      analogy: '<strong>Real-world analogy:</strong> Driving through complex, unfamiliar traffic while still making split-second correct decisions.',
    },
    'eff-alerting': {
      tag: 'Attention Efficiency',
      title: 'Alert Prep Efficiency',
      body: 'Throughput gain from alert cues. Shows how effectively warning signals improve performance.',
      analogy: '<strong>Real-world analogy:</strong> How much a "heads-up" warning boosts your actual productivity.',
    },
    'eff-orienting': {
      tag: 'Attention Efficiency',
      title: 'Target Focus Efficiency',
      body: 'Throughput gain from spatial cues. Shows how effectively directional hints improve performance.',
      analogy: '<strong>Real-world analogy:</strong> How much a precise pointer speeds up finding what you need.',
    },
    'eff-executive': {
      tag: 'Attention Efficiency',
      title: 'Conflict Filter Efficiency',
      body: 'Throughput retention under visual conflict. Shows how effectively conflict is filtered out without losing speed/accuracy.',
      analogy: '<strong>Real-world analogy:</strong> Noise-cancelling headphones for your brain.',
    }
  };

  const EXPLAINS_JA = {
    composite: {
      tag: '総合スコア',
      title: '総合パフォーマンス',
      body: '脳の総合成績表のようなものです。記憶力、速度、集中力、注意制御を統合し、0から100の単一スコアで表します。数値が高いほど総合的な認知能力が高いことを意味します。',
      analogy: '<strong>現実例：</strong> 脳の信用スコアのようなものです。単一の要素だけでなく多角的な指標を統合して全体像を示します。',
    },
    kpure: {
      tag: 'ワーキングメモリ',
      title: '記憶容量 (通常 / 妨害なし)',
      body: '妨害がない状態において、脳が同時に保持できる視覚要素の測定値です。一般的な成人の平均は3〜4項目です。',
      analogy: '<strong>現実例：</strong> ペンを探して歩いている間に電話番号を記憶するようなものです。Cowan\'s Kは忘れずに覚えていられる数字の桁数を測定します。',
    },
    kdist: {
      tag: '負荷時のワーキングメモリ',
      title: '記憶容量 (妨害あり)',
      body: '視覚的な妨害要素（ディストラクター）が存在する状況での記憶容量です。通常の記憶容量と比較することで、プレッシャーやノイズ下での集中維持力を評価します。',
      analogy: '<strong>現実例：</strong> 誰かに話しかけられながら買い物リストを記憶できるか。通常Kとの差で割り込みへの強さが分かります。',
    },
    maxn: {
      tag: '進行レベル',
      title: '最高到達記憶レベル',
      body: '1ラウンドで表示された最大のアイテム数（N）です。正解を重ねるごとに難易度が上がり、高いレベルに到達するほど記憶の限界値が高いことを示します。',
      analogy: '<strong>現実例：</strong> ゲームのステージ到達度のイメージです。難易度が限界に達するまでにどこまで進めたかを示します。',
    },
    meanrt: {
      tag: '処理速度',
      title: '平均回答速度',
      body: '正解した試行における平均反応時間（ミリ秒）です。数値が低いほど脳の視覚・意思決定処理速度が速いことを示します。',
      analogy: '<strong>現実例：</strong> スプリンターの平均タイムのようなものです。400ms未満は非常に高速、800ms以上は処理が慎重であることを示します。',
    },
    'acc-pure': {
      tag: '正解率',
      title: '記憶正解率 (通常 / 妨害なし)',
      body: '妨害なしの環境で正確に視覚記憶を正解できた割合です。視覚メモリの基本的な正確性を測るベースラインです。',
      analogy: '<strong>現実例：</strong> 10枚のカードを見せられて8枚正解できたら正解率80%です。これを多数の試行で計測します。',
    },
    'acc-dist': {
      tag: '負荷時の正解率',
      title: '記憶正解率 (妨害あり)',
      body: '妨害要素が存在する環境での正解率です。通常正解率からの低下幅を見ることで、妨害による制度の乱れを測定します。',
      analogy: '<strong>現実例：</strong> 机をトントン叩かれてもカードテストに正解できるか。妨害への影響の受けやすさが分かります。',
    },
    alerting: {
      tag: '注意ネットワーク',
      title: '警告準備速度',
      body: '予告信号（キュー）によって脳が刺激の出現に事前に備え、反応をどれだけスピードアップできるかを測る効果です。',
      analogy: '<strong>現実例：</strong> 突然のノックに驚くか、インターホンが鳴ってドアを開けるかの違いです。事前の「準備」の効果を測定します。',
    },
    orienting: {
      tag: '注意ネットワーク',
      title: 'ターゲット注視速度',
      body: '画面上の特定の位置へ視線と注意を向けさせるガイド（方向キュー）が出た際、どれだけ迅速に焦点を合わせられるかを測ります。',
      analogy: '<strong>現実例：</strong> 人ごみの中で友達を探す際、「あっちだよ」と指をさされた方が素早く見つけられる効果と同じです。',
    },
    executive: {
      tag: '注意ネットワーク',
      title: '葛藤解消速度',
      body: '周囲の誤解を招く情報（相反する矢印など）を無視し、真のターゲットに集中する葛藤抑制能力です。',
      analogy: '<strong>現実例：</strong> 青いインクで書かれた「赤」という文字を読むストループ効果です。誤った視覚情報を抑え込む脳の力を評価します。',
    },
    'exec-eff': {
      tag: '集中維持率',
      title: '妨害下での集中維持率',
      body: '妨害要素が加わった際の記憶容量の保持割合（%）です。100%に近いほど妨害に強い集中力を発揮します。',
      analogy: '<strong>現実例：</strong> 静かな部屋で4つ覚えていたことが、TVがつくと3つに減った場合、保持率は75%になります。',
    },
    'exec-speed': {
      tag: '速度コスト',
      title: '妨害による速度低下コスト',
      body: '妨害要素が現れた際に回答スピードがどれだけ遅くなったか（ms）を示します。正確性を保つために慎重になった度合いです。',
      analogy: '<strong>現実例：</strong> 点滅広告がある場所で標識を読むときにかかる追加の時間です。',
    },
    'ant-congruent': {
      tag: '注意ネットワーク',
      title: '標準試行の回答速度',
      body: '周囲の矢印と中央の矢印が同じ方向を向いている（一致試行）際の平均回答スピードです。',
      analogy: '<strong>現実例：</strong> 全ての標識が同じ方向を指している道路を運転するスムーズな状態です。',
    },
    'ant-incongruent': {
      tag: '注意ネットワーク',
      title: '葛藤試行の回答速度',
      body: '周囲の矢印が中央の矢印と逆を向いている（不一致試行）際の平均回答スピードです。',
      analogy: '<strong>現実例：</strong> 「右折」の看板があるのに矢印が左を指している工事現場のような、視覚的葛藤がある状態です。',
    },
    'eff-congruent': {
      tag: 'スループット',
      title: '標準タスク効率',
      body: '葛藤のない標準的な試行における正確性とスピードを統合した認知スループット（試行/秒）です。',
      analogy: '<strong>現実例：</strong> 慣れた文字をタイピングするときのスピードと正確性の両立度合いです。',
    },
    'eff-incongruent': {
      tag: 'スループット',
      title: '葛藤タスク効率',
      body: '視覚的葛藤が存在する過酷な状況下での正確性とスピードを統合した認知スループット（試行/秒）です。',
      analogy: '<strong>現実例：</strong> 複雑な交通状況下で正確かつ素早く判断を下す処理能力です。',
    },
    'eff-alerting': {
      tag: '注意効率',
      title: '警告準備効率',
      body: '警告シグナルを活用したときのスループット向上効果です。',
      analogy: '<strong>現実例：</strong> 準備信号により作業効率がどれだけ向上したかの倍率です。',
    },
    'eff-orienting': {
      tag: '注意効率',
      title: 'ターゲット注視効率',
      body: '方向指示キューを活用したときのスループット向上効果です。',
      analogy: '<strong>現実例：</strong> 視界の誘導によって作業効率がどれだけ高まったかを示します。',
    },
    'eff-executive': {
      tag: '注意効率',
      title: '葛藤フィルター効率',
      body: 'ノイズや葛藤情報をシャットアウトしたときのスループット保持効率です。',
      analogy: '<strong>現実例：</strong> ノイズキャンセリングのように不要な情報を遮断して処理を維持する能力です。',
    }
  };

  const info = (isJa && EXPLAINS_JA[key]) ? EXPLAINS_JA[key] : (EXPLAINS[key] || {
    tag: 'Metric',
    title: key,
    body: 'Detailed metric performance calculation.',
    analogy: ''
  });
  if (!info) return;

  let chartSection = '';
  if (userSessions && userSessions.length > 0) {
    const dataPoints = userSessions.map(us => {
      const details = getMetricValueForSession(key, us);
      return {
        value: details.val,
        label: new Date(us.completedAt || us.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      };
    });
    const firstSess = userSessions[0];
    const { min, max } = getMetricValueForSession(key, firstSess);
    
    chartSection = `
      <div class="av-explain-trajectory">
        <div class="av-formula-label" style="margin-bottom:8px;">Performance Trajectory</div>
        <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:16px 20px; margin: 8px 0 16px 0;">
          ${generateSvgLineChart(dataPoints, 520, 160, currentSessionIndex, min, max)}
        </div>
        ${userSessions.length === 1 ? `<div style="font-size:10px; color:var(--text-tertiary); text-align:center; margin-top:-8px; margin-bottom:16px; font-family:var(--font-mono)">1 session completed. Additional sessions will build a trend line.</div>` : ''}
      </div>
    `;
  }

  const overlay = document.createElement('div');
  overlay.className = 'av-explain-overlay';
  overlay.id = 'av-explain-overlay';
  overlay.innerHTML =
    '<div class="av-explain-card">' +
    '<button class="av-explain-close" id="av-explain-close">\u00d7</button>' +
    '<div class="av-explain-tag">' + info.tag + '</div>' +
    '<div class="av-explain-title">' + info.title + '</div>' +
    '<div class="av-explain-body">' + info.body + '</div>' +
    chartSection +
    '<div class="av-explain-analogy">' + info.analogy + '</div>' +
    '</div>';

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  document.getElementById('av-explain-close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
}
