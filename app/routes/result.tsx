import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router";
import { RankBadge } from "~/components/RankBadge";
import { isPosition, LANE_LABELS, POSITIONS, type Position } from "~/lib/data";
import {
  isQuestionCount,
  isQuestionTypeId,
  QUESTION_TYPES,
  type QuestionTypeId,
  type QuizSelection,
} from "~/lib/questions";
import { judgeRank } from "~/lib/rank";
import { copyResultImage } from "~/lib/resultImage";
import { laneLabel, selectionToSearch } from "~/lib/selection";
// X シェアは画像コピーに置き換えて無効化中（再有効化時にコメントを戻す）
// import { buildShareText, buildShareUrl } from "~/lib/share";

/** One answered question, recorded by the quiz screen. */
export interface AnswerRecord {
  text: string;
  /** effect text etc. shown with the question */
  detail?: string;
  imageUrl?: string;
  /** correct answer label (hard mode: 和名 (英名)) */
  answer: string;
  answerImageUrl?: string;
  /** what the user answered */
  given: string;
  correct: boolean;
  skipped?: boolean;
}

interface ResultState extends QuizSelection {
  correct: number;
  total: number;
  records: AnswerRecord[];
}

function isAnswerRecord(value: unknown): value is AnswerRecord {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.text === "string" &&
    typeof r.answer === "string" &&
    typeof r.given === "string" &&
    typeof r.correct === "boolean"
  );
}

function isResultState(state: unknown): state is ResultState {
  if (typeof state !== "object" || state === null) return false;
  const s = state as Record<string, unknown>;
  return (
    Array.isArray(s.lanes) &&
    s.lanes.every(isPosition) &&
    Array.isArray(s.types) &&
    s.types.every(isQuestionTypeId) &&
    (s.count === undefined || isQuestionCount(s.count)) &&
    (s.hard === undefined || typeof s.hard === "boolean") &&
    (s.endless === undefined || typeof s.endless === "boolean") &&
    typeof s.correct === "number" &&
    typeof s.total === "number" &&
    s.total > 0 &&
    Array.isArray(s.records) &&
    s.records.every(isAnswerRecord)
  );
}

const PAGE_SIZE = 10;

