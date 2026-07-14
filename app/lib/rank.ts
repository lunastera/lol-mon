export interface Rank {
  id: string;
  label: string;
  /** minimum correct-answer ratio (inclusive) to reach this rank */
  ratio: number;
  /** accent color used for the rank badge */
  color: string;
  comment: string;
}

/** Ordered from lowest to highest. */
export const RANKS: Rank[] = [
  {
    id: "IRON",
    label: "アイアン",
    ratio: 0,
    color: "#7c7a76",
    comment: "まずはチュートリアルから始めましょう…",
  },
  {
    id: "BRONZE",
    label: "ブロンズ",
    ratio: 0.15,
    color: "#a9704b",
    comment: "サモナーズリフトへようこそ！",
  },
  {
    id: "SILVER",
    label: "シルバー",
    ratio: 0.25,
    color: "#a9b4bd",
    comment: "基礎は身についています。",
  },
  {
    id: "GOLD",
    label: "ゴールド",
    ratio: 0.35,
    color: "#e6c14d",
    comment: "しっかりプレイしていますね！",
  },
  {
    id: "PLATINUM",
    label: "プラチナ",
    ratio: 0.5,
    color: "#4fc7b6",
    comment: "かなりの知識量です。",
  },
  {
    id: "EMERALD",
    label: "エメラルド",
    ratio: 0.65,
    color: "#2f9e6e",
    comment: "上位プレイヤーの風格。",
  },
  {
    id: "DIAMOND",
    label: "ダイヤモンド",
    ratio: 0.75,
    color: "#76c3e8",
    comment: "輝く知識の持ち主！",
  },
  {
    id: "MASTER",
    label: "マスター",
    ratio: 0.85,
    color: "#b665e0",
    comment: "リフトを知り尽くしています。",
  },
  {
    id: "GRANDMASTER",
    label: "グランドマスター",
    ratio: 0.95,
    color: "#e0564d",
    comment: "その知識、プロ級です。",
  },
  {
    id: "CHALLENGER",
    label: "チャレンジャー",
    ratio: 1,
    color: "#f0d060",
    comment: "完璧！あなたこそ真のチャレンジャー！",
  },
];

/**
 * Official ranked emblem art, mirrored by CommunityDragon (the raw CDN is
 * provided for tools to hotlink; nothing is redistributed by this repo).
 */
export function rankEmblemUrl(rank: Rank): string {
  return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-${rank.id.toLowerCase()}.png`;
}

/**
 * Map a score to a rank. A rank is reached when the correct count is at
 * least ceil(ratio * total); for total=20 the thresholds are
 * 0/3/5/7/10/13/15/17/19/20.
 */
export function judgeRank(correct: number, total: number): Rank {
  let result = RANKS[0];
  for (const rank of RANKS) {
    if (correct >= Math.ceil(rank.ratio * total)) result = rank;
  }
  return result;
}
