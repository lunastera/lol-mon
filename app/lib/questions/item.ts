import { type Item, itemImageUrl, type QuizData } from "../data";
import { pick } from "../random";
import { buildChoices, type QuestionGenerator } from "./index";

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
export const itemImage: QuestionGenerator = ({ data, rng }) => {
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
    category: "item",
  };
};

/** 効果テキストからアイテムを当てる */
export const itemEffect: QuestionGenerator = ({ data, rng }) => {
  const candidates = data.items.filter((i) => i.plaintext.trim() !== "");
  if (candidates.length === 0) return undefined;
  const item = pick(rng, candidates);
  const distractors = candidates
    .filter((i) => i.plaintext !== item.plaintext)
    .map((i) => i.name);
  const built = buildChoices(rng, item.name, distractors);
  if (!built) return undefined;
  return {
    text: `「${item.plaintext}」— この効果を持つアイテムは？`,
    ...built,
    choiceImageUrls: itemIcons(data, built.choices, data.items),
    category: "item",
  };
};
