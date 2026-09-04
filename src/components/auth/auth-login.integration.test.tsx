import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";

import { server } from "@/mocks/server";
import { UserProvider } from "@/providers/UserProvider";
import { useUser } from "@/hooks/useUser";
import LoginForm from "@/components/auth/LoginForm";
import type { LoginResponse } from "@/api/api";

/**
 * Full login slice integration: real `LoginForm` -> real `loginRequest` -> real
 * `fetch` served by MSW, real `UserProvider` persistence effect, real i18n.
 */

const session: LoginResponse = {
  userId: "u1",
  email: "user@example.com",
  name: "Ada",
  token: "jwt-abc",
  isVerified: true,
  role: "USER",
};

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function Harness({
  client,
  children,
}: {
  client: QueryClient;
  children?: ReactNode;
}) {
  return (
    <QueryClientProvider client={client}>
      <UserProvider>
        <LoginForm />
        {children}
      </UserProvider>
    </QueryClientProvider>
  );
}

function CurrentUser() {
  const { user } = useUser();
  return <div data-testid="current-user">{user ? user.email : "anonymous"}</div>;
}

function submitCredentials() {
  fireEvent.change(screen.getByLabelText("Correo electrónico"), {
    target: { value: "user@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Contraseña"), {
    target: { value: "secret12" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
}

beforeEach(() => {
  localStorage.clear();
});

describe("login integration — 401 contract", () => {
  it("shows localized failure copy and persists nothing on a 401", async () => {
    server.use(
      http.post("*/api/v1/auth/login", () =>
        HttpResponse.json({ error: "Invalid credentials" }, { status: 401 }),
      ),
    );

    render(<Harness client={makeClient()} />);
    submitCredentials();

    expect(
      await screen.findByText("Correo electrónico o contraseña incorrectos"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Login failed")).not.toBeInTheDocument();
    expect(screen.queryByText("Invalid credentials")).not.toBeInTheDocument();
    expect(localStorage.getItem("loginData")).toBeNull();
  });
});

describe("login integration — persist / reload / hydrate round trip", () => {
  it("persists the session via the provider and restores it on remount", async () => {
    server.use(
      http.post("*/api/v1/auth/login", () => HttpResponse.json(session)),
    );

    const client = makeClient();
    const clearSpy = vi.spyOn(client, "clear");

    const { unmount } = render(
      <Harness client={client}>
        <CurrentUser />
      </Harness>,
    );

    submitCredentials();

    await waitFor(() =>
      expect(localStorage.getItem("loginData")).toBe(JSON.stringify(session)),
    );
    expect(clearSpy).toHaveBeenCalled();
    expect(screen.getByTestId("current-user")).toHaveTextContent(
      "user@example.com",
    );

    unmount();

    render(
      <QueryClientProvider client={makeClient()}>
        <UserProvider>
          <CurrentUser />
        </UserProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId("current-user")).toHaveTextContent(
      "user@example.com",
    );
  });
});
