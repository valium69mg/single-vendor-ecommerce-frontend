import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { PageResponse, StandardResponse } from "@/api/api";
import {
  renderWithProviders,
  createTestQueryClient,
  adminUser,
  makeUseUserValue,
  toastMock,
  stubBrowserGlobals,
} from "@/test/adminFormHelpers";

vi.mock("@/hooks/useUser", () => ({ useUser: vi.fn() }));
vi.mock("@/hooks/useToast", () => ({ useToast: () => toastMock }));
vi.mock("@/api/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/api")>();
  return {
    ...actual,
    createProduct: vi.fn(),
    uploadProductImage: vi.fn(),
    getAdminProducts: vi.fn(),
    getAdminBrands: vi.fn(),
    getAdminCategories: vi.fn(),
    getAdminMaterials: vi.fn(),
    getAdminAttributesPage: vi.fn(),
  };
});

import { useUser } from "@/hooks/useUser";
import * as api from "@/api/api";
import CreateProductForm from "./CreateProductForm";

const onClose = vi.fn();

function emptyPage<T>(): PageResponse<T> {
  return { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, last: true };
}

/** Query a raw form control by its RHF `name` (FieldWrap does not link labels). */
function field(name: string): HTMLInputElement {
  const el = document.querySelector(`[name="${name}"]`);
  if (!el) throw new Error(`no field named "${name}" in the DOM`);
  return el as HTMLInputElement;
}

const onStep1 = () => document.querySelector('[name="name"]') !== null;
// GenericButton injects a <Spinner aria-label="Loading"> while pending, which
// mutates the button's accessible name — match the label loosely.
const onStep3 = () =>
  screen.queryByRole("button", { name: /Crear producto/ }) !== null;

const nextButton = () => screen.getByRole("button", { name: "Siguiente" });
const backButton = () => screen.getByRole("button", { name: "Volver" });
const submitButton = () =>
  screen.getByRole("button", { name: /Crear producto/ });

function renderForm() {
  const queryClient = createTestQueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const utils = renderWithProviders(<CreateProductForm onClose={onClose} />, {
    queryClient,
  });
  return { ...utils, invalidateSpy };
}

/**
 * The two optional numeric variant fields (`discountPrice`, `weightGrams`)
 * register with `setValueAs`. RHF does NOT run that transform against the
 * untouched `null` default — it feeds `null` straight in, so `Number(null) === 0`
 * (fails `min(0.01)`) and `parseInt(null) === NaN` (fails `int()`), which blocks
 * the wizard from ever submitting. Firing a value + clear makes RHF track the
 * DOM `""` so the transform yields `null`. The same quirk would hit a real user
 * who never touches those fields — flagged to the SDD report, out of scope for
 * this test-only work unit to fix.
 */
function settleOptionalVariantFields() {
  for (const name of ["variants.0.discountPrice", "variants.0.weightGrams"]) {
    fireEvent.change(field(name), { target: { value: "1" } });
    fireEvent.change(field(name), { target: { value: "" } });
  }
}

interface Step1Values {
  name?: string;
  shortDescription?: string | "";
  longDescription?: string;
}

/** Fill step 1, advancing to step 2. `shortDescription: ""` types then clears. */
async function fillStep1(v: Step1Values = {}) {
  fireEvent.change(field("name"), { target: { value: v.name ?? "Anillo de Oro" } });
  if (v.shortDescription !== undefined) {
    fireEvent.change(field("shortDescription"), {
      target: { value: v.shortDescription || "placeholder" },
    });
    if (v.shortDescription === "") {
      fireEvent.change(field("shortDescription"), { target: { value: "" } });
    }
  }
  if (v.longDescription !== undefined) {
    fireEvent.change(field("longDescription"), {
      target: { value: v.longDescription },
    });
  }
  fireEvent.click(nextButton());
  await waitFor(() => expect(onStep1()).toBe(false));
}

/**
 * Drive the wizard to step 3 and fill the single default variant.
 *
 * TRIM (documented): step 2 hosts two `InfiniteScrollSelect` (brand/category)
 * and one `InfiniteScrollMultiSelect` (materials) — portal + `useInfiniteQuery`
 * + `IntersectionObserver` widgets. This spec deliberately does NOT open or
 * drive them. It only proves brand/category can stay null and materials empty
 * and the form still submits. The dropdowns render closed (`enabled: open`
 * keeps them from fetching), so step 2 is a plain "Next".
 */
async function goToFilledStep3(step1: Step1Values = {}) {
  await fillStep1(step1);
  fireEvent.click(nextButton());
  await waitFor(() => expect(onStep3()).toBe(true));

  fireEvent.change(field("variants.0.sku"), { target: { value: "SKU-1" } });
  fireEvent.change(field("variants.0.price"), { target: { value: "99.99" } });
  fireEvent.change(field("variants.0.stock"), { target: { value: "5" } });
  settleOptionalVariantFields();
}

beforeEach(() => {
  vi.clearAllMocks();
  stubBrowserGlobals();
  vi.mocked(useUser).mockReturnValue(makeUseUserValue());
  vi.mocked(api.getAdminBrands).mockResolvedValue(emptyPage());
  vi.mocked(api.getAdminCategories).mockResolvedValue(emptyPage());
  vi.mocked(api.getAdminMaterials).mockResolvedValue(emptyPage());
  vi.mocked(api.getAdminAttributesPage).mockResolvedValue(emptyPage());
});

