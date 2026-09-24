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

No accounts. A browser has an id made once, which is what its hangings are owned by, and a name, "Visitor" and a number until it is set, kept with the comments. Edit is offered on your own comments by name match, which is a convenience rather than security.

### Identity is a name and a colour

Beside the name, one of eight colours, made from the blue I like by turning its hue in equal steps at one lightness and chroma, so every one reads on the canvas and beside the others. Until a colour is chosen, the name's hash lands on the nearest, so a visitor is never grey. Both travel with the hello a screen says on joining, a comment keeps the colour it was made in, and the colour is what a pin, a cursor and an initial in the chip wear. A colour picker is not something Radix has, so it is a radio group of eight circles.

### The wall is curated by default, yours to rearrange here

The works and rooms are data, and the gallery opens as the data hangs it. Editing came later, as a mode: what you move, resize, draw or hang is kept as an edit beside the data, never written into it, so the shipped gallery is always there underneath. "Put everything back" is one event that draws a line in time before which no edit counts, and it lives at the foot of the edit rail behind a confirm, because it undoes everyone's work in a viewing at once. I weighed keeping the wall fixed, which was the first decision, and dragging that wrote into the data, which would have made the shipped hang unrecoverable.

### Putting everything back is unanimous

In a viewing, Put everything back asks rather than acts. The first confirm sends a proposal, and the same dialog opens on every screen, whatever it is doing, with the words and a tally, "1 of 3 have agreed"; each person puts back or keeps it as it is. Once everyone here has agreed, the proposer confirms again, and the reset is the one event, which closes the dialog wherever it lands. A decline ends it: the dialog stays on every screen saying how many declined, Put back greyed, until each closes it, and a new proposal can follow. Who counts is whoever is here as the answers come in: an arrival is shown the open proposal with the answers so far, and a leaver no longer counts, but the answer they gave stands, so a decline still declines once its peer has gone. The proposer's Cancel or Escape withdraws for everyone while it is live, and so does the proposer leaving; two proposals made at once resolve to the earlier by time, then by id, so every screen keeps the same one. The tally is numbers, never names; the proposer is named, since they asked. I weighed the reset applying itself on every screen the moment it was unanimous, which was built first; a second confirm means the moment it lands is a person's, and the reset stays one action told by one screen.

### The edit rail holds the tools

Editing is a mode, like commenting, entered from the pen in the top-right pill or with E, so browsing never moves anything by accident. In the mode a rail on the left holds four tools and the reset: Move drags a picture, a wall or a doorway and renames a room in place; Room draws one on empty ground; Door puts a doorway on any metre edge of a wall or takes one away; Picture hangs a file where you click and scales your own by a corner. One tool is held at a time, Escape puts it down, and every tool is a pointer session on the canvas that takes the press before the camera can pan. I weighed a menu on the pill and tools in the right-click menu; a rail is what the design tools do, and it leaves the menu for the things about a spot.

### Rooms stay on the metre grid

A room is drawn and resized in whole metres, with a snapped ghost while you drag and a short glide on release, so the plan stays a plan. Every doorway sits in the middle of one metre edge and is half a cell wide, the tour's own included: a third along the wall means the metre a third along. The shipped rooms keep the tour's doorways, which were placed with intent; a drawn room opens onto every room it meets when it is made, one doorway per pair, and the Door tool adds, moves and removes them anywhere there is a wall, an outer wall making a way outside. The hang no longer throws for a room too small for its works: a work that does not fit sits at the room's centre. The cost is that a wall between two rooms of unequal size is two edges, and the hang draws each piece once.

### A picture and its hanging are two things

Your pictures are a collection of your own, kept once whatever viewing you are in: the bytes in the database by id, and the record, the title, artist, year, credit, a description in your words, the width and the picture's colour, in a slice of the own store. A room holds hangings, a picture's id and where it hangs and how wide, and only the person who hung a picture can move, size or take it down; anyone can comment around it. So hanging the same picture twice costs nothing, and taking one down leaves it in the collection. A hanging goes to peers with the record first, so it shows at once as a placeholder with a bar sweeping along its foot, then the 1024 px derivative once; the original never leaves the browser.

### A picture's id is the hash of its bytes

