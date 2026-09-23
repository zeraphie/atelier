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

/** A straight piece between two points, in whichever space the caller names: a wall, a doorway, a stretch. */
export interface Segment {
  readonly a: Point;
  readonly b: Point;
}

/** The straight-line distance between two points. */
export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** The point `at` along `segment` from its first end; the first end itself when the segment has no length. */
export function along(segment: Segment, at: number): Point {
  const total = distance(segment.a, segment.b);
  const t = total === 0 ? 0 : at / total;
  return {
    x: segment.a.x + (segment.b.x - segment.a.x) * t,
    y: segment.a.y + (segment.b.y - segment.a.y) * t,
  };
}

/** The middle of a segment or a rect. */
export function centre(shape: Segment | WorldRect): Point {
  if ("a" in shape) {
    return { x: (shape.a.x + shape.b.x) / 2, y: (shape.a.y + shape.b.y) / 2 };
  }
  return { x: (shape.left + shape.right) / 2, y: (shape.top + shape.bottom) / 2 };
}

/** Whether `point` lies in `rect`, its edges included. */
export function contains(rect: WorldRect, point: Point): boolean {
  return (
    point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
  );
}

/** The smallest rect holding every one of `rects`. */
export function union(rects: readonly WorldRect[]): WorldRect {
  return {
    left: Math.min(...rects.map((r) => r.left)),
    top: Math.min(...rects.map((r) => r.top)),
    right: Math.max(...rects.map((r) => r.right)),
    bottom: Math.max(...rects.map((r) => r.bottom)),
  };
}
