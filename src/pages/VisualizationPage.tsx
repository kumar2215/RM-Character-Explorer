import { useQuery } from "@tanstack/react-query";
import { fetchAllLocations } from "../api/locations";
import OriginBarChart from "../components/visualization/OriginBarChart";
import DimensionNetwork from "../components/visualization/DimensionNetwork";

function SectionSkeleton({ height }: { height: number }) {
  return (
    <div
      className="bg-card border border-rim rounded-xl animate-pulse"
      style={{ height }}
    />
  );
}

export default function VisualizationPage() {
  const {
    data: locations,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["all-locations"],
    queryFn: fetchAllLocations,
    staleTime: Infinity, // location data rarely changes
  });

  return (
    <div className="max-w-[1400px] mx-auto px-5 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold m-0 text-portal">
          Origin Universe Visualizations
        </h1>
        <p className="mt-1 mb-0 text-sm text-slate-500">
          Explore the 126 known locations and their dimensions across the Rick
          &amp; Morty multiverse.
        </p>
      </div>

      {isError && (
        <div className="bg-danger border border-dead rounded-lg p-4 text-red-300 mb-6">
          Failed to load location data. Please refresh the page.
        </div>
      )}

      <div className="flex flex-col gap-12">
        {/* Bar Chart */}
        <div className="bg-surface border border-rim rounded-2xl p-7">
          {isLoading ? (
            <SectionSkeleton height={520} />
          ) : (
            <OriginBarChart locations={locations ?? []} />
          )}
        </div>

        {/* D3 Network */}
        <div className="bg-surface border border-rim rounded-2xl p-7">
          {isLoading ? (
            <SectionSkeleton height={680} />
          ) : (
            <DimensionNetwork locations={locations ?? []} />
          )}
        </div>
      </div>
    </div>
  );
}
