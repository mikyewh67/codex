import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CLASSROOM } from '../js/classroom-content.js';
import { AUDIO_LESSONS } from '../js/mastery-content.js';
import { createClassroomSession,advanceClassroom,answerCheckpoint,continueClassroom,classroomSnapshot,nextCheckpoint,buildTimeline } from '../js/classroom-engine.js';
const manifest=JSON.parse(readFileSync(new URL('../audio/manifest.json',import.meta.url)));
let cards=0,questions=0;
for(const lesson of AUDIO_LESSONS){
 const track=manifest.tracks.find(t=>t.id===lesson.id),state=createClassroomSession(lesson.id,track);
 assert.equal(state.slides.length,lesson.segments.length);
 cards+=state.slides.length;
 for(const [i,s] of state.slides.entries()){
  assert.ok(s.title&&s.formula&&s.rows.length&&s.note);
  assert.equal(s.transcript,lesson.segments[i].text);
  if(lesson.segments[i].pause)assert.ok(s.checkpoint,'Every spoken question must have a checkpoint');
  if(s.checkpoint){
   questions++;const q=s.checkpoint;
   assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.equal(q.options.filter(v=>v===q.answer).length,1);
   assert.ok(q.hints.length>=2);assert.ok(s.gate>s.start&&s.gate<s.end);
   // A large seek, an ended event, or a slow timeupdate must stop at the first
   // unanswered question rather than jumping to a later slide/answer.
   const movement=advanceClassroom(state,track.duration);
   assert.equal(movement.position,s.gate);assert.equal(state.index,i);assert.equal(state.phase,'question');assert.ok(movement.pause);
   assert.equal(advanceClassroom(state,s.gate-.000001).phase,'question','Media timestamp rounding must not dismiss a checkpoint');
   assert.equal(continueClassroom(state),false);
   const wrong=q.options.find(v=>v!==q.answer),first=answerCheckpoint(state,wrong);
   assert.equal(first.correct,false);assert.equal(first.text,q.hints[0]);assert.equal(state.phase,'question');
   assert.equal(continueClassroom(state),false);assert.equal(nextCheckpoint(state).key,s.key);
   const retry=answerCheckpoint(state,wrong);assert.equal(retry.text,q.hints[1]);
   const restored=createClassroomSession(lesson.id,track,classroomSnapshot(state));
   assert.equal(restored.phase,'question');assert.equal(restored.answers[s.key].tries,2);assert.equal(restored.index,i);
   // Replaying the prompt cannot accidentally release its checkpoint.
   advanceClassroom(state,s.start);assert.equal(state.phase,'listening');
   advanceClassroom(state,s.end);assert.equal(state.phase,'question');
   const correct=answerCheckpoint(state,q.answer);assert.equal(correct.correct,true);assert.equal(state.phase,'correct');
   assert.equal(answerCheckpoint(state,q.answer),null,'Double taps must not count twice');
   const afterCorrect=createClassroomSession(lesson.id,track,classroomSnapshot(state));assert.equal(afterCorrect.phase,'correct');
   assert.equal(advanceClassroom(state,track.duration).position,s.gate,'Correct answer waits for explicit Continue');
   assert.equal(continueClassroom(state),true);assert.equal(state.answers[s.key].released,true);
  }else if(!nextCheckpoint(state)||s.start<nextCheckpoint(state).gate){advanceClassroom(state,s.start+.01);assert.equal(state.index,i);}
 }
 advanceClassroom(state,track.duration);assert.equal(state.phase,'complete');
 assert.equal(createClassroomSession(lesson.id,track,classroomSnapshot(state)).phase,'complete');
 // Backward seeking is allowed after completion, without awarding a new pass.
 advanceClassroom(state,0);assert.equal(state.index,0);assert.equal(state.phase,'listening');
}
assert.equal(cards,34);assert.equal(questions,17);
assert.throws(()=>buildTimeline('equations',{id:'equations',duration:1,segments:[]}));
for(let i=0;i<500;i++){
 const lesson=AUDIO_LESSONS[i%AUDIO_LESSONS.length],track=manifest.tracks.find(t=>t.id===lesson.id),state=createClassroomSession(lesson.id,track);
 const gate=nextCheckpoint(state);
 const result=advanceClassroom(state,(Math.random()*2-.3)*track.duration);
 assert.ok(result.position>=0&&result.position<=gate.gate);
 if(result.position===gate.gate)assert.equal(state.phase,'question');
}
console.log(`OK: ${cards} timed cards, ${questions} multiple-choice checkpoints, hints/retries, explicit continuation, resume, replay, final completion, and 500 random seek checks.`);
