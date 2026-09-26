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

## Ledger mobile redesign

The app now uses a matte-black and champagne-gold interface, a fixed five-tab mobile navigation bar, an animated mastery ring, and ten-question practice sessions. Incorrect answers still queue two targeted follow-ups, which can extend a session beyond ten questions. Session completion, correct streak milestones, and feedback have short animations that respect reduced-motion preferences.

The journal editor becomes stacked account cards on small screens. Add/remove rows and live debit/credit totals are available in practice and test mode. Hints preserve entered answers. The timed test continues counting down when switching sections.

### Home Screen installation

Open the deployed site in iPhone Safari, choose Share → Add to Home Screen, leave Open as Web App enabled if shown, and tap Add. The app includes a web manifest, standalone display settings, safe-area spacing, and 180/192/512-pixel icons. Replace an older shortcut if its title/icon remains cached. Internet access is required; this release does not cache the course offline.

### Progress and backups

Existing progress uses the same browser-storage key and is preserved. The More tab includes JSON backup/restore. Progress is local to each browser/origin; back it up before switching hostnames, devices, or clearing browser data. Mastery is a practice-progress estimate, not a predicted test result. Daily goals count practice attempts on the device’s local date.

### Validation for this redesign

The existing 800-question engine suite and JavaScript syntax checks pass. The redesign also has browser verification for responsive layouts, hints, reinforcement, session completion, local persistence, progress backup/restore, journal controls, test navigation/submission, reduced motion, and Home Screen assets.

## Visual learning library

The Learn tab contains eight tutorials with 26 reading pages. Each page combines plain-language explanation, an original visual or interactive example, and a takeaway. Topics cover account classification, statements, accounting equations, transaction effects, normal balances, journals, posting, account balances, trial balances, and statement preparation. Worked solutions can be revealed one step at a time and replayed. Reading completion is stored separately from practice mastery and is included in progress backups.

Review topic buttons route by the question's generator when necessary (for example, an abnormal-balance question opens debit/credit instruction even when sampled in trial-balance practice). Practice answers, question identity, and reinforcement queues are retained during tutorial visits. Mistake review and every test-result card also link to a tutorial.

The test welcome screen offers two modes: untimed guided practice with topic review on each question, and a timed 120-minute exam without in-question tutorial buttons. Both use the same 15-question / 31-point structure; histories distinguish guided and timed attempts. Topic review is available from timed-exam results.

The tutorial update was checked across all 26 pages at 320, 390, 768, and 1440 pixel widths, with no page-level horizontal overflow. Browser checks verified interactive examples, reading persistence without mastery changes, and returning from tutorials with answers intact for all 15 guided-test questions, including numeric, multiple-choice, multi-part, journal, summary, and journal-set controls. The existing 800-question engine checks continue to pass.


## Four-day coach

The dashboard now links to `coach.html`, a focused test-sprint coach for the September 29 Test #1.

- Four-day plan: equation control, transaction instincts, ledger/journal cleanup, then mixed review.
- Procedurally generated equation, equity, income, Supplies, Accounts Receivable, Accounts Payable, ledger, normal-balance, transaction-analysis, journal-pattern, and trial-balance questions.
- Wrong answers queue two new problems from the same pattern before returning to new material.
- Transaction questions force the professor-style order: financial-position effect → accounts → debit/credit entry.
- Listen-and-follow lessons use the browser Speech Synthesis API and visually highlight each step while it is read.
- Formula wall includes the rearrangements most likely to be confused on Test #1.
- Coach progress is stored locally under its own key and does not overwrite the existing Ledger practice history.
