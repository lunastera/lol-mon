import { describe, expect, it } from "vitest";
import quizDataJson from "../../public/data/quiz-data.json";
import type { QuizData } from "./data";
import { allImageUrls } from "./images";

const data = quizDataJson as unknown as QuizData;

describe("allImageUrls", () => {
  it("covers every champion, item, and summoner spell exactly once", () => {
    const urls = allImageUrls(data);
    expect(urls).toHaveLength(
      data.champions.length + data.items.length + data.summonerSpells.length,
    );
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) {
      expect(url).toMatch(
        new RegExp(
          `^https://ddragon\\.leagueoflegends\\.com/cdn/${data.version}/img/(champion|item|spell)/.+\\.png$`,
        ),
      );
    }
  });
});
