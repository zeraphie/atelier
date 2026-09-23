# Decisions

Each entry: what I decided, why, what else I weighed, and what it cost.

## Product

### A gallery, with real works

Eight public-domain works, at their real sizes in centimetres, hung in rooms. I wanted something worth zooming into, and a 14,000 px scan is the only honest test of an image pipeline and a camera. I weighed placeholder images, which give nothing to look at up close, and someone's own art, which brings rights along with it. The cost is an image pipeline (four WebP sizes per work) and a credits table.

### A loader that draws the mark

The name is drawn stroke by stroke as SVG outlines in the HTML, and the app's chunks wait to evaluate until the draw has ended, because JavaScript evaluating on the main thread stalled the stroke animation the first time. The bar under the last letters is transform only, so the compositor keeps it moving while the chunks run. I weighed a plain spinner and, for a while, a rolling word; the bar reads more like a gallery. The cost is that the outlines are lifted from the font once, so a new face means redrawing them.

### Rooms as grouping on the canvas

A room is a cell on a metre grid that shares its walls with its neighbours, so zoomed out the gallery reads as a floor plan, and the works group by theme. I weighed free-floating groups, which give nothing to read from far off, and 3D, which was more than the idea needed. The cost is that the hang has rules, and it throws at build time when the data cannot be hung.

### A route through the rooms

The tour is the order of the works, derived from the order of the rooms and the walls a walk meets first; nothing is drawn on the floor. Each doorway sits a third along the shared wall from the end farthest from the last door, so the route winds and no door looks straight through to the next. I built a walked line on the floor and cut it: the arrows and the tour do the guiding. The cost is that rooms must share a wall in tour order.

### Arriving: the Foyer, a plaque, and an arrow at each threshold

The view opens on the Foyer, where a plaque lists the controls, and an arrow inside each doorway leads to the next room. Friends could not find the double tap on their own, and a receptionist fits a gallery better than a toast. I weighed moving the Foyer a metre south, but that put its doorway in a corner, so the room grew instead.

### Finding a comment: the list, the map and the jump

The list groups threads by room, because rooms are the plan's own vocabulary, and choosing one glides to its pin and opens it. A jump comes in to 200% at least, so the pin lands among its work and wall rather than on a plan. The mini-map is drawn from the same plan data as the canvas, with the pins on it and the view as a frame.

### Adding a comment: a button and a menu, not a bare tap

Most gestures on the canvas move the view, so a bare tap never places a comment. A comment starts from the bubble button, from C, or from a right-click menu at the exact spot, and the mode is single-shot: one comment, then back to browsing. Navigating and commenting never get in each other's way.

### Threads: a root and its replies

A thread is a pin, a first comment, and replies in order, with resolved on the thread rather than on a comment. Every change is one of four events, opened, replied, edited, resolved, applied by a pure reducer that ignores repeats. That reducer is the seam a shared room would use: an event from a peer applies the same way as one of mine.

### Resolving

A resolved thread stays visible, in green, and the list can show open, resolved, or all. Delete is absent on purpose: it is one event, one reducer case and one button, and I kept it as the thing to add live.

### Who is commenting

No accounts. A name per browser, "Visitor" and a number until it is set at the desk in the Studio, kept with the comments. Edit is offered on your own comments by name match, which is a convenience rather than security.

### The wall is curated, not edited

The works and rooms are data, and nothing is dragged or placed by hand. Commenting on the gallery was the point, not editing it, so drag-to-hang was never on the list.

## Technical

### PixiJS with a DOM overlay

PixiJS draws the rooms, walls, works, labels and grid, because a canvas holds many world objects and keeps text crisp at any zoom. The DOM draws the pins, popovers, panels, the desk and the plaque, because forms, focus and accessibility come free there. I weighed all-DOM, which struggles with thousands of transforms and zoomed text, and all-Pixi, which means building forms by hand. The cost is two trees to keep in step, which the next decision pays.

### One camera for canvas and DOM

One transform, screen = world × zoom + offset, in a class with listeners and no renderer import. Pixi applies it directly as the world container's position and scale; React subscribes to it and places DOM elements by the same numbers. Nothing positions itself from a second transform. One lesson: a hover scale on a pin composed with its inline translate and threw the pin across the screen, so position now lives on a wrapper of its own.

### Scroll pans, pinch zooms

