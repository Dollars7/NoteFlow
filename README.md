# NoteFlow — Retention-first learning

> **The system carries decision cost. The learner carries retrieval cost.**

NoteFlow is a note product and a learning conductor. The note and the learning card are not separate systems; they are two views of the same knowledge object:

- **Front:** a retrieval prompt that requires an attempt
- **Back:** the editable Markdown note used to compare, repair, and deepen the answer

The app now has two explicit workspaces:

- **笔记库:** create, search, import, tag, batch-manage, and edit the knowledge objects
- **学习:** choose a strategic goal boundary, then let the Flow Engine decide which object appears next

## Note format and bulk import

Every knowledge object has a required knowledge area (`skillId`) and a tag list:

- **Knowledge area:** one scheduling domain such as Intervals, Object Design, Spring / JWT, or Graphs
- **Tags:** zero or more free-form labels such as `heap`, `interview`, or `java`
- **Retrieval mode:** recall, solve, design, or speak
- **Front / back:** retrieval prompt and Markdown note

The library accepts:

- NoteFlow CSV with `title,prompt,noteMarkdown,skill,tags,mode,hintKeywords,scaffold`
- Anki CSV/TSV with `Front,Back,Tags`
- Anki-style headerless TSV ordered as Front, Back, Tags

Imports are previewed before saving. Unknown Deck or skill names are routed to a user-selected fallback area. Search results can be selected in bulk, moved to another area, tagged, or deleted. Deletion also removes the associated memory evidence and persists a tombstone for built-in objects.

## Goals, focus, and interview sprints

Before a session, the learner can:

- name a current goal, such as “Amazon SDE II technical interview”
- choose a role baseline
- switch between steady learning and interview sprint mode
- provide an interview date
- restrict the session to selected knowledge areas

The knowledge-area selection is a hard scheduling boundary, not a task list. Sprint mode raises the weight of goal-relevant gaps as the interview approaches, but the objective remains memory retention. Session length and willingness to continue never enter the ranking model.

## Product contract

- Nothing is “unfinished.” Cards not seen in a session simply return to the scheduling pool.
- No backlog, completion rate, overdue count, priority score, or visible queue is shown.
- Skip only moves a card to the end of the current in-memory session queue.
- Skip never changes the memory interval and never survives as a next-day obligation.
- Skip counts remain silent. Repeated skipping marks the card as needing decomposition.
- The answer side is inaccessible until the learner commits to an attempt.
- Numbers, timers, scores, and Skill State are hidden during retrieval.
- Reaction time is recorded automatically but never shown during the problem.
- Skill State appears only at session boundaries.
- Choosing whether to continue never enters the ranking model.

## Retrieval loop

```text
Prompt
  → learner commits: fluent / stuck
  → keyword cue
  → another retrieval attempt
  → scaffold cue if needed
  → another retrieval attempt
  → Markdown note back
  → memory feedback
  → post-retrieval delta
```

The three memory signals are:

- **I knew what I was looking for** → normal rescheduling
- **I had no direction** → retrieve a prerequisite first
- **This was overlearned** → expand the interval

This is not a difficulty rating. It tells the memory scheduler what kind of failure or success occurred.

## Notes repair themselves

An empty note back asks:

> 刚才卡在哪一句？

The answer becomes a smaller retrieval card in the same card pool. It is not added to a task list. A card skipped repeatedly is silently marked for decomposition, treating poor card design as a system problem rather than a learner failure.

## Database

NoteFlow uses a Cloudflare D1 binding named `DB`.

- `workspace_state` is the durable source of truth for the current goal profile, notes/cards, memory state, and retrieval evidence.
- The browser `localStorage` copy is only an offline cache and migration fallback.
- The current MVP stores one local workspace snapshot. Authentication and multi-user workspace isolation are intentionally not implemented yet.
- The API creates the table defensively for local development; the generated migration is in `drizzle/0000_gigantic_blade.sql`.

## Scheduling objective

```text
Hidden retrieval priority =
  retention need
  + goal relevance
  + mastery gap
  + dependency value
  + uncertainty reduction
  + sprint urgency when enabled
  - familiarity discount
```

The priority is never shown before retrieval.

## Run locally

```bash
pnpm install
pnpm dev
```

## Validate

```bash
pnpm test
pnpm lint
pnpm exec tsc --noEmit
```

## Core files

- `app/page.tsx` — workspace navigation, session boundaries, commit gate, recording, and feedback
- `app/note-library.tsx` — editable objects, import preview, tags, and batch management
- `lib/import-notes.ts` — NoteFlow CSV and Anki CSV/TSV parser
- `app/goal-planner.tsx` — custom goal, scope, and interview sprint controls
- `app/api/state/route.ts` — D1-backed state API
- `lib/flow-engine.ts` — retention-first ranking, focus boundaries, sprint urgency, and silent Skip
- `db/schema.ts` — D1 schema
- `tests/rendered-html.test.mjs` — production-render and product-constraint regressions

> **Don’t plan. Retrieve. Remember.**
