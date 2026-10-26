# skills

Reusable agent skills, adopted across projects.

| Skill | What it does |
|-------|--------------|
| [`ui-council`](./ui-council) | Improve a web UI's design in tracked, verifiable rounds by hill climbing against a panel of independent LLM reviewers. |

Each skill is a self-contained directory with a `SKILL.md` (the entry point an
agent loads), plus any templates and scripts it needs. Install one by copying
or symlinking its directory into your agent's skills location (for Claude Code,
`~/.claude/skills/<name>/`).
