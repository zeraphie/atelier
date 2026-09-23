/**
 * ─ Dot grid ─
 *
 * The canvas's ground: a heavier dot at every crossing of a grid in
 * round units, and a lattice of small dots between, so an empty
 * stretch of canvas still says where it is and how far away. One cell
 * is drawn to a texture at device resolution and the GPU tiles it
 * across the view; the camera sets the tile's offset and scale, so the
 * grid sits in world space at no cost per dot. The cell is drawn again
 * at every change of zoom, so a dot never grows or shrinks, only the
 * spacing does; the small dots fade out as they crowd and back in as
 * they spread, so the step to the next spacing is never seen.
 * Decision: DECISIONS.md, a dot grid in metres.
 */

import { Graphics, RenderTexture, TilingSprite, type Container, type Renderer } from "pixi.js";
import type { CameraState, CanvasSize } from "../camera/index.js";
import type { PackedColor } from "./css-color.js";
import { DOTS_BETWEEN, gridCellCm, gridTier, smallDotAlpha } from "./grid-tiers.js";

export interface DotGridColors {
  readonly crossing: PackedColor;
  readonly line: PackedColor;
}

// Screen pixels: a crossing is twice a small dot, and both keep their size at every zoom.
const CROSSING_RADIUS = 2;
const SMALL_RADIUS = 1.2;
// The smallest texture worth making; a cell is never drawn this small anyway.
const LEAST_TEXTURE_PX = 16;

/** The tiled dot grid under the world, following the camera. */
export class DotGrid {
  private readonly renderer: Renderer;
  private readonly colors: DotGridColors;
  private readonly requestFrame: () => void;
  private readonly sprite: TilingSprite;
  // One texture per size ever needed, drawn into again and again rather than made anew.
  private readonly textures = new Map<number, RenderTexture>();
  private state: CameraState;
  private tier: number;

  constructor(
    renderer: Renderer,
    parent: Container,
    colors: DotGridColors,
    requestFrame: () => void,
    camera: CameraState,
    size: CanvasSize
  ) {
    this.renderer = renderer;
    this.colors = colors;
    this.requestFrame = requestFrame;
    this.state = camera;
    this.tier = gridTier(camera.zoom);
    this.sprite = new TilingSprite({
      texture: this.drawCell(),
      width: size.width,
      height: size.height,
      label: "grid",
    });
    // Under everything in the world.
    parent.addChildAt(this.sprite, 0);
    this.place();
  }

  /** Follow the camera: every change moves the tile; a change of zoom draws the cell again. */
  follow(state: CameraState): void {
    const isZoomed = state.zoom !== this.state.zoom;
    this.state = state;
    if (isZoomed) {
      this.tier = gridTier(state.zoom, this.tier);
      this.sprite.texture = this.drawCell();
    }
    this.place();
  }

  /** Draw the grid, or not. */
  show(isShown: boolean): void {
    this.sprite.visible = isShown;
    this.requestFrame();
  }

  /** Cover the new view size; the display's pixel ratio may have changed with it. */
  resize(size: CanvasSize): void {
    this.sprite.width = size.width;
    this.sprite.height = size.height;
    this.sprite.texture = this.drawCell();
    this.place();
  }

  destroy(): void {
    this.sprite.destroy();
    for (const texture of this.textures.values()) {
      texture.destroy(true);
    }
    this.textures.clear();
  }

  // The tile repeats every cell, whatever size the texture is; its scale is
  // the cell's screen size over the texture's. The crossing sits at the
  // cell's centre, so the tile starts half a cell before the world origin,
  // which then lands on a crossing.
  private place(): void {
    const period = gridCellCm(this.tier) * this.state.zoom;
    const scale = period / this.sprite.texture.width;
    this.sprite.tileScale.set(scale);
    this.sprite.tilePosition.set(this.state.x - period / 2, this.state.y - period / 2);
  }

  // One cell at the zoom of the moment: the crossing at its centre and the
  // small dots on a lattice a fifth of the cell apart, none on the tile's
  // edge, where it would be cut and joined again by its neighbours. The
  // texture is a power of two on a side, at least as many pixels as the
  // cell has on the device, so every GPU can repeat it; without repeating,
  // the grid would be one cell at the origin.
  private drawCell(): RenderTexture {
    const cell = gridCellCm(this.tier) * this.state.zoom;
    const size = powerOfTwoAtLeast(cell * window.devicePixelRatio);
    // Texture pixels per screen pixel of the cell.
    const density = size / cell;
    const step = size / (DOTS_BETWEEN + 1);
    const { line, crossing } = this.colors;
    const shapes = new Graphics();
    for (let i = 0; i <= DOTS_BETWEEN; i += 1) {
      for (let j = 0; j <= DOTS_BETWEEN; j += 1) {
        if (i !== 0 || j !== 0) {
          shapes.circle(
            (size / 2 + i * step) % size,
            (size / 2 + j * step) % size,
            SMALL_RADIUS * density
          );
        }
      }
    }
    shapes.fill({ color: line.rgb, alpha: line.alpha * smallDotAlpha(cell / (DOTS_BETWEEN + 1)) });
    shapes
      .circle(size / 2, size / 2, CROSSING_RADIUS * density)
      .fill({ color: crossing.rgb, alpha: crossing.alpha });
    const texture = this.textureOf(size);
    this.renderer.render({
      container: shapes,
      target: texture,
      clear: true,
      clearColor: [0, 0, 0, 0],
    });
    shapes.destroy();
    return texture;
  }

  private textureOf(size: number): RenderTexture {
    let texture = this.textures.get(size);
    if (texture === undefined) {
      texture = RenderTexture.create({
        width: size,
        height: size,
        resolution: 1,
        antialias: true,
        // Set at creation: a wrap mode changed afterwards never reaches the sampler.
        addressMode: "repeat",
      });
      this.textures.set(size, texture);
    }
    return texture;
  }
}

function powerOfTwoAtLeast(pixels: number): number {
  return 2 ** Math.ceil(Math.log2(Math.max(LEAST_TEXTURE_PX, pixels)));
}
