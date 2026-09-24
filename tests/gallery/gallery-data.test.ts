import { describe, expect, test } from "bun:test";
import { hangGallery } from "../../src/gallery/layout/hang.js";
import images from "../../src/gallery/images.json";
import { ROOMS } from "../../src/gallery/works.js";

// The gallery's own data, through the hang it ships with: a room that
// cannot take its works, or a tour that breaks, is a fault here rather
// than on the first load.
describe("the gallery's data", () => {
  const plan = hangGallery(ROOMS);

  test("hangs without a fault, one doorway per room", () => {
    expect(plan.rooms).toHaveLength(ROOMS.length);
    expect(plan.doorways).toHaveLength(ROOMS.length);
  });

  test("keeps every work inside its room", () => {
    for (const room of plan.rooms) {
      for (const { rect } of room.works) {
        expect(rect.left).toBeGreaterThanOrEqual(room.rect.left);
        expect(rect.top).toBeGreaterThanOrEqual(room.rect.top);
        expect(rect.right).toBeLessThanOrEqual(room.rect.right);
        expect(rect.bottom).toBeLessThanOrEqual(room.rect.bottom);
      }
    }
  });

  test("hangs every work that names a wall on that wall", () => {
    for (const room of plan.rooms) {
      for (const hung of room.works) {
        if (hung.work.wall !== undefined) {
          expect(hung.wall).toBe(hung.work.wall);
        }
      }
    }
  });

  test("has an image set for every work", () => {
    for (const room of ROOMS) {
      for (const work of room.works) {
        expect(images).toHaveProperty(work.id);
      }
    }
  });
});
