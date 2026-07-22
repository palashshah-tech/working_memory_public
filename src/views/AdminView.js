/* ============================================================
   Admin View — Hidden dashboard (/admin)
   Passphrase: cogscreen2026
   ============================================================ */

import { render, $, downloadFile } from '../utils/dom.js';
import { Storage } from '../utils/storage.js';
import { recalculateRanks, getTierDistribution, getStatsSummary } from '../scoring/RankingEngine.js';
import { injectStyle } from '../router.js';
import { validateAdminAccess } from '../utils/access.js';
import { t, getLang, setLang } from '../utils/i18n.js';

let authed = false;
let adminCompanyId = null;
let adminCompanyName = '';

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
      max-width: 480px; width: 100%;
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
    
@media print {
  /* Browsers strip background colors by default unless told otherwise — unavoidable !important */
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  /* The app shell likely locks height/overflow for in-app scrolling.
     Try without !important first — since this stylesheet loads last, it should win on the cascade. */
  html, body, #app, #root {
    height: auto;
    max-height: none;
    overflow: visible;
  }

  body.av-printing .av-body,
  body.av-printing .av-header,
  body.av-printing .av-tabs,
  body.av-printing #av-print-report,
  body.av-printing #av-close-modal,
  body.av-printing .av-metric-info-btn {
    display: none;
  }

  /* Only the Overview tab prints — Raw Data tab is excluded regardless of which tab was active */
  body.av-printing #av-tab-raw { display: none; }
  body.av-printing #av-tab-overview { display: block; }

  body.av-printing .av-modal-bg {
    position: static;
    inset: auto;
    background: #fff;
    backdrop-filter: none;
    padding: 0;
    display: block;
  }
  body.av-printing .av-modal {
    position: static;
    max-width: 100%;
    max-height: none;
    overflow: visible;
    box-shadow: none;
    border: none;
    background: #fff;
    color: #111;
  }
  body.av-printing .av-modal-header {
    position: static;
    background: #fff;
    border-bottom: 2px solid #ccc;
  }
  body.av-printing .av-modal-header h2,
  body.av-printing .av-metric-val,
  body.av-printing .av-chart-title {
    color: #111;
  }
  body.av-printing .av-metric-label,
  body.av-printing .av-modal-meta {
    color: #555;
  }
  body.av-printing .av-metric,
  body.av-printing .av-tab-content {
    background: #fafafa;
    border-color: #ddd;
  }

  /* Keep individual metric cards intact when a page breaks mid-grid */
  body.av-printing .av-metric {
    break-inside: avoid;
  }
}
  `);

  if (!authed) { showGate(); } else { showDashboard(); }
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
            <div class="agc-field-icon">⬤</div>
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
    const pass = document.getElementById('ap-pass').value;
    const errEl = document.getElementById('ap-err');
    const btn = document.getElementById('ap-auth');
    errEl.style.display = 'none';
    btn.querySelector('.agc-btn-text').textContent = 'Verifying...';
    btn.disabled = true;
    const res = await validateAdminAccess(pass);
    btn.querySelector('.agc-btn-text').textContent = 'Access Dashboard';
    btn.disabled = false;
    if (res.ok) {
      authed = true;
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

  const rawCandidates = await Storage.getCandidates(undefined);
  const candidates = recalculateRanks(rawCandidates);
  const stats = getStatsSummary(candidates);
  const tiers = getTierDistribution(candidates);
  const n = candidates.length;

  const TIER_COLORS = { 'S+': '#ffd700', 'S': '#00f0ff', 'A': '#a855f7', 'B': '#34d399', 'C': '#fbbf24', 'D': '#f87171' };
  const TIER_CLS = { 'S+': 'sp', 'S': 's', 'A': 'a', 'B': 'b', 'C': 'c', 'D': 'd' };

  render(`
    <div class="av">
      <header class="av-header">
        <div class="av-logo">
          <img src="/xiberlinc_mark.png" alt="Xiberlinc" class="av-logo-img" />
          <span>${t('ad_admin')}</span>
        </div>
        <div class="av-actions">
          <button class="av-btn av-btn-ghost" id="av-lang-toggle" style="color:#d4ff00; font-family:var(--font-mono); font-size:12px; border:1px solid rgba(212,255,0,0.25); background:rgba(212,255,0,0.08);">${t('lang_toggle')}</button>
          <button class="av-btn av-btn-ghost" id="av-refresh">↻ ${t('ad_refresh')}</button>
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
    const initials = (c.name || 'N A').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
    return `
                      <tr>
                        <td class="av-rank">${c.rank || i + 1}</td>
                        <td>
                          <div class="av-candidate">
                            <div class="av-avatar">${initials}</div>
                            <div class="av-name">
                              <strong>${c.name || '—'}</strong>
                              <span class="av-handle">${c.handle || '—'}</span>
                            </div>
                          </div>
                        </td>
                        <td><span class="tier-pip tier-${tc}">${s.tier || '—'}</span></td>
                        <td class="td-mono">${cs.toFixed(1)}</td>
                        <td class="td-mono">${(s.kPure || 0).toFixed(2)}</td>
                        <td class="td-mono">${s.maxSetSize || 0}</td>
                        <td class="td-mono">${(s.meanRT || 0).toFixed(0)}ms</td>
                        <td class="td-mono">${((s.accuracyDistractor || 0) * 100).toFixed(0)}%</td>
                        <td><button class="av-btn-view" data-email="${c.email || ''}">${t('ad_btn_detail')}</button></td>
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
                <div class="av-tier-seg" style="width:${n > 0 ? (c / n) * 100 : 0}%;background:${TIER_COLORS[t_name]}"></div>
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
    return `
                      <tr>
                        <td class="td-mono">${c.rank || i + 1}</td>
                        <td class="td-name">${c.name || '—'}</td>
                        <td><span style="font-family:var(--font-mono);font-size:11px;background:rgba(0,240,255,0.08);color:#00f0ff;padding:2px 8px;border-radius:99px">${c.handle || '—'}</span></td>
                        <td class="td-mono">${c.age || '—'}</td>
                        <td><span class="tier-pip tier-${tc}">${s.tier || '—'}</span></td>
                        <td class="${sc}">${cs.toFixed(1)}</td>
                        <td class="td-mono">${(s.kPure || 0).toFixed(2)}</td>
                        <td class="td-mono">${(s.kDistractor || 0).toFixed(2)}</td>
                        <td class="td-mono">${s.maxSetSize || 0}</td>
                        <td class="td-mono">${(s.meanRT || 0).toFixed(0)}ms</td>
                        <td class="td-mono">${((s.accuracyPure || 0) * 100).toFixed(0)}%</td>
                        <td class="td-mono">${((s.accuracyDistractor || 0) * 100).toFixed(0)}%</td>
                        <td class="td-mono">${(s.alerting || 0).toFixed(0)}ms</td>
                        <td class="td-mono">${(s.orienting || 0).toFixed(0)}ms</td>
                        <td class="td-mono">${(s.executive || 0).toFixed(0)}ms</td>
                        <td class="td-mono">${date}</td>
                        <td><button class="av-btn-view" data-email="${c.email || ''}">${t('ad_btn_detail')}</button></td>
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
  document.getElementById('av-refresh')?.addEventListener('click', () => showDashboard());
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
    btn.addEventListener('click', () => showDetail(btn.dataset.email, candidates));
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

