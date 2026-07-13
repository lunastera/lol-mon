import { runeImageUrl, summonerSpellImageUrl } from "../data";
import { pick } from "../random";
import { buildChoices, type QuestionGenerator } from "./index";

/** ルーンが属する系統（覇道・栄華など）を当てる */
export const runeStyleOf: QuestionGenerator = ({ data, rng }) => {
  if (data.runeStyles.length < 4) return undefined;
  const style = pick(rng, data.runeStyles);
  if (style.runes.length === 0) return undefined;
  const rune = pick(rng, style.runes);
  // Rune names are unique across styles, so other style names are all wrong.
  const distractors = data.runeStyles
    .filter((s) => s.name !== style.name)
    .map((s) => s.name);
  const built = buildChoices(rng, style.name, distractors);
  if (!built) return undefined;
  return {
    text: `ルーン「${rune.name}」が属する系統は？`,
    imageUrl: runeImageUrl(rune.icon),
    ...built,
    choiceImageUrls: built.choices.map((name) => {
      const s = data.runeStyles.find((st) => st.name === name);
      return s ? runeImageUrl(s.icon) : undefined;
    }),
    category: "rune",
  };
};

/** サモナースペルのクールダウンを当てる */
export const summonerCooldown: QuestionGenerator = ({ data, rng }) => {
  if (data.summonerSpells.length === 0) return undefined;
  const spell = pick(rng, data.summonerSpells);
  const others = data.summonerSpells
    .filter((s) => s.cooldown !== spell.cooldown)
    .map((s) => s.cooldown);
  // Pad with plausible values in case actual cooldowns overlap too much.
  const padding = [60, 90, 120, 150, 180, 210, 240, 270, 300, 360].filter(
    (c) => c !== spell.cooldown,
  );
  const distractors = [...others, ...padding].map((c) => `${c}秒`);
  const built = buildChoices(rng, `${spell.cooldown}秒`, distractors);
  if (!built) return undefined;
  return {
    text: `サモナースペル「${spell.name}」のクールダウンは？`,
    ...built,
    category: "rune",
  };
};

/** 説明文からサモナースペルを当てる */
export const summonerByDescription: QuestionGenerator = ({ data, rng }) => {
  const candidates = data.summonerSpells.filter(
    (s) => s.description.trim() !== "",
  );
  if (candidates.length === 0) return undefined;
  const spell = pick(rng, candidates);
  const distractors = data.summonerSpells
    .filter((s) => s.name !== spell.name)
    .map((s) => s.name);
  const built = buildChoices(rng, spell.name, distractors);
  if (!built) return undefined;
  return {
    text: `「${spell.description}」— このサモナースペルは？`,
    ...built,
    choiceImageUrls: built.choices.map((name) => {
      const s = data.summonerSpells.find((sp) => sp.name === name);
      return s ? summonerSpellImageUrl(data, s) : undefined;
    }),
    category: "rune",
  };
};