/** Collapsed-by-default answer list, paged by 10 questions. */
function AnswerList({ records }: { records: AnswerRecord[] }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(records.length / PAGE_SIZE);
  const pageRecords = records.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <details className="w-full max-w-sm">
      <summary className="cursor-pointer select-none text-sm font-bold text-gold/80 transition-colors hover:text-gold">
        回答一覧を見る
      </summary>
      <ol className="mt-2 divide-y divide-gold-dark/30 rounded-lg border border-gold-dark/40 bg-hextech-black/40">
        {pageRecords.map((r, i) => {
          const number = page * PAGE_SIZE + i + 1;
          return (
            <li key={number} className="px-3 py-2.5 text-xs">
              <div className="flex items-start gap-2">
                <span
                  className={`shrink-0 text-center font-bold ${
                    r.skipped
                      ? "text-gold-light/40"
                      : r.correct
                        ? "text-hextech-blue"
                        : "text-red-400"
                  }`}
                >
                  {r.skipped ? "－" : r.correct ? "✓" : "✗"}
                  <span className="ml-1 font-normal text-gold-light/40">
                    Q{number}
                  </span>
                </span>
                {r.imageUrl && (
                  <img
                    src={r.imageUrl}
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6 shrink-0 rounded border border-gold-dark/40"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-gold-light/85">{r.text}</p>
                  {r.detail && (
                    <p className="mt-0.5 line-clamp-2 whitespace-pre-line text-gold-light/40">
                      {r.detail}
                    </p>
                  )}
                  <p className="mt-1 flex items-center gap-1.5 text-blue-light/90">
                    {r.answerImageUrl && (
                      <img
                        src={r.answerImageUrl}
                        alt=""
                        width={18}
                        height={18}
                        className="h-[18px] w-[18px] rounded border border-gold-dark/40"
                      />
                    )}
                    答え: {r.answer}
                  </p>
                  {!r.correct && !r.skipped && (
                    <p className="mt-0.5 text-red-300/80">回答: {r.given}</p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {pageCount > 1 && (
        <div className="mt-2 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page === 0}
            className="rounded border border-gold-dark px-3 py-1.5 text-gold transition-colors hover:border-gold disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            前の10問
          </button>
          <span className="text-gold-light/60">
            {page + 1} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(p + 1, pageCount - 1))}
            disabled={page >= pageCount - 1}
            className="rounded border border-gold-dark px-3 py-1.5 text-gold transition-colors hover:border-gold disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            次の10問
          </button>
        </div>
      )}
    </details>
  );
}

export default function Result() {
  const { state } = useLocation();
  const [copyStatus, setCopyStatus] = useState<
    "idle" | "working" | "copied" | "downloaded" | "error"
  >("idle");
  if (!isResultState(state)) return <Navigate to="/" replace />;

  const { lanes, types, count, hard, endless, correct, total, records } = state;
  // Endless runs are ranked by streak length on the 20-question scale
  // (a 20+ streak reaches Challenger).
  const rank = endless
    ? judgeRank(Math.min(correct, 20), 20)
    : judgeRank(correct, total);
  const pageUrl = `${window.location.origin}${import.meta.env.BASE_URL}`;
  // X シェアは画像コピーに置き換えて無効化中
  // const shareUrl = buildShareUrl(
  //   buildShareText(lanes, correct, total, rank, hard, endless),
  //   pageUrl,
  // );
  const retrySearch = selectionToSearch({
    lanes: lanes as Position[],
    types: types as QuestionTypeId[],
    count,
    hard,
    endless,
  });

  const laneText =
    lanes.length >= POSITIONS.length
      ? "すべて"
      : POSITIONS.filter((p) => lanes.includes(p))
          .map((p) => LANE_LABELS[p])
          .join("・");
  const typeText =
    types.length >= QUESTION_TYPES.length
      ? "すべて"
      : QUESTION_TYPES.filter((t) => types.includes(t.id))
          .map((t) => t.label)
          .join("・");
  const modeText =
    [endless ? "エンドレス" : "", hard ? "ハード" : ""]
      .filter(Boolean)
      .join("・") || "通常";

  const copyImage = async () => {
    if (copyStatus === "working") return;
    setCopyStatus("working");
    try {
      const result = await copyResultImage({
        rank,
        scoreText: endless
          ? `${correct}問連続正解`
          : `${correct} / ${total} 問正解`,
        conditionText: [
          laneLabel(lanes),
          endless ? "エンドレス" : "",
          hard ? "ハード" : "",
        ]
          .filter(Boolean)
          .join(" / "),
        url: pageUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      });
      setCopyStatus(result);
    } catch {
      setCopyStatus("error");
    }
  };

  const copyLabel = {
    idle: "結果画像をコピー",
    working: "画像を生成中…",
    copied: "✓ コピーしました！Discord 等に貼り付けできます",
    downloaded: "コピー非対応のためダウンロードしました",
    error: "画像の生成に失敗しました",
  }[copyStatus];
  const conditions: [string, string][] = [
    ["レーン", laneText],
    ["出題タイプ", typeText],
    ["出題数", endless ? `エンドレス（${total}問回答）` : `${total}問`],
    ["モード", modeText],
  ];

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center gap-8 px-4 py-12">
      <header className="text-center">
        <h1 className="text-lg font-black text-gold">結果発表</h1>
        <p className="mt-2 text-4xl font-black">
          {correct}
          <span className="text-lg text-gold-light/60">
            {endless ? " 問連続正解" : ` / ${total} 問正解`}
          </span>
        </p>
      </header>

      <RankBadge rank={rank} />

      <dl className="w-full max-w-sm rounded-lg border border-gold-dark/40 bg-hextech-black/40 px-4 py-3 text-xs">
        {conditions.map(([label, value]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-4 py-1"
          >
            <dt className="shrink-0 text-gold-light/50">{label}</dt>
            <dd className="text-right leading-relaxed text-gold-light/85">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {records.length > 0 && <AnswerList records={records} />}

      <div className="flex w-full max-w-sm flex-col gap-3">
        {/* X シェアは画像コピーに置き換えて無効化中
        <a
          href={shareUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-gold px-4 py-3 text-center font-bold text-hextech-black transition-opacity hover:opacity-85"
        >
          𝕏 で結果をシェア
        </a>
        */}
        <button
          type="button"
          onClick={copyImage}
          disabled={copyStatus === "working"}
          className="rounded-lg bg-gold px-4 py-3 text-center font-bold text-hextech-black transition-opacity hover:opacity-85 disabled:opacity-60 cursor-pointer"
        >
          {copyLabel}
        </button>
        <Link
          to={`/quiz${retrySearch}`}
          className="rounded-lg border border-gold px-4 py-3 text-center font-bold text-gold transition-colors hover:bg-gold/10"
        >
          もう一度挑戦する
        </Link>
        <Link
          to="/"
          className="rounded-lg border border-gold-dark/60 px-4 py-3 text-center text-gold-light/80 transition-colors hover:border-gold"
        >
          トップへ戻る
        </Link>
      </div>
    </main>
  );
}
