import type { ApiResponse, Character, CharacterFilters } from "../types";

const BASE = "https://rickandmortyapi.com/api";

export async function fetchCharacters(
  filters: Partial<CharacterFilters>,
): Promise<ApiResponse<Character>> {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.name) params.set("name", filters.name);
  if (filters.status) params.set("status", filters.status);
  if (filters.species) params.set("species", filters.species);
  if (filters.gender) params.set("gender", filters.gender);

  const res = await fetch(`${BASE}/character?${params.toString()}`);
  if (!res.ok) {
    if (res.status === 404)
      return {
        info: { count: 0, pages: 0, next: null, prev: null },
        results: [],
      };
    throw new Error(`Failed to fetch characters: ${res.status}`);
  }
  return res.json();
}

export async function fetchCharacterById(id: number): Promise<Character> {
  const res = await fetch(`${BASE}/character/${id}`);
  if (!res.ok) throw new Error(`Character ${id} not found`);
  return res.json();
}

export async function fetchAllCharacters(): Promise<Character[]> {
  const first = await fetch(`${BASE}/character`);
  if (!first.ok) {
    if (first.status === 404) return [];
    throw new Error(`Failed to fetch characters: ${first.status}`);
  }

  const firstData: ApiResponse<Character> = await first.json();
  const totalPages = firstData.info.pages;
  const remaining = Array.from({ length: totalPages - 1 }, (_, i) =>
    fetch(`${BASE}/character?page=${i + 2}`).then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch characters page ${i + 2}`);
      }
      return res.json() as Promise<ApiResponse<Character>>;
    }),
  );

  const rest = await Promise.all(remaining);
  return [firstData, ...rest].flatMap((d) => d.results);
}
