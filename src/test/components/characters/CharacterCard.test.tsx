import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import CharacterCard from "../../../components/characters/CharacterCard";
import type { Character } from "../../../types";

function makeCharacter(): Character {
  return {
    id: 7,
    name: "Test Rick",
    status: "Alive",
    species: "Human",
    type: "",
    gender: "Male",
    origin: { name: "Earth", url: "" },
    location: { name: "Citadel", url: "" },
    image: "https://example.com/rick.png",
    episode: ["https://example.com/episode/1"],
    url: "https://example.com/character/7",
    created: "2020-01-01T00:00:00.000Z",
  };
}

describe("CharacterCard", () => {
  it("renders character content and links to detail route", () => {
    render(
      <MemoryRouter>
        <CharacterCard character={makeCharacter()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("img", { name: "Test Rick" })).toBeInTheDocument();
    expect(screen.getByText("Human")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/character/7");
  });
});
