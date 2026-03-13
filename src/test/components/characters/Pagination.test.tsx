import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Pagination from "../../../components/characters/Pagination";

describe("Pagination", () => {
  it("does not render when only one page exists", () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("disables previous button on first page and calls next", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={3} onPageChange={onPageChange} />);

    const prevButton = screen.getByRole("button", { name: "\u2190 Prev" });
    const nextButton = screen.getByRole("button", { name: "Next \u2192" });

    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();

    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("disables next button on last page and calls previous", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={4} totalPages={4} onPageChange={onPageChange} />);

    const prevButton = screen.getByRole("button", { name: "\u2190 Prev" });
    const nextButton = screen.getByRole("button", { name: "Next \u2192" });

    expect(nextButton).toBeDisabled();

    fireEvent.click(prevButton);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
