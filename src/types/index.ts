export interface LocationRef {
  name: string;
  url: string;
}

export interface Character {
  id: number;
  name: string;
  status: "Alive" | "Dead" | "unknown";
  species: string;
  type: string;
  gender: "Female" | "Male" | "Genderless" | "unknown";
  origin: LocationRef;
  location: LocationRef;
  image: string;
  episode: string[];
  url: string;
  created: string;
}

export interface Location {
  id: number;
  name: string;
  type: string;
  dimension: string;
  residents: string[];
  url: string;
  created: string;
}

export interface PaginationInfo {
  count: number;
  pages: number;
  next: string | null;
  prev: string | null;
}

export interface ApiResponse<T> {
  info: PaginationInfo;
  results: T[];
}

export interface CharacterFilters {
  name: string;
  status: string;
  species: string;
  gender: string;
  page: number;
}

export interface CharacterNetworkFilters {
  origins: string[];
  species: string[];
  statuses: Character["status"][];
  episodeThreshold: number;
  nodeLimit: number;
}

export interface CharacterNetworkFilterOptions {
  origins: string[];
  species: string[];
  statuses: Character["status"][];
}

export interface CharacterNetworkNode {
  id: number;
  name: string;
  image: string;
  gender: Character["gender"];
  status: Character["status"];
  species: string;
  originName: string;
  episodeCount: number;
}

export interface CharacterNetworkLink {
  source: number | CharacterNetworkNode;
  target: number | CharacterNetworkNode;
  sharedEpisodes: number;
  sharedEpisodeIds: number[];
}

export interface OriginCurrentSankeyNode {
  name: string;
  kind: "origin" | "location";
  count: number;
}

export interface OriginCurrentSankeyLink {
  source: number;
  target: number;
  value: number;
  rawValue?: number;
  percentFromSource?: number;
}

export interface OriginCurrentSankeyData {
  nodes: OriginCurrentSankeyNode[];
  links: OriginCurrentSankeyLink[];
}
