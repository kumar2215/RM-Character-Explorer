import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FilterBar from "../../../components/characters/FilterBar";
import type { CharacterFilters } from "../../../types";

const baseFilters: CharacterFilters = {
  name: "",
  status: "",
  species: "",
  gender: "",
  page: 1,
};

describe("FilterBar", () => {
  it("debounces name input changes", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<FilterBar filters={baseFilters} onChange={onChange} />);

    const input = screen.getByPlaceholderText("Search name…");
    fireEvent.change(input, { target: { value: "Morty" } });

    vi.advanceTimersByTime(399);
    expect(onChange).not.toHaveBeenCalledWith({ name: "Morty", page: 1 });

    vi.advanceTimersByTime(1);
    expect(onChange).toHaveBeenCalledWith({ name: "Morty", page: 1 });
    vi.useRealTimers();
  });

  it("applies select filters immediately", async () => {
    const onChange = vi.fn();
    render(<FilterBar filters={baseFilters} onChange={onChange} />);

    fireEvent.change(screen.getAllByRole("combobox")[0], {
      target: { value: "alive" },
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({ status: "alive", page: 1 });
    });
  });

  it("clears all filters through clear button", () => {
    const onChange = vi.fn();
    render(
      <FilterBar
        filters={{ ...baseFilters, name: "Rick", status: "alive" }}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(onChange).toHaveBeenCalledWith({
      name: "",
      status: "",
      species: "",
      gender: "",
      page: 1,
    });
  });
});
