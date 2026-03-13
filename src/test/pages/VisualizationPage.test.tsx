import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQueryClient } from "../utils";
import type { Character } from "../../types";

const mockOriginBarChart = vi.fn();
const mockOriginCurrentSankey = vi.fn();
const mockCharacterEpisodeNetwork = vi.fn();

vi.mock("../../api/characters", () => ({
  fetchAllCharacters: vi.fn(),
}));

vi.mock("../../components/visualization/OriginBarChart", () => ({
  default: (props: unknown) => {
    mockOriginBarChart(props);
    return <div data-testid="origin-bar-chart" />;
  },
}));

vi.mock("../../components/visualization/OriginCurrentSankey", () => ({
  default: (props: unknown) => {
    mockOriginCurrentSankey(props);
    return <div data-testid="origin-current-sankey" />;
  },
}));

vi.mock("../../components/visualization/CharacterEpisodeNetwork", () => ({
  default: (props: unknown) => {
    mockCharacterEpisodeNetwork(props);
    return <div data-testid="character-episode-network" />;
  },
}));

vi.mock("../../components/visualization/CharacterNetworkControls", () => ({
  default: ({ showGraphControls = true }: { showGraphControls?: boolean }) => (
    <div
      data-testid={showGraphControls ? "controls-graph" : "controls-simple"}
    />
  ),
}));

import { fetchAllCharacters } from "../../api/characters";
import VisualizationPage from "../../pages/VisualizationPage";

function makeCharacter(
  id: number,
  origin: string,
  location: string,
  episodes: number[],
): Character {
  return {
    id,
    name: `Character ${id}`,
    status: "Alive",
    species: "Human",
    type: "",
    gender: "Male",
    origin: { name: origin, url: "" },
    location: { name: location, url: "" },
    image: `https://example.com/c-${id}.png`,
    episode: episodes.map(
      (episode) => `https://example.com/episode/${episode}`,
    ),
    url: `https://example.com/character/${id}`,
    created: "2020-01-01T00:00:00.000Z",
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("VisualizationPage", () => {
  it("renders loading state while all characters query is pending", () => {
    vi.mocked(fetchAllCharacters).mockImplementation(
      () => new Promise(() => undefined),
    );

    renderWithQueryClient(<VisualizationPage />);

    expect(
      screen.getByText("Loading character network data..."),
    ).toBeInTheDocument();
  });

  it("shows error message when character fetch fails", async () => {
    vi.mocked(fetchAllCharacters).mockRejectedValue(new Error("network"));

    renderWithQueryClient(<VisualizationPage />);

    expect(
      await screen.findByText(
        "Failed to load character data. Please refresh the page.",
      ),
    ).toBeInTheDocument();
  });

  it("renders visualization sections and passes derived data to child charts", async () => {
    vi.mocked(fetchAllCharacters).mockResolvedValue([
      makeCharacter(1, "Earth", "Citadel", [1, 2]),
      makeCharacter(2, "Earth", "Citadel", [2]),
      makeCharacter(3, "Mars", "Citadel", [3]),
    ]);

    renderWithQueryClient(<VisualizationPage />);

    expect(await screen.findByTestId("origin-bar-chart")).toBeInTheDocument();
    expect(screen.getByTestId("origin-current-sankey")).toBeInTheDocument();
    expect(screen.getByTestId("character-episode-network")).toBeInTheDocument();

    expect(screen.getAllByTestId("controls-simple")).toHaveLength(2);
    expect(screen.getByTestId("controls-graph")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockOriginBarChart).toHaveBeenCalled();
      expect(mockOriginCurrentSankey).toHaveBeenCalled();
      expect(mockCharacterEpisodeNetwork).toHaveBeenCalled();
    });

    const barProps = mockOriginBarChart.mock.calls.at(-1)?.[0] as {
      data: Array<{ name: string; residents: number }>;
    };

    expect(barProps.data).toEqual(
      expect.arrayContaining([
        { name: "Earth", residents: 2 },
        { name: "Mars", residents: 1 },
      ]),
    );

    const networkProps = mockCharacterEpisodeNetwork.mock.calls.at(-1)?.[0] as {
      nodes: Array<{ id: number }>;
      links: Array<{ source: number; target: number }>;
    };

    expect(networkProps.nodes.map((node) => node.id)).toEqual([1, 2]);
    expect(networkProps.links).toHaveLength(1);
  });
});