/* ---- Detail modal (tabbed) ---- */
function showDetail(email, candidates) {
  const c = candidates.find(x => x.email === email);
  if (!c) return;
  const s = c.scores || {};

  const skipsHtml = c.metadata?.skips
    ? '<div style="margin-top:8px;display:flex;gap:6px;">' +
    Object.keys(c.metadata.skips).map(t =>
      '<span style="background:#fbbf2420;color:#fbbf24;border:1px solid #fbbf2440;padding:2px 8px;font-size:10px;font-family:var(--font-mono)">SKIPPED: ' + t.toUpperCase() + '</span>'
    ).join('') + '</div>'
    : '';

  const mc = document.getElementById('av-modal-container');
  mc.innerHTML = `
    <div class="av-modal-bg" id="av-modal-bg">
      <div class="av-modal">
        <div class="av-modal-header">
          <div>
            <div style="display:flex;align-items:center;gap:12px;">
              <h2>${c.name}</h2>
              <span class="tier-pip tier-${(s.tier || 'D').toLowerCase().replace('+', 'sp')}">${s.tier || '—'}</span>
            </div>
            <p style="color:var(--text-tertiary);font-size:13px;margin-top:4px;">${c.email} · @${c.handle} · Age ${c.age} · ${c.gender || '—'}</p>
            ${skipsHtml}
          </div>
          <button class="av-btn av-btn-ghost" id="av-print-report" style="font-size:0.85rem;padding:6px 14px;color:#d4ff00;border:1px solid rgba(212,255,0,0.2);background:rgba(212,255,0,0.04);">Download PDF Report</button>
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
    btn.addEventListener('click', e => { e.stopPropagation(); showMetricExplain(btn.dataset.metricKey); });
  });

  const close = () => { mc.innerHTML = ''; };
  document.getElementById('av-close-modal').addEventListener('click', close);
  document.getElementById('av-print-report').addEventListener('click', () => {
    document.body.classList.add('av-printing');
    window.print();
  });

  window.addEventListener('afterprint', () => {
    document.body.classList.remove('av-printing');
  }, { once: true });
  document.getElementById('av-modal-bg').addEventListener('click', e => { if (e.target === e.currentTarget) close(); });
}

/* ---- Overview tab (existing metrics, K chart, ANT, component scores) ---- */
function renderOverviewTab(c, s) {
  const kData = s.vwmPure?.kScores || {};
  const setSizes = [1, 2, 3, 4, 6, 8];
  const maxKVal = 6;

  const metricsHtml = [
    { key: 'composite', label: 'Composite', val: (s.compositeScore || 0).toFixed(1) },
    { key: 'kpure', label: "Cowan's K", val: (s.kPure || 0).toFixed(2) },
    { key: 'kdist', label: 'K (Distract)', val: (s.kDistractor || 0).toFixed(2) },
    { key: 'exec-eff', label: 'Exec. Efficiency', val: (s.vwmExecEfficiency || 0).toFixed(1) + '%' },
    { key: 'exec-speed', label: 'Exec. Speed', val: (s.vwmExecSpeed || 0).toFixed(0) + 'ms' },
    { key: 'maxn', label: 'Max N', val: s.maxSetSize || 0 },
    { key: 'meanrt', label: 'Avg RT', val: (s.meanRT || 0).toFixed(0) + 'ms' },
    { key: 'acc-pure', label: 'Acc Pure', val: ((s.accuracyPure || 0) * 100).toFixed(0) + '%' },
    { key: 'acc-dist', label: 'Acc Dist.', val: ((s.accuracyDistractor || 0) * 100).toFixed(0) + '%' },
  ].map(m =>
    '<div class="av-metric">' +
    '<div class="av-metric-label">' + m.label + '</div>' +
    '<div class="av-metric-val" style="color:#d4ff00">' + m.val + '</div>' +
    '<button class="av-metric-info-btn" data-metric-key="' + m.key + '">i</button>' +
    '</div>'
  ).join('');

  const kChartHtml = setSizes.map(n => {
    const k = kData[n]?.k || 0;
    const pct = Math.max(2, (k / maxKVal) * 100);
    return '<div class="av-bar-col"><div class="av-bar-val">' + k.toFixed(1) + '</div>' +
      '<div class="av-bar" style="height:' + pct + '%"></div>' +
      '<div class="av-bar-lbl">N=' + n + '</div></div>';
  }).join('');

  const antHtml = [
    { key: 'alerting', label: 'Alerting RT', val: (s.alerting || 0).toFixed(0) + 'ms' },
    { key: 'orienting', label: 'Orienting RT', val: (s.orienting || 0).toFixed(0) + 'ms' },
    { key: 'executive', label: 'Executive RT', val: (s.executive || 0).toFixed(0) + 'ms' },
    { key: 'ant-congruent', label: 'Congruent RT', val: (s.ant?.rtByFlanker?.congruent || 0).toFixed(0) + 'ms' },
    { key: 'ant-incongruent', label: 'Incongruent RT', val: (s.ant?.rtByFlanker?.incongruent || 0).toFixed(0) + 'ms' },
    { key: 'eff-congruent', label: 'Congruent Eff.', val: (s.antCongruentEfficiency || 0).toFixed(2) + ' r/s' },
    { key: 'eff-incongruent', label: 'Incongruent Eff.', val: (s.antIncongruentEfficiency || 0).toFixed(2) + ' r/s' },
    { key: 'eff-alerting', label: 'Alerting Eff.', val: (s.antAlertingEfficiency || 0).toFixed(2) },
    { key: 'eff-orienting', label: 'Orienting Eff.', val: (s.antOrientingEfficiency || 0).toFixed(2) },
    { key: 'eff-executive', label: 'Executive Eff.', val: (s.antExecutiveEfficiency || 0).toFixed(2) },
  ].map(m =>
    '<div class="av-metric">' +
    '<div class="av-metric-label">' + m.label + '</div>' +
    '<div class="av-metric-val" style="color:#d4ff00">' + m.val + '</div>' +
    '<button class="av-metric-info-btn" data-metric-key="' + m.key + '">i</button>' +
    '</div>'
  ).join('');

  const COMP_LABELS = { kPure: 'CowanK', kDistractor: 'CowanK(Dist)', maxSetSize: 'MaxN', rtEfficiency: 'RT Eff', alerting: 'Alert', orienting: 'Orient', executive: 'Exec' };
  const componentHtml = s.componentScores
    ? '<div class="av-chart-title">Component Scores (0–100)</div><div class="av-chart">' +
    Object.entries(s.componentScores).map(([key, val]) => {
      const color = val >= 70 ? '#34d399' : val >= 40 ? '#fbbf24' : '#f87171';
      return '<div class="av-bar-col"><div class="av-bar-val">' + val.toFixed(0) + '</div>' +
        '<div class="av-bar" style="height:' + Math.max(2, val) + '%;background:' + color + '"></div>' +
        '<div class="av-bar-lbl">' + (COMP_LABELS[key] || key) + '</div></div>';
    }).join('') + '</div>'
    : '';

  const totalTrials = (s.vwmPure?.totalTrials || 0) + (s.vwmDistractor?.totalTrials || 0) + (s.ant?.totalTrials || 0);
  const completedAt = c.completedAt ? new Date(c.completedAt).toLocaleString() : '—';
  const metaHtml = c.metadata
    ? '<div style="font-family:var(--font-mono);font-size:11px;color:var(--text-tertiary);background:rgba(255,255,255,0.03);padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.05);margin-top:8px;">' +
    '<div style="margin-bottom:4px;color:var(--text-secondary);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Device Telemetry</div>' +
    '<div>Resolution: ' + c.metadata.windowWidth + 'x' + c.metadata.windowHeight + '</div>' +
    '<div style="margin-top:4px;opacity:0.7;line-height:1.4;word-break:break-all;">Agent: ' + c.metadata.userAgent + '</div></div>'
    : '';

  return `
    <div class="av-modal-body">
      <div class="av-metrics">${metricsHtml}</div>
      <div class="av-chart-title">Cowan's K by Set Size (VWM Pure)</div>
      <div class="av-chart">${kChartHtml}</div>
      <div class="av-chart-title">ANT Scores & Efficiency</div>
      <div class="av-metrics" style="grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));">${antHtml}</div>
      ${componentHtml}
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);">
        <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-tertiary);">
          Total trials: ${totalTrials} · Completed: ${completedAt}
        </div>
        ${metaHtml}
      </div>
    </div>
  `;
}

/* ---- Raw Data tab ---- */
function renderRawTab(c) {
  const trials = c.trials || [];
  if (!trials.length) {
    return `<div class="av-modal-body"><div class="av-empty"><div class="av-empty-icon">📋</div><p>${t('ad_modal_no_raw')}</p></div></div>`;
  }

  const vwmPure = trials.filter(t => t.taskType === 'vwm-pure');
  const vwmDist = trials.filter(t => t.taskType === 'vwm-distractor');
  const antT = trials.filter(t => t.taskType === 'ant');
  const allVwm = [...vwmPure, ...vwmDist];

  // At-a-glance
  const correct = trials.filter(t => t.isCorrect).length;
  const acc = trials.length ? (correct / trials.length * 100).toFixed(0) : 0;
  const rtVals = trials.filter(t => t.isCorrect && t.reactionTimeMs > 0).map(t => t.reactionTimeMs);
  const avgRT = rtVals.length ? Math.round(rtVals.reduce((a, b) => a + b, 0) / rtVals.length) : 0;
  const fastRT = rtVals.length ? Math.min(...rtVals) : 0;
  const slowRT = rtVals.length ? Math.max(...rtVals) : 0;
  let maxStreak = 0, streak = 0;
  trials.forEach(t => { if (t.isCorrect) { streak++; maxStreak = Math.max(maxStreak, streak); } else streak = 0; });

  const accColor = acc >= 70 ? '#34d399' : acc >= 50 ? '#fbbf24' : '#f87171';
  const glanceHtml =
    '<div class="raw-glance-card"><div class="raw-glance-label">Total trials</div><div class="raw-glance-val">' + trials.length + '</div></div>' +
    '<div class="raw-glance-card"><div class="raw-glance-label">Overall accuracy</div><div class="raw-glance-val" style="color:' + accColor + '">' + acc + '%</div></div>' +
    '<div class="raw-glance-card"><div class="raw-glance-label">Avg response time</div><div class="raw-glance-val">' + avgRT + 'ms</div></div>' +
    '<div class="raw-glance-card"><div class="raw-glance-label">Fastest correct</div><div class="raw-glance-val" style="color:#34d399">' + fastRT + 'ms</div></div>' +
    '<div class="raw-glance-card"><div class="raw-glance-label">Slowest correct</div><div class="raw-glance-val" style="color:#fbbf24">' + slowRT + 'ms</div></div>' +
    '<div class="raw-glance-card"><div class="raw-glance-label">Best streak</div><div class="raw-glance-val">' + maxStreak + ' in a row</div></div>';

  const vwmSections = allVwm.length
    ? '<div class="raw-section"><div class="raw-section-title">Accuracy by Colour (VWM)</div>' + renderColorAccuracy(allVwm) + '</div>' +
    '<div class="raw-section"><div class="raw-section-title">Response Time Trend (VWM)</div>' +
    '<div style="font-size:11px;color:var(--text-tertiary);margin-bottom:8px;">Each bar = one trial. Green = correct, red = incorrect. Height = reaction time.</div>' +
    renderSparkline(allVwm) + '</div>' +
    (vwmPure.length ? '<div class="raw-section"><div class="raw-section-title">VWM Pure — Trial by Trial (' + vwmPure.length + ' trials)</div>' + renderVWMTrialTable(vwmPure) + '</div>' : '') +
    (vwmDist.length ? '<div class="raw-section"><div class="raw-section-title">VWM Distractor — Trial by Trial (' + vwmDist.length + ' trials)</div>' + renderVWMTrialTable(vwmDist) + '</div>' : '')
    : '';

  const antSection = antT.length
    ? '<div class="raw-section"><div class="raw-section-title">ANT — Trial by Trial (' + antT.length + ' trials)</div>' + renderANTTrialTable(antT) + '</div>'
    : '';

  return '<div class="av-modal-body">' +
    '<div class="raw-section"><div class="raw-section-title">At a Glance</div><div class="raw-glance-grid">' + glanceHtml + '</div></div>' +
    vwmSections + antSection + '</div>';
}

/* ---- Colour accuracy (per colour across all VWM trials) ---- */
function renderColorAccuracy(trials) {
  const map = {};
  trials.forEach(t => {
    (t.stimulusColors || []).forEach(col => {
      if (!map[col]) map[col] = { correct: 0, total: 0 };
      map[col].total++;
      if (t.isCorrect) map[col].correct++;
    });
  });

  if (!Object.keys(map).length) return '<div style="color:var(--text-tertiary);font-size:13px;">No colour data available.</div>';

  return '<div class="color-acc-grid">' +
    Object.entries(map).sort((a, b) => b[1].total - a[1].total).map(([col, d]) => {
      const pct = d.total ? Math.round(d.correct / d.total * 100) : 0;
      const valColor = pct >= 70 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#f87171';
      return '<div class="color-acc-card">' +
        '<div class="color-acc-swatch" style="background:' + col + '"></div>' +
        '<div><div class="color-acc-name">' + col + '</div>' +
        '<div class="color-acc-pct" style="color:' + valColor + '">' + pct + '%</div>' +
        '<div class="color-acc-count">' + d.correct + '/' + d.total + ' correct</div></div>' +
        '</div>';
    }).join('') + '</div>';
}

/* ---- RT sparkline ---- */
function renderSparkline(trials) {
  if (!trials.length) return '';
  // Cap the y-axis scaling at 1500ms so that occasional long responses or timeouts (e.g. 6000ms / 1200ms)
  // do not squash the rest of the graph. Any response time >= 1500ms will be drawn at full height.
  const maxRT = Math.min(1500, Math.max(...trials.map(t => t.reactionTimeMs || 0), 1));
  const bars = trials.map((t, i) => {
    const rt = t.reactionTimeMs || 0;
    const h = Math.max(5, (Math.min(rt, maxRT) / maxRT) * 100);
    const bg = t.isCorrect ? 'rgba(52,211,153,0.75)' : 'rgba(248,113,113,0.65)';
    return '<div class="spark-bar" style="height:' + h + '%;background:' + bg + ';" title="Trial ' + (i + 1) + ': ' + (t.isCorrect ? '✅' : '❌') + ' ' + rt + 'ms"></div>';
  }).join('');
  return '<div class="sparkline">' + bars + '</div>' +
    '<div class="spark-legend">' +
    '<div class="spark-legend-item"><div class="spark-legend-dot" style="background:rgba(52,211,153,0.75)"></div>Correct</div>' +
    '<div class="spark-legend-item"><div class="spark-legend-dot" style="background:rgba(248,113,113,0.65)"></div>Incorrect</div>' +
    '</div>';
}

/* ---- VWM trial-by-trial table ---- */
function renderVWMTrialTable(trials) {
  const rows = trials.map((t, i) => {
    const swatches = (t.stimulusColors || []).map(col =>
      '<span class="color-swatch" style="background:' + col + '" title="' + col + '"></span>'
    ).join('');
    return '<tr>' +
      '<td style="font-family:var(--font-mono);color:var(--text-tertiary)">' + (i + 1) + '</td>' +
      '<td style="font-family:var(--font-mono)">' + (t.setSize || '—') + '</td>' +
      '<td>' + swatches + '</td>' +
      '<td style="font-size:11px;font-family:var(--font-mono)">' + (t.probeType || '—') + '</td>' +
      '<td style="font-size:11px;font-family:var(--font-mono)">' + (t.userResponse || '—') + '</td>' +
      '<td class="' + (t.isCorrect ? 'raw-correct' : 'raw-wrong') + '">' + (t.isCorrect ? '✅' : '❌') + '</td>' +
      '<td style="font-family:var(--font-mono)">' + (t.reactionTimeMs || '—') + '</td>' +
      '</tr>';
  }).join('');
  return '<div style="overflow-x:auto;"><table class="raw-trial-table">' +
    '<thead><tr><th>#</th><th>N</th><th>Colours</th><th>Type</th><th>Response</th><th>Result</th><th>RT (ms)</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table></div>';
}

/* ---- ANT trial-by-trial table ---- */
function renderANTTrialTable(trials) {
  const rows = trials.map((t, i) =>
    '<tr>' +
    '<td style="font-family:var(--font-mono);color:var(--text-tertiary)">' + (i + 1) + '</td>' +
    '<td style="font-size:11px;font-family:var(--font-mono)">' + (t.cueType || '—') + '</td>' +
    '<td style="font-size:11px;font-family:var(--font-mono)">' + (t.flankerType || '—') + '</td>' +
    '<td style="font-size:11px;font-family:var(--font-mono)">' + (t.targetDirection || '—') + '</td>' +
    '<td style="font-size:11px;font-family:var(--font-mono)">' + (t.userResponse || '—') + '</td>' +
    '<td class="' + (t.isCorrect ? 'raw-correct' : 'raw-wrong') + '">' + (t.isCorrect ? '✅' : '❌') + '</td>' +
    '<td style="font-family:var(--font-mono)">' + (t.reactionTimeMs || '—') + '</td>' +
    '</tr>'
  ).join('');
  return '<div style="overflow-x:auto;"><table class="raw-trial-table">' +
    '<thead><tr><th>#</th><th>Cue</th><th>Flanker</th><th>Target</th><th>Response</th><th>Result</th><th>RT (ms)</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table></div>';
}

/* ---- Metric explanation overlay (plain-English + formula, general audience) ---- */
function showMetricExplain(key) {
  document.getElementById('av-explain-overlay')?.remove();

  const EXPLAINS = {
    composite: {
      tag: 'Overall Score',
      title: 'Composite Score',
      formula: 'Score = (K_pure × 0.30) + (K_dist × 0.20) + (MaxN × 0.15) + (RT_eff × 0.10) + (Alerting × 0.10) + (Orienting × 0.08) + (Executive × 0.07)',
      body: 'Think of this as a final grade for the brain. It pulls together every task — memory, speed, focus, and attention control — into a single number from 0 to 100. The higher the score, the sharper the overall cognitive profile.',
      analogy: '<strong>Real-world analogy:</strong> Like a credit score, but for the brain. It doesn\'t just look at one thing — it weighs up multiple factors to give a complete picture of mental performance.',
    },
    kpure: {
      tag: 'Working Memory',
      title: "Cowan's K — Memory Capacity",
      formula: 'K = N × (Hit Rate − False Alarm Rate)',
      body: 'This measures how many items the brain can hold in mind at the same time — without any distractions. Most healthy adults score between 3 and 4. A higher score means more mental "slots" are available.',
      analogy: '<strong>Real-world analogy:</strong> Imagine trying to remember a phone number while walking to find a pen. K measures how many digits you can keep in mind before they start dropping out.',
    },
    kdist: {
      tag: 'Working Memory Under Pressure',
      title: "Cowan's K — Under Distraction",
      formula: 'K = N × (Hit Rate − False Alarm Rate)  [applied to distractor trials]',
      body: 'The same memory test, but with distracting elements added. This shows whether the brain can hold onto information when things get noisy or busy. A big drop from the pure K score means distractions hit hard.',
      analogy: '<strong>Real-world analogy:</strong> Can you still remember your shopping list if someone starts talking to you? The gap between this score and pure K tells you how sensitive this person is to interruptions.',
    },
    maxn: {
      tag: 'Task Progression',
      title: 'Maximum Set Size',
      formula: 'Max N = highest setSize value across all VWM trials',
      body: 'The largest number of items shown in a single round. The test adapts automatically — better performance unlocks harder levels with more items. A higher Max N means the person progressed further into the challenge.',
      analogy: '<strong>Real-world analogy:</strong> Like levels in a video game. This tells you how far the player got before the difficulty became too much.',
    },
    meanrt: {
      tag: 'Processing Speed',
      title: 'Mean Reaction Time',
      formula: 'Mean RT = Σ(RT on correct trials) ÷ Number of correct trials',
      body: 'The average time between seeing the question and giving a correct answer. Only correct trials are counted — wrong answers are excluded as they likely reflect guessing, not real processing. Lower is faster.',
      analogy: '<strong>Real-world analogy:</strong> Like a sprinter\'s average lap time — but only counting the laps they finished cleanly. Under 400ms is very fast; above 800ms on simple tasks suggests slower processing.',
    },
    'acc-pure': {
      tag: 'Accuracy',
      title: 'Accuracy — Memory (Pure)',
      formula: 'Accuracy = Correct Trials ÷ Total Trials × 100',
      body: 'The percentage of memory trials answered correctly when there were no distractions. This is the baseline measure of how reliably the brain can compare what it saw versus what it remembered.',
      analogy: '<strong>Real-world analogy:</strong> If someone showed you 10 flash cards and you got 8 right, that\'s 80% accuracy. This works the same way, across many repeated trials.',
    },
    'acc-dist': {
      tag: 'Accuracy Under Pressure',
      title: 'Accuracy — Memory (Distractor)',
      formula: 'Accuracy = Correct Trials ÷ Total Trials × 100  [distractor trials only]',
      body: 'The same accuracy measure, but during trials that included distracting elements. Comparing this to the pure accuracy score reveals how much distractions chip away at memory reliability.',
      analogy: '<strong>Real-world analogy:</strong> Could you still pass the flash card test if someone was tapping on your desk? The gap between pure and distractor accuracy shows how easily this person is thrown off.',
    },
    alerting: {
      tag: 'Attention Network',
      title: 'Alerting',
      formula: 'Alerting = RT(No Cue) − RT(Center Cue)',
      body: 'This measures how much a warning signal speeds up the brain\'s response. A positive number means the brain uses alerts effectively — it gets faster when it knows something is coming.',
      analogy: '<strong>Real-world analogy:</strong> The difference between being startled by a sudden knock vs. opening the door when the doorbell rings. Alerting captures how well the brain uses "heads-up" signals.',
    },
    orienting: {
      tag: 'Attention Network',
      title: 'Orienting',
      formula: 'Orienting = RT(Center Cue) − RT(Spatial Cue)',
      body: 'This measures how well the brain can direct its focus to exactly where it needs to be. When a cue points to the right location, responses get faster. This score captures the size of that benefit.',
      analogy: '<strong>Real-world analogy:</strong> Looking for someone in a crowd. If a friend taps you and points in the right direction, you find them faster. Orienting measures how much that "point" helps.',
    },
    executive: {
      tag: 'Attention Network',
      title: 'Executive Control',
      formula: 'Executive = RT(Incongruent Flankers) − RT(Congruent Flankers)',
      body: 'This measures the brain\'s ability to ignore conflicting information and stay focused on the task. A higher number means more mental effort was needed to override the interference.',
      analogy: '<strong>Real-world analogy:</strong> Reading the word "RED" printed in blue ink — your brain has to override one signal to process another. This score captures that mental tug-of-war.',
    },
    'exec-eff': {
      tag: 'VWM Executive',
      title: 'Executive Efficiency',
      formula: 'Exec. Efficiency = ((Distractor K − Pure K) ÷ Pure K) × 100',
      body: 'This measures how much working memory capacity is impacted when distractors are present compared to the pure baseline. A negative score indicates a performance drop due to distractors, while scores closer to 0% show high resilience to distraction.',
      analogy: '<strong>Real-world analogy:</strong> If you can remember 4 tasks when it is quiet, but only 3 tasks when the TV is on, your efficiency drops by 25%. This score captures that relative drop under distraction.',
    },
    'exec-speed': {
      tag: 'VWM Executive',
      title: 'Executive Speed',
      formula: 'Exec. Speed = Pure RT − Distractor RT',
      body: 'This measures the response speed difference between the pure and distractor memory tasks. A positive value means the candidate responded faster when distractors were present, whereas a negative value indicates they slowed down to process the distraction.',
      analogy: '<strong>Real-world analogy:</strong> The extra time you take to read a sign when there are flashing advertisements around it. It shows if you slow down to maintain accuracy when distractors pop up.',
    },
    'ant-congruent': {
      tag: 'Attention Network',
      title: 'Congruent RT',
      formula: 'Congruent RT = median(RT on correct congruent trials)',
      body: 'The median response time when the surrounding arrows point in the same direction as the target arrow. This represents the baseline response speed under conditions of low conflict/interference.',
      analogy: '<strong>Real-world analogy:</strong> Like driving when all traffic flow indicators point in the same direction. It requires very little mental filter to make a decision.',
    },
    'ant-incongruent': {
      tag: 'Attention Network',
      title: 'Incongruent RT',
      formula: 'Incongruent RT = median(RT on correct incongruent trials)',
      body: 'The median response time when the surrounding arrows point in the opposite direction of the target arrow. This indicates processing speed under high-interference and high-conflict conditions.',
      analogy: '<strong>Real-world analogy:</strong> Like driving in a construction zone where some arrows point left but a sign says "Turn Right". It takes longer because your brain must filter out the misleading visual cues.',
    },
    'eff-congruent': {
      tag: 'Attention Throughput',
      title: 'Congruent Efficiency',
      formula: 'Congruent Efficiency = (Accuracy_congruent ÷ Congruent RT) × 1000',
      body: 'The cognitive throughput (correct responses per second) under low conflict. A higher throughput indicates high accuracy combined with rapid processing speed.',
      analogy: '<strong>Real-world analogy:</strong> Typing speed on a keyboard when you are typing familiar words — high speed and high accuracy combine for high productivity.',
    },
    'eff-incongruent': {
      tag: 'Attention Throughput',
      title: 'Incongruent Efficiency',
      formula: 'Incongruent Efficiency = (Accuracy_incongruent ÷ Incongruent RT) × 1000',
      body: 'The cognitive throughput (correct responses per second) under high conflict. This metric represents how productively the brain can perform complex tasks that require filtering out active distraction.',
      analogy: '<strong>Real-world analogy:</strong> The speed and accuracy with which you can type text while listening to someone speak different words. It measures high-conflict productivity.',
    },
    'eff-alerting': {
      tag: 'Attention Throughput',
      title: 'Alerting Efficiency',
      formula: 'Alerting Efficiency = ((Accuracy_center − Accuracy_none) ÷ Alerting RT) × 1000',
      body: 'This measures attention throughput efficiency gained from warning cues. It combines accuracy changes and RT speed-ups to quantify how productively the brain utilizes warning signals.',
      analogy: '<strong>Real-world analogy:</strong> How much more work a driver gets done safely when a co-pilot gives them heads-up alerts about upcoming traffic signals.',
    },
    'eff-orienting': {
      tag: 'Attention Throughput',
      title: 'Orienting Efficiency',
      formula: 'Orienting Efficiency = ((Accuracy_spatial − Accuracy_center) ÷ Orienting RT) × 1000',
      body: 'This measures attention throughput efficiency gained from spatial cues. It combines accuracy changes and RT speed-ups to quantify how productively the brain utilizes directional pointers to align focus.',
      analogy: '<strong>Real-world analogy:</strong> A GPS highlight showing exactly which lane to turn into. It helps you execute the turn faster and with fewer mistakes.',
    },
    'eff-executive': {
      tag: 'Attention Throughput',
      title: 'Executive Efficiency',
      formula: 'Executive Efficiency = ((Accuracy_congruent − Accuracy_incongruent) ÷ Executive RT) × 1000',
      body: 'This measures the efficiency of resolving conflict/interference under executive control. It combines accuracy changes and RT speed-ups to quantify how productively the brain handles conflict resolution.',
      analogy: '<strong>Real-world analogy:</strong> An air traffic controller resolving flight path overlaps on a busy day. It represents throughput efficiency under intense cognitive conflict.',
    },
  };

  const info = EXPLAINS[key];
  if (!info) return;

  const overlay = document.createElement('div');
  overlay.className = 'av-explain-overlay';
  overlay.id = 'av-explain-overlay';
  overlay.innerHTML =
    '<div class="av-explain-card">' +
    '<button class="av-explain-close" id="av-explain-close">\u00d7</button>' +
    '<div class="av-explain-tag">' + info.tag + '</div>' +
    '<div class="av-explain-title">' + info.title + '</div>' +
    '<div class="av-explain-body">' + info.body + '</div>' +
    '<div class="av-explain-formula"><span class="av-formula-label">Formula</span>' + info.formula + '</div>' +
    '<div class="av-explain-analogy">' + info.analogy + '</div>' +
    '</div>';

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  document.getElementById('av-explain-close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
}
