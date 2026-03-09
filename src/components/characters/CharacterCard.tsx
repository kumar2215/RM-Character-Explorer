import { Link } from "react-router-dom";
import type { Character } from "../../types";

const STATUS_DOT: Record<Character["status"], string> = {
  Alive: "bg-portal",
  Dead: "bg-dead",
  unknown: "bg-slate-400",
};

const STATUS_TEXT: Record<Character["status"], string> = {
  Alive: "text-portal",
  Dead: "text-dead",
  unknown: "text-slate-400",
};

interface Props {
  character: Character;
}

export default function CharacterCard({ character }: Props) {
  return (
    <Link
      to={`/character/${character.id}`}
      className="bg-card border border-rim rounded-xl overflow-hidden flex flex-col no-underline text-inherit transition-all duration-150 hover:-translate-y-1 hover:border-portal"
    >
      <img
        src={character.image}
        alt={character.name}
        className="w-full aspect-square object-cover"
        loading="lazy"
      />
      <div className="p-3 flex flex-col gap-1">
        <h3 className="font-semibold text-base leading-tight m-0 text-slate-100">
          {character.name}
        </h3>
        <div className="flex items-center gap-1.5 text-sm">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[character.status]}`}
          />
          <span className={STATUS_TEXT[character.status]}>
            {character.status}
          </span>
          <span className="text-slate-500">—</span>
          <span className="text-slate-400">{character.species}</span>
        </div>
        <p className="text-xs m-0 text-slate-500">
          Origin:{" "}
          <span className="text-slate-400">{character.origin.name}</span>
        </p>
      </div>
    </Link>
  );
}