A plain wheel or two-finger scroll pans, and a pinch, which browsers send as a wheel with Ctrl held, zooms about the cursor, as does Ctrl or Command with a mouse wheel. A hundred pixels of pinch doubles the zoom; one event is capped so a mouse notch is a clear step rather than a doubling. My first build zoomed on scroll, and it fought every trackpad; this is the convention of the design tools.

### The canvas draws on request

There is no ticker. A camera change, a texture arriving or a hover change asks for a frame, and one requestAnimationFrame draws once for all of them. An idle canvas costs nothing.

### A dot grid in metres

Cells of 20 cm, 1 m, 5 m and 25 m, stepping by five so one tier's small dots are the next tier's crossings. A tier changes at 40 px going coarser and 48 px going finer, so a zoom near the edge never flickers. One cell is drawn to a repeating texture that the GPU tiles, redrawn at every zoom change so a dot never changes size, and the small dots fade as they crowd, so the step is not seen. Pixi 8 needs the wrap mode at texture creation and a power-of-two size, which I learned from a grid that was one cell at the origin.

### Levels of detail by zoom

A work is a block in its own colour from far, its picture and title from mid, and its museum label from near, by its width on screen, with hysteresis at each edge. The picture's size is chosen the way a browser chooses from a srcset, the smallest whose pixels cover the work on the device, and never downgraded once loaded.

### Layout from data: the hang

One function turns the rooms into a plan: rects on the grid, doorways cut by the rule above, walls with the doorways taken out, and works on walls. A work that names its wall hangs there; the rest take the wall facing the entry first, then the walls beside it, on the longest stretch clear of doorways, centred. The route, the double-tap targets and the threshold arrows all derive from the same plan, so a change to the data moves everything at once.

### State: zustand, with events as the unit of change

Two small stores: the comments, whose actions each make one event and pass it through the reducer, and the interface state, mode, draft and open thread, which is never persisted. Immer was considered and left out; the reducers are short enough to write by hand.

### Persistence

The threads and the name persist in this browser, in one IndexedDB database, versioned, so a reload keeps them; the curtain waits for the stores to load as it waits for the first frame, so the gallery never shows empty. IndexedDB over localStorage because a picture is megabytes and a Blob, and because its calls never block the canvas. Clearing site data is the reset.

### Tailwind v4 tokens and Radix primitives

Colours and faces are tokens in one place, in oklch, and Pixi reads the same custom properties through one bridge, so the canvas and the interface share a palette by name. Radix gives the popover, tooltip and context menu their keyboard and focus behaviour. No icon font: the two icons are inline SVG.

### The UI folder: atomic design

Atoms are one element with no state of their own, molecules a few atoms with one purpose and no store, components the pieces of the screen that read the stores or the camera, and utils the hooks, context and key table. The repeated class strings became the atoms.

### Type: four faces, and which one a thing is set in

Cinzel Decorative for the mark and the room names, EB Garamond for reading, comments and labels, Libertinus Sans for the interface, Fira Code for times and figures. Self-hosted, with their licences.

### Tests

Logic tests only, with bun test: the camera math, the wheel and pinch mapping, the glide, the scheduler, the grid tiers, the hang, the tiers, the route, the targets, the arrows, the comment events and list, the keys and the relative time. Components and pins are checked in the browser by a person; a bug found there becomes a logic test where the logic is.

### GitHub Pages

A static site under the repository's name, built with Bun and Vite by a workflow on push to main. No backend, so nothing to run.

### A shared room over trystero

Not built. The seams are in place: every event this browser makes goes to a listener, and an event from elsewhere applies through the same reducer, which ignores repeats, so a snapshot on joining is a replay. Trystero is WebRTC, peer to peer, with the signalling over public relays. The code is about sixty lines; proving it between two browsers is the real cost, and I would rather show a clean seam than a half-working demo.

## Refinement

What changed after it worked: the rolling word gave way to the bar; the desk shrank and lost its heading; pins stopped animating their position, which was also why hovering them felt inconsistent; the two comment buttons became one pill; the grid is redrawn per zoom with a fading lattice; a room brightens, a work outlines and the plan casts a shadow under the pointer; scroll pans; the zoom keys came in; and the plaque arrived after friends tried it.

## How I worked

The `.ai/` folder is the contract the agents worked under: the workflow, the style guide and the testing rules. The work went one visible step at a time, from a plan with a checkbox per step, with a check that runs format, lint, typecheck, tests and build after each.
