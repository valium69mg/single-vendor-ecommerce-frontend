import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const navigate = vi.fn();
const toastSuccess = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
}));
vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ success: toastSuccess }),
}));
vi.mock("@/api/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/api")>();
  return { ...actual, registerRequest: vi.fn() };
});

import * as api from "@/api/api";
import RegisterForm from "./RegisterForm";

function renderForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<RegisterForm />, { wrapper });
}

const VALID_PASSWORD = "Secret12!";

function setEmail(value: string) {
  fireEvent.change(screen.getByLabelText("Correo electrónico"), {
    target: { value },
  });
}

function setPassword(value: string) {
  fireEvent.change(screen.getByLabelText("Contraseña"), {
    target: { value },
  });
}

function setConfirmPassword(value: string) {
  fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
    target: { value },
  });
}

function checkTerms() {
  fireEvent.click(
    screen.getByLabelText("Acepto los términos y condiciones"),
  );
}

function submit() {
  fireEvent.submit(
    screen.getByLabelText("Correo electrónico").closest("form") as HTMLFormElement,
  );
}

const submitButton = () =>
  screen.getByRole("button", { name: /Registrarse/ });

function fillValidForm() {
  setEmail("user@example.com");
  setPassword(VALID_PASSWORD);
  setConfirmPassword(VALID_PASSWORD);
  checkTerms();
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RegisterForm validation", () => {
  it("blocks submit and shows the invalid-email message for a malformed email", async () => {
    renderForm();
    setEmail("nope");
    setPassword(VALID_PASSWORD);
    setConfirmPassword(VALID_PASSWORD);
    checkTerms();
    submit();

    expect(
      await screen.findByText("Correo electrónico inválido"),
    ).toBeInTheDocument();
    expect(api.registerRequest).not.toHaveBeenCalled();
  });

  it("blocks submit and shows the mismatch message when passwords differ", async () => {
    renderForm();
    setEmail("user@example.com");
    setPassword(VALID_PASSWORD);
    setConfirmPassword("Different12!");
    checkTerms();
    submit();

    expect(
      await screen.findByText("Las contraseñas no coinciden"),
    ).toBeInTheDocument();
    expect(api.registerRequest).not.toHaveBeenCalled();
  });

  it("blocks submit and shows the terms-required message when unchecked", async () => {
    renderForm();
    setEmail("user@example.com");
    setPassword(VALID_PASSWORD);
    setConfirmPassword(VALID_PASSWORD);
    submit();

    expect(
      await screen.findByText("Debes aceptar los términos y condiciones"),
    ).toBeInTheDocument();
    expect(api.registerRequest).not.toHaveBeenCalled();
  });
});

describe("RegisterForm success path", () => {
  it("calls registerRequest, shows a success toast, and redirects to /login", async () => {
    vi.mocked(api.registerRequest).mockResolvedValue(undefined);

    renderForm();
    fillValidForm();
    submit();

    await waitFor(() =>
      expect(api.registerRequest).toHaveBeenCalledWith({
        email: "user@example.com",
        password: VALID_PASSWORD,
      }),
    );
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/login"));
    expect(toastSuccess).toHaveBeenCalledWith("Cuenta creada con éxito");
  });

  it("disables the submit control while the mutation is pending", async () => {
    let resolve!: () => void;
    vi.mocked(api.registerRequest).mockImplementation(
      () => new Promise((r) => (resolve = r)),
    );

    renderForm();
    fillValidForm();
    submit();

    await waitFor(() => expect(submitButton()).toBeDisabled());
    resolve();
  });
});

describe("RegisterForm error path", () => {
  it("renders the localized duplicate-email error (not the English literal)", async () => {
    vi.mocked(api.registerRequest).mockRejectedValue(
      new Error("auth.register.emailExists"),
    );

    renderForm();
    fillValidForm();
    submit();

    expect(
      await screen.findByText("El correo electrónico ya está registrado"),
    ).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalledWith("/login");
  });
});
