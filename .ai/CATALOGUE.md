# Catalogue: what exists, before you write

Written by `bun run catalogue` from the doc comments, never by hand.
Listed is what is shared: every name a file in another folder
imports, and everything the UI's atoms, molecules and utils and the
root of src offer. Grouped by folder, then file, then name; a file's
takers are the folders that import from it. Look here first, then
search src, then write. [REUSE.md](REUSE.md) says why.

## src

**geometry.ts** (camera, canvas, comments, gallery, pictures, state, ui, viewing)
- `Point`: A position in whichever space the caller names: world units or screen pixels.
- `WorldRect`: An axis-aligned rectangle, left and top inclusive, in whichever space the caller names.
- `roundedPoint()`: A point to the whole unit: the centimetre in the world, the pixel on screen.
- `samePoint()`: Whether two points are one and the same.
- `toTenth()`: A length to a tenth of its unit: a millimetre, in the world.
- `Segment`: A straight piece between two points, in whichever space the caller names: a wall, a doorway, a stretch.
- `distance()`: The straight-line distance between two points.
- `along()`: The point `at` along `segment` from its first end; the first end itself when the segment has no length.
- `centre()`: The middle of a segment or a rect.
- `contains()`: Whether `point` lies in `rect`, its edges included.
- `union()`: The smallest rect holding every one of `rects`.

## camera

**camera/input/pointer-session.ts** (canvas)
- `PointerSessionOwner`: What a tool does with the pointer the session hands it.

**camera/math/glide.ts** (canvas)
- `Frame`: Runs its callback at the next frame with the time: requestAnimationFrame.
- `eased()`: Ease in and out, as a cubic: slow to start, slow to arrive.

## canvas

**canvas/frame-scheduler.ts** (viewing)
- `FrameScheduler`: Runs `draw` once at the next refresh, however many times it was asked.

**canvas/tour.ts** (ui)
- `TourHandle`: What the tour controls need: where the tour stands, and the moves.

**canvas/value-store.ts** (ui, viewing)
- `ValueStore`: One value and its listeners: what React needs from a plain module to subscribe to it.

## gallery

**gallery/edit/doors.ts** (canvas)
- `DoorAction`: What a click on an edge would do: put a doorway there, or take away the one that is there.
- `doorAt()`: What a click on `edge` would do, or nothing when the edge is on no wall.

**gallery/edit/draw.ts** (canvas)
- `cellAt()`: The grid cell `point` is in, `unitCm` to a cell.
- `spanOf()`: The cells from `from` to `to`, both included, whichever way the drag went.
- `overlaps()`: Whether `cells` lie over any of `others`, even by one cell.
- Also: `Cell`

**gallery/edit/edited.ts** (state)
- `applyEdits()`: `base` with `edits` applied, `unitCm` to a cell of the grid.

**gallery/edit/resize.ts** (canvas)
- `Limits`: The grid lines a wall may sit on, both ends included.
- `wallNear()`: The wall nearest `point` within `reachCm`; on a shared wall, the room the point is in.
- `cellsOf()`: A room's place on the grid, as cells.
- `lineOf()`: The grid line `side` of `cells` sits on.
- `limitsOf()`: How far `side` may move, in grid lines: the room keeps a metre, and the wall stops at the first of `others` in its way.
- `clamped()`: `line` held within `limits`.
- `withSide()`: `cells` with `side` on grid line `line`; a line with a fraction is a wall between lines, for a preview.

**gallery/edit/scale.ts** (canvas)
- `cornerNear()`: The corner of a picture of your own nearest `point`, within `reachCm` and the corner's own share of the picture.
- `scaled()`: `rect` with `corner` drawn towards `to`, the opposite corner held still and the proportions kept: the picture grows to whichever of its width and height the pointer asks more of, and never under `minWidthCm` wide.
- Also: `Corner`, `CornerHit`

**gallery/layout/edges.ts** (canvas, state, viewing)
- `edgeKey()`: The key an edge is stored under.
- `edgeSegment()`: The edge as a segment in world units, `unitCm` to a cell.
- `edgesNear()`: The edges within `reachCm` of `point`, nearest first: one for every vertical and every horizontal grid line within reach, in the cell the point is in, so a caller can take the first that is on a wall even when a nearer line is on none.
- Also: `Edge`

**gallery/layout/hang.ts** (canvas, comments, state, ui)
- `hangGallery()`: Lay the rooms out as a plan, cut the doorways of the tour, and hang the works on the walls.
- `rectOf()`: The rect of a room's cells on the grid, `unitCm` to a cell.
- Also: `HungWork`, `HungRoom`, `Doorway`, `Plan`, `SPACING`

