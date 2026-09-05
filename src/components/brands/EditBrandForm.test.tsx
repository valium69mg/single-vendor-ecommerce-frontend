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
  return {
    ...actual,
    getAdminBrand: vi.fn(),
    editBrand: vi.fn(),
    restoreBrand: vi.fn(),
  };
});

import { useUser } from "@/hooks/useUser";
import * as api from "@/api/api";
import EditBrandForm from "./EditBrandForm";

const BRAND_ID = 7;
const onClose = vi.fn();

const submitButton = () => screen.getByRole("button", { name: /Editar/ });

function renderForm() {
  const queryClient = createTestQueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const utils = renderWithProviders(
    <EditBrandForm brandId={BRAND_ID} onClose={onClose} />,
    { queryClient },
  );
  return { ...utils, invalidateSpy };
}

async function renderLoaded() {
  const utils = renderForm();
  await screen.findByDisplayValue("Silver");
  return utils;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useUser).mockReturnValue(makeUseUserValue());
  vi.mocked(api.getAdminBrand).mockResolvedValue({
    brandId: BRAND_ID,
    name: "Silver",
    slug: "silver",
  });
  vi.mocked(api.editBrand).mockResolvedValue({
    status: 200,
    message: "Marca actualizada con éxito",
  });
});

describe("EditBrandForm — load state", () => {
  it("shows the Loader while the brand query is pending and no form fields", () => {
    vi.mocked(api.getAdminBrand).mockReturnValue(new Promise(() => {}));
    renderForm();

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument();
  });

  it("pre-fills the name field from getAdminBrand once loaded", async () => {
    await renderLoaded();
    expect(screen.getByLabelText("Nombre")).toHaveValue("Silver");
  });
});

describe("EditBrandForm — validation (S1, S2)", () => {
  it("S1: empty name shows the min(1) 'required' Spanish message, editBrand not called", async () => {
    await renderLoaded();

    fillName("");
    submitForm();

    expect(
      await screen.findByText("Este campo es obligatorio"),
    ).toBeInTheDocument();
    expect(api.editBrand).not.toHaveBeenCalled();
  });

  it("S2: fixing the name clears the message and allows submit", async () => {
    await renderLoaded();

    fillName("");
    submitForm();
    expect(
      await screen.findByText("Este campo es obligatorio"),
    ).toBeInTheDocument();

    fillName("Platinum");
    submitForm();

    await waitFor(() => expect(api.editBrand).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByText("Este campo es obligatorio"),
    ).not.toBeInTheDocument();
  });
});

describe("EditBrandForm — payload (S3)", () => {
  it("S3: calls editBrand with { data: { name }, brandId, token }", async () => {
    await renderLoaded();

    fillName("Platinum");
    submitForm();

    await waitFor(() => expect(api.editBrand).toHaveBeenCalled());
    expect(vi.mocked(api.editBrand).mock.calls[0][0]).toEqual({
      data: { name: "Platinum" },
      brandId: BRAND_ID,
      token: adminUser.token,
    });
  });
});

describe("EditBrandForm — success (S4)", () => {
  it("S4: toast + invalidate admin/brands and admin/brand/:id + onClose", async () => {
    const { invalidateSpy } = await renderLoaded();

    fillName("Platinum");
    submitForm();

    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith(
        "Marca actualizada con éxito",
      ),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["admin", "brands"],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["admin", "brand", BRAND_ID],
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("EditBrandForm — API error (S5)", () => {
  it("S5: inline localized <p> error, onClose not called", async () => {
    vi.mocked(api.editBrand).mockRejectedValue(
      new Error("brandNotEditedSuccessfully"),
    );
    await renderLoaded();

    fillName("Platinum");
    submitForm();

    expect(
      await screen.findByText("No fue posible editar la marca"),
    ).toBeInTheDocument();
    expect(toastMock.error).toHaveBeenCalledWith("No fue posible editar la marca");
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("EditBrandForm — in-flight lock (S6)", () => {
  it("S6: submit disabled + Spinner until settle", async () => {
    let resolve!: (value: StandardResponse) => void;
    vi.mocked(api.editBrand).mockImplementation(
      () => new Promise((r) => (resolve = r)),
    );
    await renderLoaded();

    fillName("Platinum");
    submitForm();

    await waitFor(() => expect(submitButton()).toBeDisabled());
    expect(submitButton().querySelector('[aria-label="Loading"]')).not.toBeNull();

    resolve({ status: 200, message: "ok" });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe("EditBrandForm — 409 conflict (S7)", () => {
  it("S7: opens RestoreBrandDialog on a conflict carrying a brandId", async () => {
    vi.mocked(api.editBrand).mockRejectedValue(
      new ApiConflictError("conflict", 0, BRAND_ID),
    );
    await renderLoaded();

    fillName("Platinum");
    submitForm();

    expect(
      await screen.findByText("Marca eliminada anteriormente"),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
