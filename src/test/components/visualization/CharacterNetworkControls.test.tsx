import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CharacterNetworkControls from "../../../components/visualization/CharacterNetworkControls";
import type {
  CharacterNetworkFilterOptions,
  CharacterNetworkFilters,
} from "../../../types";

const options: CharacterNetworkFilterOptions = {
  origins: ["Earth", "Mars"],
  species: ["Human", "Alien"],
  statuses: ["Alive", "Dead", "unknown"],
};

const filters: CharacterNetworkFilters = {
  origins: [],
  species: [],
  statuses: [],
  episodeThreshold: 1,
  nodeLimit: 200,
};

describe("CharacterNetworkControls", () => {
  it("hides graph controls when showGraphControls is false", () => {
    render(
      <CharacterNetworkControls
        filters={filters}
        options={options}
        onChange={vi.fn()}
        showGraphControls={false}
      />,
    );

    expect(
      screen.queryByLabelText("Shared Episodes Threshold"),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Node Limit")).not.toBeInTheDocument();
  });

  it("emits origin selection updates from checkbox toggles", () => {
    const onChange = vi.fn();
    render(
      <CharacterNetworkControls
        filters={filters}
        options={options}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByLabelText("Earth"));

    expect(onChange).toHaveBeenCalledWith({ origins: ["Mars"] });
  });

  it("resets a filter group when clicking the All button", () => {
    const onChange = vi.fn();
    render(
      <CharacterNetworkControls
        filters={{ ...filters, origins: ["Earth"] }}
        options={options}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "All" })[0]);

    expect(onChange).toHaveBeenCalledWith({ origins: [] });
  });
});
