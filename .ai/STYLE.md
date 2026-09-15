# Style Guide — Atelier

The React adaptation of the house style: tablewright's guide is the
parent; comment and prose rules follow izelya.me's refinement. Where
they disagree, this file governs.

## Principles

- Readability over cleverness; start simple, earn complexity — don't
  abstract until there's a second use case.
- Function components and hooks for the UI; classes where a thing
  owns a lifetime and imperative state (the camera, the stage, the
  input binding). Pure logic modules stay plain functions.
- **Split files early.** One concern per file. ~250 lines: look for a
  sensible seam; ~400: finding one is a priority. A component that
  starts to do too much is split before it gets unwieldy. Judgment
  thresholds, not lint rules. Tests exempt.
- Minimal dependencies. Runtime: `react`, `react-dom`, `pixi.js`,
  `zustand`, `radix-ui`, and `trystero` last. Any further dependency
  needs a strong written case; the default answer is no.
- One dev/prod switch, provided by the toolchain:
  `import.meta.env.DEV`. No runtime environment sniffing.
- No emoji in technical writing.

## Comments

- Comments exist for exactly three reasons: intent of a file or
  function; reference for new maintainers; explaining genuinely
  complex code. Never narrate what the code says, never reference
  plans/chats from shipped text — the comment carries the reasoning
  itself.
- Plain English: common words, short declarative sentences, active
  voice. State the constraint or the reason and stop. One sentence is
  the default; a second earns its place by carrying a why.
- Domain vocabulary is not waffle — camera, world, room, work, hang,
  tier, pin, thread are the system's real names; use them.
- Non-obvious modules open with an intent preamble: bare `/**` opener,
  a `─ title ─` line, a blank gutter line, tapered prose, `*/` on its
  own line, max ~6 prose lines, ending on the decision it rests on.
  Trivial modules get nothing.
- `/**` above a declaration is that symbol's hover doc (JSDoc), and
  the nearest docblock wins — so a file's first declaration always
  keeps a docblock of its own, and a preamble never masquerades as
  hover docs. `//` is for inline comments only.
- Constants carry inline rationale where the value isn't self-evident.
- Box-drawing section dividers (`// ── Section ──`) available for
  long files.

## Prose

- Every word added to the repo is plain English, in markdown as in
  comments: common words, short declarative sentences, active voice.
  A document reads like a person explaining, never like a generator.
- The domain's names are the exception that proves it: room, hang,
  tier, pin, thread are the real names, and they are used.
- A decision says why. A plan says when. Neither narrates the code.
- Text on screen takes ordinary punctuation and never a middle dot: a
  colon between a label and its value, a dash between peers, a comma
  in a list.

## TypeScript

- TypeScript strict, plus `noUncheckedIndexedAccess`,
  `noImplicitOverride`, `noFallthroughCasesInSwitch`,
  `isolatedModules`. No `any`.
- Lint: **oxlint** (oxc, unicorn, typescript, react, jsx-a11y plugins)
  — `eqeqeq`, `no-var`, `prefer-const`, `object-shorthand`, `curly`,
  `no-else-return`, `no-lonely-if`; unused vars error unless
  `_`-prefixed.
- Format: **oxfmt** — 100 cols, 2-space, semicolons, double quotes,
  `trailingComma: es5`, `arrowParens: always`, LF.
- JSDoc on exported APIs: prose purpose plus the tags the type alone
  doesn't carry. Non-exported functions need none.
- Private class members use the `private` keyword, not `_` prefix.
- Explicit `.js` extensions on relative imports; barrel `index.ts`
  per feature.
- Guard at the boundary; early returns; no defensive re-checks deep
  inside.
- **React stays thin.** Components render state and forward intent.
  The camera, the stage, the layout and the comment events are plain
  modules that never import React, so they are tested without it and
  extended without touching a component.
- Pixi is imperative and lives behind one ref: a component creates
  the stage in an effect and disposes it in the cleanup, so
  StrictMode's double mount is a real test of the teardown.

## Styling

- Tailwind v4 utilities for layout, spacing and type. Tokens are
  declared once in `src/index.css` under `@theme`, so every colour
  and size is a name; no hardcoded palette values in components. The
  Pixi side reads the same custom properties through one bridge.
- State is styled through attributes: Radix's `data-state`, the
  canvas's `data-camera`, a pin's `data-resolved`. Never inline
  `style` for visual state; a pin's position from the camera is
  geometry and is exempt.
- A CSS module (`*.module.css`) only where a utility list stops
  reading, such as a keyframe or a nested state.
- Motion respects `prefers-reduced-motion`.

## Naming

| Thing                 | Convention                  | Example            |
| --------------------- | --------------------------- | ------------------ |
| Files                 | `kebab-case`                | `camera-math.ts`   |
| Components            | `PascalCase` file and name  | `ZoomIndicator`    |
| Variables / functions | `camelCase`                 | `hangOnLine`       |
| Classes               | `PascalCase`                | `CameraInput`      |
| Constants             | `SCREAMING_SNAKE_CASE`      | `TAP_THRESHOLD_PX` |
| Booleans              | `is` / `has` / `can` prefix | `isResolved`       |
| Collections           | plural noun                 | `threads`          |
| Git branches          | `type/short-description`    | `feat/mini-map`    |

## Tests

- [TESTING.md](TESTING.md) says how: logic tests for pure logic, the
  browser for everything else.
- Runner: `bun test`. Tests in top-level `tests/`, named
  `<module>.test.ts`.
- DOM- or canvas-bound code is never DOM-emulated: extract the math
  into a pure module, test that, and let the browser show it.
- Names describe the scenario: `"keeps the world point under the
  anchor fixed"`.
- No mocks unless hitting a real external service.

## Tooling

- Bun as package manager and runner. `check` = format:check + lint +
  typecheck + tests + build; the full gate runs every step.
- Vite builds; Tailwind rides its Vite plugin; no PostCSS config.

## Commits

- `type(scope): short description` — `feat`, `fix`, `refactor`,
  `docs`, `chore`, `test`, `style`, `perf`, `ci`, `revert`; present
  tense, imperative; subject-only, no trailers.

## Error Handling (user-facing)

- Say what went wrong, what was received, what was expected, and what
  the user can do about it.
- Typed errors for programmatic handling; never swallow silently.
- State names over spinners: a tier still loading, a room with no
  peers, an empty list are named and visible, never mystery blanks.
