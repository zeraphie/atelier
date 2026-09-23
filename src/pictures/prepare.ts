/**
 * ─ Prepare ─
 *
 * A file becomes a picture: its id is the SHA-256 of its bytes, so the
 * same file from two people is one picture; a derivative no longer
 * than 1024 px on its long edge, as a JPEG on white, is what the canvas
 * draws and what will travel to peers; and its dominant colour, for the
 * far tier, is the average of the picture drawn small. All of it stays
 * in memory until the picture is hung, so a cancelled form leaves
 * nothing behind.
 * Decision: DECISIONS.md, a picture's id is the hash of its bytes.
 */

export interface PreparedPicture {
  readonly id: string;
  readonly original: Blob;
  readonly derivative: Blob;
  /** The derivative's pixels. */
  readonly size: { readonly width: number; readonly height: number };
  readonly color: string;
}

/** The derivative's long edge, in pixels, and the suffix it is kept under. */
export const DERIVATIVE_PX = 1024;
const JPEG_QUALITY = 0.86;
// The picture is drawn this many pixels square to find its colour.
const SWATCH_PX = 8;

/** The key a picture's derivative is kept under in the picture store. */
export function derivativeKey(id: string): string {
  return `${id}-${DERIVATIVE_PX}`;
}

/** Hash, shrink and sample `file`; throws when it is not a picture the browser can decode. */
export async function preparePicture(file: Blob): Promise<PreparedPicture> {
  const [id, bitmap] = await Promise.all([hashOf(file), createImageBitmap(file)]);
  const scale = Math.min(1, DERIVATIVE_PX / Math.max(bitmap.width, bitmap.height));
  const size = {
    width: Math.max(1, Math.round(bitmap.width * scale)),
    height: Math.max(1, Math.round(bitmap.height * scale)),
  };
  const derivative = await drawn(bitmap, size.width, size.height);
  const color = colorOf(bitmap);
  bitmap.close();
  return { id, original: file, derivative, size, color };
}

async function hashOf(file: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

// The bitmap drawn at a size onto white, encoded as a JPEG.
function drawn(bitmap: ImageBitmap, width: number, height: number): Promise<Blob> {
  const context = canvasOf(width, height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    context.canvas.toBlob(
      (blob) => {
        if (blob === null) {
          reject(new Error("the picture could not be encoded"));
        } else {
          resolve(blob);
        }
      },
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}

// The average of the picture drawn small, as a hex colour.
function colorOf(bitmap: ImageBitmap): string {
  const context = canvasOf(SWATCH_PX, SWATCH_PX);
  context.drawImage(bitmap, 0, 0, SWATCH_PX, SWATCH_PX);
  const { data } = context.getImageData(0, 0, SWATCH_PX, SWATCH_PX);
  let red = 0;
  let green = 0;
  let blue = 0;
  for (let i = 0; i + 2 < data.length; i += 4) {
    red += data[i]!;
    green += data[i + 1]!;
    blue += data[i + 2]!;
  }
  const count = data.length / 4;
  const hex = (sum: number): string =>
    Math.round(sum / count)
      .toString(16)
      .padStart(2, "0");
  return `#${hex(red)}${hex(green)}${hex(blue)}`;
}

function canvasOf(width: number, height: number): CanvasRenderingContext2D {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("no 2d context to prepare the picture with");
  }
  return context;
}
