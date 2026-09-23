import { describe, expect, test } from "bun:test";
import { isActionMessage, isPictureMetadata, isSnapshotMessage } from "../src/viewing/message.js";

describe("isActionMessage", () => {
  test("an action message names a shared action with its arguments and its time", () => {
    expect(
      isActionMessage({
        kind: "action",
        call: { action: "renameRoom", args: ["a", "Hall"], at: 5 },
      })
    ).toBe(true);
  });

  test("anything else is not: another kind, an action that is not shared, or a part missing", () => {
    expect(
      isActionMessage({ kind: "hello", call: { action: "renameRoom", args: [], at: 5 } })
    ).toBe(false);
    expect(
      isActionMessage({ kind: "action", call: { action: "setMode", args: ["edit"], at: 5 } })
    ).toBe(false);
    expect(isActionMessage({ kind: "action", call: { action: "reset", args: [] } })).toBe(false);
    expect(isActionMessage(null)).toBe(false);
    expect(isActionMessage("action")).toBe(false);
  });
});

describe("isSnapshotMessage and isPictureMetadata", () => {
  test("a snapshot has every persisted field; a picture rides with its record and a name", () => {
    const state = { threads: [], placed: {}, hangings: {}, rooms: {}, doorways: {}, resetAt: 0 };
    expect(isSnapshotMessage({ kind: "snapshot", state })).toBe(true);
    expect(isSnapshotMessage({ kind: "snapshot", state: { ...state, resetAt: "0" } })).toBe(false);
    expect(isSnapshotMessage({ kind: "action", state })).toBe(false);
    const record = {
      id: "abc",
      title: "T",
      artist: "",
      year: "",
      credit: "",
      description: "",
      widthCm: 60,
      heightCm: 40,
      color: "#cccccc",
      size: { width: 200, height: 100 },
    };
    expect(isPictureMetadata({ kind: "picture", record, by: "Izzy" })).toBe(true);
    expect(
      isPictureMetadata({ kind: "picture", record: { ...record, size: null }, by: "Izzy" })
    ).toBe(false);
    expect(isPictureMetadata({ kind: "picture", record })).toBe(false);
    expect(isPictureMetadata(undefined)).toBe(false);
  });
});
