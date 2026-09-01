import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadProductImage, uploadCategoryImage, API_BASE_URL } from "./api";

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

function lastCall() {
  const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
  return { url, init };
}

const OK = { status: 200, message: "uploaded" };

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

function file() {
  return new File(["binary"], "photo.png", { type: "image/png" });
}

describe("uploadProductImage", () => {
  it("POSTs a FormData body with the real 'file' part and a Bearer token", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, OK));

    await expect(uploadProductImage("p1", file(), "t")).resolves.toEqual(OK);

    const { url, init } = lastCall();
    expect(url).toBe(`${API_BASE_URL}/admin/products/p1/image`);
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("file")).toBeInstanceOf(File);
    expect(init.headers).toMatchObject({ Authorization: "Bearer t" });
  });

  it("does not set a Content-Type header (browser sets the multipart boundary)", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, OK));

    await uploadProductImage("p1", file(), "t");

    const { init } = lastCall();
    expect(init.headers).not.toHaveProperty("Content-Type");
  });
});

describe("uploadCategoryImage", () => {
  it("POSTs to the category image path derived from categoryId", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, OK));

    await uploadCategoryImage({ categoryId: 9, file: file(), token: "t" });

    const { url, init } = lastCall();
    expect(url).toBe(`${API_BASE_URL}/admin/products/categories/9/image`);
    expect(init.method).toBe("POST");
  });

  it("sends a FormData body with the 'file' part and no Content-Type header", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, OK));

    await uploadCategoryImage({ categoryId: 9, file: file(), token: "t" });

    const { init } = lastCall();
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("file")).toBeInstanceOf(File);
    expect(init.headers).not.toHaveProperty("Content-Type");
    expect(init.headers).toMatchObject({ Authorization: "Bearer t" });
  });

  it("resolves the StandardResponse body", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, OK));

    await expect(
      uploadCategoryImage({ categoryId: 9, file: file(), token: "t" }),
    ).resolves.toEqual(OK);
  });
});
