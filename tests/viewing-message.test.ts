import { describe, expect, test } from "bun:test";
import {
  isActionMessage,
  isBytesMetadata,
  isHelloMessage,
  isPictureMessage,
  isSnapshotMessage,
} from "../src/viewing/message.js";

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

describe("isSnapshotMessage, isPictureMessage and isBytesMetadata", () => {
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
    expect(isPictureMessage({ kind: "picture", record, by: "Izzy" })).toBe(true);
    expect(isBytesMetadata({ kind: "bytes", id: "abc" })).toBe(true);
    expect(isBytesMetadata({ kind: "picture", id: "abc" })).toBe(false);
    expect(
      isPictureMessage({ kind: "picture", record: { ...record, size: null }, by: "Izzy" })
    ).toBe(false);
    expect(isPictureMessage({ kind: "picture", record })).toBe(false);
    expect(isPictureMessage(undefined)).toBe(false);
  });
});

describe("isHelloMessage", () => {
  test("a hello carries a name, and nothing else passes", () => {
    expect(isHelloMessage({ kind: "hello", name: "Ren" })).toBe(true);
    expect(isHelloMessage({ kind: "hello" })).toBe(false);
    expect(isHelloMessage({ kind: "action", name: "Ren" })).toBe(false);
  });
});
