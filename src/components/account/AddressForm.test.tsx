import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as api from "@/api/api";
import { ApiError } from "@/api/apiFetch";
import AddressForm from "./AddressForm";

vi.mock("@/api/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/api")>();
  return {
    ...actual,
    createAddress: vi.fn(),
    updateAddress: vi.fn(),
    lookupPostalCode: vi.fn(),
  };
});
vi.mock("@/hooks/useUser", () => ({
  useUser: () => ({ user: { token: "test-token" }, setUser: vi.fn(), logout: vi.fn() }),
}));
vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}));

const EXPECTED_ORDER = [
  "addr-street",
  "addr-exterior",
  "addr-interior",
  "addr-recipient",
  "addr-phone",
  "addr-postal",
  "addr-state",
  "addr-municipality",
  "addr-city",
  "addr-neighborhood",
  "addr-reference",
];

function renderForm() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onClose = vi.fn();
  const utils = render(
    <QueryClientProvider client={client}>
      <AddressForm mode="create" onClose={onClose} />
    </QueryClientProvider>,
  );
  return { ...utils, onClose };
}

function ids(container: HTMLElement): string[] {
  return [...container.querySelectorAll("input, select")]
    .map((el) => el.id)
    .filter(Boolean);
}

function setValue(id: string, value: string) {
  fireEvent.change(document.getElementById(id) as HTMLElement, {
    target: { value },
  });
}

function fillRequired() {
  setValue("addr-street", "Av. Reforma");
  setValue("addr-exterior", "123");
  setValue("addr-recipient", "Ana García");
  setValue("addr-phone", "5551234567");
  setValue("addr-state", "CDMX");
  setValue("addr-municipality", "Cuauhtémoc");
  setValue("addr-neighborhood", "Centro");
}

async function flush() {
  await act(async () => {
    await vi.runAllTimersAsync();
  });
}

async function typePostalCode(cp: string) {
  setValue("addr-postal", cp);
  await flush();
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AddressForm field order", () => {
  it("renders the locked id sequence with referencias last and postal before estado", () => {
    const { container } = renderForm();
    const sequence = ids(container);
    expect(sequence).toEqual(EXPECTED_ORDER);
    expect(sequence.at(-1)).toBe("addr-reference");
    expect(sequence.indexOf("addr-postal")).toBeLessThan(
      sequence.indexOf("addr-state"),
    );
  });
});

describe("AddressForm postal-code lookup", () => {
  it("fills and locks geo fields and loads the colonia select on a catalog hit", async () => {
    vi.mocked(api.lookupPostalCode).mockResolvedValue({
      cp: "01000",
      state: "CDMX",
      municipality: "Álvaro Obregón",
      city: "Ciudad de México",
      colonias: ["Centro", "Roma"],
    });

    renderForm();
    await typePostalCode("01000");

    expect(
      (document.getElementById("addr-state") as HTMLInputElement).value,
    ).toBe("CDMX");
    expect(api.lookupPostalCode).toHaveBeenCalledWith("01000");
    expect(api.lookupPostalCode).toHaveBeenCalledTimes(1);

    const state = document.getElementById("addr-state") as HTMLInputElement;
    expect(state).toHaveAttribute("readonly");

    const colonia = document.getElementById("addr-neighborhood");
    expect(colonia?.tagName).toBe("SELECT");
    expect(screen.getByRole("option", { name: "Centro" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Roma" })).toBeInTheDocument();
  });

  it("shows a soft warning and still submits on a 404 catalog miss", async () => {
    vi.mocked(api.lookupPostalCode).mockRejectedValue(
      new ApiError("not found", 404, {}),
    );
    vi.mocked(api.createAddress).mockResolvedValue({ status: 201, message: "ok" });

    renderForm();
    fillRequired();
    await typePostalCode("99999");

    expect(screen.getByRole("alert")).toBeInTheDocument();
    const state = document.getElementById("addr-state") as HTMLInputElement;
    expect(state).not.toHaveAttribute("readonly");

    fireEvent.click(screen.getByRole("button", { name: "Guardar dirección" }));
    await flush();

    expect(api.createAddress).toHaveBeenCalledTimes(1);
    const [input] = vi.mocked(api.createAddress).mock.calls[0];
    expect(input.postalCode).toBe("99999");
    expect(input.state).toBe("CDMX");
  });

  it("submits the free-text value as neighborhood when 'Otra' is chosen", async () => {
    vi.mocked(api.lookupPostalCode).mockResolvedValue({
      cp: "01000",
      state: "CDMX",
      municipality: "Álvaro Obregón",
      city: "Ciudad de México",
      colonias: ["Centro", "Roma"],
    });
    vi.mocked(api.createAddress).mockResolvedValue({ status: 201, message: "ok" });

    renderForm();
    fillRequired();
    await typePostalCode("01000");
    expect(document.getElementById("addr-neighborhood")?.tagName).toBe("SELECT");

    fireEvent.change(document.getElementById("addr-neighborhood") as HTMLElement, {
      target: { value: "__other__" },
    });
    const other = screen.getByLabelText("Escribe tu colonia");
    fireEvent.change(other, { target: { value: "Mi Colonia Rara" } });

    fireEvent.click(screen.getByRole("button", { name: "Guardar dirección" }));
    await flush();

    expect(api.createAddress).toHaveBeenCalledTimes(1);
    const [input] = vi.mocked(api.createAddress).mock.calls[0];
    expect(input.neighborhood).toBe("Mi Colonia Rara");
  });
});