describe("CreateProductForm — step 1 required-field gate", () => {
  it("blocks Next and shows the required message when name is empty", async () => {
    renderForm();

    fireEvent.click(nextButton());

    expect(
      await screen.findByText("Este campo es obligatorio"),
    ).toBeInTheDocument();
    // still on step 1 — the name field is present and Next has not advanced
    expect(onStep1()).toBe(true);
    expect(nextButton()).toBeInTheDocument();
  });
});

describe("CreateProductForm — wizard navigation", () => {
  it("advances 1 -> 2 with valid step-1 data and returns 2 -> 1 keeping the name", async () => {
    renderForm();

    await fillStep1({ name: "Collar de Plata" });
    // step 2 — a Back button now exists, step-1 field is gone
    expect(backButton()).toBeInTheDocument();

    fireEvent.click(backButton());

    await waitFor(() => expect(onStep1()).toBe(true));
    expect(field("name").value).toBe("Collar de Plata");
  });

  it("reaches step 3 after a second Next", async () => {
    renderForm();

    await fillStep1();
    fireEvent.click(nextButton());

    expect(
      await screen.findByRole("button", { name: /Crear producto/ }),
    ).toBeInTheDocument();
    expect(document.querySelector('[name="variants.0.sku"]')).not.toBeNull();
  });
});

describe("CreateProductForm — variant validation", () => {
  it("shows field messages and does not call createProduct when the variant is empty", async () => {
    renderForm();
    await fillStep1();
    fireEvent.click(nextButton());
    await waitFor(() => expect(onStep3()).toBe(true));

    fireEvent.click(submitButton());

    expect(
      await screen.findAllByText("Este campo es obligatorio"),
    ).not.toHaveLength(0);
    expect(api.createProduct).not.toHaveBeenCalled();
  });
});

describe("CreateProductForm — submit payload shape (load-bearing)", () => {
  it("calls createProduct(payload, token) with status ACTIVE, nulls and the mapped variant", async () => {
    vi.mocked(api.createProduct).mockResolvedValue({
      status: 200,
      message: "ok",
    } as StandardResponse);
    renderForm();

    await goToFilledStep3();
    fireEvent.click(submitButton());

    await waitFor(() => expect(api.createProduct).toHaveBeenCalledTimes(1));

    const [payload, token] = vi.mocked(api.createProduct).mock.calls[0];
    expect(payload).toEqual({
      name: "Anillo de Oro",
      shortDescription: null,
      longDescription: null,
      status: "ACTIVE",
      featured: false,
      brandId: null,
      categoryId: null,
      materialIds: [],
      variants: [
        {
          sku: "SKU-1",
          price: 99.99,
          discountPrice: null,
          stock: 5,
          weightGrams: null,
          attributeValueIds: [],
        },
      ],
    });
    expect(token).toBe(adminUser.token);
  });

  it("coerces an emptied optional description to null and forwards a filled one", async () => {
    vi.mocked(api.createProduct).mockResolvedValue({
      status: 200,
      message: "ok",
    } as StandardResponse);
    renderForm();

    await goToFilledStep3({
      shortDescription: "",
      longDescription: "Descripción larga de prueba",
    });
    fireEvent.click(submitButton());

    await waitFor(() => expect(api.createProduct).toHaveBeenCalledTimes(1));
    const payload = vi.mocked(api.createProduct).mock.calls[0][0];
    expect(payload.shortDescription).toBeNull();
    expect(payload.longDescription).toBe("Descripción larga de prueba");
  });
});

describe("CreateProductForm — success / API-error / in-flight", () => {
  it("success: localized toast + invalidateQueries(admin/products) + onClose, no image upload", async () => {
    vi.mocked(api.createProduct).mockResolvedValue({
      status: 200,
      message: "ok",
    } as StandardResponse);
    const { invalidateSpy } = renderForm();

    await goToFilledStep3();
    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Producto creado con éxito"),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["admin", "products"],
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(api.uploadProductImage).not.toHaveBeenCalled();
  });

  it("API error: inline <p> localized error, toast.error, onClose not called", async () => {
    vi.mocked(api.createProduct).mockRejectedValue(
      new Error("productNotCreatedSuccessfully"),
    );
    renderForm();

    await goToFilledStep3();
    fireEvent.click(submitButton());

    expect(
      await screen.findByText("No fue posible crear el producto"),
    ).toBeInTheDocument();
    expect(toastMock.error).toHaveBeenCalledWith(
      "No fue posible crear el producto",
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("in-flight: submit button disabled with a Spinner until the mutation settles", async () => {
    let resolve!: (value: StandardResponse) => void;
    vi.mocked(api.createProduct).mockImplementation(
      () => new Promise((r) => (resolve = r)),
    );
    renderForm();

    await goToFilledStep3();
    fireEvent.click(submitButton());

    await waitFor(() => expect(submitButton()).toBeDisabled());
    expect(
      submitButton().querySelector('[aria-label="Loading"]'),
    ).not.toBeNull();

    resolve({ status: 200, message: "ok" } as StandardResponse);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
