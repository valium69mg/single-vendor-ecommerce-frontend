import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as api from "@/api/api";
import ProfilePage from "./ProfilePage";

vi.mock("@/api/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/api")>();
  return { ...actual, getMe: vi.fn(), updateMe: vi.fn() };
});
vi.mock("@/hooks/useUser", () => ({
  useUser: () => ({ user: { token: "test-token" }, setUser: vi.fn(), logout: vi.fn() }),
}));
vi.mock("@/hooks/useApiErrorHandler", () => ({
  useApiErrorHandler: () => ({ throwOnError: vi.fn(), handleError: vi.fn() }),
}));
vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}));
vi.mock("@/components/account/ProfilePhotoWidget", () => ({ default: () => null }));

const PROFILE = {
  firstName: "Ana",
  paternalLastName: "García",
  maternalLastName: "López",
  phone: "5551234567",
  email: "ana@test.com",
  username: "ana",
  profileImageUrl: null,
  profileImageThumbnailUrl: null,
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ProfilePage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getMe).mockResolvedValue(PROFILE);
  vi.mocked(api.updateMe).mockResolvedValue({ status: 200, message: "ok" });
});

describe("ProfilePage", () => {
  it("renders the 3 name fields and phone from the fetched profile", async () => {
    renderPage();
    expect(await screen.findByDisplayValue("Ana")).toBeInTheDocument();
    expect(screen.getByDisplayValue("García")).toBeInTheDocument();
    expect(screen.getByDisplayValue("López")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5551234567")).toBeInTheDocument();
  });

  it("renders email and username as disabled read-only inputs", async () => {
    renderPage();
    const email = (await screen.findByLabelText("Correo electrónico")) as HTMLInputElement;
    const username = screen.getByLabelText("Usuario") as HTMLInputElement;
    expect(email).toBeDisabled();
    expect(email.value).toBe("ana@test.com");
    expect(username).toBeDisabled();
    expect(username.value).toBe("ana");
  });

  it("submits only name and phone keys to updateMe", async () => {
    renderPage();
    await screen.findByDisplayValue("Ana");

    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(api.updateMe).toHaveBeenCalledTimes(1));
    const [payload, token] = vi.mocked(api.updateMe).mock.calls[0];
    expect(token).toBe("test-token");
    expect(Object.keys(payload).sort()).toEqual([
      "firstName",
      "maternalLastName",
      "paternalLastName",
      "phone",
    ]);
    expect(payload).toMatchObject({
      firstName: "Ana",
      paternalLastName: "García",
      maternalLastName: "López",
      phone: "5551234567",
    });
  });
});
