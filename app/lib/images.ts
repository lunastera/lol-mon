import {
  championImageUrl,
  championPassiveImageUrl,
  championSpellImageUrl,
  itemImageUrl,
  type QuizData,
  runeImageUrl,
  summonerSpellImageUrl,
} from "./data";
import { RANKS, rankEmblemUrl } from "./rank";

/** Every image the quiz can show, for pre-downloading. */
export function allImageUrls(data: QuizData): string[] {
  return [
    ...data.champions.flatMap((c) => [
      championImageUrl(data, c),
      championPassiveImageUrl(data, c.passive),
      ...c.spells.map((s) => championSpellImageUrl(data, s)),
    ]),
    ...data.items.map((i) => itemImageUrl(data, i)),
    ...data.runeStyles.flatMap((style) => [
      runeImageUrl(style.icon),
      ...style.runes.map((r) => runeImageUrl(r.icon)),
    ]),
    ...data.summonerSpells.map((s) => summonerSpellImageUrl(data, s)),
    ...RANKS.map((rank) => rankEmblemUrl(rank)),
  ];
}
