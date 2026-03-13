import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CharacterPage from "../../pages/CharacterPage";
import { createTestQueryClient } from "../utils";
import type { Character } from "../../types";

vi.mock("../../api/characters", () => ({
  fetchCharacterById: vi.fn(),
}));

import { fetchCharacterById } from "../../api/characters";

function makeCharacter(id: number): Character {
  return {
    id,
    name: "Rick Sanchez",
    status: "Alive",
    species: "Human",
    type: "",
    gender: "Male",
    origin: { name: "Earth (C-137)", url: "" },
    location: { name: "Citadel of Ricks", url: "" },
    image: "https://example.com/rick.png",
    episode: ["https://rickandmortyapi.com/api/episode/10"],
    url: "https://example.com/character/1",
    created: "2017-11-04T18:48:46.250Z",
  };
}

function renderPage(path: string) {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/character/:id" element={<CharacterPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("CharacterPage", () => {
  it("renders not found UI for invalid route param", async () => {
    renderPage("/character/not-a-number");

    expect(
      await screen.findByText("Character not found in this dimension."),
    ).toBeInTheDocument();
    expect(fetchCharacterById).not.toHaveBeenCalled();
  });

  it("renders error UI when API request fails", async () => {
    vi.mocked(fetchCharacterById).mockRejectedValue(new Error("not found"));
    renderPage("/character/404");

    expect(
      await screen.findByText("Character not found in this dimension."),
    ).toBeInTheDocument();
  });

  it("renders character details when request succeeds", async () => {
    vi.mocked(fetchCharacterById).mockResolvedValue(makeCharacter(1));
    renderPage("/character/1");

    expect(
      await screen.findByRole("heading", { name: "Rick Sanchez" }),
    ).toBeInTheDocument();
    expect(screen.getByText("EP10")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "← Back to Characters" }),
    ).toHaveAttribute("href", "/");
  });
});
