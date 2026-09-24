# Atelier — CLAUDE.md

A gallery on an infinite canvas, with comment threads pinned to it.
Eight public-domain works hang in five rooms laid out as a floor
plan; zoom reveals the plan, then the works, then the labels. React
+ TypeScript on Vite, PixiJS for the canvas, DOM for the pins and
panels, Tailwind v4 and Radix for the UI, zustand for state, trystero
last for a shared viewing.
Bun runs everything. Decisions and their reasons live in
[DECISIONS.md](../DECISIONS.md), which is the design doc here.
**Local until Izzy pushes:** never create a remote, push, or deploy
unprompted. The remote, when it exists, is Izzy's GitHub; Pages
deploys from `main`.

## Workflow

Research → decisions → plan → execute, step by step.

1. Substantial work starts as discussion and lands in DECISIONS.md.
2. Plans derive from it as `.plan/PLAN.<topic>.md` — local-only,
   gitignored, checkbox per step.
3. Execute one step at a time. After each step:
   - tick the checkbox, run `bun run check`
   - **explain what was implemented, how it works, and why this
     approach over alternatives** — Izzy owns the outcome and has to
     stand by every line, live; the explanation is part of the
     deliverable, not a courtesy
   - stop and wait for Izzy to test and verify before the next step
4. Never auto-advance. Commit when a step lands or when asked.
5. Open design decisions are surfaced as questions with options —
   never "I'd lean toward X" and ship.

## Style

See [STYLE.md](STYLE.md). Formatting is oxfmt's job, linting is
oxlint's — style review is about what tools can't check. Tests follow
[TESTING.md](TESTING.md): logic tests for pure logic, and the browser
for everything a person does. Reuse follows [REUSE.md](REUSE.md): look
for what exists before writing, put a thing in the folder that says
what it is, and end every report on what was reused.

## What exists

The shared names, generated; look here before writing anything new.

@CATALOGUE.md

## House rules

- Bun only — `bun add` / `bun run`; never npm or yarn.
- **The prose is Izzy's.** README.md is written by Izzy; agents
  propose structure and supply facts, and drafts of DECISIONS.md
  that Izzy edits.
- **One camera.** Pixi and the DOM read the same camera state; nothing
  positions itself from a second transform.
- **Works are data.** The rooms, the hang and the tiers derive from
  the gallery data; nothing about a work is placed by hand in code.
- Visual state is state-driven: data attributes and custom
  properties, never inline `el.style.*` writes (geometry from the
  camera is exempt).
- Every dependency needs a case. The runtime set is `react`,
  `react-dom`, `pixi.js`, `zustand`, `radix-ui`, and `trystero` last;
  the default answer to another is no.
- Small and explainable beats complete. Every seam should be one a
  person can extend live: a new comment event, a new element tier, a
  new test.
- No emoji in technical writing. Commits: `type(scope): short
  description`, subject-only, no trailers.

## Key paths

- `DECISIONS.md` — the design doc: product and technical decisions
- `README.md` — setup and links; never a map of the code, which dates
  in a week (the catalogue is the map)
- `.ai/STYLE.md`, `.ai/TESTING.md` — code style and tests
- `.ai/REUSE.md` — how code stays in one place: the layers, the
  catalogue, the reuse reading
- `.ai/CATALOGUE.md` — the shared names, written by `bun run
  catalogue` (never hand-edited)
- `tools/` — the scripts behind `bun run`: the catalogue
- `.plan/` — local-only plans (gitignored)
- `src/main.ts`, `src/App.tsx` — the entry that waits for the mark, and
  the screen: the canvas and everything laid over it
- `src/geometry.ts` — the vocabulary every folder speaks in: the point,
  the rect, the segment, and the arithmetic on them
- `src/index.css`, `src/fonts/` — the tokens under `@theme`, the four
  faces and their licences
- `src/camera/` — one transform: the camera and its moves at the root,
  `math/` for the maths, `input/` for the pointer and the wheel
- `src/canvas/` — the Pixi stage, the mount, the frame scheduler and the
  tour at the root; `tools/` the edit tools, `views/` what is drawn,
  `theme/` the bridge from the tokens and the fonts
- `src/gallery/` — the works, `images.json` (the shipped pictures' sizes
  and colours) and the tiers at the root; `layout/` the floor plan from
  the data, `edit/` what the tools do to it, `route/` the tour's way
  through
- `src/pictures/` — a file made a picture of your own: its hash, its
  derivative, its colour, and the height it hangs at for a width
- `src/comments/` — the model, the list and the times of comment threads
- `src/viewing/` — the shared viewing: the join, the wire and the
  messages at the root (transport.ts is the one file that touches
  trystero); `presence/` what is said once a frame, `identity/` who you
  are and which viewing
- `src/state/` — the two zustand stores, every slice under `slices/`,
  and under `utils/` the stamps, the actions told, the live plan, and
  `dev.ts`, the handle on `window.atelier` in development only
- `src/storage/` — the IndexedDB database every store persists in, and the roll call the curtain waits on
- `src/ui/` — React, by atomic design: `atoms/` (one element, no state of
  its own), `molecules/` (a few atoms with one purpose, props in, events
  out), `components/` (a piece of the screen that reads the stores or the
  camera), `utils/` (hooks, context, pure tables)
- `tests/` — logic tests, `bun test`
