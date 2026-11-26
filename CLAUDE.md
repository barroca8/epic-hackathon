# Team instructions for every Claude

Read `README.md` first and follow its rules.

## Be extremely concise

Six people and six Claudes work here all afternoon. Bloat is the main risk.

- Replies: the answer first, a few lines at most. No recaps, no option surveys, no offers of extra work.
- Files: add a line only if someone will act on it. Edit or delete before appending.
- No new files, folders, tools or features unless a ticket in `NEXT_STEPS.md` asks for them.
- Notes: one finding per line, with the evidence (command or file).
- Code: the smallest thing that finishes the ticket. No abstractions for later.

## Keep GitHub in sync

- Before any work: `git pull --rebase`.
- After every finished step: `git add` only your own `work/<name>/` and `notes/<name>.md`, commit, `git pull --rebase`, `git push`. Do this without being asked.
- Never commit `.env`, zips or files over 10 MB. Never force-push.
- If a rebase conflicts, stop and tell your human.
