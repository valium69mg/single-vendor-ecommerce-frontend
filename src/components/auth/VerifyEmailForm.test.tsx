import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const toastSuccess = vi.fn();

vi.mock("@/hooks/useUser", () => ({ useUser: vi.fn() }));
vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ success: toastSuccess }),
}));
vi.mock("@/api/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/api")>();
  return { ...actual, verifyRequest: vi.fn(), resendCodeRequest: vi.fn() };
});

import { useUser } from "@/hooks/useUser";
import * as api from "@/api/api";
import type { LoginResponse } from "@/api/api";
import VerifyEmailForm from "./VerifyEmailForm";

const mockedUseUser = vi.mocked(useUser);
const setUser = vi.fn();

const session: LoginResponse = {
  userId: "u1",
  email: "user@example.com",
  name: "Ada",
  token: "jwt-abc",
  isVerified: false,
  role: "USER",
};

function renderForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<VerifyEmailForm />, { wrapper });
}

function setCode(value: string) {
  fireEvent.change(screen.getByLabelText("Código de verificación"), {
    target: { value },
  });
}

function submit() {
  fireEvent.submit(
    screen
      .getByLabelText("Código de verificación")
      .closest("form") as HTMLFormElement,
  );
}

const submitButton = () => screen.getByRole("button", { name: /Verificar/ });
const resendButton = () =>
  screen.getByRole("button", { name: /Reenviar código/ });

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseUser.mockReturnValue({ user: session, setUser, logout: vi.fn() });
});

describe("VerifyEmailForm submit", () => {
  it("calls verifyRequest with the entered code and the session email", async () => {
    vi.mocked(api.verifyRequest).mockResolvedValue(undefined);
    renderForm();
    setCode("123456");
    submit();

    await waitFor(() =>
      expect(api.verifyRequest).toHaveBeenCalledWith({
        email: "user@example.com",
        code: "123456",
      }),
    );
  });

  it("marks the user verified on success", async () => {
    vi.mocked(api.verifyRequest).mockResolvedValue(undefined);
    renderForm();
    setCode("123456");
    submit();

    await waitFor(() =>
      expect(setUser).toHaveBeenCalledWith({ ...session, isVerified: true }),
    );
  });

  it("disables the submit control while the mutation is pending", async () => {
    let resolve!: () => void;
    vi.mocked(api.verifyRequest).mockImplementation(
      () => new Promise((r) => (resolve = r)),
    );
    renderForm();
    setCode("123456");
    submit();

    await waitFor(() => expect(submitButton()).toBeDisabled());
    resolve();
  });

  it.each([
    ["auth.verify.codeRejected", "El código ingresado es incorrecto"],
    [
      "auth.verify.attemptsExceeded",
      "Superaste el número máximo de intentos. Solicita un nuevo código",
    ],
    ["auth.verify.codeExpired", "El código ha expirado. Solicita uno nuevo"],
    [
      "auth.verify.tooManyCodes",
      "Solicitaste demasiados códigos. Inténtalo de nuevo más tarde",
    ],
    ["auth.verify.alreadyVerified", "Esta cuenta ya fue verificada"],
  ])("renders the localized message for %s", async (key, message) => {
    vi.mocked(api.verifyRequest).mockRejectedValue(new Error(key));
    renderForm();
    setCode("000000");
    submit();

    expect(await screen.findByText(message)).toBeInTheDocument();
  });
});

describe("VerifyEmailForm resend", () => {
  it("calls resendCodeRequest with the session email and shows a confirmation toast", async () => {
    vi.mocked(api.resendCodeRequest).mockResolvedValue(undefined);
    renderForm();
    fireEvent.click(resendButton());

    await waitFor(() =>
      expect(api.resendCodeRequest).toHaveBeenCalledWith({
        email: "user@example.com",
      }),
    );
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Código reenviado"),
    );
  });

  it("disables the resend control while the mutation is pending", async () => {
    let resolve!: () => void;
    vi.mocked(api.resendCodeRequest).mockImplementation(
      () => new Promise((r) => (resolve = r)),
    );
    renderForm();
    fireEvent.click(resendButton());

    await waitFor(() => expect(resendButton()).toBeDisabled());
    resolve();
  });

  it("renders the localized rate-limit message on resend 429", async () => {
    vi.mocked(api.resendCodeRequest).mockRejectedValue(
      new Error("auth.verify.tooManyCodes"),
    );
    renderForm();
    fireEvent.click(resendButton());

    expect(
      await screen.findByText(
        "Solicitaste demasiados códigos. Inténtalo de nuevo más tarde",
      ),
    ).toBeInTheDocument();
  });
});
