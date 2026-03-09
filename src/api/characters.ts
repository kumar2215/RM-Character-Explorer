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
