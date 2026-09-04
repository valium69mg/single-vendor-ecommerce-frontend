import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getFileUrl,
  API_FILE_URL,
  loginRequest,
  registerRequest,
  verifyRequest,
  resendCodeRequest,
} from "./api";
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

  it("percent-encodes a key containing reserved characters (F10)", () => {
    const key = "a b&c=d#x+y";
    const url = getFileUrl(key);

    expect(url).toBe(API_FILE_URL + encodeURIComponent(key));

    const queryPart = url.slice(API_FILE_URL.length);
    expect(queryPart).not.toMatch(/[ &#=+]/);
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

  it("rejects with the generic login-failure i18n key when the 200 body is not JSON (F11)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200));

    const err = await loginRequest(creds).catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe("auth.loginFailed");
    expect((err as Error).name).not.toBe("SyntaxError");
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

describe("registerRequest", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("posts to /users/register and resolves on 200", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, {}));

    await expect(registerRequest(creds)).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/users/register"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      }),
    );
  });

  it("resolves on 201 as well (created)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(201, {}));

    await expect(registerRequest(creds)).resolves.toBeUndefined();
  });

  it("throws the duplicate-email i18n key on 400", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(400, { error: "El email ya está registrado" }),
    );

    await expect(registerRequest(creds)).rejects.toThrow(
      "auth.register.emailExists",
    );
  });

  it("throws the generic register-failure i18n key on any other non-ok status", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(500, { error: "boom" }));

    await expect(registerRequest(creds)).rejects.toThrow(
      "auth.register.failed",
    );
  });

  it("throws the network-error i18n key when fetch itself rejects", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(registerRequest(creds)).rejects.toThrow("auth.networkError");
  });

  it("never emits API_ERRORS.UNAUTHORIZED (registerRequest is pre-auth)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(401, {}));

    const err = await registerRequest(creds).catch((e: Error) => e);
    expect((err as Error).message).not.toBe(API_ERRORS.UNAUTHORIZED);
  });
});

const verifyPayload = { email: "a@b.c", code: "123456" };

describe("verifyRequest", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("posts to /users/verify and resolves on 200", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, {}));

    await expect(verifyRequest(verifyPayload)).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/users/verify"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verifyPayload),
      }),
    );
  });

  it("maps errorCode verification_code_invalid (400) to auth.verify.codeRejected", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(400, { error: "verification_code_invalid" }),
    );

    await expect(verifyRequest(verifyPayload)).rejects.toThrow(
      "auth.verify.codeRejected",
    );
  });

  it("maps errorCode verification_code_attempts_exceeded (400) to auth.verify.attemptsExceeded — distinct from wrong code despite same HTTP status", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(400, { error: "verification_code_attempts_exceeded" }),
    );

    await expect(verifyRequest(verifyPayload)).rejects.toThrow(
      "auth.verify.attemptsExceeded",
    );
  });

  it("maps errorCode verification_code_expired (410) to auth.verify.codeExpired", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(410, { error: "verification_code_expired" }),
    );

    await expect(verifyRequest(verifyPayload)).rejects.toThrow(
      "auth.verify.codeExpired",
    );
  });

  it("maps errorCode verification_code_rate_limited (429) to auth.verify.tooManyCodes", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(429, { error: "verification_code_rate_limited" }),
    );

    await expect(verifyRequest(verifyPayload)).rejects.toThrow(
      "auth.verify.tooManyCodes",
    );
  });

  it("maps errorCode account_already_verified (409) to auth.verify.alreadyVerified", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(409, { error: "account_already_verified" }),
    );

    await expect(verifyRequest(verifyPayload)).rejects.toThrow(
      "auth.verify.alreadyVerified",
    );
  });

  it("falls back to HTTP-status mapping when the body has no errorCode (410)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(410, {}));

    await expect(verifyRequest(verifyPayload)).rejects.toThrow(
      "auth.verify.codeExpired",
    );
  });

  it("falls back to HTTP-status mapping when the body has no errorCode (429)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(429, {}));

    await expect(verifyRequest(verifyPayload)).rejects.toThrow(
      "auth.verify.tooManyCodes",
    );
  });

  it("falls back to HTTP-status mapping when the body has no errorCode (409)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(409, {}));

    await expect(verifyRequest(verifyPayload)).rejects.toThrow(
      "auth.verify.alreadyVerified",
    );
  });

  it("falls back to HTTP-status mapping when the body has no errorCode (400)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(400, {}));

    await expect(verifyRequest(verifyPayload)).rejects.toThrow(
      "auth.verify.codeRejected",
    );
  });

  it("falls back to status mapping when the body carries an unrecognized errorCode", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(410, { error: "some_future_backend_key" }),
    );

    await expect(verifyRequest(verifyPayload)).rejects.toThrow(
      "auth.verify.codeExpired",
    );
  });

  it("falls back to the generic failure key on an unrecognized non-ok status", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(500, { error: "boom" }));

    await expect(verifyRequest(verifyPayload)).rejects.toThrow(
      "auth.verify.failed",
    );
  });

  it("falls back to status mapping when the error body is not valid JSON", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(410));

    await expect(verifyRequest(verifyPayload)).rejects.toThrow(
      "auth.verify.codeExpired",
    );
  });

  it("throws the network-error i18n key when fetch itself rejects", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(verifyRequest(verifyPayload)).rejects.toThrow(
      "auth.networkError",
    );
  });

  it("never emits API_ERRORS.UNAUTHORIZED on 401 (verifyRequest is pre-auth-adjacent)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(401, {}));

    const err = await verifyRequest(verifyPayload).catch((e: Error) => e);
    expect((err as Error).message).not.toBe(API_ERRORS.UNAUTHORIZED);
  });

  it("never emits API_ERRORS.UNAUTHORIZED on 429 (no global logout on rate limit)", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(429, { error: "verification_code_rate_limited" }),
    );

    const err = await verifyRequest(verifyPayload).catch((e: Error) => e);
    expect((err as Error).message).not.toBe(API_ERRORS.UNAUTHORIZED);
  });
});

