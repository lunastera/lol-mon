import {
  type Champion,
  championImageUrl,
  championPassiveImageUrl,
  championSpellImageUrl,
  type QuizData,
} from "../data";
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

/** Skill descriptions often name their owner — mask it. */
function maskName(text: string, name: string): string {
  return text.replaceAll(name, "このチャンピオン");
}

/** スキルのアイコン・名前・説明からチャンピオンを当てる */
export const skillOwner: QuestionGenerator = ({ data, champions, rng }) => {
  const candidates = champions.filter((c) => c.spells.length > 0);
  if (candidates.length === 0) return undefined;
  const champion = pick(rng, candidates);
  const skill = pick(rng, [
    {
      name: champion.passive.name,
      description: champion.passive.description,
      imageUrl: championPassiveImageUrl(data, champion.passive),
    },
    ...champion.spells.map((s) => ({
      name: s.name,
      description: s.description,
      imageUrl: championSpellImageUrl(data, s),
    })),
  ]);
  // Exclude champions sharing the skill name so there is exactly one answer.
  const distractors = champions
    .filter(
      (c) =>
        c.passive.name !== skill.name &&
        !c.spells.some((s) => s.name === skill.name),
    )
    .map((c) => c.name);
  const built = buildChoices(rng, champion.name, distractors);
  if (!built) return undefined;
  return {
    text: `スキル「${skill.name}」を持つチャンピオンは？`,
    detail: maskName(skill.description, champion.name),
    imageUrl: skill.imageUrl,
    ...built,
    choiceImageUrls: championIcons(data, built.choices, champions),
    category: "champion",
  };
};

/** チャンピオンの Q/W/E/R からスキルを当てる（選択肢は本人のスキル4つ） */
export const skillSlot: QuestionGenerator = ({ data, champions, rng }) => {
  // Needs 4 uniquely-named spells to make 4 distinct choices.
  const candidates = champions.filter(
    (c) => new Set(c.spells.map((s) => s.name)).size >= 4,
  );
  if (candidates.length === 0) return undefined;
  const champion = pick(rng, candidates);
  const spell = pick(rng, champion.spells);
  const built = buildChoices(
    rng,
    spell.name,
    champion.spells.map((s) => s.name),
  );
  if (!built) return undefined;
  const bySkillName = (name: string) =>
    champion.spells.find((s) => s.name === name);
  return {
    text: `${champion.name} の ${spell.slot} スキルは？`,
    imageUrl: championImageUrl(data, champion),
    ...built,
    choiceImageUrls: built.choices.map((name) => {
      const s = bySkillName(name);
      return s ? championSpellImageUrl(data, s) : undefined;
    }),
    choiceTooltips: built.choices.map((name) => {
      const s = bySkillName(name);
      return s ? maskName(s.description, champion.name) : undefined;
    }),
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
