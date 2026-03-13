import type { Character } from "../types";

export const STATUS_DOT_CLASS: Record<Character["status"], string> = {
  Alive: "bg-portal",
  Dead: "bg-dead",
  unknown: "bg-slate-400",
};

export const STATUS_TEXT_CLASS: Record<Character["status"], string> = {
  Alive: "text-portal",
  Dead: "text-dead",
  unknown: "text-slate-400",
};
