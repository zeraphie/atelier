# Atelier

<!-- One or two sentences in your words: what it is and what it is for. -->

Live demo: <!-- link once deployed -->
Video walkthrough: <!-- link -->

## Develop

Needs [Bun](https://bun.sh).

```sh
bun install
bun run dev      # dev server at http://localhost:5173/atelier/
bun run check    # format, lint, typecheck, tests and build
bun run test     # the logic tests alone
```

## Map of the code

- `src/camera/` — pan and zoom as one transform: pure math, the camera, the input binding
- `src/canvas/` — the PixiJS stage, drawing on request, the rooms and works on it
- `src/gallery/` — the works and rooms as data, the hang, the tiers
- `src/comments/` — the comment model, events, store and persistence
- `src/ui/` — React, by atomic design: `atoms/`, `molecules/`, `components/`, `utils/`
- `tests/` — logic tests, one file per module
- `.ai/` — the working contract for AI collaborators: workflow, style, testing
- `DECISIONS.md` — product and technical decisions, and why

## Keyboard

<!-- Filled in once the shortcuts land. -->

## Credits

<!-- Each work: title, artist, year, collection, licence. -->
