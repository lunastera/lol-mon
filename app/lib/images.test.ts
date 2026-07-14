import { describe, expect, it } from "vitest";
import quizDataJson from "../../public/data/quiz-data.json";
import type { QuizData } from "./data";
import { allImageUrls } from "./images";
import { RANKS } from "./rank";

const data = quizDataJson as unknown as QuizData;

describe("allImageUrls", () => {
  it("covers every champion, skill, passive, item, rune, and summoner spell exactly once", () => {
    const urls = allImageUrls(data);
    const spellCount = data.champions.reduce(
      (sum, c) => sum + c.spells.length,
      0,
    );
    const runeCount = data.runeStyles.reduce(
      (sum, s) => sum + 1 + s.runes.length,
      0,
    );
    expect(urls).toHaveLength(
      data.champions.length * 2 + // icon + passive
        spellCount +
        data.items.length +
        runeCount +
        data.summonerSpells.length +
        RANKS.length, // ranked emblems
    );
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) {
      expect(url).toMatch(
        new RegExp(
          // Rune (perk) icons are unversioned; everything else on Data Dragon
          // is versioned. Ranked emblems come from CommunityDragon.
          `^https://(ddragon\\.leagueoflegends\\.com/cdn/(${data.version}/img/(champion|item|spell|passive)|img/perk-images)|raw\\.communitydragon\\.org/latest/.+/ranked-emblem)/.+\\.png$`,
        ),
      );
    }
  });
});
