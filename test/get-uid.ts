import { genUID } from "../src";

describe("genDisposerID", () => {
  it("should return a id", () => {
    const ids = new Set();
    const count = 1000;

    for (let i = 0; i < count; i++) {
      ids.add(genUID());
    }

    expect(ids.size).toBe(count);
  });
});
