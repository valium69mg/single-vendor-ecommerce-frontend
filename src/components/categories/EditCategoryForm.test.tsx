import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { ApiConflictError } from "@/api/apiFetch";
import type { Category, StandardResponse } from "@/api/api";
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
  return {
    ...actual,
    getAdminCategory: vi.fn(),
    editCategory: vi.fn(),
    restoreCategory: vi.fn(),
  };
});

import { useUser } from "@/hooks/useUser";
import * as api from "@/api/api";
import EditCategoryForm from "./EditCategoryForm";

const CATEGORY_ID = 4;
const onClose = vi.fn();

const submitButton = () => screen.getByRole("button", { name: /Editar/ });

const categoryFixture = {
  categoryId: CATEGORY_ID,
  name: "Rings",
  products: 0,
  unitsSold: 0,
  revenue: 0,
  averagePrice: 0,
  stock: 0,
  imageUrl: null,
  mediumThumbnailUrl: null,
  smallThumbnailUrl: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
} satisfies Category;

function renderForm() {
  const queryClient = createTestQueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const utils = renderWithProviders(
    <EditCategoryForm categoryId={CATEGORY_ID} onClose={onClose} />,
    { queryClient },
  );
  return { ...utils, invalidateSpy };
}

async function renderLoaded() {
  const utils = renderForm();
  await screen.findByDisplayValue("Rings");
  return utils;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useUser).mockReturnValue(makeUseUserValue());
  vi.mocked(api.getAdminCategory).mockResolvedValue(categoryFixture);
  vi.mocked(api.editCategory).mockResolvedValue({
    status: 200,
    message: "Categoría actualizada con éxito",
  });
});

describe("EditCategoryForm — load state", () => {
  it("shows the Loader while the category query is pending and no form fields", () => {
    vi.mocked(api.getAdminCategory).mockReturnValue(new Promise(() => {}));
    renderForm();

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument();
  });

  it("pre-fills the name field from getAdminCategory once loaded", async () => {
    await renderLoaded();
    expect(screen.getByLabelText("Nombre")).toHaveValue("Rings");
  });
});

describe("EditCategoryForm — validation (S1, S2)", () => {
  it("S1: empty name shows the min(1) 'required' Spanish message, editCategory not called", async () => {
    // DELIBERATE ASYMMETRY: edit-category.schema uses min(1) ("validation.required")
    // while create-category.schema uses min(3) ("validation.minLength"). Pin it,
    // do not "fix" it.
    await renderLoaded();

    fillName("");
    submitForm();

    expect(
      await screen.findByText("Este campo es obligatorio"),
    ).toBeInTheDocument();
    expect(api.editCategory).not.toHaveBeenCalled();
  });

  it("S2: fixing the name clears the message and allows submit", async () => {
    await renderLoaded();

    fillName("");
    submitForm();
    expect(
      await screen.findByText("Este campo es obligatorio"),
    ).toBeInTheDocument();

    fillName("Necklaces");
    submitForm();

    await waitFor(() => expect(api.editCategory).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByText("Este campo es obligatorio"),
    ).not.toBeInTheDocument();
  });
});

describe("EditCategoryForm — payload (S3)", () => {
  it("S3: calls editCategory with { data: { name }, categoryId, token }", async () => {
    await renderLoaded();

    fillName("Necklaces");
    submitForm();

    await waitFor(() => expect(api.editCategory).toHaveBeenCalled());
    expect(vi.mocked(api.editCategory).mock.calls[0][0]).toEqual({
      data: { name: "Necklaces" },
      categoryId: CATEGORY_ID,
      token: adminUser.token,
    });
  });
});

describe("EditCategoryForm — success (S4)", () => {
  it("S4: toast + invalidate admin/categories and admin/category/:id + onClose", async () => {
    const { invalidateSpy } = await renderLoaded();

    fillName("Necklaces");
    submitForm();

    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith(
        "Categoría actualizada con éxito",
      ),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["admin", "categories"],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["admin", "category", CATEGORY_ID],
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("EditCategoryForm — API error (S5)", () => {
  it("S5: inline localized <p> error, onClose not called", async () => {
    vi.mocked(api.editCategory).mockRejectedValue(
      new Error("categoryNotEditedSuccessfully"),
    );
    await renderLoaded();

    fillName("Necklaces");
    submitForm();

    expect(
      await screen.findByText("No fue posible editar la categoría"),
    ).toBeInTheDocument();
    expect(toastMock.error).toHaveBeenCalledWith(
      "No fue posible editar la categoría",
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("EditCategoryForm — in-flight lock (S6)", () => {
  it("S6: submit disabled + Spinner until settle", async () => {
    let resolve!: (value: StandardResponse) => void;
    vi.mocked(api.editCategory).mockImplementation(
      () => new Promise((r) => (resolve = r)),
    );
    await renderLoaded();

    fillName("Necklaces");
    submitForm();

    await waitFor(() => expect(submitButton()).toBeDisabled());
    expect(submitButton().querySelector('[aria-label="Loading"]')).not.toBeNull();

    resolve({ status: 200, message: "ok" });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe("EditCategoryForm — 409 conflict (S7)", () => {
  it("S7: opens RestoreCategoryDialog on a conflict carrying a categoryId", async () => {
    vi.mocked(api.editCategory).mockRejectedValue(
      new ApiConflictError("conflict", CATEGORY_ID),
    );
    await renderLoaded();

    fillName("Necklaces");
    submitForm();

    expect(
      await screen.findByText("Categoría eliminada anteriormente"),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
