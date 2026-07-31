/* ============================================================
   WorldView — Xiberlinc World (integrated into public app)
   Spline loader (10s) → Live World dashboard from Firebase
   ============================================================ */

import { render } from '../utils/dom.js';
import { injectStyle } from '../router.js';
import { fetchTopPlayers, buildLeaderboard, fetchLiveStats } from '../utils/worldData.js';
import { getSocialGraphData, formatChainDistance, getRecommendations } from '../utils/worldGraph.js';
import { NEURO_ROOMS, EVENTS } from '../utils/worldStatic.js';

/* ════════════════════════════════════════════════════════════
   PHASE 1 — Spline Loader (renders immediately, fetches data)
   ════════════════════════════════════════════════════════════ */
export function WorldView() {
  // Inject Spline viewer script if not already loaded
  if (!document.querySelector('script[src*="spline-viewer"]')) {
    const s = document.createElement('script');
    s.type = 'module';
    s.src = 'https://unpkg.com/@splinetool/viewer@1.9.82/build/spline-viewer.js';
    document.head.appendChild(s);
  }

  // Inject world CSS
  const worldLink = document.createElement('link');
  worldLink.rel = 'stylesheet';
  worldLink.href = '/src/styles/world.css';
  worldLink.setAttribute('data-view-style', '');
  if (!document.querySelector('link[href="/src/styles/world.css"]')) {
    document.head.appendChild(worldLink);
  }

  render(`
    <div id="world-root" style="position:fixed;inset:0;z-index:9000;background:#050507;">

      <!-- ── LOADER SCREEN ── -->
      <div id="world-loader" style="
        position:absolute;inset:0;
        display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        overflow:hidden;
      ">
        <!-- Spline -->
        <div style="position:absolute;inset:0;">
          <spline-viewer
            id="spline-el"
            url="/stairs.splinecode"
            loading-anim-type="none"
            style="width:100%;height:100%;opacity:0;transition:opacity 1.8s ease;"
          ></spline-viewer>
        </div>

        <!-- Aurora gradient matching Spline palette -->
        <div style="
          position:absolute;inset:0;pointer-events:none;
          background:
            radial-gradient(ellipse 65% 55% at 50% 75%, rgba(124,58,237,0.22) 0%, transparent 65%),
            radial-gradient(ellipse 45% 35% at 50% 90%, rgba(37,99,235,0.18) 0%, transparent 60%);
        "></div>

        <!-- Vignette -->
        <div style="
          position:absolute;inset:0;pointer-events:none;
          background:radial-gradient(ellipse at center,transparent 25%,rgba(5,5,7,0.75) 100%);
        "></div>

        <!-- Grid -->
        <div style="
          position:absolute;inset:0;pointer-events:none;
          background-image:
            linear-gradient(rgba(124,58,237,0.05) 1px,transparent 1px),
            linear-gradient(90deg,rgba(124,58,237,0.05) 1px,transparent 1px);
          background-size:70px 70px;
          mask-image:radial-gradient(ellipse 55% 55% at 50% 50%,transparent 20%,black 90%);
        "></div>

        <!-- Content -->
        <div id="loader-ui" style="
          position:relative;z-index:10;
          display:flex;flex-direction:column;align-items:center;gap:28px;
          text-align:center;padding:24px;margin-top:-8vh;pointer-events:none;
        ">
          <div id="loader-logo" style="opacity:0;transform:translateY(-16px);transition:all 1.1s cubic-bezier(0.2,0,0,1);">
            <img src="/xiberlinc_logo.png" alt="Xiberlinc" style="height:44px;mix-blend-mode:screen;filter:brightness(1.5) contrast(1.2);" />
          </div>

          <div id="loader-text-wrap" style="
            font-family:'Outfit',sans-serif;font-size:clamp(1rem,2.8vw,1.55rem);
            font-weight:600;color:#fff;letter-spacing:0.07em;
            min-height:2em;display:flex;align-items:center;gap:2px;
            opacity:0;transition:opacity 0.5s ease;
          ">
            <span id="loader-chars"></span>
            <span id="loader-cursor" style="
              display:inline-block;width:2px;height:1.2em;
              background:#7c3aed;margin-left:4px;
              animation:wld-blink 0.9s steps(2) infinite;
            "></span>
          </div>

          <div id="loader-sub" style="
            font-family:'JetBrains Mono',monospace;font-size:10px;
            text-transform:uppercase;letter-spacing:0.25em;
            color:rgba(255,255,255,0.28);
            opacity:0;transition:opacity 1s ease 2.2s;
          ">Powered by 7-chain neural graph · public-collector</div>

          <!-- Progress bar -->
          <div id="loader-prog-wrap" style="
            width:min(360px,78vw);height:1px;
            background:rgba(255,255,255,0.07);border-radius:99px;
            opacity:0;transition:opacity 0.8s ease 1s;position:relative;
          ">
            <div id="loader-prog-bar" style="
              height:100%;width:0%;border-radius:99px;
              background:linear-gradient(90deg,#7c3aed,#2563eb,#d4ff00);
              transition:width 0.12s linear;position:relative;
            ">
              <div style="
                position:absolute;right:-1px;top:-3px;
                width:7px;height:7px;border-radius:50%;
                background:#d4ff00;
                box-shadow:0 0 10px #d4ff00,0 0 20px rgba(212,255,0,0.5);
              "></div>
            </div>
          </div>

          <!-- Live stats (populated by Firebase) -->
          <div id="loader-stats" style="
            display:flex;gap:28px;opacity:0;transition:opacity 0.8s ease 3s;
          ">
            ${[
              {id:'ls-players',label:'Players',color:'#d4ff00'},
              {id:'ls-stars',  label:'Stars',  color:'#7c3aed'},
              {id:'ls-rooms',  label:'Rooms',  color:'#06b6d4'},
            ].map(s => `
              <div style="text-align:center;">
                <div id="${s.id}" style="font-family:'Outfit',sans-serif;font-size:1.4rem;font-weight:700;color:${s.color};">—</div>
                <div style="font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.15em;color:rgba(255,255,255,0.28);margin-top:3px;">${s.label}</div>
              </div>
            `).join('<div style="width:1px;background:rgba(255,255,255,0.06);"></div>')}
          </div>
        </div>
      </div>

      <!-- ── WORLD DASHBOARD (hidden until loader finishes) ── -->
      <div id="world-dashboard" style="display:none;position:absolute;inset:0;overflow-y:auto;"></div>

    </div>
  `);

  injectStyle(`
    @keyframes wld-blink { 0%,100%{opacity:1} 50%{opacity:0} }
    @keyframes wld-char-in { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
    @keyframes wld-loader-out { to{opacity:0;transform:scale(1.04)} }
    @keyframes wld-fade-up { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
    @keyframes wld-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes wld-pulse-ring { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.2);opacity:0} }
    @keyframes wld-dash-flow { to{stroke-dashoffset:-12} }
    .wld-reveal { opacity:0;transform:translateY(28px);transition:opacity 0.7s cubic-bezier(0.2,0,0,1),transform 0.7s cubic-bezier(0.2,0,0,1); }
    .wld-reveal.visible { opacity:1;transform:translateY(0); }
  `);

  // ── Boot sequence ────────────────────────────────────────────
  _runLoader();
}

