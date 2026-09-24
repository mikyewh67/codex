import { SECTIONS, QUICK_RULES, TEST_DATE } from './course-data.js';
import {
  generateForSection, generateByGenerator, gradeQuestion, expectedAnswerText,
  buildPracticeTest, engineInternals
} from './question-engine.js';

const STORE_KEY = 'accounting1-test1-trainer-v1';
const app = document.querySelector('#app');
const testChip = document.querySelector('#testChip');
const navButtons = [...document.querySelectorAll('.nav-btn')];

function defaultState() {
  return {
    mastery: Object.fromEntries(SECTIONS.map(s => [s.id, 0])),
    attempts: Object.fromEntries(SECTIONS.map(s => [s.id, 0])),
    correct: Object.fromEntries(SECTIONS.map(s => [s.id, 0])),
    totalQuestions: 0,
    streak: 0,
    bestStreak: 0,
    mistakes: [],
    lastSection: 'transaction-analysis',
    practiceTests: []
  };
}

let state = loadState();
let activeView = 'dashboard';
let practice = {
  section: state.lastSection || 'transaction-analysis',
  question: null,
  submitted: false,
  grade: null,
  response: null,
  hintIndex: -1,
  reinforcementQueue: [],
  isReinforcement: false,
  originGenerator: null
};
let testSession = null;

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY));
    return {...defaultState(), ...(parsed || {}), mastery:{...defaultState().mastery,...(parsed?.mastery||{})}, attempts:{...defaultState().attempts,...(parsed?.attempts||{})}, correct:{...defaultState().correct,...(parsed?.correct||{})}};
  } catch { return defaultState(); }
}
function saveState() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function escapeHtml(v) { return String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function fmt(n) { return Number(n).toLocaleString('en-US'); }
function clamp(n,a,b){ return Math.max(a,Math.min(b,n)); }

function daysUntilTest() {
  const now = new Date();
  const [y,m,d] = TEST_DATE.split('-').map(Number);
  const target = new Date(y,m-1,d);
  const today = new Date(now.getFullYear(),now.getMonth(),now.getDate());
  return Math.ceil((target - today) / 86400000);
}
function updateTestChip() {
  const d = daysUntilTest();
  if (d > 1) testChip.textContent = `${d} days · Sep 29`;
  else if (d === 1) testChip.textContent = 'Tomorrow · Sep 29';
  else if (d === 0) testChip.textContent = 'Test day · Sep 29';
  else testChip.textContent = 'Test #1 · Sep 29';
}
updateTestChip();

function setView(view) {
  activeView = view;
  navButtons.forEach(b => b.classList.toggle('active', b.dataset.view === view));
  render();
  app.focus({preventScroll:true});
  window.scrollTo({top:0,behavior:'smooth'});
}
navButtons.forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));

document.querySelector('#resetProgress').addEventListener('click', () => {
  if (!confirm('Reset all mastery, mistakes, streaks, and practice-test history?')) return;
  state = defaultState();
  saveState();
  practice = {...practice, section:'transaction-analysis', question:null, reinforcementQueue:[], submitted:false};
  setView('dashboard');
});

function overallMastery() {
  const vals = Object.values(state.mastery);
  return Math.round(vals.reduce((a,b)=>a+b,0) / vals.length);
}
function weakestSection() {
  const weighted = ['transaction-analysis','journal','ledger','equations','financial-statements','debits-credits','trial-balance','foundations'];
  return weighted.sort((a,b) => (state.mastery[a]||0) - (state.mastery[b]||0))[0];
}
function sectionById(id) { return SECTIONS.find(s=>s.id===id); }

function render() {
  if (testSession && activeView !== 'test') stopTestTimer(false);
  if (activeView === 'dashboard') renderDashboard();
  if (activeView === 'learn') renderLearn();
  if (activeView === 'practice') renderPractice();
  if (activeView === 'test') renderTest();
  if (activeView === 'mistakes') renderMistakes();
  if (activeView === 'cheat') renderCheat();
}

