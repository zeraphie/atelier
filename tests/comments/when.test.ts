import { describe, expect, test } from "bun:test";
import { whenWas } from "../../src/comments/when.js";

const NOW = Date.UTC(2026, 8, 15, 12, 0, 0);
const s = 1000;
const m = 60 * s;
const h = 60 * m;
const d = 24 * h;

describe("whenWas", () => {
  test("the last moments are just now", () => {
    expect(whenWas(NOW, NOW)).toBe("just now");
    expect(whenWas(NOW - 30 * s, NOW)).toBe("just now");
  });

  test("minutes, said plainly", () => {
    expect(whenWas(NOW - 70 * s, NOW)).toBe("a minute ago");
    expect(whenWas(NOW - 5 * m, NOW)).toBe("5 minutes ago");
    expect(whenWas(NOW - 44 * m, NOW)).toBe("44 minutes ago");
  });

  test("hours, then yesterday, then days", () => {
    expect(whenWas(NOW - 60 * m, NOW)).toBe("an hour ago");
    expect(whenWas(NOW - 3 * h, NOW)).toBe("3 hours ago");
    expect(whenWas(NOW - 25 * h, NOW)).toBe("yesterday");
    expect(whenWas(NOW - 3 * d, NOW)).toBe("3 days ago");
  });

  test("a week or more is the day", () => {
    expect(whenWas(NOW - 10 * d, NOW)).toBe("5 Sept 2026");
  });

  test("a moment in the future is just now, not negative", () => {
    expect(whenWas(NOW + 5 * m, NOW)).toBe("just now");
  });
});
