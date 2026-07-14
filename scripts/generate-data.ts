/**
 * Generate public/data/quiz-data.json from Riot Data Dragon (ja_JP) and
 * Meraki Analytics champion play rates (for lane assignment).
 *
 * Usage: npm run generate-data
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  Champion,
  Item,
  Position,
  QuizData,
  RuneStyle,
  SummonerSpell,
} from "../app/lib/data";
import { POSITIONS, SPELL_SLOTS } from "../app/lib/data";

const DDRAGON = "https://ddragon.leagueoflegends.com";
const MERAKI_RATES =
  "https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/championrates.json";

/** Lanes with a play rate at or above this (in %) are assigned to a champion. */
const PLAY_RATE_THRESHOLD = 0.5;

/** Summoner's Rift map id in Data Dragon item data. */
const MAP_SR = "11";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.json() as Promise<T>;
}

interface DDragonChampionFull {
  data: Record<
    string,
    {
      id: string;
      key: string;
      name: string;
      title: string;
      tags: string[];
      spells: {
        name: string;
        description: string;
        image: { full: string };
      }[];
      passive: {
        name: string;
        description: string;
        image: { full: string };
      };
    }
  >;
}

/** Data Dragon descriptions contain HTML tags (<br>, <font> etc.). */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Convert an item's in-game description
 * (<stats>魔力<attention>30</attention>...<passive>追撃</passive>...)
 * into readable multi-line text: stat lines, then 【パッシブ名】 + effect.
 */
