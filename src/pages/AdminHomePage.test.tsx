import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { stubMatchMedia } from "@/test/adminFormHelpers";
import AdminHomePage from "./AdminHomePage";

vi.mock("@/components/admin/AdminSideBar", () => ({
  default: () => <div data-testid="admin-sidebar" />,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminHomePage />
    </MemoryRouter>,
  );
}

describe("AdminHomePage shell", () => {
  beforeEach(() => {
    stubMatchMedia(false);
  });

  it("marks the admin shell wrapper with data-context=\"admin\" so /admin/* inherits the neutral brand", () => {
    const { container } = renderPage();
    const shell = container.querySelector('[data-context="admin"]');
    expect(shell).not.toBeNull();
  });

  it("uses a dynamic-viewport fixed-height shell (h-dvh), not h-screen", () => {
    const { container } = renderPage();
    const shell = container.querySelector('[data-context="admin"]') as HTMLElement;
    expect(shell.className).toContain("h-dvh");
    expect(shell.className).not.toContain("h-screen");
  });

  it("labels the mobile menu toggle from the localized i18n key, not a hardcoded string", () => {
    renderPage();
    const toggle = screen.getByRole("button", { name: "Abrir menú" });
    expect(toggle).toBeInTheDocument();
  });
});
