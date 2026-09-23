import { describe, expect, test } from "bun:test";
import { without } from "../src/state/utils/records.js";

describe("without", () => {
  test("a record without a key, the record itself untouched", () => {
    const record = { a: 1, b: 2 };
    expect(without(record, "a")).toEqual({ b: 2 });
    expect(record).toEqual({ a: 1, b: 2 });
  });

  test("an object without one of its fields", () => {
    const picture = { id: "p", pending: true };
    const whole: { id: string } = without(picture, "pending");
    expect(whole).toEqual({ id: "p" });
  });
});
