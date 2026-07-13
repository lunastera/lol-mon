import {
  championImageUrl,
  itemImageUrl,
  type QuizData,
  summonerSpellImageUrl,
} from "./data";

/** Every image the quiz can show, for pre-downloading. */
export function allImageUrls(data: QuizData): string[] {
  return [
    ...data.champions.map((c) => championImageUrl(data, c)),
    ...data.items.map((i) => itemImageUrl(data, i)),
    ...data.summonerSpells.map((s) => summonerSpellImageUrl(data, s)),
  ];
}
