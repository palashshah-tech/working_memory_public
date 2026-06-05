/* ============================================================
   ANT Engine — Attention Network Test
   ============================================================ */

import { now } from '../utils/timing.js';
import { t } from '../utils/i18n.js';

const ANT_CONFIG = {
  cueTypes: ['none', 'center', 'double', 'spatial'],
  flankerTypes: ['congruent', 'incongruent'],
  targetPositions: ['above', 'below'],
  fixationDuration: { min: 400, max: 1200 },
  cueDuration: 100,
  postCueFixation: 200,   
  maxResponseTime: 1200,  
  postTrialDuration: 400,
  countdownDuration: 600,
  trialsPerCondition: 4,   
};

const ARROWS = { left: '←', right: '→' };

function getArrowHTML(direction, isTarget = false) {
  const flipStyle = direction === 'left' ? 'transform: scaleX(-1);' : '';
  const arrowColor = isTarget ? 'var(--accent-volt)' : 'rgba(255, 255, 255, 0.4)';
  const shadowFilter = isTarget ? 'filter: drop-shadow(0 0 1.5vmin rgba(212,255,0,0.5));' : '';
  
  return `
    <svg viewBox="0 0 100 30" class="ant-arrow ${isTarget ? 'target' : ''}" style="width: 10vmin; height: 3vmin; fill: ${arrowColor}; color: ${arrowColor}; ${flipStyle} ${shadowFilter} display: inline-block;">
      <!-- Three stacked chevrons for fletching/feathers -->
      <path d="M 24 5 L 16 15 L 24 25 L 20 25 L 12 15 L 20 5 Z" />
      <path d="M 18 5 L 10 15 L 18 25 L 14 25 L 6 15 L 14 5 Z" />
      <path d="M 12 5 L 4 15 L 12 25 L 8 25 L 0 15 L 8 5 Z" />
      <!-- Rounded nock at leftmost end -->
      <circle cx="4" cy="15" r="1.5" />
      <!-- Arrow shaft -->
      <line x1="4" y1="15" x2="85" y2="15" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      <!-- Arrowhead with slight indentation at the back -->
      <path d="M 82 7 L 98 15 L 82 23 L 86 15 Z" />
    </svg>
  `;
}

export class ANTEngine {
  constructor(isPractice = false) {
    this.isPractice = isPractice;
    this.trialData = [];
    this.currentTrialIndex = 0;
    this.isRunning = false;
    this.skippedAt = null;
    this._resolveResponse = null;
    this._timerId = null;
    this._timerResolve = null;
    this.responseStartTime = 0;
    this._finished = false;  // guard: onTaskComplete fires exactly once
    this.onStateChange = null;
    this.onTrialComplete = null;
    this.onTaskComplete = null;
    this.onCountdown = null;
  }

  async _wait(ms) {
    if (!this.isRunning) return;
    return new Promise(resolve => {
      this._timerResolve = resolve;
      this._timerId = setTimeout(() => {
        this._timerResolve = null;
        resolve();
      }, ms);
    });
  }

  skip() {
    this.skippedAt = Date.now();
    this.isRunning = false;
    if (this._resolveResponse) {
      this._resolveResponse('none');
      this._resolveResponse = null;
    }
    if (this._timerResolve) {
      clearTimeout(this._timerId);
      this._timerResolve();
      this._timerResolve = null;
    }
  }

  async run(container) {
    this.container = container;
    this.isRunning = true;
    const trials = this.generateTrials();

    await this.showCountdown();
    if (!this.isRunning) { this.finish(); return; }

    for (this.currentTrialIndex = 0; this.currentTrialIndex < trials.length; this.currentTrialIndex++) {
      if (!this.isRunning) break;
      await this.runTrial(trials[this.currentTrialIndex], trials.length);
    }
    this.finish();
  }

  finish() {
    if (this._finished) return;  // prevent double-fire
    this._finished = true;
    this.isRunning = false;
    if (this.onTaskComplete) this.onTaskComplete(this.trialData, this.skippedAt);
  }

  generateTrials() {
    if (this.isPractice) {
      return [
        {
          cueType: Math.random() < 0.5 ? 'center' : 'spatial',
          flankerType: 'congruent',
          targetDirection: Math.random() < 0.5 ? 'left' : 'right',
          targetPosition: Math.random() < 0.5 ? 'above' : 'below',
        },
        {
          cueType: Math.random() < 0.5 ? 'none' : 'double',
          flankerType: 'incongruent',
          targetDirection: Math.random() < 0.5 ? 'left' : 'right',
          targetPosition: Math.random() < 0.5 ? 'above' : 'below',
        }
      ].sort(() => Math.random() - 0.5);
    }

    const list = [];
    for (const cueType of ANT_CONFIG.cueTypes) {
      for (const flankerType of ANT_CONFIG.flankerTypes) {
        for (let i = 0; i < ANT_CONFIG.trialsPerCondition; i++) {
          list.push({
            cueType, flankerType,
            targetDirection: Math.random() < 0.5 ? 'left' : 'right',
            targetPosition: Math.random() < 0.5 ? 'above' : 'below',
          });
        }
      }
    }
    return list.sort(() => Math.random() - 0.5);
  }