/* ════════════════════════════════════════════════════════════
   LOADER LOGIC
   ════════════════════════════════════════════════════════════ */
const LOADER_MS  = 10000;
const LOADER_TEXT = 'Spinning up the Xiberlinc World';

async function _runLoader() {
  const spline   = document.getElementById('spline-el');
  const logo     = document.getElementById('loader-logo');
  const textWrap = document.getElementById('loader-text-wrap');
  const chars    = document.getElementById('loader-chars');
  const sub      = document.getElementById('loader-sub');
  const progWrap = document.getElementById('loader-prog-wrap');
  const progBar  = document.getElementById('loader-prog-bar');
  const stats    = document.getElementById('loader-stats');

  // Spline fade in
  if (spline) {
    spline.addEventListener('load', () => { spline.style.opacity = '0.8'; });
    setTimeout(() => { if (spline.style.opacity === '0') spline.style.opacity = '0.7'; }, 2000);
  }

  // Start fetching data in parallel while loader plays
  const dataPromise = _fetchWorldData();

  // Reveal UI elements
  await _delay(500);
  if (logo) { logo.style.opacity='1'; logo.style.transform='translateY(0)'; }
  await _delay(200);
  if (textWrap) textWrap.style.opacity = '1';
  if (sub) sub.style.opacity = '1';
  if (progWrap) progWrap.style.opacity = '1';
  if (stats) stats.style.opacity = '1';

  // Typewriter
  let ci = 0;
  const typeTimer = setInterval(() => {
    if (!chars || ci >= LOADER_TEXT.length) { clearInterval(typeTimer); return; }
    const sp = document.createElement('span');
    sp.textContent = LOADER_TEXT[ci++];
    sp.style.cssText = 'animation:wld-char-in 0.18s ease both;';
    chars.appendChild(sp);
  }, 58);

  // Progress bar + stat counters
  const t0 = Date.now();
  let liveStats = null;
  dataPromise.then(d => { liveStats = d?.stats; });

  const ticker = setInterval(() => {
    const pct = Math.min(1, (Date.now() - t0) / LOADER_MS);
    if (progBar) progBar.style.width = `${pct * 100}%`;

    if (liveStats) {
      const pl = document.getElementById('ls-players');
      const st = document.getElementById('ls-stars');
      const ro = document.getElementById('ls-rooms');
      if (pl) pl.textContent = Math.floor(pct * liveStats.playersOnline).toLocaleString();
      if (st) st.textContent = Math.floor(pct * liveStats.starsLive);
      if (ro) ro.textContent = Math.floor(pct * liveStats.activeRooms);
    }

    if (pct >= 1) clearInterval(ticker);
  }, 60);

  // Wait for loader duration AND data
  const [worldData] = await Promise.all([dataPromise, _delay(LOADER_MS)]);

  // Fade out loader → show dashboard
  clearInterval(typeTimer);
  clearInterval(ticker);
  const loader = document.getElementById('world-loader');
  if (loader) {
    loader.style.animation = 'wld-loader-out 0.9s cubic-bezier(0.4,0,1,1) forwards';
    await _delay(800);
    loader.style.display = 'none';
  }

  _renderDashboard(worldData);
}

