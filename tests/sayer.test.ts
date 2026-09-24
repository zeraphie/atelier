import { describe, expect, test } from "bun:test";
import { Sayer } from "../src/viewing/presence/sayer.js";

interface Thing {
  readonly n: number;
}

// Stands in for requestAnimationFrame: what is asked waits for the next refresh.
class FakeRefresh {
  private queue: (() => void)[] = [];

  readonly request = (tell: () => void): void => {
    this.queue.push(tell);
  };

  refresh(): void {
    const due = this.queue;
    this.queue = [];
    for (const tell of due) {
      tell();
    }
  }
}

function setUp() {
  const refresh = new FakeRefresh();
  const said: (Thing | null)[] = [];
  const sayer = new Sayer<Thing>(
    refresh.request,
    (value) => {
      said.push(value);
    },
    (a, b) => a.n === b.n
  );
  return { refresh, sayer, said };
}

describe("Sayer", () => {
  test("many changes before a refresh are one saying, of the latest", () => {
    const { refresh, sayer, said } = setUp();
    sayer.say({ n: 1 });
    sayer.say({ n: 2 });
    expect(said).toEqual([]);
    refresh.refresh();
    expect(said).toEqual([{ n: 2 }]);
  });

  test("the same thing again is not said again", () => {
    const { refresh, sayer, said } = setUp();
    sayer.say({ n: 2 });
    refresh.refresh();
    sayer.say({ n: 2 });
    refresh.refresh();
    expect(said).toEqual([{ n: 2 }]);
  });

  test("gone is said once, and never before anything was", () => {
    const { refresh, sayer, said } = setUp();
    sayer.say(undefined);
    refresh.refresh();
    expect(said).toEqual([]);
    sayer.say({ n: 5 });
    refresh.refresh();
    sayer.say(undefined);
    refresh.refresh();
    sayer.say(undefined);
    refresh.refresh();
    expect(said).toEqual([{ n: 5 }, null]);
  });

  test("saying again repeats the latest, for a peer who just arrived", () => {
    const { refresh, sayer, said } = setUp();
    sayer.say({ n: 5 });
    refresh.refresh();
    sayer.sayAgain();
    refresh.refresh();
    expect(said).toEqual([{ n: 5 }, { n: 5 }]);
  });
});
