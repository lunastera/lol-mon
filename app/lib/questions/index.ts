import type { Champion, Position, QuizData } from "../data";
import { POSITIONS } from "../data";
import { pick, type Rng, shuffle } from "../random";
import {
  championImage,
  championTitle,
  skillOwner,
  skillSlot,
  titleOwner,
} from "./champion";
import { itemEffect, itemImage, itemPrice } from "./item";
import { runeStyleOf, summonerByDescription, summonerCooldown } from "./rune";

export type Category = "champion" | "item" | "rune";

export interface Question {
  text: string;
  /** supplementary text shown under the question (e.g. skill description) */
  detail?: string;
  imageUrl?: string;
  choices: string[];
  answerIndex: number;
  /**
   * Icon for each choice, aligned with `choices`. Omitted for questions
   * where an icon would give the answer away (e.g. "この画像は？").
   */
  choiceImageUrls?: (string | undefined)[];
  /** hover tooltip for each choice, aligned with `choices` */
  choiceTooltips?: (string | undefined)[];
  category: Category;
}

export interface GeneratorContext {
  data: QuizData;
  /** champion pool after lane filtering */
  champions: Champion[];
  rng: Rng;
}

/** Returns undefined when the pool cannot produce a valid question. */
export type QuestionGenerator = (ctx: GeneratorContext) => Question | undefined;

export interface QuestionType {
  id: string;
  label: string;
  category: Category;
  generators: QuestionGenerator[];
}

/** Selectable question types, grouped by category for the home screen. */
export const QUESTION_TYPES = [
  {
    id: "skill",
    label: "スキル",
    category: "champion",
    generators: [skillOwner, skillSlot],
  },
  {
    id: "title",
    label: "称号",
    category: "champion",
    generators: [championTitle, titleOwner],
  },
  {
    id: "champion-image",
    label: "チャンピオン画像",
    category: "champion",
    generators: [championImage],
  },
  {
    id: "item-price",
    label: "アイテム価格",
    category: "item",
    generators: [itemPrice],
  },
  {
    id: "item-effect",
    label: "アイテム効果",
    category: "item",
    generators: [itemEffect],
  },
  {
    id: "item-image",
    label: "アイテム画像",
    category: "item",
    generators: [itemImage],
  },
  {
    id: "rune-style",
    label: "ルーン系統",
    category: "rune",
    generators: [runeStyleOf],
  },
  {
    id: "summoner",
    label: "サモナースペル",
    category: "rune",
    generators: [summonerCooldown, summonerByDescription],
  },
] as const satisfies readonly QuestionType[];

export type QuestionTypeId = (typeof QUESTION_TYPES)[number]["id"];

export const QUESTION_TYPE_IDS = QUESTION_TYPES.map((t) => t.id);

export function isQuestionTypeId(value: unknown): value is QuestionTypeId {
  return QUESTION_TYPE_IDS.includes(value as QuestionTypeId);
}

/** What the user picked on the home screen. */
export interface QuizSelection {
  lanes: Position[];
  types: QuestionTypeId[];
}

export const DEFAULT_SELECTION: QuizSelection = {
  lanes: [...POSITIONS],
  types: [...QUESTION_TYPE_IDS],
};

export const QUESTION_COUNT = 20;

/** Minimum champions a lane pool needs to build 4-choice questions safely. */
export const MIN_POOL_SIZE = 8;

/**
 * Build 3 distinct wrong choices and mix in the correct one.
 * Returns undefined when the distractor pool is too small.
 */
export function buildChoices(
  rng: Rng,
  correct: string,
  distractors: readonly string[],
): { choices: string[]; answerIndex: number } | undefined {
  const uniq = [...new Set(distractors)].filter((d) => d !== correct);
  if (uniq.length < 3) return undefined;
  const wrong = shuffle(rng, uniq).slice(0, 3);
  const choices = shuffle(rng, [correct, ...wrong]);
  return { choices, answerIndex: choices.indexOf(correct) };
}

export function championPool(
  data: QuizData,
  lanes: readonly Position[],
): Champion[] {
  // With every lane selected, include champions without lane data too.
  if (lanes.length >= POSITIONS.length) return data.champions;
  return data.champions.filter((c) =>
    c.positions.some((p) => lanes.includes(p)),
  );
}

/**
 * Build a quiz set from the selected lanes and question types. Lanes narrow
 * the champion pool of champion questions; item and rune questions are not
 * tied to a lane.
 */
export function buildQuizSet(
  data: QuizData,
  selection: QuizSelection,
  rng: Rng,
  count = QUESTION_COUNT,
): Question[] {
  const lanes = selection.lanes.length > 0 ? selection.lanes : [...POSITIONS];
  const pool = championPool(data, lanes);
  const types = QUESTION_TYPES.filter(
    (t) =>
      selection.types.includes(t.id) &&
      (t.category !== "champion" || pool.length >= MIN_POOL_SIZE),
  );
  if (types.length === 0) return [];

  const ctx: GeneratorContext = { data, champions: pool, rng };
  const questions: Question[] = [];
  const seen = new Set<string>();
  const maxAttempts = count * 30;
  for (let i = 0; i < maxAttempts && questions.length < count; i++) {
    const type = pick(rng, types);
    const generate = pick(rng, type.generators);
    const q = generate(ctx);
    // Image questions share the same text, so the image is part of identity.
    const key = `${q?.text}|${q?.imageUrl ?? ""}`;
    if (!q || seen.has(key)) continue;
    seen.add(key);
    questions.push(q);
  }
  return questions;
}
