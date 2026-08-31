import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuantityStepper } from "./QuantityStepper";

describe("QuantityStepper", () => {
  it("renders the current value", () => {
    render(<QuantityStepper value={3} max={10} onChange={vi.fn()} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("fires onChange with the next value when + is clicked", () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={3} max={10} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Aumentar cantidad" }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("fires onChange with the previous value when - is clicked", () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={3} max={10} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Disminuir cantidad" }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("disables the - button at the minimum", () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={1} min={1} max={10} onChange={onChange} />);
    const dec = screen.getByRole("button", { name: "Disminuir cantidad" });
    expect(dec).toBeDisabled();
    fireEvent.click(dec);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables the + button at the maximum", () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={10} min={1} max={10} onChange={onChange} />);
    const inc = screen.getByRole("button", { name: "Aumentar cantidad" });
    expect(inc).toBeDisabled();
    fireEvent.click(inc);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables both buttons when the disabled prop is set", () => {
    render(
      <QuantityStepper value={5} max={10} onChange={vi.fn()} disabled />,
    );
    expect(
      screen.getByRole("button", { name: "Aumentar cantidad" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Disminuir cantidad" }),
    ).toBeDisabled();
  });
});