/* ════════════════════════════════════════════════════════════
   DATA FETCH
   ════════════════════════════════════════════════════════════ */
async function _fetchWorldData() {
  try {
    const [players, stats] = await Promise.all([
      fetchTopPlayers(20),
      fetchLiveStats(),
    ]);
    const leaderboard = buildLeaderboard(players);
    return { players, stats, leaderboard };
  } catch (e) {
    console.error('[World] Data fetch failed:', e);
    return { players: [], stats: { playersOnline: 0, starsLive: 0, activeRooms: 6, totalPlayers: 0, countriesRepresented: 0 }, leaderboard: { region: [], country: [], global: [] } };
  }
}

/* ════════════════════════════════════════════════════════════
   DASHBOARD RENDER
   ════════════════════════════════════════════════════════════ */
function _renderDashboard({ players, stats, leaderboard }) {
  const dash = document.getElementById('world-dashboard');
  if (!dash) return;

  const stars   = players.filter(p => p.tier === 'star' || p.tier === 'rising').slice(0, 6);
  const hasData = players.length > 0;

  dash.style.display = 'block';
  dash.innerHTML = `
    <div style="min-height:100vh;background:#050507;font-family:'Space Grotesk',sans-serif;">

      <!-- NAV -->
      <nav id="wld-nav" style="
        position:fixed;top:0;left:0;right:0;z-index:200;
        padding:14px 28px;
        display:flex;align-items:center;justify-content:space-between;
        background:rgba(5,5,7,0.75);backdrop-filter:blur(20px);
        border-bottom:1px solid rgba(255,255,255,0.05);
        transition:all 0.3s;
      ">
        <img src="/xiberlinc_logo.png" alt="Xiberlinc" style="height:32px;mix-blend-mode:screen;filter:brightness(1.4) contrast(1.2);" />
        <div style="display:flex;gap:2px;">
          ${['Stars','Rankings','Neuro Rooms','Events'].map((l,i) => `
            <button onclick="document.getElementById('wld-sec-${i+1}').scrollIntoView({behavior:'smooth'})"
              style="font-family:'Space Grotesk',sans-serif;font-size:12.5px;font-weight:500;color:rgba(255,255,255,0.5);padding:8px 13px;border-radius:6px;border:none;background:none;cursor:pointer;transition:all 0.2s;letter-spacing:0.03em;"
              onmouseenter="this.style.color='#fff';this.style.background='rgba(255,255,255,0.06)'"
              onmouseleave="this.style.color='rgba(255,255,255,0.5)';this.style.background='none'"
            >${l}</button>
          `).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="display:flex;align-items:center;gap:7px;font-family:'JetBrains Mono',monospace;font-size:10px;color:#06b6d4;">
            <div style="width:6px;height:6px;border-radius:50%;background:#06b6d4;position:relative;">
              <div style="position:absolute;inset:-3px;border-radius:50%;border:1px solid #06b6d4;animation:wld-pulse-ring 1.5s ease-out infinite;"></div>
            </div>
            ${stats.playersOnline.toLocaleString()} online
          </div>
          <button onclick="document.getElementById('wld-sec-3').scrollIntoView({behavior:'smooth'})"
            style="padding:9px 18px;border-radius:7px;border:none;background:#d4ff00;color:#000;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;cursor:pointer;transition:all 0.2s;"
            onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 24px rgba(212,255,0,0.35)'"
            onmouseleave="this.style.transform='';this.style.boxShadow=''"
          >Join Room</button>
        </div>
      </nav>

      <!-- ══════════ HERO ══════════ -->
      <section style="
        min-height:100vh;display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        text-align:center;padding:120px 32px 80px;position:relative;overflow:hidden;
      ">
        <div style="position:absolute;inset:0;pointer-events:none;
          background:
            radial-gradient(ellipse 80% 60% at 20% 20%,rgba(124,58,237,0.14) 0%,transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%,rgba(37,99,235,0.1) 0%,transparent 60%),
            radial-gradient(ellipse 40% 30% at 60% 10%,rgba(212,255,0,0.05) 0%,transparent 50%);
        "></div>
        <div style="position:absolute;inset:0;pointer-events:none;
          background-image:linear-gradient(rgba(124,58,237,0.045) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.045) 1px,transparent 1px);
          background-size:80px 80px;
          mask-image:radial-gradient(ellipse 70% 70% at 50% 50%,black 10%,transparent 80%);
        "></div>

        <div style="position:relative;z-index:2;max-width:860px;">
          <div style="display:inline-flex;align-items:center;gap:7px;font-family:'JetBrains Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.18em;color:#a78bfa;border:1px solid rgba(124,58,237,0.3);border-radius:5px;padding:5px 13px;margin-bottom:28px;">
            ⬡ The Xiberlinc World · Season 1
          </div>

          <h1 style="
            font-family:'Outfit',sans-serif;font-weight:900;
            font-size:clamp(2.8rem,8.5vw,6.5rem);line-height:1;margin-bottom:22px;
            background:linear-gradient(135deg,#fff 0%,rgba(255,255,255,0.65) 55%,#a78bfa 100%);
            -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
          ">Where Elite<br/>Minds Meet.</h1>

          <p style="font-size:clamp(0.95rem,1.8vw,1.2rem);color:rgba(255,255,255,0.45);max-width:580px;margin:0 auto 44px;line-height:1.75;">
            Built on the 7-chain principle — you're never more than 7 connections from any player on Earth.
            Compete, connect, and rise through the ranks.
          </p>

          <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-bottom:64px;">
            <button onclick="document.getElementById('wld-sec-1').scrollIntoView({behavior:'smooth'})"
              style="padding:14px 28px;border-radius:8px;border:none;background:#7c3aed;color:#fff;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.06em;cursor:pointer;transition:all 0.25s;"
              onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='0 10px 32px rgba(124,58,237,0.45)'"
              onmouseleave="this.style.transform='';this.style.boxShadow=''"
            >⭐ Explore Stars</button>
            <button onclick="document.getElementById('wld-sec-2').scrollIntoView({behavior:'smooth'})"
              style="padding:14px 28px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:transparent;color:rgba(255,255,255,0.6);font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.06em;cursor:pointer;transition:all 0.25s;"
              onmouseenter="this.style.background='rgba(255,255,255,0.06)';this.style.color='#fff'"
              onmouseleave="this.style.background='transparent';this.style.color='rgba(255,255,255,0.6)'"
            >▲ Rankings</button>
            <button onclick="document.getElementById('wld-sec-3').scrollIntoView({behavior:'smooth'})"
              style="padding:14px 28px;border-radius:8px;border:none;background:#06b6d4;color:#000;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.06em;cursor:pointer;transition:all 0.25s;"
              onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='0 10px 32px rgba(6,182,212,0.4)'"
              onmouseleave="this.style.transform='';this.style.boxShadow=''"
            >🧠 Neuro Rooms</button>
          </div>

          <!-- Live stats strip -->
          <div style="display:flex;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;background:rgba(15,15,19,0.65);backdrop-filter:blur(20px);">
            ${[
              {label:'Players',value:stats.totalPlayers.toLocaleString() || '—',color:'#d4ff00',live:false},
              {label:'Online Now',value:stats.playersOnline.toLocaleString(),color:'#06b6d4',live:true},
              {label:'Countries',value:stats.countriesRepresented || '—',color:'#7c3aed',live:false},
              {label:'Active Stars',value:stats.starsLive,color:'#fbbf24',live:true},
              {label:'Neuro Rooms',value:stats.activeRooms,color:'#06b6d4',live:true},
            ].map((s,i,arr) => `
              <div style="flex:1;padding:18px 12px;text-align:center;${i<arr.length-1?'border-right:1px solid rgba(255,255,255,0.05)':''};">
                <div style="display:flex;align-items:center;justify-content:center;gap:5px;margin-bottom:3px;">
                  ${s.live ? `<div style="width:5px;height:5px;border-radius:50%;background:${s.color};position:relative;"><div style="position:absolute;inset:-3px;border-radius:50%;border:1px solid ${s.color};animation:wld-pulse-ring 1.5s ease-out infinite;"></div></div>` : ''}
                  <span style="font-family:'Outfit',sans-serif;font-size:1.4rem;font-weight:700;color:${s.color};">${s.value}</span>
                </div>
                <div style="font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.13em;color:rgba(255,255,255,0.28);">${s.label}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="position:absolute;bottom:28px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:7px;opacity:0.35;animation:wld-float 2.2s ease-in-out infinite;">
          <span style="font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.6);">Scroll</span>
          <div style="width:1px;height:36px;background:linear-gradient(to bottom,rgba(255,255,255,0.4),transparent);"></div>
        </div>
      </section>

      <!-- ══════════ STARS ══════════ -->
      <section id="wld-sec-1" style="padding:88px 32px;max-width:1240px;margin:0 auto;">
        <div class="wld-reveal" style="margin-bottom:44px;">
          <div style="font-family:'JetBrains Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#fbbf24;margin-bottom:10px;">★ Star System</div>
          <h2 style="font-family:'Outfit',sans-serif;font-weight:800;color:#fff;margin-bottom:10px;">The Constellations</h2>
          <p style="max-width:520px;color:rgba(255,255,255,0.45);">Top performers from the assessment earn Star status. Real players, real scores — ranked live from the Firestore database.</p>
          ${!hasData ? '<div style="margin-top:16px;font-family:JetBrains Mono,monospace;font-size:11px;color:#f97316;">⚠ No candidate data yet — be the first to complete the assessment!</div>' : ''}
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px;" id="wld-stars-grid">
          ${stars.length ? stars.map(p => _starCard(p)).join('') : _emptyState('No stars yet — complete the assessment to claim your rank.')}
        </div>
      </section>

      <!-- ══════════ LEADERBOARD ══════════ -->
      <section id="wld-sec-2" style="padding:88px 32px;background:rgba(212,255,0,0.015);">
        <div style="max-width:1240px;margin:0 auto;">
          <div class="wld-reveal" style="margin-bottom:44px;">
            <div style="font-family:'JetBrains Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#d4ff00;margin-bottom:10px;">▲ Live Rankings</div>
            <h2 style="font-family:'Outfit',sans-serif;font-weight:800;color:#fff;margin-bottom:10px;">Leaderboard</h2>
            <p style="max-width:520px;color:rgba(255,255,255,0.45);">Real scores from the public-collector database, ordered by composite cognitive score.</p>
          </div>
          ${_leaderboardHtml(leaderboard.global)}
        </div>
      </section>

      <!-- ══════════ NEURO ROOMS ══════════ -->
      <section id="wld-sec-3" style="padding:88px 32px;max-width:1240px;margin:0 auto;">
        <div class="wld-reveal" style="margin-bottom:44px;">
          <div style="font-family:'JetBrains Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#06b6d4;margin-bottom:10px;">🧠 Community</div>
          <h2 style="font-family:'Outfit',sans-serif;font-weight:800;color:#fff;margin-bottom:10px;">Neuro Rooms</h2>
          <p style="max-width:520px;color:rgba(255,255,255,0.45);">Real-time social spaces where players connect, decompress, and build mental resilience together.</p>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:16px;">
          ${NEURO_ROOMS.map(r => _roomCard(r)).join('')}
        </div>
      </section>

      <!-- ══════════ EVENTS ══════════ -->
      <section id="wld-sec-4" style="padding:88px 32px;background:rgba(124,58,237,0.03);">
        <div style="max-width:1240px;margin:0 auto;">
          <div class="wld-reveal" style="margin-bottom:44px;">
            <div style="font-family:'JetBrains Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#f97316;margin-bottom:10px;">🎮 Compete</div>
            <h2 style="font-family:'Outfit',sans-serif;font-weight:800;color:#fff;margin-bottom:10px;">Tournaments & Events</h2>
            <p style="max-width:520px;color:rgba(255,255,255,0.45);">From local meetups to global championships — the Xiberlinc World never stops competing.</p>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:18px;">
            ${EVENTS.map(e => _eventCard(e)).join('')}
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer style="padding:40px 32px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px;">
        <img src="/xiberlinc_logo.png" alt="Xiberlinc" style="height:28px;mix-blend-mode:screen;filter:brightness(1.3) contrast(1.2);opacity:0.5;" />
        <div style="font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(255,255,255,0.2);">
          Xiberlinc World · Season 1 · public-collector · 7-chain principle
        </div>
      </footer>

    </div>
  `;

  // Nav scroll shrink
  const nav = document.getElementById('wld-nav');
  dash.addEventListener('scroll', () => {
    if (nav) nav.style.borderBottomColor = dash.scrollTop > 40 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)';
  });

  // Scroll reveal
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.08 });
  dash.querySelectorAll('.wld-reveal').forEach(el => obs.observe(el));

  // Hover effects on star cards
  dash.querySelectorAll('.wld-star-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-6px)';
      card.style.borderColor = 'rgba(255,255,255,0.14)';
      card.style.boxShadow = '0 20px 56px rgba(0,0,0,0.55)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.borderColor = '';
      card.style.boxShadow = '';
    });
  });

  // Follow button toggles
  dash.querySelectorAll('.wld-follow-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const on = btn.dataset.following === 'true';
      btn.dataset.following = String(!on);
      btn.textContent = on ? 'Follow' : '✓ Following';
      btn.style.background = on ? '' : 'rgba(212,255,0,0.14)';
      btn.style.color = on ? '' : '#d4ff00';
      btn.style.borderColor = on ? '' : 'rgba(212,255,0,0.3)';
    });
  });

  // Room cards click
  dash.querySelectorAll('.wld-room-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-5px)';
      card.style.boxShadow = `0 16px 48px rgba(0,0,0,0.45)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
    });
  });

  // Event card hover
  dash.querySelectorAll('.wld-event-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-6px)';
      card.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
    });
  });
}

