import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import type { StandardResponse } from "@/api/api";
import {
  renderWithProviders,
  createTestQueryClient,
  adminUser,
  makeUseUserValue,
  toastMock,
} from "@/test/adminFormHelpers";

vi.mock("@/hooks/useUser", () => ({ useUser: vi.fn() }));
vi.mock("@/hooks/useToast", () => ({ useToast: () => toastMock }));
vi.mock("@/api/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/api")>();
  return { ...actual, restoreCategory: vi.fn() };
});

import { useUser } from "@/hooks/useUser";
import * as api from "@/api/api";
import RestoreCategoryDialog from "./RestoreCategoryDialog";

const CATEGORY_ID = 9;
const onOpenChange = vi.fn();
const onRestored = vi.fn();
const onUseDifferentName = vi.fn();

const confirmButton = () =>
  screen.getByRole("button", { name: /Restaurar categoría/ });
const useDifferentNameButton = () =>
  screen.getByRole("button", { name: "Usar un nombre diferente" });

function renderDialog() {
  const queryClient = createTestQueryClient();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const utils = renderWithProviders(
    <RestoreCategoryDialog
      open
      onOpenChange={onOpenChange}
      categoryId={CATEGORY_ID}
      onRestored={onRestored}
      onUseDifferentName={onUseDifferentName}
    />,
    { queryClient },
  );
  return { ...utils, invalidateSpy };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useUser).mockReturnValue(makeUseUserValue());
  vi.mocked(api.restoreCategory).mockResolvedValue(undefined as never);
});

describe("RestoreCategoryDialog — content", () => {
  it("renders the localized title and description", () => {
    renderDialog();
    expect(
      screen.getByText("Categoría eliminada anteriormente"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Una categoría con este nombre fue eliminada anteriormente/,
      ),
    ).toBeInTheDocument();
  });

  it("has no literal Cancel button", () => {
    renderDialog();
    expect(screen.queryByRole("button", { name: /cancel/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /cancelar/i })).toBeNull();
  });
});

describe("RestoreCategoryDialog — confirm fires restore", () => {
  it("calls restoreCategory({ categoryId, token }) then toast + invalidate + onRestored", async () => {
    const { invalidateSpy } = renderDialog();

    fireEvent.click(confirmButton());

    await waitFor(() => expect(api.restoreCategory).toHaveBeenCalledTimes(1));
    expect(api.restoreCategory).toHaveBeenCalledWith({
      categoryId: CATEGORY_ID,
      token: adminUser.token,
    });
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith(
        "Categoría restaurada con éxito",
      ),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["admin", "categories"],
    });
    expect(onRestored).toHaveBeenCalledTimes(1);
  });
});

describe("RestoreCategoryDialog — dismissal never restores", () => {
  it("'use different name' calls onUseDifferentName and never restoreCategory", () => {
    renderDialog();

    fireEvent.click(useDifferentNameButton());

    expect(onUseDifferentName).toHaveBeenCalledTimes(1);
    expect(api.restoreCategory).not.toHaveBeenCalled();
  });

  it("Escape triggers onOpenChange(false) and never restoreCategory", async () => {
    renderDialog();

    fireEvent.keyDown(document.body, { key: "Escape", code: "Escape" });

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(api.restoreCategory).not.toHaveBeenCalled();
  });

  it("overlay pointer-down triggers onOpenChange(false) and never restoreCategory", async () => {
    const { baseElement } = renderDialog();

    // Radix attaches its outside-pointer listener on a setTimeout(0); let it run.
    await new Promise((r) => setTimeout(r, 20));

    const overlay = baseElement.querySelector(".fixed.inset-0") as HTMLElement;
    expect(overlay).not.toBeNull();
    fireEvent.pointerDown(overlay);

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(api.restoreCategory).not.toHaveBeenCalled();
  });
});

describe("RestoreCategoryDialog — pending lock", () => {
  it("shows a Spinner and disables both buttons while the restore is pending", async () => {
    let resolve!: (value: StandardResponse) => void;
    vi.mocked(api.restoreCategory).mockImplementation(
      () => new Promise((r) => (resolve = r)),
    );
    renderDialog();

    fireEvent.click(confirmButton());

    await waitFor(() => expect(confirmButton()).toBeDisabled());
    expect(useDifferentNameButton()).toBeDisabled();
    expect(
      confirmButton().querySelector('[aria-label="Loading"]'),
    ).not.toBeNull();

    resolve({ status: 200, message: "ok" });
    await waitFor(() => expect(onRestored).toHaveBeenCalled());
  });
});

describe("RestoreCategoryDialog — restore error", () => {
  it("routes a rejection through useApiErrorHandler and does not call onRestored", async () => {
    vi.mocked(api.restoreCategory).mockRejectedValue(
      new Error("categoryNotRestoredSuccessfully"),
    );
    renderDialog();

    fireEvent.click(confirmButton());

    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith(
        "No fue posible restaurar la categoría",
      ),
    );
    expect(onRestored).not.toHaveBeenCalled();
  });
});
