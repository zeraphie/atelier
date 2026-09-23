# Reuse — Atelier

How code here stays in one place. The rules are the house's, the same
in every repo of Izzy's; the folders, the layers and the catalogue's
rule are this repo's own. Code style is in [STYLE.md](STYLE.md), tests
in [TESTING.md](TESTING.md).

## Why this file exists

A person who has worked in a repo for a month reuses what is there,
because they know it is there. Someone new writes it again, because
finding out costs more than writing, and an agent is new every time.
Nothing fails when they do. So the repo does two things: it makes what
exists cheap to see, and it makes a second copy fail a check.

## Look before you write

- Before a new function, component, style or helper, look for the one
  that exists: the catalogue first, then a search of `src` for the
  verb and the noun.
- Reuse it as it is. When it nearly fits, change it to fit both uses.
  Never copy it and change the copy.
- The second use is the moment to share. The first time, write it
  where it is used. The second time, move it to where both can reach
  it and call it from both places. Never a third copy, and never a
  shared helper with one caller kept for later.
- Every report on a piece of work ends with a reuse reading: what was
  looked for, what was reused, and what was looked for and not found.
  "Nothing to reuse" is an answer. Saying nothing is not.
- A refactor that shares a piece deletes the copies in the same
  change. A shared piece beside its old copies is a third copy.

## Where things live

A folder says what kind of thing is in it, so a glance shows the
vocabulary.

### `src/ui`: atomic design

Sorted by layer, not by feature.

- **`atoms/`**: one element with no state of its own and no knowledge
  of the domain. A pill button, a field, a tooltip bubble, the icons,
  and the shared runs of classes such as `CARD`.
- **`molecules/`**: a few atoms with one purpose, props in and events
  out. It knows one thing of the domain, a comment or a colour, and
  owns no flow. A comment form, a row of the list, a colour picker.
- **`components/`**: a piece of the screen that reads the stores or
  the camera and owns a flow. The pin layer, the mini-map, the desk.
- **`utils/`**: hooks, context and pure tables. No elements.

- Imports go down that list, never up: an atom takes atoms and utils;
  a molecule takes atoms, utils and molecules; a component takes
  anything below it, the stores, the camera and the features. A
  molecule never imports a store, and neither an atom nor a molecule
  imports a feature folder; what one needs from a feature, a code to
  make or a palette to show, comes in as a prop.
- Atoms and molecules are flat files. A component keeps a helper of
  its own in its file until a second component needs it; then it
  moves to `utils/` as a hook or a table, or to `atoms/` as a look.
- A repeated run of classes is an atom: one string exported once and
  taken into each `className` that needs it.

### The rest: by domain

`src/camera`, `src/canvas`, `src/gallery`, `src/comments`,
`src/pictures`, `src/viewing`, `src/state` and `src/storage` sort by
domain, and CLAUDE.md's key paths say what each holds. What a second
domain uses is shared where it sits, and the catalogue lists it. What
has no domain is vocabulary and sits at the root of `src`:
`geometry.ts` holds the point and the rect every folder speaks in.

### Tests

Fixtures that two test files share live in `tests/fixtures.ts` (the
spacing, a room, a work, a thread, a picture) and fakes in
`tests/fakes.ts` (a refresh loop, a closeness check). A test file keeps
a fixture of its own only while it is the one file that needs it.

## The catalogue

[CATALOGUE.md](CATALOGUE.md) lists what is shared, each name with the
sentence its doc comment opens on, grouped by folder, then file, then
name. A name is listed when a file in another folder of `src` imports
it, and every name under `src/ui/atoms`, `src/ui/molecules`,
`src/ui/utils` and the root of `src` is listed, since those exist to be
taken. What one folder keeps to itself is not listed; the folder is
small enough to read. `bun run catalogue` writes it, `bun run check`
refuses a stale one, and CLAUDE.md imports it, so every session starts
knowing what exists. A listed function or class with no doc comment
fails the run. This is why an exported name's doc comment opens with
one plain sentence saying what it is for: that sentence is what the
next person searches.

## The reuse reading

A report on a step ends with three lines: what was looked for, what
was reused, and what was looked for and not found. It is how the
catalogue is kept honest, and how a copy is caught before it lands.
