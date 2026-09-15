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

| Key                     | Does                                              |
| ----------------------- | ------------------------------------------------- |
| Scroll, or drag         | Move around                                       |
| Pinch, or Ctrl + scroll | Zoom about the cursor                             |
| Shift + scroll          | Move sideways with a one-axis mouse wheel         |
| Double-click, double-tap | Fill the view with the work, room or plan under it |
| `+` or `=`, `-`         | Zoom in, zoom out                                 |
| Shift + `0`             | Life size, 100%                                   |
| Shift + `1`             | Fit the whole plan                                |
| `←` `→`                 | Previous and next work on the tour; `→` starts it |
| `C`                     | The next tap on the canvas places a comment       |
| Right-click             | Add a comment here                                |
| Enter, Shift + Enter    | Send a comment, break a line                      |
| Escape                  | Back out: a draft, an open thread, comment mode, the tour |

## Credits

Every work is in the public domain; each scan comes from the holding collection on the terms it states.

| Work                                                        | Artist                                                     | Year       | Collection                                                        | Scan                                       |
| ----------------------------------------------------------- | ---------------------------------------------------------- | ---------- | ----------------------------------------------------------------- | ------------------------------------------ |
| Woolsey Bridge, axonometric from below                      | Matthew Swaim, Historic American Engineering Record        | after 1968   | Library of Congress, HAER AR-63, sheet 4                        | United States government work              |
| Overhead Crank Steam Engine and Cane Mill, Estate Whim      | Kathleen Hoeft, Historic American Engineering Record       | 1977         | Library of Congress, HAER VI,1-WEST,1C-, sheet 1                | United States government work              |
| Sentinel Bridge over the Merced River, elevation and section | Marie-Claude LeSauteur, Historic American Engineering Record | 1991         | Library of Congress, HAER CAL,22-YOSEM,15-, sheet 1           | United States government work              |
| Under the Wave off Kanagawa                                 | Katsushika Hokusai                                         | c. 1830–32 | The Metropolitan Museum of Art, JP1847                            | The Met Open Access                        |
| Sudden Shower over Shin-Ōhashi Bridge and Atake             | Utagawa Hiroshige                                          | 1857       | The Metropolitan Museum of Art, JP2522                            | The Met Open Access                        |
| Kudanzaka at Night in Early Summer                          | Kobayashi Kiyochika                                        | 1880       | Smithsonian Institution                                           | Wikimedia Commons                          |
| Steam Train on the Railway along the Takanawa Coast         | Utagawa Hiroshige III                                      | 1871       | Geographicus Rare Antique Maps                                    | Wikimedia Commons                          |
| The Sumida River at Night                                   | Kobayashi Kiyochika                                        | 1881       | Honolulu Museum of Art, James A. Michener Collection, 13681       | Wikimedia Commons                          |
