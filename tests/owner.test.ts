import { describe, expect, test } from "bun:test";
import { mayHandle, type Work } from "../src/gallery/works.js";

const base: Work = {
  id: "w",
  title: "",
  artist: "",
  year: "",
  medium: "",
  widthCm: 10,
  heightCm: 10,
  collection: "",
  source: "",
};

describe("mayHandle", () => {
  test("anyone handles a gallery work; a picture is its hanger's, and one hung before ids is anyone's", () => {
    expect(mayHandle(base, "me")).toBe(true);
    expect(mayHandle({ ...base, pictureId: "p", by: "me" }, "me")).toBe(true);
    expect(mayHandle({ ...base, pictureId: "p", by: "them" }, "me")).toBe(false);
    expect(mayHandle({ ...base, pictureId: "p" }, "me")).toBe(true);
  });
});
