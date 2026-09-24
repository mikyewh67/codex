const ACCOUNT_POOL = [
  'Cash','Accounts Receivable','Supplies','Prepaid Insurance','Equipment',
  'Accounts Payable','Notes Payable','Unearned Revenue','Unearned Fees','Wages Payable',
  'Capital','Withdrawals','Service Revenue','Fees Earned','Wages Expense',
  'Rent Expense','Utilities Expense','Advertising Expense','Supplies Expense','Insurance Expense'
];

const EFFECT_OPTIONS = [
  'Increase assets; increase equity',
  'Increase assets; increase liabilities',
  'Decrease assets; decrease liabilities',
  'Decrease assets; decrease equity',
  'Increase one asset; decrease another asset',
  'Decrease liabilities; increase equity',
  'Increase liabilities; decrease equity',
  'Increase assets; decrease assets; increase liabilities'
];

const TYPE_OPTIONS = ['Asset','Liability','Capital','Withdrawal','Revenue','Expense'];
const STATEMENT_OPTIONS = ['Income Statement','Balance Sheet','Statement of Owner’s Equity','Cash Flow Statement'];

const NORMAL = {
  Asset: 'Debit', Expense: 'Debit', Withdrawal: 'Debit',
  Liability: 'Credit', Capital: 'Credit', Revenue: 'Credit'
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
function money(min = 500, max = 50000, step = 100) {
  const n = Math.floor((max - min) / step);
  return min + Math.floor(Math.random() * (n + 1)) * step;
}
function id(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`; }
function fmt(n) { return Number(n).toLocaleString('en-US'); }
function optionSet(correct, pool, count = 4) {
  const choices = shuffle([correct, ...shuffle(pool.filter(x => x !== correct)).slice(0, count - 1)]);
  return choices;
}
function numericDistractors(correct) {
  const steps = [100, 500, 1000, 2000, 5000];
  const s = pick(steps);
  const vals = new Set([correct]);
  while (vals.size < 4) {
    const delta = pick([-2,-1,1,2]) * s;
    if (correct + delta >= 0) vals.add(correct + delta);
  }
  return shuffle([...vals]).map(v => `$${fmt(v)}`);
}

function baseQuestion(generator, section, type, prompt, explanation, hints = []) {
  return { id: id(generator), generator, section, type, prompt, explanation, hints };
}

export function genDefinition() {
  const bank = [
    ['Properties or resources owned by a business are referred to as:', 'Assets', ['Liabilities','Equity','Expenses','Revenues'], 'Assets are economic resources owned by the business or owed to it.'],
    ['An obligation to pay assets or provide services in the future because of a past transaction is a:', 'Liability', ['Asset','Revenue','Withdrawal','Expense'], 'A liability is an obligation to a creditor arising from a past transaction.'],
    ['The process of initially recording a business transaction in the journal is called:', 'Journalizing', ['Posting','Transposing','Balancing','Classifying'], 'Journalizing means formally recording the transaction in the chronological journal.'],
    ['A group of accounts used to keep cumulative balances is called the:', 'Ledger', ['Journal','Trial balance','Income statement','Chart of accounts'], 'The ledger is the group of accounts; posting transfers journal information into it.'],
    ['A chronological record of business transactions is called the:', 'Journal', ['Ledger','Trial balance','Balance sheet','Equity statement'], 'A journal records transactions in chronological order.'],
    ['The list of accounts and their balances used to verify debit balances equal credit balances is a:', 'Trial Balance', ['Ledger','Journal','Chart of accounts','Cash flow statement'], 'A trial balance lists account balances and checks whether total debits equal total credits.']
  ];
  const [prompt, answer, wrong, explanation] = pick(bank);
  const q = baseQuestion('definition','foundations','mcq',prompt,explanation,[
    'Focus on the accounting term being defined, not whether it is an account or a statement.',
    'Ask what role the item plays in the accounting process.'
  ]);
  q.options = shuffle([answer, ...wrong]);
  q.answer = answer;
  return q;
}

export function genStatementIdentify() {
  const bank = [
    ['Which financial statement reports revenues earned and expenses incurred during a period?', 'Income Statement', 'Revenues − expenses = income.'],
    ['Which financial statement reports assets, liabilities, and equity as of a specific date?', 'Balance Sheet', 'The balance sheet reports financial position as of a date.'],
    ['Which financial statement summarizes changes in owner’s equity during a period?', 'Statement of Owner’s Equity', 'The equity statement explains beginning equity, investment, income/loss, withdrawals, and ending equity.'],
    ['Which financial statement summarizes cash inflows and outflows during an accounting period?', 'Cash Flow Statement', 'The cash flow statement explains the change in cash during the period.']
  ];
  const [prompt, answer, explanation] = pick(bank);
  const q = baseQuestion('statement-identify','foundations','mcq',prompt,explanation,[
    'Look for the time wording: “during a period” versus “as of a date.”',
    'Match the accounts or activity described to the statement that reports them.'
  ]);
  q.options = shuffle(STATEMENT_OPTIONS);
  q.answer = answer;
  return q;
}

export function genAccountClassify() {
  const accounts = [
    ['Cash','Asset'],['Accounts Receivable','Asset'],['Supplies','Asset'],['Prepaid Insurance','Asset'],['Equipment','Asset'],
    ['Accounts Payable','Liability'],['Notes Payable','Liability'],['Unearned Revenue','Liability'],['Wages Payable','Liability'],
    ['Capital','Capital'],['Withdrawals','Withdrawal'],['Service Revenue','Revenue'],['Fees Earned','Revenue'],
    ['Wages Expense','Expense'],['Rent Expense','Expense'],['Utilities Expense','Expense'],['Advertising Expense','Expense'],['Supplies Expense','Expense'],['Insurance Expense','Expense']
  ];
  const [account, answer] = pick(accounts);
  const q = baseQuestion('account-classify','foundations','mcq',`Classify the account: ${account}`, `${account} is classified as a ${answer.toLowerCase()} account.`,[
    'Ask what the account represents: resource, obligation, owner stake, owner withdrawal, earned revenue, or cost of operations.',
    'Use the account name itself as a clue: “Payable” usually means liability; “Expense” means expense.'
  ]);
  q.options = shuffle(TYPE_OPTIONS);
  q.answer = answer;
  return q;
}

export function genEquationBasic() {
  const A = money(20000,150000,1000);
  const L = money(5000, Math.max(5000,A-5000),1000);
  const E = A - L;
  const missing = pick(['Assets','Liabilities','Equity']);
  let prompt, answer, explanation;
  if (missing === 'Assets') {
    answer = L + E;
    prompt = `A business has liabilities of $${fmt(L)} and equity of $${fmt(E)}. What are total assets?`;
    explanation = `Assets = Liabilities + Equity = ${fmt(L)} + ${fmt(E)} = ${fmt(answer)}.`;
  } else if (missing === 'Liabilities') {
    answer = A - E;
    prompt = `A business has assets of $${fmt(A)} and equity of $${fmt(E)}. What are total liabilities?`;
    explanation = `Liabilities = Assets − Equity = ${fmt(A)} − ${fmt(E)} = ${fmt(answer)}.`;
  } else {
    answer = A - L;
    prompt = `A business has assets of $${fmt(A)} and liabilities of $${fmt(L)}. What is total equity?`;
    explanation = `Equity = Assets − Liabilities = ${fmt(A)} − ${fmt(L)} = ${fmt(answer)}.`;
  }
  const q = baseQuestion('equation-basic','equations','numeric',prompt,explanation,[
    'Start with Assets = Liabilities + Equity.',
    `Rearrange the equation to isolate ${missing}.`
  ]);
  q.answer = answer;
  q.answerLabel = missing;
  return q;
}

export function genEquityEquation() {
  const beg = money(10000,80000,500);
  const invest = money(0,30000,500);
  const income = money(1000,40000,500);
  const withdr = money(0,20000,500);
  const end = beg + invest + income - withdr;
  const missing = pick(['Beginning Equity','Investment','Income','Withdrawals','Ending Equity']);
  const vals = { 'Beginning Equity':beg, Investment:invest, Income:income, Withdrawals:withdr, 'Ending Equity':end };
  let expression = `Beginning Equity $${fmt(beg)} + Investment $${fmt(invest)} + Income $${fmt(income)} − Withdrawals $${fmt(withdr)} = Ending Equity $${fmt(end)}`;
  let prompt = expression.replace(`$${fmt(vals[missing])}`, '?');
  prompt = `Solve for ${missing}: ${prompt}`;
  let explanation = `Use Beginning Equity + Investment + Income − Withdrawals = Ending Equity. The missing ${missing.toLowerCase()} is $${fmt(vals[missing])}.`;
  const q = baseQuestion('equity-equation','equations','numeric',prompt,explanation,[
    'Write: Beg. Equity + Investment + Income − Withdrawals = End Equity.',
    `Move the known amounts to the other side until ${missing} is isolated.`
  ]);
  q.answer = vals[missing];
  q.answerLabel = missing;
  return q;
}


export function genRevenueFromExpandedEquity() {
  const beg = money(50000,160000,1000);
  const invest = money(5000,40000,1000);
  const expenses = money(40000,150000,1000);
  const withdrawals = money(0,25000,1000);
  const revenue = money(expenses + 10000, expenses + 120000, 1000);
  const end = beg + invest + revenue - expenses - withdrawals;
  const q = baseQuestion(
    'revenue-expanded-equity','equations','numeric',
    `Beginning equity was $${fmt(beg)}. The owner invested $${fmt(invest)}. Expenses were $${fmt(expenses)}, withdrawals were $${fmt(withdrawals)}, and ending equity was $${fmt(end)}. How much revenue was earned?`,
    `Use Beginning Equity + Investment + Revenues − Expenses − Withdrawals = Ending Equity. Revenue = ${fmt(end)} − ${fmt(beg)} − ${fmt(invest)} + ${fmt(expenses)} + ${fmt(withdrawals)} = ${fmt(revenue)}.`,
    ['Use the expanded equity equation with revenues and expenses shown separately.', 'Solve: Revenue = Ending Equity − Beginning Equity − Investment + Expenses + Withdrawals.']
  );
  q.answer = revenue;
  q.answerLabel = 'Revenue';
  return q;
}

export function genIncomeFromBalanceSheets() {
  const begA = money(80000,240000,1000);
  const begL = money(20000,begA-20000,1000);
  const begE = begA - begL;
  const invest = money(5000,30000,1000);
  const withdrawals = money(0,20000,1000);
  const income = money(3000,40000,1000);
  const endE = begE + invest + income - withdrawals;
  const endL = money(20000,120000,1000);
  const endA = endL + endE;
  const q = baseQuestion(
    'income-from-balance-sheets','equations','numeric',
    `Beginning of year: Assets $${fmt(begA)}, Liabilities $${fmt(begL)}. End of year: Assets $${fmt(endA)}, Liabilities $${fmt(endL)}. During the year, the owner invested $${fmt(invest)} and withdrew $${fmt(withdrawals)}. What was net income?`,
    `First find equity: beginning equity = ${fmt(begA)} − ${fmt(begL)} = ${fmt(begE)}; ending equity = ${fmt(endA)} − ${fmt(endL)} = ${fmt(endE)}. Then Income = Ending Equity − Beginning Equity − Investment + Withdrawals = ${fmt(income)}.`,
    ['First compute beginning and ending equity using Assets − Liabilities.', 'Then use Beginning Equity + Investment + Income − Withdrawals = Ending Equity.']
  );
  q.answer = income;
  q.answerLabel = 'Net income';
  return q;
}

const TRANSACTIONS = [
  {
    key:'owner-invest', section:'transaction-analysis', text:(n)=>`The owner invests $${fmt(n)} cash in the business.`,
    effect:'Increase assets; increase equity', accounts:['Cash','Capital'],
    journal:(n)=>[{account:'Cash',debit:n,credit:0},{account:'Capital',debit:0,credit:n}],
    explanation:'Owner investment increases Cash (asset) and Capital (equity). Cash is debited; Capital is credited.'
  },
  {
    key:'borrow', section:'transaction-analysis', text:(n)=>`The business borrows $${fmt(n)} from a bank.`,
    effect:'Increase assets; increase liabilities', accounts:['Cash','Notes Payable'],
    journal:(n)=>[{account:'Cash',debit:n,credit:0},{account:'Notes Payable',debit:0,credit:n}],
    explanation:'Borrowing increases Cash and creates a Notes Payable liability.'
  },
  {
    key:'repay-note', section:'transaction-analysis', text:(n)=>`The business pays $${fmt(n)} toward an existing bank note.`,
    effect:'Decrease assets; decrease liabilities', accounts:['Notes Payable','Cash'],
    journal:(n)=>[{account:'Notes Payable',debit:n,credit:0},{account:'Cash',debit:0,credit:n}],
    explanation:'Repaying principal reduces the liability and reduces Cash.'
  },
  {
    key:'buy-asset-cash', section:'transaction-analysis', text:(n)=>`The business purchases equipment for $${fmt(n)} cash.`,
    effect:'Increase one asset; decrease another asset', accounts:['Equipment','Cash'],
    journal:(n)=>[{account:'Equipment',debit:n,credit:0},{account:'Cash',debit:0,credit:n}],
    explanation:'Equipment increases while Cash decreases. Total assets do not change.'
  },
  {
    key:'buy-supplies-account', section:'transaction-analysis', text:(n)=>`The business purchases $${fmt(n)} of supplies on account.`,
    effect:'Increase assets; increase liabilities', accounts:['Supplies','Accounts Payable'],
    journal:(n)=>[{account:'Supplies',debit:n,credit:0},{account:'Accounts Payable',debit:0,credit:n}],
    explanation:'Supplies increase and an Accounts Payable liability is created.'
  },
  {
    key:'pay-account', section:'transaction-analysis', text:(n)=>`The business pays $${fmt(n)} on an existing account payable.`,
    effect:'Decrease assets; decrease liabilities', accounts:['Accounts Payable','Cash'],
    journal:(n)=>[{account:'Accounts Payable',debit:n,credit:0},{account:'Cash',debit:0,credit:n}],
    explanation:'Payment on account reduces Accounts Payable and Cash. It is not an expense at the time of payment.'
  },
  {
    key:'cash-revenue', section:'transaction-analysis', text:(n)=>`The business provides services and receives $${fmt(n)} cash immediately.`,
    effect:'Increase assets; increase equity', accounts:['Cash','Service Revenue'],
    journal:(n)=>[{account:'Cash',debit:n,credit:0},{account:'Service Revenue',debit:0,credit:n}],
    explanation:'Cash increases and earned revenue increases equity.'
  },
  {
    key:'revenue-account', section:'transaction-analysis', text:(n)=>`The business provides $${fmt(n)} of services on account.`,
    effect:'Increase assets; increase equity', accounts:['Accounts Receivable','Service Revenue'],
    journal:(n)=>[{account:'Accounts Receivable',debit:n,credit:0},{account:'Service Revenue',debit:0,credit:n}],
    explanation:'The business earned revenue and created an Accounts Receivable asset.'
  },
  {
    key:'collect-ar', section:'transaction-analysis', text:(n)=>`The business collects $${fmt(n)} from a customer who previously owed money on account.`,
    effect:'Increase one asset; decrease another asset', accounts:['Cash','Accounts Receivable'],
    journal:(n)=>[{account:'Cash',debit:n,credit:0},{account:'Accounts Receivable',debit:0,credit:n}],
    explanation:'Collection on account increases Cash and decreases Accounts Receivable. No new revenue is earned.'
  },
  {
    key:'advance', section:'transaction-analysis', text:(n)=>`A customer pays $${fmt(n)} now for services to be provided in the future.`,
    effect:'Increase assets; increase liabilities', accounts:['Cash','Unearned Revenue'],
    journal:(n)=>[{account:'Cash',debit:n,credit:0},{account:'Unearned Revenue',debit:0,credit:n}],
    explanation:'The business received Cash but still owes the service, so Unearned Revenue is a liability.'
  },
  {
    key:'earn-advance', section:'transaction-analysis', text:(n)=>`The business completes $${fmt(n)} of services for a customer who paid in advance.`,
    effect:'Decrease liabilities; increase equity', accounts:['Unearned Revenue','Service Revenue'],
    journal:(n)=>[{account:'Unearned Revenue',debit:n,credit:0},{account:'Service Revenue',debit:0,credit:n}],
    explanation:'The obligation is reduced and earned revenue increases equity.'
  },
  {
    key:'cash-expense', section:'transaction-analysis', text:(n)=>`The business pays $${fmt(n)} of employee wages for work performed.`,
    effect:'Decrease assets; decrease equity', accounts:['Wages Expense','Cash'],
    journal:(n)=>[{account:'Wages Expense',debit:n,credit:0},{account:'Cash',debit:0,credit:n}],
    explanation:'An expense decreases equity; paying it immediately also decreases Cash.'
  },
  {
    key:'use-supplies', section:'transaction-analysis', text:(n)=>`The business records $${fmt(n)} of supplies used in operations.`,
    effect:'Decrease assets; decrease equity', accounts:['Supplies Expense','Supplies'],
    journal:(n)=>[{account:'Supplies Expense',debit:n,credit:0},{account:'Supplies',debit:0,credit:n}],
    explanation:'Used supplies are no longer an asset; they become an expense, which decreases equity.'
  },
  {
    key:'expense-account', section:'transaction-analysis', text:(n)=>`The business receives a $${fmt(n)} utility bill for the current month, payable next month.`,
    effect:'Increase liabilities; decrease equity', accounts:['Utilities Expense','Accounts Payable'],
    journal:(n)=>[{account:'Utilities Expense',debit:n,credit:0},{account:'Accounts Payable',debit:0,credit:n}],
    explanation:'The expense is incurred now, so equity decreases and Accounts Payable increases.'
  },
  {
    key:'withdrawal', section:'transaction-analysis', text:(n)=>`The owner withdraws $${fmt(n)} cash from the business for personal use.`,
    effect:'Decrease assets; decrease equity', accounts:['Withdrawals','Cash'],
    journal:(n)=>[{account:'Withdrawals',debit:n,credit:0},{account:'Cash',debit:0,credit:n}],
    explanation:'A withdrawal reduces owner equity but is not an expense.'
  }
];

export function genTransactionEffect(forceKey = null) {
  const t = forceKey ? TRANSACTIONS.find(x => x.key === forceKey) : pick(TRANSACTIONS);
  const n = money(500,25000,100);
  const q = baseQuestion(`effect-${t.key}`,'transaction-analysis','mcq',t.text(n),t.explanation,[
    'Step 1 only: ignore debit/credit for a moment. Which parts of Assets = Liabilities + Equity change?',
    'Decide whether the business gained/lost a resource, created/reduced an obligation, or increased/decreased equity.'
  ]);
  q.options = optionSet(t.effect,EFFECT_OPTIONS,4);
  q.answer = t.effect;
  q.meta = { transactionKey:t.key };
  return q;
}

export function genNormalBalance() {
  const accounts = [
    ['Cash','Asset'],['Accounts Receivable','Asset'],['Supplies','Asset'],['Equipment','Asset'],
    ['Accounts Payable','Liability'],['Notes Payable','Liability'],['Unearned Revenue','Liability'],
    ['Capital','Capital'],['Withdrawals','Withdrawal'],['Service Revenue','Revenue'],['Fees Earned','Revenue'],
    ['Wages Expense','Expense'],['Rent Expense','Expense'],['Utilities Expense','Expense']
  ];
  const [account,type] = pick(accounts);
  const answer = NORMAL[type];
  const q = baseQuestion('normal-balance','debits-credits','mcq',`What is the normal balance of ${account}?`,`${account} is a ${type.toLowerCase()} account, and ${type}s normally have a ${answer.toLowerCase()} balance.`,[
    'Debit-normal: Assets, Expenses, Withdrawals.',
    'Credit-normal: Liabilities, Capital, Revenues.'
  ]);
  q.options = ['Debit','Credit'];
  q.answer = answer;
  return q;
}

export function genIncreaseDecreaseSide() {
  const types = ['Asset','Liability','Capital','Withdrawal','Revenue','Expense'];
  const type = pick(types);
  const direction = pick(['increase','decrease']);
  const normal = NORMAL[type];
  const answer = direction === 'increase' ? normal : (normal === 'Debit' ? 'Credit' : 'Debit');
  const q = baseQuestion('increase-decrease-side','debits-credits','mcq',`A ${type.toLowerCase()} account ${direction}s. Which side records the change?`,`${type} is normally ${normal}. An ${direction} is recorded on the ${answer.toLowerCase()} side.`,[
    `First identify the normal balance for ${type}.`,
    'Increase = normal side. Decrease = opposite side.'
  ]);
  q.options = ['Debit','Credit'];
  q.answer = answer;
  return q;
}

export function genAbnormalBalance() {
  const options = ['Accounts Receivable','Accounts Payable','Withdrawals','Supplies','Supplies Expense'];
  const answer = 'Accounts Payable';
  const q = baseQuestion('abnormal-balance','debits-credits','mcq','A debit balance in which account might indicate a recording error?',`Accounts Payable is a liability and normally carries a credit balance. A debit balance is unusual and may signal an error.`,[
    'Identify which answer choice is normally credit-balanced.',
    'Assets, expenses, and withdrawals are normally debit-balanced.'
  ]);
  q.options = shuffle(options);
  q.answer = answer;
  return q;
}

export function genJournalEntry(forceKey = null) {
  const t = forceKey ? TRANSACTIONS.find(x => x.key === forceKey) : pick(TRANSACTIONS);
  const n = money(500,25000,100);
  const expected = t.journal(n);
  const q = baseQuestion(`journal-${t.key}`,'journal','journal',`Journalize: ${t.text(n)}`,`${t.explanation} Proper form: debit account(s) first, credit account(s) second, and total debits must equal total credits.`,[
    'Do the three-step analysis first: financial position → accounts → debit/credit.',
    `The accounts involved are ${t.accounts.join(' and ')}.`
  ]);
  q.expected = expected;
  q.accounts = ACCOUNT_POOL;
  q.meta = {transactionKey:t.key};
  return q;
}

export function genCompoundJournal() {
  const cost = money(20000,80000,1000);
  const cash = Math.floor((cost * pick([0.25,0.4,0.5,0.6])) / 1000) * 1000;
  const payable = cost - cash;
  const q = baseQuestion('journal-compound','journal','journal',`The business purchases equipment for $${fmt(cost)}. It pays $${fmt(cash)} cash now and agrees to pay the remaining $${fmt(payable)} later. Journalize the transaction.`,`Equipment increases by $${fmt(cost)}, Cash decreases by $${fmt(cash)}, and Accounts Payable increases by $${fmt(payable)}. Debit Equipment for the full cost; credit Cash and Accounts Payable.`,[
    'This affects three accounts.',
    'The total debit equals the full equipment cost; split the credits between cash paid and the amount still owed.'
  ]);
  q.expected = [
    {account:'Equipment',debit:cost,credit:0},
    {account:'Cash',debit:0,credit:cash},
    {account:'Accounts Payable',debit:0,credit:payable}
  ];
  q.accounts = ACCOUNT_POOL;
  return q;
}

export function genAccountBalance(forceType = null) {
  const type = forceType || pick(['AR','AP','Supplies']);
  if (type === 'AR') {
    const beg = money(5000,25000,100);
    const services = money(20000,90000,100);
    const maxCollections = beg + services - 1000;
    const collections = money(5000,Math.max(5000,maxCollections),100);
    const end = beg + services - collections;
    const q = baseQuestion('balance-ar','ledger','numeric',`Accounts Receivable began at $${fmt(beg)}. Services provided on account were $${fmt(services)} and collections on account were $${fmt(collections)}. What is ending Accounts Receivable?`,`Accounts Receivable is debit-normal: Beginning + Debits − Credits = Ending. ${fmt(beg)} + ${fmt(services)} − ${fmt(collections)} = ${fmt(end)}.`,[
      'Accounts Receivable is an asset and therefore debit-normal.',
      'Services on account debit A/R; collections credit A/R.'
    ]);
    q.answer = end; q.answerLabel = 'Ending Accounts Receivable'; return q;
  }
  if (type === 'AP') {
    const beg = money(5000,30000,100);
    const purchases = money(25000,100000,100);
    const maxPayments = beg + purchases - 1000;
    const payments = money(5000,Math.max(5000,maxPayments),100);
    const end = beg + purchases - payments;
    const q = baseQuestion('balance-ap','ledger','numeric',`Accounts Payable began at $${fmt(beg)}. Purchases on account were $${fmt(purchases)} and payments on account were $${fmt(payments)}. What is ending Accounts Payable?`,`Accounts Payable is credit-normal: Beginning + Credits − Debits = Ending. ${fmt(beg)} + ${fmt(purchases)} − ${fmt(payments)} = ${fmt(end)}.`,[
      'Accounts Payable is a liability and therefore credit-normal.',
      'Purchases on account credit A/P; payments on account debit A/P.'
    ]);
    q.answer = end; q.answerLabel = 'Ending Accounts Payable'; return q;
  }
  const beg = money(1000,15000,100);
  const purchases = money(5000,35000,100);
  const maxUsed = beg + purchases - 500;
  const used = money(500,Math.max(500,maxUsed),100);
  const end = beg + purchases - used;
  const q = baseQuestion('balance-supplies','ledger','numeric',`Supplies began at $${fmt(beg)}. During the period, $${fmt(purchases)} of supplies were purchased and $${fmt(used)} of supplies were used. What is ending Supplies?`,`Supplies is debit-normal: Beginning + Debits − Credits = Ending. ${fmt(beg)} + ${fmt(purchases)} − ${fmt(used)} = ${fmt(end)}.`,[
    'Supplies is an asset and therefore debit-normal.',
    'Purchases increase Supplies; supplies used decrease Supplies.'
  ]);
  q.answer = end; q.answerLabel = 'Ending Supplies'; return q;
}

export function genMissingAccountBalance(forceType = null) {
  const type = forceType || pick(['AP-payments','Supplies-beginning','AR-collections']);
  if (type === 'AP-payments') {
    const beg = money(10000,30000,100);
    const purchases = money(40000,100000,100);
    const end = money(5000,beg+purchases-5000,100);
    const payments = beg + purchases - end;
    const q = baseQuestion('missing-ap-payments','ledger','numeric',`Accounts Payable began at $${fmt(beg)} and ended at $${fmt(end)}. Purchases on account were $${fmt(purchases)}. How much was paid on account?`,`For a credit-normal liability: Beginning + Credits = Ending + Debits. ${fmt(beg)} + ${fmt(purchases)} = ${fmt(end)} + payments, so payments = ${fmt(payments)}.`,['A/P is credit-normal.', 'Use Beginning + Credits = Ending + Debits.']);
    q.answer = payments; q.answerLabel='Payments on account'; return q;
  }
  if (type === 'Supplies-beginning') {
    const end = money(3000,12000,100);
    const purchases = money(10000,35000,100);
    const used = money(8000,30000,100);
    const beg = end + used - purchases;
    if (beg < 0) return genMissingAccountBalance(forceType);
    const q = baseQuestion('missing-supplies-beginning','ledger','numeric',`Supplies ended at $${fmt(end)}. Purchases during the period were $${fmt(purchases)} and supplies used were $${fmt(used)}. What was beginning Supplies?`,`Supplies is debit-normal: Beginning + Debits = Ending + Credits. Beginning + ${fmt(purchases)} = ${fmt(end)} + ${fmt(used)}, so beginning Supplies = ${fmt(beg)}.`,['Supplies is debit-normal.', 'Use Beginning + Debits = Ending + Credits.']);
    q.answer = beg; q.answerLabel='Beginning Supplies'; return q;
  }
  const beg = money(5000,20000,100);
  const services = money(30000,80000,100);
  const end = money(3000,20000,100);
  const collections = beg + services - end;
  const q = baseQuestion('missing-ar-collections','ledger','numeric',`Accounts Receivable began at $${fmt(beg)} and ended at $${fmt(end)}. Services on account were $${fmt(services)}. How much cash was collected on account?`,`A/R is debit-normal: Beginning + Debits = Ending + Credits. ${fmt(beg)} + ${fmt(services)} = ${fmt(end)} + collections, so collections = ${fmt(collections)}.`,['A/R is debit-normal.', 'Use Beginning + Debits = Ending + Credits.']);
  q.answer = collections; q.answerLabel='Collections on account'; return q;
}

export function genPostingConcept() {
  const bank = [
    ['In accounting, “posting” means:', 'Copying journal entry information to the ledger', ['Preparing financial statements','Recording the first journal entry','Closing temporary accounts'], 'Posting transfers the same debit/credit information from the journal to the appropriate ledger accounts.'],
    ['The left-hand side of every T-account is the:', 'Debit side', ['Credit side','Normal side','Increase side'], 'The left side is always debit, regardless of account type.'],
    ['The right-hand side of every T-account is the:', 'Credit side', ['Debit side','Normal side','Decrease side'], 'The right side is always credit, regardless of account type.']
  ];
  const [prompt,answer,wrong,explanation] = pick(bank);
  const q = baseQuestion('posting-concept','ledger','mcq',prompt,explanation,['Think about what changes when information moves from journal to ledger.', 'Remember: T-account sides never change—left is debit, right is credit.']);
  q.options = shuffle([answer,...wrong]); q.answer = answer; return q;
}

export function genTrialBalanceConcept() {
  const bank = [
    ['What is the primary purpose of a trial balance?', 'Verify that total debit balances equal total credit balances', ['Calculate net income','Record transactions chronologically','Close temporary accounts'], 'The trial balance primarily checks that the ledger’s debit balances equal its credit balances.'],
    ['Which order is correct for a properly organized trial balance?', 'Assets → Liabilities → Capital → Withdrawals → Revenues → Expenses', ['Assets → Expenses → Liabilities → Revenues → Capital','Liabilities → Assets → Revenue → Expenses → Capital','Capital → Assets → Liabilities → Expenses → Revenue'], 'Accounts are grouped as assets, liabilities, then equity-related accounts; within equity: Capital, Withdrawals, Revenues, Expenses.'],
    ['A trial balance is best described as:', 'A list of accounts and their balances as of a particular date', ['A chronological list of transactions','A report of only cash transactions','A list of only asset and liability accounts'], 'A trial balance lists the account balances from the ledger as of a date.']
  ];
  const [prompt,answer,wrong,explanation] = pick(bank);
  const q = baseQuestion('trial-balance-concept','trial-balance','mcq',prompt,explanation,['Ask what the trial balance is checking or organizing.', 'Remember its main check: total debit balances = total credit balances.']);
  q.options = shuffle([answer,...wrong]); q.answer = answer; return q;
}

export function genTrialSummary() {
  const cash = money(15000,70000,1000);
  const ar = money(5000,50000,1000);
  const supplies = money(1000,15000,500);
  const equipment = money(10000,100000,1000);
  const assets = cash + ar + supplies + equipment;
  const ap = money(5000,Math.floor(assets*0.2/1000)*1000,1000);
  const wagesPay = money(1000,10000,1000);
  const note = money(5000,Math.floor(assets*0.25/1000)*1000,1000);
  const liabilities = ap + wagesPay + note;
  const revenue = money(100000,300000,1000);
  const wageExp = money(30000,90000,1000);
  const rentExp = money(10000,40000,1000);
  const utilExp = money(3000,15000,1000);
  const suppliesExp = money(2000,12000,1000);
  const expenses = wageExp + rentExp + utilExp + suppliesExp;
  const income = revenue - expenses;
  const equity = assets - liabilities;
  const withdrawals = money(5000,25000,1000);
  const capital = equity - income + withdrawals;
  const rows = [
    ['Cash',cash,'Dr'],['Accounts Receivable',ar,'Dr'],['Supplies',supplies,'Dr'],['Equipment',equipment,'Dr'],
    ['Accounts Payable',ap,'Cr'],['Wages Payable',wagesPay,'Cr'],['Notes Payable',note,'Cr'],['Capital',capital,'Cr'],
    ['Withdrawals',withdrawals,'Dr'],['Fees Earned',revenue,'Cr'],['Wages Expense',wageExp,'Dr'],['Rent Expense',rentExp,'Dr'],['Utilities Expense',utilExp,'Dr'],['Supplies Expense',suppliesExp,'Dr']
  ];
  const debitTotal = rows.filter(r=>r[2]==='Dr').reduce((s,r)=>s+r[1],0);
  const creditTotal = rows.filter(r=>r[2]==='Cr').reduce((s,r)=>s+r[1],0);
  if (debitTotal !== creditTotal) {
    // Adjust Capital to keep the generated trial balance in balance.
    const capRow = rows.find(r=>r[0]==='Capital');
    capRow[1] += debitTotal - creditTotal;
  }
  const q = baseQuestion('trial-summary','financial-statements','summary',`Use the generated trial balance to determine total assets, total liabilities, ending equity, and income.`,`Total assets come from asset accounts; total liabilities from liability accounts; ending equity = Assets − Liabilities; income = Revenues − Expenses. Withdrawals are not an expense.`,[
    'Group accounts by type before calculating anything.',
    'Income uses only revenues and expenses. Equity can be checked with Assets − Liabilities.'
  ]);
  q.table = rows;
  q.fields = [
    {key:'assets',label:'Total Assets',answer:assets},
    {key:'liabilities',label:'Total Liabilities',answer:liabilities},
    {key:'equity',label:'Ending Equity',answer:equity},
    {key:'income',label:'Income',answer:income}
  ];
  return q;
}

export function genStatementOrder() {
  const q = baseQuestion('statement-order','financial-statements','mcq','When using a trial balance to prepare the major statements covered on Test #1, which order is most efficient?','Income Statement → Statement of Owner’s Equity → Balance Sheet, because net income flows into the equity statement and ending equity flows into the balance sheet.',[
    'Which statement produces net income?',
    'Which statement needs net income, and which statement then needs ending equity?'
  ]);
  q.options = shuffle([
    'Income Statement → Statement of Owner’s Equity → Balance Sheet',
    'Balance Sheet → Income Statement → Statement of Owner’s Equity',
    'Statement of Owner’s Equity → Balance Sheet → Income Statement',
    'Trial Balance → Balance Sheet → Journal'
  ]);
  q.answer = 'Income Statement → Statement of Owner’s Equity → Balance Sheet';
  return q;
}

export function genCapitalBalanceTrap() {
  const q = baseQuestion('capital-balance-trap','financial-statements','mcq','On an unclosed trial balance, the Capital balance generally represents:','Beginning equity plus owner investment recorded during the period. Income and withdrawals remain in separate temporary accounts until closing.',[
    'Remember that revenues, expenses, and withdrawals are still separate accounts before closing.',
    'Ask which equity changes have already been recorded directly in Capital.'
  ]);
  q.options = shuffle([
    'Beginning equity plus owner investment during the period',
    'Ending equity after income and withdrawals',
    'Only net income for the period',
    'Total assets minus total expenses'
  ]);
  q.answer = 'Beginning equity plus owner investment during the period';
  return q;
}

export function genMultiEffects() {
  const chosen = shuffle(TRANSACTIONS).slice(0,5);
  const items = chosen.map(t => {
    const n = money(500,20000,100);
    return {prompt:t.text(n), options:EFFECT_OPTIONS, answer:t.effect, explanation:t.explanation};
  });
  const q = baseQuestion('multi-effects','transaction-analysis','multi', 'Choose the accounting-equation effect for each transaction.', 'Analyze each transaction independently using Assets = Liabilities + Equity.', ['Ignore account names at first. Focus only on A/L/E direction.', 'Check whether total assets change or whether one asset simply replaces another.']);
  q.items = items;
  return q;
}

export function genMultiJournalTypes() {
  const defs = [
    ['Withdrawal by owner','Dr Withdrawals; Cr Cash'],
    ['Borrow money from bank','Dr Cash; Cr Notes Payable'],
    ['Payment on account','Dr Accounts Payable; Cr Cash'],
    ['Provide consulting services on account','Dr Accounts Receivable; Cr Revenue'],
    ['Expense incurred on account','Dr Expense; Cr Accounts Payable']
  ];
  const options = defs.map(x=>x[1]);
  const q = baseQuestion('multi-journal-types','journal','multi','Choose the journal-entry pattern for each transaction.', 'First analyze the transaction, then apply normal balances to determine debit and credit.', ['Translate each transaction into the specific accounts affected.', 'Remember: assets/expenses/withdrawals are debit-normal; liabilities/capital/revenue are credit-normal.']);
  q.items = defs.map(([prompt,answer])=>({prompt,answer,options}));
  return q;
}

export function genTestJournalSet() {
  const equipmentCost = money(20000,50000,1000);
  const cashPaid = money(5000,equipmentCost-5000,1000);
  const payable = equipmentCost - cashPaid;
  const hours = pick([40,50,60,70,80]);
  const rate = pick([200,250,300,350,400]);
  const service = hours * rate;
  const collection = money(2000,9000,500);
  const advance = money(5000,18000,500);
  const payAp = money(2000,9000,500);
  const utility = money(1000,5000,100);
  const entries = [
    {
      prompt:`Purchased office equipment for $${fmt(equipmentCost)}. Paid $${fmt(cashPaid)} cash and agreed to pay the remaining $${fmt(payable)} later.`,
      expected:[{account:'Equipment',debit:equipmentCost,credit:0},{account:'Cash',debit:0,credit:cashPaid},{account:'Accounts Payable',debit:0,credit:payable}],
      explanation:'Debit Equipment for full cost; credit Cash for cash paid and Accounts Payable for the amount owed.'
    },
    {
      prompt:`Provided ${hours} hours of services on account at $${fmt(rate)} per hour.`,
      expected:[{account:'Accounts Receivable',debit:service,credit:0},{account:'Fees Earned',debit:0,credit:service}],
      explanation:`Revenue earned = ${hours} × ${fmt(rate)} = ${fmt(service)}. Debit A/R and credit Fees Earned.`
    },
    {
      prompt:`Collected $${fmt(collection)} from a customer for services provided on account in a prior month.`,
      expected:[{account:'Cash',debit:collection,credit:0},{account:'Accounts Receivable',debit:0,credit:collection}],
      explanation:'Collection on account swaps A/R for Cash; no new revenue.'
    },
    {
      prompt:`A new client paid $${fmt(advance)} for services to be provided in the future.`,
      expected:[{account:'Cash',debit:advance,credit:0},{account:'Unearned Fees',debit:0,credit:advance}],
      explanation:'Cash received before earning revenue creates an Unearned Fees liability.'
    },
    {
      prompt:`Paid $${fmt(payAp)} to a supplier for earlier purchases on account.`,
      expected:[{account:'Accounts Payable',debit:payAp,credit:0},{account:'Cash',debit:0,credit:payAp}],
      explanation:'Payment on account reduces Accounts Payable and Cash.'
    },
    {
      prompt:`Received a $${fmt(utility)} utility bill for the current month, payable next month.`,
      expected:[{account:'Utilities Expense',debit:utility,credit:0},{account:'Accounts Payable',debit:0,credit:utility}],
      explanation:'Expense incurred now: debit Utilities Expense and credit Accounts Payable.'
    }
  ];
  const q = baseQuestion('test-journal-set','journal','journalSet','Journalize each of the six transactions. Each correctly journalized transaction is worth 1 point.','Use proper form: debit account(s) first, credit account(s) second, total debits = total credits.',[]);
  q.entries = entries;
  q.accounts = ACCOUNT_POOL;
  return q;
}

const SECTION_GENERATORS = {
  foundations: [genDefinition,genStatementIdentify,genAccountClassify],
  equations: [genEquationBasic,genEquityEquation,genRevenueFromExpandedEquity,genIncomeFromBalanceSheets],
  'transaction-analysis': [genTransactionEffect,genMultiEffects],
  'debits-credits': [genNormalBalance,genIncreaseDecreaseSide,genAbnormalBalance],
  journal: [genJournalEntry,genCompoundJournal,genMultiJournalTypes],
  ledger: [genAccountBalance,genMissingAccountBalance,genPostingConcept],
  'trial-balance': [genTrialBalanceConcept,genNormalBalance,genAbnormalBalance],
  'financial-statements': [genTrialSummary,genStatementOrder,genCapitalBalanceTrap,genStatementIdentify]
};

export function generateForSection(sectionId, preferredGenerator = null) {
  if (preferredGenerator) {
    const all = Object.values(SECTION_GENERATORS).flat();
    const fn = all.find(f => {
      try { return f().generator === preferredGenerator; } catch { return false; }
    });
    if (fn) return fn();
  }
  const q = pick(SECTION_GENERATORS[sectionId] || SECTION_GENERATORS.foundations)();
  q.section = sectionId;
  return q;
}

export function generateByGenerator(generator) {
  if (generator.startsWith('effect-')) return genTransactionEffect(generator.replace('effect-',''));
  if (generator.startsWith('journal-') && generator !== 'journal-compound') return genJournalEntry(generator.replace('journal-',''));
  const direct = {
    'definition':genDefinition,
    'statement-identify':genStatementIdentify,
    'account-classify':genAccountClassify,
    'equation-basic':genEquationBasic,
    'equity-equation':genEquityEquation,
    'income-from-balance-sheets':genIncomeFromBalanceSheets,
    'revenue-expanded-equity':genRevenueFromExpandedEquity,
    'normal-balance':genNormalBalance,
    'increase-decrease-side':genIncreaseDecreaseSide,
    'abnormal-balance':genAbnormalBalance,
    'journal-compound':genCompoundJournal,
    'balance-ar':()=>genAccountBalance('AR'),
    'balance-ap':()=>genAccountBalance('AP'),
    'balance-supplies':()=>genAccountBalance('Supplies'),
    'missing-ap-payments':()=>genMissingAccountBalance('AP-payments'),
    'missing-supplies-beginning':()=>genMissingAccountBalance('Supplies-beginning'),
    'missing-ar-collections':()=>genMissingAccountBalance('AR-collections'),
    'posting-concept':genPostingConcept,
    'trial-balance-concept':genTrialBalanceConcept,
    'trial-summary':genTrialSummary,
    'statement-order':genStatementOrder,
    'capital-balance-trap':genCapitalBalanceTrap,
    'multi-effects':genMultiEffects,
    'multi-journal-types':genMultiJournalTypes,
    'test-journal-set':genTestJournalSet
  };
  return (direct[generator] || genDefinition)();
}

function parseNum(value) {
  if (typeof value === 'number') return value;
  const cleaned = String(value ?? '').replace(/[$,\s]/g,'');
  if (cleaned === '') return NaN;
  return Number(cleaned);
}
function normAccount(v) {
  return String(v ?? '').trim().toLowerCase().replace(/\s+/g,' ')
    .replace('note payable','notes payable')
    .replace('unearned fees','unearned revenue')
    .replace('fees earned (revenue)','fees earned');
}
function rowsEqual(expected, response) {
  if (!Array.isArray(response)) return false;
  const clean = response.filter(r => r && (r.account || parseNum(r.debit) || parseNum(r.credit)));
  if (clean.length !== expected.length) return false;
  for (let i=0;i<expected.length;i++) {
    const e = expected[i], r = clean[i];
    if (normAccount(e.account) !== normAccount(r.account)) return false;
    const rd = Number.isNaN(parseNum(r.debit)) ? 0 : parseNum(r.debit);
    const rc = Number.isNaN(parseNum(r.credit)) ? 0 : parseNum(r.credit);
    if (rd !== (e.debit||0) || rc !== (e.credit||0)) return false;
  }
  return true;
}

export function gradeQuestion(q, response) {
  if (q.type === 'mcq') return {correct: response === q.answer, score: response === q.answer ? 1 : 0, max:1};
  if (q.type === 'numeric') {
    const correct = parseNum(response) === Number(q.answer);
    return {correct, score:correct?1:0, max:1};
  }
  if (q.type === 'multi') {
    const results = q.items.map((item,i)=>response?.[i] === item.answer);
    const score = results.filter(Boolean).length;
    return {correct:score===q.items.length, score, max:q.items.length, parts:results};
  }
  if (q.type === 'journal') {
    const correct = rowsEqual(q.expected,response);
    return {correct, score:correct?1:0, max:1};
  }
  if (q.type === 'summary') {
    const parts = q.fields.map(f=>parseNum(response?.[f.key]) === Number(f.answer));
    const score = parts.filter(Boolean).length;
    return {correct:score===q.fields.length, score, max:q.fields.length, parts};
  }
  if (q.type === 'journalSet') {
    const parts = q.entries.map((e,i)=>rowsEqual(e.expected,response?.[i]));
    const score = parts.filter(Boolean).length;
    return {correct:score===q.entries.length, score, max:q.entries.length, parts};
  }
  return {correct:false,score:0,max:1};
}

export function expectedAnswerText(q) {
  if (q.type === 'mcq' || q.type === 'numeric') return q.type === 'numeric' ? `$${fmt(q.answer)}` : q.answer;
  if (q.type === 'multi') return q.items.map((x,i)=>`${i+1}. ${x.answer}`).join('\n');
  if (q.type === 'journal') return q.expected.map(r=>`${r.debit? 'Dr':'Cr'} ${r.account} ${fmt(r.debit||r.credit)}`).join('\n');
  if (q.type === 'summary') return q.fields.map(f=>`${f.label}: $${fmt(f.answer)}`).join('\n');
  if (q.type === 'journalSet') return q.entries.map((e,i)=>`${i+1}) ${e.expected.map(r=>`${r.debit?'Dr':'Cr'} ${r.account} ${fmt(r.debit||r.credit)}`).join('; ')}`).join('\n');
  return '';
}

export function buildPracticeTest() {
  const q1 = genDefinition();
  // force asset-style definition for closer practice-test structure
  q1.prompt = 'Properties, or resources, owned by a business are referred to as:';
  q1.options = shuffle(['equity','expenses','liabilities','revenues','assets']);
  q1.answer = 'assets'; q1.explanation = 'Properties or resources owned by a business are assets.';

  const q2 = genMultiEffects();
  const forced2 = [
    ['The owner invests cash in the business.','Increase assets; increase equity'],
    ['Cash is paid to purchase office supplies.','Increase one asset; decrease another asset'],
    ['Cash is collected on account from a customer.','Increase one asset; decrease another asset'],
    ['Cash is received for services provided to customers.','Increase assets; increase equity'],
    ['Cash is paid for employee salaries already incurred.','Decrease assets; decrease equity']
  ];
  q2.items = forced2.map(([prompt,answer])=>({prompt,answer,options:EFFECT_OPTIONS}));

  const q3 = genDefinition();
  q3.prompt = 'The asset created when a business provides a service on account is called:';
  q3.options = shuffle(['Accounts Payable','Revenue','Accounts Receivable','Cash','Expense']);
  q3.answer = 'Accounts Receivable';
  q3.explanation = 'Providing services on account creates Accounts Receivable because the customer owes the business.';

  const q4 = genMissingAccountBalance('AP-payments');
  const q5 = genStatementIdentify(); q5.prompt='Which statement describes revenues and expenses during a specified period?'; q5.answer='Income Statement'; q5.options=shuffle(STATEMENT_OPTIONS);
  const q6 = genDefinition(); q6.prompt='The process of initially recording a business transaction is called:'; q6.answer='Journalizing'; q6.options=shuffle(['Posting','Journalizing','Transposing','Sliding']);
  const q7 = genMissingAccountBalance('Supplies-beginning');
  const q8 = genTrialBalanceConcept(); q8.prompt='The verification that the sum of debit balances and sum of credit balances in the ledger are equal is called:'; q8.answer='Trial Balance'; q8.options=shuffle(['Trial Balance','Ledger','Journal','Chart of accounts','Posting']);
  const q9 = genRevenueFromExpandedEquity();
  const q10 = genMultiJournalTypes();
  const q11 = genAccountBalance('AR');
  const q12 = genIncomeFromBalanceSheets();
  const q13 = genAbnormalBalance();
  const q14 = genTrialSummary();
  const q15 = genTestJournalSet();

  return [
    {number:1,points:1,q:q1}, {number:2,points:5,q:q2}, {number:3,points:1,q:q3},
    {number:4,points:1,q:q4}, {number:5,points:1,q:q5}, {number:6,points:1,q:q6},
    {number:7,points:1,q:q7}, {number:8,points:1,q:q8}, {number:9,points:1,q:q9},
    {number:10,points:5,q:q10}, {number:11,points:1,q:q11}, {number:12,points:1,q:q12},
    {number:13,points:1,q:q13}, {number:14,points:4,q:q14}, {number:15,points:6,q:q15}
  ];
}

export const engineInternals = { TRANSACTIONS, EFFECT_OPTIONS, ACCOUNT_POOL, NORMAL, parseNum, rowsEqual };
