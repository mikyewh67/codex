# Accounting 1 · Test #1 Trainer

An interactive, mobile-friendly Chapters 1–2 study app built around the supplied Accounting 1 professor recordings, notes, worksheets, practice assignments, handwritten notes, and Test #1 practice test/answer key.

## Test profile used by the app

- Test date: September 29, 2026
- Chapters: 1–2
- Professor emphasis: Chapter 2 / the accounting process
- Practice-test structure: 15 questions, 31 points, 120 minutes
- Major skills: transaction analysis, debit/credit logic, journalizing, posting/ledger balances, trial balance, accounting-equation manipulation, and financial statements

## What the app does

- Procedurally generates effectively unlimited practice questions.
- Tracks mastery by section in local browser storage.
- If a practice answer is wrong, explains the error and automatically queues **two new problems of the same type** before returning to new material.
- Repeats the same question family again if a reinforcement problem is missed.
- Includes hints that preserve the professor's preferred order: **financial position → accounts → debit/credit**.
- Includes journal-entry input tables, account-balance problems, trial-balance problems, and financial-statement calculations.
- Logs mistakes for targeted review.
- Includes a timed 15-question / 31-point practice test with fresh numbers on every run.

## Test simulator point structure

The simulation mirrors the supplied practice test's weighting:

- Q1: 1 point
- Q2: 5 points — accounting-equation effects
- Q3–Q9: 1 point each
- Q10: 5 points — journal-entry patterns
- Q11–Q13: 1 point each
- Q14: 4 points — trial balance / financial statement values
- Q15: 6 points — six journal entries

Total: **31 points**.

## Run locally

No build step or dependencies are required.

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## GitHub Pages

Because this is a static site, it can be published directly with GitHub Pages from the repository root. The `.nojekyll` file is included.

In this repository, open **Settings → Pages**, select **Deploy from a branch**, choose **main** and **/ (root)**, then save.

## Verify the question engine

With Node.js installed, run `npm test`. No dependency installation is needed. The included checks cover 800 generated questions, selected remediation families, and the 15-question / 31-point practice-test structure.

## Privacy / source handling

The original uploaded course files, recordings/transcripts, spreadsheets, and handwritten images are **not included in this repository**. The app contains derived study logic and original question generators only.
