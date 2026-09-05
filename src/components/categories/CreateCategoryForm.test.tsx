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
  return { ...actual, createCategory: vi.fn(), restoreCategory: vi.fn() };
});

import { useUser } from "@/hooks/useUser";
import * as api from "@/api/api";
import CreateCategoryForm from "./CreateCategoryForm";

const onClose = vi.fn();

const submitButton = () =>
  screen.getByRole("button", { name: /Crear categoría/ });

function renderForm() {
  const queryClient = createTestQueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const utils = renderWithProviders(<CreateCategoryForm onClose={onClose} />, {
    queryClient,
  });
  return { ...utils, invalidateSpy };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useUser).mockReturnValue(makeUseUserValue());
});

describe("CreateCategoryForm — validation (S1, S2)", () => {
  it("S1: shows the min(3) Spanish message and does not call createCategory", async () => {
    renderForm();
    fillName("ab");
    submitForm();

    expect(
      await screen.findByText("Debe tener al menos 3 caracteres"),
    ).toBeInTheDocument();
    expect(api.createCategory).not.toHaveBeenCalled();
  });

  it("S2: clears the message and submits once the name becomes valid", async () => {
    vi.mocked(api.createCategory).mockResolvedValue(undefined as never);
    renderForm();

    fillName("ab");
    submitForm();
    expect(
      await screen.findByText("Debe tener al menos 3 caracteres"),
    ).toBeInTheDocument();

    fillName("Rings");
    submitForm();

    await waitFor(() => expect(api.createCategory).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByText("Debe tener al menos 3 caracteres"),
    ).not.toBeInTheDocument();
  });
});

describe("CreateCategoryForm — payload (S3)", () => {
  it("S3: calls createCategory with the exact { data: { name }, token } shape", async () => {
    vi.mocked(api.createCategory).mockResolvedValue(undefined as never);
    renderForm();

    fillName("Rings");
    submitForm();

    await waitFor(() => expect(api.createCategory).toHaveBeenCalled());
    // TanStack Query v5 passes a context object as the 2nd mutationFn arg;
    // assert the exact variables shape on the first positional arg.
    expect(vi.mocked(api.createCategory).mock.calls[0][0]).toEqual({
      data: { name: "Rings" },
      token: adminUser.token,
    });
  });
});

describe("CreateCategoryForm — success (S4)", () => {
  it("S4: shows the localized toast, invalidates admin/categories and calls onClose", async () => {
    vi.mocked(api.createCategory).mockResolvedValue(undefined as never);
    const { invalidateSpy } = renderForm();

    fillName("Rings");
    submitForm();

    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith(
        "Categoría creada con éxito",
      ),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["admin", "categories"],
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("CreateCategoryForm — API error (S5)", () => {
  it("S5: renders the inline localized <p> error and never calls onClose", async () => {
    vi.mocked(api.createCategory).mockRejectedValue(
      new Error("categoryNotCreatedSuccessfully"),
    );
    renderForm();

    fillName("Rings");
    submitForm();

    expect(
      await screen.findByText("No fue posible crear la categoría"),
    ).toBeInTheDocument();
    expect(toastMock.error).toHaveBeenCalledWith(
      "No fue posible crear la categoría",
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("CreateCategoryForm — in-flight lock (S6)", () => {
  it("S6: disables the submit button and shows a Spinner until the mutation settles", async () => {
    let resolve!: (value: StandardResponse) => void;
    vi.mocked(api.createCategory).mockImplementation(
      () => new Promise((r) => (resolve = r)),
    );
    renderForm();

    fillName("Rings");
    submitForm();

    await waitFor(() => expect(submitButton()).toBeDisabled());
    expect(submitButton().querySelector('[aria-label="Loading"]')).not.toBeNull();

    resolve({ status: 200, message: "ok" });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe("CreateCategoryForm — 409 conflict (S7)", () => {
  it("S7: opens RestoreCategoryDialog on an ApiConflictError carrying a categoryId", async () => {
    vi.mocked(api.createCategory).mockRejectedValue(
      new ApiConflictError("conflict", 55),
    );
    renderForm();

    fillName("Rings");
    submitForm();

    expect(
      await screen.findByText("Categoría eliminada anteriormente"),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("S7 asymmetry: opens the dialog for ANY ApiConflictError, even without a categoryId", async () => {
    // DELIBERATE: unlike CreateBrandForm / CreateMaterialForm (which guard on
    // `err.brandId !== undefined` / `err.materialId !== undefined`),
    // CreateCategoryForm's 409 handler is unguarded — it calls
    // `setConflictCategoryId(err.categoryId)` for every ApiConflictError, so the
    // Restore dialog opens even when `categoryId` is undefined. This test pins
    // that shipped behaviour; the asymmetry is not a bug to "fix" here.
    vi.mocked(api.createCategory).mockRejectedValue(
      new ApiConflictError("conflict", undefined as unknown as number),
    );
    renderForm();

    fillName("Rings");
    submitForm();

    expect(
      await screen.findByText("Categoría eliminada anteriormente"),
    ).toBeInTheDocument();
    expect(toastMock.error).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