describe("resendCodeRequest", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("posts to /users/verify/resend and resolves on 200", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, {}));

    await expect(
      resendCodeRequest({ email: verifyPayload.email }),
    ).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/users/verify/resend"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyPayload.email }),
      }),
    );
  });

  it("resolves on 200 for an unknown email too (anti-enumeration, indistinguishable from success)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, {}));

    await expect(
      resendCodeRequest({ email: "unknown@b.c" }),
    ).resolves.toBeUndefined();
  });

  it("maps errorCode verification_code_rate_limited (429) to auth.verify.tooManyCodes", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(429, { error: "verification_code_rate_limited" }),
    );

    await expect(
      resendCodeRequest({ email: verifyPayload.email }),
    ).rejects.toThrow("auth.verify.tooManyCodes");
  });

  it("maps errorCode account_already_verified (409) to auth.verify.alreadyVerified", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(409, { error: "account_already_verified" }),
    );

    await expect(
      resendCodeRequest({ email: verifyPayload.email }),
    ).rejects.toThrow("auth.verify.alreadyVerified");
  });

  it("falls back to HTTP-status mapping when the body has no errorCode (429)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(429, {}));

    await expect(
      resendCodeRequest({ email: verifyPayload.email }),
    ).rejects.toThrow("auth.verify.tooManyCodes");
  });

  it("falls back to HTTP-status mapping when the body has no errorCode (409)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(409, {}));

    await expect(
      resendCodeRequest({ email: verifyPayload.email }),
    ).rejects.toThrow("auth.verify.alreadyVerified");
  });

  it("falls back to the generic resend-failure key on an unrecognized non-ok status", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(500, { error: "boom" }));

    await expect(
      resendCodeRequest({ email: verifyPayload.email }),
    ).rejects.toThrow("auth.verify.resendFailed");
  });

  it("falls back to status mapping when the error body is not valid JSON", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(429));

    await expect(
      resendCodeRequest({ email: verifyPayload.email }),
    ).rejects.toThrow("auth.verify.tooManyCodes");
  });

  it("throws the network-error i18n key when fetch itself rejects", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(
      resendCodeRequest({ email: verifyPayload.email }),
    ).rejects.toThrow("auth.networkError");
  });

  it("never emits API_ERRORS.UNAUTHORIZED on 401 (resendCodeRequest is pre-auth-adjacent)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(401, {}));

    const err = await resendCodeRequest({ email: verifyPayload.email }).catch(
      (e: Error) => e,
    );
    expect((err as Error).message).not.toBe(API_ERRORS.UNAUTHORIZED);
  });

  it("never emits API_ERRORS.UNAUTHORIZED on 429 (no global logout on rate limit)", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(429, { error: "verification_code_rate_limited" }),
    );

    const err = await resendCodeRequest({ email: verifyPayload.email }).catch(
      (e: Error) => e,
    );
    expect((err as Error).message).not.toBe(API_ERRORS.UNAUTHORIZED);
  });
});
