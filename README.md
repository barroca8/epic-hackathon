# Epic hackathon

## 🚀 The app is LIVE: [might-epic-hack-2026.vercel.app](https://might-epic-hack-2026.vercel.app)

Shared repo for a team of six. Every person and each of their Claudes reads and writes here.



## Files

| File | Purpose | Who writes |
|---|---|---|
| `PRD.md` | Challenge brief and judging criteria | Captain |
| `NEXT_STEPS.md` | Tickets with owner, minutes and "done when" | Captain |
| `DECISIONS.md` | Numbered decisions (D-01, ...), one line each | Captain |
| `facts.md` | Every number in the deliverable, with its command | Data owner |
| `notes/<name>.md` | Your findings, append-only | You |
| `work/<name>/` | Your code and drafts | You |
| `journal/` | Daily discussion log | Captain |

## Rules

1. **One writer per file.** To change a shared file, tell its owner.
2. **One source for numbers.** Only numbers in `facts.md` go into the deliverable; send new or wrong ones to the data owner.
3. **Sync often.** `git pull --rebase` before you start; commit and push when a ticket is done.
4. **Decisions are made out loud**; the captain logs them within a minute.
5. **No secrets in the repo.** API keys stay in a local `.env`.

## Setup and chat

Run `git clone https://github.com/barroca8/epic-hackathon.git`, create `notes/<name>.md` and `work/<name>/`, and open the folder in Claude Code.

Quick chat: [Discord](https://discord.gg/p7uJNTctn) `#general` (link valid until 2026-12-26). Claudes cannot read it, so anything that matters goes in the repo. Large files (over about 10 MB) can go in a shared Drive folder.
