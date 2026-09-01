import { describe, it, expect, beforeEach } from "vitest";
import { readJson } from "./storage";

beforeEach(() => {
  localStorage.clear();
});

describe("readJson", () => {
  it("returns the parsed object for a valid JSON value", () => {
    localStorage.setItem("k", JSON.stringify({ a: 1, b: "two" }));
    expect(readJson<{ a: number; b: string }>("k")).toEqual({ a: 1, b: "two" });
  });

  it("returns null when the key is absent", () => {
    expect(readJson("missing")).toBeNull();
  });

  it("returns null when the stored value is not parseable JSON", () => {
    localStorage.setItem("k", "{not json");
    expect(readJson("k")).toBeNull();
  });

  it("returns null when the stored value is an empty string", () => {
    localStorage.setItem("k", "");
    expect(readJson("k")).toBeNull();
  });
});
