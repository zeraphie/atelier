# Atelier

Atelier is an infinite canvas style gallery project, mimicking a visitor's journey through an art gallery. The visitor's journey through a gallery usually has a tour guide that accompanies them, and some back and forth to talk about the artwork can also happen. Atelier demos the gallery utilising credited artwork under public domain.

On the tech side, this uses PixiJS for rendering the infinite canvas; TypeScript/React/Tailwind/Radix for the UI; Zustand for state management; Bun for running, Vite for building and GitHub Pages for a static site; my repo tablewright/tablewright has been used as inspiration for camera/interactions.

Future improvements: Trystero for utilising WebRTC for sharing comments with other users; Design pass to add texture; 3D interactions on images to make it feel more immersive (i.e. doom style navigation)

Live demo: https://izelya.me/atelier
Video walkthrough: https://www.youtube.com/watch?v=AMCqAsGznyQ

[![The tour, in the video walkthrough](https://img.youtube.com/vi/AMCqAsGznyQ/maxresdefault.jpg)](https://www.youtube.com/watch?v=AMCqAsGznyQ)

## Develop

Needs [Bun](https://bun.sh).

```sh
bun install
bun run dev      # dev server at http://localhost:5173/atelier/
bun run check    # format, lint, typecheck, tests and build
bun run test     # the logic tests alone
```

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

The music in the video is "Unrequited" by Asher Fulero, from the YouTube Audio Library.

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
