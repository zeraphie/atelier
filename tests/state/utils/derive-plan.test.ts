import { describe, expect, test } from "bun:test";
import { PlanMemo, planWithRoom, type PlanInputs } from "../../../src/state/utils/derive-plan.js";

const empty: PlanInputs = { rooms: {}, doorways: {}, placed: {}, hangings: {}, pictures: {} };

describe("PlanMemo", () => {
  test("the same inputs give the same plan and route, so nothing re-renders for nothing", () => {
    const memo = new PlanMemo();
    const first = memo.of(empty);
    expect(memo.of(empty)).toBe(first);
    expect(memo.of({ ...empty })).toBe(first);
  });

  test("a new value for any input gives a new plan", () => {
    const memo = new PlanMemo();
    const first = memo.of(empty);
    const renamed = { ...empty, rooms: { foyer: { name: { value: "Hall", at: 1 } } } };
    const second = memo.of(renamed);
    expect(second).not.toBe(first);
    expect(second.plan.rooms[0]?.room.name).toBe("Hall");
    expect(memo.of(renamed)).toBe(second);
  });
});

describe("planWithRoom", () => {
  test("a room the plan has takes the cells put in", () => {
    const plan = planWithRoom(empty, "foyer", { column: 0, row: 0, columns: 5, rows: 1 });
    const foyer = plan.rooms.find((room) => room.room.id === "foyer")!;
    expect(foyer.rect).toEqual({ left: 0, top: 0, right: 500, bottom: 100 });
  });

  test("a room the plan has not is added at the end, drawn", () => {
    const plan = planWithRoom(empty, "drawing", { column: 9, row: 9, columns: 2, rows: 2 });
    const last = plan.rooms.at(-1)!;
    expect(last.room.id).toBe("drawing");
    expect(last.room.drawn).toBe(true);
    expect(last.rect).toEqual({ left: 900, top: 900, right: 1100, bottom: 1100 });
  });
});
