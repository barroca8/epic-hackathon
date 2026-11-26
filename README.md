# Epic hackathon

Shared repo for the team of six. Every person and every Claude reads and writes here.

## Where things go

| File | Purpose | Who writes |
|---|---|---|
| `PRD.md` | The challenge brief, restated, and the judging criteria | Captain |
| `NEXT_STEPS.md` | Tickets with owner, minutes and "done when" | Captain |
| `DECISIONS.md` | Numbered decisions (D-01, D-02, ...), one line each | Captain |
| `facts.md` | Every number used in the deliverable, with the command that produced it | Data owner |
| `notes/<name>.md` | Your findings, append-only | You |
| `work/<name>/` | Your code and drafts | You |
| `journal/` | What was discussed, one file per day | Captain |

## Rules

1. **One writer per file.** Write only in your own `notes/<name>.md` and `work/<name>/`. The shared files
   have one owner each (table above). To change a shared file, tell its owner.
2. **One source for numbers.** A number goes into the deliverable only if it is in `facts.md`. Found a
   new number or a wrong one? Put it in your notes and tell the data owner.
3. **Pull before you start, push when a ticket is done.** `git pull --rebase`, then work, then commit
   and push. Small commits, often.
4. **Decisions are made out loud** and the captain writes them in `DECISIONS.md` within a minute.
5. **No secrets in the repo.** API keys stay in a local `.env`, which git ignores.

## Setup

```
git clone https://github.com/barroca8/epic-hackathon.git
cd epic-hackathon
```

Then create `notes/<your-name>.md` and `work/<your-name>/`, and open the folder in Claude Code.

## Quick chat

Discord server "Epic Hackathon": https://discord.gg/p7uJNTctn (link valid until 2026-12-26).
Open it in the browser; no install needed.

| What | Where |
|---|---|
| Quick questions, links, screenshots, "I pushed X" | Discord, `#general` |
| Code, findings, numbers, anything a Claude must read | This repo |
| Large data files (over about 10 MB) | This repo, or a shared Drive folder |

The Claudes cannot read Discord. Anything that matters ends up in the repo.

## Roles

| Role | Owns | Person |
|---|---|---|
| Captain / integrator | Tickets, decisions, merging the pieces |  |
| Data | Pipeline, clean tables, `facts.md` |  |
| Analysis | Business logic: rules, scoring, value ranges |  |
| App / report | The Streamlit app or the HTML report |  |
| Critic | Audit of AI errors, limits, bias |  |
| Pitch | Script, screenshots, upload |  |
