import type {
  CharacterNetworkFilterOptions,
  CharacterNetworkFilters,
} from "../../types";

interface CharacterNetworkControlsProps {
  filters: CharacterNetworkFilters;
  options: CharacterNetworkFilterOptions;
  onChange: (next: Partial<CharacterNetworkFilters>) => void;
  showGraphControls?: boolean;
}

const panelClass = "bg-card border border-rim rounded-lg p-3";

function normalizeSelection(
  current: string[],
  allOptions: string[],
  option: string,
  checked: boolean,
): string[] {
  const effective = current.length === 0 ? allOptions : current;
  const next = checked
    ? Array.from(new Set([...effective, option]))
    : effective.filter((value) => value !== option);

  if (next.length === allOptions.length) {
    return [];
  }

  return next;
}

function isSelected(current: string[], option: string): boolean {
  if (current.length === 0) return true;
  return current.includes(option);
}

function MultiSelectList({
  title,
  values,
  selected,
  onToggle,
  onSetAll,
}: {
  title: string;
  values: string[];
  selected: string[];
  onToggle: (option: string, checked: boolean) => void;
  onSetAll: () => void;
}) {
  return (
    <div className={panelClass}>
      <div className="flex items-center justify-between mb-2 gap-2">
        <p className="m-0 text-xs text-slate-300 font-semibold">{title}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="text-[11px] text-slate-400 hover:text-portal transition-colors"
            onClick={onSetAll}
          >
            All
          </button>
        </div>
      </div>
      <div className="max-h-32 overflow-auto pr-1 space-y-1.5">
        {values.map((value) => (
          <label
            key={value}
            className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer"
          >
            <input
              type="checkbox"
              className="accent-portal"
              checked={isSelected(selected, value)}
              onChange={(event) => onToggle(value, event.target.checked)}
            />
            <span className="truncate" title={value}>
              {value}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function CharacterNetworkControls({
  filters,
  options,
  onChange,
  showGraphControls = true,
}: CharacterNetworkControlsProps) {
  return (
    <div className="bg-surface border border-rim rounded-xl p-4 mb-5 space-y-4">
      {showGraphControls && (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs text-slate-400 mb-1.5">
                Shared Episodes Threshold
              </label>
              <span className="text-xs text-slate-200 font-semibold">
                {filters.episodeThreshold}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              title="Shared episodes threshold"
              value={filters.episodeThreshold}
              onChange={(event) =>
                onChange({ episodeThreshold: Number(event.target.value) })
              }
              className="w-full accent-portal"
            />
            <p className="text-[11px] text-slate-500 mt-1 mb-0">
              Connect two characters if they share at least this many episodes.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs text-slate-400 mb-1.5">
                Node Limit
              </label>
              <span className="text-xs text-slate-200 font-semibold">
                {filters.nodeLimit}
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={400}
              step={10}
              title="Node limit"
              value={filters.nodeLimit}
              onChange={(event) =>
                onChange({ nodeLimit: Number(event.target.value) })
              }
              className="w-full accent-portal"
            />
            <p className="text-[11px] text-slate-500 mt-1 mb-0">
              Limits rendered characters to keep the graph readable and
              responsive.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <MultiSelectList
          title="Origin"
          values={options.origins}
          selected={filters.origins}
          onSetAll={() => onChange({ origins: [] })}
          onToggle={(option, checked) =>
            onChange({
              origins: normalizeSelection(
                filters.origins,
                options.origins,
                option,
                checked,
              ),
            })
          }
        />

        <MultiSelectList
          title="Species"
          values={options.species}
          selected={filters.species}
          onSetAll={() => onChange({ species: [] })}
          onToggle={(option, checked) =>
            onChange({
              species: normalizeSelection(
                filters.species,
                options.species,
                option,
                checked,
              ),
            })
          }
        />

        <MultiSelectList
          title="Status"
          values={options.statuses}
          selected={filters.statuses}
          onSetAll={() => onChange({ statuses: [] })}
          onToggle={(option, checked) =>
            onChange({
              statuses: normalizeSelection(
                filters.statuses,
                options.statuses,
                option,
                checked,
              ) as CharacterNetworkFilters["statuses"],
            })
          }
        />
      </div>
    </div>
  );
}
