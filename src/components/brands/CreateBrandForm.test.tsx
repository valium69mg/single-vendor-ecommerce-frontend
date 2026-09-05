import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { ApiConflictError } from "@/api/apiFetch";
import type { StandardResponse } from "@/api/api";
import {
  renderWithProviders,
  createTestQueryClient,
  adminUser,
  makeUseUserValue,
  toastMock,
  fillName,
  submitForm,
} from "@/test/adminFormHelpers";

vi.mock("@/hooks/useUser", () => ({ useUser: vi.fn() }));
vi.mock("@/hooks/useToast", () => ({ useToast: () => toastMock }));
vi.mock("@/api/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/api")>();
  return { ...actual, createBrand: vi.fn(), restoreBrand: vi.fn() };
});

import { useUser } from "@/hooks/useUser";
import * as api from "@/api/api";
import CreateBrandForm from "./CreateBrandForm";

const onClose = vi.fn();

const submitButton = () =>
  screen.getByRole("button", { name: /Crear marca/ });

function renderForm() {
  const queryClient = createTestQueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const utils = renderWithProviders(<CreateBrandForm onClose={onClose} />, {
    queryClient,
  });
  return { ...utils, invalidateSpy };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useUser).mockReturnValue(makeUseUserValue());
});

describe("CreateBrandForm — validation (S1, S2)", () => {
  it("S1: shows the min(3) Spanish message and does not call createBrand", async () => {
    renderForm();
    fillName("ab");
    submitForm();

    expect(
      await screen.findByText("Debe tener al menos 3 caracteres"),
    ).toBeInTheDocument();
    expect(api.createBrand).not.toHaveBeenCalled();
  });

  it("S2: clears the message and submits once the name becomes valid", async () => {
    vi.mocked(api.createBrand).mockResolvedValue(undefined as never);
    renderForm();

    fillName("ab");
    submitForm();
    expect(
      await screen.findByText("Debe tener al menos 3 caracteres"),
    ).toBeInTheDocument();

    fillName("Gold");
    submitForm();

    await waitFor(() => expect(api.createBrand).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByText("Debe tener al menos 3 caracteres"),
    ).not.toBeInTheDocument();
  });
});

describe("CreateBrandForm — payload (S3)", () => {
  it("S3: calls createBrand with the exact { data: { name }, token } shape", async () => {
    vi.mocked(api.createBrand).mockResolvedValue(undefined as never);
    renderForm();

    fillName("Gold");
    submitForm();

    await waitFor(() => expect(api.createBrand).toHaveBeenCalled());
    // TanStack Query v5 passes a context object as the 2nd mutationFn arg;
    // assert the exact variables shape on the first positional arg.
    expect(vi.mocked(api.createBrand).mock.calls[0][0]).toEqual({
      data: { name: "Gold" },
      token: adminUser.token,
    });
  });
});

describe("CreateBrandForm — success (S4)", () => {
  it("S4: shows the localized toast, invalidates admin/brands and calls onClose", async () => {
    vi.mocked(api.createBrand).mockResolvedValue(undefined as never);
    const { invalidateSpy } = renderForm();

    fillName("Gold");
    submitForm();

    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Marca creada con éxito"),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["admin", "brands"],
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("CreateBrandForm — API error (S5)", () => {
  it("S5: renders the inline localized <p> error and never calls onClose", async () => {
    vi.mocked(api.createBrand).mockRejectedValue(
      new Error("brandNotCreatedSuccessfully"),
    );
    renderForm();

    fillName("Gold");
    submitForm();

    expect(
      await screen.findByText("No fue posible crear la marca"),
    ).toBeInTheDocument();
    expect(toastMock.error).toHaveBeenCalledWith("No fue posible crear la marca");
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("CreateBrandForm — in-flight lock (S6)", () => {
  it("S6: disables the submit button and shows a Spinner until the mutation settles", async () => {
    let resolve!: (value: StandardResponse) => void;
    vi.mocked(api.createBrand).mockImplementation(
      () => new Promise((r) => (resolve = r)),
    );
    renderForm();

    fillName("Gold");
    submitForm();

    await waitFor(() => expect(submitButton()).toBeDisabled());
    expect(submitButton().querySelector('[aria-label="Loading"]')).not.toBeNull();

    resolve({ status: 200, message: "ok" });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe("CreateBrandForm — 409 conflict (S7)", () => {
  it("S7: opens RestoreBrandDialog when the conflict carries a defined brandId", async () => {
    vi.mocked(api.createBrand).mockRejectedValue(
      new ApiConflictError("conflict", 0, 123),
    );
    renderForm();

    fillName("Gold");
    submitForm();

    expect(
      await screen.findByText("Marca eliminada anteriormente"),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("S7 guard: a conflict without brandId falls through to handleError, no dialog", async () => {
    const conflict = new ApiConflictError("conflict", 0);
    (conflict as { brandId?: number }).brandId = undefined;
    vi.mocked(api.createBrand).mockRejectedValue(conflict);
    renderForm();

    fillName("Gold");
    submitForm();

    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith(
        "No fue posible crear la marca",
      ),
    );
    expect(
      screen.queryByText("Marca eliminada anteriormente"),
    ).not.toBeInTheDocument();
  });
});
