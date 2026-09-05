import type { ReactElement, ReactNode } from "react";
import {
  fireEvent,
  render,
  screen,
  type RenderResult,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, type Mock } from "vitest";
import type { LoginResponse } from "@/api/api";
import type { UserContextType } from "@/context/UserContext";

/**
 * Shared test utilities for the admin mutation-form specs (brand / category /
 * material Create+Edit forms, the 3 Restore dialogs, CreateProductForm).
 *
 * Mirrors the gold-standard `src/components/auth/LoginForm.test.tsx` pattern:
 * mock `@/api/api`, `@/hooks/useUser` and `@/hooks/useToast` per file, but run
 * the REAL `useApiErrorHandler` under a retry-disabled `QueryClientProvider`.
 *
 * NOTE: `vi.mock` factories are hoisted, so the `@/api/api` `importOriginal`
 * spread and the `@/hooks/useToast` factory stay inlined in each test file.
 * Everything here is used at runtime (inside `render`/handlers), never inside a
 * `vi.mock` factory.
 */

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  opts?: { queryClient?: QueryClient },
): RenderResult & { queryClient: QueryClient } {
  const queryClient = opts?.queryClient ?? createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const result = render(ui, { wrapper });
  return { ...result, queryClient };
}

export const adminUser: LoginResponse = {
  userId: "admin-1",
  email: "admin@example.com",
  name: "Admin",
  token: "test-jwt",
  role: "ADMIN",
  isVerified: true,
};

export function makeUseUserValue(
  o?: Partial<UserContextType>,
): UserContextType {
  return {
    user: adminUser,
    setUser: vi.fn(),
    logout: vi.fn(),
    ...o,
  };
}

export interface ToastMock {
  success: Mock;
  error: Mock;
  info: Mock;
  warning: Mock;
  promise: Mock;
}

export const toastMock: ToastMock = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  promise: vi.fn(),
};

export function resetToastMock(): void {
  toastMock.success.mockReset();
  toastMock.error.mockReset();
  toastMock.info.mockReset();
  toastMock.warning.mockReset();
  toastMock.promise.mockReset();
}

/** Change the shared "Nombre" text input rendered by `FormField`. */
export function fillName(value: string): void {
  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value } });
}

/** Submit the form that owns `fromEl` (defaults to the "Nombre" field). */
export function submitForm(fromEl?: HTMLElement): void {
  const anchor = fromEl ?? screen.getByLabelText("Nombre");
  fireEvent.submit(anchor.closest("form") as HTMLFormElement);
}

interface MediaQueryListLike {
  matches: boolean;
  media: string;
  onchange: null;
  addEventListener: Mock;
  removeEventListener: Mock;
  addListener: Mock;
  removeListener: Mock;
  dispatchEvent: Mock;
}

/**
 * Controllable `window.matchMedia` stub for `use-mobile`. jsdom does not
 * implement `matchMedia`; `unstubGlobals: true` in `vite.config.ts` restores it
 * between tests.
 */
export function stubMatchMedia(matches: boolean): MediaQueryListLike {
  const mql: MediaQueryListLike = {
    matches,
    media: "(max-width: 767px)",
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation(() => mql),
  );
  return mql;
}

/**
 * Stub the jsdom gaps CreateProductForm needs: `matchMedia`,
 * `IntersectionObserver` and `URL.createObjectURL`. Not added to
 * `src/test/setup.ts` on purpose — only two spec files need them.
 */
export function stubBrowserGlobals(): void {
  stubMatchMedia(false);

  const intersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => []),
  }));
  vi.stubGlobal("IntersectionObserver", intersectionObserver);

  if (typeof URL.createObjectURL !== "function") {
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn() }));
  }
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:admin-form-test");
}
