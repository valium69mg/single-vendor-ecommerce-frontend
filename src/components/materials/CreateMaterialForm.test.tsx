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
  return { ...actual, createMaterial: vi.fn(), restoreMaterial: vi.fn() };
});

import { useUser } from "@/hooks/useUser";
import * as api from "@/api/api";
import CreateMaterialForm from "./CreateMaterialForm";

const onClose = vi.fn();

const submitButton = () =>
  screen.getByRole("button", { name: /Crear material/ });

function renderForm() {
  const queryClient = createTestQueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const utils = renderWithProviders(<CreateMaterialForm onClose={onClose} />, {
    queryClient,
  });
  return { ...utils, invalidateSpy };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useUser).mockReturnValue(makeUseUserValue());
});

describe("CreateMaterialForm — validation (S1, S2)", () => {
  it("S1: shows the min(3) Spanish message and does not call createMaterial", async () => {
    renderForm();
    fillName("ab");
    submitForm();

    expect(
      await screen.findByText("Debe tener al menos 3 caracteres"),
    ).toBeInTheDocument();
    expect(api.createMaterial).not.toHaveBeenCalled();
  });

  it("S2: clears the message and submits once the name becomes valid", async () => {
    vi.mocked(api.createMaterial).mockResolvedValue(undefined as never);
    renderForm();

    fillName("ab");
    submitForm();
    expect(
      await screen.findByText("Debe tener al menos 3 caracteres"),
    ).toBeInTheDocument();

    fillName("Oro");
    submitForm();

    await waitFor(() => expect(api.createMaterial).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByText("Debe tener al menos 3 caracteres"),
    ).not.toBeInTheDocument();
  });
});

describe("CreateMaterialForm — payload (S3)", () => {
  it("S3: calls createMaterial with the exact { data: { name }, token } shape", async () => {
    vi.mocked(api.createMaterial).mockResolvedValue(undefined as never);
    renderForm();

    fillName("Oro");
    submitForm();

    await waitFor(() => expect(api.createMaterial).toHaveBeenCalled());
    // TanStack Query v5 passes a context object as the 2nd mutationFn arg;
    // assert the exact variables shape on the first positional arg.
    expect(vi.mocked(api.createMaterial).mock.calls[0][0]).toEqual({
      data: { name: "Oro" },
      token: adminUser.token,
    });
  });
});

describe("CreateMaterialForm — success (S4)", () => {
  it("S4: shows the localized toast, invalidates admin/materials and calls onClose", async () => {
    vi.mocked(api.createMaterial).mockResolvedValue(undefined as never);
    const { invalidateSpy } = renderForm();

    fillName("Oro");
    submitForm();

    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith(
        "Material creado con éxito",
      ),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["admin", "materials"],
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("CreateMaterialForm — API error (S5)", () => {
  it("S5: renders the inline localized <p> error and never calls onClose", async () => {
    vi.mocked(api.createMaterial).mockRejectedValue(
      new Error("materialNotCreatedSuccessfully"),
    );
    renderForm();

    fillName("Oro");
    submitForm();

    expect(
      await screen.findByText("No fue posible crear el material"),
    ).toBeInTheDocument();
    expect(toastMock.error).toHaveBeenCalledWith(
      "No fue posible crear el material",
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("CreateMaterialForm — in-flight lock (S6)", () => {
  it("S6: disables the submit button and shows a Spinner until the mutation settles", async () => {
    let resolve!: (value: StandardResponse) => void;
    vi.mocked(api.createMaterial).mockImplementation(
      () => new Promise((r) => (resolve = r)),
    );
    renderForm();

    fillName("Oro");
    submitForm();

    await waitFor(() => expect(submitButton()).toBeDisabled());
    expect(submitButton().querySelector('[aria-label="Loading"]')).not.toBeNull();

    resolve({ status: 200, message: "ok" });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe("CreateMaterialForm — 409 conflict (S7)", () => {
  it("S7: opens RestoreMaterialDialog when the conflict carries a defined materialId", async () => {
    // ApiConflictError(message, categoryId, brandId?, materialId?, body?)
    vi.mocked(api.createMaterial).mockRejectedValue(
      new ApiConflictError("conflict", 0, undefined, 123),
    );
    renderForm();

    fillName("Oro");
    submitForm();

    expect(
      await screen.findByText("Material eliminado anteriormente"),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("S7 guard: a conflict without materialId falls through to handleError, no dialog", async () => {
    // DELIBERATE: like CreateBrandForm (and unlike CreateCategoryForm), the 409
    // handler guards `err instanceof ApiConflictError && err.materialId !== undefined`
    // before opening the Restore dialog. A conflict with no materialId must fall
    // through to handleError. Pin the guard; do not "harmonize" with category.
    const conflict = new ApiConflictError("conflict", 0);
    vi.mocked(api.createMaterial).mockRejectedValue(conflict);
    renderForm();

    fillName("Oro");
    submitForm();

    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith(
        "No fue posible crear el material",
      ),
    );
    expect(
      screen.queryByText("Material eliminado anteriormente"),
    ).not.toBeInTheDocument();
  });
});
