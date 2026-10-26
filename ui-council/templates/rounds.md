# UI council — score log

One block per round. Keep it append-only: the value is the trail, including the
rejected claims. Averages are of the **Overall** row across reviewers (or of
all categories — pick one and stay consistent).

Running average by round:

| Round | Scope | Reviewer A | Reviewer B | Reviewer C | Avg | Note |
|-------|-------|-----------|-----------|-----------|-----|------|
| r0    | desktop | 5.x | 5.x | 5.x | 5.7 | baseline |
| r1    | desktop | 6.x | 7.x | 6.x | 6.9 | restyle |
| ...   |       |     |     |     |     |      |

---

## Round <N> — <date> — scope: <scope>

**Captures:** `/tmp/ui-rN` (desktop + phone)
**Reviewers:** <model A>, <model B>, <model C> — request ids `council-rN-*`

### Scores
| Category | A | B | C |
|----------|---|---|---|
| Typography | | | |
| Hierarchy | | | |
| Spacing | | | |
| Color | | | |
| Iconography & components | | | |
| Consistency | | | |
| Clarity of flow | | | |
| Overall | | | |

### Fixed this round
- [MUST] <fix> — <file> — raised by <who>
- [SHOULD] <fix> — <file>

### Rejected (with reason)
- <claim> — <why it didn't hold up: pixel/code evidence>

### Owner overrides applied
- <feedback> — <what changed>

### Biggest risk called out
- <the one thing>
