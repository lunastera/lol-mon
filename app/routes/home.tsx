import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  LANE_LABELS,
  loadQuizData,
  POSITIONS,
  type Position,
  type QuizData,
} from "~/lib/data";
import {
  canPredownload,
  isPredownloaded,
  predownloadImages,
} from "~/lib/imageCache";
import { allImageUrls } from "~/lib/images";
import {
  championPool,
  DEFAULT_SELECTION,
  QUESTION_COUNT,
  QUESTION_TYPES,
  type QuestionTypeId,
} from "~/lib/questions";
import { selectionToSearch } from "~/lib/selection";
import type { Route } from "./+types/home";

export async function clientLoader() {
  return loadQuizData();
}

const CATEGORY_LABELS = {
  champion: "チャンピオン",
  item: "アイテム",
  rune: "ルーン・スペル",
} as const;

const CATEGORIES = ["champion", "item", "rune"] as const;

function CheckOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
        checked
          ? "border-gold bg-gold/10 text-gold-light"
          : "border-gold-dark/50 bg-hextech-black/40 text-gold-light/50"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[#c89b3c]"
      />
      {label}
    </label>
  );
}

function ImagePredownload({ data }: { data: QuizData }) {
  const urls = useMemo(() => allImageUrls(data), [data]);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">(
    () => (isPredownloaded(data.version, urls.length) ? "done" : "idle"),
  );
  const [progress, setProgress] = useState(0);

  if (!canPredownload()) return null;

  const run = async () => {
    setStatus("running");
    setProgress(0);
    try {
      await predownloadImages(urls, data.version, (done) => setProgress(done));
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="mt-6 rounded-xl border border-gold-dark/40 bg-hextech-black/40 p-4 text-sm">
      {status === "done" ? (
        <p className="text-gold-light/70">
          ✓ 画像を端末に保存済みです（v{data.version}
          ）。問題の表示が高速になります。
        </p>
      ) : status === "running" ? (
        <div>
          <p className="mb-2 text-gold-light/70">
            画像をダウンロード中… {progress} / {urls.length}
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-deep-blue">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{ width: `${(progress / urls.length) * 100}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-gold-light/60">
            問題画像・アイコン（{urls.length} 枚・約 15MB）を端末に保存して
            表示を高速化できます
            {status === "error" && (
              <span className="block text-red-400">
                ダウンロードに失敗しました。再度お試しください。
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={run}
            className="rounded-lg border border-gold-dark px-3 py-1.5 text-gold transition-colors hover:border-gold cursor-pointer"
          >
            事前ダウンロード
          </button>
        </div>
      )}
    </section>
  );
}

export default function Home({ loaderData: data }: Route.ComponentProps) {
  const navigate = useNavigate();
  const [lanes, setLanes] = useState<Position[]>([...DEFAULT_SELECTION.lanes]);
  const [types, setTypes] = useState<QuestionTypeId[]>([
    ...DEFAULT_SELECTION.types,
  ]);

  const toggleLane = (lane: Position, on: boolean) =>
    setLanes((prev) => (on ? [...prev, lane] : prev.filter((l) => l !== lane)));
  const toggleType = (type: QuestionTypeId, on: boolean) =>
    setTypes((prev) => (on ? [...prev, type] : prev.filter((t) => t !== type)));

  const hasChampionType = QUESTION_TYPES.some(
    (t) => t.category === "champion" && types.includes(t.id),
  );
  const poolSize = useMemo(
    () => championPool(data, lanes).length,
    [data, lanes],
  );

  let blocker: string | undefined;
  if (types.length === 0) blocker = "出題タイプを1つ以上選んでください";
  else if (hasChampionType && lanes.length === 0)
    blocker = "チャンピオン問題を出題するにはレーンを1つ以上選んでください";

  const start = () => {
    if (blocker) return;
    navigate(`/quiz${selectionToSearch({ lanes, types })}`);
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 py-10">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-black tracking-wide text-gold">LoL検定</h1>
        <p className="mt-3 text-sm leading-relaxed text-gold-light/80">
          League of Legends の知識を試す全{QUESTION_COUNT}問の検定クイズ。
          <br />
          正解数に応じてあなたのランクを判定します。
        </p>
      </header>

      <section className="mb-6">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-bold text-gold/80">
            レーン（チャンピオン問題の出題範囲）
          </h2>
          <button
            type="button"
            className="text-xs text-gold-light/60 underline hover:text-gold"
            onClick={() =>
              setLanes(lanes.length === POSITIONS.length ? [] : [...POSITIONS])
            }
          >
            すべて{lanes.length === POSITIONS.length ? "解除" : "選択"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {POSITIONS.map((lane) => (
            <CheckOption
              key={lane}
              label={LANE_LABELS[lane]}
              checked={lanes.includes(lane)}
              onChange={(on) => toggleLane(lane, on)}
            />
          ))}
        </div>
        {hasChampionType && lanes.length > 0 && (
          <p className="mt-2 text-xs text-gold-light/50">
            {poolSize} 体のチャンピオンから出題します
          </p>
        )}
      </section>

      <section className="mb-8">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-bold text-gold/80">出題タイプ</h2>
          <button
            type="button"
            className="text-xs text-gold-light/60 underline hover:text-gold"
            onClick={() =>
              setTypes(
                types.length === DEFAULT_SELECTION.types.length
                  ? []
                  : [...DEFAULT_SELECTION.types],
              )
            }
          >
            すべて
            {types.length === DEFAULT_SELECTION.types.length ? "解除" : "選択"}
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {CATEGORIES.map((category) => (
            <div key={category}>
              <h3 className="mb-1.5 text-xs text-gold-light/60">
                {CATEGORY_LABELS[category]}
              </h3>
              <div className="flex flex-wrap gap-2">
                {QUESTION_TYPES.filter((t) => t.category === category).map(
                  (t) => (
                    <CheckOption
                      key={t.id}
                      label={t.label}
                      checked={types.includes(t.id)}
                      onChange={(on) => toggleType(t.id, on)}
                    />
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={start}
        disabled={blocker !== undefined}
        className="w-full rounded-lg border border-gold bg-gold/10 px-4 py-3 font-bold text-gold transition-colors hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
      >
        検定を開始する
      </button>
      {blocker && (
        <p className="mt-2 text-center text-xs text-red-400">{blocker}</p>
      )}

      <ImagePredownload data={data} />

      <footer className="mt-auto pt-12 text-center text-xs leading-relaxed text-gold-light/40">
        <p>
          ゲームデータ: Riot Data Dragon v{data.version} / レーン情報: Meraki
          Analytics
        </p>
        <p className="mt-1">
          LoL検定は Riot Games 非公式のファンコンテンツです。League of Legends
          は Riot Games, Inc. の商標です。
        </p>
      </footer>
    </main>
  );
}
