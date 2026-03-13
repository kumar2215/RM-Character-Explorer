import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCharacters } from "../api";
import type { CharacterFilters } from "../types";
import { CharacterGrid, FilterBar, Pagination } from "../components/characters";

const DEFAULT_FILTERS: CharacterFilters = {
  name: "",
  status: "",
  species: "",
  gender: "",
  page: 1,
};

// Skeleton placeholder while loading
function GridSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-rim rounded-xl overflow-hidden"
        >
          <div className="w-full aspect-square bg-rim animate-pulse" />
          <div className="p-3 flex flex-col gap-2">
            <div className="h-4 rounded bg-rim animate-pulse w-3/4" />
            <div className="h-3 rounded bg-rim animate-pulse w-1/2" />
            <div className="h-3 rounded bg-rim animate-pulse w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [filters, setFilters] = useState<CharacterFilters>(DEFAULT_FILTERS);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["characters", filters],
    queryFn: () => fetchCharacters(filters),
  });

  function handleFilterChange(partial: Partial<CharacterFilters>) {
    setFilters((prev) => ({ ...prev, ...partial }));
  }

  return (
    <div className="max-w-[1400px] mx-auto px-5 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold m-0 text-portal">
          Character Explorer
        </h1>
        <p className="mt-1 mb-0 text-sm text-slate-500">
          {data ? `${data.info.count} characters found` : "Loading…"}
        </p>
      </div>

      <FilterBar filters={filters} onChange={handleFilterChange} />

      {isError && (
        <div className="bg-danger border border-dead rounded-lg p-4 text-red-300 mb-4">
          Something went wrong fetching characters. Please try again.
        </div>
      )}

      {isLoading ? (
        <GridSkeleton />
      ) : (
        <>
          <CharacterGrid characters={data?.results ?? []} />
          <Pagination
            page={filters.page}
            totalPages={data?.info.pages ?? 1}
            onPageChange={(p) => {
              handleFilterChange({ page: p });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      )}
    </div>
  );
}
