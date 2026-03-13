import { useEffect, useRef, useState } from "react";
import type { CharacterFilters } from "../../types";

interface FilterBarProps {
  filters: CharacterFilters;
  onChange: (f: Partial<CharacterFilters>) => void;
}

const fieldCls =
  "w-full bg-card border border-rim rounded-lg text-slate-200 text-sm px-3 py-2 outline-none focus:border-portal transition-colors";
const labelCls = "block text-xs text-slate-400 mb-1";

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const [nameInput, setNameInput] = useState(filters.name);
  const isFirstRender = useRef(true);

  // Debounce name input
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const t = setTimeout(() => onChange({ name: nameInput, page: 1 }), 400);
    return () => clearTimeout(t);
  }, [nameInput, onChange]);

  return (
    <div className="bg-surface border border-rim rounded-xl p-4 grid gap-3 grid-cols-[repeat(auto-fill,minmax(160px,1fr))] mb-6">
      <div>
        <label className={labelCls}>Name</label>
        <input
          className={fieldCls}
          placeholder="Search name…"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
        />
      </div>
      <div>
        <label className={labelCls}>Status</label>
        <select
          className={fieldCls}
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value, page: 1 })}
        >
          <option value="">All</option>
          <option value="alive">Alive</option>
          <option value="dead">Dead</option>
          <option value="unknown">Unknown</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Species</label>
        <input
          className={fieldCls}
          placeholder="e.g. Human"
          value={filters.species}
          onChange={(e) => onChange({ species: e.target.value, page: 1 })}
        />
      </div>
      <div>
        <label className={labelCls}>Gender</label>
        <select
          className={fieldCls}
          value={filters.gender}
          onChange={(e) => onChange({ gender: e.target.value, page: 1 })}
        >
          <option value="">All</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="genderless">Genderless</option>
          <option value="unknown">Unknown</option>
        </select>
      </div>
      {(filters.name ||
        filters.status ||
        filters.species ||
        filters.gender) && (
        <div className="flex items-end">
          <button
            className="w-full bg-transparent border border-slate-500 rounded-lg text-slate-400 text-sm px-3 py-2 cursor-pointer hover:border-slate-300 hover:text-slate-200 transition-colors"
            onClick={() => {
              setNameInput("");
              onChange({
                name: "",
                status: "",
                species: "",
                gender: "",
                page: 1,
              });
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
