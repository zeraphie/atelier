/**
 * ─ Work view ─
 *
 * One work on the wall, at whichever of three tiers its size on screen
 * calls for: far is a block in the picture's own colour, mid adds the
 * picture and its title, near adds the label. The picture is the
 * smallest size of its set whose pixels cover the work on the device,
 * fetched when first needed and kept; a larger size replaces a smaller
 * one only once it has arrived, so nothing blanks, and a size once
 * shown is never swapped for a smaller one.
 * Decision: DECISIONS.md, levels of detail by zoom.
 */

import { Container, Graphics, Sprite, Text, type Texture } from "pixi.js";
import type { Point, WorldRect } from "../camera/index.js";
import type { HungWork } from "../gallery/hang.js";
import { imageSizeFor, workTier, type ImageEntry, type WorkTier } from "../gallery/tiers.js";
import { parseCssColor, type PackedColor } from "./css-color.js";

/** Where a view gets its picture at a size: the site's image set, or a picture of your own. */
export type PictureSource = (px: number) => Promise<Texture>;

export interface WorkColors {
  readonly edge: PackedColor;
  readonly card: PackedColor;
  readonly ink: PackedColor;
  readonly muted: PackedColor;
}

// Text is drawn at this size and scaled down to its size in the world,
// so the stage can sharpen it as the zoom rises.
const TEXT_PX = 24;
// The title under a work, and the label's smaller lines, in centimetres.
const TITLE_CM = 2.4;
const DETAIL_CM = 1.6;
const LABEL_GAP_CM = 3;
const CARD_PAD_CM = 1.5;
const LINE_GAP_CM = 1;

/** One hung work: its block, its picture when close enough, and its label when closer. */
export class WorkView {
  readonly container = new Container();
  private readonly hung: HungWork;
  private readonly entry: ImageEntry;
  private readonly source: PictureSource;
  private readonly colors: WorkColors;
  private readonly requestFrame: () => void;
  private readonly picture = new Sprite();
  private label: { card: Graphics; title: Text; details: Text } | undefined;
  private tier: WorkTier = "far";
  private shownPx = 0;
  private isDestroyed = false;

  constructor(
    hung: HungWork,
    entry: ImageEntry,
    source: PictureSource,
    colors: WorkColors,
    requestFrame: () => void
  ) {
    this.hung = hung;
    this.entry = entry;
    this.source = source;
    this.colors = colors;
    this.requestFrame = requestFrame;
    const { rect } = hung;
    this.container.position.set(rect.left, rect.top);
    const tone = parseCssColor(entry.color) ?? colors.card;
    const block = new Graphics()
      .rect(0, 0, this.width, this.height)
      .fill({ color: tone.rgb, alpha: 1 })
      .stroke({ color: colors.edge.rgb, alpha: colors.edge.alpha, width: 1, pixelLine: true });
    this.picture.visible = false;
    this.container.addChild(block, this.picture);
  }

  /** Follow the zoom: the tier from the work's width on screen, the picture size from its width on the device. */
  follow(zoom: number): void {
    const screenWidth = this.width * zoom;
    const tier = workTier(screenWidth, this.tier);
    if (tier !== this.tier) {
      this.tier = tier;
      this.apply();
    }
    if (tier !== "far") {
      this.want(imageSizeFor(this.entry.sizes, screenWidth * window.devicePixelRatio).px);
    }
  }

  destroy(): void {
    this.isDestroyed = true;
    this.container.destroy({ children: true });
  }

  /** Show the work with its centre on `centre`, plaque and all, without changing what it is. */
  moveTo(centre: Point): void {
    this.container.position.set(centre.x - this.width / 2, centre.y - this.height / 2);
    this.requestFrame();
  }

  /** The work and its label together, in world units, for a view that fits both. */
  extent(): WorldRect {
    if (this.label === undefined) {
      this.label = this.makeLabel();
      this.apply();
    }
    const card = this.label.card.getLocalBounds();
    const { rect } = this.hung;
    return {
      left: rect.left + Math.min(0, card.x),
      top: rect.top,
      right: rect.left + Math.max(this.width, card.x + card.width),
      bottom: rect.top + Math.max(this.height, card.y + card.height),
    };
  }

  private get width(): number {
    return this.hung.rect.right - this.hung.rect.left;
  }

  private get height(): number {
    return this.hung.rect.bottom - this.hung.rect.top;
  }

  private apply(): void {
    this.picture.visible = this.tier !== "far" && this.shownPx > 0;
    if (this.tier !== "far") {
      this.label ??= this.makeLabel();
    }
    if (this.label !== undefined) {
      this.label.title.visible = this.tier !== "far";
      this.label.details.visible = this.tier === "near";
      this.label.card.visible = this.tier === "near";
    }
    this.requestFrame();
  }

  private want(px: number): void {
    if (px <= this.shownPx) {
      return;
    }
    void this.source(px).then((texture) => {
      if (this.isDestroyed || px <= this.shownPx) {
        return;
      }
      this.shownPx = px;
      this.picture.texture = texture;
      // Inside the work's frame, centred, at the picture's own proportions.
      const scale = Math.min(this.width / texture.width, this.height / texture.height);
      this.picture.scale.set(scale);
      this.picture.position.set(
        (this.width - texture.width * scale) / 2,
        (this.height - texture.height * scale) / 2
      );
      this.picture.visible = this.tier !== "far";
      this.requestFrame();
    });
  }

  // The museum label under the work: the title alone at mid, and at near
  // the artist, year, medium, size and collection on a card behind them.
  private makeLabel(): { card: Graphics; title: Text; details: Text } {
    const { work } = this.hung;
    const { ink, muted, card: cardColor, edge } = this.colors;
    const titleScale = TITLE_CM / TEXT_PX;
    const detailScale = DETAIL_CM / TEXT_PX;
    const title = new Text({
      text: work.title,
      style: {
        fontFamily: "EB Garamond",
        fontStyle: "italic",
        fontSize: TEXT_PX,
        fill: ink.rgb,
        wordWrap: true,
        wordWrapWidth: Math.max(this.width, 30) / titleScale,
      },
    });
    title.scale.set(titleScale);
    const details = new Text({
      text: [
        `${work.artist}, ${work.year}`,
        work.medium,
        `${work.widthCm} × ${work.heightCm} cm`,
        work.collection,
      ].join("\n"),
      style: {
        fontFamily: "Libertinus Sans",
        fontSize: TEXT_PX,
        fill: muted.rgb,
        lineHeight: TEXT_PX * 1.35,
        wordWrap: true,
        wordWrapWidth: Math.max(this.width, 30) / detailScale,
      },
    });
    details.scale.set(detailScale);
    const top = this.height + LABEL_GAP_CM;
    title.position.set(0, top);
    details.position.set(0, top + title.height + LINE_GAP_CM);
    const cardWidth = Math.max(title.width, details.width) + 2 * CARD_PAD_CM;
    const cardHeight = title.height + LINE_GAP_CM + details.height + 2 * CARD_PAD_CM;
    const card = new Graphics()
      .rect(-CARD_PAD_CM, top - CARD_PAD_CM, cardWidth, cardHeight)
      .fill({ color: cardColor.rgb, alpha: cardColor.alpha })
      .stroke({ color: edge.rgb, alpha: edge.alpha, width: 1, pixelLine: true });
    this.container.addChild(card, title, details);
    return { card, title, details };
  }
}