**gallery/layout/targets.ts** (canvas, comments, ui)
- `workAt()`: The work under a world point, if any.
- `roomAt()`: The room under a world point, if any.
- `targetAt()`: What a double tap at `point` fills the view with: a work, else its room, else the whole plan.
- Also: `Target`

**gallery/route/route.ts** (canvas, state)
- `routeThrough()`: The works of `plan` in the order the tour visits them.
- Also: `Stop`, `Route`

**gallery/route/thresholds.ts** (ui)
- `thresholdsOf()`: An arrow for every doorway between two rooms of `plan`, in the tour's order.
- Also: `Threshold`

**gallery/tiers.ts** (canvas, ui)
- `ImageEntry`: What images.json says about one work's pictures.
- `workTier()`: The tier for a work `screenWidth` pixels wide, given the tier it shows now.
- `imageSizeFor()`: The smallest size whose width covers `deviceWidth` pixels, or the largest there is.
- Also: `WorkTier`

**gallery/works.ts** (canvas, state, ui)
- `Cells`: A room's place and size on the plan's grid of metres.
- `mayHandle()`: Whether a person may handle a work: any gallery work, and a picture they hung or one hung before ids.
- Also: `Work`, `Room`, `ROOMS`

## comments

**comments/list.ts** (ui)
- `filterThreads()`: The threads `filter` keeps: by resolved state, or every one.
- `groupByRoom()`: The threads by room in the plan's order, then those outside every room; empty groups left out.
- Also: `ListFilter`

**comments/model.ts** (state, ui, viewing)
- Also: `Comment`, `Thread`

**comments/when.ts** (ui)
- `whenWas()`: `then` as said at `now`, both in milliseconds since the epoch.

## pictures

**pictures/prepare.ts** (canvas, ui, viewing)
- `DERIVATIVE_PX`: The derivative's long edge, in pixels, and the suffix it is kept under.
- `derivativeKey()`: The key a picture's derivative is kept under in the picture store.
- `preparePicture()`: Hash, shrink and sample `file`; throws when it is not a picture the browser can decode.
- `heightFor()`: The height a picture hangs at for a width, from its proportions, to a millimetre.
- Also: `PreparedPicture`

## state

**state/own-store.ts** (canvas, ui, viewing)
- Also: `useOwnStore`

**state/slices/collection.ts** (canvas, gallery, viewing)
- Also: `PictureRecord`

**state/slices/gallery.ts** (gallery, viewing)
- `RoomEdit`: A room's edits, each stamped; a type rather than an interface so it reads as the record of stamps it is.
- `roomsAfter()`: Each room's edits from after `at`, and no room left with none.

**state/slices/interface.ts** (canvas, ui)
- Also: `Tool`

**state/slices/pictures.ts** (gallery, viewing)
- Also: `Hanging`

**state/slices/viewing.ts** (ui, viewing)
- `tallyOf()`: The tally of the open proposal: this screen and the peers here count, and every decline given stands; noughts when none is open.
- `isUnanimous()`: Whether everyone here has agreed and no one has declined: the reset may be made.
- Also: `Peer`

**state/store.ts** (canvas, ui, viewing)
- `switchGallery()`: Persist the gallery under `key` from now on.
- `absorbSnapshot()`: Merge a peer's snapshot into the gallery: the later of anything stamped wins, and nothing is told.
- Also: `Store`, `useStore`

**state/utils/actions.ts** (viewing)
- `onAction()`: Hear every action this screen takes; returns the unsubscribe function.
- Also: `ActionCall`

**state/utils/gallery-key.ts** (viewing)
- `GALLERY_KEY`: The key the gallery before viewings persisted under; a viewing's key is this with its code after a dot.
- `keyForViewing()`: The key a viewing's gallery persists under; the plain key for none.

**state/utils/plan.ts** (canvas, ui)
- `usePlan()`: The plan, re-rendering only when the edits or the collection change it.
- `currentPlan()`: The plan as it stands now, for code outside React.
- `currentRoute()`: The route as it stands now, for code outside React.
- `onPlanChange()`: Hear of every new plan, from either store; returns the unsubscribe function.
- `planWith()`: The current plan with a room's cells put in, swapped or added: a preview of a resize or a draw.

**state/utils/records.ts** (viewing)
- `without()`: A record without one of its keys, as a new object; the record itself is left as it was.

**state/utils/stamped.ts** (gallery, ui, viewing)
- `latest()`: The later of two stamped values; the one held on a tie, so a repeat is a no-op.
- `latestFirst()`: The keys of `map`, latest first by stamp.
- `keptAfter()`: The entries of `map` set after `at`; the rest, and any never set, are gone.
- Also: `Stamped`

## storage

