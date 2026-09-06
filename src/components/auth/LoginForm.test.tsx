import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/hooks/useUser", () => ({ useUser: vi.fn() }));
vi.mock("@/api/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/api")>();
  return { ...actual, loginRequest: vi.fn() };
});

import { useUser } from "@/hooks/useUser";
import * as api from "@/api/api";
import type { LoginResponse } from "@/api/api";
import LoginForm from "./LoginForm";

const mockedUseUser = vi.mocked(useUser);
const setUser = vi.fn();

const session: LoginResponse = {
  userId: "u1",
  email: "user@example.com",
  name: "Ada",
  token: "jwt-abc",
  isVerified: true,
  role: "USER",
};

function renderForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const clearSpy = vi.spyOn(client, "clear");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const utils = render(<LoginForm />, { wrapper });
  return { ...utils, clearSpy };
}

function setEmail(value: string) {
  fireEvent.change(screen.getByLabelText("Correo electrónico"), {
    target: { value },
  });
}

function setPassword(value: string) {
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value } });
}

function submit() {
  fireEvent.submit(
    screen.getByLabelText("Correo electrónico").closest("form") as HTMLFormElement,
  );
}

const submitButton = () =>
  screen.getByRole("button", { name: /Iniciar sesión/ });

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockedUseUser.mockReturnValue({ user: null, setUser, logout: vi.fn() });
});

describe("LoginForm validation", () => {
  it("blocks submit and shows the invalid-email message for a malformed email", async () => {
    renderForm();
    setEmail("nope");
    setPassword("secret12");
    submit();

    expect(
      await screen.findByText("Correo electrónico inválido"),
    ).toBeInTheDocument();
    expect(api.loginRequest).not.toHaveBeenCalled();
  });

  it("blocks submit and shows the required message for an empty password", async () => {
    renderForm();
    setEmail("user@example.com");
    submit();

    expect(
      await screen.findByText("Este campo es obligatorio"),
    ).toBeInTheDocument();
    expect(api.loginRequest).not.toHaveBeenCalled();
  });
});

describe("LoginForm password visibility toggle", () => {
  it("exposes a localized accessible name and pressed state (icon-only control)", () => {
    renderForm();

    const toggle = screen.getByRole("button", { name: "Mostrar contraseña" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(toggle);

    const pressed = screen.getByRole("button", { name: "Ocultar contraseña" });
    expect(pressed).toHaveAttribute("aria-pressed", "true");
  });
});

describe("LoginForm success path", () => {
  it("calls setUser + queryClient.clear and writes no storage directly", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    vi.mocked(api.loginRequest).mockResolvedValue(session);

    const { clearSpy } = renderForm();
    setEmail("user@example.com");
    setPassword("secret12");
    submit();

    await waitFor(() => expect(setUser).toHaveBeenCalledWith(session));
    expect(clearSpy).toHaveBeenCalled();
    expect(setItemSpy.mock.calls.some(([key]) => key === "loginData")).toBe(
      false,
    );
  });

  it("disables the submit control while the mutation is pending", async () => {
    let resolve!: (value: LoginResponse) => void;
    vi.mocked(api.loginRequest).mockImplementation(
      () => new Promise((r) => (resolve = r)),
    );

    renderForm();
    setEmail("user@example.com");
    setPassword("secret12");
    submit();

    await waitFor(() => expect(submitButton()).toBeDisabled());
    resolve(session);
  });
});

describe("LoginForm error path", () => {
  it("renders localized Spanish copy for a failed login (not the English literal)", async () => {
    vi.mocked(api.loginRequest).mockRejectedValue(
      new Error("auth.invalidCredentials"),
    );

    renderForm();
    setEmail("user@example.com");
    setPassword("secret12");
    submit();

    expect(
      await screen.findByText("Correo electrónico o contraseña incorrectos"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Login failed")).not.toBeInTheDocument();
  });
});
