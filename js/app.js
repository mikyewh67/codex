import { TUTORIALS, renderVisual, wireVisual, topicForQuestion } from './tutorials.js';
import { SECTIONS, QUICK_RULES, TEST_DATE } from './course-data.js';
import {
  generateForSection, generateByGenerator, gradeQuestion, expectedAnswerText,
  buildPracticeTest, engineInternals
} from './question-engine.js';

const STORE_KEY = 'accounting1-test1-trainer-v1';
const app = document.querySelector('#app');
const testChip = document.querySelector('#testChip');
const navButtons = [...document.querySelectorAll('.nav-btn')];
const ICONS = {
 home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
 book:'<path d="M12 5C8 2 3 4 3 4v16s5-2 9 1c4-3 9-1 9-1V4s-5-2-9 1v16"/>',
 bolt:'<path d="m13 2-9 12h7l-1 8 10-13h-8z"/>',
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
 arrow:'<path d="M4 12h15m-5-5 5 5-5 5"/>',
 flame:'<path d="M12 3c2 5-3 6-1 10 3-1 4-3 4-5 6 6 5 13-3 13C3 21 3 13 7 9c0 4 2 4 2 4-1-5 4-6 3-10Z"/>',
 chart:'<path d="M4 4v16h17M9 15v-4m5 4V7m5 8v-5"/>',
 check:'<circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/>',
 spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 journal:'<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M3 7h4M3 12h4M3 17h4m4-10h5m-5 5h5m-5 5h3"/>',
 repeat:'<path d="m17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4m14-1v3a2 2 0 0 1-2 2H3"/>',
 phone:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4M10 5h4"/>',
 download:'<path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/>',
 upload:'<path d="M12 15V3m-4 4 4-4 4 4M4 16v4h16v-4"/>',
 shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/>',
 close:'<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>'
};
function icon(name){return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]||ICONS.spark}</svg>`;}
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
const motionReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function announce(text){document.querySelector('#announcer').textContent=text;}
function transitionView(){app.classList.remove('view-enter');void app.offsetWidth;app.classList.add('view-enter');}
function celebrate(){
 if(motionReduced())return;
 const layer=document.querySelector('#celebration');
 layer.replaceChildren();
 for(let i=0;i<28;i++){
   const piece=document.createElement('i');piece.className='confetti';
   piece.style.cssText=`--x:${(Math.random()-.5)*500}px;--y:${(Math.random()-.35)*500}px;--r:${Math.random()*700}deg;animation-delay:${Math.random()*.1}s;background:${i%3?'#d6c28a':'#8dd6b0'}`;
   layer.append(piece);
 }
 setTimeout(()=>layer.replaceChildren(),1300);
}
function toast(message){
 document.querySelector('.save-toast')?.remove();
 const el=document.createElement('div');el.className='save-toast';el.textContent=message;el.setAttribute('role','status');document.body.append(el);setTimeout(()=>el.remove(),3500);
}
function todayKey(){const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}
function todayCount(){return state.daily?.[todayKey()]||0;}
function countUp(){
 if(motionReduced())return;
 app.querySelectorAll('[data-count]').forEach(el=>{
  const value=Number(el.dataset.count),start=performance.now();
  function frame(t){if(!el.isConnected)return;const progress=Math.min((t-start)/700,1);el.textContent=Math.round(value*(1-(1-progress)**3));if(progress<1)requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
 });
}

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
    daily: {},
    lessonsRead: {},
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
let tutorial = {topic:'foundations',page:0,returnTo:null};
let sprint = {answered:0, correct:0, target:10, active:false};

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
  if(activeView==='practice' && practice.question && !practice.submitted) practice.response=collectResponse(practice.question);
  if(activeView==='test' && testSession && !testSession.finished) saveCurrentTestAnswer();
  activeView = view;
  navButtons.forEach(b => {
    const selected=b.dataset.view === view || (b.dataset.view==='learn' && view==='tutorial') || (b.dataset.view==='more' && ['cheat','mistakes'].includes(view));
    b.classList.toggle('active',selected);
    if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  });
  render();
  transitionView();
  app.focus({preventScroll:true});
  window.scrollTo({top:0,behavior:'instant'});
}
navButtons.forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));

document.querySelector('#brandHome').onclick=()=>setView('dashboard');
function resetProgress(){
 if(!confirm('Reset all study progress, mistakes, streaks, and test history?'))return;
 state=defaultState();saveState();practice={...practice,question:null,section:'transaction-analysis',reinforcementQueue:[],submitted:false,response:null};
 sprint={answered:0,correct:0,target:10,active:false};
 if(testSession)stopTestTimer();testSession=null;setView('dashboard');toast('Progress reset. A fresh start.');
}

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

  if (activeView === 'dashboard') renderDashboard();
  if (activeView === 'learn') renderLearn();
  if (activeView === 'practice') renderPractice();
  if (activeView === 'test') renderTest();
  if (activeView === 'mistakes') renderMistakes();
  if (activeView === 'cheat') renderCheat();
  if (activeView === 'more') renderMore();
  if (activeView === 'tutorial') renderTutorial();
}

function renderDashboard() {
 const weak=sectionById(weakestSection()),mastery=overallMastery();
 const correct=Object.values(state.correct).reduce((a,b)=>a+b,0);
 const accuracy=state.totalQuestions?Math.round(correct/state.totalQuestions*100):0;
 const latest=state.practiceTests.at(-1);
 const greeting=new Date().getHours()<12?'Morning':new Date().getHours()<18?'Afternoon':'Evening';
 app.innerHTML=`
 <div class="greeting"><div><div class="eyebrow">YOUR NEXT LEVEL STARTS HERE</div><h1>${greeting}, Mikye.</h1><p>Small sessions. Serious progress.</p></div><div class="streak-tag">${icon('flame')}<span>${state.streak} streak</span></div></div>
 <section class="card dashboard-hero">
  <div class="hero-copy"><span class="badge warn">${icon('spark')} BUILT FOR YOUR TEST #1</span><h2>Make it<br><em>second nature.</em></h2><p>Ten questions. One stronger skill.<br>Let’s work on ${escapeHtml(weak.short.toLowerCase())}.</p><button class="btn btn-primary" id="continueAdaptive">${sprint.active && sprint.answered>0?'Continue your session':'Start a quick session'}${icon('arrow')}</button><span class="hero-footnote">About 5–10 minutes · Adapts to your mistakes</span></div>
  <div class="hero-visual"><div class="orbit"></div><div class="mastery-orb" role="img" aria-label="${mastery}% practice mastery estimate"><svg viewBox="0 0 200 200"><circle class="ring-track" cx="100" cy="100" r="90"/><circle class="ring-progress" cx="100" cy="100" r="90" style="--offset:${565.49*(1-mastery/100)}"/></svg><span class="orb-value"><span data-count="${mastery}">${mastery}</span><small>%</small></span><span class="orb-label">PRACTICE MASTERY</span><span class="orb-caption">${state.totalQuestions?'Keep building confidence':'Your first step starts here'}</span></div><span class="float-tag one">Assets = L + E</span><span class="float-tag two">Dr = Cr</span></div>
 </section>
 <section class="metrics" aria-label="Your study statistics">
  <div class="metric"><span class="metric-icon">${icon('check')}</span><strong data-count="${state.totalQuestions}">${state.totalQuestions}</strong><small>Questions done</small></div>
  <div class="metric"><span class="metric-icon">${icon('target')}</span><strong>${state.totalQuestions?`<span data-count="${accuracy}">${accuracy}</span>%`:'—'}</strong><small>Practice accuracy</small></div>
  <div class="metric"><span class="metric-icon">${icon('flame')}</span><strong data-count="${state.bestStreak}">${state.bestStreak}</strong><small>Best streak</small></div>
 </section>
 <div class="dashboard-columns">
  <section><div class="section-heading"><h2>Find your flow</h2><span class="eyebrow">LET’S GET INTO IT</span></div>
   <div class="mode-grid">
    ${modeCard('journal','Journal lab','Build entries, step by step.','journal')}
    ${modeCard('bolt','Quick practice','Sharpen debit & credit instincts.','debits-credits')}
    ${modeCard('target','Test simulation','15 questions. The real format.','test')}
    ${modeCard('book','Visual tutorials','Read it. See it. Understand it.','learn')}
   </div>
   <div class="card daily-card"><div class="daily-top"><strong>${icon('spark')}Your daily momentum</strong><span>${todayCount()} / 20</span></div><div class="progress-track"><div class="progress-fill" style="width:${Math.min(todayCount()/20*100,100)}%"></div></div><p>${todayCount()>=20?'Daily goal complete. Look at you showing up.':'Aim for 20 questions today. Every attempt counts.'}</p></div>
   ${latest?`<div class="history-mini"><span>Last ${latest.mode==='guided'?'guided practice':'timed test'}</span><strong>${latest.score} / 31 · ${Math.round(latest.score/31*100)}%</strong></div>`:''}
  </section>
  <section><div class="section-heading"><h2>Your skill map</h2><button class="link-btn" id="openLessons">Explore lessons ${icon('arrow')}</button></div><div class="card topics">
  ${SECTIONS.map((section,i)=>`<button class="topic-row" data-practice-section="${section.id}"><span class="topic-number">0${i+1}</span><span><strong>${escapeHtml(section.short)}</strong><span class="progress-track" style="display:block"><span class="progress-fill" style="display:block;width:${state.mastery[section.id]||0}%"></span></span></span><span>${state.mastery[section.id]||0}%</span></button>`).join('')}
  </div><p class="small muted" style="font-size:10px;margin-top:12px">Mastery reflects practice progress, not a predicted test score.</p></section>
 </div>`;
 app.querySelector('#continueAdaptive').onclick=()=>sprint.active&&sprint.answered>0?setView('practice'):startPractice(weak.id);
 app.querySelector('#openLessons').onclick=()=>setView('learn');
 app.querySelectorAll('[data-practice-section]').forEach(b=>b.onclick=()=>startPractice(b.dataset.practiceSection));
 app.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>['test','mistakes','learn'].includes(b.dataset.mode)?setView(b.dataset.mode):startPractice(b.dataset.mode));
 countUp();
}
function modeCard(symbol,title,subtitle,mode){return `<button class="mode-card" data-mode="${mode}"><span class="mode-icon">${icon(symbol)}</span><span class="mode-arrow">${icon('arrow')}</span><strong>${title}</strong><small>${subtitle}</small></button>`;}

function renderLearn() {
 const completed=Object.keys(state.lessonsRead||{}).filter(id=>TUTORIALS[id]).length;
 app.innerHTML=`<div class="page-intro"><div class="eyebrow">LESS GUESSING. MORE UNDERSTANDING.</div><h2 class="page-title">Learn it. See it. Get it.</h2><p>Read at your pace. Move the numbers. Follow the reasoning.</p></div>
 <section class="learn-welcome card"><div><span class="badge warn">${icon('book')} VISUAL LEARNING LIBRARY</span><h3>Start with the why.</h3><p>No score. No timer. Just clear explanations and examples you can work through.</p></div><div class="read-progress"><strong>${completed}<span> / 8</span></strong><small>lessons marked read</small></div></section>
 <div class="tutorial-grid">${SECTIONS.map((section,i)=>{const lesson=TUTORIALS[section.id];return `<button class="tutorial-card card" data-open-tutorial="${section.id}"><div class="tutorial-card-top"><span class="lesson-index">0${i+1}</span><span class="badge ${state.lessonsRead?.[section.id]?'good':''}">${state.lessonsRead?.[section.id]?'Read ✓':lesson.minutes+' min read'}</span></div><span class="tutorial-preview" aria-hidden="true">${['A = L + E','? + ? = ?','↑ A & ↓ A','DEBIT │ CREDIT','Dr  =  Cr','T-accounts','Σ Dr = Σ Cr','Income → Equity'][i]}</span><h3>${escapeHtml(section.short)}</h3><p>${escapeHtml(lesson.description)}</p><span class="tutorial-card-bottom">${lesson.pages.length} short pages <span>Read lesson ${icon('arrow')}</span></span></button>`;}).join('')}</div>`;
 app.querySelectorAll('[data-open-tutorial]').forEach(b=>b.onclick=()=>openTutorial(b.dataset.openTutorial));
}
function openTutorial(topic,returnTo=null){
 tutorial={topic:TUTORIALS[topic]?topic:'foundations',page:0,returnTo};
 setView('tutorial');
}
function renderTutorial(){
 const lesson=TUTORIALS[tutorial.topic],page=lesson.pages[tutorial.page];
 const last=tutorial.page===lesson.pages.length-1;
 app.innerHTML=`<div class="tutorial-toolbar"><button class="link-btn" id="allLessons">← All lessons</button>${tutorial.returnTo?`<button class="btn btn-light" id="returnToQuestion">${tutorial.returnTo==='test'&&testSession?.finished?'Back to results':tutorial.returnTo==='mistakes'?'Back to mistakes':'Back to my question'} ${icon('arrow')}</button>`:''}</div>
 <div class="tutorial-heading"><span class="eyebrow">${escapeHtml(sectionById(tutorial.topic).short)} · VISUAL TUTORIAL</span><h2>${escapeHtml(lesson.title)}</h2><p>${escapeHtml(lesson.description)}</p></div>
 <nav class="lesson-pagination" aria-label="Tutorial pages">${lesson.pages.map((p,i)=>`<button data-lesson-page="${i}" aria-label="Page ${i+1}: ${escapeHtml(p.title)}" ${i===tutorial.page?'aria-current="step"':''}><span>0${i+1}</span><span>${escapeHtml(p.title)}</span></button>`).join('')}</nav>
 <article class="tutorial-article"><div class="tutorial-reading"><div class="eyebrow">PAGE ${tutorial.page+1} OF ${lesson.pages.length}</div><h3>${escapeHtml(page.title)}</h3>${page.text.map(t=>`<p>${escapeHtml(t)}</p>`).join('')}<div class="tutorial-takeaway"><span>${icon('spark')} THE IDEA TO KEEP</span><p>${escapeHtml(page.takeaway)}</p></div></div><section class="tutorial-visual card" aria-label="Visual example"><div class="visual-heading"><span class="eyebrow">SEE IT IN ACTION</span><span class="badge">Worked example</span></div>${renderVisual(page.visual)}</section></article>
 <div class="lesson-navigation"><button class="btn btn-light" id="previousLessonPage" ${tutorial.page===0?'disabled':''}>← Previous</button>${last?`<button class="btn btn-primary" id="markLessonRead">${state.lessonsRead?.[tutorial.topic]?'Lesson read ✓':'Mark lesson read'} ${icon('check')}</button>`:`<button class="btn btn-primary" id="nextLessonPage">Next page ${icon('arrow')}</button>`}</div>
 ${last?`<div class="lesson-finish card"><h3>Ready to use it?</h3><p>Your practice mastery changes when you practice. Reading this lesson is tracked separately.</p><button class="btn btn-light" id="practiceLesson">Practice ${escapeHtml(sectionById(tutorial.topic).short)}</button>${tutorial.returnTo?`<button class="btn btn-primary" id="returnAfterLesson">${tutorial.returnTo==='test'&&testSession?.finished?'Return to results':'Return to my question'}</button>`:''}</div>`:''}`;
 app.querySelector('#allLessons').onclick=()=>setView('learn');
 function go(index){tutorial.page=index;renderTutorial();transitionView();app.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
 app.querySelectorAll('[data-lesson-page]').forEach(b=>b.onclick=()=>go(Number(b.dataset.lessonPage)));
 app.querySelector('#previousLessonPage').onclick=()=>go(tutorial.page-1);
 app.querySelector('#nextLessonPage')?.addEventListener('click',()=>go(tutorial.page+1));
 app.querySelector('#markLessonRead')?.addEventListener('click',()=>{state.lessonsRead={...(state.lessonsRead||{}),[tutorial.topic]:new Date().toISOString()};saveState();app.querySelector('#markLessonRead').textContent='Lesson read ✓';toast('Lesson saved as read.');});
 app.querySelector('#practiceLesson')?.addEventListener('click',()=>startPractice(tutorial.topic));
 for(const id of ['returnToQuestion','returnAfterLesson'])app.querySelector('#'+id)?.addEventListener('click',()=>setView(tutorial.returnTo));
 wireVisual(app,page.visual);
}

function startPractice(sectionId) {
  // Save outgoing inputs before replacing the question.
  if(activeView==='practice')practice.submitted=true;
  sprint={answered:0,correct:0,target:10,active:true};
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
  activeView='';
  setView('practice');
}

function nextPracticeQuestion() {
  if(sprint.active && sprint.answered>=sprint.target && !practice.reinforcementQueue.length){renderSessionComplete();return;}
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
  transitionView();
  window.scrollTo({top:0,behavior:'instant'});
}

function renderPractice() {
  if(sprint.active && sprint.answered>=sprint.target && !practice.reinforcementQueue.length && !practice.submitted){renderSessionComplete();return;}
  if(!sprint.active)sprint={answered:0,correct:0,target:10,active:true};
  if (!practice.question) {
    practice.question = generateForSection(practice.section);
    practice.question.section = practice.section;
  }
  const sec = sectionById(practice.section);
  app.innerHTML = `
    <div class="practice-layout">
      <aside class="side-panel">
        <div class="card flat">
          <div class="practice-settings"><label class="small muted" for="sectionSelect">TRAINING FOCUS</label>
          <select id="sectionSelect">${SECTIONS.map(s=>`<option value="${s.id}" ${s.id===practice.section?'selected':''}>${escapeHtml(s.short)}</option>`).join('')}</select>
          <div class="compact-mastery"><strong>${state.mastery[practice.section]}%</strong><small>Mastery</small></div></div>
          <div class="practice-extras"><span>${practice.reinforcementQueue.length?`${practice.reinforcementQueue.length} follow-ups queued`:`${state.streak} correct in a row`}</span><button class="link-btn" id="readLesson">Review topic</button></div>
        </div>
      </aside>
      <section class="card question-card">
        <div class="practice-context"><span class="eyebrow">${practice.isReinforcement?'BUILDING CONFIDENCE':'QUICK SESSION'}</span><span class="session-chip">${Math.min(sprint.answered+(!practice.submitted?1:0),sprint.target)} / ${sprint.target}${sprint.answered>=10&&practice.reinforcementQueue.length?' + follow-ups':''}</span></div>
        <div class="session-strip" aria-label="${sprint.answered} questions completed">${Array.from({length:10},(_,i)=>`<span class="session-step ${i<sprint.answered?'done':''}"></span>`).join('')}</div>
        <div class="question-meta">
          <span class="badge">${escapeHtml(sec.short)}</span>
          ${practice.isReinforcement ? `<span class="badge warn">Reinforcement · ${practice.reinforcementQueue.length + 1} remaining</span>` : '<span class="badge">New problem</span>'}
        </div>
        <div class="question-text">${escapeHtml(practice.question.prompt)}</div>
        <button class="topic-review" id="reviewPracticeTopic">${icon('book')} Review topic <span>Learn the steps first ${icon('arrow')}</span></button>
        <div id="answerArea">${renderAnswerControls(practice.question, practice.response, false)}</div>
        ${!practice.submitted && practice.hintIndex >= 0 ? `<div class="hint"><strong>Hint ${practice.hintIndex+1}:</strong> ${escapeHtml(practice.question.hints[practice.hintIndex] || 'Use the three-step process: financial position → accounts → debit/credit.')}</div>` : ''}
        ${practice.submitted ? renderPracticeFeedback() : ''}
        <div class="question-actions">
          ${!practice.submitted ? `<button class="btn btn-primary" id="submitPractice">Check answer</button><button class="btn btn-light" id="showHint">Hint</button>` : `<button class="btn btn-primary" id="nextPractice">${sprint.answered>=sprint.target&&!practice.reinforcementQueue.length?'Finish session':practice.grade?.correct?'Next question':'Let’s try it again'}</button>`}
        </div>
      </section>
    </div>`;

  app.querySelector('#reviewPracticeTopic').onclick=()=>openTutorial(topicForQuestion(practice.question),'practice');
  app.querySelector('#sectionSelect').onchange = e => startPractice(e.target.value);
  app.querySelector('#readLesson').onclick = () => openTutorial(topicForQuestion(practice.question),'practice');
  if (!practice.submitted) {
    app.querySelector('#submitPractice').onclick = submitPracticeAnswer;
    app.querySelector('#showHint').onclick = () => {
      practice.response = collectResponse(practice.question);
      practice.hintIndex = Math.min(practice.hintIndex + 1, Math.max(0,(practice.question.hints?.length||1)-1));
      renderPractice();
    };
  } else {
    app.querySelector('#nextPractice').onclick = nextPracticeQuestion;
    app.querySelectorAll('#answerArea input, #answerArea select, #answerArea button').forEach(el=>el.disabled=true);
  }
  wireJournals();
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
  if(!hasResponse(q,response)){toast('Add your answer first.');return;}
  const grade = gradeQuestion(q,response);
  sprint.answered++;if(grade.correct)sprint.correct++;
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
  announce(grade.correct?'Correct. '+q.explanation:'Not quite. '+q.explanation);
  if(grade.correct && state.streak%5===0)celebrate();
  if(!grade.correct)app.querySelector('.question-card').classList.add('nudge');
  requestAnimationFrame(()=>app.querySelector('.feedback')?.scrollIntoView({behavior:motionReduced()?'instant':'smooth',block:'nearest'}));
}
function hasResponse(q,r){
 if(q.type==='mcq'||q.type==='numeric')return r!==null && String(r).trim()!=='';
 if(q.type==='multi')return r.every(x=>x!=='');
 if(q.type==='summary')return Object.values(r).every(x=>String(x).trim()!=='');
 const rows=q.type==='journal'?r:r.flat();return rows.some(x=>x.account||x.debit||x.credit);
}
function renderSessionComplete(){
 sprint.active=false;practice.question=null;practice.submitted=false;practice.response=null;
 const pct=Math.round(sprint.correct/Math.max(1,sprint.answered)*100);
 app.innerHTML=`<section class="card session-finish"><div class="finish-emblem">${icon('spark')}</div><div class="eyebrow">YOU SHOWED UP. THAT COUNTS.</div><h2>One session stronger.</h2><p class="finish-caption">${pct>=80?'That’s momentum. Keep it going.':'Every mistake is a skill you’re building. Come back stronger.'}</p><div class="metrics"><div class="metric"><strong>${sprint.answered}</strong><small>Questions</small></div><div class="metric"><strong>${pct}%</strong><small>Accuracy</small></div><div class="metric"><strong>${state.streak}</strong><small>Current streak</small></div></div><div class="hero-actions"><button class="btn btn-primary" id="anotherSession">Another session ${icon('arrow')}</button><button class="btn btn-light" id="backDashboard">Back to home</button></div></section>`;
 app.querySelector('#anotherSession').onclick=()=>startPractice(practice.section);
 app.querySelector('#backDashboard').onclick=()=>setView('dashboard');
 transitionView();celebrate();window.scrollTo({top:0,behavior:'instant'});
}

function updatePracticeStats(q,response,grade) {
  const sid = practice.section;
  state.totalQuestions += 1;
  state.daily={...(state.daily||{}),[todayKey()]:todayCount()+1};
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
  return (rows||[]).filter(r=>r.account || r.debit || r.credit).map(r=>`${r.debit?'Dr':r.credit?'Cr':'?'} ${r.account||'—'} ${r.debit||r.credit||'—'}`).join('; ') || 'No entry';
}

function renderPracticeFeedback() {
  const q = practice.question;
  const good = practice.grade?.correct;
  const partial = !good && practice.grade?.score > 0;
  return `<div class="feedback ${good?'good':'bad'}">
    <h3>${icon(good?'check':'repeat')}${good ? 'You’ve got it.' : partial ? `Partly correct · ${practice.grade.score}/${practice.grade.max}` : 'Not quite'}</h3>
    <div>${escapeHtml(q.explanation)}</div>
    ${!good ? `<p><strong>Correct answer</strong></p><div class="expected">${escapeHtml(expectedAnswerText(q))}</div><p class="small"><strong>What happens next:</strong> two fresh questions of this same type were added before you return to new material.</p>` : practice.isReinforcement ? `<p class="small"><strong>Reinforcement:</strong> good. ${practice.reinforcementQueue.length ? `${practice.reinforcementQueue.length} targeted problem(s) remain.` : 'You cleared the targeted follow-ups.'}</p>` : ''}
  </div>`;
}

function renderAnswerControls(q, response, testMode=false, prefix='') {
  if (q.type === 'mcq') {
    return `<div class="options">${q.options.map((o,i)=>`<label class="option"><input type="radio" name="${prefix}mcq" value="${escapeHtml(o)}" ${response===o?'checked':''}><span class="option-key" aria-hidden="true">${String.fromCharCode(65+i)}</span><span>${escapeHtml(o)}</span></label>`).join('')}</div>`;
  }
  if (q.type === 'numeric') {
    return `<div><input class="input numeric-input" data-numeric aria-label="Your answer amount" inputmode="decimal" placeholder="Enter amount" value="${escapeHtml(response||'')}"><p class="small muted">No dollar sign or decimals needed. Commas are okay.</p></div>`;
  }
  if (q.type === 'multi') {
    return `<div class="multi-grid">${q.items.map((item,i)=>`<div class="multi-item"><p>${i+1}. ${escapeHtml(item.prompt)}</p><select data-multi="${i}" aria-label="Answer for part ${i+1}"><option value="">Choose…</option>${item.options.map(o=>`<option value="${escapeHtml(o)}" ${response?.[i]===o?'selected':''}>${escapeHtml(o)}</option>`).join('')}</select></div>`).join('')}</div>`;
  }
  if (q.type === 'journal') return renderJournal(q.accounts,response,'journal');
  if (q.type === 'summary') {
    return `${renderTrialTable(q.table)}<div class="summary-fields">${q.fields.map(f=>`<div class="field"><label>${escapeHtml(f.label)}</label><input class="input" aria-label="${escapeHtml(f.label)}" data-summary="${f.key}" inputmode="numeric" value="${escapeHtml(response?.[f.key]||'')}"></div>`).join('')}</div>`;
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
    return `<tr><td data-label="Account"><select data-account aria-label="Account for entry row ${i+1}"><option value="">Select account…</option>${accounts.map(a=>`<option value="${escapeHtml(a)}" ${r.account===a?'selected':''}>${escapeHtml(a)}</option>`).join('')}</select></td><td data-label="Debit"><input class="input" data-debit aria-label="Debit for entry row ${i+1}" inputmode="decimal" value="${escapeHtml(r.debit||'')}"></td><td data-label="Credit"><input class="input" data-credit aria-label="Credit for entry row ${i+1}" inputmode="decimal" value="${escapeHtml(r.credit||'')}"></td></tr>`;
  }).join('')}</tbody></table><div class="journal-totals" aria-live="polite"></div><div class="journal-tools"><button type="button" class="link-btn" data-add-row>+ Add row</button><button type="button" class="link-btn" data-remove-row>− Remove last row</button></div></div>`;
}

