import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as api from "@/api/api";
import ProfilePhotoWidget from "./ProfilePhotoWidget";

vi.mock("@/api/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/api")>();
  return { ...actual, uploadProfileImage: vi.fn() };
});

const errorToast = vi.fn();
const successToast = vi.fn();
vi.mock("@/hooks/useUser", () => ({
  useUser: () => ({ user: { token: "test-token" }, setUser: vi.fn(), logout: vi.fn() }),
}));
vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ success: successToast, error: errorToast, info: vi.fn(), warning: vi.fn() }),
}));

function baseProfile(overrides = {}) {
  return {
    firstName: "Ana",
    paternalLastName: "García",
    maternalLastName: "López",
    phone: "5551234567",
    email: "ana@test.com",
    username: "ana",
    profileImageUrl: null,
    profileImageThumbnailUrl: null,
    ...overrides,
  };
}

function renderWidget(profile = baseProfile()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ProfilePhotoWidget profile={profile} />
    </QueryClientProvider>,
  );
}

const pngFile = () =>
  new File(["binary"], "avatar.png", { type: "image/png" });

beforeEach(() => {
  vi.clearAllMocks();
  URL.createObjectURL = vi.fn(() => "blob:preview-url");
  URL.revokeObjectURL = vi.fn();
});

describe("ProfilePhotoWidget", () => {
  it("falls back to the shared placeholder when there is no stored photo", () => {
    renderWidget();
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.getAttribute("src")).toContain("landscape-placeholder");
  });

  it("shows the stored thumbnail when the profile has one", () => {
    renderWidget(baseProfile({ profileImageThumbnailUrl: "profile-images/abc_200.png" }));
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.getAttribute("src")).toContain(
      encodeURIComponent("profile-images/abc_200.png"),
    );
  });

  it("shows a local preview after a file is selected", () => {
    renderWidget();
    fireEvent.change(screen.getByLabelText("Seleccionar imagen"), {
      target: { files: [pngFile()] },
    });

    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("blob:preview-url");
  });

  it("uploads the selected File with the auth token on confirm", async () => {
    vi.mocked(api.uploadProfileImage).mockResolvedValue(
      baseProfile({ profileImageThumbnailUrl: "profile-images/new_200.png" }),
    );
    renderWidget();

    const file = pngFile();
    fireEvent.change(screen.getByLabelText("Seleccionar imagen"), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Subir foto" }));

    await waitFor(() => expect(api.uploadProfileImage).toHaveBeenCalledTimes(1));
    const [sentFile, token] = vi.mocked(api.uploadProfileImage).mock.calls[0];
    expect(sentFile).toBeInstanceOf(File);
    expect((sentFile as File).name).toBe("avatar.png");
    expect(token).toBe("test-token");
  });

  it("shows an error toast when the upload fails", async () => {
    vi.mocked(api.uploadProfileImage).mockRejectedValue(new Error("boom"));
    renderWidget();

    fireEvent.change(screen.getByLabelText("Seleccionar imagen"), {
      target: { files: [pngFile()] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Subir foto" }));

    await waitFor(() =>
      expect(errorToast).toHaveBeenCalledWith("No fue posible subir la imagen"),
    );
  });
});
