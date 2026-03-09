import type { ApiResponse, Location } from "../types";

const BASE = "https://rickandmortyapi.com/api";

export async function fetchAllLocations(): Promise<Location[]> {
  // First fetch to get total pages
  const first = await fetch(`${BASE}/location`);
  if (!first.ok) throw new Error("Failed to fetch locations");
  const firstData: ApiResponse<Location> = await first.json();

  const totalPages = firstData.info.pages;
  const remaining = Array.from({ length: totalPages - 1 }, (_, i) =>
    fetch(`${BASE}/location?page=${i + 2}`).then(
      (r) => r.json() as Promise<ApiResponse<Location>>,
    ),
  );

  const rest = await Promise.all(remaining);
  return [firstData, ...rest].flatMap((d) => d.results);
}