SHA-256 of the file, from crypto.subtle, so the same file from two people is stored once and a peer that already holds the id skips the transfer; the derivative shares the id with a size suffix. Credits stay per person, in their own collection. A re-saved copy of the same photo is a different file and a different id, which is the limit, and I say so rather than fingerprint images.

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

### State: zustand slices

Two stores, each composed from slices that are plain factories a test stands up on a vanilla store with no database: the gallery store holds the comments, the pictures' placements and hangings, the rooms' and doorways' edits, and the interface state that is never kept; the own store holds who this browser is and its collection. There are no reducers: a slice's actions are functions, and the comment events became actions with the same names. Immer was weighed and left out; the actions are short enough to write by hand.

### Slices with actions, latest wins

Every value an action sets carries its time, and an action keeps the later of what it holds and what it is given, so two people applying the same actions in any order end up with the same gallery, and a repeat changes nothing. A reset is a time before which nothing counts; taking something down leaves a tombstone, so a late replay cannot put it back. A snapshot handed to a peer merges by the same rule as a live action. Every action is told by name with its arguments and its time, which is how a viewing sends it and how a peer replays it, marked remote so it is not told again.

### Persistence

Everything persists in one IndexedDB database: a state store of JSON for the zustand stores, through an async storage, and a pictures store of Blobs, since a picture is megabytes and its calls never block the canvas. Each viewing's gallery persists under its own key, and the own store under one key whatever viewing is open. The curtain waits for the stores as it waits for the first frame, and for the switch to the viewing's saved state, so the gallery never shows empty; a peer's snapshot, which may be slow or never come, merges in live after. Clearing site data is the reset.

### Tailwind v4 tokens and Radix primitives

Colours and faces are tokens in one place, in oklch, and Pixi reads the same custom properties through one bridge, so the canvas and the interface share a palette by name. Radix gives the popover, tooltip and context menu their keyboard and focus behaviour. No icon font: the two icons are inline SVG.

### The UI folder: atomic design

Atoms are one element with no state of their own, molecules a few atoms with one purpose and no store, components the pieces of the screen that read the stores or the camera, and utils the hooks, context and key table. The repeated class strings became the atoms.

### Type: four faces, and which one a thing is set in

Cinzel Decorative for the mark and the room names, EB Garamond for reading, comments and labels, Libertinus Sans for the interface, Fira Code for times and figures. Self-hosted, with their licences.

### Tests

Logic tests only, with bun test, mirroring the source folders: the camera maths, the wheel, pinch and tap mappings, the glide, the scheduler, the grid tiers, the hang and its doorways and wall maths, the tiers, the route, the targets, the arrows, the edits, every slice, the stamps, the messages a peer may send, the sayers and what is kept per peer, the tour, and the relative time. Fixtures two files share live in one file and fakes in another. Components and pins are checked in the browser by a person; a bug found there becomes a logic test where the logic is.

### GitHub Pages

A static site under the repository's name, built with Bun and Vite by a workflow on push to main. No backend, so nothing to run.

### Everyone is in a viewing

A viewing is a gallery shared by a code. On arriving, a card under the mark offers the code from the address, else this browser's home, else where it was last, else one made just now, with the name and the colour; Come in is one press, and the pen changes any of them. The first code a browser makes is its home and starts from the gallery it kept before viewings. Peers find each other through trystero, WebRTC with the signalling over public Nostr relays named outright, in the one file that touches the library, and the app works with the relays unreachable: joining never blocks the curtain, and "Just you" is a named state. A peer arriving is handed the gallery whole and the pictures hung in it, and merges by the later stamp. Each screen says its pointer and where it looks once a frame at most, only when changed, kept per peer apart from the store since they move every frame; pressing a peer's initial follows their look until anything else moves your camera, and a follower's pointer is not said. The library's chunk is 61 kB, 22 kB gzipped, loaded on demand.

## Refinement

What changed after it worked: the rolling word gave way to the bar; the desk shrank and lost its heading; pins stopped animating their position, which was also why hovering them felt inconsistent; the two comment buttons became one pill; the grid is redrawn per zoom with a fading lattice; a room brightens, a work outlines and the plan casts a shadow under the pointer; scroll pans; the zoom keys came in; and the plaque arrived after friends tried it.

## How I worked

The `.ai/` folder is the contract the agents worked under: the workflow, the style guide and the testing rules. The work went one visible step at a time, from a plan with a checkbox per step, with a check that runs format, lint, typecheck, tests and build after each.
