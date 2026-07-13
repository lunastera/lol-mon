import { type Champion, championImageUrl, type QuizData } from "../data";
import { pick } from "../random";
import { buildChoices, type QuestionGenerator } from "./index";

/** Champion icons for choices that are champion names. */
function championIcons(
  data: QuizData,
  choices: string[],
  pool: readonly Champion[],
): (string | undefined)[] {
  return choices.map((name) => {
    const champion = pool.find((c) => c.name === name);
    return champion ? championImageUrl(data, champion) : undefined;
  });
}

/** スキル名からチャンピオンを当てる */
export const skillOwner: QuestionGenerator = ({ data, champions, rng }) => {
  const candidates = champions.filter((c) => c.spells.length > 0);
  if (candidates.length === 0) return undefined;
  const champion = pick(rng, candidates);
  const skill = pick(rng, [champion.passive, ...champion.spells]);
  // Exclude champions sharing the skill name so there is exactly one answer.
  const distractors = champions
    .filter((c) => c.passive !== skill && !c.spells.includes(skill))
    .map((c) => c.name);
  const built = buildChoices(rng, champion.name, distractors);
  if (!built) return undefined;
  return {
    text: `スキル「${skill}」を持つチャンピオンは？`,
    ...built,
    choiceImageUrls: championIcons(data, built.choices, champions),
    category: "champion",
  };
};

/** チャンピオン名から称号を当てる */
export const championTitle: QuestionGenerator = ({ champions, rng }) => {
  const champion = pick(rng, champions);
  const distractors = champions.map((c) => c.title);
  const built = buildChoices(rng, champion.title, distractors);
  if (!built) return undefined;
  return {
    text: `チャンピオン「${champion.name}」の称号は？`,
    ...built,
    category: "champion",
  };
};

/** 称号からチャンピオンを当てる */
export const titleOwner: QuestionGenerator = ({ data, champions, rng }) => {
  const champion = pick(rng, champions);
  const distractors = champions
    .filter((c) => c.title !== champion.title)
    .map((c) => c.name);
  const built = buildChoices(rng, champion.name, distractors);
  if (!built) return undefined;
  return {
    text: `「${champion.title}」という称号を持つチャンピオンは？`,
    ...built,
    choiceImageUrls: championIcons(data, built.choices, champions),
    category: "champion",
  };
};

/** アイコン画像からチャンピオンを当てる */
export const championImage: QuestionGenerator = ({ data, champions, rng }) => {
  const champion = pick(rng, champions);
  const distractors = champions.map((c) => c.name);
  const built = buildChoices(rng, champion.name, distractors);
  if (!built) return undefined;
  return {
    text: "この画像のチャンピオンは？",
    imageUrl: championImageUrl(data, champion),
    ...built,
    category: "champion",
  };
};
