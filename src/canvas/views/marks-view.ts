/**
 * ─ Marks view ─
 *
 * What the layer shows over the plan and keeps at one size on screen:
 * the outline around a work under the pointer, the dashed ghost of a
 * drag, the lit edge the Door tool would take, and the badge by the
 * pointer with a measure or a word. Each is set by the layer and, since
 * its measures are in screen pixels, drawn again at every zoom.
 * Decision: DECISIONS.md, the edit rail holds the tools.
 */

import { Container, Graphics, Text } from "pixi.js";
import type { Point, Segment, WorldRect } from "../../geometry.js";
import type { PackedColor } from "../theme/css-color.js";

export interface MarkColors {
  /** The outline around a work under the pointer, and the ghost and the lit edge of a drag. */
  readonly outline: PackedColor;
  /** The badge by the pointer: its ground and its text. */
  readonly badge: { readonly back: PackedColor; readonly ink: PackedColor };
}

/** A word or a measure by a world point. */
export interface MarkLabel {
  readonly text: string;
  readonly at: Point;
}

// Screen pixels the outline keeps clear of a work and its label.
const OUTLINE_PAD_PX = 6;
// The ghost's dashes and the gaps between them, in screen pixels.
const DASH_PX = 6;
const GAP_PX = 4;
// The badge: its text size on screen, its padding, its corner, and how far it sits from the pointer.
const BADGE_PX = 12;
const BADGE_PAD_X = 6;
const BADGE_PAD_Y = 2;
const BADGE_RADIUS = 4;
const BADGE_OFFSET_PX = 14;
// The lit edge: how wide, as a multiple of the wall, and how strong.
const EDGE_WIDTH = 1.5;
const EDGE_ALPHA = 0.85;

/** The outline, the ghost, the lit edge and the badge, drawn into one container above the works. */
export class MarksView {
  readonly container = new Container({ label: "marks" });
  private readonly outline = new Graphics({ label: "outline" });
  private readonly ghost = new Graphics({ label: "ghost" });
  private readonly edgeLight = new Graphics({ label: "edge" });
  private readonly badge = new Container({ label: "badge" });
  private readonly badgeBack = new Graphics();
  private readonly badgeText: Text;
  private readonly colors: MarkColors;
  private readonly wallCm: number;
  private outlined: WorldRect | undefined;
  private ghosted: WorldRect | undefined;
  private lit: Segment | undefined;
  private label: MarkLabel | undefined;
  private zoom = 1;

  constructor(colors: MarkColors, wallCm: number) {
    this.colors = colors;
    this.wallCm = wallCm;
    this.badgeText = new Text({
      text: "",
      style: { fontFamily: "Libertinus Sans", fontSize: BADGE_PX, fill: colors.badge.ink.rgb },
    });
    this.badgeText.position.set(BADGE_PAD_X, BADGE_PAD_Y);
    this.badge.addChild(this.badgeBack, this.badgeText);
    this.badge.visible = false;
    this.ghost.visible = false;
    this.outline.visible = false;
    this.edgeLight.visible = false;
    this.container.addChild(this.outline, this.ghost, this.edgeLight, this.badge);
  }

  /** A hairline around `rect`, a few screen pixels clear of it; nothing with none. */
  outlineOf(rect: WorldRect | undefined): void {
    this.outlined = rect;
    this.drawOutline();
  }

  /** The dashed ghost of a drag on `rect`; nothing with none. */
  ghostOf(rect: WorldRect | undefined): void {
    this.ghosted = rect;
    this.drawGhost();
  }

  /** The edge lit along `segment`, as wide as a wall and a half; nothing with none. */
  edgeOf(segment: Segment | undefined): void {
    this.lit = segment;
    this.drawEdge();
  }

  /** The badge beside the pointer, at one size on screen; nothing with none. */
  badgeOf(label: MarkLabel | undefined): void {
    this.label = label;
    this.drawBadge();
  }

  /** Follow the zoom: the marks keep their measures in screen pixels, so they are drawn again. */
  follow(zoom: number): void {
    this.zoom = zoom;
    this.drawOutline();
    this.drawGhost();
    this.drawBadge();
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }

  private drawOutline(): void {
    this.outline.clear();
    const rect = this.outlined;
    if (rect === undefined) {
      this.outline.visible = false;
      return;
    }
    const { outline } = this.colors;
    const pad = OUTLINE_PAD_PX / this.zoom;
    this.outline
      .rect(
        rect.left - pad,
        rect.top - pad,
        rect.right - rect.left + 2 * pad,
        rect.bottom - rect.top + 2 * pad
      )
      .stroke({ color: outline.rgb, alpha: outline.alpha, width: 1, pixelLine: true });
    this.outline.visible = true;
  }

  private drawGhost(): void {
    this.ghost.clear();
    const ghost = this.ghosted;
    if (ghost === undefined) {
      this.ghost.visible = false;
      return;
    }
    const { outline } = this.colors;
    const corners: Point[] = [
      { x: ghost.left, y: ghost.top },
      { x: ghost.right, y: ghost.top },
      { x: ghost.right, y: ghost.bottom },
      { x: ghost.left, y: ghost.bottom },
    ];
    for (const [i, corner] of corners.entries()) {
      dashed(this.ghost, corner, corners[(i + 1) % 4]!, DASH_PX / this.zoom, GAP_PX / this.zoom);
    }
    this.ghost.stroke({ color: outline.rgb, alpha: outline.alpha, width: 1, pixelLine: true });
    this.ghost.visible = true;
  }

  private drawEdge(): void {
    this.edgeLight.clear();
    if (this.lit === undefined) {
      this.edgeLight.visible = false;
      return;
    }
    const { a, b } = this.lit;
    const { outline } = this.colors;
    this.edgeLight
      .moveTo(a.x, a.y)
      .lineTo(b.x, b.y)
      .stroke({ color: outline.rgb, alpha: EDGE_ALPHA, width: this.wallCm * EDGE_WIDTH });
    this.edgeLight.visible = true;
  }

  private drawBadge(): void {
    const label = this.label;
    if (label === undefined) {
      this.badge.visible = false;
      return;
    }
    const { badge } = this.colors;
    this.badgeText.text = label.text;
    this.badgeBack
      .clear()
      .roundRect(
        0,
        0,
        this.badgeText.width + 2 * BADGE_PAD_X,
        this.badgeText.height + 2 * BADGE_PAD_Y,
        BADGE_RADIUS
      )
      .fill({ color: badge.back.rgb, alpha: badge.back.alpha });
    this.badge.scale.set(1 / this.zoom);
    const offset = BADGE_OFFSET_PX / this.zoom;
    this.badge.position.set(label.at.x + offset, label.at.y + offset);
    this.badge.visible = true;
  }
}

// The line from `a` to `b` as dashes, drawn into `shapes` for one stroke after.
function dashed(shapes: Graphics, a: Point, b: Point, dash: number, gap: number): void {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (length === 0) {
    return;
  }
  const ux = (b.x - a.x) / length;
  const uy = (b.y - a.y) / length;
  for (let at = 0; at < length; at += dash + gap) {
    const end = Math.min(at + dash, length);
    shapes.moveTo(a.x + ux * at, a.y + uy * at).lineTo(a.x + ux * end, a.y + uy * end);
  }
}
