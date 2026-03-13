import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAllLocations } from "../../api/locations";
import type { ApiResponse, Location } from "../../types";

const BASE = "https://rickandmortyapi.com/api";

function makeLocation(id: number): Location {
  return {
    id,
    name: `Location ${id}`,
    type: "Planet",
    dimension: "Dimension C-137",
    residents: [],
    url: `https://example.com/location/${id}`,
    created: "2020-01-01T00:00:00.000Z",
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("locations API", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it("fetches all pages and flattens locations", async () => {
    const page1: ApiResponse<Location> = {
      info: { count: 3, pages: 2, next: `${BASE}/location?page=2`, prev: null },
      results: [makeLocation(1), makeLocation(2)],
    };
    const page2: ApiResponse<Location> = {
      info: { count: 3, pages: 2, next: null, prev: `${BASE}/location?page=1` },
      results: [makeLocation(3)],
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(page1))
      .mockResolvedValueOnce(jsonResponse(page2));

    const locations = await fetchAllLocations();

    expect(locations.map((location) => location.id)).toEqual([1, 2, 3]);
  });

  it("throws if first request is not ok", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, 500));

    await expect(fetchAllLocations()).rejects.toThrow(
      "Failed to fetch locations",
    );
  });

  it("attempts to parse each remaining page payload", async () => {
    const page1: ApiResponse<Location> = {
      info: { count: 2, pages: 2, next: `${BASE}/location?page=2`, prev: null },
      results: [makeLocation(1)],
    };
    const malformedResponse = new Response("not-json", { status: 200 });

    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(page1))
      .mockResolvedValueOnce(malformedResponse);

    await expect(fetchAllLocations()).rejects.toThrow();
  });
});
