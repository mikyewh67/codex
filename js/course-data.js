export const TEST_DATE = '2026-09-29';

export const SECTIONS = [
  {
    id: 'foundations',
    title: '1. Chapter 1 Foundations',
    short: 'Foundations',
    emphasis: 'Know what each financial statement answers and the equations behind it.',
    lesson: [
      'Income statement: reports results of operations for a period of time. Revenues earned − expenses incurred = income.',
      'Balance sheet: reports financial position as of a specific date. Assets = Liabilities + Equity.',
      'Statement of owner’s equity: explains changes in equity during a period. Beginning Equity + Investment + Income − Withdrawals = Ending Equity.',
      'Cash flow statement: summarizes cash inflows and outflows. Beginning Cash + Inflows − Outflows = Ending Cash. In this course, preparation of the full cash flow statement is not a Test #1 focus.',
      'Assets are economic resources owned by the business or owed to the business. Liabilities are obligations to creditors. Equity is the owner’s residual claim.'
    ],
    traps: [
      'Withdrawals are not expenses.',
      'Revenue is recognized when earned, not merely when cash is received.',
      'A balance sheet is “as of” a date; income and equity statements cover a period of time.'
    ]
  },
  {
    id: 'equations',
    title: '2. Accounting Equation Manipulation',
    short: 'Equation Manipulation',
    emphasis: 'Figure out what you know, then solve for the missing variable.',
    lesson: [
      'Primary equation: Assets = Liabilities + Equity. Rearranged: Equity = Assets − Liabilities; Liabilities = Assets − Equity.',
      'Income equation: Revenues − Expenses = Income.',
      'Equity equation: Beginning Equity + Investment + Income − Withdrawals = Ending Equity.',
      'For multi-period problems, first compute beginning and ending equity from assets and liabilities, then use the equity equation.'
    ],
    traps: [
      'Keep owner investment separate from revenue.',
      'Keep withdrawals separate from expenses.',
      'When income is a loss, treat it as a negative amount.'
    ]
  },
  {
    id: 'transaction-analysis',
    title: '3. Transaction Analysis',
    short: 'Transaction Analysis',
    emphasis: 'Professor emphasis: understand the financial-position effect first. Debit/credit comes after that.',
    lesson: [
      'Step 1 — Financial position: which elements of Assets, Liabilities, and/or Equity increase or decrease?',
      'Step 2 — Accounts: which specific accounts changed?',
      'Step 3 — Recording plan: which account is debited and which is credited?',
      'Every transaction keeps Assets = Liabilities + Equity in balance.'
    ],
    traps: [
      'Buying one asset with another asset can leave total assets unchanged.',
      'Collecting Accounts Receivable swaps one asset for another; it is not new revenue.',
      'Cash received before service is provided creates a liability (Unearned Revenue), not revenue.'
    ]
  },
  {
    id: 'debits-credits',
    title: '4. Debits, Credits & Normal Balances',
    short: 'Debits & Credits',
    emphasis: 'Normal balance = the side used when that account type increases.',
    lesson: [
      'Debit-normal: Assets, Expenses, Withdrawals.',
      'Credit-normal: Liabilities, Capital, Revenues.',
      'If a debit-normal account increases, debit it; if it decreases, credit it.',
      'If a credit-normal account increases, credit it; if it decreases, debit it.'
    ],
    traps: [
      'Debit does not always mean increase; credit does not always mean decrease.',
      'Accounts Payable normally has a credit balance. A debit balance may indicate a recording problem.',
      'Unearned Revenue is a liability and therefore normally has a credit balance.'
    ]
  },
  {
    id: 'journal',
    title: '5. Journal Entries',
    short: 'Journal Entries',
    emphasis: 'Do the analysis first; the journal entry is the formal recording of the result.',
    lesson: [
      'A journal is a chronological record of transactions.',
      'Debit account name(s) are listed first; credit account name(s) come second and are indented in formal presentation.',
      'Every journal entry affects at least two accounts, includes at least one debit and one credit, and total debits must equal total credits.',
      'Compound entries may affect three or more accounts, but total debits still equal total credits.'
    ],
    traps: [
      'Do not record a collection on account as revenue again.',
      'Do not credit Revenue for a customer advance until the service is earned.',
      'When an expense is incurred on account: debit Expense, credit Accounts Payable.'
    ]
  },
  {
    id: 'ledger',
    title: '6. Ledger, T-Accounts & Account Balances',
    short: 'Ledger / T-Accounts',
    emphasis: 'Posting means copying journal information into the ledger so each account shows its cumulative balance.',
    lesson: [
      'A ledger is a group of accounts. An account records increases and decreases in a specific item.',
      'Left side of every T-account is Debit; right side is Credit.',
      'Debit-normal account: Beginning Balance + Debits − Credits = Ending Balance.',
      'Credit-normal account: Beginning Balance + Credits − Debits = Ending Balance.'
    ],
    traps: [
      'Use the account’s normal side when deciding how its balance equation works.',
      'Payments on account debit Accounts Payable; collections on account credit Accounts Receivable.',
      'Posting does not change the journal entry; it transfers the same debit/credit information to accounts.'
    ]
  },
  {
    id: 'trial-balance',
    title: '7. Trial Balance',
    short: 'Trial Balance',
    emphasis: 'Primary purpose: verify total debit balances equal total credit balances.',
    lesson: [
      'A trial balance lists accounts and their balances as of a particular date.',
      'Order: Assets, Liabilities, then Equity-related accounts.',
      'Within equity-related accounts: Capital, Withdrawals, Revenues, Expenses.',
      'A balanced trial balance helps detect certain errors and is also used to prepare financial statements.'
    ],
    traps: [
      'A trial balance can balance even if some kinds of mistakes were made.',
      'Put a balance on the side that matches its actual debit or credit balance.',
      'Do not put withdrawals in the expense section.'
    ]
  },
  {
    id: 'financial-statements',
    title: '8. Financial Statements from the Trial Balance',
    short: 'Financial Statements',
    emphasis: 'Prepare statements efficiently in order: Income Statement → Owner’s Equity Statement → Balance Sheet.',
    lesson: [
      'Income Statement uses revenues and expenses to calculate income.',
      'Owner’s Equity Statement uses beginning equity, owner investment, income/loss, and withdrawals to calculate ending equity.',
      'Balance Sheet uses assets, liabilities, and ending equity as of a specific date.',
      'The Capital balance in an unclosed trial balance can combine beginning equity plus owner investment during the period.'
    ],
    traps: [
      'Withdrawals are not included in income.',
      'Use net income from the Income Statement in the Owner’s Equity Statement.',
      'Use ending equity from the Owner’s Equity Statement on the Balance Sheet.'
    ]
  }
];

export const QUICK_RULES = [
  ['Accounting equation', 'Assets = Liabilities + Equity'],
  ['Income', 'Revenues − Expenses = Income'],
  ['Ending equity', 'Beginning Equity + Investment + Income − Withdrawals'],
  ['Debit-normal', 'Assets, Expenses, Withdrawals'],
  ['Credit-normal', 'Liabilities, Capital, Revenues'],
  ['Journal', 'Debits first; credits second; total Dr = total Cr'],
  ['Trial balance order', 'Assets → Liabilities → Capital → Withdrawals → Revenues → Expenses'],
  ['Statements order', 'Income Statement → Owner’s Equity → Balance Sheet']
];
