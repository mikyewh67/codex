import { CLASSROOM } from './classroom-content.js';
import { AUDIO_LESSONS } from './mastery-content.js';

export function buildTimeline(id, track) {
 const visuals=CLASSROOM[id], script=AUDIO_LESSONS.find(l=>l.id===id);
 if(!visuals||!script||track?.id!==id||track.segments?.length!==visuals.length||!Number.isFinite(track.duration))throw Error('This lesson needs matching audio timings.');
 let previous=0;
 return visuals.map((visual,index)=>{
  const timing=track.segments[index];
  if(!Number.isFinite(timing.start)||!Number.isFinite(timing.end)||timing.start<previous-.01||timing.end<=timing.start||timing.end>track.duration+.1)throw Error('Invalid audio timings.');
  previous=timing.end;
  // Generated silence starts immediately after the spoken question. The small
  // margin avoids clipping the final sound while still preceding the answer.
  const gate=visual.checkpoint?Math.min(timing.end-.03,timing.end-(script.segments[index].pause||.65)+.05):null;
  return {...visual,...timing,index,key:id+':'+index,gate,transcript:script.segments[index].text};
 });
}

export function createClassroomSession(id,track,saved={}) {
 const slides=buildTimeline(id,track),answers={};
 for(const s of slides.filter(s=>s.checkpoint)){
  const a=saved?.answers?.[s.key];
  if(a&&Number.isInteger(a.tries)&&a.tries>=0)answers[s.key]={tries:Math.min(a.tries,10000),correct:a.correct===true,released:a.correct===true&&a.released===true};
 }
 // A forged or stale save must not release later checkpoints before earlier ones.
 let blocked=false;
 for(const s of slides.filter(s=>s.checkpoint)){const a=answers[s.key];if(blocked&&a?.released)a.released=false;if(!a?.released)blocked=true;}
 const state={id,slides,duration:track.duration,answers,position:0,index:0,phase:'listening',pending:null,selected:null,feedback:null};
 advanceClassroom(state,Number.isFinite(saved?.position)?saved.position:0);
 return state;
}

export function nextCheckpoint(state) {return state.slides.find(s=>s.checkpoint&&!state.answers[s.key]?.released);}

// All time changes, including seeks, restoration, media controls, and ended,
// must pass through this function. Forward seeks cannot bypass a checkpoint.
export function advanceClassroom(state,requestedTime) {
 let position=Math.max(0,Math.min(state.duration,Number.isFinite(requestedTime)?requestedTime:0));
 const locked=nextCheckpoint(state);
 if(locked&&position>=locked.gate){
  position=locked.gate;state.index=locked.index;state.pending=locked.key;
  state.phase=state.answers[locked.key]?.correct?'correct':'question';
 }else{
  state.pending=null;state.index=Math.max(0,state.slides.findLastIndex(s=>s.start<=position+.005));
  state.phase=!locked&&position>=state.duration-.04?'complete':'listening';
 }
 state.position=position;
 return {position,pause:state.phase!=='listening',index:state.index,phase:state.phase};
}

export function answerCheckpoint(state,choice) {
 if(state.phase!=='question'||!state.pending)return null;
 const slide=state.slides[state.index],q=slide.checkpoint;
 if(!q.options.includes(choice))return null;
 const previous=state.answers[slide.key]||{tries:0,correct:false,released:false};
 previous.tries++;previous.correct=choice===q.answer;state.answers[slide.key]=previous;
 state.selected=choice;
 state.feedback=previous.correct?{correct:true,text:q.explanation}:{correct:false,text:q.hints[Math.min(previous.tries-1,q.hints.length-1)]};
 if(previous.correct)state.phase='correct';
 return state.feedback;
}

export function continueClassroom(state) {
 if(state.phase!=='correct'||!state.pending)return false;
 const slide=state.slides[state.index];state.answers[slide.key].released=true;
 state.selected=null;state.feedback=null;
 advanceClassroom(state,slide.end+.002);
 return true;
}

export function classroomSnapshot(state) {
 return {position:state.position,answers:structuredClone(state.answers),completed:state.phase==='complete'};
}