/* ════════════════════════════════════════════════════════════
   COMPONENT RENDERERS
   ════════════════════════════════════════════════════════════ */

function _starCard(p) {
  const wmi = p.wmi || 0;
  const followers = p.followers >= 1000 ? (p.followers/1000).toFixed(1)+'K' : String(p.followers || 0);
  return `
    <div class="wld-star-card wld-reveal" style="
      background:#0f0f13;border:1px solid rgba(255,255,255,0.08);border-radius:16px;
      overflow:hidden;cursor:pointer;transition:all 0.3s cubic-bezier(0.2,0,0,1);position:relative;
    ">
      <div style="height:72px;background:linear-gradient(135deg,${p.avatarColor}20 0%,${p.avatarColor}07 100%);border-bottom:1px solid ${p.avatarColor}20;position:relative;">
        <div style="position:absolute;top:10px;right:10px;">
          <div style="font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:${p.tier==='star'?'#fbbf24':'#a78bfa'};background:${p.tier==='star'?'rgba(251,191,36,0.1)':'rgba(124,58,237,0.1)'};border:1px solid ${p.tier==='star'?'rgba(251,191,36,0.25)':'rgba(124,58,237,0.25)'};border-radius:4px;padding:2px 7px;">${p.tier==='star'?'⭐ ':' ↑ '}${p.rank}</div>
        </div>
        <div style="position:absolute;bottom:-18px;right:14px;font-family:'JetBrains Mono',monospace;font-size:9px;color:${p.avatarColor};background:#0f0f13;border:1px solid ${p.avatarColor}44;border-radius:5px;padding:2px 7px;">${formatChainDistance(p.chainDistance)}</div>
      </div>
      <div style="padding:28px 18px 18px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
          <div style="width:44px;height:44px;border-radius:50%;background:${p.avatarColor}20;border:2px solid ${p.avatarColor}55;display:flex;align-items:center;justify-content:center;font-family:'Outfit',sans-serif;font-weight:700;font-size:1.1rem;color:${p.avatarColor};flex-shrink:0;position:relative;">
            ${p.avatar}
            ${p.tier==='star'?`<div style="position:absolute;inset:-3px;border-radius:50%;border:1px solid ${p.avatarColor}44;animation:wld-pulse-ring 2s ease-out infinite;"></div>`:''}
          </div>
          <div>
            <div style="font-family:'Outfit',sans-serif;font-weight:700;font-size:0.95rem;color:#fff;margin-bottom:1px;">${p.name}</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:${p.avatarColor};">${p.handle}</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:16px;">
          ${[{label:'WMI',val:wmi,col:'#d4ff00'},{label:'Rxn',val:p.reactionMs+'ms',col:'#7c3aed'},{label:'Trust',val:Math.round(p.trustScore*100)+'%',col:'#06b6d4'}].map(s=>`
            <div style="text-align:center;background:rgba(255,255,255,0.025);border-radius:8px;padding:9px 4px;border:1px solid rgba(255,255,255,0.04);">
              <div style="font-family:'Outfit',sans-serif;font-weight:700;font-size:0.95rem;color:${s.col};">${s.val}</div>
              <div style="font-family:'JetBrains Mono',monospace;font-size:8px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.28);margin-top:2px;">${s.label}</div>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <div>
            <div style="font-family:'Outfit',sans-serif;font-weight:700;font-size:1rem;color:#fff;">${followers}</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:8px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.28);">Followers</div>
          </div>
          <button class="wld-follow-btn" style="padding:7px 18px;font-size:11px;background:${p.avatarColor}1a;color:${p.avatarColor};border:1px solid ${p.avatarColor}44;border-radius:7px;cursor:pointer;font-family:'Space Grotesk',sans-serif;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;transition:all 0.2s;">Follow</button>
        </div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;padding-top:14px;border-top:1px solid rgba(255,255,255,0.04);">
          ${p.tags.map(t=>`<span style="font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(255,255,255,0.3);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:4px;padding:2px 6px;">#${t}</span>`).join('')}
        </div>
      </div>
    </div>
  `;
}

function _leaderboardHtml(rows) {
  if (!rows?.length) return _emptyState('No ranked players yet.');
  const max = rows[0]?.score || 1;
  return `
    <div class="wld-reveal" style="display:flex;flex-direction:column;gap:8px;">
      ${rows.map((entry, i) => {
        const rankCol = i===0?'#fbbf24':i===1?'#e2e8f0':i===2?'#cd7c30':'rgba(255,255,255,0.4)';
        const medal   = i===0?'🥇':i===1?'🥈':i===2?'🥉':null;
        const pct     = (entry.score / max * 100).toFixed(1);
        const p       = entry.player;
        return `
          <div style="
            display:grid;grid-template-columns:44px 1fr auto;align-items:center;gap:14px;
            padding:14px 18px;
            background:#0f0f13;border:1px solid rgba(255,255,255,0.05);border-radius:12px;
            transition:all 0.2s;animation:wld-fade-up 0.5s cubic-bezier(0.2,0,0,1) ${i*55}ms both;
          " class="wld-lb-row"
            onmouseenter="this.style.transform='translateX(4px)';this.style.borderColor='rgba(255,255,255,0.12)'"
            onmouseleave="this.style.transform='';this.style.borderColor='rgba(255,255,255,0.05)'"
          >
            <div style="text-align:center;font-family:'Outfit',sans-serif;font-weight:900;font-size:${medal?'1.4':'1'}rem;color:${rankCol};">
              ${medal || `#${entry.rank}`}
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:7px;">
                <div style="width:32px;height:32px;border-radius:50%;background:${p.avatarColor||'#7c3aed'}22;border:1.5px solid ${p.avatarColor||'#7c3aed'}44;display:flex;align-items:center;justify-content:center;font-family:'Outfit',sans-serif;font-weight:700;font-size:0.85rem;color:${p.avatarColor||'#7c3aed'};flex-shrink:0;">${p.avatar||'?'}</div>
                <div>
                  <div style="font-family:'Outfit',sans-serif;font-weight:700;font-size:0.9rem;color:#fff;">${p.name}</div>
                  <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(255,255,255,0.3);">${p.handle||''}</div>
                </div>
              </div>
              <div style="height:3px;background:rgba(255,255,255,0.05);border-radius:99px;overflow:hidden;">
                <div style="height:100%;width:${pct}%;background:${i<3?rankCol:'rgba(255,255,255,0.18)'};border-radius:99px;transition:width 1.2s cubic-bezier(0.2,0,0,1);"></div>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-family:'Outfit',sans-serif;font-weight:800;font-size:1.35rem;color:${i<3?rankCol:'#fff'};">${entry.score}</div>
              <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(255,255,255,0.28);text-transform:uppercase;">WMI</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function _roomCard(room) {
  return `
    <div class="wld-room-card wld-reveal" style="
      background:#0f0f13;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:22px;
      cursor:pointer;transition:all 0.3s cubic-bezier(0.2,0,0,1);position:relative;overflow:hidden;
    ">
      <div style="position:absolute;top:0;left:0;right:0;height:2px;background:${room.colorHex};opacity:0.7;"></div>
      <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
        <div style="width:48px;height:48px;border-radius:11px;background:${room.colorHex}14;border:1px solid ${room.colorHex}28;display:flex;align-items:center;justify-content:center;font-size:1.7rem;line-height:1;flex-shrink:0;">${room.vibe}</div>
        <div>
          <div style="font-family:'Outfit',sans-serif;font-weight:700;font-size:0.95rem;color:#fff;margin-bottom:4px;">${room.name}</div>
          <div style="display:flex;align-items:center;gap:5px;">
            <div style="width:5px;height:5px;border-radius:50%;background:${room.colorHex};position:relative;">
              <div style="position:absolute;inset:-3px;border-radius:50%;border:1px solid ${room.colorHex};animation:wld-pulse-ring 1.5s ease-out infinite;"></div>
            </div>
            <span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:${room.colorHex};">${room.online.toLocaleString()} online</span>
          </div>
        </div>
      </div>
      <p style="font-size:12.5px;color:rgba(255,255,255,0.4);margin-bottom:14px;line-height:1.55;">${room.description}</p>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:14px;">
        ${room.tags.map(t=>`<span style="font-family:'JetBrains Mono',monospace;font-size:9px;color:${room.colorHex};background:${room.colorHex}12;border:1px solid ${room.colorHex}25;border-radius:4px;padding:2px 6px;">#${t}</span>`).join('')}
      </div>
      <button style="width:100%;padding:11px;border-radius:8px;border:1px solid ${room.locked?'rgba(251,191,36,0.28)':`${room.colorHex}40`};background:${room.locked?'rgba(251,191,36,0.07)':`${room.colorHex}10`};color:${room.locked?'#fbbf24':room.colorHex};font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.07em;cursor:pointer;transition:all 0.2s;">
        ${room.locked ? '🔒 '+room.lockRank+' required' : '→ Enter Room'}
      </button>
    </div>
  `;
}

function _eventCard(event) {
  const fill = Math.round(event.participants / event.maxParticipants * 100);
  const fillCol = fill >= 95 ? '#f87171' : fill >= 70 ? '#fbbf24' : '#d4ff00';
  const now = new Date(); const diff = event.date - now;
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor((diff % 86400000) / 3600000);
  const countdown = diff <= 0 ? 'LIVE NOW' : days > 0 ? `${days}d ${hrs}h` : `${hrs}h`;

  return `
    <div class="wld-event-card wld-reveal" style="
      background:#0f0f13;border:1px solid rgba(255,255,255,0.07);border-radius:18px;
      overflow:hidden;cursor:pointer;transition:all 0.3s cubic-bezier(0.2,0,0,1);
    ">
      <div style="height:3px;background:linear-gradient(90deg,${event.colorHex},${event.colorHex}55);"></div>
      <div style="padding:22px 22px 18px;background:linear-gradient(135deg,${event.colorHex}0d 0%,transparent 60%);border-bottom:1px solid rgba(255,255,255,0.04);">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;">
          <div style="font-size:1.8rem;line-height:1;">${event.icon}</div>
          <div style="text-align:right;">
            <div style="font-family:'JetBrains Mono',monospace;font-size:8px;text-transform:uppercase;letter-spacing:0.15em;color:rgba(255,255,255,0.28);margin-bottom:2px;">Starts in</div>
            <div style="font-family:'Outfit',sans-serif;font-weight:800;font-size:1.2rem;color:${event.colorHex};">${countdown}</div>
          </div>
        </div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.12em;color:${event.colorHex};background:${event.colorHex}12;border:1px solid ${event.colorHex}28;border-radius:4px;padding:2px 7px;display:inline-block;margin-bottom:10px;">${event.type}</div>
        <h3 style="font-family:'Outfit',sans-serif;font-weight:800;font-size:1.2rem;color:#fff;margin-bottom:4px;">${event.title}</h3>
        <div style="font-size:13px;color:rgba(255,255,255,0.45);margin-bottom:3px;">${event.subtitle}</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.28);">📍 ${event.region}</div>
      </div>
      <div style="padding:16px 22px 20px;">
        <div style="display:flex;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;color:rgba(255,255,255,0.28);margin-bottom:5px;">
          <span>Capacity</span><span style="color:${fillCol};">${fill}% full</span>
        </div>
        <div style="height:4px;background:rgba(255,255,255,0.05);border-radius:99px;overflow:hidden;margin-bottom:16px;">
          <div style="height:100%;width:${fill}%;background:${fillCol};border-radius:99px;transition:width 1.2s cubic-bezier(0.2,0,0,1);"></div>
        </div>
        ${event.prizePool ? `<div style="font-family:'Outfit',sans-serif;font-weight:700;color:#fbbf24;font-size:1rem;margin-bottom:14px;">${event.prizePool} <span style="font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(255,255,255,0.28);font-weight:400;">prize pool</span></div>` : ''}
        <button style="width:100%;padding:13px;border-radius:9px;border:1px solid ${event.full?'rgba(255,255,255,0.07)':`${event.colorHex}3a`};background:${event.full?'transparent':`${event.colorHex}12`};color:${event.full?'rgba(255,255,255,0.3)':event.colorHex};font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.07em;cursor:${event.full?'not-allowed':'pointer'};transition:all 0.2s;">
          ${event.full ? '⛔ Fully Registered' : '→ Register Now'}
        </button>
      </div>
    </div>
  `;
}

function _emptyState(msg) {
  return `
    <div style="grid-column:1/-1;text-align:center;padding:60px 32px;background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.08);border-radius:16px;">
      <div style="font-size:2.5rem;margin-bottom:14px;">🌐</div>
      <div style="font-family:'Outfit',sans-serif;font-weight:600;font-size:1.1rem;color:rgba(255,255,255,0.4);">${msg}</div>
    </div>
  `;
}

function _delay(ms) { return new Promise(r => setTimeout(r, ms)); }
