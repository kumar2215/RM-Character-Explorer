import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ApiResponse, Character } from "../../types";

vi.mock("../../api/characters", () => ({
  fetchCharacters: vi.fn(),
}));

import HomePage from "../../pages/HomePage";
import { renderWithQueryClient } from "../utils";
import { fetchCharacters } from "../../api/characters";

function makeCharacter(id: number): Character {
  return {
    id,
    name: `Character ${id}`,
    status: "Alive",
    species: "Human",
    type: "",
    gender: "Male",
    origin: { name: "Earth", url: "" },
    location: { name: "Citadel", url: "" },
    image: `https://example.com/c-${id}.png`,
    episode: ["https://example.com/episode/1"],
    url: `https://example.com/character/${id}`,
    created: "2020-01-01T00:00:00.000Z",
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("scrollTo", vi.fn());
});

describe("HomePage", () => {
  it("renders loading state while query is pending", () => {
    vi.mocked(fetchCharacters).mockImplementation(
      () => new Promise(() => undefined),
    );

    renderWithQueryClient(<HomePage />);

    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders error state when query fails", async () => {
    vi.mocked(fetchCharacters).mockRejectedValue(new Error("boom"));

    renderWithQueryClient(<HomePage />);

    expect(
      await screen.findByText(
        "Something went wrong fetching characters. Please try again.",
      ),
    ).toBeInTheDocument();
  });

  it("renders characters and supports pagination interaction", async () => {
    const payload: ApiResponse<Character> = {
      info: { count: 2, pages: 3, next: "next", prev: null },
      results: [makeCharacter(1), makeCharacter(2)],
    };

    vi.mocked(fetchCharacters).mockResolvedValue(payload);

    renderWithQueryClient(<HomePage />);

    expect(await screen.findByText("2 characters found")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next →" }));

    await waitFor(() => {
      expect(fetchCharacters).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 }),
      );
    });
  });

  it("applies status filter and requests first page", async () => {
    const payload: ApiResponse<Character> = {
      info: { count: 1, pages: 1, next: null, prev: null },
      results: [makeCharacter(1)],
    };
    vi.mocked(fetchCharacters).mockResolvedValue(payload);

    renderWithQueryClient(<HomePage />);

    await screen.findByText("1 characters found");
    fireEvent.change(screen.getAllByRole("combobox")[0], {
      target: { value: "alive" },
    });

    await waitFor(() => {
      expect(fetchCharacters).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: "alive", page: 1 }),
      );
    });
  });
});
