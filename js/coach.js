
const app = document.querySelector("#coachApp");
const toastEl = document.querySelector("#coachToast");
const nav = Array.from(document.querySelectorAll(".coach-nav [data-view]"));
const countdown = document.querySelector("#testCountdown");
const STORE = "ledger-four-day-coach-v1";
const TEST = new Date(2026, 8, 29);

function defaultState(){
  return {
    total:0,
    correct:0,
    streak:0,
    bestStreak:0,
    mastery:{equations:0,transactions:0,debits:0,ledger:0,trial:0},
    dayStats:{
      1:{attempts:0,correct:0},
      2:{attempts:0,correct:0},
      3:{attempts:0,correct:0},
      4:{attempts:0,correct:0}
    },
    mistakes:[],
    voiceRate:1,
    selectedLesson:0
  };
}
function load(){
  try{
    const raw=JSON.parse(localStorage.getItem(STORE)||"null");
    const base=defaultState();
    if(!raw) return base;
    return Object.assign({},base,raw,{
      mastery:Object.assign({},base.mastery,raw.mastery||{}),
      dayStats:Object.assign({},base.dayStats,raw.dayStats||{})
    });
  }catch(e){return defaultState();}
}
let state=load();
let view="home";
let practice={mode:"mixed",question:null,submitted:false,grade:null,hint:0,answered:0,correct:0,day:null,reinforce:[]};
let selectedLesson=state.selectedLesson||0;

