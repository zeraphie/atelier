/** A position in whichever space the caller names: world units or screen pixels. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/** An axis-aligned rectangle, left and top inclusive, in whichever space the caller names. */
export interface WorldRect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/** A point to the whole unit: the centimetre in the world, the pixel on screen. */
export function roundedPoint(at: Point): Point {
  return { x: Math.round(at.x), y: Math.round(at.y) };
}

/** Whether two points are one and the same. */
export function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

/** A length to a tenth of its unit: a millimetre, in the world. */
export function toTenth(value: number): number {
  return Math.round(value * 10) / 10;
}
