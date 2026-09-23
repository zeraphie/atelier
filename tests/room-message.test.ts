import { describe, expect, test } from "bun:test";
import { isActionMessage } from "../src/collaboration/room.js";

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
