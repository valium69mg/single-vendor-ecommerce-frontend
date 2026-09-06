import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as api from "@/api/api";
import type { Address } from "@/api/api";
import AddressesPage from "./AddressesPage";

vi.mock("@/api/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/api")>();
  return {
    ...actual,
    listAddresses: vi.fn(),
    deleteAddress: vi.fn(),
    setDefaultAddress: vi.fn(),
  };
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
vi.mock("@/components/account/AddressForm", () => ({
  default: () => <div>ADDRESS FORM</div>,
}));

function addr(overrides: Partial<Address>): Address {
  return {
    addressId: 1,
    recipientName: "Ana García",
    street: "Av. Reforma",
    exteriorNumber: "123",
    interiorNumber: null,
    neighborhood: "Centro",
    postalCode: "01000",
    city: "Ciudad de México",
    state: "CDMX",
    municipality: "Cuauhtémoc",
    phone: "5551234567",
    referenceNotes: null,
    isDefault: false,
    cpVerified: true,
    coloniaVerified: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const DEFAULT_ADDR = addr({ addressId: 1, street: "Calle Uno", isDefault: true });
const OTHER_ADDR = addr({ addressId: 2, street: "Calle Dos", isDefault: false });

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AddressesPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.listAddresses).mockResolvedValue([DEFAULT_ADDR, OTHER_ADDR]);
  vi.mocked(api.deleteAddress).mockResolvedValue(undefined);
  vi.mocked(api.setDefaultAddress).mockResolvedValue({ status: 200, message: "ok" });
});

describe("AddressesPage", () => {
  it("lists every address from the query", async () => {
    renderPage();
    expect(await screen.findByText("Calle Uno 123")).toBeInTheDocument();
    expect(screen.getByText("Calle Dos 123")).toBeInTheDocument();
  });

  it("shows the 'Predeterminada' badge only on the default address", async () => {
    renderPage();
    await screen.findByText("Calle Uno 123");
    const badges = screen.getAllByText("Predeterminada");
    expect(badges).toHaveLength(1);
    const defaultCard = screen.getByText("Calle Uno 123").closest("article")!;
    expect(within(defaultCard).getByText("Predeterminada")).toBeInTheDocument();
  });

  it("opens the address form in a modal when Editar is clicked", async () => {
    renderPage();
    await screen.findByText("Calle Uno 123");
    fireEvent.click(screen.getAllByRole("button", { name: "Editar" })[0]);
    expect(await screen.findByText("ADDRESS FORM")).toBeInTheDocument();
  });

  it("calls deleteAddress for the chosen row after confirmation", async () => {
    renderPage();
    await screen.findByText("Calle Uno 123");

    const otherCard = screen.getByText("Calle Dos 123").closest("article")!;
    fireEvent.click(within(otherCard).getByRole("button", { name: /eliminar/i }));

    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(api.deleteAddress).toHaveBeenCalledTimes(1));
    expect(api.deleteAddress).toHaveBeenCalledWith(2, "test-token");
  });

  it("calls setDefaultAddress when 'Marcar como predeterminada' is clicked on a non-default row", async () => {
    renderPage();
    await screen.findByText("Calle Dos 123");

    fireEvent.click(
      screen.getByRole("button", { name: "Marcar como predeterminada" }),
    );

    await waitFor(() => expect(api.setDefaultAddress).toHaveBeenCalledTimes(1));
    expect(api.setDefaultAddress).toHaveBeenCalledWith(2, "test-token");
  });
});
