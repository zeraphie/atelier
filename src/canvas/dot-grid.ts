/**
 * ─ Dot grid ─
 *
 * The canvas's ground: a heavier dot at every crossing of a grid in
 * round units, and small dots along the lines between, so an empty
 * stretch of canvas still says where it is and how far away. One cell
 * is drawn to a texture at device resolution and the GPU tiles it
 * across the view; the camera sets the tile's offset and scale, so the
 * grid sits in world space at no cost per dot. The spacing steps by
 * fives as the zoom changes, and the cell is drawn again once the zoom
 * settles, so the dots are crisp at rest.
 * Decision: DECISIONS.md, a dot grid in metres.
 */

import {
  Graphics,
  Rectangle,
  TilingSprite,
  type Container,
  type Renderer,
  type Texture,
} from "pixi.js";
import type { CameraState, ViewSize } from "../camera/index.js";
import type { PackedColor } from "./css-color.js";
import { DOTS_BETWEEN, gridCellCm, gridTier } from "./grid-tiers.js";

export interface DotGridColors {
  readonly crossing: PackedColor;
  readonly line: PackedColor;
}

// How long after the last change of zoom or size the cell is drawn again.
const SETTLE_MS = 160;
// Screen pixels: a crossing is twice a line dot, and both keep their size at every zoom.
const CROSSING_RADIUS = 1.5;
const LINE_RADIUS = 0.75;

/** The tiled dot grid under the world, following the camera. */
export class DotGrid {
  private readonly renderer: Renderer;
  private readonly colors: DotGridColors;
  private readonly requestFrame: () => void;
  private readonly sprite: TilingSprite;
  private state: CameraState;
  private settledZoom: number;
  private tier: number;
  private settleAt: ReturnType<typeof setTimeout> | undefined;

  constructor(
    renderer: Renderer,
    parent: Container,
    colors: DotGridColors,
    requestFrame: () => void,
    camera: CameraState,
    view: ViewSize
  ) {
    this.renderer = renderer;
    this.colors = colors;
    this.requestFrame = requestFrame;
    this.state = camera;
    this.settledZoom = camera.zoom;
    this.tier = gridTier(camera.zoom);
    this.sprite = new TilingSprite({
      texture: this.cellTexture(),
      width: view.width,
      height: view.height,
      label: "grid",
    });
    // Under everything in the world.
    parent.addChildAt(this.sprite, 0);
    this.place();
  }

  /** Follow the camera: every change moves the tile; a change of zoom also schedules a redraw. */
  follow(state: CameraState): void {
    const isZoomed = state.zoom !== this.state.zoom;
    this.state = state;
    this.place();
    if (isZoomed) {
      this.scheduleSettle();
    }
  }

  /** Cover the new view size; the display's pixel ratio may have changed with it. */
  resize(view: ViewSize): void {
    this.sprite.width = view.width;
    this.sprite.height = view.height;
    this.scheduleSettle();
  }

  destroy(): void {
    clearTimeout(this.settleAt);
    this.sprite.destroy({ texture: true, textureSource: true });
  }

  // The tile repeats every cell, whatever the texture's own rounded size;
  // its scale is the cell's screen size over the texture's. The crossing
  // sits at the cell's centre, so the tile starts half a cell before the
  // world origin, which then lands on a crossing.
  private place(): void {
    const period = gridCellCm(this.tier) * this.state.zoom;
    const scale = period / this.sprite.texture.width;
    this.sprite.tileScale.set(scale);
    this.sprite.tilePosition.set(this.state.x - period / 2, this.state.y - period / 2);
  }

  private scheduleSettle(): void {
    clearTimeout(this.settleAt);
    this.settleAt = setTimeout(() => this.settle(), SETTLE_MS);
  }

  private settle(): void {
    this.settleAt = undefined;
    this.tier = gridTier(this.state.zoom, this.tier);
    this.settledZoom = this.state.zoom;
    const previous = this.sprite.texture;
    this.sprite.texture = this.cellTexture();
    previous.destroy(true);
    this.place();
    this.requestFrame();
  }

  // One cell at the settled zoom and the device's resolution: the crossing at
  // its centre, and the line dots along the two centre lines. Nothing sits on
  // the tile's edge, where it would be cut and joined again by its neighbours.
  private cellTexture(): Texture {
    const cell = gridCellCm(this.tier) * this.settledZoom;
    const step = cell / (DOTS_BETWEEN + 1);
    const shapes = new Graphics();
    for (let k = 1; k <= DOTS_BETWEEN; k += 1) {
      const along = (cell / 2 + k * step) % cell;
      shapes.circle(along, cell / 2, LINE_RADIUS).circle(cell / 2, along, LINE_RADIUS);
    }
    shapes.fill({ color: this.colors.line.rgb, alpha: this.colors.line.alpha });
    shapes
      .circle(cell / 2, cell / 2, CROSSING_RADIUS)
      .fill({ color: this.colors.crossing.rgb, alpha: this.colors.crossing.alpha });
    const texture = this.renderer.generateTexture({
      target: shapes,
      frame: new Rectangle(0, 0, cell, cell),
      resolution: window.devicePixelRatio,
      antialias: true,
    });
    shapes.destroy();
    texture.source.addressMode = "repeat";
    return texture;
  }
}
