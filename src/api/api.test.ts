import { describe, it, expect } from "vitest";
import { getFileUrl, API_FILE_URL } from "./api";

const FALLBACK = "/images/landscape-placeholder.svg";

describe("getFileUrl", () => {
  it("returns fallback when key is null", () => {
    expect(getFileUrl(null)).toBe(FALLBACK);
  });

  it("returns fallback when key is undefined", () => {
    expect(getFileUrl(undefined)).toBe(FALLBACK);
  });

  it("returns fallback when key is empty string", () => {
    expect(getFileUrl("")).toBe(FALLBACK);
  });

  it("returns full file URL when key has a value", () => {
    expect(getFileUrl("abc123")).toBe(API_FILE_URL + "abc123");
  });
});
