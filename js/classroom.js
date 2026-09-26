import { CLASSROOM } from './classroom-content.js';
import { AUDIO_LESSONS } from './mastery-content.js';
import { createClassroomSession,advanceClassroom,answerCheckpoint,continueClassroom,classroomSnapshot } from './classroom-engine.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clock=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
const shuffle=items=>{const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;};

export function createClassroom({app,audio,getManifest,readProgress,writeProgress,onExit,onPractice,onActivate}) {
 let active=false,state=null,track=null,renderKey='',renderedIndex=-1,frame=0,saveTime=0,ready=false,error='',orders={},loadHandler=null;
 let lastFinishedKey='';
 const find=s=>app.querySelector(s);

 function persist(force=false){if(!state||(!force&&performance.now()-saveTime<1500))return;saveTime=performance.now();writeProgress(state.id,classroomSnapshot(state));}
 function leave(){if(!active)return;audio.pause();persist(true);active=false;cancelAnimationFrame(frame);if(loadHandler){audio.removeEventListener('loadedmetadata',loadHandler);loadHandler=null;}document.body.classList.remove('in-classroom');}
 function start(id,{restart=false}={}){
  const next=getManifest()?.tracks?.find(t=>t.id===id);
  if(!next||!CLASSROOM[id])return false;
  leave();onActivate();track=next;
  try{state=createClassroomSession(id,next,restart?{}:readProgress(id));}catch(e){onExit();return false;}
  active=true;ready=false;error='';renderKey='';renderedIndex=-1;lastFinishedKey='';orders={};
  for(const s of state.slides)if(s.checkpoint)orders[s.key]=shuffle(s.checkpoint.options);
  document.body.classList.add('in-classroom');
  app.innerHTML=`<section class="classroom" aria-label="Interactive audio classroom">
   <div class="classroom-heading"><button type="button" class="back" id="classExit">← Lessons</button><span class="pill">LISTEN + TAP</span></div>
   <div class="classroom-overview"><div><span class="eyebrow">YOUR AUDIO CLASSROOM</span><h1>${esc(next.title.replace(/^\d+ · /,''))}</h1></div><span class="classroom-score" id="classScore"></span></div>
   <div class="classroom-dots" id="classDots" aria-label="Lesson slides"></div>
   <div id="classStage" class="classroom-stage"></div>
   <div class="classroom-controls" aria-label="Lesson playback">
    <div class="classroom-control-row"><button class="btn" id="classReplay" type="button">↶ Replay card</button><button class="btn primary" id="classPlay" type="button">Pause narration</button><label>Speed <select id="classRate" aria-label="Narration speed"><option value="0.85">0.85×</option><option value="1" selected>1×</option><option value="1.15">1.15×</option><option value="1.3">1.3×</option></select></label></div>
    <label class="classroom-seek-label" for="classSeek"><span>Lesson position</span><span id="classTime">0:00 / ${clock(next.duration)}</span></label>
    <input id="classSeek" type="range" min="0" max="${next.duration}" step="0.1" value="0" aria-label="Lesson position">
    <p class="micro" id="classAudioStatus" role="status">Loading narration…</p>
   </div>
   <p class="classroom-footnote">AI narration · Cards follow the recorded sections. No timer on answers. For screen-off listening, choose Audio only from Lessons.</p>
  </section>`;
  find('#classExit').onclick=()=>{leave();onExit();};
  find('#classReplay').onclick=replay;
  find('#classPlay').onclick=toggle;
  find('#classRate').onchange=e=>{audio.playbackRate=Number(e.target.value);updateControls();};
  find('#classSeek').onchange=e=>seek(Number(e.target.value));
  audio.pause();audio.controls=false;audio.src=next.url;audio.playbackRate=1;
  render(true);
  loadHandler=()=>{if(!active)return;ready=true;audio.currentTime=state.position;render(true);if(state.phase!=='listening')audio.pause();};
  audio.addEventListener('loadedmetadata',loadHandler);
  if('mediaSession' in navigator&&'MediaMetadata' in window)navigator.mediaSession.metadata=new MediaMetadata({title:next.title+' · Interactive',artist:'Ledger Academy',album:'Listen, follow, answer'});
  // Play is initiated in the user gesture. Metadata restoration corrects the
  // position before normal playback; gates are enforced again on every event.
  if(state.phase==='listening')play();else audio.load();
  window.scrollTo(0,0);app.focus({preventScroll:true});
  return true;
 }
 async function play(){if(!active||state.phase!=='listening')return;error='';try{await audio.play();}catch{if(active){error='Tap Play narration to start the audio.';updateControls();}}}
 function toggle(){if(!active)return;if(state.phase==='question'||state.phase==='correct'){replay();return;}if(state.phase==='complete')return;if(audio.paused)play();else audio.pause();updateControls();}
 function replay(){if(!active)return;const start=state.slides[state.index].start;state.feedback=null;state.selected=null;advanceClassroom(state,start);if(!ready){error='';audio.load();render(true);}else seek(start);play();}
 function seek(time){if(!active||!ready)return;const result=advanceClassroom(state,time);state.feedback=null;state.selected=null;if(result.pause)audio.pause();audio.currentTime=result.position;find('#classSeek').value=result.position;render(true);persist(true);}
 function sync(){
  if(!active||!ready)return;
  const before=state.phase,oldIndex=state.index,result=advanceClassroom(state,audio.currentTime);
  if(result.pause){audio.pause();if(Math.abs(audio.currentTime-result.position)>.015)audio.currentTime=result.position;}
  if(oldIndex!==state.index){state.selected=null;state.feedback=null;}
  render();persist(before!==state.phase);
 }
 function loop(){if(!active)return;sync();if(!audio.paused)frame=requestAnimationFrame(loop);}
 function choose(value){
  const feedback=answerCheckpoint(state,value);if(!feedback)return;
  audio.pause();persist(true);render(true);
  if(feedback.correct){find('.checkpoint-feedback')?.focus({preventScroll:true});}
 }
 function proceed(){
  if(!continueClassroom(state))return;
  audio.currentTime=state.position;persist(true);render(true);
  if(state.phase==='listening')play();
 }
 function render(force=false){
  if(!active||!find('#classStage'))return;
  const slide=state.slides[state.index],key=state.index+':'+state.phase;
  const answered=Object.values(state.answers).filter(a=>a.released).length,total=state.slides.filter(s=>s.checkpoint).length;
  find('#classScore').textContent=`${answered} / ${total} checkpoints`;
  if(force||renderKey!==key){
   const moved=renderedIndex!==state.index;renderedIndex=state.index;
   renderKey=key;
   find('#classDots').innerHTML=state.slides.map((s,i)=>`<span class="${i<state.index?'done':i===state.index?'current':''}" aria-label="Card ${i+1}${s.checkpoint?' with question':''}${i===state.index?', current':''}">${s.checkpoint?'•':''}</span>`).join('');
   if(state.phase==='complete')renderFinish();else{
    const isQuestion=state.phase==='question'||state.phase==='correct',q=slide.checkpoint;
    find('#classStage').innerHTML=`<div class="classroom-scene ${esc(slide.kind)} ${isQuestion?'at-checkpoint':''}">
     <div class="classroom-scene-top"><span class="eyebrow">${isQuestion?'YOUR TURN · AUDIO PAUSED':'FOLLOW THE VOICE'}</span><span class="classroom-page">CARD ${state.index+1} / ${state.slides.length}</span></div>
     <h2>${esc(slide.title)}</h2>
     <div class="classroom-formula">${slide.formula.split(/ ([+=−→]) /).map(t=>/^[+=−→]$/.test(t)?`<b class="operator">${t}</b>`:`<span>${esc(t)}</span>`).join('')}</div>
     <div class="classroom-visual">${slide.rows.map(([label,value],i)=>`<div class="classroom-row ${value==='?'?'unknown':''}" style="--card-order:${i}"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}</div>
     <p class="classroom-takeaway">${esc(slide.note)}</p>
    </div>
    ${isQuestion?`<section class="checkpoint ${state.phase==='correct'?'passed':''}" aria-label="Checkpoint question"><div class="checkpoint-intro"><span class="checkpoint-symbol">${state.phase==='correct'?'✓':'?'}</span><div><span class="eyebrow">${state.phase==='correct'?'YOU GOT IT':'TAKE YOUR TIME'}</span><h2>${esc(q.prompt)}</h2></div></div>
     <div class="checkpoint-choices">${orders[slide.key].map((choice,i)=>`<button type="button" class="checkpoint-choice ${state.selected===choice?(state.feedback?.correct?'right':'wrong'):state.phase==='correct'&&choice===q.answer?'right':''}" data-answer="${i}" ${state.phase==='correct'?'disabled':''}><span>${String.fromCharCode(65+i)}</span><strong>${esc(choice)}</strong>${state.phase==='correct'&&choice===q.answer?'<b>✓</b>':''}</button>`).join('')}</div>
     ${state.feedback||state.phase==='correct'?`<div class="checkpoint-feedback ${state.phase==='correct'?'good':'retry'}" role="status" tabindex="-1"><strong>${state.phase==='correct'?'Congratulations—that’s correct!':'Not quite. Here’s a small hint:'}</strong><p>${esc(state.feedback?.text||q.explanation)}</p></div>`:'<p class="micro">The narration is waiting. Pick one answer to continue.</p>'}
     <div class="actions">${state.phase==='correct'?'<button class="btn primary" id="classContinue" type="button">'+(state.index===state.slides.length-1?'Finish topic →':'Correct · Continue lesson →')+'</button>':state.feedback?'<button class="btn" id="classRetry" type="button">Try again</button>':''}<button class="btn quiet" id="classReplayQuestion" type="button">Hear the question again</button></div>
    </section>`:''}
    <details class="classroom-transcript"><summary>Read what the narrator is saying</summary><p>${esc(slide.transcript)}</p></details>`;
    find('#classStage').querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>choose(orders[slide.key][Number(b.dataset.answer)]));
    if(find('#classContinue'))find('#classContinue').onclick=proceed;
    if(find('#classReplayQuestion'))find('#classReplayQuestion').onclick=replay;
    if(find('#classRetry'))find('#classRetry').onclick=()=>{state.feedback=null;state.selected=null;render(true);find('.checkpoint-choice')?.focus({preventScroll:true});};
    if(isQuestion&&key!==lastFinishedKey){lastFinishedKey=key;find('.checkpoint')?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
    else if(moved)find('.classroom-scene')?.scrollIntoView({block:'start',behavior:'auto'});
   }
  }
  updateControls();
 }
 function renderFinish(){
  const nextId=AUDIO_LESSONS[AUDIO_LESSONS.findIndex(l=>l.id===state.id)+1]?.id;
  const total=state.slides.filter(s=>s.checkpoint).length,first=Object.values(state.answers).filter(a=>a.correct&&a.tries===1).length;
  find('#classStage').innerHTML=`<section class="classroom-finish"><span class="classroom-trophy">✦</span><span class="eyebrow">TOPIC COMPLETE</span><h2>Congratulations.<br>You worked through it.</h2><p>${total} checkpoints completed · ${first} correct on the first try.<br>Retries are part of learning. Try fresh numbers next to check that the method stuck.</p><div class="actions">${nextId?'<button class="btn primary" id="classNextTopic" type="button">Next topic →</button>':''}<button class="btn" id="classFresh" type="button">Practice fresh questions</button><button class="btn quiet" id="classRestart" type="button">Replay this topic</button></div></section>`;
  if(find('#classNextTopic'))find('#classNextTopic').onclick=()=>start(nextId);
  find('#classFresh').onclick=()=>{const unit={equations:'equity',balances:'supplies',bridge:'bridge',transactions:'transactions',ledger:'trial'}[state.id];leave();onPractice(unit);};
  find('#classRestart').onclick=()=>start(state.id,{restart:true});
 }
 function updateControls(){
  if(!active||!find('#classPlay'))return;
  const locked=state.phase==='question'||state.phase==='correct',done=state.phase==='complete';
  find('#classPlay').textContent=locked?'↶ Replay question':done?'Topic complete':audio.paused?'▶ Play narration':'Ⅱ Pause narration';
  find('#classPlay').disabled=done;
  find('#classTime').textContent=clock(state.position)+' / '+clock(track.duration);
  if(document.activeElement!==find('#classSeek'))find('#classSeek').value=state.position;
  find('#classSeek').setAttribute('aria-valuetext',clock(state.position)+' of '+clock(track.duration));
  find('#classAudioStatus').textContent=error||(!ready?'Loading narration…':locked?'Audio paused. Answer correctly, then tap Continue.':done?'All checkpoints complete.':'Cards follow the narration. Playback stops at each unanswered question.');
  app.querySelector('.classroom')?.classList.toggle('is-speaking',ready&&!audio.paused);
  const controls=find('.classroom-controls');if(controls)controls.hidden=done;
 }
 audio.addEventListener('timeupdate',sync);
 audio.addEventListener('seeking',()=>{if(active&&ready)sync();});
 audio.addEventListener('play',()=>{
  if(!active)return;
  if(state.phase!=='listening'){audio.pause();return;}
  cancelAnimationFrame(frame);frame=requestAnimationFrame(loop);updateControls();
 });
 audio.addEventListener('pause',()=>{if(active){cancelAnimationFrame(frame);updateControls();persist(true);}});
 audio.addEventListener('ended',()=>{if(active){advanceClassroom(state,track.duration);render(true);persist(true);}});
 audio.addEventListener('error',()=>{if(active){error='Audio could not load. Check your connection, then choose Replay card to retry. You can still read the card.';ready=false;updateControls();}});
 document.addEventListener('visibilitychange',()=>{if(active&&document.hidden){audio.pause();persist(true);}});
 window.addEventListener('pagehide',()=>{if(active){audio.pause();persist(true);}});
 return {
  start,leave,toggle,replay,
  get active(){return active;},
  get canPlay(){return active&&state?.phase==='listening';},
  seek,
  get position(){return state?.position||0;}
 };
}