function save(){localStorage.setItem(STORE,JSON.stringify(state));}
function esc(v){return String(v==null?"":v).replace(/[&<>'"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c];});}
function fmt(n){return Number(n).toLocaleString("en-US");}
function money(min,max,step){
  step=step||100;
  return min+Math.floor(Math.random()*((max-min)/step+1))*step;
}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function shuffle(a){
  const out=a.slice();
  for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=out[i];out[i]=out[j];out[j]=t;}
  return out;
}
function toast(text){
  toastEl.textContent=text;
  toastEl.classList.add("show");
  clearTimeout(toast._t);
  toast._t=setTimeout(function(){toastEl.classList.remove("show");},2400);
}
function setCountdown(){
  const now=new Date();
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const d=Math.ceil((TEST-today)/86400000);
  if(d>1) countdown.textContent=d+" days · Sep 29";
  else if(d===1) countdown.textContent="Tomorrow · Sep 29";
  else if(d===0) countdown.textContent="Test day · Sep 29";
  else countdown.textContent="Test #1 · Sep 29";
}
setCountdown();

const LESSONS=[
  {
    title:"Equation manipulation without guessing",
    subtitle:"The exact rule for knowing what to add or subtract.",
    steps:[
      "<b>1. Write the original equation first.</b> Do not start moving numbers yet. For equity, write Beginning Equity + Investment + Income − Withdrawals = Ending Equity.",
      "<b>2. Point to the missing item.</b> Your whole goal is to get that item by itself. Everything else is known information.",
      "<b>3. Undo what is being done to the missing item.</b> If a known amount is being added on the same side, subtract it from the other side. If it is being subtracted, add it to the other side.",
      "<b>4. Use the same roll-forward pattern for Supplies, Accounts Receivable, and Accounts Payable.</b> Beginning + increases − decreases = Ending.",
      "<b>5. Example: Beginning Supplies + Purchases − Supplies Used = Ending Supplies.</b> To solve beginning supplies: Ending − Purchases + Supplies Used. Another way to say it is Ending + Used − Purchases.",
      "<b>6. Check your answer by plugging it back into the original equation.</b> If the left side equals the right side, your manipulation worked."
    ]
  },
  {
    title:"Transaction analysis: the 3-pass method",
    subtitle:"Stop jumping straight to debit and credit.",
    steps:[
      "<b>Pass 1 — Financial position.</b> Ask what increases or decreases: Assets, Liabilities, or Equity.",
      "<b>Pass 2 — Name the accounts.</b> Collection on account means Cash increases and Accounts Receivable decreases. Payment on account means Accounts Payable decreases and Cash decreases.",
      "<b>Pass 3 — Debit and credit.</b> Only after you know the account type and direction should you decide the side.",
      "<b>Remember debit-normal accounts:</b> Assets, Expenses, Withdrawals. They increase with a debit and decrease with a credit.",
      "<b>Remember credit-normal accounts:</b> Liabilities, Capital, Revenues. They increase with a credit and decrease with a debit.",
      "<b>Final check:</b> Total debits must equal total credits. If they do not, the entry is incomplete."
    ]
  },
  {
    title:"The account-balance equations that keep showing up",
    subtitle:"Supplies, A/R, A/P, and ledger balances are the same idea.",
    steps:[
      "<b>Every balance problem is a beginning-to-ending story.</b> Start with what you had, add what increased it, subtract what decreased it, and you get the ending balance.",
      "<b>Supplies:</b> Beginning Supplies + Purchases − Supplies Used = Ending Supplies.",
      "<b>Accounts Receivable:</b> Beginning A/R + Sales on Account − Collections = Ending A/R.",
      "<b>Accounts Payable:</b> Beginning A/P + Purchases on Account − Payments = Ending A/P.",
      "<b>Debit-normal ledger account:</b> Beginning + Debits − Credits = Ending.",
      "<b>Credit-normal ledger account:</b> Beginning + Credits − Debits = Ending. The pattern flips because credits are the increase side."
    ]
  },
  {
    title:"Test-day pattern recognition",
    subtitle:"What to recognize before you calculate.",
    steps:[
      "<b>If the question says “on account,” think receivable or payable.</b> Revenue on account creates Accounts Receivable. A purchase or expense on account usually creates Accounts Payable.",
      "<b>If it says “collection on account,” it is not new revenue.</b> Debit Cash and credit Accounts Receivable.",
      "<b>If it says “payment on account,” it is not a new expense.</b> Debit Accounts Payable and credit Cash.",
      "<b>If a customer pays before work is done, that is Unearned Revenue.</b> Cash increases and a liability increases.",
      "<b>If total debits and total credits are being verified, that is a trial balance.</b> A trial balance can still balance even when some errors exist.",
      "<b>When stuck, slow the question down.</b> Write the base equation or name the two accounts before touching the answer choices."
    ]
  }
];

const FORMULAS=[
  ["Accounting equation","Assets = Liabilities + Equity","Equity = Assets − Liabilities; Liabilities = Assets − Equity."],
  ["Income","Revenue − Expenses = Net Income","Revenue = Income + Expenses; Expenses = Revenue − Income."],
  ["Owner's equity","Beginning Equity + Investment + Income − Withdrawals = Ending Equity","Solve the missing item by undoing the known terms."],
  ["Supplies","Beginning Supplies + Purchases − Used = Ending Supplies","Beginning = Ending − Purchases + Used."],
  ["Accounts Receivable","Beginning A/R + Sales on Account − Collections = Ending A/R","Collections = Beginning + Sales − Ending."],
  ["Accounts Payable","Beginning A/P + Purchases on Account − Payments = Ending A/P","Payments = Beginning + Purchases − Ending."],
  ["Debit-normal ledger","Beginning + Debits − Credits = Ending","Assets, Expenses, Withdrawals."],
  ["Credit-normal ledger","Beginning + Credits − Debits = Ending","Liabilities, Capital, Revenues."],
  ["Normal balances","Debit: Assets, Expenses, Withdrawals","Credit: Liabilities, Capital, Revenues."],
  ["Trial balance","Total debit balances = Total credit balances","Used to verify the ledger is arithmetically in balance."]
];

const TX=[
  {
    label:"Owner invests cash in the business",
    text:function(n){return "The owner invests $"+fmt(n)+" cash in the business.";},
    effect:"Assets increase; Equity increases",
    accounts:"Cash and Capital",
    entry:"Dr Cash; Cr Capital",
    explain:"Cash is an asset and increases. Capital is equity and increases."
  },
  {
    label:"Borrow cash from bank",
    text:function(n){return "The business borrows $"+fmt(n)+" from a bank by signing a note.";},
    effect:"Assets increase; Liabilities increase",
    accounts:"Cash and Notes Payable",
    entry:"Dr Cash; Cr Notes Payable",
    explain:"Cash increases and the business creates a liability."
  },
  {
    label:"Buy supplies for cash",
    text:function(n){return "The business buys $"+fmt(n)+" of supplies for cash.";},
    effect:"One asset increases; another asset decreases",
    accounts:"Supplies and Cash",
    entry:"Dr Supplies; Cr Cash",
    explain:"Supplies increases while Cash decreases. Total assets may stay the same."
  },
  {
    label:"Buy supplies on account",
    text:function(n){return "The business buys $"+fmt(n)+" of supplies on account.";},
    effect:"Assets increase; Liabilities increase",
    accounts:"Supplies and Accounts Payable",
    entry:"Dr Supplies; Cr Accounts Payable",
    explain:"Supplies increases and a payable is created."
  },
  {
    label:"Pay an account payable",
    text:function(n){return "The business pays $"+fmt(n)+" cash on an existing account payable.";},
    effect:"Assets decrease; Liabilities decrease",
    accounts:"Accounts Payable and Cash",
    entry:"Dr Accounts Payable; Cr Cash",
    explain:"This is payment of an old liability, not a new expense."
  },
  {
    label:"Earn revenue for cash",
    text:function(n){return "The business earns $"+fmt(n)+" of service revenue and receives cash immediately.";},
    effect:"Assets increase; Equity increases",
    accounts:"Cash and Service Revenue",
    entry:"Dr Cash; Cr Service Revenue",
    explain:"Cash increases and earned revenue increases equity."
  },
  {
    label:"Earn revenue on account",
    text:function(n){return "The business earns $"+fmt(n)+" of service revenue on account.";},
    effect:"Assets increase; Equity increases",
    accounts:"Accounts Receivable and Service Revenue",
    entry:"Dr Accounts Receivable; Cr Service Revenue",
    explain:"The customer owes the business, so Accounts Receivable increases."
  },
  {
    label:"Collect on account",
    text:function(n){return "The business collects $"+fmt(n)+" cash from a customer on account.";},
    effect:"One asset increases; another asset decreases",
    accounts:"Cash and Accounts Receivable",
    entry:"Dr Cash; Cr Accounts Receivable",
    explain:"This converts receivable into cash. Do not record revenue again."
  },
  {
    label:"Pay an expense in cash",
    text:function(n){return "The business pays $"+fmt(n)+" cash for rent expense.";},
    effect:"Assets decrease; Equity decreases",
    accounts:"Rent Expense and Cash",
    entry:"Dr Rent Expense; Cr Cash",
    explain:"Expense increases with a debit and reduces equity; Cash decreases."
  },
  {
    label:"Incur expense on account",
    text:function(n){return "The business incurs $"+fmt(n)+" of advertising expense on account.";},
    effect:"Liabilities increase; Equity decreases",
    accounts:"Advertising Expense and Accounts Payable",
    entry:"Dr Advertising Expense; Cr Accounts Payable",
    explain:"The expense is recognized now and a liability is created."
  },
  {
    label:"Owner withdrawal",
    text:function(n){return "The owner withdraws $"+fmt(n)+" cash for personal use.";},
    effect:"Assets decrease; Equity decreases",
    accounts:"Withdrawals and Cash",
    entry:"Dr Withdrawals; Cr Cash",
    explain:"Withdrawals reduce owner equity but are not an expense."
  },
  {
    label:"Customer advance",
    text:function(n){return "A customer pays $"+fmt(n)+" cash before the business performs the service.";},
    effect:"Assets increase; Liabilities increase",
    accounts:"Cash and Unearned Revenue",
    entry:"Dr Cash; Cr Unearned Revenue",
    explain:"Cash is received before it is earned, so the credit is a liability."
  },
  {
    label:"Earn previously unearned revenue",
    text:function(n){return "The business completes $"+fmt(n)+" of work that was previously recorded as unearned revenue.";},
    effect:"Liabilities decrease; Equity increases",
    accounts:"Unearned Revenue and Service Revenue",
    entry:"Dr Unearned Revenue; Cr Service Revenue",
    explain:"The liability is reduced and the revenue is now earned."
  }
];

const NORMAL=[
  ["Cash","Asset","Debit"],["Accounts Receivable","Asset","Debit"],["Supplies","Asset","Debit"],
  ["Equipment","Asset","Debit"],["Accounts Payable","Liability","Credit"],["Notes Payable","Liability","Credit"],
  ["Unearned Revenue","Liability","Credit"],["Capital","Capital","Credit"],["Withdrawals","Withdrawal","Debit"],
  ["Service Revenue","Revenue","Credit"],["Rent Expense","Expense","Debit"],["Wages Expense","Expense","Debit"]
];

function base(family,skill,kind,prompt,formula,steps,hints){
  return {family:family,skill:skill,kind:kind,prompt:prompt,formula:formula||"",steps:steps||[],hints:hints||[]};
}

function genAccountingEquation(){
  const A=money(40000,180000,1000);
  const L=money(5000,A-5000,1000);
  const E=A-L;
  const missing=pick(["Assets","Liabilities","Equity"]);
  let q;
  if(missing==="Assets"){
    q=base("accounting-equation","equations","numeric",
      "Liabilities are $"+fmt(L)+" and equity is $"+fmt(E)+". What are total assets?",
      "Assets = Liabilities + Equity",
      ["Write A = L + E.","Substitute the known amounts: A = "+fmt(L)+" + "+fmt(E)+".","Add them to get $"+fmt(A)+"."],
      ["Assets are alone on the left, so you add liabilities and equity."]);
    q.answer=A;
  }else if(missing==="Liabilities"){
    q=base("accounting-equation","equations","numeric",
      "Assets are $"+fmt(A)+" and equity is $"+fmt(E)+". What are total liabilities?",
      "Assets = Liabilities + Equity",
      ["Write A = L + E.","You need L by itself, so subtract Equity from Assets.","L = "+fmt(A)+" − "+fmt(E)+" = $"+fmt(L)+"."],
      ["Liabilities = Assets − Equity."]);
    q.answer=L;
  }else{
    q=base("accounting-equation","equations","numeric",
      "Assets are $"+fmt(A)+" and liabilities are $"+fmt(L)+". What is total equity?",
      "Assets = Liabilities + Equity",
      ["Write A = L + E.","You need E by itself, so subtract Liabilities from Assets.","E = "+fmt(A)+" − "+fmt(L)+" = $"+fmt(E)+"."],
      ["Equity = Assets − Liabilities."]);
    q.answer=E;
  }
  q.answerLabel=missing;
  return q;
}

function genEquityEquation(){
  const beg=money(10000,90000,500);
  const invest=money(0,30000,500);
  const income=money(3000,45000,500);
  const wd=money(0,18000,500);
  const end=beg+invest+income-wd;
  const missing=pick(["Beginning Equity","Investment","Income","Withdrawals","Ending Equity"]);
  const vals={"Beginning Equity":beg,"Investment":invest,"Income":income,"Withdrawals":wd,"Ending Equity":end};
  let prompt="Beginning Equity $"+fmt(beg)+" + Investment $"+fmt(invest)+" + Income $"+fmt(income)+" − Withdrawals $"+fmt(wd)+" = Ending Equity $"+fmt(end)+".";
  prompt=prompt.replace("$"+fmt(vals[missing]),"?");
  const formulas={
    "Beginning Equity":"Beginning = Ending − Investment − Income + Withdrawals",
    "Investment":"Investment = Ending − Beginning − Income + Withdrawals",
    "Income":"Income = Ending − Beginning − Investment + Withdrawals",
    "Withdrawals":"Withdrawals = Beginning + Investment + Income − Ending",
    "Ending Equity":"Ending = Beginning + Investment + Income − Withdrawals"
  };
  const q=base("equity-equation","equations","numeric",
    "Solve for "+missing+": "+prompt,
    "Beginning Equity + Investment + Income − Withdrawals = Ending Equity",
    ["Write the full equity equation first.","Get "+missing+" by itself. Use the opposite operation when you move each known term.","Use: "+formulas[missing]+".","The answer is $"+fmt(vals[missing])+"."],
    ["Do not memorize a random sign flip. Isolate the missing item.","Withdrawals are subtracted in the original equation."]);
  q.answer=vals[missing];q.answerLabel=missing;
  return q;
}

function genIncomeEquation(){
  const expenses=money(10000,85000,1000);
  const income=money(2000,40000,1000);
  const revenue=expenses+income;
  const missing=pick(["Revenue","Expenses","Net Income"]);
  let answer=income,prompt="",step="";
  if(missing==="Revenue"){
    answer=revenue;prompt="Expenses were $"+fmt(expenses)+" and net income was $"+fmt(income)+". What was revenue?";
    step="Revenue = Income + Expenses = "+fmt(income)+" + "+fmt(expenses)+".";
  }else if(missing==="Expenses"){
    answer=expenses;prompt="Revenue was $"+fmt(revenue)+" and net income was $"+fmt(income)+". What were expenses?";
    step="Expenses = Revenue − Income = "+fmt(revenue)+" − "+fmt(income)+".";
  }else{
    answer=income;prompt="Revenue was $"+fmt(revenue)+" and expenses were $"+fmt(expenses)+". What was net income?";
    step="Income = Revenue − Expenses = "+fmt(revenue)+" − "+fmt(expenses)+".";
  }
  const q=base("income-equation","equations","numeric",prompt,"Revenue − Expenses = Net Income",
    ["Write Revenue − Expenses = Income.","Isolate "+missing+".",step,"Answer: $"+fmt(answer)+"."],
    ["Revenue is the amount earned. Expenses are subtracted to get income."]);
  q.answer=answer;q.answerLabel=missing;return q;
}

function genRollforward(){
  const type=pick(["Supplies","Accounts Receivable","Accounts Payable"]);
  const beg=money(2000,30000,100);
  const inc=money(8000,65000,100);
  const dec=money(4000,Math.min(beg+inc-500,55000),100);
  const end=beg+inc-dec;
  const missing=pick(["Beginning","Increase","Decrease","Ending"]);
  let names,formula;
  if(type==="Supplies"){names={Beginning:"Beginning Supplies",Increase:"Purchases",Decrease:"Supplies Used",Ending:"Ending Supplies"};formula="Beginning Supplies + Purchases − Supplies Used = Ending Supplies";}
  if(type==="Accounts Receivable"){names={Beginning:"Beginning A/R",Increase:"Sales on Account",Decrease:"Collections",Ending:"Ending A/R"};formula="Beginning A/R + Sales on Account − Collections = Ending A/R";}
  if(type==="Accounts Payable"){names={Beginning:"Beginning A/P",Increase:"Purchases on Account",Decrease:"Payments",Ending:"Ending A/P"};formula="Beginning A/P + Purchases on Account − Payments = Ending A/P";}
  const vals={Beginning:beg,Increase:inc,Decrease:dec,Ending:end};
  const parts=[
    names.Beginning+" $"+fmt(beg),
    names.Increase+" $"+fmt(inc),
    names.Decrease+" $"+fmt(dec),
    names.Ending+" $"+fmt(end)
  ];
  const idx=["Beginning","Increase","Decrease","Ending"].indexOf(missing);
  parts[idx]=names[missing]+" ?";
  let rearranged="";
  if(missing==="Beginning") rearranged=names.Beginning+" = "+names.Ending+" − "+names.Increase+" + "+names.Decrease;
  if(missing==="Increase") rearranged=names.Increase+" = "+names.Ending+" − "+names.Beginning+" + "+names.Decrease;
  if(missing==="Decrease") rearranged=names.Decrease+" = "+names.Beginning+" + "+names.Increase+" − "+names.Ending;
  if(missing==="Ending") rearranged=names.Ending+" = "+names.Beginning+" + "+names.Increase+" − "+names.Decrease;
  const q=base("rollforward-"+type.toLowerCase().replaceAll(" ","-"),"ledger","numeric",
    type+" balance problem: "+parts.join("; ")+". Find "+names[missing]+".",
    formula,
    ["Use the roll-forward pattern: Beginning + Increase − Decrease = Ending.","Isolate the missing item.","Rearranged: "+rearranged+".","Answer: $"+fmt(vals[missing])+"."],
    ["Think beginning-to-ending story, not random signs.","The increase term adds to the balance; the decrease term reduces it."]);
  q.answer=vals[missing];q.answerLabel=names[missing];return q;
}

function genLedgerBalance(){
  const side=pick(["Debit","Credit"]);
  const beg=money(1000,18000,100);
  const inc=money(4000,30000,100);
  const dec=money(1000,Math.min(inc+beg-100,22000),100);
  const end=beg+inc-dec;
  let prompt,formula;
  if(side==="Debit"){
    prompt="A debit-normal account begins with $"+fmt(beg)+". During the period it has $"+fmt(inc)+" of debits and $"+fmt(dec)+" of credits. What is the ending balance?";
    formula="Beginning + Debits − Credits = Ending";
  }else{
    prompt="A credit-normal account begins with $"+fmt(beg)+". During the period it has $"+fmt(inc)+" of credits and $"+fmt(dec)+" of debits. What is the ending balance?";
    formula="Beginning + Credits − Debits = Ending";
  }
  const q=base("ledger-balance","ledger","numeric",prompt,formula,
    ["Identify the account's normal side.","Add activity on the normal side.","Subtract activity on the opposite side.","Ending balance = $"+fmt(end)+"."],
    ["Debit-normal: add debits, subtract credits. Credit-normal: add credits, subtract debits."]);
  q.answer=end;q.answerLabel="Ending balance";return q;
}

function genNormalBalance(){
  const item=pick(NORMAL);
  const q=base("normal-balance","debits","mcq",
    "What is the normal balance of "+item[0]+"?","Normal balance = side used when the account type increases.",
    [item[0]+" is a "+item[1]+".",item[1]+" normally has a "+item[2].toLowerCase()+" balance."],
    ["Assets, Expenses, Withdrawals are debit-normal.","Liabilities, Capital, Revenues are credit-normal."]);
  q.options=shuffle(["Debit","Credit"]);q.answer=item[2];q.answerLabel=item[2];return q;
}

function genTransaction(){
  const t=pick(TX);
  const amount=money(500,25000,100);
  const allEffects=Array.from(new Set(TX.map(function(x){return x.effect;})));
  const allAccounts=Array.from(new Set(TX.map(function(x){return x.accounts;})));
  const allEntries=Array.from(new Set(TX.map(function(x){return x.entry;})));
  const q=base("transaction-chain","transactions","transaction",t.text(amount),
    "Use the 3-pass method: financial position → accounts → debit/credit.",
    [
      "Financial position: "+t.effect+".",
      "Accounts: "+t.accounts+".",
      "Journal entry: "+t.entry+".",
      t.explain
    ],
    ["First ignore debit and credit. What changed in Assets, Liabilities, or Equity?","Then name the exact accounts before deciding the debit and credit."]);
  q.effect=t.effect;q.accounts=t.accounts;q.entry=t.entry;
  q.effectOptions=shuffle([t.effect].concat(shuffle(allEffects.filter(function(x){return x!==t.effect;})).slice(0,3)));
  q.accountOptions=shuffle([t.accounts].concat(shuffle(allAccounts.filter(function(x){return x!==t.accounts;})).slice(0,3)));
  q.entryOptions=shuffle([t.entry].concat(shuffle(allEntries.filter(function(x){return x!==t.entry;})).slice(0,3)));
  q.answerLabel=t.entry;
  return q;
}

function genTrialBalance(){
  const bank=[
    ["The verification that the sum of debit balances equals the sum of credit balances in the ledger is called:","Trial Balance",["Journal","Posting","Income Statement","Ledger"],"A trial balance lists account balances and checks whether total debits equal total credits."],
    ["Which comes first when preparing statements from an unadjusted trial balance?","Income Statement",["Balance Sheet","Cash Flow Statement","Statement of Owner's Equity","Trial Balance"],"Net income is needed for the owner's equity statement, and ending equity is needed for the balance sheet."],
    ["Which item does NOT belong in net income?","Withdrawals",["Service Revenue","Rent Expense","Wages Expense","Advertising Expense"],"Withdrawals reduce owner equity but are not an expense."],
    ["A trial balance can still balance even if:","Some accounting errors exist",["No errors exist","Every transaction is correct","All accounts have normal balances","Revenue equals expenses"],"Equal debit and credit totals do not prove every transaction was recorded correctly."]
  ];
  const row=pick(bank);
  const q=base("trial-balance","trial","mcq",row[0],"Trial balance and statement-preparation rules.",
    [row[3]],["Ask what the trial balance verifies, not what it guarantees."]);
  q.options=shuffle([row[1]].concat(row[2]));q.answer=row[1];q.answerLabel=row[1];return q;
}

const GEN={
  "accounting-equation":genAccountingEquation,
  "equity-equation":genEquityEquation,
  "income-equation":genIncomeEquation,
  "rollforward-supplies":genRollforward,
  "rollforward-accounts-receivable":genRollforward,
  "rollforward-accounts-payable":genRollforward,
  "ledger-balance":genLedgerBalance,
  "normal-balance":genNormalBalance,
  "transaction-chain":genTransaction,
  "trial-balance":genTrialBalance
};

const MODE_POOLS={
  equations:[genAccountingEquation,genEquityEquation,genIncomeEquation,genRollforward],
  transactions:[genTransaction,genNormalBalance],
  ledger:[genRollforward,genLedgerBalance,genTrialBalance],
  mixed:[genAccountingEquation,genEquityEquation,genIncomeEquation,genRollforward,genLedgerBalance,genNormalBalance,genTransaction,genTransaction,genTrialBalance],
  day1:[genAccountingEquation,genEquityEquation,genIncomeEquation,genRollforward],
  day2:[genTransaction,genTransaction,genNormalBalance],
  day3:[genTransaction,genRollforward,genLedgerBalance,genTrialBalance],
  day4:[genAccountingEquation,genEquityEquation,genRollforward,genTransaction,genLedgerBalance,genNormalBalance,genTrialBalance]
};

function generatorForFamily(family){
  if(family.indexOf("rollforward-")===0){
    return function(){
      let q=genRollforward();
      let guard=0;
      while(q.family!==family && guard<20){q=genRollforward();guard++;}
      return q;
    };
  }
  return GEN[family]||genTransaction;
}

function masteryForQuestion(q){
  if(q.skill==="equations") return "equations";
  if(q.skill==="transactions") return "transactions";
  if(q.skill==="debits") return "debits";
  if(q.skill==="ledger") return "ledger";
  return "trial";
}

function nextQuestion(){
  let q;
  if(practice.reinforce.length){
    const family=practice.reinforce.shift();
    q=generatorForFamily(family)();
    q.reinforcement=true;
  }else{
    const pool=MODE_POOLS[practice.mode]||MODE_POOLS.mixed;
    q=pick(pool)();
  }
  practice.question=q;practice.submitted=false;practice.grade=null;practice.hint=0;
  renderPractice();
}

function startPractice(mode,day){
  practice={mode:mode||"mixed",question:null,submitted:false,grade:null,hint:0,answered:0,correct:0,day:day||null,reinforce:[]};
  view="practice";
  nav.forEach(function(b){b.classList.toggle("active",b.dataset.view==="practice");});
  nextQuestion();
  window.scrollTo({top:0,behavior:"instant"});
}

function gradeCurrent(){
  const q=practice.question;
  let ok=false,details=[];
  if(q.kind==="numeric"){
    const raw=(document.querySelector("#numericAnswer")||{}).value||"";
    const value=Number(raw.replace(/[$,\s]/g,""));
    ok=Number.isFinite(value) && Math.abs(value-q.answer)<0.01;
    details=[ok?"Correct.":"Correct answer: $"+fmt(q.answer)+"."];
  }else if(q.kind==="mcq"){
    const selected=document.querySelector('input[name="mcq"]:checked');
    const value=selected?selected.value:"";
    ok=value===q.answer;
    details=[ok?"Correct.":"Correct answer: "+q.answer+"."];
  }else{
    const e=(document.querySelector("#effectAnswer")||{}).value||"";
    const a=(document.querySelector("#accountsAnswer")||{}).value||"";
    const j=(document.querySelector("#entryAnswer")||{}).value||"";
    const eok=e===q.effect,aok=a===q.accounts,jok=j===q.entry;
    ok=eok&&aok&&jok;
    details=[
      (eok?"✓ ":"✕ ")+"Effect: "+q.effect,
      (aok?"✓ ":"✕ ")+"Accounts: "+q.accounts,
      (jok?"✓ ":"✕ ")+"Entry: "+q.entry
    ];
  }
  practice.submitted=true;
  practice.grade={ok:ok,details:details};
  practice.answered++;
  state.total++;
  if(ok){
    practice.correct++;state.correct++;state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);
  }else{
    state.streak=0;
    practice.reinforce.push(q.family,q.family);
    state.mistakes.unshift({family:q.family,prompt:q.prompt,answer:q.answerLabel,at:new Date().toISOString()});
    state.mistakes=state.mistakes.slice(0,40);
  }
  const key=masteryForQuestion(q);
  state.mastery[key]=Math.max(0,Math.min(100,(state.mastery[key]||0)+(ok?4:-1)));
  if(practice.day){
    const d=state.dayStats[practice.day]||{attempts:0,correct:0};
    d.attempts++;if(ok)d.correct++;
    state.dayStats[practice.day]=d;
  }
  save();
  renderPractice();
  if(ok && state.streak>0 && state.streak%5===0) toast(state.streak+" correct-answer streak.");
}

function renderQuestionInput(q){
  if(q.kind==="numeric"){
    return '<label class="eyebrow" for="numericAnswer">YOUR ANSWER</label><input id="numericAnswer" class="answer-input" inputmode="decimal" autocomplete="off" placeholder="$0" />';
  }
  if(q.kind==="mcq"){
    return '<div class="select-grid">'+q.options.map(function(o,i){
      return '<label class="select-field" style="display:flex;gap:10px;align-items:center;border:1px solid #343438;border-radius:14px;padding:13px;cursor:pointer"><input type="radio" name="mcq" value="'+esc(o)+'"><span>'+esc(o)+'</span></label>';
    }).join("")+'</div>';
  }
  function opts(arr){return '<option value="">Choose...</option>'+arr.map(function(x){return '<option value="'+esc(x)+'">'+esc(x)+'</option>';}).join("");}
  return '<div class="select-grid">'+
    '<div class="select-field"><label for="effectAnswer">1 · Financial position effect</label><select id="effectAnswer">'+opts(q.effectOptions)+'</select></div>'+
    '<div class="select-field"><label for="accountsAnswer">2 · Accounts affected</label><select id="accountsAnswer">'+opts(q.accountOptions)+'</select></div>'+
    '<div class="select-field"><label for="entryAnswer">3 · Debit / credit entry</label><select id="entryAnswer">'+opts(q.entryOptions)+'</select></div>'+
  '</div>';
}

function renderFeedback(q){
  if(!practice.submitted) return "";
  const g=practice.grade;
  return '<div class="feedback '+(g.ok?"good":"bad")+'">'+
    '<h3>'+(g.ok?"You got it.":"Fix the pattern, then try two more like it.")+'</h3>'+
    g.details.map(function(x){return '<p>'+esc(x)+'</p>';}).join("")+
    '<div class="walkthrough">'+q.steps.map(function(s,i){return '<div class="step"><strong>Step '+(i+1)+'</strong>'+esc(s)+'</div>';}).join("")+'</div>'+
    '<div class="row-actions" style="margin-top:14px"><button class="btn btn-light" id="speakExplanation">Listen to explanation</button><button class="btn btn-primary" id="nextQuestion">Next question →</button></div>'+
  '</div>';
}

function renderPractice(){
  const q=practice.question;
  if(!q){nextQuestion();return;}
  const accuracy=practice.answered?Math.round(practice.correct/practice.answered*100):0;
  const label=practice.mode.indexOf("day")===0?"Day "+practice.mode.replace("day","")+" Sprint":practice.mode.charAt(0).toUpperCase()+practice.mode.slice(1);
  app.innerHTML=
    '<div class="practice-wrap">'+
      '<div class="practice-head"><div><div class="eyebrow">'+esc(label)+'</div><h1 style="margin:6px 0 0;font-size:32px;letter-spacing:-.04em">Infinite coach practice</h1></div><button class="btn btn-ghost" id="leavePractice">Exit session</button></div>'+
      '<div class="card practice-card">'+
        '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><div class="question-kind">'+(q.reinforcement?"↻ Reinforcement":"Fresh problem")+' · '+esc(q.skill)+'</div><div class="score-chip">'+practice.correct+' correct · '+accuracy+'%</div></div>'+
        '<div class="progress-line"><span style="width:'+Math.min((practice.answered%10)*10,100)+'%"></span></div>'+
        '<div class="question-text">'+esc(q.prompt)+'</div>'+
        (q.formula?'<div class="formula-ribbon">'+esc(q.formula)+'</div>':"")+
        (!practice.submitted?renderQuestionInput(q):"")+
        (!practice.submitted?'<div class="practice-footer"><div class="row-actions"><button class="btn btn-ghost" id="hintBtn">Hint</button><button class="btn btn-light" id="speakQuestion">Listen</button></div><button class="btn btn-primary" id="checkAnswer">Check answer</button></div>':"")+
        '<div id="hintArea"></div>'+
        renderFeedback(q)+
      '</div>'+
    '</div>';
  document.querySelector("#leavePractice").onclick=function(){setView("home");};
  const check=document.querySelector("#checkAnswer");if(check) check.onclick=gradeCurrent;
  const input=document.querySelector("#numericAnswer");if(input) input.addEventListener("keydown",function(e){if(e.key==="Enter") gradeCurrent();});
  const hint=document.querySelector("#hintBtn");if(hint) hint.onclick=function(){
    const h=q.hints[Math.min(practice.hint,q.hints.length-1)]||q.steps[0]||"Start with the base equation.";
    practice.hint++;
    document.querySelector("#hintArea").innerHTML='<div class="hint">'+esc(h)+'</div>';
  };
  const speakQ=document.querySelector("#speakQuestion");if(speakQ) speakQ.onclick=function(){speak(q.prompt+". "+q.formula);};
  const speakE=document.querySelector("#speakExplanation");if(speakE) speakE.onclick=function(){speak(q.steps.join(" "));};
  const next=document.querySelector("#nextQuestion");if(next) next.onclick=nextQuestion;
  app.focus({preventScroll:true});
}

function renderHome(){
  const overall=Math.round(Object.values(state.mastery).reduce(function(a,b){return a+b;},0)/Object.keys(state.mastery).length);
  const acc=state.total?Math.round(state.correct/state.total*100):0;
  const today=Math.max(1,Math.min(4,new Date().getDate()-25));
  const days=[
    ["Equation control","Equation manipulation + Supplies, A/R, A/P.","equations"],
    ["Transaction instincts","Financial position → accounts → debit/credit.","transactions"],
    ["Ledger + journal cleanup","Account balances, transaction entries, trial balance.","ledger"],
    ["Mixed test warm-up","Everything shuffled with weak-pattern reinforcement.","mixed"]
  ];
  app.innerHTML=
    '<section class="hero">'+
      '<div class="card hero-main"><div class="eyebrow">SEPTEMBER 29 · TEST #1</div><h1>Your <em>4-day</em><br>accounting coach.</h1><p>This is the part of Ledger built for the questions that have been tripping you up: equation manipulation, collection/payment on account, transaction analysis, debits and credits, account balances, and trial-balance logic.</p><div class="hero-actions"><button class="btn btn-primary" id="startRecommended">Start today · Day '+today+'</button><button class="btn btn-light" id="listenNow">Listen & follow along</button></div></div>'+
      '<div class="card hero-side"><div><div class="eyebrow">COACH MASTERY</div><div class="big-number">'+overall+'<small>%</small></div><div class="mini-progress"><span style="width:'+overall+'%"></span></div><p class="muted">Practice estimate only. Wrong answers automatically create two same-pattern follow-ups.</p></div><div class="badge '+(state.total?"good":"")+'">'+state.total+' coached questions</div></div>'+
    '</section>'+
    '<div class="metric-row">'+
      '<div class="card metric"><strong>'+state.total+'</strong><small>Total coached</small></div>'+
      '<div class="card metric"><strong>'+(state.total?acc+"%":"—")+'</strong><small>Accuracy</small></div>'+
      '<div class="card metric"><strong>'+state.bestStreak+'</strong><small>Best streak</small></div>'+
      '<div class="card metric"><strong>'+state.mistakes.length+'</strong><small>Saved weak patterns</small></div>'+
    '</div>'+
    '<div class="section-head"><div><div class="eyebrow">THE SPRINT</div><h2>One focus per day</h2></div><span class="muted">25 questions = daily target</span></div>'+
    '<div class="day-grid">'+days.map(function(d,i){
      const num=i+1,stats=state.dayStats[num]||{attempts:0,correct:0},pct=Math.min(100,Math.round(stats.attempts/25*100));
      return '<div class="card day-card"><div class="day-top"><span class="day-num">'+num+'</span><span class="badge '+(stats.attempts>=25?"good":"")+'">'+stats.attempts+'/25</span></div><h3>'+d[0]+'</h3><p>'+d[1]+'</p><span class="focus">'+(stats.attempts?Math.round(stats.correct/stats.attempts*100)+"% accuracy so far":"Fresh start")+'</span><div class="mini-progress"><span style="width:'+pct+'%"></span></div><button class="btn '+(num===today?"btn-primary":"btn-light")+'" data-day="'+num+'" data-mode="day'+num+'">Train Day '+num+'</button></div>';
    }).join("")+'</div>'+
    '<div class="section-head"><div><div class="eyebrow">PICK A MODE</div><h2>Drill exactly what you need</h2></div></div>'+
    '<div class="mode-grid">'+
      modeCard("ƒ","Equation Lab","Manipulate equity, income, supplies, A/R and A/P.","equations")+
      modeCard("⇄","Transaction Lab","Analyze the effect, accounts, then entry.","transactions")+
      modeCard("T","Ledger Lab","Beginning balance, debits/credits, ending balance.","ledger")+
      modeCard("∞","Mixed Infinite","Fresh mixed questions with automatic remediation.","mixed")+
    '</div>';
  document.querySelector("#startRecommended").onclick=function(){startPractice("day"+today,today);};
  document.querySelector("#listenNow").onclick=function(){setView("learn");};
  Array.from(document.querySelectorAll("[data-day]")).forEach(function(b){b.onclick=function(){startPractice(b.dataset.mode,Number(b.dataset.day));};});
  Array.from(document.querySelectorAll("[data-start-mode]")).forEach(function(b){b.onclick=function(){startPractice(b.dataset.startMode,null);};});
}

function modeCard(icon,title,body,mode){
  return '<button class="card mode-card" data-start-mode="'+mode+'"><span class="mode-icon">'+icon+'</span><h3>'+title+'</h3><p>'+body+'</p></button>';
}

function stripHtml(s){
  const d=document.createElement("div");d.innerHTML=s;return d.textContent||d.innerText||"";
}
function speak(text,onend){
  if(!("speechSynthesis" in window)){toast("Speech is not available in this browser.");return;}
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(stripHtml(text));
  u.rate=Number(state.voiceRate)||1;
  u.pitch=1;
  if(onend) u.onend=onend;
  window.speechSynthesis.speak(u);
}
function stopSpeech(){if("speechSynthesis" in window) window.speechSynthesis.cancel();}
function speakLesson(index){
  stopSpeech();
  const nodes=Array.from(document.querySelectorAll(".listen-step"));
  let i=0;
  function run(){
    nodes.forEach(function(n){n.classList.remove("speaking");});
    if(i>=LESSONS[index].steps.length){toast("Lesson complete.");return;}
    if(nodes[i]) nodes[i].classList.add("speaking");
    speak(LESSONS[index].steps[i],function(){i++;run();});
  }
  run();
}

function renderLearn(){
  const lesson=LESSONS[selectedLesson];
  app.innerHTML=
    '<div class="section-head"><div><div class="eyebrow">LISTEN + FOLLOW ALONG</div><h2>Hear the rule while you see each step</h2></div></div>'+
    '<div class="listen-shell">'+
      '<aside class="card lesson-list">'+LESSONS.map(function(l,i){return '<button data-lesson="'+i+'" class="'+(i===selectedLesson?"active":"")+'">'+(i+1)+'. '+l.title+'</button>';}).join("")+'</aside>'+
      '<section class="card lesson-stage"><div class="eyebrow">COACH LESSON '+(selectedLesson+1)+'</div><h1>'+lesson.title+'</h1><p>'+lesson.subtitle+'</p>'+
        '<div class="voice-bar"><button class="btn btn-primary" id="playLesson">▶ Start listen & follow</button><button class="btn btn-ghost" id="stopLesson">Stop</button><label class="muted">Speed <select id="voiceRate"><option value=".85">0.85×</option><option value="1">1×</option><option value="1.15">1.15×</option><option value="1.3">1.3×</option></select></label></div>'+
        '<div class="listen-steps">'+lesson.steps.map(function(s,i){return '<div class="listen-step" data-step="'+i+'">'+s+'</div>';}).join("")+'</div>'+
        '<div class="row-actions" style="margin-top:20px"><button class="btn btn-light" id="practiceLesson">Practice this lesson</button></div>'+
      '</section>'+
    '</div>';
  document.querySelector("#voiceRate").value=String(state.voiceRate);
  document.querySelector("#voiceRate").onchange=function(e){state.voiceRate=Number(e.target.value);save();};
  document.querySelector("#playLesson").onclick=function(){speakLesson(selectedLesson);};
  document.querySelector("#stopLesson").onclick=stopSpeech;
  document.querySelector("#practiceLesson").onclick=function(){
    if(selectedLesson===0) startPractice("equations",null);
    else if(selectedLesson===1) startPractice("transactions",null);
    else if(selectedLesson===2) startPractice("ledger",null);
    else startPractice("mixed",null);
  };
  Array.from(document.querySelectorAll("[data-lesson]")).forEach(function(b){b.onclick=function(){stopSpeech();selectedLesson=Number(b.dataset.lesson);state.selectedLesson=selectedLesson;save();renderLearn();};});
}

function renderFormula(){
  app.innerHTML=
    '<div class="rule-banner card"><div class="mode-icon">!</div><div><strong>The manipulation rule</strong><p>Write the original equation. Get the missing item alone. When a known term crosses the equals sign, undo it with the opposite operation. Then plug your answer back into the original equation to check it.</p></div></div>'+
    '<div class="section-head"><div><div class="eyebrow">FORMULA WALL</div><h2>Everything you need for this test</h2></div><button class="btn btn-light" id="readFormulas">Listen to formulas</button></div>'+
    '<div class="formula-grid">'+FORMULAS.map(function(f){return '<div class="card formula-card"><div class="eyebrow">'+esc(f[0])+'</div><code>'+esc(f[1])+'</code><p>'+esc(f[2])+'</p></div>';}).join("")+'</div>';
  document.querySelector("#readFormulas").onclick=function(){speak(FORMULAS.map(function(f){return f[0]+". "+f[1]+". "+f[2];}).join(" "));};
}

function renderPracticeLanding(){
  app.innerHTML=
    '<div class="section-head"><div><div class="eyebrow">UNLIMITED PRACTICE</div><h2>Choose what the next questions should attack</h2></div></div>'+
    '<div class="mode-grid">'+
      modeCard("ƒ","Equation Lab","The exact manipulation questions you were missing.","equations")+
      modeCard("⇄","Transaction Lab","Collection on account, payment on account, revenue, expenses, advances, withdrawals.","transactions")+
      modeCard("T","Ledger Lab","Supplies, A/R, A/P, normal-side balance equations and trial balance.","ledger")+
      modeCard("∞","Mixed Infinite","All patterns, endlessly regenerated.","mixed")+
    '</div>'+
    '<div class="section-head"><div><div class="eyebrow">WHY IT KEEPS GOING</div><h2>No fixed question bank</h2></div></div>'+
    '<div class="card rule-banner"><div class="mode-icon">↻</div><div><strong>Numbers and situations regenerate every time.</strong><p>When you miss one, the coach queues two more from the same pattern before returning to new material. You learn the method instead of memorizing one answer.</p></div></div>';
  Array.from(document.querySelectorAll("[data-start-mode]")).forEach(function(b){b.onclick=function(){startPractice(b.dataset.startMode,null);};});
}

function setView(next){
  stopSpeech();
  view=next;
  nav.forEach(function(b){b.classList.toggle("active",b.dataset.view===next);});
  if(next==="home") renderHome();
  if(next==="learn") renderLearn();
  if(next==="practice") renderPracticeLanding();
  if(next==="formula") renderFormula();
  app.focus({preventScroll:true});
  window.scrollTo({top:0,behavior:"instant"});
}
nav.forEach(function(b){b.addEventListener("click",function(){setView(b.dataset.view);});});
setView("home");
