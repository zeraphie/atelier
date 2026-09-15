/**
 * ─ Faces ─
 *
 * Pixi measures text when it draws it, so a first frame before the
 * faces load would lay every label out at the fallback's widths for
 * the rest of the session. The stage waits on these before it draws.
 */

// The faces the canvas sets text in; the files are local, so the wait is small.
const CANVAS_FACES = [
  '400 16px "Cinzel Decorative"',
  '700 16px "Cinzel Decorative"',
  '400 16px "EB Garamond"',
  'italic 400 16px "EB Garamond"',
  '400 16px "Libertinus Sans"',
  '700 16px "Libertinus Sans"',
  '500 16px "Fira Code"',
];

/** Resolves once every face the canvas draws with is loaded. */
export async function whenFacesReady(): Promise<void> {
  await Promise.all(CANVAS_FACES.map((face) => document.fonts.load(face)));
}