  async showCountdown() {
    const w = [t('eng_ready'), t('eng_set'), t('eng_go')], c = ['ready','set','go'];
    for(let i=0; i<3; i++) {
      if (!this.isRunning) return;
      if (this.onCountdown) this.onCountdown(w[i], c[i]);
      await this._wait(ANT_CONFIG.countdownDuration);
    }
  }

  async runTrial(cond, total) {
    this.renderFixation();
    if (this.onStateChange) this.onStateChange('fixation', { trialIndex: this.currentTrialIndex, totalTrials: total });
    await this._wait(Math.random()*800 + ANT_CONFIG.fixationDuration.min);
    if (!this.isRunning) return;

    this.renderCue(cond.cueType, cond.targetPosition);
    await this._wait(ANT_CONFIG.cueDuration);
    if (!this.isRunning) return;

    this.renderFixation();
    await this._wait(ANT_CONFIG.postCueFixation);
    if (!this.isRunning) return;

    this.renderTarget(cond.targetDirection, cond.flankerType, cond.targetPosition);
    this.responseStartTime = now();
    if (this.onStateChange) this.onStateChange('target', { trialIndex: this.currentTrialIndex, totalTrials: total });

    const answer = await this.waitForResponse(ANT_CONFIG.maxResponseTime);
    if (!this.isRunning) return;

    const record = {
      taskType: 'ant', trialNumber: this.currentTrialIndex+1,
      cueType: cond.cueType, flankerType: cond.flankerType,
      isCorrect: answer === cond.targetDirection,
      reactionTimeMs: now() - this.responseStartTime,
      timestamp: Date.now()
    };
    this.trialData.push(record);
    if (this.onTrialComplete) this.onTrialComplete(record);

    this.renderFixation();
    await this._wait(ANT_CONFIG.postTrialDuration);
  }

  waitForResponse(ms) {
    return new Promise(resolve => {
      this._resolveResponse = resolve;
      this._responseTimerId = setTimeout(() => {
        if (this._resolveResponse === resolve) {  // only fire if not already answered
          this._resolveResponse = null;
          this._responseTimerId = null;
          resolve('none');
        }
      }, ms);
    });
  }

  handleResponse(dir) {
    if (this._resolveResponse) {
      clearTimeout(this._responseTimerId);  // cancel orphan timer immediately
      this._responseTimerId = null;
      const cb = this._resolveResponse;
      this._resolveResponse = null;
      cb(dir);
    }
  }

  renderFixation() { this.container.innerHTML = `<div class="task-fixation">+</div>`; }

  renderCue(type, pos) {
    const o = '15vmin';
    let h = `<div class="task-fixation">+</div>`;
    if (type === 'center') h += `<div class="ant-cue" style="position:absolute;top:50%;left:50%;width:2vmin;height:2vmin;background:var(--accent-volt);transform:translate(-50%,-50%)"></div>`;
    else if (type === 'double') {
      h += `<div class="ant-cue" style="position:absolute;top:calc(50% - ${o});left:50%;width:2vmin;height:2vmin;background:var(--accent-volt);transform:translate(-50%,-50%)"></div>`;
      h += `<div class="ant-cue" style="position:absolute;top:calc(50% + ${o});left:50%;width:2vmin;height:2vmin;background:var(--accent-volt);transform:translate(-50%,-50%)"></div>`;
    } else if (type === 'spatial') {
      const y = pos === 'above' ? `calc(50% - ${o})` : `calc(50% + ${o})`;
      h += `<div class="ant-cue" style="position:absolute;top:${y};left:50%;width:2vmin;height:2vmin;background:var(--accent-volt);transform:translate(-50%,-50%)"></div>`;
    }
    this.container.innerHTML = h;
  }

  renderTarget(dir, flank, pos) {
    const t_dir = dir; // 'left' or 'right'
    const f_dir = flank === 'congruent' ? dir : (dir === 'left' ? 'right' : 'left');
    const y = pos === 'above' ? `calc(50% - 15vmin)` : `calc(50% + 15vmin)`;
    
    const flankArrow = getArrowHTML(f_dir, false);
    const targetArrow = getArrowHTML(t_dir, true);
    
    this.container.innerHTML = `<div class="task-fixation">+</div>
      <div style="position:absolute;top:${y};left:50%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:2.5vmin;">
        ${flankArrow}${flankArrow}${targetArrow}${flankArrow}${flankArrow}
      </div>`;
  }
}
