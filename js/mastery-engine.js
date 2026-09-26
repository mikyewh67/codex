import { UNITS } from './mastery-content.js';
export const choose = a => a[Math.floor(Math.random()*a.length)];
export const shuffle = a => [...a].sort(()=>Math.random()-.5);
const n = (lo=2,hi=60) => (lo+Math.floor(Math.random()*(hi-lo+1)))*100;
export const cash = x => (x<0?'−$':'$')+Math.abs(x).toLocaleString('en-US');
const mc = (prompt,answer,others,why) => ({prompt,answer,options:shuffle([...new Set([answer,...others])]),why});
const num = (prompt,answer,why) => ({prompt,answer,why});
export const EQUATIONS = {
 balance:{labels:['Liabilities','Equity','Assets'],signs:[1,1],values:()=>{let l=n(),e=n();return [l,e,l+e];}},
 income:{labels:['Revenue','Expenses','Net Income'],signs:[1,-1],values:()=>{let r=n(),e=n();return [r,e,r-e];}},
 equity:{labels:['Beginning Equity','Investment','Income','Withdrawals','Ending Equity'],signs:[1,1,1,-1],values:()=>{let b=n(40,200),i=n(0,30),p=n(-20,50),w=n(0,30);return [b,i,p,w,b+i+p-w];}},
 supplies:{labels:['Beginning Supplies','Purchases','Supplies Used','Ending Supplies'],signs:[1,1,-1]},
 receivables:{labels:['Beginning Accounts Receivable','Sales on Account','Collections','Ending Accounts Receivable'],signs:[1,1,-1]},
 payables:{labels:['Beginning Accounts Payable','Purchases on Account','Payments','Ending Accounts Payable'],signs:[1,1,-1]}
};
function rollValues(){const b=n(10,50),i=n(10,70),d=n(0,(b+i)/100);return [b,i,d,b+i-d];}
function equationText(labels,signs){return labels.slice(0,-1).map((s,i)=>(i?(signs[i]>0?' + ':' − '):'')+s).join('')+' = '+labels.at(-1);}
function symbolicValue(v){return v<0?'('+v.toLocaleString('en-US')+')':v.toLocaleString('en-US');}
export function makeEquation(id,missing){
 const spec=EQUATIONS[id], values=spec.values?spec.values():rollValues();
 missing=missing??Math.floor(Math.random()*spec.labels.length);
 const last=values.length-1,target=spec.labels[missing], original=equationText(spec.labels,spec.signs);
 const terms=spec.labels.map((label,i)=>({label,value:values[i],unknown:i===missing}));
 const unknownRow=values.map((v,i)=>i===missing?'?':symbolicValue(v));
 const substituted=equationText(unknownRow,spec.signs);
 const steps=[]; let operation, why, wrong;
 if(missing===last){
  operation='Calculate the left side as written'; why='The ending result is already alone. Add the increases and subtract the decreases.';
  wrong=['Reverse every sign','Subtract the beginning from the ending'];
  steps.push({action:'Use the original equation.',equation:substituted});
 }else if(spec.signs[missing]===-1){
  operation='Add '+target+' to BOTH sides, then subtract '+spec.labels[last];
  why='The missing amount has a minus sign. Adding it to both sides cancels the negative term and puts a positive '+target+' on the right. Then subtract the ending result from both sides.';
  wrong=['Subtract '+target+' from BOTH sides','Change every number to a negative'];
  const rest=values.slice(0,last).filter((_,i)=>i!==missing).reduce((sum,v,j)=>sum+v,0);
  steps.push({action:'Write the original equation with the missing amount.',equation:substituted});
  steps.push({action:'Add '+target+' to BOTH sides.',equation:rest.toLocaleString()+' = '+symbolicValue(values[last])+' + '+target});
  steps.push({action:'Subtract '+spec.labels[last]+' from BOTH sides.',equation:target+' = '+rest.toLocaleString()+' − '+symbolicValue(values[last])+' = '+symbolicValue(values[missing])});
 }else{
  const others=spec.labels.slice(0,last).map((label,i)=>({label,i})).filter(x=>x.i!==missing);
  operation=others.map(x=>(spec.signs[x.i]===1?'Subtract ':'Add ')+x.label).join('; ')+' on BOTH sides';
  why='Undo each known term next to the missing amount: subtract a term that is added, and add a term that is subtracted. Do it on BOTH sides to preserve equality.';
  wrong=['Keep all known terms on the same side unchanged','Reverse the sign of only the answer'];
  let right=values[last], left=[...others];
  steps.push({action:'Write the original equation.',equation:substituted});
  for(const term of others){
   right-=spec.signs[term.i]*values[term.i]; left=left.filter(x=>x.i!==term.i);
   steps.push({action:(spec.signs[term.i]>0?'Subtract ':'Add ')+term.label+' ('+cash(values[term.i])+') on BOTH sides.',equation:target+left.map(x=>(spec.signs[x.i]>0?' + ':' − ')+symbolicValue(values[x.i])).join('')+' = '+symbolicValue(right)});
  }
 }
 const check=equationText(values.map(symbolicValue),spec.signs);
 steps.push({action:'Put the answer back into the ORIGINAL equation.',equation:check});
 const calc=spec.labels.filter((_,i)=>i!==missing).map((label)=>{let i=spec.labels.indexOf(label);return label+': '+cash(values[i]);}).join('. ')+'. Find '+target+'.';
 return {unit:id,pattern:id+':'+missing,title:'Find '+target,prompt:calc,terms,visual:substituted,original,worked:steps,values,missing,signs:spec.signs,check,
  stages:[mc('Which starting equation fits this story?',original,UNITS.filter(u=>EQUATIONS[u.id]&&u.id!==id).slice(0,2).map(u=>u.formula),'Start with the equation that describes this account or relationship.'),
   mc('Which amount must be alone?',target,spec.labels.filter((_,i)=>i!==missing).slice(0,3),'The question asks for '+target+'. That is your target.'),
   mc('How do you isolate it?',operation,wrong,why),num('Calculate '+target+'.',values[missing],steps.map(x=>x.action+' '+x.equation).join('\n'))]};
}
// Each transaction stores its full balanced journal entry and financial-position effects.
export const TRANSACTIONS = [
 ['invest','The owner invests {a} cash.','Assets increase; equity increases',[['Cash','Debit'],['Capital','Credit']],'Owner investment increases capital, not revenue.'],
 ['borrow','The business borrows {a} cash by signing a note.','Assets increase; liabilities increase',[['Cash','Debit'],['Notes Payable','Credit']],'Borrowing creates a debt. It is not revenue.'],
 ['cash-supplies','The business buys {a} of unused supplies for cash.','Total assets stay the same; liabilities and equity stay the same',[['Supplies','Debit'],['Cash','Credit']],'One asset replaces another. Supplies is an asset until used.'],
 ['credit-supplies','The business buys {a} of unused supplies on account.','Assets increase; liabilities increase',[['Supplies','Debit'],['Accounts Payable','Credit']],'You own supplies and owe the supplier.'],
 ['pay','The business pays {a} on an existing account payable.','Assets decrease; liabilities decrease',[['Accounts Payable','Debit'],['Cash','Credit']],'An old liability is reduced. Do not record the original expense again.'],
 ['cash-revenue','The business performs a service and receives {a} cash immediately.','Assets increase; equity increases',[['Cash','Debit'],['Fees Earned','Credit']],'The service is performed, so revenue is earned now.'],
 ['credit-revenue','The business performs a service for {a} on account.','Assets increase; equity increases',[['Accounts Receivable','Debit'],['Fees Earned','Credit']],'The customer owes you. Revenue is earned even though cash has not arrived.'],
 ['collect','The business collects {a} from a customer on an existing account receivable.','Total assets stay the same; liabilities and equity stay the same',[['Cash','Debit'],['Accounts Receivable','Credit']],'Cash replaces a receivable. Revenue was recorded earlier.'],
 ['rent','The business pays {a} for this month’s rent expense.','Assets decrease; equity decreases',[['Rent Expense','Debit'],['Cash','Credit']],'The expense account increases with a debit. The expense reduces equity.'],
 ['expense-credit','The business incurs {a} of advertising expense and will pay next month.','Liabilities increase; equity decreases',[['Advertising Expense','Debit'],['Accounts Payable','Credit']],'Expense occurs now. The unpaid obligation creates a liability.'],
 ['withdraw','The owner withdraws {a} cash for personal use.','Assets decrease; equity decreases',[['Withdrawals','Debit'],['Cash','Credit']],'Owner withdrawals are not business expenses.'],
 ['advance','A customer pays {a} before any service is performed.','Assets increase; liabilities increase',[['Cash','Debit'],['Unearned Revenue','Credit']],'You owe the customer a service. This is a liability until earned.'],
 ['earned-advance','The business completes {a} of services paid for in advance.','Liabilities decrease; equity increases',[['Unearned Revenue','Debit'],['Fees Earned','Credit']],'The obligation is fulfilled. Now the revenue is earned.'],
 ['used','The business uses {a} of supplies already on hand.','Assets decrease; equity decreases',[['Supplies Expense','Debit'],['Supplies','Credit']],'Using supplies reduces the asset and creates an expense.'],
 ['loan-payment','The business repays {a} of note principal, with no interest included.','Assets decrease; liabilities decrease',[['Notes Payable','Debit'],['Cash','Credit']],'Principal repayment reduces the note. It is not an interest expense.'],
 ['compound','The business buys equipment for {a}, pays {b} cash, and owes the remaining {c} on account.','Net assets increase; liabilities increase',[['Equipment','Debit'],['Cash','Credit'],['Accounts Payable','Credit']],'Record the full equipment cost. The cash payment and payable together equal that cost.']
];
export function makeTransaction(kind){
 const t=TRANSACTIONS.find(t=>t[0]===kind)||choose(TRANSACTIONS),amount=n(10,200),paid=Math.round(amount*.4),owed=amount-paid;
 const entry=t[3].map(([account,side],i)=>({account,side,amount:t[0]==='compound'?(i===0?amount:i===1?paid:owed):amount}));
 const accounts=entry.map(e=>e.account).join(' + '),journal=entry.map(e=>e.side+' '+e.account+' '+cash(e.amount)).join('; ');
 const reversed=entry.map(e=>(e.side==='Debit'?'Credit':'Debit')+' '+e.account+' '+cash(e.amount)).join('; ');
 const prompt=t[1].replace('{a}',cash(amount)).replace('{b}',cash(paid)).replace('{c}',cash(owed));
 const wrongEntries=['Debit Cash '+cash(amount)+'; Credit Fees Earned '+cash(amount),'Debit Rent Expense '+cash(amount)+'; Credit Cash '+cash(amount),'Debit Accounts Payable '+cash(amount)+'; Credit Cash '+cash(amount)].filter(x=>x!==journal);
 return {unit:'transactions',pattern:'transactions:'+t[0],title:'Analyze the transaction',prompt,entry,visual:t[0]==='compound'?'Equipment +'+cash(amount)+' · Cash −'+cash(paid)+' · Debt +'+cash(owed):'',worked:[{action:'Financial position',equation:t[2]},{action:'Accounts',equation:accounts},{action:'Balanced entry',equation:journal},{action:'Why',equation:t[4]}],stages:[
 mc('1. How does financial position change?',t[2],shuffle(TRANSACTIONS.map(x=>x[2]).filter(x=>x!==t[2])).slice(0,4),t[4]),
 mc('2. Which accounts are affected?',accounts,shuffle(TRANSACTIONS.map(x=>x[3].map(e=>e[0]).join(' + ')).filter(x=>x!==accounts)).slice(0,3),t[4]),
 mc('3. Which journal entry records it?',journal,[reversed,...wrongEntries.slice(0,2)],t[4]+' Total debits must equal total credits.') ]};
}
export function makeBridge(kind){
 kind=kind||choose(['ending-liabilities','beginning-liabilities','income','investment']);
 const b=n(50,150),l=n(10,50),i=n(0,30),income=n(-20,60),w=n(0,30),e=b+i+income-w,el=n(10,50),a=b+l,ea=e+el;
 const common='Investment: '+cash(i)+'. Income: '+cash(income)+'. Withdrawals: '+cash(w)+'. ';
 let prompt,stages;
 if(kind==='ending-liabilities'){
  prompt='Beginning assets: '+cash(a)+'. Beginning liabilities: '+cash(l)+'. '+common+'Ending assets: '+cash(ea)+'. Find ending liabilities.';
  stages=[num('Find beginning equity.',b,`${cash(a)} − ${cash(l)} = ${cash(b)}. Use beginning assets and beginning liabilities.`),num('Find ending equity.',e,`${cash(b)} + ${cash(i)} + (${cash(income)}) − ${cash(w)} = ${cash(e)}.`),num('Find ending liabilities.',el,`${cash(ea)} − ${cash(e)} = ${cash(el)}. Use ENDING equity here.`)];
 }else if(kind==='beginning-liabilities'){
  prompt='Ending assets: '+cash(ea)+'. Ending liabilities: '+cash(el)+'. '+common+'Beginning assets: '+cash(a)+'. Find beginning liabilities.';
  stages=[num('Find ending equity.',e,`${cash(ea)} − ${cash(el)} = ${cash(e)}.`),num('Work backward to beginning equity.',b,`${cash(e)} − ${cash(i)} − (${cash(income)}) + ${cash(w)} = ${cash(b)}. Undo investment and income; add back withdrawals.`),num('Find beginning liabilities.',l,`${cash(a)} − ${cash(b)} = ${cash(l)}. Use BEGINNING equity here.`)];
 }else{
  const target=kind==='income'?'Income':'Investment';
  prompt=`Beginning assets: ${cash(a)}. Beginning liabilities: ${cash(l)}. Ending assets: ${cash(ea)}. Ending liabilities: ${cash(el)}. Withdrawals: ${cash(w)}. ${kind==='income'?'Investment: '+cash(i):'Income: '+cash(income)}. Find ${target.toLowerCase()}.`;
  stages=[num('Find beginning equity.',b,`${cash(a)} − ${cash(l)} = ${cash(b)}.`),num('Find ending equity.',e,`${cash(ea)} − ${cash(el)} = ${cash(e)}.`),num('Find '+target.toLowerCase()+'.',kind==='income'?income:i,kind==='income'?`${cash(e)} − ${cash(b)} − ${cash(i)} + ${cash(w)} = ${cash(income)}. A negative result is a loss.`:`${cash(e)} − ${cash(b)} − (${cash(income)}) + ${cash(w)} = ${cash(i)}.`)];
 }
 return {unit:'bridge',pattern:'bridge:'+kind,title:'Connect the equations',prompt,stages,worked:stages.map(s=>({action:s.prompt,equation:s.why}))};
}
const NORMAL=[['Cash','Asset','Debit'],['Accounts Receivable','Asset','Debit'],['Supplies','Asset','Debit'],['Equipment','Asset','Debit'],['Accounts Payable','Liability','Credit'],['Notes Payable','Liability','Credit'],['Unearned Revenue','Liability','Credit'],['Capital','Equity','Credit'],['Fees Earned','Revenue','Credit'],['Rent Expense','Expense','Debit'],['Withdrawals','Withdrawal','Debit']];
function makeNormal(kind){const item=NORMAL.find(x=>x[0]===kind)||choose(NORMAL);return {unit:'normal',pattern:'normal:'+item[0],title:'Name the account, then its side',prompt:'Think about the '+item[0]+' account.',stages:[mc('What kind of account is it?',item[1],['Asset','Liability','Equity','Revenue','Expense','Withdrawal'].filter(x=>x!==item[1]),'Classify the account before choosing a side.'),mc('Which side INCREASES this account?',item[2],['Debit','Credit'].filter(x=>x!==item[2]),item[0]+' increases with a '+item[2].toLowerCase()+'. This is its normal balance side.')],worked:[{action:'Rule',equation:item[0]+' is a '+item[1].toLowerCase()+' account and increases with a '+item[2].toLowerCase()+'.'}]};}
function makeLedger(kind){const credit=kind?kind==='credit':Math.random()<.5,b=n(0,30),debits=n(0,60),credits=n(0,60);const signed=(credit?-b:b)+debits-credits,side=signed===0?'Zero balance':signed>0?'Debit':'Credit';return {unit:'ledger',pattern:'ledger:'+(credit?'credit':'debit'),title:'Find the actual ledger balance',prompt:`${credit?'Accounts Payable':'Cash'} begins with a ${cash(b)} ${credit?'credit':'debit'} balance. Debits during the period: ${cash(debits)}. Credits: ${cash(credits)}.`,stages:[num('What is the ending balance AMOUNT? Enter a positive amount.',Math.abs(signed),'Total debit amounts minus total credit amounts = '+cash(signed)+'. Report the magnitude separately from its side.'),mc('Which side is the ACTUAL ending balance on?',side,['Debit','Credit','Zero balance'].filter(x=>x!==side),signed===0?'Debits equal credits; there is no remaining balance.':(signed>0?'Debits':'Credits')+' exceed the other side. An actual balance can be different from the normal balance.')],worked:[{action:'Compare totals',equation:`Debits ${cash(debits+(credit?0:b))}; credits ${cash(credits+(credit?b:0))}. Ending: ${cash(Math.abs(signed))} ${side.toLowerCase()}.`}]};}
function makeTrial(kind){
 kind=kind||choose(['purpose','error','statements']);
 if(kind==='statements'){let revenue=n(50,120),expense=n(10,60),b=n(30,90),invest=n(0,30),w=n(0,20),income=revenue-expense,e=b+invest+income-w;return {unit:'trial',pattern:'trial:statements',title:'Carry the result to the next statement',prompt:`Revenue ${cash(revenue)}. Expenses ${cash(expense)}. Beginning equity ${cash(b)}. Investment ${cash(invest)}. Withdrawals ${cash(w)}.`,stages:[num('What income goes from the income statement to the equity statement?',income,'Revenue minus expenses = '+cash(income)+'.'),num('What ending equity goes to the balance sheet?',e,'Beginning equity + investment + income − withdrawals = '+cash(e)+'.')],worked:[{action:'Statement order',equation:'Income statement → equity statement → balance sheet.'}]};}
 const s=kind==='purpose'?mc('What is the primary purpose of a trial balance?','Check whether ledger debit balances equal credit balances',['Prove all transactions were recorded correctly','Calculate the cash collected from customers'],'A trial balance verifies arithmetic equality. It does not detect every accounting error.'):mc('Which error can leave the trial balance balanced?','An entire balanced journal entry was omitted',['Only the debit side of a $500 entry was posted','A $500 debit was posted as $50 while the credit stayed $500'],'Omitting both sides leaves totals equal even though the records are incomplete.');return {unit:'trial',pattern:'trial:'+kind,title:'What a trial balance tells you',prompt:'Think about what equality of debits and credits actually proves.',stages:[s],worked:[{action:'Remember',equation:s.why}]};
}
export function generate(unit,pattern){const part=pattern?.split(':').slice(1).join(':');if(EQUATIONS[unit])return makeEquation(unit,part!==undefined?Number(part):undefined);if(unit==='transactions')return makeTransaction(part);if(unit==='bridge')return makeBridge(part);if(unit==='normal')return makeNormal(part);if(unit==='ledger')return makeLedger(part);return makeTrial(part);}
export function isCorrect(stage,input){if(typeof stage.answer==='number'){if(typeof input!=='string'||!input.trim())return false;const cleaned=input.trim().replace(/[$,\s]/g,'').replace(/−/g,'-');if(!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(cleaned))return false;return Math.abs(Number(cleaned)-stage.answer)<.005;}return input===stage.answer;}
export function record(progress,q,clean,now=Date.now()){
 const p=progress.patterns[q.pattern]||{unit:q.unit,attempts:0,correct:0,run:0,due:0};p.attempts++;p.correct+=clean?1:0;p.run=clean?p.run+1:0;p.due=clean?now+[5*60000,86400000,3*86400000,7*86400000][Math.min(p.run-1,3)]:now;p.last=now;progress.patterns[q.pattern]=p;return p;
}
export function selectQuestion(progress,unit){
 const allowed=unit?[unit]:UNITS.map(u=>u.id),due=Object.entries(progress.patterns).filter(([,p])=>allowed.includes(p.unit)&&p.due<=Date.now()).sort((a,b)=>a[1].run-b[1].run||a[1].due-b[1].due);
 if(due.length&&Math.random()<.7){const [pattern,p]=due[0];return generate(p.unit,pattern);}
 const weighted=allowed.flatMap(id=>{const seen=Object.values(progress.patterns).filter(p=>p.unit===id),avg=seen.length?seen.reduce((s,p)=>s+p.run,0)/seen.length:0;return Array(Math.max(1,5-Math.floor(avg))).fill(id);});return generate(choose(weighted));
}
