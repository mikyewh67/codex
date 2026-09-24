import {
  generateForSection, generateByGenerator, gradeQuestion, buildPracticeTest,
  expectedAnswerText, engineInternals
} from '../js/question-engine.js';
import { SECTIONS } from '../js/course-data.js';

function correctResponse(q){
  if(q.type==='mcq') return q.answer;
  if(q.type==='numeric') return String(q.answer);
  if(q.type==='multi') return q.items.map(x=>x.answer);
  if(q.type==='journal') return q.expected.map(x=>({...x}));
  if(q.type==='summary') return Object.fromEntries(q.fields.map(f=>[f.key,String(f.answer)]));
  if(q.type==='journalSet') return q.entries.map(e=>e.expected.map(x=>({...x})));
  throw new Error(`Unknown type ${q.type}`);
}

let count=0;
for(const s of SECTIONS){
  for(let i=0;i<100;i++){
    const q=generateForSection(s.id);
    const g=gradeQuestion(q,correctResponse(q));
    if(!g.correct) throw new Error(`Correct response failed: ${s.id} ${q.generator} ${expectedAnswerText(q)}`);
    if(q.section!==s.id) throw new Error(`Section mismatch ${s.id} vs ${q.section}`);
    count++;
  }
}

for(const generator of [
  'balance-ar','balance-ap','balance-supplies','missing-ap-payments','missing-supplies-beginning','missing-ar-collections',
  'normal-balance','journal-owner-invest','effect-borrow','trial-summary','test-journal-set'
]){
  const q=generateByGenerator(generator);
  if(!gradeQuestion(q,correctResponse(q)).correct) throw new Error(`Remediation generator failed ${generator}`);
}

const test=buildPracticeTest();
if(test.length!==15) throw new Error(`Expected 15 questions, got ${test.length}`);
const points=test.reduce((s,x)=>s+x.points,0);
if(points!==31) throw new Error(`Expected 31 points, got ${points}`);
const max=test.reduce((s,x)=>s+gradeQuestion(x.q,correctResponse(x.q)).max,0);
if(max!==31) throw new Error(`Grading max should equal 31, got ${max}`);
console.log(`OK: ${count} generated practice questions + remediation families + 31-point practice test.`);
