import assert from 'node:assert/strict';
import {makeEquation,EQUATIONS,makeTransaction,TRANSACTIONS,generate,isCorrect,record,selectQuestion} from '../js/mastery-engine.js';
import {UNITS,AUDIO_LESSONS} from '../js/mastery-content.js';
let count=0;
for(const [id,spec] of Object.entries(EQUATIONS))for(let missing=0;missing<spec.labels.length;missing++)for(let repeat=0;repeat<100;repeat++){
 const q=makeEquation(id,missing),v=q.values,end=v.at(-1);
 assert.equal(v.slice(0,-1).reduce((s,x,i)=>s+x*spec.signs[i],0),end);
 const solved=missing===v.length-1?v.slice(0,-1).reduce((s,x,i)=>s+x*spec.signs[i],0):(end-v.slice(0,-1).reduce((s,x,i)=>s+(i===missing?0:x*spec.signs[i]),0))/spec.signs[missing];
 assert.ok(q.stages.at(-1).answer===solved);assert.equal(generate(id,q.pattern).missing,missing);
 assert.ok(isCorrect(q.stages.at(-1),String(solved)));assert.ok(!isCorrect(q.stages.at(-1),''));
 for(const stage of q.stages)if(stage.options)assert.ok(stage.options.includes(stage.answer));count++;
}
for(const t of TRANSACTIONS)for(let i=0;i<40;i++){const q=makeTransaction(t[0]);assert.equal(q.entry.reduce((sum,e)=>sum+(e.side==='Debit'?e.amount:-e.amount),0),0);assert.equal(q.pattern,'transactions:'+t[0]);for(const s of q.stages)assert.ok(s.options.includes(s.answer));count++;}
for(const unit of UNITS)for(let i=0;i<100;i++){const q=generate(unit.id);for(const s of q.stages){assert.notEqual(s.answer,undefined);assert.ok(typeof s.answer!=='number'||Number.isFinite(s.answer));if(s.options)assert.ok(s.options.includes(s.answer));}count++;}
for(const pattern of ['ending-liabilities','beginning-liabilities','income','investment'])for(let i=0;i<50;i++){
 const q=generate('bridge','bridge:'+pattern),numbers=[...q.prompt.matchAll(/(−)?\$([\d,]+)/g)].map(m=>(m[1]?-1:1)*Number(m[2].replaceAll(',','')));let expected;
 if(pattern==='ending-liabilities'){const [a,l,invest,income,w,ea]=numbers;expected=ea-(a-l+invest+income-w);}
 if(pattern==='beginning-liabilities'){const [ea,el,invest,income,w,a]=numbers;expected=a-(ea-el-invest-income+w);}
 if(pattern==='income'){const [a,l,ea,el,w,invest]=numbers;expected=(ea-el)-(a-l)-invest+w;}
 if(pattern==='investment'){const [a,l,ea,el,w,income]=numbers;expected=(ea-el)-(a-l)-income+w;}
 assert.equal(q.stages.at(-1).answer,expected);count++;
}
const p={patterns:{}},q=makeEquation('supplies',0),now=1000;
assert.equal(record(p,q,false,now).due,now);assert.equal(record(p,q,true,now).due,now+300000);assert.equal(record(p,q,true,now).due,now+86400000);assert.equal(record(p,q,false,now).run,0);
assert.equal(isCorrect({answer:0},''),false);assert.equal(isCorrect({answer:0},'$'),false);assert.equal(isCorrect({answer:0},'0'),true);assert.equal(isCorrect({answer:-3000},'−$3,000'),true);assert.equal(isCorrect({answer:1},'0x1'),false);
for(const l of AUDIO_LESSONS)for(const s of l.segments){assert.ok(s.text.length<=3900);assert.ok(!s.pause||s.pause<=10);}
console.log(`OK: ${count} Academy questions across every equation variable, transaction type, and multi-step direction; scoring and spaced review verified.`);
