import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllCharacters } from "../api/characters";
import OriginBarChart from "../components/visualization/OriginBarChart";
import CharacterEpisodeNetwork from "../components/visualization/CharacterEpisodeNetwork";
import CharacterNetworkControls from "../components/visualization/CharacterNetworkControls";
import type { CharacterNetworkFilters } from "../types";
import {
  buildCharacterNetworkData,
  deriveCharacterNetworkFilterOptions,
  filterCharactersForNetwork,
} from "../utils/characterNetwork";

const DEFAULT_NETWORK_FILTERS: CharacterNetworkFilters = {
  origins: [],
  species: [],
  statuses: [],
  episodeThreshold: 1,
  nodeLimit: 200,
};

const DEFAULT_BAR_FILTERS: CharacterNetworkFilters = {
  origins: [],
  species: [],
  statuses: [],
  episodeThreshold: 1,
  nodeLimit: 200,
};

function SectionSkeleton({ className }: { className: string }) {
  return (
    <div
      className={`bg-card border border-rim rounded-xl animate-pulse ${className}`}
    />
  );
}

export default function VisualizationPage() {
  const [networkFilters, setNetworkFilters] = useState<CharacterNetworkFilters>(
    DEFAULT_NETWORK_FILTERS,
  );
  const [barFilters, setBarFilters] =
    useState<CharacterNetworkFilters>(DEFAULT_BAR_FILTERS);

  const {
    data: characters,
    isLoading: isCharactersLoading,
    isError: isCharactersError,
  } = useQuery({
    queryKey: ["all-characters-network"],
    queryFn: fetchAllCharacters,
    staleTime: Infinity,
  });

  const networkOptions = useMemo(
    () => deriveCharacterNetworkFilterOptions(characters ?? []),
    [characters],
  );

  const networkData = useMemo(
    () => buildCharacterNetworkData(characters ?? [], networkFilters),
    [characters, networkFilters],
  );

  const barChartData = useMemo(() => {
    const filteredCharacters = filterCharactersForNetwork(
      characters ?? [],
      barFilters,
    );

    const counts = new Map<string, number>();
    for (const character of filteredCharacters) {
      const origin = character.origin.name || "Unknown";
      counts.set(origin, (counts.get(origin) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([name, residents]) => ({
      name,
      residents,
    }));
  }, [barFilters, characters]);

  function handleNetworkFilterChange(next: Partial<CharacterNetworkFilters>) {
    setNetworkFilters((current) => ({ ...current, ...next }));
  }

  function handleBarFilterChange(next: Partial<CharacterNetworkFilters>) {
    setBarFilters((current) => ({ ...current, ...next }));
  }

  return (
    <div className="max-w-350 mx-auto px-5 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold m-0 text-portal">
          Origin Universe Visualizations
        </h1>
        <p className="mt-1 mb-0 text-sm text-slate-500">
          Explore the 126 known locations and their dimensions across the Rick
          &amp; Morty multiverse.
        </p>
      </div>

      {isCharactersError && (
        <div className="bg-danger border border-dead rounded-lg p-4 text-red-300 mb-6">
          Failed to load character data. Please refresh the page.
        </div>
      )}

      <div className="flex flex-col gap-12">
        {/* Bar Chart */}
        <div className="bg-surface border border-rim rounded-2xl p-7">
          {isCharactersLoading ? (
            <SectionSkeleton className="h-130" />
          ) : (
            <>
              <CharacterNetworkControls
                filters={barFilters}
                options={networkOptions}
                onChange={handleBarFilterChange}
                showGraphControls={false}
              />
              <OriginBarChart data={barChartData} />
            </>
          )}
        </div>

        {/* Character Episode Network */}
        <div className="bg-surface border border-rim rounded-2xl p-7">
          {isCharactersLoading ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-400 m-0">
                Loading character network data...
              </p>
              <SectionSkeleton className="h-170" />
            </div>
          ) : (
            <>
              <CharacterNetworkControls
                filters={networkFilters}
                options={networkOptions}
                onChange={handleNetworkFilterChange}
              />
              <CharacterEpisodeNetwork
                nodes={networkData.nodes}
                links={networkData.links}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
