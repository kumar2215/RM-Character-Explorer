import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCharacterById } from "../api";
import { STATUS_DOT_CLASS, STATUS_TEXT_CLASS } from "../constants";

function extractEpisodeCode(url: string) {
  const id = url.split("/").pop();
  return `EP${id}`;
}

export default function CharacterPage() {
  const { id } = useParams<{ id: string }>();
  const numId = Number(id);

  const {
    data: character,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["character", numId],
    queryFn: () => fetchCharacterById(numId),
    enabled: !isNaN(numId),
  });

  if (isLoading) {
    return (
      <div className="max-w-225 mx-auto mt-10 px-5">
        <div className="bg-card border border-rim rounded-2xl overflow-hidden flex">
          <div className="w-80 min-h-80 shrink-0 bg-rim animate-pulse" />
          <div className="p-8 flex-1 flex flex-col gap-4">
            {[180, 120, 140, 100, 200].map((w, i) => (
              <div
                key={i}
                style={{ width: w }}
                className="h-4 rounded bg-rim animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !character) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="text-5xl mb-4">🌀</p>
        <p className="text-xl mb-4">Character not found in this dimension.</p>
        <Link to="/" className="text-portal no-underline font-semibold">
          ← Back to Explorer
        </Link>
      </div>
    );
  }

  const fields = [
    {
      label: "Status",
      value: character.status,
      textClass: STATUS_TEXT_CLASS[character.status] ?? "text-slate-200",
    },
    {
      label: "Species",
      value: character.species || "—",
      textClass: "text-slate-200",
    },
    {
      label: "Type",
      value: character.type || "—",
      textClass: "text-slate-200",
    },
    { label: "Gender", value: character.gender, textClass: "text-slate-200" },
    {
      label: "Origin",
      value: character.origin.name,
      textClass: "text-slate-200",
    },
    {
      label: "Last seen",
      value: character.location.name,
      textClass: "text-slate-200",
    },
  ];

  return (
    <div className="max-w-225 mx-auto mt-10 px-5">
      {/* Back link */}
      <Link
        to="/"
        className="text-portal no-underline text-sm inline-flex items-center gap-1 mb-6"
      >
        ← Back to Characters
      </Link>

      <div className="bg-card border border-rim rounded-2xl overflow-hidden flex flex-wrap mt-4">
        {/* Image */}
        <img
          src={character.image}
          alt={character.name}
          className="w-80 max-w-full object-cover shrink-0"
        />

        {/* Info */}
        <div className="flex-1 p-8 min-w-60">
          <div className="flex items-center gap-3 mb-6">
            <span
              className={`w-3 h-3 rounded-full shrink-0 ${STATUS_DOT_CLASS[character.status] ?? "bg-slate-400"}`}
            />
            <h1 className="text-3xl font-bold m-0 text-slate-100">
              {character.name}
            </h1>
          </div>

          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(180px,1fr))] mb-8">
            {fields.map(({ label, value, textClass }) => (
              <div key={label}>
                <p className="text-xs m-0 mb-1 text-slate-500 uppercase tracking-wide">
                  {label}
                </p>
                <p className={`text-sm m-0 font-medium ${textClass}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Episodes */}
          <div>
            <p className="text-xs m-0 mb-3 text-slate-500 uppercase tracking-wide">
              Appeared in {character.episode.length} episode
              {character.episode.length !== 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {character.episode.map((epUrl) => {
                const code = extractEpisodeCode(epUrl);
                return (
                  <span
                    key={epUrl}
                    className="bg-night border border-rim rounded-md px-2 py-0.5 text-xs text-slate-400"
                  >
                    {code}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
