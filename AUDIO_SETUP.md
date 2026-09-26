# Turn on the better audio

The app now has original, reviewed lesson scripts, an MP3 player, playback speed,
15-second rewind, follow-along highlighting, downloads, and lock-screen media controls
where supported. The OpenAI audio files still need to be generated once.

## One-time setup

1. Open [this repository’s Actions secrets](https://github.com/mikyewh67/codex/settings/secrets/actions).
2. Choose **New repository secret**.
3. Name it **OPENAI_API_KEY** and paste your key into the secret value. Save it.
4. Open [Generate lesson audio](https://github.com/mikyewh67/codex/actions/workflows/generate-audio.yml).
5. Select **Run workflow**, using **main**. Generation calls the paid OpenAI API.
6. Wait for the workflow to finish. It commits the MP3s and audio manifest to the repository.
7. Let Vercel deploy that commit, then refresh **Ledger → Academy → Listen**.
   If Vercel does not build the bot commit automatically, deploy the latest main commit
   from the Vercel dashboard. GitHub Pages can also serve these static MP3 files.

Do not paste the key into this chat, source code, a frontend environment variable,
or a browser form. No API key is used by the website. There is no public paid-generation
endpoint. Only a person who can run this repository’s workflow can trigger generation.
Keep API billing enabled and set a project budget/usage alert that you are comfortable with.
The key is a GitHub Actions secret, not a Vercel frontend setting.

## What it generates

- Why the signs change
- Beginning, increases, decreases, ending
- Where do I start? (multi-step equation problems)
- Who owes whom? (transaction analysis)
- From the story to the statements
- One continuous MP3 containing all five lessons, including answer pauses

The scripts are in `js/mastery-content.js`. They use full account names, original
explanations, and selected worked examples from the provided class materials. This is
AI narration, not a clone of the professor. The source transcripts are not published.

The generation script uses OpenAI `gpt-4o-mini-tts` with `marin`. It generates PCM,
inserts exact silent answer windows, measures segment timings, and encodes MP3 files.
A content hash avoids regenerating unchanged scripts on another run. Playing a file
does not use the API or create a new speech charge. Hosting bandwidth limits still apply.

For a continuous background session, use **Play all lessons**. MP3 playback and
lock-screen behavior depend on the browser and operating system. Download an MP3
and open it in your audio player if your device suspends web playback. The device-voice
fallback is for foreground listening only. Force-closing the app stops web playback.

## Local generation (alternative)

Use Node 22 and ffmpeg. Set `OPENAI_API_KEY` in your private shell environment without
committing it, then run:

```sh
node scripts/generate-audio.mjs
```

Commit the generated `audio/` files and deploy. You can validate scripts without a key:

```sh
node scripts/generate-audio.mjs --validate
```

If generation fails, no new manifest is published. Local generation retains temporary
PCM segments in the ignored `.audio-build/` folder so another local run can resume.
GitHub runners are ephemeral: restarting a failed workflow can generate paid segments
again. If repository branch protection blocks the final push, the audio commit needs
an authorized branch/PR workflow before deployment.
