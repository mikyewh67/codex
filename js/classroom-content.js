// Visual companions to the existing narration. Segment boundaries come from the
// measured audio manifest, not estimated reading speeds. No new TTS is required.
const question = (prompt, options, answer, hints, explanation) => ({prompt, options, answer, hints, explanation});
const slide = (title, formula, rows, note, checkpoint=null, kind='equation') => ({title, formula, rows, note, checkpoint, kind});
export const CLASSROOM = {
 equations: [
  slide('Keep both sides equal', 'Assets = Liabilities + Equity', [
   ['Start', '18,000 = 7,000 + Equity'], ['Subtract 7,000 on BOTH sides', '18,000 − 7,000 = Equity'], ['Check', '18,000 = 7,000 + 11,000']
  ], 'There is no magic sign flip. The same operation on both sides keeps the equation balanced.'),
  slide('Start → changes → finish', 'Beginning Equity + Investment + Income − Withdrawals = Ending Equity', [
   ['Beginning Equity', '$10,000'], ['Investment', '+ $2,000'], ['Income', '+ $5,000'], ['Withdrawals', '− $1,000'], ['Ending Equity', '?']
  ], 'Follow the story forward. The narrator will pause for your answer.', question(
   'What is ending equity?', ['$16,000', '$18,000', '$8,000', '$14,000'], '$16,000',
   ['Investments and income increase equity. Withdrawals decrease it.', 'Start with 10,000. Add 2,000 and 5,000, then subtract 1,000.'],
   '10,000 + 2,000 + 5,000 − 1,000 = 16,000. You worked forward from the beginning.')),
  slide('Now work backward', 'Beginning Equity = Ending Equity − Investment − Income + Withdrawals', [
   ['The original story', '? + 2,000 + 5,000 − 1,000 = 16,000'], ['Undo the increases', 'Subtract 2,000 and 5,000 on BOTH sides'], ['Undo the decrease', 'Add 1,000 on BOTH sides'], ['Beginning Equity', '16,000 − 2,000 − 5,000 + 1,000 = 10,000']
  ], 'Add back withdrawals because you are undoing the earlier decrease.'),
  slide('What if withdrawals is missing?', 'Withdrawals = Beginning Equity + Investment + Income − Ending Equity', [
   ['Start here', '10,000 + 2,000 + 5,000 − Withdrawals = 16,000'], ['Add Withdrawals to BOTH sides', '10,000 + 2,000 + 5,000 = 16,000 + Withdrawals'], ['Subtract Ending Equity', 'Withdrawals = 10,000 + 2,000 + 5,000 − 16,000']
  ], 'The missing amount has a minus sign. Make it positive by adding it to both sides.', question(
   'How much did the owner withdraw?', ['$1,000', '$3,000', '$7,000', '$33,000'], '$1,000',
   ['How much equity would there be BEFORE the owner took anything out?', 'Add beginning equity, investment, and income. Compare that total with the $16,000 left.'],
   'Before withdrawals, equity was $17,000. Only $16,000 remained, so the owner withdrew $1,000.')),
  slide('A loss is negative income', 'Revenue − Expenses = Net Income', [
   ['Revenue', '$9,000'], ['Expenses', '− $12,000'], ['Net Income', '− $3,000 → a loss'], ['Effect on equity', 'Adding −3,000 makes equity fall by 3,000']
  ], 'Owner investment is not revenue. Owner withdrawals are not expenses.', question(
   'To undo “+ Investment” next to the missing amount, what do you do?',
   ['Subtract investment from BOTH sides', 'Add investment to BOTH sides', 'Change the sign of only the answer', 'Ignore investment'],
   'Subtract investment from BOTH sides', ['Undo adding with the opposite operation.', 'Keep the two sides equal while you remove the investment term.'],
   'Subtracting investment from both sides cancels the added investment without changing the equality.'))
 ],
 balances: [
  slide('One story, three account types', 'Beginning + Increases − Decreases = Ending', [
   ['Start with what was there', 'Beginning balance'], ['Put more in', '+ Increases'], ['Take some out', '− Decreases'], ['See what remains', 'Ending balance']
  ], 'For supplies: purchases put supplies in; supplies used takes them out.', null, 'flow'),
  slide('Find beginning supplies', 'Beginning Supplies + Purchases − Supplies Used = Ending Supplies', [
   ['Fill in what you know', '? + 18,700 − 21,100 = 3,400'], ['Undo purchases', 'Subtract 18,700 from BOTH sides'], ['Undo supplies used', 'Add 21,100 to BOTH sides'], ['Beginning Supplies', '3,400 − 18,700 + 21,100 = 5,800']
  ], 'Check forward: 5,800 + 18,700 − 21,100 = 3,400.'),
  slide('Your turn: find the start', 'Beginning Supplies + Purchases − Supplies Used = Ending Supplies', [
   ['Ending Supplies', '$400'], ['Purchases', '$900'], ['Supplies Used', '$1,200'], ['Beginning Supplies', '?']
  ], 'The ending balance is known. Work backward to find the beginning.', question(
   'What were beginning supplies?', ['$700', '$100', '$1,700', '$2,500'], '$700',
   ['Start at the ending balance. Undo purchases and undo supplies used.', 'Beginning = Ending − Purchases + Used. Substitute the three amounts.'],
   '400 − 900 + 1,200 = 700. Check: 700 + 900 − 1,200 = 400.')),
  slide('Money customers owe YOU', 'Beginning Accounts Receivable + Sales on Account − Collections = Ending Accounts Receivable', [
   ['Customers owed at the beginning', '$4,000'], ['New sales on account', '+ $9,000'], ['Customers still owe at the end', '$3,000'], ['Collections', '4,000 + 9,000 − 3,000 = 10,000']
  ], 'Collecting an old balance swaps Accounts Receivable for Cash. It is not new revenue.'),
  slide('Money YOU owe suppliers', 'Beginning Accounts Payable + Purchases on Account − Payments = Ending Accounts Payable', [
   ['Write the original story', '22,100 + 90,800 − Payments = 30,300'], ['Add Payments to BOTH sides', '22,100 + 90,800 = 30,300 + Payments'], ['Subtract Ending Payable', 'Payments = 22,100 + 90,800 − 30,300'], ['Amount paid', '$82,600']
  ], 'Paying an old supplier balance reduces a liability. It is not a new expense.'),
  slide('Your turn: what left the account?', 'Beginning Accounts Payable + Purchases on Account − Payments = Ending Accounts Payable', [
   ['Owed at the beginning', '$1,000'], ['Bought more on account', '$2,000'], ['Still owes at the end', '$800'], ['Payments', '?']
  ], 'Add the starting debt and new debt. Then consider how much is still unpaid.', question(
   'How much did the business pay?', ['$2,200', '$3,800', '$1,200', '$200'], '$2,200',
   ['First calculate the debt before any payments were made.', 'Payments = Beginning + Purchases − Ending. The $800 is what remains unpaid.'],
   '1,000 + 2,000 − 800 = 2,200. Paying $2,200 leaves the $800 ending payable.')),
  slide('Do not record it twice', 'Collection ≠ new revenue · Payment on account ≠ new expense', [
   ['Collect an old customer balance', 'Cash ↑ · Accounts Receivable ↓'], ['Pay an old supplier balance', 'Accounts Payable ↓ · Cash ↓']
  ], 'Name the account. Identify its increases and decreases. Then use the beginning-to-ending story.', question(
   'A customer pays an amount already recorded in Accounts Receivable. What happens?',
   ['Cash increases; Accounts Receivable decreases', 'Cash increases; new revenue is earned again', 'Cash decreases; Accounts Payable decreases', 'Accounts Receivable increases; Cash decreases'],
   'Cash increases; Accounts Receivable decreases', ['The customer no longer owes you that amount.', 'You are exchanging an amount owed to you for cash.'],
   'Collection replaces one asset with another. The earlier revenue is not recorded a second time.'), 'compare')
 ],
 bridge: [
  slide('Start where you have enough information', 'Assets − Liabilities = Equity', [
   ['Beginning date', 'Beginning Assets − Beginning Liabilities = Beginning Equity'], ['Ending date', 'Ending Assets − Ending Liabilities = Ending Equity']
  ], 'Use amounts from the SAME date. There is no rule that every problem starts at the end.', null, 'compare'),
  slide('Connect three small calculations', 'Beginning Equity → Ending Equity → Ending Liabilities', [
   ['1 · Find beginning equity', '55,000 − 24,500 = 30,500'], ['2 · Apply the changes', '30,500 + 6,000 + 8,500 − 3,500 = 41,500'], ['3 · Find ending liabilities', '58,000 − 41,500 = 16,500']
  ], 'Each answer supplies a missing number for the next equation.', null, 'flow'),
  slide('Sometimes the path goes backward', 'Ending Equity → Beginning Equity → Beginning Liabilities', [
   ['Find ending equity', 'Ending Assets − Ending Liabilities'], ['Undo the changes', 'Ending Equity − Investment − Income + Withdrawals'], ['Find beginning liabilities', 'Beginning Assets − Beginning Equity']
  ], 'Start at the end here because the ending information is complete.', null, 'flow'),
  slide('Step 1 · Find ending equity', 'Ending Assets − Ending Liabilities = Ending Equity', [
   ['Ending Assets', '$20,000'], ['Ending Liabilities', '$8,000'], ['Ending Equity', '?']
  ], 'Other details will matter in the next steps. First use the two ending balances.', question(
   'What is ending equity?', ['$12,000', '$28,000', '$7,000', '$8,000'], '$12,000',
   ['Equity is what remains after liabilities are subtracted from assets.', 'Use the ENDING amounts: 20,000 minus 8,000.'],
   '20,000 − 8,000 = 12,000. Keep this ending-equity amount for the next step.')),
  slide('Step 2 · Undo the changes', 'Beginning Equity = Ending Equity − Investment − Income + Withdrawals', [
   ['Ending Equity', '$12,000'], ['Investment', '$2,000'], ['Income', '$3,000'], ['Withdrawals', '$1,000'], ['Beginning Equity', '?']
  ], 'Undo investment and income; add back withdrawals.', question(
   'What is beginning equity?', ['$8,000', '$16,000', '$6,000', '$10,000'], '$8,000',
   ['You are working backward from $12,000, not adding the changes again.', '12,000 − 2,000 − 3,000 + 1,000. Withdrawals are added back.'],
   'Beginning equity was $8,000. Check forward: 8,000 + 2,000 + 3,000 − 1,000 = 12,000.')),
  slide('Step 3 · Use the correct date', 'Beginning Liabilities = Beginning Assets − Beginning Equity', [
   ['Beginning Assets', '$15,000'], ['Beginning Equity from step 2', '$8,000'], ['Beginning Liabilities', '?']
  ], 'Use beginning equity here—not the ending equity from step 1.', question(
   'What were beginning liabilities?', ['$7,000', '$3,000', '$23,000', '$12,000'], '$7,000',
   ['The liabilities question is about the BEGINNING date.', 'Subtract the $8,000 beginning equity from the $15,000 beginning assets.'],
   '15,000 − 8,000 = 7,000. You connected all three equations using the right dates.')),
  slide('When income is the missing piece', 'Income = Ending Equity − Beginning Equity − Investment + Withdrawals', [
   ['First', 'Find equity at BOTH dates'], ['Next', 'Remove owner investment from the increase'], ['Then', 'Add back owner withdrawals'], ['Check', 'A negative result means a net loss']
  ], 'Ask: what date am I using, what do I know, and what does the next step need?', question(
   'When should you start with ending equity?',
   ['When the known ending amounts help you solve the missing item', 'Always, for every equation question', 'Never; beginning equity must always come first', 'Only when there are withdrawals'],
   'When the known ending amounts help you solve the missing item', ['The starting point depends on what the question gives you.', 'Look for a date where assets and liabilities are both known.'],
   'Start where information is complete. Work toward the unknown instead of memorizing one fixed direction.'))
 ],
 transactions: [
  slide('Collecting is not earning again', 'Financial position → Account names → Debit / Credit', [
   ['The story', 'Collect $900 that a customer already owes'], ['Assets', 'Cash +$900 · Accounts Receivable −$900'], ['Debit', 'Cash $900'], ['Credit', 'Accounts Receivable $900']
  ], 'Total assets stay the same. Revenue was recorded when the service was performed.', null, 'entry'),
  slide('Your turn: pay an old bill', 'An existing supplier balance is being paid', [
   ['The payment', '$900 cash'], ['The obligation', 'An old amount owed to a supplier'], ['Ask yourself', 'Which accounts get smaller?']
  ], 'First think about the story. Do not jump straight to debit and credit.', question(
   'Which accounts change when you pay the old supplier balance?',
   ['Cash decreases; Accounts Payable decreases', 'Cash decreases; a new expense increases', 'Cash increases; Accounts Receivable decreases', 'Cash increases; Accounts Payable increases'],
   'Cash decreases; Accounts Payable decreases', ['Cash leaves the business. What happens to the old debt?', 'The bill was already recorded. This payment makes the unpaid liability smaller.'],
   'Cash and Accounts Payable both decrease. Debit Accounts Payable; credit Cash.')),
  slide('Old bill versus a new expense', 'Same payment timing? Different accounting story.', [
   ['Pay an existing bill', 'Debit Accounts Payable · Credit Cash'], ['Use electricity now, pay later', 'Debit Utilities Expense · Credit Accounts Payable'], ['Why the second is different', 'A new expense and a new debt are created now']
  ], 'An expense can reduce equity even before any cash is paid.', null, 'compare'),
  slide('Debit and credit are sides', 'Debit = left · Credit = right', [
   ['Increase with a DEBIT', 'Assets · Expenses · Withdrawals'], ['Increase with a CREDIT', 'Liabilities · Capital · Revenue'], ['Decrease an account', 'Use its opposite side']
  ], 'An expense account increases with a debit, even though the expense reduces total equity.', null, 'compare'),
  slide('Paid BEFORE doing the work', 'Cash received does not always mean revenue earned', [
   ['Customer pays', '$500'], ['Service performed?', 'Not yet'], ['Your business still owes', 'The promised service']
  ], 'Think about what the business must still do for the customer.', question(
   'Is the $500 earned revenue right now?',
   ['No—record a liability called Unearned Revenue', 'Yes—every cash receipt is revenue', 'No—record an owner withdrawal', 'Yes—record it as Accounts Receivable'],
   'No—record a liability called Unearned Revenue', ['Revenue is earned when the service is performed.', 'The business still owes the customer something. That obligation is a liability.'],
   'Debit Cash $500; credit Unearned Revenue $500. Recognize the revenue when the work is completed.')),
  slide('First an obligation, then revenue', 'Advance payment → Work completed', [
   ['When cash arrives in advance', 'Debit Cash · Credit Unearned Revenue'], ['When the work is completed', 'Debit Unearned Revenue · Credit Fees Earned'], ['Other cash receipts that are NOT revenue', 'Owner investment · Borrowing']
  ], 'Remove the obligation when the business delivers the promised service.', null, 'entry'),
  slide('One debit, two credits', 'Total debits = Total credits', [
   ['Debit Equipment', '$10,000 · full cost'], ['Credit Cash', '$4,000 · paid now'], ['Credit Accounts Payable', '$6,000 · owed later'], ['Check', '$10,000 = $4,000 + $6,000']
  ], 'Equal dollar totals—not necessarily the same number of accounts.', question(
   'How much should be debited to Equipment?', ['$10,000', '$4,000', '$6,000', '$14,000'], '$10,000',
   ['The payment method does not change how much equipment the business acquired.', 'Use the FULL cost of the equipment, not only the cash paid.'],
   'Equipment increases by the full $10,000. Cash and the new payable explain how that cost was financed.'), 'entry')
 ],
 ledger: [
  slide('Follow the accounting process', 'Analyze → Journal → Ledger → Trial balance', [
   ['Journal', 'Transactions in date order'], ['Ledger', 'Activity grouped by account'], ['Posting', 'Copy each entry to its ledger account'], ['Keep the same side', 'A debit stays a debit; a credit stays a credit']
  ], 'The journal tells what happened. The ledger tells each account’s balance.', null, 'flow'),
  slide('Normal does not mean guaranteed', 'Beginning Balance + Increases − Decreases = Ending Balance', [
   ['Cash · normally debit', '2,000 + 5,000 debits − 3,000 credits = 4,000 debit'], ['Payable · normally credit', 'Beginning + Credits − Debits = Ending'], ['Actual balance', 'Whichever side has the larger total']
  ], 'A negative result on the normal side indicates a balance on the opposite side.'),
  slide('Your turn: name the report', 'Total debit balances = Total credit balances', [
   ['Start with', 'Account balances in the ledger'], ['Compare', 'Sum of debit balances and sum of credit balances']
  ], 'The narrator is asking for the report that verifies this equality.', question(
   'Which report checks that the ledger’s debit and credit balances are equal?',
   ['Trial balance', 'Income statement', 'Statement of owner’s equity', 'Cash receipt'], 'Trial balance',
   ['It lists the accounts and their balances in debit and credit columns.', 'It is the accounting-process step after posting to the ledger.'],
   'The trial balance verifies the equality of total debit balances and total credit balances.')),
  slide('Balanced does not mean error-free', 'A trial balance checks equality—not every mistake', [
   ['Omit an entire balanced entry', 'Totals can still agree'], ['Use the wrong accounts with equal amounts', 'Totals can still agree'], ['Copy ledger balances', 'Use the ACTUAL debit or credit side']
  ], 'Group assets, liabilities, capital, withdrawals, revenues, and expenses.', null, 'compare'),
  slide('One statement feeds the next', 'Income statement → Equity statement → Balance sheet', [
   ['1 · Income', 'Revenue − Expenses'], ['2 · Ending Equity', 'Beginning + Investment + Income − Withdrawals'], ['3 · Balance Sheet', 'Assets = Liabilities + Ending Equity']
  ], 'If capital already includes the owner’s investment, do not add that investment a second time.', null, 'flow'),
  slide('Step 1 · Find income', 'Revenue − Expenses = Income', [
   ['Revenue', '$12,000'], ['Expenses', '$7,000'], ['Income to carry forward', '?']
  ], 'The other equity details come next. Start with revenue and expenses.', question(
   'What is income?', ['$5,000', '$19,000', '$7,000', '$12,000'], '$5,000',
   ['Income is what remains after expenses.', 'Subtract expenses from revenue, not the other way around.'],
   '12,000 − 7,000 = 5,000. Carry that income to the equity statement.')),
  slide('Step 2 · Find ending equity', 'Beginning Equity + Investment + Income − Withdrawals = Ending Equity', [
   ['Beginning Equity', '$8,000'], ['Investment', '+ $2,000'], ['Income from step 1', '+ $5,000'], ['Withdrawals', '− $1,000'], ['Ending Equity', '?']
  ], 'Use the income you just calculated—not the $12,000 revenue.', question(
   'What ending equity goes to the balance sheet?', ['$14,000', '$21,000', '$16,000', '$10,000'], '$14,000',
   ['Add the increases to beginning equity, then subtract the owner’s withdrawals.', '8,000 + 2,000 + 5,000 − 1,000. Do not substitute revenue for income.'],
   'Ending equity is $14,000. That amount belongs in the equity section of the balance sheet.')),
  slide('Period versus point in time', 'Income statement: DURING a period · Balance sheet: AT a date', [
   ['Income statement', 'Results over a month, quarter, or year'], ['Balance sheet', 'Assets, liabilities, and equity on one date'], ['Your routine', 'Explain the story before calculating']
  ], 'You have followed a transaction all the way through to the statements.', question(
   'Can a trial balance balance even when an entire transaction is missing?',
   ['Yes—both the debit and credit could be missing', 'No—equal totals prove all transactions were recorded', 'Only if the missing transaction was paid in cash', 'Only if revenue equals expenses'],
   'Yes—both the debit and credit could be missing', ['Think about omitting BOTH sides of a balanced entry.', 'What would happen to equality if neither side was added to the ledger?'],
   'Equal totals do not prove completeness. Omitting an entire balanced entry can leave the trial balance in balance.'), 'compare')
 ]
};
