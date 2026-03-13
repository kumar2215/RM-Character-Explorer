import type {
  Character,
  CharacterNetworkFilterOptions,
  CharacterNetworkFilters,
  CharacterNetworkLink,
  CharacterNetworkNode,
  OriginCurrentSankeyData,
  OriginCurrentSankeyLink,
  OriginCurrentSankeyNode,
} from "../types";

const MAX_SANKEY_ORIGINS = 12;
const MAX_SANKEY_LOCATIONS = 12;
const OTHER_ORIGINS_LABEL = "Other Origins";
const OTHER_LOCATIONS_LABEL = "Other Current Locations";

function episodeIdFromUrl(url: string): number | null {
  const match = url.match(/\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function normalizeName(name: string | undefined): string {
  const value = (name ?? "").trim();
  return value.length > 0 ? value : "Unknown";
}

function getTopKeysByFrequency(
  counts: Map<string, number>,
  limit: number,
): Set<string> {
  return new Set(
    Array.from(counts.entries())
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0]);
      })
      .slice(0, limit)
      .map(([name]) => name),
  );
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

export function buildOriginCurrentSankeyData(
  characters: Character[],
): OriginCurrentSankeyData {
  if (characters.length === 0) {
    return { nodes: [], links: [] };
  }

  const originCounts = new Map<string, number>();
  const locationCounts = new Map<string, number>();

  for (const character of characters) {
    const originName = normalizeName(character.origin.name);
    const locationName = normalizeName(character.location.name);
    originCounts.set(originName, (originCounts.get(originName) ?? 0) + 1);
    locationCounts.set(
      locationName,
      (locationCounts.get(locationName) ?? 0) + 1,
    );
  }

  const topOrigins = getTopKeysByFrequency(originCounts, MAX_SANKEY_ORIGINS);
  const topLocations = getTopKeysByFrequency(
    locationCounts,
    MAX_SANKEY_LOCATIONS,
  );

  const flowByOrigin = new Map<string, Map<string, number>>();
  const originBucketCounts = new Map<string, number>();
  const locationBucketCounts = new Map<string, number>();

  for (const character of characters) {
    const originName = normalizeName(character.origin.name);
    const locationName = normalizeName(character.location.name);
    const originBucket = topOrigins.has(originName)
      ? originName
      : OTHER_ORIGINS_LABEL;
    const locationBucket = topLocations.has(locationName)
      ? locationName
      : OTHER_LOCATIONS_LABEL;

    originBucketCounts.set(
      originBucket,
      (originBucketCounts.get(originBucket) ?? 0) + 1,
    );
    locationBucketCounts.set(
      locationBucket,
      (locationBucketCounts.get(locationBucket) ?? 0) + 1,
    );

    const row = flowByOrigin.get(originBucket) ?? new Map<string, number>();
    row.set(locationBucket, (row.get(locationBucket) ?? 0) + 1);
    flowByOrigin.set(originBucket, row);
  }

  const orderedOrigins = Array.from(originBucketCounts.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .map(([name]) => name);

  const orderedLocations = Array.from(locationBucketCounts.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .map(([name]) => name);

  const nodes: OriginCurrentSankeyNode[] = [];
  const originIndexByName = new Map<string, number>();
  const locationIndexByName = new Map<string, number>();

  for (const originName of orderedOrigins) {
    originIndexByName.set(originName, nodes.length);
    nodes.push({
      name: originName,
      kind: "origin",
      count: originBucketCounts.get(originName) ?? 0,
    });
  }

  for (const locationName of orderedLocations) {
    locationIndexByName.set(locationName, nodes.length);
    nodes.push({
      name: locationName,
      kind: "location",
      count: locationBucketCounts.get(locationName) ?? 0,
    });
  }

  const links: OriginCurrentSankeyLink[] = [];
  for (const originName of orderedOrigins) {
    const row = flowByOrigin.get(originName);
    if (!row) continue;

    const sourceIndex = originIndexByName.get(originName);
    if (sourceIndex === undefined) continue;

    const sortedTargets = Array.from(row.entries()).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });

    for (const [locationName, count] of sortedTargets) {
      const targetIndex = locationIndexByName.get(locationName);
      if (targetIndex === undefined || count <= 0) continue;
      links.push({ source: sourceIndex, target: targetIndex, value: count });
    }
  }

  links.sort((a, b) => b.value - a.value);
  return { nodes, links };
}
