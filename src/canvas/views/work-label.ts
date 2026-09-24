/**
 * ─ Work label ─
 *
 * The museum label under a work: the title alone at mid, and at near
 * the artist, year, medium, size and collection on a card behind them.
 * Text is drawn large and scaled down to its size in the world, so the
 * stage can sharpen it as the zoom rises; the view shows and hides the
 * three parts as its tier says.
 * Decision: DECISIONS.md, levels of detail by zoom.
 */

import { Graphics, Text, type Container } from "pixi.js";
import type { Work } from "../../gallery/works.js";
import type { PackedColor } from "../theme/css-color.js";

/** The label's three parts, added to the work's container. */
export interface WorkLabel {
  readonly card: Graphics;
  readonly title: Text;
  readonly details: Text;
}

export interface LabelColors {
  readonly ink: PackedColor;
  readonly muted: PackedColor;
  readonly card: PackedColor;
  readonly edge: PackedColor;
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

/** The label under a work of `width` by `height` centimetres, added to `container` at the work's foot. */
export function makeWorkLabel(
  container: Container,
  work: Work,
  width: number,
  height: number,
  colors: LabelColors
): WorkLabel {
  const { ink, muted, card: cardColor, edge } = colors;
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
      wordWrapWidth: Math.max(width, 30) / titleScale,
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
      wordWrapWidth: Math.max(width, 30) / detailScale,
    },
  });
  details.scale.set(detailScale);
  const top = height + LABEL_GAP_CM;
  title.position.set(0, top);
  details.position.set(0, top + title.height + LINE_GAP_CM);
  const cardWidth = Math.max(title.width, details.width) + 2 * CARD_PAD_CM;
  const cardHeight = title.height + LINE_GAP_CM + details.height + 2 * CARD_PAD_CM;
  const card = new Graphics()
    .rect(-CARD_PAD_CM, top - CARD_PAD_CM, cardWidth, cardHeight)
    .fill({ color: cardColor.rgb, alpha: cardColor.alpha })
    .stroke({ color: edge.rgb, alpha: edge.alpha, width: 1, pixelLine: true });
  container.addChild(card, title, details);
  return { card, title, details };
}