function itemDescriptionText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<(passive|active)>(.*?)<\/\1>/gi, "【$2】")
    .replace(/<attention>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface DDragonItems {
  data: Record<
    string,
    {
      name: string;
      description: string;
      gold: { total: number; purchasable: boolean };
      maps: Record<string, boolean>;
      tags: string[];
      inStore?: boolean;
      requiredChampion?: string;
      requiredAlly?: string;
      hideFromAll?: boolean;
    }
  >;
}

interface DDragonRunes
  extends Array<{
    name: string;
    icon: string;
    slots: {
      runes: { name: string; icon: string; shortDesc: string }[];
    }[];
  }> {}

interface DDragonSummoner {
  data: Record<
    string,
    {
      id: string;
      name: string;
      description: string;
      cooldown: number[];
      modes: string[];
    }
  >;
}

interface MerakiRates {
  data: Record<string, Record<string, { playRate: number }>>;
}

function assignPositions(
  rates: Record<string, { playRate: number }> | undefined,
): Position[] {
  if (!rates) return [];
  const positions = POSITIONS.filter(
    (p) => (rates[p]?.playRate ?? 0) >= PLAY_RATE_THRESHOLD,
  );
  if (positions.length > 0) return positions;
  // Fall back to the single most-played lane so every champion has one.
  const best = POSITIONS.reduce((a, b) =>
    (rates[a]?.playRate ?? 0) >= (rates[b]?.playRate ?? 0) ? a : b,
  );
  return (rates[best]?.playRate ?? 0) > 0 ? [best] : [];
}

async function main() {
  const versions = await fetchJson<string[]>(`${DDRAGON}/api/versions.json`);
  const version = versions[0];
  console.log(`Data Dragon version: ${version}`);

  const base = `${DDRAGON}/cdn/${version}/data/ja_JP`;
  const baseEn = `${DDRAGON}/cdn/${version}/data/en_US`;

  const [
    championFull,
    itemData,
    runeData,
    summonerData,
    merakiRates,
    championEn,
    itemEn,
    runeEn,
    summonerEn,
  ] = await Promise.all([
    fetchJson<DDragonChampionFull>(`${base}/championFull.json`),
    fetchJson<DDragonItems>(`${base}/item.json`),
    fetchJson<DDragonRunes>(`${base}/runesReforged.json`),
    fetchJson<DDragonSummoner>(`${base}/summoner.json`),
    fetchJson<MerakiRates>(MERAKI_RATES),
    fetchJson<DDragonChampionFull>(`${baseEn}/champion.json`),
    fetchJson<DDragonItems>(`${baseEn}/item.json`),
    fetchJson<DDragonRunes>(`${baseEn}/runesReforged.json`),
    fetchJson<DDragonSummoner>(`${baseEn}/summoner.json`),
  ]);

  // English rune names keyed by icon path (locale-independent identifier).
  const runeEnByIcon = new Map<string, string>();
  for (const style of runeEn) {
    for (const slot of style.slots) {
      for (const r of slot.runes) runeEnByIcon.set(r.icon, r.name);
    }
  }

  // Data Dragon normalizes every champion to exactly 4 spells; multi-skill
  // kits (Hwei's subjects, Aphelios' weapon system, form swappers like Jayce)
  // are already folded into Q/W/E/R entries. Warn if a patch breaks this.
  for (const c of Object.values(championFull.data)) {
    if (c.spells.length !== 4) {
      console.warn(
        `${c.id} has ${c.spells.length} spells; only the first 4 get Q/W/E/R slots`,
      );
    }
  }

  const champions: Champion[] = Object.values(championFull.data)
    .map((c) => ({
      id: c.id,
      key: c.key,
      name: c.name,
      nameEn: championEn.data[c.id]?.name ?? c.id,
      title: c.title,
      tags: c.tags,
      positions: assignPositions(merakiRates.data[c.key]),
      spells: c.spells.slice(0, 4).map((s, i) => ({
        slot: SPELL_SLOTS[i],
        name: s.name,
        description: stripHtml(s.description),
        image: s.image.full,
      })),
      passive: {
        name: c.passive.name,
        description: stripHtml(c.passive.description),
        image: c.passive.image.full,
      },
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const noLane = champions.filter((c) => c.positions.length === 0);
  if (noLane.length > 0) {
    console.warn(
      `No lane assigned (excluded from lane quizzes): ${noLane.map((c) => c.id).join(", ")}`,
    );
  }

  // Summoner's Rift, purchasable, generally available items; deduped by name
  // (Data Dragon lists some items multiple times with different ids).
  const seenNames = new Set<string>();
  const items: Item[] = Object.entries(itemData.data)
    .filter(
      ([, i]) =>
        i.maps[MAP_SR] &&
        i.gold.purchasable &&
        i.gold.total > 0 &&
        i.inStore !== false &&
        !i.requiredChampion &&
        !i.requiredAlly &&
        !i.hideFromAll,
    )
    .filter(([, i]) => {
      if (seenNames.has(i.name)) return false;
      seenNames.add(i.name);
      return true;
    })
    .map(([id, i]) => ({
      id,
      name: i.name,
      nameEn: itemEn.data[id]?.name ?? i.name,
      description: itemDescriptionText(i.description),
      price: i.gold.total,
      tags: i.tags,
    }))
    .sort((a, b) => Number(a.id) - Number(b.id));

  const runeStyles: RuneStyle[] = runeData.map((style) => ({
    name: style.name,
    icon: style.icon,
    runes: style.slots.flatMap((slot) =>
      slot.runes.map((r) => ({
        name: r.name,
        nameEn: runeEnByIcon.get(r.icon) ?? r.name,
        icon: r.icon,
        description: stripHtml(r.shortDesc),
      })),
    ),
  }));

  const summonerSpells: SummonerSpell[] = Object.values(summonerData.data)
    .filter((s) => s.modes.includes("CLASSIC"))
    .map((s) => ({
      id: s.id,
      name: s.name,
      nameEn: summonerEn.data[s.id]?.name ?? s.id,
      description: s.description,
      cooldown: s.cooldown[0] ?? 0,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const data: QuizData = {
    version,
    generatedAt: new Date().toISOString(),
    champions,
    items,
    runeStyles,
    summonerSpells,
  };

  const outPath = join(publicDir, "data", "quiz-data.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(data, null, 1));
  console.log(
    `Wrote ${outPath}: ${champions.length} champions, ${items.length} items, ` +
      `${runeStyles.length} rune styles, ${summonerSpells.length} summoner spells`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
