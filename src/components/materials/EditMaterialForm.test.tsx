import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { ApiConflictError } from "@/api/apiFetch";
import type { AdminMaterial, StandardResponse } from "@/api/api";
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
    getAdminMaterial: vi.fn(),
    editMaterial: vi.fn(),
    restoreMaterial: vi.fn(),
  };
});

import { useUser } from "@/hooks/useUser";
import * as api from "@/api/api";
import EditMaterialForm from "./EditMaterialForm";

const MATERIAL_ID = 4;
const onClose = vi.fn();

const submitButton = () => screen.getByRole("button", { name: /Editar/ });

const materialFixture: AdminMaterial = {
  materialId: MATERIAL_ID,
  name: "Oro",
};

function renderForm() {
  const queryClient = createTestQueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const utils = renderWithProviders(
    <EditMaterialForm materialId={MATERIAL_ID} onClose={onClose} />,
    { queryClient },
  );
  return { ...utils, invalidateSpy };
}

async function renderLoaded() {
  const utils = renderForm();
  await screen.findByDisplayValue("Oro");
  return utils;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useUser).mockReturnValue(makeUseUserValue());
  vi.mocked(api.getAdminMaterial).mockResolvedValue(materialFixture);
  vi.mocked(api.editMaterial).mockResolvedValue({
    status: 200,
    message: "Material actualizado con éxito",
  });
});

describe("EditMaterialForm — load state", () => {
  it("shows the Loader while the material query is pending and no form fields", () => {
    vi.mocked(api.getAdminMaterial).mockReturnValue(new Promise(() => {}));
    renderForm();

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument();
  });

  it("pre-fills the name field from getAdminMaterial once loaded", async () => {
    await renderLoaded();
    expect(screen.getByLabelText("Nombre")).toHaveValue("Oro");
  });
});

describe("EditMaterialForm — validation (S1, S2)", () => {
  it("S1 regression guard: a 2-char name is rejected with the min(3) message, editMaterial not called", async () => {
    // DELIBERATE ASYMMETRY: edit-material.schema uses min(3) ("validation.minLength"),
    // NOT min(1) like edit-brand / edit-category. The schema comment forbids
    // "fixing" this back to min(1). A 2-char name MUST be rejected on edit.
    await renderLoaded();

    fillName("Au");
    submitForm();

    expect(
      await screen.findByText("Debe tener al menos 3 caracteres"),
    ).toBeInTheDocument();
    expect(api.editMaterial).not.toHaveBeenCalled();
  });

  it("S2: fixing the name to >= 3 chars clears the message and allows submit", async () => {
    await renderLoaded();

    fillName("Au");
    submitForm();
    expect(
      await screen.findByText("Debe tener al menos 3 caracteres"),
    ).toBeInTheDocument();

    fillName("Plata");
    submitForm();

    await waitFor(() => expect(api.editMaterial).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByText("Debe tener al menos 3 caracteres"),
    ).not.toBeInTheDocument();
  });
});

describe("EditMaterialForm — payload (S3)", () => {
  it("S3: calls editMaterial with { data: { name }, materialId, token }", async () => {
    await renderLoaded();

    fillName("Plata");
    submitForm();

    await waitFor(() => expect(api.editMaterial).toHaveBeenCalled());
    expect(vi.mocked(api.editMaterial).mock.calls[0][0]).toEqual({
      data: { name: "Plata" },
      materialId: MATERIAL_ID,
      token: adminUser.token,
    });
  });
});

describe("EditMaterialForm — success (S4)", () => {
  it("S4: toast + invalidate admin/materials and admin/material/:id + onClose", async () => {
    const { invalidateSpy } = await renderLoaded();

    fillName("Plata");
    submitForm();

    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith(
        "Material actualizado con éxito",
      ),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["admin", "materials"],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["admin", "material", MATERIAL_ID],
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("EditMaterialForm — API error (S5)", () => {
  it("S5: inline localized <p> error, onClose not called", async () => {
    vi.mocked(api.editMaterial).mockRejectedValue(
      new Error("materialNotEditedSuccessfully"),
    );
    await renderLoaded();

    fillName("Plata");
    submitForm();

    expect(
      await screen.findByText("No fue posible editar el material"),
    ).toBeInTheDocument();
    expect(toastMock.error).toHaveBeenCalledWith(
      "No fue posible editar el material",
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("EditMaterialForm — in-flight lock (S6)", () => {
  it("S6: submit disabled + Spinner until settle", async () => {
    let resolve!: (value: StandardResponse) => void;
    vi.mocked(api.editMaterial).mockImplementation(
      () => new Promise((r) => (resolve = r)),
    );
    await renderLoaded();

    fillName("Plata");
    submitForm();

    await waitFor(() => expect(submitButton()).toBeDisabled());
    expect(submitButton().querySelector('[aria-label="Loading"]')).not.toBeNull();

    resolve({ status: 200, message: "ok" });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe("EditMaterialForm — 409 conflict (S7)", () => {
  it("S7: opens RestoreMaterialDialog on a conflict carrying a materialId", async () => {
    vi.mocked(api.editMaterial).mockRejectedValue(
      new ApiConflictError("conflict", 0, undefined, MATERIAL_ID),
    );
    await renderLoaded();

    fillName("Plata");
    submitForm();

    expect(
      await screen.findByText("Material eliminado anteriormente"),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("S7 guard: a conflict without materialId falls through to handleError, no dialog", async () => {
    vi.mocked(api.editMaterial).mockRejectedValue(
      new ApiConflictError("conflict", 0),
    );
    await renderLoaded();

    fillName("Plata");
    submitForm();

    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith(
        "No fue posible editar el material",
      ),
    );
    expect(
      screen.queryByText("Material eliminado anteriormente"),
    ).not.toBeInTheDocument();
  });
});
