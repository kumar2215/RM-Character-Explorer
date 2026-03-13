import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchAllCharacters,
  fetchCharacterById,
  fetchCharacters,
} from "../../api/characters";
import type { ApiResponse, Character } from "../../types";

const BASE = "https://rickandmortyapi.com/api";

function makeCharacter(id: number): Character {
  return {
    id,
    name: `Character ${id}`,
    status: "Alive",
    species: "Human",
    type: "",
    gender: "Male",
    origin: { name: "Earth", url: "https://example.com/location/1" },
    location: { name: "Earth", url: "https://example.com/location/1" },
    image: `https://example.com/character-${id}.png`,
    episode: [`https://example.com/episode/${id}`],
    url: `https://example.com/character/${id}`,
    created: "2020-01-01T00:00:00.000Z",
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("characters API", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it("builds query params from filters and returns API payload", async () => {
    const payload: ApiResponse<Character> = {
      info: { count: 1, pages: 1, next: null, prev: null },
      results: [makeCharacter(1)],
    };
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(payload));

    const result = await fetchCharacters({
      page: 2,
      name: "Rick",
      status: "alive",
      species: "Human",
      gender: "Male",
    });

    const [request] = vi.mocked(fetch).mock.calls[0];
    expect(request).toBe(
      `${BASE}/character?page=2&name=Rick&status=alive&species=Human&gender=Male`,
    );
    expect(result).toEqual(payload);
  });

  it("omits falsy filters from query params", async () => {
    const payload: ApiResponse<Character> = {
      info: { count: 0, pages: 0, next: null, prev: null },
      results: [],
    };
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(payload));

    await fetchCharacters({ name: "", species: "", gender: "", status: "" });

    const [request] = vi.mocked(fetch).mock.calls[0];
    expect(request).toBe(`${BASE}/character?`);
  });

  it("returns empty result when API responds 404", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, 404));

    const result = await fetchCharacters({ name: "nope" });

    expect(result.results).toEqual([]);
    expect(result.info.pages).toBe(0);
  });

  it("throws for non-404 HTTP errors", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, 500));

    await expect(fetchCharacters({})).rejects.toThrow(
      "Failed to fetch characters: 500",
    );
  });

  it("fetches character by id", async () => {
    const character = makeCharacter(42);
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(character));

    const result = await fetchCharacterById(42);

    expect(result.id).toBe(42);
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(`${BASE}/character/42`);
  });

  it("throws when fetchCharacterById returns non-ok", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, 404));

    await expect(fetchCharacterById(999)).rejects.toThrow(
      "Character 999 not found",
    );
  });

  it("fetches all pages and flattens all character results", async () => {
    const firstPage: ApiResponse<Character> = {
      info: {
        count: 3,
        pages: 2,
        next: `${BASE}/character?page=2`,
        prev: null,
      },
      results: [makeCharacter(1), makeCharacter(2)],
    };
    const secondPage: ApiResponse<Character> = {
      info: {
        count: 3,
        pages: 2,
        next: null,
        prev: `${BASE}/character?page=1`,
      },
      results: [makeCharacter(3)],
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(firstPage))
      .mockResolvedValueOnce(jsonResponse(secondPage));

    const all = await fetchAllCharacters();

    expect(all.map((c) => c.id)).toEqual([1, 2, 3]);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  });

  it("returns empty array when first page is 404", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, 404));

    const all = await fetchAllCharacters();

    expect(all).toEqual([]);
  });

  it("throws when any subsequent page request fails", async () => {
    const firstPage: ApiResponse<Character> = {
      info: {
        count: 2,
        pages: 2,
        next: `${BASE}/character?page=2`,
        prev: null,
      },
      results: [makeCharacter(1)],
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(firstPage))
      .mockResolvedValueOnce(jsonResponse({}, 500));

    await expect(fetchAllCharacters()).rejects.toThrow(
      "Failed to fetch characters page 2",
    );
  });
});