function renderDashboard() {
  const weak = sectionById(weakestSection());
  const latest = state.practiceTests.at(-1);
  app.innerHTML = `
    <section class="card hero">
      <div class="badge warn">Test #1 · 15 questions · 31 points · 120 minutes</div>
      <h2 class="hero-title">Master the process, not the answers.</h2>
      <p class="hero-sub">This trainer mirrors the professor’s Chapter 1–2 emphasis: analyze the financial-position effect first, identify the accounts second, then decide debit and credit. A wrong answer automatically creates two targeted reinforcement questions before you return to new material.</p>
      <div class="hero-actions">
        <button class="btn btn-primary" id="continueAdaptive">Practice weakest area</button>
        <button class="btn btn-dark" id="startTestFromDash">Start 31-point practice test</button>
      </div>
    </section>

    <section class="grid grid-3" style="margin-top:16px">
      <div class="card kpi"><span class="value">${overallMastery()}%</span><span class="label">Overall mastery</span></div>
      <div class="card kpi"><span class="value">${state.totalQuestions}</span><span class="label">Practice questions answered</span></div>
      <div class="card kpi"><span class="value">${state.bestStreak}</span><span class="label">Best correct streak</span></div>
    </section>

    <section class="grid grid-2" style="margin-top:16px">
      <div class="card">
        <div class="section-heading"><h2>Mastery by section</h2><span class="badge">Adaptive</span></div>
        ${SECTIONS.map(s=>`
          <div class="progress-row">
            <div class="progress-name">${escapeHtml(s.short)}</div>
            <div class="progress-track"><div class="progress-fill" style="width:${state.mastery[s.id]||0}%"></div></div>
            <div class="progress-num">${state.mastery[s.id]||0}%</div>
          </div>`).join('')}
      </div>
      <div class="grid">
        <div class="card">
          <h2>Recommended next</h2>
          <div class="badge bad">Weakest area</div>
          <h3 style="margin-bottom:6px">${escapeHtml(weak.title)}</h3>
          <p class="muted">${escapeHtml(weak.emphasis)}</p>
          <button class="btn btn-primary" data-practice-section="${weak.id}">Practice ${escapeHtml(weak.short)}</button>
        </div>
        <div class="card">
          <h2>Test structure</h2>
          <p class="muted small">Built to match the practice test’s point distribution.</p>
          <div class="transaction-map">
            <div class="transaction-chip"><strong>5 pts</strong><br>Accounting-equation effects</div>
            <div class="transaction-chip"><strong>5 pts</strong><br>Journal-entry patterns</div>
            <div class="transaction-chip"><strong>4 pts</strong><br>Trial balance → statements</div>
            <div class="transaction-chip"><strong>6 pts</strong><br>Full journalization set</div>
          </div>
          ${latest ? `<p class="small" style="margin-bottom:0"><strong>Last simulation:</strong> ${latest.score}/31 (${Math.round(latest.score/31*100)}%)</p>` : ''}
        </div>
      </div>
    </section>`;

  app.querySelector('#continueAdaptive').onclick = () => startPractice(weak.id);
  app.querySelector('#startTestFromDash').onclick = () => { setView('test'); setTimeout(startPracticeTest,0); };
  app.querySelectorAll('[data-practice-section]').forEach(b => b.onclick = () => startPractice(b.dataset.practiceSection));
}

