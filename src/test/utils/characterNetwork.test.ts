import { describe, expect, it } from "vitest";
import {
  buildCharacterNetworkData,
  buildOriginCurrentSankeyData,
  deriveCharacterNetworkFilterOptions,
  filterCharactersForNetwork,
} from "../../utils/characterNetwork";
import type { Character, CharacterNetworkFilters } from "../../types";

function makeCharacter(
  id: number,
  overrides: Partial<Character> = {},
): Character {
  return {
    id,
    name: `Character ${id}`,
    status: "Alive",
    species: "Human",
    type: "",
    gender: "Male",
    origin: { name: "Earth", url: "https://example.com/location/1" },
    location: { name: "Citadel", url: "https://example.com/location/2" },
    image: `https://example.com/c-${id}.png`,
    episode: [`https://example.com/episode/${id}`],
    url: `https://example.com/character/${id}`,
    created: "2020-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const defaultFilters: CharacterNetworkFilters = {
  origins: [],
  species: [],
  statuses: [],
  episodeThreshold: 1,
  nodeLimit: 10,
};

describe("deriveCharacterNetworkFilterOptions", () => {
  it("deduplicates values, drops blank names, and sorts", () => {
    const characters = [
      makeCharacter(1, {
        species: "Human",
        origin: { name: "Earth", url: "" },
      }),
      makeCharacter(2, {
        species: "Alien",
        origin: { name: "Gazorpazorp", url: "" },
      }),
      makeCharacter(3, {
        species: "Human",
        origin: { name: "", url: "" },
        status: "Dead",
      }),
      makeCharacter(4, {
        species: "",
        origin: { name: "Earth", url: "" },
        status: "unknown",
      }),
    ];

    const options = deriveCharacterNetworkFilterOptions(characters);

    expect(options.origins).toEqual(["Earth", "Gazorpazorp"]);
    expect(options.species).toEqual(["Alien", "Human"]);
    expect(options.statuses).toEqual(["Alive", "Dead", "unknown"]);
  });
});

describe("filterCharactersForNetwork", () => {
  const characters = [
    makeCharacter(1, {
      species: "Human",
      status: "Alive",
      origin: { name: "Earth", url: "" },
    }),
    makeCharacter(2, {
      species: "Alien",
      status: "Dead",
      origin: { name: "Mars", url: "" },
    }),
  ];

  it("returns all characters when all filter arrays are empty", () => {
    const filtered = filterCharactersForNetwork(characters, defaultFilters);
    expect(filtered).toHaveLength(2);
  });

  it("applies all selected filter dimensions with AND logic", () => {
    const filtered = filterCharactersForNetwork(characters, {
      ...defaultFilters,
      origins: ["Mars"],
      species: ["Alien"],
      statuses: ["Dead"],
    });

    expect(filtered.map((character) => character.id)).toEqual([2]);
  });
});

describe("buildCharacterNetworkData", () => {
  it("creates links for shared episodes and removes disconnected nodes", () => {
    const characters = [
      makeCharacter(1, {
        episode: [
          "https://example.com/episode/1",
          "https://example.com/episode/2",
        ],
      }),
      makeCharacter(2, { episode: ["https://example.com/episode/2"] }),
      makeCharacter(3, { episode: ["https://example.com/episode/9"] }),
    ];

    const graph = buildCharacterNetworkData(characters, defaultFilters);

    expect(graph.links).toEqual([
      {
        source: 1,
        target: 2,
        sharedEpisodes: 1,
        sharedEpisodeIds: [2],
      },
    ]);
    expect(graph.nodes.map((node) => node.id)).toEqual([1, 2]);
  });

  it("respects episode threshold and ignores malformed episode urls", () => {
    const characters = [
      makeCharacter(1, {
        episode: [
          "https://example.com/episode/1",
          "https://example.com/episode/2",
          "not-a-valid-url",
        ],
      }),
      makeCharacter(2, {
        episode: [
          "https://example.com/episode/1",
          "https://example.com/episode/2",
        ],
      }),
      makeCharacter(3, { episode: ["https://example.com/episode/2"] }),
    ];

    const graph = buildCharacterNetworkData(characters, {
      ...defaultFilters,
      episodeThreshold: 2,
    });

    expect(graph.links).toEqual([
      {
        source: 1,
        target: 2,
        sharedEpisodes: 2,
        sharedEpisodeIds: [1, 2],
      },
    ]);
  });
});

describe("buildOriginCurrentSankeyData", () => {
  it("returns empty output for empty character list", () => {
    expect(buildOriginCurrentSankeyData([])).toEqual({ nodes: [], links: [] });
  });

  it("aggregates repeated origin-to-location flows", () => {
    const characters = [
      makeCharacter(1, {
        origin: { name: "Earth", url: "" },
        location: { name: "Citadel", url: "" },
      }),
      makeCharacter(2, {
        origin: { name: "Earth", url: "" },
        location: { name: "Citadel", url: "" },
      }),
      makeCharacter(3, {
        origin: { name: "Mars", url: "" },
        location: { name: "Citadel", url: "" },
      }),
    ];

    const result = buildOriginCurrentSankeyData(characters);

    const earthNodeIndex = result.nodes.findIndex(
      (node) => node.kind === "origin" && node.name === "Earth",
    );
    const citadelNodeIndex = result.nodes.findIndex(
      (node) => node.kind === "location" && node.name === "Citadel",
    );

    const flow = result.links.find(
      (link) =>
        link.source === earthNodeIndex && link.target === citadelNodeIndex,
    );

    expect(flow?.value).toBe(2);
  });

  it("buckets less frequent values into Other categories when unique counts exceed top-N", () => {
    const characters = Array.from({ length: 13 }, (_, i) =>
      makeCharacter(i + 1, {
        origin: { name: `Origin ${String(i + 1).padStart(2, "0")}`, url: "" },
        location: {
          name: `Location ${String(i + 1).padStart(2, "0")}`,
          url: "",
        },
      }),
    );

    const result = buildOriginCurrentSankeyData(characters);

    const otherOrigin = result.nodes.find(
      (node) => node.kind === "origin" && node.name === "Other Origins",
    );
    const otherLocation = result.nodes.find(
      (node) =>
        node.kind === "location" && node.name === "Other Current Locations",
    );

    expect(otherOrigin?.count).toBe(1);
    expect(otherLocation?.count).toBe(1);
  });
});
