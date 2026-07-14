/**
 * Render the quiz result as a PNG and copy it to the clipboard so it can be
 * pasted straight into Discord etc. Falls back to downloading the file when
 * the browser does not support writing images to the clipboard.
 */
import { type Rank, rankEmblemUrl } from "./rank";

export interface ResultImageParams {
  rank: Rank;
  /** e.g. "14 / 20 問正解" or "13問連続正解" */
  scoreText: string;
  /** e.g. "TOP・MID / エンドレス / ハード" (empty for the default run) */
  conditionText: string;
  /** site URL printed at the bottom */
  url: string;
}

const WIDTH = 800;
const HEIGHT = 420;

// The emblem art is a 1280x720 frame with large transparent margins; this is
// the crest's bounding region (same crop as components/RankBadge.tsx).
const EMBLEM_CROP = { x: 400, y: 162, width: 480, height: 352 };

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function createResultImageBlob(params: ResultImageParams): Promise<Blob> {
  const [emblem] = await Promise.all([
    loadImage(rankEmblemUrl(params.rank)),
    document.fonts.ready,
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");

  const font = (spec: string) => `${spec} "Noto Sans JP", sans-serif`;

  // Background + border
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#0a1428");
  gradient.addColorStop(1, "#010a13");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = "#785a28";
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, WIDTH - 12, HEIGHT - 12);

  // Left: rank emblem (with a subtle glow in the rank color)
  if (emblem) {
    ctx.save();
    ctx.shadowColor = `${params.rank.color}88`;
    ctx.shadowBlur = 40;
    ctx.drawImage(
      emblem,
      EMBLEM_CROP.x,
      EMBLEM_CROP.y,
      EMBLEM_CROP.width,
      EMBLEM_CROP.height,
      50,
      100,
      300,
      220,
    );
    ctx.restore();
  }

  // Header
  ctx.fillStyle = "#c89b3c";
  ctx.font = font("900 30px");
  ctx.fillText("LoLもん", 40, 62);
  ctx.fillStyle = "#f0e6d2";
  ctx.globalAlpha = 0.5;
  ctx.font = font("14px");
  ctx.fillText("— League of Legends 知識クイズ —", 160, 60);
  ctx.globalAlpha = 1;

  // Right: score, rank, conditions
  const textX = emblem ? 390 : 60;
  ctx.fillStyle = "#f0e6d2";
  ctx.font = font("bold 40px");
  ctx.fillText(params.scoreText, textX, 190);

  ctx.fillStyle = params.rank.color;
  ctx.font = font("900 58px");
  ctx.fillText(params.rank.label, textX, 265);

  if (params.conditionText) {
    ctx.fillStyle = "#f0e6d2";
    ctx.globalAlpha = 0.6;
    ctx.font = font("20px");
    ctx.fillText(params.conditionText, textX, 315);
    ctx.globalAlpha = 1;
  }

  // Footer URL
  ctx.fillStyle = "#f0e6d2";
  ctx.globalAlpha = 0.4;
  ctx.font = font("16px");
  ctx.textAlign = "right";
  ctx.fillText(params.url, WIDTH - 30, HEIGHT - 24);
  ctx.textAlign = "left";
  ctx.globalAlpha = 1;

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png",
    );
  });
}

/**
 * Copy the result image to the clipboard; when unsupported, download it
 * instead. Must be called from a user gesture.
 */
export async function copyResultImage(
  params: ResultImageParams,
): Promise<"copied" | "downloaded"> {
  // Safari requires the ClipboardItem to be constructed synchronously within
  // the user gesture, so hand it the pending promise.
  const blobPromise = createResultImageBlob(params);
  try {
    if (typeof ClipboardItem === "undefined") throw new Error("unsupported");
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blobPromise }),
    ]);
    return "copied";
  } catch {
    const blob = await blobPromise;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "lolmon-result.png";
    anchor.click();
    URL.revokeObjectURL(url);
    return "downloaded";
  }
}