function renderLearn() {
  app.innerHTML = `
    <div class="section-heading"><div><h2>Chapter 1–2 Study Guide</h2><p class="muted">Short lessons use your professor’s terminology and the logic in your notes.</p></div></div>
    <div class="notice" style="margin-bottom:14px"><strong>Scope:</strong> Chapter 3 adjusting entries were uploaded, but they are intentionally excluded here because your Test #1 materials identify Chapters 1–2 as the tested scope, with the emphasis mainly on Chapter 2.</div>
    <div class="accordion">
      ${SECTIONS.map((s,i)=>`
        <details class="card lesson-card" ${i===0?'open':''}>
          <summary>${escapeHtml(s.title)}</summary>
          <div class="body">
            <p class="badge">Key emphasis</p>
            <p><strong>${escapeHtml(s.emphasis)}</strong></p>
            <ul class="lesson-list">${s.lesson.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>
            <div class="trap-box"><strong>Common traps</strong><ul class="lesson-list">${s.traps.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div>
            <div class="question-actions"><button class="btn btn-primary" data-practice-section="${s.id}">Practice this section</button></div>
          </div>
        </details>`).join('')}
    </div>`;
  app.querySelectorAll('[data-practice-section]').forEach(b => b.onclick = () => startPractice(b.dataset.practiceSection));
}

function startPractice(sectionId) {
  practice.section = sectionId;
  state.lastSection = sectionId;
  saveState();
  practice.reinforcementQueue = [];
  practice.isReinforcement = false;
  practice.question = generateForSection(sectionId);
  practice.question.section = sectionId;
  practice.submitted = false;
  practice.grade = null;
  practice.response = null;
  practice.hintIndex = -1;
  setView('practice');
}

function nextPracticeQuestion() {
  let q;
  if (practice.reinforcementQueue.length) {
    const task = practice.reinforcementQueue.shift();
    q = generateByGenerator(task.generator);
    q.section = task.section;
    practice.isReinforcement = true;
    practice.originGenerator = task.generator;
  } else {
    q = generateForSection(practice.section);
    q.section = practice.section;
    practice.isReinforcement = false;
    practice.originGenerator = null;
  }
  practice.question = q;
  practice.submitted = false;
  practice.grade = null;
  practice.response = null;
  practice.hintIndex = -1;
  renderPractice();
}

function renderPractice() {
  if (!practice.question) {
    practice.question = generateForSection(practice.section);
    practice.question.section = practice.section;
  }
  const sec = sectionById(practice.section);
  app.innerHTML = `
    <div class="practice-layout">
      <aside class="side-panel">
        <div class="card flat">
          <label class="small muted" for="sectionSelect"><strong>Practice section</strong></label>
          <select id="sectionSelect" style="margin-top:7px">${SECTIONS.map(s=>`<option value="${s.id}" ${s.id===practice.section?'selected':''}>${escapeHtml(s.short)}</option>`).join('')}</select>
          <div style="margin-top:16px">
            <div class="small muted">Mastery</div>
            <div class="progress-track" style="margin-top:7px"><div class="progress-fill" style="width:${state.mastery[practice.section]}%"></div></div>
            <div style="font-weight:850;margin-top:6px">${state.mastery[practice.section]}%</div>
          </div>
          <div style="margin-top:16px" class="small">
            <div><strong>Streak:</strong> ${state.streak}</div>
            <div><strong>Reinforcement due:</strong> ${practice.reinforcementQueue.length}</div>
          </div>
          <button class="btn btn-light" id="readLesson" style="width:100%;margin-top:14px">Review lesson</button>
        </div>
      </aside>
      <section class="card question-card">
        <div class="question-meta">
          <span class="badge">${escapeHtml(sec.short)}</span>
          ${practice.isReinforcement ? `<span class="badge warn">Reinforcement · ${practice.reinforcementQueue.length + 1} remaining</span>` : '<span class="badge">New problem</span>'}
        </div>
        <div class="question-text">${escapeHtml(practice.question.prompt)}</div>
        <div id="answerArea">${renderAnswerControls(practice.question, practice.response, false)}</div>
        ${!practice.submitted && practice.hintIndex >= 0 ? `<div class="hint"><strong>Hint ${practice.hintIndex+1}:</strong> ${escapeHtml(practice.question.hints[practice.hintIndex] || 'Use the three-step process: financial position → accounts → debit/credit.')}</div>` : ''}
        ${practice.submitted ? renderPracticeFeedback() : ''}
        <div class="question-actions">
          ${!practice.submitted ? `<button class="btn btn-primary" id="submitPractice">Check answer</button><button class="btn btn-light" id="showHint">Hint</button>` : `<button class="btn btn-primary" id="nextPractice">${practice.grade?.correct ? 'Next question' : 'Start reinforcement'}</button>`}
        </div>
      </section>
    </div>`;

  app.querySelector('#sectionSelect').onchange = e => startPractice(e.target.value);
  app.querySelector('#readLesson').onclick = () => setView('learn');
  if (!practice.submitted) {
    app.querySelector('#submitPractice').onclick = submitPracticeAnswer;
    app.querySelector('#showHint').onclick = () => {
      practice.hintIndex = Math.min(practice.hintIndex + 1, Math.max(0,(practice.question.hints?.length||1)-1));
      renderPractice();
    };
  } else {
    app.querySelector('#nextPractice').onclick = nextPracticeQuestion;
  }
}

function collectResponse(q, root = app) {
  if (q.type === 'mcq') return root.querySelector('input[name="mcq"]:checked')?.value ?? null;
  if (q.type === 'numeric') return root.querySelector('[data-numeric]')?.value ?? '';
  if (q.type === 'multi') {
    return q.items.map((_,i)=>root.querySelector(`[data-multi="${i}"]`)?.value ?? '');
  }
  if (q.type === 'journal') return collectJournal(root.querySelector('[data-journal]'));
  if (q.type === 'summary') {
    return Object.fromEntries(q.fields.map(f=>[f.key,root.querySelector(`[data-summary="${f.key}"]`)?.value ?? '']));
  }
  if (q.type === 'journalSet') {
    return q.entries.map((_,i)=>collectJournal(root.querySelector(`[data-journal-set="${i}"]`)));
  }
  return null;
}

function collectJournal(el) {
  if (!el) return [];
  return [...el.querySelectorAll('tbody tr')].map(tr=>({
    account:tr.querySelector('[data-account]')?.value ?? '',
    debit:tr.querySelector('[data-debit]')?.value ?? '',
    credit:tr.querySelector('[data-credit]')?.value ?? ''
  }));
}

function submitPracticeAnswer() {
  const q = practice.question;
  const response = collectResponse(q);
  const grade = gradeQuestion(q,response);
  practice.response = response;
  practice.grade = grade;
  practice.submitted = true;
  updatePracticeStats(q, response, grade);
  if (!grade.correct) {
    // Every wrong answer earns two more problems from the same generator.
    practice.reinforcementQueue.unshift(
      {generator:q.generator,section:practice.section},
      {generator:q.generator,section:practice.section}
    );
  }
  renderPractice();
}

function updatePracticeStats(q,response,grade) {
  const sid = practice.section;
  state.totalQuestions += 1;
  state.attempts[sid] = (state.attempts[sid]||0)+1;
  const ratio = grade.max ? grade.score / grade.max : 0;
  const delta = grade.correct ? (practice.isReinforcement?7:6) : Math.round(-5 + ratio*3);
  state.mastery[sid] = clamp((state.mastery[sid]||0)+delta,0,100);
  if (grade.correct) {
    state.correct[sid] = (state.correct[sid]||0)+1;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak,state.streak);
  } else {
    state.streak = 0;
    state.mistakes.unshift({
      id:Date.now(), section:sid, generator:q.generator, prompt:q.prompt,
      your:responseToText(q,response), correct:expectedAnswerText(q), explanation:q.explanation
    });
    state.mistakes = state.mistakes.slice(0,80);
  }
  saveState();
}

function responseToText(q,response) {
  if (q.type === 'mcq' || q.type === 'numeric') return String(response ?? 'No answer');
  if (q.type === 'multi') return q.items.map((x,i)=>`${i+1}. ${response?.[i] || '—'}`).join('\n');
  if (q.type === 'summary') return q.fields.map(f=>`${f.label}: ${response?.[f.key]||'—'}`).join('\n');
  if (q.type === 'journal') return journalToText(response);
  if (q.type === 'journalSet') return q.entries.map((_,i)=>`${i+1}) ${journalToText(response?.[i])}`).join('\n');
  return JSON.stringify(response);
}
function journalToText(rows=[]) {
  return rows.filter(r=>r.account || r.debit || r.credit).map(r=>`${r.debit?'Dr':r.credit?'Cr':'?'} ${r.account||'—'} ${r.debit||r.credit||'—'}`).join('; ') || 'No entry';
}

function renderPracticeFeedback() {
  const q = practice.question;
  const good = practice.grade?.correct;
  const partial = !good && practice.grade?.score > 0;
  return `<div class="feedback ${good?'good':'bad'}">
    <h3>${good ? 'Correct' : partial ? `Partly correct · ${practice.grade.score}/${practice.grade.max}` : 'Not quite'}</h3>
    <div>${escapeHtml(q.explanation)}</div>
    ${!good ? `<p><strong>Correct answer</strong></p><div class="expected">${escapeHtml(expectedAnswerText(q))}</div><p class="small"><strong>What happens next:</strong> two fresh questions of this same type were added before you return to new material.</p>` : practice.isReinforcement ? `<p class="small"><strong>Reinforcement:</strong> good. ${practice.reinforcementQueue.length ? `${practice.reinforcementQueue.length} targeted problem(s) remain.` : 'You cleared the targeted follow-ups.'}</p>` : ''}
  </div>`;
}

function renderAnswerControls(q, response, testMode=false, prefix='') {
  if (q.type === 'mcq') {
    return `<div class="options">${q.options.map((o,i)=>`<label class="option"><input type="radio" name="${prefix}mcq" value="${escapeHtml(o)}" ${response===o?'checked':''}><span>${escapeHtml(o)}</span></label>`).join('')}</div>`;
  }
  if (q.type === 'numeric') {
    return `<div><input class="input numeric-input" data-numeric inputmode="numeric" placeholder="Enter amount" value="${escapeHtml(response||'')}"><p class="small muted">No dollar sign or decimals needed. Commas are okay.</p></div>`;
  }
  if (q.type === 'multi') {
    return `<div class="multi-grid">${q.items.map((item,i)=>`<div class="multi-item"><p>${i+1}. ${escapeHtml(item.prompt)}</p><select data-multi="${i}"><option value="">Choose…</option>${item.options.map(o=>`<option value="${escapeHtml(o)}" ${response?.[i]===o?'selected':''}>${escapeHtml(o)}</option>`).join('')}</select></div>`).join('')}</div>`;
  }
  if (q.type === 'journal') return renderJournal(q.accounts,response,'journal');
  if (q.type === 'summary') {
    return `${renderTrialTable(q.table)}<div class="summary-fields">${q.fields.map(f=>`<div class="field"><label>${escapeHtml(f.label)}</label><input class="input" data-summary="${f.key}" inputmode="numeric" value="${escapeHtml(response?.[f.key]||'')}"></div>`).join('')}</div>`;
  }
  if (q.type === 'journalSet') {
    return `<div class="grid">${q.entries.map((entry,i)=>`<div class="card flat" style="background:var(--surface-2)"><div style="font-weight:800;margin-bottom:10px">${i+1}. ${escapeHtml(entry.prompt)}</div>${renderJournal(q.accounts,response?.[i],`journal-set-${i}`,i)}</div>`).join('')}</div>`;
  }
  return '';
}

function renderJournal(accounts, response=[], key='journal', index=null) {
  const rows = Math.max(3, response?.length||0);
  const attr = index === null ? 'data-journal' : `data-journal-set="${index}"`;
  return `<div class="journal-wrap" ${attr}><table class="journal-table"><thead><tr><th>Account</th><th>Debit</th><th>Credit</th></tr></thead><tbody>${Array.from({length:rows},(_,i)=>{
    const r=response?.[i]||{};
    return `<tr><td><select data-account><option value="">Select account…</option>${accounts.map(a=>`<option value="${escapeHtml(a)}" ${r.account===a?'selected':''}>${escapeHtml(a)}</option>`).join('')}</select></td><td><input class="input" data-debit inputmode="numeric" value="${escapeHtml(r.debit||'')}"></td><td><input class="input" data-credit inputmode="numeric" value="${escapeHtml(r.credit||'')}"></td></tr>`;
  }).join('')}</tbody></table></div>`;
}

function renderTrialTable(rows) {
  return `<div style="overflow-x:auto"><table class="trial-table"><thead><tr><th>Account</th><th>Dr.</th><th>Cr.</th></tr></thead><tbody>${rows.map(([name,amt,side])=>`<tr><td>${escapeHtml(name)}</td><td>${side==='Dr'?fmt(amt):''}</td><td>${side==='Cr'?fmt(amt):''}</td></tr>`).join('')}</tbody></table></div>`;
}

function renderMistakes() {
  app.innerHTML = `
    <div class="section-heading"><div><h2>Mistake Review</h2><p class="muted">Your recent misses, newest first. Re-practice the exact question family anytime.</p></div></div>
    <div class="card">
      ${state.mistakes.length ? state.mistakes.map(m=>`
        <div class="mistake-item">
          <div class="question-meta"><span class="badge bad">${escapeHtml(sectionById(m.section)?.short || m.section)}</span></div>
          <div class="mistake-prompt">${escapeHtml(m.prompt)}</div>
          <p class="small"><strong>Your answer:</strong> <span style="white-space:pre-line">${escapeHtml(m.your)}</span></p>
          <p class="small"><strong>Correct:</strong> <span style="white-space:pre-line">${escapeHtml(m.correct)}</span></p>
          <p class="small muted">${escapeHtml(m.explanation)}</p>
          <button class="btn btn-light" data-retry-generator="${escapeHtml(m.generator)}" data-section="${escapeHtml(m.section)}">Practice this type</button>
        </div>`).join('') : '<div class="empty">No mistakes logged yet. Misses will show up here with the explanation and correct answer.</div>'}
    </div>`;
  app.querySelectorAll('[data-retry-generator]').forEach(b=>b.onclick=()=>{
    practice.section=b.dataset.section;
    practice.question=generateByGenerator(b.dataset.retryGenerator);
    practice.question.section=practice.section;
    practice.reinforcementQueue=[]; practice.submitted=false; practice.response=null; practice.hintIndex=-1; practice.isReinforcement=true;
    setView('practice');
  });
}

function renderCheat() {
  const tx = [
    ['Owner investment','Dr Cash · Cr Capital','+A, +E'],
    ['Borrow from bank','Dr Cash · Cr Notes Payable','+A, +L'],
    ['Pay on account','Dr Accounts Payable · Cr Cash','−L, −A'],
    ['Buy asset for cash','Dr Asset · Cr Cash','+A, −A'],
    ['Buy supplies on account','Dr Supplies · Cr Accounts Payable','+A, +L'],
    ['Cash revenue','Dr Cash · Cr Revenue','+A, +E'],
    ['Service on account','Dr Accounts Receivable · Cr Revenue','+A, +E'],
    ['Collection on account','Dr Cash · Cr Accounts Receivable','+A, −A'],
    ['Customer advance','Dr Cash · Cr Unearned Revenue','+A, +L'],
    ['Earn customer advance','Dr Unearned Revenue · Cr Revenue','−L, +E'],
    ['Cash expense','Dr Expense · Cr Cash','−E, −A'],
    ['Expense on account','Dr Expense · Cr Accounts Payable','−E, +L'],
    ['Use supplies','Dr Supplies Expense · Cr Supplies','−E, −A'],
    ['Owner withdrawal','Dr Withdrawals · Cr Cash','−E, −A']
  ];
  app.innerHTML = `
    <div class="section-heading"><div><h2>Test #1 Cheat Sheet</h2><p class="muted">The compact rules your notes and practice test keep using.</p></div></div>
    <div class="grid grid-2">
      <div class="card"><h3>Core equations & order</h3><table class="cheat-table">${QUICK_RULES.map(([a,b])=>`<tr><td>${escapeHtml(a)}</td><td>${escapeHtml(b)}</td></tr>`).join('')}</table></div>
      <div class="card"><h3>Three-step transaction analysis</h3><ol class="lesson-list"><li><strong>Financial position:</strong> Which parts of A = L + E went up/down?</li><li><strong>Accounts:</strong> Which exact accounts changed?</li><li><strong>Recording plan:</strong> Which account is debited and which is credited?</li></ol><div class="trap-box"><strong>Memory rule:</strong><br>If an account goes up, use its normal-balance side. If it goes down, use the opposite side.</div></div>
    </div>
    <div class="card" style="margin-top:16px"><h3>Transaction map</h3><div class="transaction-map">${tx.map(([name,entry,effect])=>`<div class="transaction-chip"><strong>${escapeHtml(name)}</strong><br>${escapeHtml(entry)}<br><span class="muted">${escapeHtml(effect)}</span></div>`).join('')}</div></div>
    <div class="card" style="margin-top:16px"><h3>Account balance equations</h3><p><strong>Debit-normal:</strong> Beginning Balance + Debits − Credits = Ending Balance</p><p><strong>Credit-normal:</strong> Beginning Balance + Credits − Debits = Ending Balance</p><p class="small muted">Debit-normal accounts: Assets, Expenses, Withdrawals. Credit-normal accounts: Liabilities, Capital, Revenues.</p></div>`;
}

function renderTest() {
  if (!testSession) {
    app.innerHTML = `
      <section class="card hero">
        <div class="badge warn">Professor-style simulation</div>
        <h2 class="hero-title">15 questions · 31 points · 120 minutes</h2>
        <p class="hero-sub">The point structure mirrors the practice test you provided: 5-point transaction effects, 5-point journal patterns, a 4-point trial-balance problem, and a 6-point journalization set. Every run uses fresh numbers and scenarios.</p>
        <div class="hero-actions"><button class="btn btn-primary" id="startPracticeTest">Start timed test</button></div>
      </section>
      <section class="card" style="margin-top:16px"><h3>Test rules</h3><ul class="lesson-list"><li>No hints or immediate feedback while the test is running.</li><li>You can move backward and forward before submitting.</li><li>Journal entries are graded only when the entire entry is properly balanced and uses the correct accounts.</li><li>After submission, you get a 31-point score and explanations for every missed part.</li></ul></section>`;
    app.querySelector('#startPracticeTest').onclick = startPracticeTest;
    return;
  }
  if (testSession.finished) return renderTestResults();
  renderTestQuestion();
}

function startPracticeTest() {
  testSession = {
    items: buildPracticeTest(),
    answers: Array(15).fill(null),
    index: 0,
    seconds: 120*60,
    timer: null,
    finished:false,
    results:null
  };
  startTestTimer();
  renderTestQuestion();
}
function startTestTimer() {
  clearInterval(testSession?.timer);
  if (!testSession || testSession.finished) return;
  testSession.timer = setInterval(()=>{
    if (!testSession || testSession.finished) return;
    testSession.seconds -= 1;
    const el=document.querySelector('#timer'); if (el) el.textContent=formatTime(testSession.seconds);
    if (testSession.seconds<=0) finishPracticeTest(true);
  },1000);
}
function stopTestTimer(clear=true) {
  if (testSession?.timer) clearInterval(testSession.timer);
  if (clear && testSession && !testSession.finished) testSession.timer=null;
}
function formatTime(sec) { sec=Math.max(0,sec); return `${String(Math.floor(sec/3600)).padStart(2,'0')}:${String(Math.floor((sec%3600)/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`; }

function renderTestQuestion() {
  const item = testSession.items[testSession.index];
  const q = item.q;
  app.innerHTML = `
    <div class="test-shell">
      <aside class="test-sidebar">
        <div class="card flat">
          <div class="small muted">Time remaining</div><div class="timer" id="timer">${formatTime(testSession.seconds)}</div>
          <div class="small muted" style="margin-top:10px">Answered ${testSession.answers.filter(a=>a!==null).length}/15</div>
          <div class="q-pills">${testSession.items.map((x,i)=>`<button class="q-pill ${i===testSession.index?'current':''} ${testSession.answers[i]!==null?'answered':''}" data-q-index="${i}">${i+1}</button>`).join('')}</div>
          <button class="btn btn-dark" id="submitWholeTest" style="width:100%;margin-top:15px">Submit test</button>
        </div>
      </aside>
      <section class="card question-card" id="testQuestionRoot">
        <div class="question-meta"><span class="badge">Question ${item.number}</span><span class="badge warn">${item.points} point${item.points===1?'':'s'}</span></div>
        <div class="question-text">${escapeHtml(q.prompt)}</div>
        ${renderAnswerControls(q,testSession.answers[testSession.index],true,'test-')}
        <div class="test-nav"><button class="btn btn-light" id="prevQ" ${testSession.index===0?'disabled':''}>Previous</button><button class="btn btn-primary" id="nextQ">${testSession.index===14?'Save answer':'Next'}</button></div>
      </section>
    </div>`;
  app.querySelectorAll('[data-q-index]').forEach(b=>b.onclick=()=>{ saveCurrentTestAnswer(); testSession.index=Number(b.dataset.qIndex); renderTestQuestion(); });
  app.querySelector('#prevQ').onclick=()=>{ saveCurrentTestAnswer(); testSession.index--; renderTestQuestion(); };
  app.querySelector('#nextQ').onclick=()=>{ saveCurrentTestAnswer(); if(testSession.index<14)testSession.index++; renderTestQuestion(); };
  app.querySelector('#submitWholeTest').onclick=()=>{ saveCurrentTestAnswer(); if(confirm('Submit the practice test now?')) finishPracticeTest(false); };
}
function saveCurrentTestAnswer() {
  if (!testSession || testSession.finished) return;
  const q=testSession.items[testSession.index].q;
  const root=document.querySelector('#testQuestionRoot');
  // mcq names are prefixed in test rendering, so collect manually for that one type.
  let response;
  if(q.type==='mcq') response=root.querySelector('input[name="test-mcq"]:checked')?.value ?? null;
  else response=collectResponse(q,root);
  testSession.answers[testSession.index]=response;
}

function finishPracticeTest(auto=false) {
  if(!testSession || testSession.finished) return;
  saveCurrentTestAnswer();
  stopTestTimer();
  const results=testSession.items.map((item,i)=>({item,grade:gradeQuestion(item.q,testSession.answers[i]),response:testSession.answers[i]}));
  const score=results.reduce((s,r)=>s+r.grade.score,0);
  testSession.finished=true; testSession.results=results; testSession.score=score; testSession.autoSubmitted=auto;
  state.practiceTests.push({date:new Date().toISOString(),score});
  state.practiceTests=state.practiceTests.slice(-12);
  // Add misses from the simulated test to mistake review without affecting mastery/streak.
  for(const r of results){
    if(!r.grade.correct){
      state.mistakes.unshift({id:Date.now()+Math.random(),section:r.item.q.section,generator:r.item.q.generator,prompt:r.item.q.prompt,your:responseToText(r.item.q,r.response),correct:expectedAnswerText(r.item.q),explanation:r.item.q.explanation});
    }
  }
  state.mistakes=state.mistakes.slice(0,80); saveState();
  renderTestResults();
}

function renderTestResults() {
  const score=testSession.score;
  const pct=Math.round(score/31*100);
  const missed=testSession.results.filter(r=>!r.grade.correct);
  app.innerHTML=`
    <section class="card">
      <div style="display:flex;gap:22px;align-items:center;flex-wrap:wrap">
        <div class="score-ring" style="--pct:${pct}%"><span>${score}/31</span></div>
        <div><div class="badge ${pct>=80?'good':pct>=65?'warn':'bad'}">${pct}%</div><h2 style="margin:8px 0 4px">Practice Test Results</h2><p class="muted">${testSession.autoSubmitted?'Time expired and the test was submitted automatically.':'Test submitted.'} ${missed.length ? `${missed.length} question(s) need review.` : 'Perfect run.'}</p></div>
      </div>
      <div class="hero-actions"><button class="btn btn-primary" id="newTest">Generate a new test</button><button class="btn btn-light" id="reviewWeak">Practice weakest area</button></div>
    </section>
    <section style="margin-top:16px" class="grid">
      ${testSession.results.map((r,i)=>`<div class="card review-card ${r.grade.correct?'':'wrong'}"><div class="question-meta"><span class="badge">Q${r.item.number}</span><span class="badge ${r.grade.correct?'good':'bad'}">${r.grade.score}/${r.grade.max}</span></div><div class="mistake-prompt">${escapeHtml(r.item.q.prompt)}</div>${r.grade.correct?'<p class="small muted">Correct.</p>':`<p class="small"><strong>Your answer:</strong><br><span style="white-space:pre-line">${escapeHtml(responseToText(r.item.q,r.response))}</span></p><p class="small"><strong>Correct answer:</strong></p><div class="expected">${escapeHtml(expectedAnswerText(r.item.q))}</div><p class="small muted">${escapeHtml(r.item.q.explanation)}</p>`}</div>`).join('')}
    </section>`;
  app.querySelector('#newTest').onclick=()=>{ testSession=null; startPracticeTest(); };
  app.querySelector('#reviewWeak').onclick=()=>startPractice(weakestSection());
}

render();
