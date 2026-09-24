import { describe, expect, test } from "bun:test";
import { ownStore } from "../../fixtures.js";

const record = {
  id: "p1",
  title: "Rain",
  artist: "",
  year: "",
  credit: "",
  description: "",
  widthCm: 60,
  heightCm: 40,
  color: "#08c",
  size: { width: 1024, height: 683 },
};

describe("the collection slice", () => {
  test("a picture added is kept by its id, and one added again is replaced whole", () => {
    const { state } = ownStore();
    state().addPicture(record);
    state().addPicture({ ...record, title: "Rain, later" });
    expect(Object.keys(state().pictures)).toEqual(["p1"]);
    expect(state().pictures["p1"]?.title).toBe("Rain, later");
  });

  test("a picture removed is gone, and removing one not there changes nothing", () => {
    const { state } = ownStore();
    state().addPicture(record);
    state().removePicture("p1");
    expect(state().pictures).toEqual({});
    const before = state().pictures;
    state().removePicture("p2");
    expect(state().pictures).toBe(before);
  });
});
