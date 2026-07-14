import { type Item, itemImageUrl, type QuizData } from "../data";
import { pick } from "../random";
import { buildChoices, type Candidate, type QuestionGenerator } from "./index";

/**
 * Hard-mode pool: every item. Pass withIcons: false when the question shows
 * the answer's image (matching icons in the dropdown would give it away).
 */
function itemCandidates(data: QuizData, withIcons = true): Candidate[] {
  return data.items.map((i) => ({
    name: i.name,
    nameEn: i.nameEn,
    ...(withIcons && { imageUrl: itemImageUrl(data, i) }),
  }));
}

/** Item icons for choices that are item names. */
function itemIcons(
  data: QuizData,
  choices: string[],
  items: readonly Item[],
): (string | undefined)[] {
  return choices.map((name) => {
    const item = items.find((i) => i.name === name);
    return item ? itemImageUrl(data, item) : undefined;
  });
}

/** 価格問題やアイコン問題の対象にする最低価格（初級コンポーネントを除外） */
const MIN_PRICE = 900;

/** アイテムの合計価格を当てる */
export const itemPrice: QuestionGenerator = ({ data, rng }) => {
  const candidates = data.items.filter((i) => i.price >= MIN_PRICE);
  if (candidates.length === 0) return undefined;
  const item = pick(rng, candidates);
  const distractors = candidates
    .filter((i) => i.price !== item.price)
    .map((i) => `${i.price}ゴールド`);
  const built = buildChoices(rng, `${item.price}ゴールド`, distractors);
  if (!built) return undefined;
  return {
    text: `アイテム「${item.name}」の合計価格は？`,
    ...built,
    category: "item",
  };
};

/** アイコン画像からアイテムを当てる */
export const itemImage: QuestionGenerator = ({ data, rng, hard }) => {
  const candidates = data.items.filter((i) => i.price >= MIN_PRICE);
  if (candidates.length === 0) return undefined;
  const item = pick(rng, candidates);
  const distractors = candidates.map((i) => i.name);
  const built = buildChoices(rng, item.name, distractors);
  if (!built) return undefined;
  return {
    text: "この画像のアイテムは？",
    imageUrl: itemImageUrl(data, item),
    ...built,
    ...(hard && { candidates: itemCandidates(data, false) }),
    category: "item",
  };
};

/** ゲーム内の効果表示（能力値・パッシブ）からアイテムを当てる */
export const itemEffect: QuestionGenerator = ({ data, rng, hard }) => {
  // Only items whose in-game description is unique have a single right answer
  // (e.g. jungle companion items share identical text).
  const descriptionCounts = new Map<string, number>();
  for (const i of data.items) {
    descriptionCounts.set(
      i.description,
      (descriptionCounts.get(i.description) ?? 0) + 1,
    );
  }
  const candidates = data.items.filter(
    (i) => i.description !== "" && descriptionCounts.get(i.description) === 1,
  );
  if (candidates.length === 0) return undefined;
  const item = pick(rng, candidates);
  const distractors = candidates
    .filter((i) => i.id !== item.id)
    .map((i) => i.name);
  const built = buildChoices(rng, item.name, distractors);
  if (!built) return undefined;
  return {
    text: "この効果を持つアイテムは？",
    // Passive names can contain the item name — mask it.
    detail: item.description.replaceAll(item.name, "このアイテム"),
    ...built,
    choiceImageUrls: itemIcons(data, built.choices, data.items),
    ...(hard && { candidates: itemCandidates(data) }),
    category: "item",
  };
};
