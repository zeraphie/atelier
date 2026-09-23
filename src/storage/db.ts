/**
 * ─ Database ─
 *
 * One IndexedDB database, `atelier`, for everything that persists: a
 * `state` store of JSON strings the zustand stores read and write
 * through `stateStorage`, and a `pictures` store of Blobs. IndexedDB
 * rather than localStorage because a picture is megabytes and a Blob,
 * not a string, and because its calls never block the canvas. Opened
 * once, on first use; every call is a promise.
 * Decision: DECISIONS.md, persistence.
 */

import type { StateStorage } from "zustand/middleware";

const NAME = "atelier";
const VERSION = 1;
const STATE = "state";
const PICTURES = "pictures";

let opening: Promise<IDBDatabase> | undefined;

// The stores are made the first time this version opens; a later version
// adds its own here, above, without touching what is there.
function open(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STATE)) {
        db.createObjectStore(STATE);
      }
      if (!db.objectStoreNames.contains(PICTURES)) {
        db.createObjectStore(PICTURES);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("The database would not open."));
    request.onblocked = () => {
      reject(new Error("The database is open in another tab at an older version."));
    };
  });
  return opening;
}

function settled<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("The database request failed."));
  });
}

async function read<T>(store: string, key: string): Promise<T | undefined> {
  const db = await open();
  const found: unknown = await settled(
    db.transaction(store, "readonly").objectStore(store).get(key)
  );
  return found as T | undefined;
}

async function write(store: string, key: string, value: unknown): Promise<void> {
  const db = await open();
  await settled(db.transaction(store, "readwrite").objectStore(store).put(value, key));
}

async function remove(store: string, key: string): Promise<void> {
  const db = await open();
  await settled(db.transaction(store, "readwrite").objectStore(store).delete(key));
}

/** What a zustand store persists through: JSON strings by name, in the state store. */
export const stateStorage: StateStorage = {
  getItem: async (name) => (await read<string>(STATE, name)) ?? null,
  setItem: (name, value) => write(STATE, name, value),
  removeItem: (name) => remove(STATE, name),
};

/** Keep a picture's bytes under an id. */
export function putPicture(id: string, picture: Blob): Promise<void> {
  return write(PICTURES, id, picture);
}

/** The picture kept under `id`, if any. */
export function getPicture(id: string): Promise<Blob | undefined> {
  return read<Blob>(PICTURES, id);
}

export function deletePicture(id: string): Promise<void> {
  return remove(PICTURES, id);
}
