# Convex specifics for diff-review

Read alongside the matching rules in `../SKILL.md` when the repository uses
Convex. These are the stack-specific forms of general rules; the rule itself
lives in SKILL.md.

## Rule 15 — `'use node'` belongs on a service file, not the boundary

Do NOT add `'use node'` to a file holding many actions just to satisfy one — it
forces every action in the file into the Node runtime. Split: auth+dispatch
(default runtime) → `services/<thing>.ts` (`'use node'`, owns the SDK call).

## Rule 18 — filter with the index

Put the discriminator in an index and use `.withIndex(..., q => q.eq(...))`, or
`q.gt(field, 0)` for the "present" bucket (Convex sorts `undefined` before
defined values). Same for `.first()`/`.unique()` and "is there any X" probes.

## Rule 19 — never `.collect()`

`.collect()` reads every matching row with no upper bound and degrades
reactivity for the whole client once the table grows. Replace it with
`.take(N)` (also for `.withIndex(...).filter(...).collect()`). A genuine
read-everything belongs in a cancellable mutation/action, never a reactive
`query`.
