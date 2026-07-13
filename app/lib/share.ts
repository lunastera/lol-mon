import type { Position } from "./data";
import type { Rank } from "./rank";
import { laneLabel } from "./selection";

export function buildShareText(
  lanes: readonly Position[],
  correct: number,
  total: number,
  rank: Rank,
): string {
  const label = laneLabel(lanes);
  return `LoL検定${label ? `（${label}）` : ""}で${total}問中${correct}問正解、【${rank.label}】ランクでした！`;
}

export function buildShareUrl(text: string, pageUrl: string): string {
  const params = new URLSearchParams({
    text,
    url: pageUrl,
    hashtags: "LoL検定",
  });
  return `https://twitter.com/intent/tweet?${params}`;
}