function renderTrialTable(rows) {
  return `<div style="overflow-x:auto"><table class="trial-table"><thead><tr><th>Account</th><th>Dr.</th><th>Cr.</th></tr></thead><tbody>${rows.map(([name,amt,side])=>`<tr><td>${escapeHtml(name)}</td><td>${side==='Dr'?fmt(amt):''}</td><td>${side==='Cr'?fmt(amt):''}</td></tr>`).join('')}</tbody></table></div>`;
}

function renderMistakes() {
  app.innerHTML = `
    <div class="page-intro"><div class="eyebrow">THE COMEBACK COLLECTION</div><h2 class="page-title">Make your mistakes count.</h2><p>Revisit the reasoning. Then take on a fresh version.</p></div>
    <div class="card">
      ${state.mistakes.length ? state.mistakes.map(m=>`
        <div class="mistake-item">
          <div class="question-meta"><span class="badge bad">${escapeHtml(sectionById(m.section)?.short || m.section)}</span></div>
          <div class="mistake-prompt">${escapeHtml(m.prompt)}</div>
          <p class="small"><strong>Your answer:</strong> <span style="white-space:pre-line">${escapeHtml(m.your)}</span></p>
          <p class="small"><strong>Correct:</strong> <span style="white-space:pre-line">${escapeHtml(m.correct)}</span></p>
          <p class="small muted">${escapeHtml(m.explanation)}</p>
          <button class="link-btn mistake-lesson" data-mistake-lesson="${topicForQuestion(m)}">Review topic →</button><br><button class="btn btn-light" data-retry-generator="${escapeHtml(m.generator)}" data-section="${escapeHtml(m.section)}">Practice this type</button>
        </div>`).join('') : `<div class="empty">${icon('shield')}A clean slate.<br>Your missed questions will live here, ready for a comeback.</div>`}
    </div>`;
  app.querySelectorAll('[data-mistake-lesson]').forEach(b=>b.onclick=()=>openTutorial(b.dataset.mistakeLesson,'mistakes'));
  app.querySelectorAll('[data-retry-generator]').forEach(b=>b.onclick=()=>{
    sprint={answered:0,correct:0,target:10,active:true};
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
    <div class="page-intro"><div class="eyebrow">A LITTLE CLARITY, ON DEMAND</div><h2 class="page-title">Your pocket reference.</h2><p>The rules, equations, and patterns worth keeping close.</p></div>
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
        <h2 class="hero-title">Your dress rehearsal.</h2><div class="transaction-map"><div class="transaction-chip"><strong>15 questions</strong><br>31 possible points</div><div class="transaction-chip"><strong>120 minutes</strong><br>Fresh numbers every run</div></div>
        <p class="hero-sub">The point structure mirrors the practice test you provided: 5-point transaction effects, 5-point journal patterns, a 4-point trial-balance problem, and a 6-point journalization set. Every run uses fresh numbers and scenarios.</p>
        <div class="hero-actions"><button class="btn btn-primary" id="startPracticeTest">Start guided test ${icon('book')}</button><button class="btn btn-light" id="startExamTest">Start timed exam ${icon('clock')}</button></div>
      </section>
      <section class="card" style="margin-top:16px"><h3>Test rules</h3><ul class="lesson-list"><li><strong>Guided test:</strong> no time limit. Open Review topic on any question, read the tutorial, and return to your saved answer.</li><li><strong>Timed exam:</strong> 120 minutes with no topic-review buttons during the exam. Tutorials are available with your results.</li><li>You can move backward and forward before submitting.</li><li>Journal entries are graded only when the entire entry is properly balanced and uses the correct accounts.</li><li>After submission, you get a 31-point score and explanations for every missed part.</li></ul></section>`;
    app.querySelector('#startPracticeTest').onclick = ()=>startPracticeTest('guided');
    app.querySelector('#startExamTest').onclick = ()=>startPracticeTest('exam');
    return;
  }
  if (testSession.finished) return renderTestResults();
  renderTestQuestion();
}

function startPracticeTest(mode='guided') {
  testSession = {
    mode,
    items: buildPracticeTest(),
    answers: Array(15).fill(null),
    index: 0,
    seconds: 120*60,
    endsAt: Date.now()+120*60*1000,
    timer: null,
    finished:false,
    results:null
  };
  startTestTimer();
  renderTestQuestion();
}
function startTestTimer() {
  clearInterval(testSession?.timer);
  if (!testSession || testSession.finished || testSession.mode==='guided') return;
  testSession.timer = setInterval(()=>{
    if (!testSession || testSession.finished) return;
    testSession.seconds = Math.max(0,Math.ceil((testSession.endsAt-Date.now())/1000));
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
          <div class="small muted">${testSession.mode==='guided'?'GUIDED PRACTICE':'TIME REMAINING'}</div><div class="timer" id="timer">${testSession.mode==='guided'?'At your pace':formatTime(testSession.seconds)}</div>
          <div class="small muted" style="margin-top:10px">Answered ${testSession.answers.filter(a=>a!==null).length}/15</div>
          <div class="q-pills">${testSession.items.map((x,i)=>`<button class="q-pill ${i===testSession.index?'current':''} ${testSession.answers[i]!==null?'answered':''}" data-q-index="${i}">${i+1}</button>`).join('')}</div>
          <button class="btn btn-dark" id="submitWholeTest" style="width:100%;margin-top:15px">Submit test</button>
        </div>
      </aside>
      <section class="card question-card" id="testQuestionRoot">
        <div class="question-meta"><span class="badge">Question ${item.number}</span><span class="badge warn">${item.points} point${item.points===1?'':'s'}</span></div>
        <div class="question-text">${escapeHtml(q.prompt)}</div>
        ${testSession.mode==='guided'?`<button class="topic-review" id="reviewTestTopic">${icon('book')} Review topic <span>Tutorial + worked example ${icon('arrow')}</span></button>`:''}
        ${renderAnswerControls(q,testSession.answers[testSession.index],true,'test-')}
        <div class="test-nav"><button class="btn btn-light" id="prevQ" ${testSession.index===0?'disabled':''}>Previous</button><button class="btn btn-primary" id="nextQ">${testSession.index===14?'Save answer':'Next'}</button></div>
      </section>
    </div>`;
  app.querySelector('#reviewTestTopic')?.addEventListener('click',()=>openTutorial(topicForQuestion(q),'test'));
  app.querySelectorAll('[data-q-index]').forEach(b=>b.onclick=()=>{ saveCurrentTestAnswer(); testSession.index=Number(b.dataset.qIndex); renderTestQuestion(); });
  app.querySelector('#prevQ').onclick=()=>{ saveCurrentTestAnswer(); testSession.index--; renderTestQuestion(); };
  app.querySelector('#nextQ').onclick=()=>{ saveCurrentTestAnswer(); if(testSession.index<14)testSession.index++; renderTestQuestion(); };
  app.querySelector('#submitWholeTest').onclick=()=>{ saveCurrentTestAnswer(); if(confirm('Submit the practice test now?')) finishPracticeTest(false); };
  wireJournals();
}
function saveCurrentTestAnswer() {
  if (!testSession || testSession.finished) return;
  const q=testSession.items[testSession.index].q;
  const root=document.querySelector('#testQuestionRoot');
  if(!root)return;
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
  state.practiceTests.push({date:new Date().toISOString(),score,mode:testSession.mode});
  state.practiceTests=state.practiceTests.slice(-12);
  // Add misses from the simulated test to mistake review without affecting mastery/streak.
  for(const r of results){
    if(!r.grade.correct){
      state.mistakes.unshift({id:Date.now()+Math.random(),section:r.item.q.section,generator:r.item.q.generator,prompt:r.item.q.prompt,your:responseToText(r.item.q,r.response),correct:expectedAnswerText(r.item.q),explanation:r.item.q.explanation});
    }
  }
  state.mistakes=state.mistakes.slice(0,80); saveState();
  activeView='test';
  setView('test');
  if(score>=25)celebrate();
}

function renderTestResults() {
  const score=testSession.score;
  const pct=Math.round(score/31*100);
  const missed=testSession.results.filter(r=>!r.grade.correct);
  app.innerHTML=`
    <section class="card">
      <div style="display:flex;gap:22px;align-items:center;flex-wrap:wrap">
        <div class="score-ring" style="--pct:${pct}%"><span>${score}/31</span></div>
        <div><div class="badge ${pct>=80?'good':pct>=65?'warn':'bad'}">${pct}%</div><h2 style="margin:8px 0 4px">${testSession.mode==='guided'?'Guided Practice Results':'Timed Exam Results'}</h2><p class="muted">${testSession.autoSubmitted?'Time expired and the test was submitted automatically.':'Test submitted.'} ${missed.length ? `${missed.length} question(s) need review.` : 'Perfect run.'}</p></div>
      </div>
      <div class="hero-actions"><button class="btn btn-primary" id="newTest">Generate a new test</button><button class="btn btn-light" id="reviewWeak">Practice weakest area</button></div>
    </section>
    <section style="margin-top:16px" class="grid">
      ${testSession.results.map((r,i)=>`<div class="card review-card ${r.grade.correct?'':'wrong'}"><div class="question-meta"><span class="badge">Q${r.item.number}</span><span class="badge ${r.grade.correct?'good':'bad'}">${r.grade.score}/${r.grade.max}</span></div><div class="mistake-prompt">${escapeHtml(r.item.q.prompt)}</div>${r.grade.correct?'<p class="small muted">Correct.</p>':`<p class="small"><strong>Your answer:</strong><br><span style="white-space:pre-line">${escapeHtml(responseToText(r.item.q,r.response))}</span></p><p class="small"><strong>Correct answer:</strong></p><div class="expected">${escapeHtml(expectedAnswerText(r.item.q))}</div><p class="small muted">${escapeHtml(r.item.q.explanation)}</p>`}<button class="topic-review" data-result-lesson="${topicForQuestion(r.item.q)}">${icon('book')} Review topic <span>Read the tutorial ${icon('arrow')}</span></button></div>`).join('')}
    </section>`;
  app.querySelectorAll('[data-result-lesson]').forEach(b=>b.onclick=()=>openTutorial(b.dataset.resultLesson,'test'));
  app.querySelector('#newTest').onclick=()=>{ const mode=testSession.mode;testSession=null;startPracticeTest(mode); };
  app.querySelector('#reviewWeak').onclick=()=>startPractice(weakestSection());
}

function wireJournals(){
 app.querySelectorAll('.journal-wrap').forEach(wrap=>{
  function update(){
   let dr=0,cr=0;
   wrap.querySelectorAll('tbody tr').forEach(row=>{
    const value=el=>Number((el.value||'0').replace(/[$,\s]/g,''))||0;
    dr+=value(row.querySelector('[data-debit]'));cr+=value(row.querySelector('[data-credit]'));
    row.classList.toggle('credit-row',value(row.querySelector('[data-credit]'))>0);
   });
   const difference=Math.abs(dr-cr);
   wrap.querySelector('.journal-totals').innerHTML=`<span>Debits <strong>$${fmt(dr)}</strong></span><span>Credits <strong>$${fmt(cr)}</strong></span><span class="balance-status" style="color:${difference?'var(--warn)':'var(--good)'}">${difference?'Difference $'+fmt(difference):dr?'Balanced':'Add your entry above'}</span>`;
  }
  wrap.addEventListener('input',update);
  wrap.querySelector('[data-add-row]').onclick=()=>{
   const body=wrap.querySelector('tbody'),row=body.rows[0].cloneNode(true),n=body.rows.length+1;
   row.querySelectorAll('input,select').forEach(el=>{el.value='';el.disabled=false;el.setAttribute('aria-label',el.getAttribute('aria-label').replace(/\d+$/,n));});
   body.append(row);update();row.querySelector('select').focus();
  };
  wrap.querySelector('[data-remove-row]').onclick=()=>{const body=wrap.querySelector('tbody');if(body.rows.length>2)body.lastElementChild.remove();update();};
  update();
 });
}
function renderMore(){
 app.innerHTML=`<div class="page-intro"><div class="eyebrow">YOUR STUDY SPACE</div><h2 class="page-title">A few useful extras.</h2><p>Keep your tools close and your progress safe.</p></div><div class="grid grid-2"><div class="tool-list">
 <button class="tool-row" id="openMistakes">${icon('repeat')}<span><strong>Mistake journal</strong><small>${state.mistakes.length} saved questions to learn from</small></span>${icon('arrow')}</button>
 <button class="tool-row" id="openReference">${icon('book')}<span><strong>Pocket reference</strong><small>Equations, rules, and transaction patterns</small></span>${icon('arrow')}</button>
 <button class="tool-row" id="exportProgress">${icon('download')}<span><strong>Back up your progress</strong><small>Download a copy of your study data</small></span>${icon('arrow')}</button>
 <button class="tool-row" id="importProgress">${icon('upload')}<span><strong>Restore a backup</strong><small>Bring your saved progress to this device</small></span>${icon('arrow')}</button><input class="sr-only" type="file" id="progressFile" accept="application/json,.json" aria-label="Study progress backup">
 </div><div class="grid"><div class="card"><span class="badge warn">${icon('phone')} ON YOUR HOME SCREEN</span><h3 style="margin-top:18px">Your own study app.</h3><p class="muted small">Open the live website in Safari on your iPhone.</p><ol class="install-steps"><li>Tap the <strong>Share</strong> button.</li><li>Choose <strong>Add to Home Screen</strong>.</li><li>Keep <strong>Open as Web App</strong> enabled if shown, then tap <strong>Add</strong>.</li></ol><p class="small muted">Already added the old version? Open the new site in Safari, then replace the old Home Screen shortcut to refresh its icon and app appearance. An internet connection is required.</p></div><div class="card"><h3>Progress lives on this device.</h3><p class="small muted">Your study data is stored in this browser. Make a backup before changing devices, clearing browser data, or moving to another website address.</p><button class="link-btn" id="resetProgress">Reset study progress</button></div></div></div>`;
 app.querySelector('#openMistakes').onclick=()=>setView('mistakes');
 app.querySelector('#openReference').onclick=()=>setView('cheat');
 app.querySelector('#resetProgress').onclick=resetProgress;
 app.querySelector('#exportProgress').onclick=()=>{
  const blob=new Blob([JSON.stringify({app:'ledger',version:1,state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ledger-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Your progress backup is ready.');
 };
 const input=app.querySelector('#progressFile');
 app.querySelector('#importProgress').onclick=()=>input.click();
 input.onchange=async()=>{
  try{
   const file=input.files[0];if(!file)return;if(file.size>2000000)throw new Error('That backup is too large.');
   const backup=JSON.parse(await file.text());
   if(backup.app!=='ledger'||backup.version!==1||!backup.state)throw new Error('Choose a Ledger progress backup.');
   const imported=validateBackup(backup.state);
   if(!confirm('Replace this device’s progress with the selected backup?'))return;
   state=imported;saveState();practice.question=null;practice.response=null;practice.submitted=false;practice.reinforcementQueue=[];sprint.active=false;
   if(testSession)stopTestTimer();testSession=null;
   setView('dashboard');toast('Progress restored. Welcome back.');
  }catch(err){toast(err.message||'Unable to read this backup.');}
 };
}
function validateBackup(data){
 const clean=defaultState();
 const nonnegative=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
 if(!['totalQuestions','streak','bestStreak'].every(k=>nonnegative(data[k]))||!Array.isArray(data.mistakes)||!Array.isArray(data.practiceTests))throw new Error('This backup has invalid progress data.');
 for(const k of ['totalQuestions','streak','bestStreak'])clean[k]=Math.floor(data[k]);
 for(const section of SECTIONS)for(const k of ['mastery','attempts','correct']){
  const v=data[k]?.[section.id];if(!nonnegative(v))throw new Error('This backup has invalid topic data.');clean[k][section.id]=k==='mastery'?clamp(v,0,100):Math.floor(v);
 }
 clean.mistakes=data.mistakes.slice(0,80).filter(m=>m&&sectionById(m.section)&&['generator','prompt','your','correct','explanation'].every(k=>typeof m[k]==='string')).map(m=>({id:m.id,section:m.section,generator:m.generator,prompt:m.prompt,your:m.your,correct:m.correct,explanation:m.explanation}));
 clean.practiceTests=data.practiceTests.filter(t=>t&&nonnegative(t.score)&&t.score<=31&&typeof t.date==='string').slice(-12).map(t=>({date:t.date,score:t.score,mode:t.mode==='guided'?'guided':'exam'}));
 clean.lessonsRead=Object.fromEntries(Object.entries(data.lessonsRead||{}).filter(([id,date])=>TUTORIALS[id]&&typeof date==='string'));
 clean.lastSection=sectionById(data.lastSection)?data.lastSection:clean.lastSection;
 clean.daily=Object.fromEntries(Object.entries(data.daily||{}).filter(([k,v])=>/^\d{4}-\d{1,2}-\d{1,2}$/.test(k)&&nonnegative(v)));
 return clean;
}
document.addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;
 if(activeView==='practice'){
  if(/^[1-9]$/.test(e.key)&&!practice.submitted){const choice=app.querySelectorAll('.option input')[Number(e.key)-1];if(choice){choice.checked=true;choice.focus();}}
  if(e.key==='Enter'){e.preventDefault();app.querySelector(practice.submitted?'#nextPractice':'#submitPractice')?.click();}
  if(e.key.toLowerCase()==='h')app.querySelector('#showHint')?.click();
 }
});
render();
navButtons[0].setAttribute('aria-current','page');
