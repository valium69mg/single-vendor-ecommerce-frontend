import { describe, it, expect, vi, beforeEach } from "vitest";
import { getFileUrl, API_FILE_URL, loginRequest } from "./api";
import { API_ERRORS } from "@/constants/apiErrors";

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

function mockResponse(status: number, body?: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json:
      body !== undefined
        ? () => Promise.resolve(body)
        : () => Promise.reject(new Error("no body")),
  } as Response;
}

const creds = { email: "a@b.c", password: "secret12" };

describe("loginRequest", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("resolves the parsed LoginResponse body on 200", async () => {
    const payload = {
      userId: "u1",
      email: "a@b.c",
      name: "Ada",
      token: "jwt-123",
      role: "USER",
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, payload));

    await expect(loginRequest(creds)).resolves.toEqual(payload);
  });

  it("throws the invalid-credentials i18n key on 401", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(401, { error: "Bad creds" }));

    await expect(loginRequest(creds)).rejects.toThrow("auth.invalidCredentials");
  });

  it("throws the generic login-failure i18n key on any other non-ok status", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(500, { error: "boom" }));

    await expect(loginRequest(creds)).rejects.toThrow("auth.loginFailed");
  });

  it("throws the network-error i18n key when fetch itself rejects", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(loginRequest(creds)).rejects.toThrow("auth.networkError");
  });

  it("never emits API_ERRORS.UNAUTHORIZED (loginRequest is pre-auth)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(401, {}));

    const err = await loginRequest(creds).catch((e: Error) => e);
    expect((err as Error).message).not.toBe(API_ERRORS.UNAUTHORIZED);
  });
});