**storage/index.ts** (canvas, state, ui, viewing)
- `hydration`: The roll call every persisted store joins at creation.
- `whenHydrated()`: Resolves once every persisted store has loaded, or given up.

## ui: atoms

**ui/atoms/Card.tsx**
- `DIALOG_OVERLAY`: What a dialog lays over everything behind it.
- `DIALOG_PANEL`: A dialog's panel: a card of one width, fixed and centred across; where it sits down the window, and how high it stacks, are the dialog's own.
- `DIALOG_CONTENT`: A dialog's panel in the middle of the window, above its overlay.
- `DIALOG_TITLE`: A dialog's title line.
- `Card()`: The raised surface every panel and popover sits on.
- Also: `CARD`

**ui/atoms/Field.tsx**
- `FIELD`: A field's frame: its caption above its control, in the caption face; for a frame that is not a label.
- `FieldLabel()`: A field's frame as a label with its control inside, so a press on the caption reaches the control.
- `Textarea()`: Where a comment is typed, in the reading face.
- `Input()`: Where a short answer is typed, such as a name or a code.

**ui/atoms/OnScreen.tsx**
- `OnScreen()`: A thing in the DOM overlay at a screen point: by its centre, or, anchored at the corner, by its top-left.

**ui/atoms/Pill.tsx**
- `Pill()`: A corner's worth of controls in one rounded surface.
- `PillButton()`: A tool in a pill, showing pressed and expanded in colour.
- `PillLabel()`: A reading between tools: where the tour stands.

**ui/atoms/TextButton.tsx**
- `TextButton()`: A button that is a word: the one action of a form, or a quiet one beside it.

**ui/atoms/Tip.tsx**
- `Tip()`: The tooltip's bubble, in ink beside whatever it describes.

**ui/atoms/icons.tsx**
- `CommentIcon()`: A speech bubble: a comment.
- `PenIcon()`: A pen: editing the gallery.
- `ArrowIcon()`: An arrow turned to a direction, for a threshold.
- `MoveIcon()`: The Move tool's mark.
- `RoomIcon()`: The Room tool's mark.
- `DoorIcon()`: The Door tool's mark.
- `PictureIcon()`: The Picture tool's mark.
- `ResetIcon()`: The mark for putting everything back.
- `CursorIcon()`: A peer's pointer: an arrow in the person's colour, its tip at the top-left corner.

**ui/atoms/styles.ts**
- `FOCUS_RING`: The focus ring, for keyboard focus only; an element adds its own offset.
- `TOOL`: A tool's button: ink on the surface, lit under the pointer, in the accent while pressed or checked, the ring inside its edge.
- `PERSON`: A person's colour as the ground, with the ink that reads on it; the colour comes in by `personStyle`.
- `INITIAL`: A person's initial on a round mark in their colour; the element adds its size and its edge.
- `personStyle()`: The custom property `PERSON` reads: the person's colour, as a style.

## ui: molecules

**ui/molecules/ColorPicker.tsx**
- `ColorPicker()`: The eight colours as a row of circles, one chosen.

**ui/molecules/Comment.tsx**
- `Comment()`: One comment as it reads: who, when, the text, and for its author a way to change it.

**ui/molecules/CommentForm.tsx**
- `CommentForm()`: A place to write a comment: Enter sends, Shift+Enter breaks a line, Escape cancels.

**ui/molecules/IdentityFields.tsx**
- `CodeField()`: The viewing's code, with a button for a new one; `note` is a line under it.
- `NameField()`: The name, as a label with its input.
- `ColourField()`: The colour, as the eight circles under their caption.
- `IdentityFields()`: The three fields stacked: the code, the name, the colour.

**ui/molecules/OnFloor.tsx**
- `OnFloor()`: A card at a world point, as wide as it says in centimetres, scaled by the camera.

**ui/molecules/PictureDetailsForm.tsx**
- `PictureDetails`: What the form asks for, trimmed.
- `PictureDetailsForm()`: The details of a picture to hang, with the file's name as the title to start.

**ui/molecules/ThreadItem.tsx**
- `ThreadItem()`: One thread as a row of the list: who opened it and when, its opening words, its replies and state.

## ui: utils

**ui/utils/canvas-context.tsx**
- `CanvasProvider()`: Makes the one camera, the canvas size, the tour, the grid switch and the pointer, and hands them down by context.
- `useCanvas()`: The session, for components under a CanvasProvider.
- `useCameraState()`: The camera's state, re-rendering on every change.
- `useTour()`: The tour, once there is one, re-rendering when it comes or goes.
- `useGridShown()`: Whether the grid is drawn, re-rendering when it is switched.
- `useCanvasSize()`: The canvas size in CSS pixels, re-rendering on resize.
- Also: `CanvasSession`

