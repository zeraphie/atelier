import { describe, expect, test } from "bun:test";
import { acting, type ActionCall } from "../src/state/utils/actions.js";

function setUp(resetAt = 0) {
  const told: ActionCall[] = [];
  const written: number[] = [];
  const act = acting(() => ({ resetAt }), {
    who: () => "Izzy",
    color: () => "teal",
    tell: (call) => told.push(call),
  });
  return { act, told, written, write: (at: number) => written.push(at) };
}

describe("acting", () => {
  test("a write is given its time and told by name with it", () => {
    const { act, told, written, write } = setUp();
    act({ at: 50 }, { action: "moveWork", args: ["a"] }, write);
    expect(written).toEqual([50]);
    expect(told).toEqual([{ action: "moveWork", args: ["a"], at: 50 }]);
  });

  test("a write from a peer's replay is applied but not told again", () => {
    const { act, told, written, write } = setUp();
    act({ at: 50, remote: true }, { action: "moveWork", args: ["a"] }, write);
    expect(written).toEqual([50]);
    expect(told).toEqual([]);
  });

  test("a write from at or before the reset is refused whole, neither applied nor told", () => {
    const { act, told, written, write } = setUp(100);
    act({ at: 100 }, { action: "moveWork", args: ["a"] }, write);
    act({ at: 60, remote: true }, { action: "moveWork", args: ["a"] }, write);
    expect(written).toEqual([]);
    expect(told).toEqual([]);
  });
});
