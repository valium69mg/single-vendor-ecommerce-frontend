import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProductStatusBadge from "./ProductStatusBadge";

/**
 * ProductStatusBadge is a pure presentational component: it renders the raw
 * `status` string and swaps a colour class per known status. The per-branch
 * colour class IS the component's entire contract, so — unlike the general
 * "never assert CSS classes" rule — the class assertion here is the behaviour
 * under test. There is no label mapping (ACTIVE renders "ACTIVE", not "Activo").
 */

const cases = [
  { status: "ACTIVE", tone: ["border-green-300", "bg-green-50", "text-green-700"] },
  { status: "INACTIVE", tone: ["border-red-300", "bg-red-50", "text-red-700"] },
  { status: "DRAFT", tone: ["border-stone-300", "bg-stone-50", "text-stone-500"] },
  { status: "ARCHIVED", tone: ["border-stone-300", "bg-stone-50", "text-stone-500"] },
] as const;

describe("ProductStatusBadge", () => {
  it.each(cases)("renders the raw $status text verbatim", ({ status }) => {
    render(<ProductStatusBadge status={status} />);
    expect(screen.getByText(status)).toBeInTheDocument();
  });

  it.each(cases)("applies the $status branch colour classes", ({ status, tone }) => {
    render(<ProductStatusBadge status={status} />);
    expect(screen.getByText(status)).toHaveClass(...tone);
  });

  it("uses the green tone only for ACTIVE", () => {
    const { rerender } = render(<ProductStatusBadge status="ACTIVE" />);
    expect(screen.getByText("ACTIVE")).toHaveClass("text-green-700");

    rerender(<ProductStatusBadge status="INACTIVE" />);
    expect(screen.getByText("INACTIVE")).not.toHaveClass("text-green-700");
  });

  it("falls back to the neutral stone tone for an unknown status", () => {
    render(<ProductStatusBadge status="WHATEVER" />);
    const badge = screen.getByText("WHATEVER");
    expect(badge).toHaveClass("bg-stone-50", "text-stone-500");
    expect(badge).not.toHaveClass("bg-green-50", "bg-red-50");
  });
});
