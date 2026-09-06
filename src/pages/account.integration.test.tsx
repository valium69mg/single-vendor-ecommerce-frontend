import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/mocks/server";
import ProfilePage from "./ProfilePage";
import AddressForm from "@/components/account/AddressForm";

vi.mock("@/hooks/useUser", () => ({
  useUser: () => ({ user: { token: "test-token" }, setUser: vi.fn(), logout: vi.fn() }),
}));
vi.mock("@/hooks/useApiErrorHandler", () => ({
  useApiErrorHandler: () => ({ throwOnError: vi.fn(), handleError: vi.fn() }),
}));
vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}));

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
  URL.createObjectURL = vi.fn(() => "blob:preview-url");
  URL.revokeObjectURL = vi.fn();
});

describe("account integration (profile + photo)", () => {
  it("renders the profile fetched from GET /api/v1/users/me", async () => {
    server.use(
      http.get("*/api/v1/users/me", () => HttpResponse.json(PROFILE)),
    );

    renderPage();

    expect(await screen.findByDisplayValue("Ana")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5551234567")).toBeInTheDocument();
  });

  it("sends the chosen image as a multipart File to POST /profile-image", async () => {
    let receivedFile: FormDataEntryValue | null = null;
    server.use(
      http.get("*/api/v1/users/me", () => HttpResponse.json(PROFILE)),
      http.post("*/api/v1/users/me/profile-image", async ({ request }) => {
        const form = await request.formData();
        receivedFile = form.get("file");
        return HttpResponse.json({
          ...PROFILE,
          profileImageUrl: "profile-images/new.png",
          profileImageThumbnailUrl: "profile-images/new_200.png",
        });
      }),
    );

    renderPage();
    await screen.findByDisplayValue("Ana");

    fireEvent.change(screen.getByLabelText("Seleccionar imagen"), {
      target: { files: [new File(["binary"], "avatar.png", { type: "image/png" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Subir foto" }));

    // undici re-wraps the multipart part in its own File realm, so a strict
    // `instanceof File` is unreliable here — assert the shape instead.
    await waitFor(() => expect(receivedFile).not.toBeNull());
    expect(Object.prototype.toString.call(receivedFile)).toBe("[object File]");
    const part = receivedFile as unknown as Blob;
    expect(part.type).toBe("image/png");
    expect(typeof part.arrayBuffer).toBe("function");
  });
});

describe("address form postal-code lookup (MSW integration)", () => {
  function renderForm() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={client}>
        <AddressForm mode="create" onClose={vi.fn()} />
      </QueryClientProvider>,
    );
  }

  it("fills and locks the geo fields when the catalog knows the postal code", async () => {
    server.use(
      http.get("*/api/v1/catalog/postal-codes/:cp", ({ params }) =>
        HttpResponse.json({
          cp: String(params.cp),
          state: "Jalisco",
          municipality: "Guadalajara",
          city: "Guadalajara",
          colonias: ["Centro", "Americana"],
        }),
      ),
    );

    renderForm();
    fireEvent.change(document.getElementById("addr-postal") as HTMLElement, {
      target: { value: "44100" },
    });

    await waitFor(
      () =>
        expect(
          (document.getElementById("addr-state") as HTMLInputElement).value,
        ).toBe("Jalisco"),
      { timeout: 2000 },
    );
    expect(document.getElementById("addr-state")).toHaveAttribute("readonly");
    expect(document.getElementById("addr-neighborhood")?.tagName).toBe("SELECT");
  });

  it("falls back to a soft warning when the catalog returns 404", async () => {
    server.use(
      http.get("*/api/v1/catalog/postal-codes/:cp", () =>
        HttpResponse.json({ status: 404, error: "postal_code_not_found" }, { status: 404 }),
      ),
    );

    renderForm();
    fireEvent.change(document.getElementById("addr-postal") as HTMLElement, {
      target: { value: "99999" },
    });

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument(), {
      timeout: 2000,
    });
    expect(document.getElementById("addr-state")).not.toHaveAttribute("readonly");
  });
});
