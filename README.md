# skills

Reusable agent skills, adopted across projects.

| Skill | What it does |
|-------|--------------|
| [`ui-council`](./ui-council) | Improve a web UI's design in tracked, verifiable rounds by hill climbing against a panel of independent LLM reviewers. |
| [`ratchet-files`](./ratchet-files) | Keep every source file small enough for an agent to read whole: find and split oversized files, and install a pre-commit + CI ratchet that stops them growing. Adapted from [dzhng/skills](https://github.com/dzhng/skills) (MIT). |

Each skill is a self-contained directory with a `SKILL.md` (the entry point an
agent loads), plus any templates and scripts it needs. Install one by copying
or symlinking its directory into your agent's skills location (for Claude Code,
`~/.claude/skills/<name>/`).
