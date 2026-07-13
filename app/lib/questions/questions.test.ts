import { describe, expect, it } from "vitest";
import quizDataJson from "../../../public/data/quiz-data.json";
import type { Position, QuizData } from "../data";
import { createRng } from "../random";
import {
  buildChoices,
  buildQuizSet,
  championPool,
  DEFAULT_SELECTION,
} from "./index";

const data = quizDataJson as unknown as QuizData;

describe("buildChoices", () => {
  it("places the correct answer at answerIndex with 4 unique choices", () => {
    const rng = createRng(1);
    const built = buildChoices(rng, "A", ["B", "C", "D", "E", "A"]);
    expect(built).toBeDefined();
    expect(built?.choices).toHaveLength(4);
    expect(new Set(built?.choices).size).toBe(4);
    expect(built?.choices[built.answerIndex]).toBe("A");
  });

  it("returns undefined when there are fewer than 3 distractors", () => {
    const rng = createRng(1);
    expect(buildChoices(rng, "A", ["B", "B", "A"])).toBeUndefined();
  });
});

describe("buildQuizSet", () => {
  it("builds 20 well-formed unique questions with everything selected", () => {
    const questions = buildQuizSet(data, DEFAULT_SELECTION, createRng(42));
    expect(questions).toHaveLength(20);
    // Identity is text + image (image questions share the same text).
    const keys = new Set(questions.map((q) => `${q.text}|${q.imageUrl ?? ""}`));
    expect(keys.size).toBe(20);
    for (const q of questions) {
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.answerIndex).toBeGreaterThanOrEqual(0);
      expect(q.answerIndex).toBeLessThan(4);
    }
  });

  it("is deterministic for a given seed", () => {
    const a = buildQuizSet(data, DEFAULT_SELECTION, createRng(7));
    const b = buildQuizSet(data, DEFAULT_SELECTION, createRng(7));
    expect(a).toEqual(b);
  });

  it("mixes categories with everything selected", () => {
    const questions = buildQuizSet(data, DEFAULT_SELECTION, createRng(42));
    const categories = new Set(questions.map((q) => q.category));
    expect(categories.size).toBeGreaterThan(1);
  });

  for (const typeId of ["champion-image", "item-image"] as const) {
    it(`builds a full set from ${typeId} alone (identical texts, distinct images)`, () => {
      const questions = buildQuizSet(
        data,
        { lanes: [...DEFAULT_SELECTION.lanes], types: [typeId] },
        createRng(42),
      );
      expect(questions).toHaveLength(20);
      const images = new Set(questions.map((q) => q.imageUrl));
      expect(images.size).toBe(20);
    });
  }

  it("skill questions: slot answers match the kit and descriptions mask the champion", () => {
    const questions = buildQuizSet(
      data,
      { lanes: [...DEFAULT_SELECTION.lanes], types: ["skill"] },
      createRng(3),
      40,
    );
    expect(questions).toHaveLength(40);
    const byName = new Map(data.champions.map((c) => [c.name, c]));
    let slotSeen = 0;
    let ownerSeen = 0;
    for (const q of questions) {
      const slotMatch = q.text.match(/^(.+) の ([QWER]) スキルは？$/);
      if (slotMatch) {
        slotSeen++;
        const champion = byName.get(slotMatch[1]);
        expect(champion, q.text).toBeDefined();
        const spell = champion?.spells.find((s) => s.slot === slotMatch[2]);
        expect(q.choices[q.answerIndex]).toBe(spell?.name);
        // Choices and tooltips all come from the champion's own kit.
        const kit = champion?.spells.map((s) => s.name) ?? [];
        for (const choice of q.choices) expect(kit).toContain(choice);
        expect(q.choiceTooltips?.filter(Boolean)).toHaveLength(4);
      } else {
        ownerSeen++;
        expect(q.detail, q.text).toBeTruthy();
        expect(q.imageUrl, q.text).toBeTruthy();
        // The masked description must not name the answer champion.
        expect(q.detail).not.toContain(q.choices[q.answerIndex]);
      }
    }
    expect(slotSeen).toBeGreaterThan(0);
    expect(ownerSeen).toBeGreaterThan(0);
  });

  it("only produces questions of the selected types", () => {
    const questions = buildQuizSet(
      data,
      { lanes: [...DEFAULT_SELECTION.lanes], types: ["item-price"] },
      createRng(42),
    );
    expect(questions).toHaveLength(20);
    for (const q of questions) {
      expect(q.category).toBe("item");
      expect(q.text).toContain("合計価格");
    }
  });

  it("returns no questions when only champion types are selected without lanes over the pool minimum", () => {
    const questions = buildQuizSet(
      data,
      { lanes: [], types: ["title"] },
      createRng(42),
    );
    // Empty lanes fall back to all lanes, so this still works.
    expect(questions).toHaveLength(20);
  });

  const lanes: Position[] = ["TOP", "MIDDLE", "JUNGLE", "BOTTOM", "UTILITY"];
  for (const lane of lanes) {
    it(`restricts champion questions to ${lane} champions`, () => {
      const questions = buildQuizSet(
        data,
        { lanes: [lane], types: ["skill", "title", "champion-image"] },
        createRng(42),
      );
      expect(questions).toHaveLength(20);

      const poolNames = new Set(championPool(data, [lane]).map((c) => c.name));
      const allNames = new Set(data.champions.map((c) => c.name));
      for (const q of questions) {
        expect(q.category).toBe("champion");
        // Any choice that is a champion name must come from the lane pool.
        for (const choice of q.choices) {
          if (allNames.has(choice)) {
            expect(poolNames, `${q.text} -> ${choice}`).toContain(choice);
          }
        }
      }
    });
  }

  it("combines multiple lanes into a single pool", () => {
    const combined = championPool(data, ["TOP", "MIDDLE"]);
    const top = championPool(data, ["TOP"]);
    const mid = championPool(data, ["MIDDLE"]);
    expect(combined.length).toBeGreaterThanOrEqual(
      Math.max(top.length, mid.length),
    );
    expect(new Set(combined.map((c) => c.id)).size).toBe(combined.length);
  });
});
