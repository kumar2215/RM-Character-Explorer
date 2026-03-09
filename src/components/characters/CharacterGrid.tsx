import type { Character } from "../../types";
import CharacterCard from "./CharacterCard";

interface Props {
  characters: Character[];
}

export default function CharacterGrid({ characters }: Props) {
  if (characters.length === 0) {
    return (
      <div className="text-center py-20 text-slate-500">
        <p className="text-4xl mb-2">🔭</p>
        <p className="text-lg">No characters found. Try different filters.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
      {characters.map((c) => (
        <CharacterCard key={c.id} character={c} />
      ))}
    </div>
  );
}
