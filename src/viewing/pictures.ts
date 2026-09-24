/**
 * ─ Pictures over the wire ─
 *
 * A picture goes to a peer in two parts: its record first, so the
 * hanging shows at once as a placeholder with a bar sweeping along
 * its foot, then its derivative as bytes, once. A record from a peer
 * joins the collection marked with whose it is, pending until its
 * bytes are here unless they arrived first; the bytes are kept once by
 * id, and the library may hand them over as a buffer rather than a
 * blob.
 * Decision: DECISIONS.md, a picture and its hanging are two things.
 */

import { derivativeKey } from "../pictures/prepare.js";
import { useOwnStore } from "../state/own-store.js";
import type { Hanging } from "../state/slices/pictures.js";
import { without } from "../state/utils/records.js";
import { getPicture, putPicture } from "../storage/index.js";
import {
  isBytesMetadata,
  isPictureMessage,
  type BytesMetadata,
  type PictureMessage,
} from "./message.js";
import type { Transport } from "./transport.js";

/** A picture to a peer, or to all: its record, then its bytes; nothing when the picture is not here. */
export async function sendPicture(
  transport: Transport,
  pictureId: string,
  to?: string
): Promise<void> {
  const own = useOwnStore.getState();
  const record = own.pictures[pictureId];
  const blob = await getPicture(derivativeKey(pictureId));
  if (record === undefined || blob === undefined) {
    return;
  }
  const known = without(record, "pending");
  const message: PictureMessage = { kind: "picture", record: known, by: own.name };
  transport.send(message, to);
  const metadata: BytesMetadata = { kind: "bytes", id: pictureId };
  transport.send(blob, to, metadata);
}

/** A picture's record or its bytes kept; false for any other message. */
export function receivePicture(data: unknown, metadata: unknown): boolean {
  const bytes = asBlob(data);
  if (isBytesMetadata(metadata) && bytes !== undefined) {
    void keepBytes(metadata.id, bytes);
    return true;
  }
  if (isPictureMessage(data)) {
    void keepRecord(data);
    return true;
  }
  return false;
}

/** Whether an action's argument is a hanging, so the picture it hangs can follow it. */
export function isHanging(value: unknown): value is Hanging {
  return (
    typeof value === "object" && value !== null && typeof (value as Hanging).pictureId === "string"
  );
}

// A record from a peer joins the collection marked with whose it is, and as
// pending until its bytes are here, unless they arrived first.
async function keepRecord({ record, by }: PictureMessage): Promise<void> {
  const own = useOwnStore.getState();
  if (own.pictures[record.id] !== undefined) {
    return;
  }
  const isHere = (await getPicture(derivativeKey(record.id))) !== undefined;
  own.addPicture({ ...record, from: by, ...(isHere ? {} : { pending: true }) });
}

// A picture's bytes are kept once by id, and its record, if pending, is whole.
async function keepBytes(id: string, blob: Blob): Promise<void> {
  if ((await getPicture(derivativeKey(id))) === undefined) {
    await putPicture(derivativeKey(id), blob);
  }
  const record = useOwnStore.getState().pictures[id];
  if (record?.pending === true) {
    useOwnStore.getState().addPicture(without(record, "pending"));
  }
}

// Binary data as a blob, whichever shape it arrived in; nothing for anything else.
function asBlob(data: unknown): Blob | undefined {
  if (data instanceof Blob) {
    return data;
  }
  if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    return new Blob([data as BlobPart], { type: "image/jpeg" });
  }
  return undefined;
}