**ui/utils/curtain.ts**
- `whenMarkDrawn()`: Resolves once the mark has finished drawing; at once when there is no mark or motion is reduced.
- `whenLoaderDone()`: Resolves once the mark is drawn and the line has swept once: the loader has said its piece.
- `raiseCurtain()`: Open the curtain once the mark has drawn.
- `failLoader()`: Say the load failed; only a reload helps from here.

**ui/utils/keys.ts**
- `KeyPress`: The parts of a keyboard event the table reads.
- `keyActionFor()`: The action a press asks for, or none: a press with Ctrl, Command or Alt is the browser's.
- Also: `KeyAction`

**ui/utils/shortcuts.ts**
- `useShortcuts()`: Listens for the keys the interface answers to, for as long as the app is mounted.

**ui/utils/use-follow.ts**
- `useLookSharing()`: Where you look, said as the camera or the canvas changes.
- `useFollowing()`: The peer followed, if any, steering the camera until anything else does.

**ui/utils/use-now.ts**
- `useNow()`: The time, as a value that moves on every half minute, so a component can say how long ago.

**ui/utils/use-value.ts**
- `useValue()`: The value `store` holds, re-rendering on every change; `whenNone` while there is no store.

**ui/utils/use-viewing.ts**
- `useViewing()`: Follows the address: the viewing it names is joined and any other left, and unmounting leaves.
- `enterViewing()`: Put a viewing in the address, which joins it.
- `goHome()`: Go home: the viewing this browser made for itself, made now if it has none.
- `useCursorSharing()`: Your pointer, said to the viewing as it moves, and said gone while you follow someone or when this unmounts.

## viewing

**viewing/bring-comments.ts** (ui)
- `bringCommentsFrom()`: Replay another viewing's saved threads here, telling each; how many came.

**viewing/identity/arrival.ts** (ui)
- `whenArrived()`: Resolves once the person has come in and their viewing's saved state is switched to.
- `offeredCode()`: The code the card offers, and whether it was made just now.
- `arrive()`: Come in: keep the name and colour, make this the home viewing if there is none yet, put the code in the address and join it.

**viewing/identity/code.ts** (ui)
- `newViewingCode()`: A new code, from the browser's randomness.

**viewing/identity/color.ts** (state, ui)
- `PALETTE`: The eight colours, in the rainbow's order.
- `colorOf()`: The CSS colour of a swatch, by id; an unknown id is the blue.
- `colorFor()`: The colour a name is shown in, chosen or not: its swatch's, or the one its name lands on.
- `initialOf()`: The initial a name is shown by.
- `swatchIdFor()`: The swatch a person acts in: the one chosen, or the one their name lands on.

**viewing/identity/hash.ts** (ui)
- `viewingCodeFromHash()`: The viewing's code a location hash names, or none.
- `hashForViewing()`: The location hash that names a viewing.

**viewing/presence/cursors.ts** (ui)
- `cursors`: The peers' pointers in the world, by peer id; only those over their canvas.

**viewing/presence/looks.ts** (ui)
- `looks`: The peers' looks, by peer id.
- `lookOf()`: Your look: the world point at the middle of a window of `size`, to the centimetre, and the zoom to a thousandth.
- Also: `Look`

**viewing/presence/presence.ts** (ui)
- `sayCursor()`: Say where your pointer is in the world, to the centimetre, or that it is off the canvas; once a frame at most.
- `sayLook()`: Say where you are looking; once a frame at most, and only when it changed.
- `sayFollowing()`: Tell a peer you are following them, or no longer; nothing to one who has gone.

**viewing/proposal.ts** (state, ui)
- `proposeReset()`: Put everything back as the viewing does it: alone, the reset itself; with peers, a proposal to them all, agreed to by you.
- `answerReset()`: Answer the open proposal, yes to put back and no to keep as it is, and say so to everyone.
- `confirmReset()`: Put everything back, everyone here having agreed to the proposal this screen made: the reset itself, told to all like any action, which closes the proposal on every screen as it lands.
- `withdrawReset()`: Take back the proposal this screen made, for everyone.

**viewing/snapshot.ts** (state)
- `Snapshot`: The persisted part of a gallery.
- `snapshotOf()`: The snapshot of a gallery's state: its persisted fields and nothing else.
- `mergeSnapshot()`: `mine` with `theirs` merged in, the later of anything stamped winning and a tie kept as mine.

**viewing/viewing.ts** (state, ui)
- `joinViewing()`: Join the viewing `code`, leaving any other first; joining the one being joined shares its wait.
- `leaveViewing()`: Leave the viewing, if in one, and go back to the solo gallery.
- `currentPeers()`: The peers the transport itself knows of, for a look under the hood.
