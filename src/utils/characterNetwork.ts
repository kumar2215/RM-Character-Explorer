import type {
  Character,
  CharacterNetworkFilterOptions,
  CharacterNetworkFilters,
  CharacterNetworkLink,
  CharacterNetworkNode,
} from "../types";

function episodeIdFromUrl(url: string): number | null {
  const match = url.match(/\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

export function deriveCharacterNetworkFilterOptions(
  characters: Character[],
): CharacterNetworkFilterOptions {
  const origins = Array.from(
    new Set(
      characters
        .map((character) => character.origin.name)
        .filter((name) => Boolean(name && name.trim())),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const species = Array.from(
    new Set(
      characters
        .map((character) => character.species)
        .filter((name) => Boolean(name && name.trim())),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const statuses = Array.from(
    new Set(characters.map((character) => character.status)),
  ).sort((a, b) =>
    a.localeCompare(b),
  ) as CharacterNetworkFilterOptions["statuses"];

  return { origins, species, statuses };
}

export function filterCharactersForNetwork(
  characters: Character[],
  filters: CharacterNetworkFilters,
): Character[] {
  const originSet =
    filters.origins.length > 0 ? new Set(filters.origins) : null;
  const speciesSet =
    filters.species.length > 0 ? new Set(filters.species) : null;
  const statusSet =
    filters.statuses.length > 0 ? new Set(filters.statuses) : null;

  return characters.filter((character) => {
    if (originSet && !originSet.has(character.origin.name)) return false;
    if (speciesSet && !speciesSet.has(character.species)) return false;
    if (statusSet && !statusSet.has(character.status)) return false;
    return true;
  });
}

export function buildCharacterNetworkData(
  characters: Character[],
  filters: CharacterNetworkFilters,
): { nodes: CharacterNetworkNode[]; links: CharacterNetworkLink[] } {
  const threshold = Math.max(1, filters.episodeThreshold);
  const capped = filterCharactersForNetwork(characters, filters)
    .slice()
    .sort((a, b) => b.episode.length - a.episode.length)
    .slice(0, Math.max(10, filters.nodeLimit));

  const nodes: CharacterNetworkNode[] = capped.map((character) => ({
    id: character.id,
    name: character.name,
    image: character.image,
    gender: character.gender,
    status: character.status,
    species: character.species,
    originName: character.origin.name,
    episodeCount: character.episode.length,
  }));

  const episodeToCharacters = new Map<number, number[]>();
  for (const character of capped) {
    for (const episodeUrl of character.episode) {
      const episodeId = episodeIdFromUrl(episodeUrl);
      if (!episodeId) continue;
      const list = episodeToCharacters.get(episodeId) ?? [];
      list.push(character.id);
      episodeToCharacters.set(episodeId, list);
    }
  }

  const pairEpisodes = new Map<string, number[]>();
  for (const [episodeId, participants] of episodeToCharacters.entries()) {
    for (let i = 0; i < participants.length; i += 1) {
      for (let j = i + 1; j < participants.length; j += 1) {
        const source = Math.min(participants[i], participants[j]);
        const target = Math.max(participants[i], participants[j]);
        const key = `${source}|${target}`;
        const list = pairEpisodes.get(key) ?? [];
        list.push(episodeId);
        pairEpisodes.set(key, list);
      }
    }
  }

  const links: CharacterNetworkLink[] = [];
  for (const [key, sharedEpisodeIds] of pairEpisodes.entries()) {
    if (sharedEpisodeIds.length < threshold) continue;
    const [source, target] = key.split("|").map(Number);
    links.push({
      source,
      target,
      sharedEpisodes: sharedEpisodeIds.length,
      sharedEpisodeIds: sharedEpisodeIds.slice().sort((a, b) => a - b),
    });
  }

  const connectedNodeIds = new Set<number>();
  for (const link of links) {
    connectedNodeIds.add(link.source as number);
    connectedNodeIds.add(link.target as number);
  }

  const connectedNodes = nodes.filter((node) => connectedNodeIds.has(node.id));

  return { nodes: connectedNodes, links };
}
